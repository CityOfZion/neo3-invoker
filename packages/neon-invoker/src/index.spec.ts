import { ContractInvocationMulti } from '@cityofzion/neo3-invoker'
import { NeonInvoker } from './index'
import { wallet, tx } from '@cityofzion/neon-core'
import assert from 'assert'
import chai from 'chai'

async function getBalance(invoker: NeonInvoker, address: string) {
  const payerBalanceResp = await invoker.testInvoke({
    invocations: [
      {
        operation: "balanceOf",
        scriptHash: "0xd2a4cff31913016155e38e474a2c06d08be276cf",
        args: [{value: address, type: "Hash160"}]
      }
    ]
  });
  return parseInt(payerBalanceResp.stack[0].value as string) / Math.pow(10, 8)
}

function wait(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

describe('Neon Tests', function () {
  this.timeout(90000)

  it('can transfer', async () => {
    const account = new wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014')
    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
      account,
    })

    const txId = await invoker.invokeFunction({
      invocations: [
        {
          scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
          operation: 'transfer',
          args: [
            { type: 'Hash160', value: account.address },
            { type: 'Hash160', value: 'NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr' },
            { type: 'Integer', value: 100000000 },
            { type: 'Array', value: [] },
          ],
        },
      ],
      signers: [
        {
          account: account.scriptHash,
          scopes: tx.WitnessScope.CalledByEntry,
          rules: [],
        },
      ],
    })

    assert(txId.length > 0, 'has txId')
    return true
  })

  it('can sign and invoke using different NeonInvokers/accounts', async () => {
    const accountPayer = new wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014') // NbnjKGMBJzJ6j5PHeYhjJDaQ5Vy5UYu4Fv
    const accountOwner = new wallet.Account('3bd06d95e9189385851aa581d182f25de34af759cf7f883af57030303ded52b8') // NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr

    const invokerPayer = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
      account: accountPayer,
    })

    const invokerOwner = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
      account: accountOwner,
    })

    const invokerBoth = await NeonInvoker.init({
        rpcAddress: NeonInvoker.TESTNET,
        account: [accountPayer, accountOwner],
    })

    const txIdx = await invokerBoth.invokeFunction({
      invocations: [
        {
          scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
          operation: 'transfer',
          args: [
            { type: 'Hash160', value: accountOwner.address }, // owner is sending to payer but the payer is paying for the tx
            { type: 'Hash160', value: accountPayer.address },
            { type: 'Integer', value: '100000000' },
            { type: 'Array', value: [] },
          ],
        },
      ],
      signers: []
    })

    // await wait(15000)
    //
    // const payerBalance = await getBalance(invokerPayer, accountPayer.address);
    // const ownerBalance = await getBalance(invokerOwner, accountOwner.address);

    const bt = await invokerPayer.signTransaction({
      invocations: [
        {
          scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
          operation: 'transfer',
          args: [
            { type: 'Hash160', value: accountOwner.address }, // owner is sending to payer but the payer is paying for the tx
            { type: 'Hash160', value: accountPayer.address },
            { type: 'Integer', value: '100000000' },
            { type: 'Array', value: [] },
          ],
        },
      ],
      signers: [{
        account: "0xcc776527da4a34b80f411b0ccb9dffddb38523ae",
        scopes: "CalledByEntry"
      }, {
        account: "0x857a247939db5c7cd3a7bb14791280c09e824bea",
        scopes: "CalledByEntry"
      }],
    })

    const txId = await invokerOwner.invokeFunction(bt)

    assert(txId.length > 0, 'has txId')

    // await wait(15000)
    //
    // const payerBalance2 = await getBalance(invokerPayer, accountPayer.address);
    // const ownerBalance2 = await getBalance(invokerOwner, accountOwner.address);
    //
    // console.log(payerBalance, payerBalance2, ownerBalance, ownerBalance2)

    return true
  })

  it('can calculate fees', async () => {
    const account = new wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014')
    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
      account,
    })

    const param: ContractInvocationMulti = {
      invocations: [
        {
          scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
          operation: 'transfer',
          args: [
            { type: 'Hash160', value: account.address },
            { type: 'Hash160', value: 'NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr' },
            { type: 'Integer', value: 100000000 },
            { type: 'Array', value: [] },
          ],
        },
      ],
      signers: [
        {
          account: account.scriptHash,
          scopes: tx.WitnessScope.CalledByEntry,
          rules: [],
        },
      ],
    }

    const { networkFee, systemFee, total } = await invoker.calculateFee(param)

    assert(Number(networkFee) > 0, 'has networkFee')
    assert(Number(systemFee) > 0, 'has systemFee')
    assert(total === Number(networkFee.add(systemFee).toDecimal(8)), 'has totalFee')

    const { networkFee: networkFeeOverridden, systemFee: systemFeeOverridden } = await invoker.calculateFee({
      networkFeeOverride: 20000,
      systemFeeOverride: 10000,
      ...param,
    })

    assert(Number(networkFeeOverridden) === 20000, 'has networkFee overridden')
    assert(Number(systemFeeOverridden) === 10000, 'has systemFee overridden')

    const { networkFee: networkFeeExtra, systemFee: systemFeeExtra } = await invoker.calculateFee({
      extraNetworkFee: 20000,
      extraSystemFee: 10000,
      ...param,
    })

    assert(Number(networkFeeExtra) === Number(networkFee) + 20000, 'has networkFee overridden')
    assert(Number(systemFeeExtra) === Number(systemFee) + 10000, 'has systemFee overridden')
  })

  it('check symbol', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
          operation: 'symbol',
        },
      ],
    })

    assert.equal(resp.state, 'HALT', 'success')
    assert.equal(resp.stack[0].value, 'R0FT', 'correct symbol')
    return true
  })
})
