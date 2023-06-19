import { NeonInvoker } from './index'
import { wallet, tx } from '@cityofzion/neon-core'
import assert from 'assert'
import chai from 'chai'

describe('Neon Tests', function () {
  this.timeout(60000)

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

  it('can calculate fees', async () => {
    const account = new wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014')
    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
      account,
    })

    const { networkFee, systemFee, total } = await invoker.calculateFee({
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

    assert(Number(networkFee) > 0, 'has networkFee')
    assert(Number(systemFee) > 0, 'has systemFee')
    assert(total === Number(networkFee.add(systemFee).toDecimal(8)), 'has totalFee')
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
