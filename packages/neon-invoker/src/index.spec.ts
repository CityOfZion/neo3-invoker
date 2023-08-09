import { ContractInvocationMulti } from '@cityofzion/neo3-invoker'
import { NeonInvoker, typeChecker } from './index'
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
            { type: 'Integer', value: '100000000' },
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

    const param: ContractInvocationMulti = {
      invocations: [
        {
          scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
          operation: 'transfer',
          args: [
            { type: 'Hash160', value: account.address },
            { type: 'Hash160', value: 'NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr' },
            { type: 'Integer', value: '100000000' },
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
    if (typeChecker.isStackTypeByteString(resp.stack[0])){
      assert.equal(resp.stack[0].value , 'R0FT', 'correct symbol')
    }else{
      assert.fail('stack return is not ByteString')
    }
  })
})


describe('Invoke return type and value tests', function () {

  it('tests integer return', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'negative_number',
          args: [ ]
        },
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'return_same_int',
          args: [ { type: 'Integer', value: '1234'} ]
        },
      ],
    })

    assert.equal(resp.state, 'HALT', 'success')
    if (typeChecker.isStackTypeInteger(resp.stack[0])){
      assert.equal(resp.stack[0].value , '-100')
    }else{
      assert.fail('stack return is not Integer')
    }

    if (typeChecker.isStackTypeInteger(resp.stack[1])){
      assert.equal(resp.stack[1].value , '1234')
    }else{
      assert.fail('stack return is not Integer')
    }
  })

  it('tests boolean return', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'bool_true',
          args: [ ]
        },
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'bool_false',
          args: [ ]
        },
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'return_same_bool',
          args: [ { type: 'Boolean', value: true} ]
        },
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'return_same_bool',
          args: [ { type: 'Boolean', value: false} ]
        },
      ],
    })

    assert.equal(resp.state, 'HALT', 'success')
    if (typeChecker.isStackTypeBoolean(resp.stack[0])){
      assert.equal(resp.stack[0].value , true)
    }else{
      assert.fail('stack return is not Boolean')
    }
    if (typeChecker.isStackTypeBoolean(resp.stack[1])){
      assert.equal(resp.stack[1].value , false)
    }else{
      assert.fail('stack return is not Boolean')
    }
    if (typeChecker.isStackTypeBoolean(resp.stack[2])){
      assert.equal(resp.stack[2].value , true)
    }else{
      assert.fail('stack return is not Boolean')
    }
    if (typeChecker.isStackTypeBoolean(resp.stack[3])){
      assert.equal(resp.stack[3].value , false)
    }else{
      assert.fail('stack return is not Boolean')
    }
  })

  it('tests boolean return', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'bool_true',
          args: [ ]
        },
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'bool_false',
          args: [ ]
        },
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'return_same_bool',
          args: [ { type: 'Boolean', value: true} ]
        },
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'return_same_bool',
          args: [ { type: 'Boolean', value: false} ]
        },
      ],
    })

    assert.equal(resp.state, 'HALT', 'success')
    if (typeChecker.isStackTypeBoolean(resp.stack[0])){
      assert.equal(resp.stack[0].value , true)
    }else{
      assert.fail('stack return is not Boolean')
    }
    if (typeChecker.isStackTypeBoolean(resp.stack[1])){
      assert.equal(resp.stack[1].value , false)
    }else{
      assert.fail('stack return is not Boolean')
    }
    if (typeChecker.isStackTypeBoolean(resp.stack[2])){
      assert.equal(resp.stack[2].value , true)
    }else{
      assert.fail('stack return is not Boolean')
    }
    if (typeChecker.isStackTypeBoolean(resp.stack[3])){
      assert.equal(resp.stack[3].value , false)
    }else{
      assert.fail('stack return is not Boolean')
    }
  })

  it('tests array return', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'positive_numbers',
          args: []
        },
      ],
    })

    assert.equal(resp.state, 'HALT', 'success')
    if (typeChecker.isStackTypeArray(resp.stack[0])){
      assert.deepEqual(resp.stack[0].value , [
        {
          "type": "Integer",
          "value": "1"
        },
        {
            "type": "Integer",
            "value": "20"
        },
        {
            "type": "Integer",
            "value": "100"
        },
        {
            "type": "Integer",
            "value": "123"
        }
      ])
    }else{
      assert.fail('stack return is not Array')
    }
  })

  it('tests bytestring return', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'return_str',
          args: []
        },
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'return_bytes',
          args: []
        },
      ],
    })

    assert.equal(resp.state, 'HALT', 'success')
    if (typeChecker.isStackTypeByteString(resp.stack[0])){
      assert.deepEqual(resp.stack[0].value, 'dGVzdGluZyBzdHJpbmcgcmV0dXJu')
    }else{
      assert.fail('stack return is not ByteString')
    }

    if (typeChecker.isStackTypeByteString(resp.stack[1])){
      assert.deepEqual(resp.stack[1].value, 'dGVzdGluZyBzdHJpbmcgcmV0dXJu')
    }else{
      assert.fail('stack return is not ByteString')
    }
  })

  it('tests array return', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
          operation: 'positive_numbers',
          args: []
        },
      ],
    })

    assert.equal(resp.state, 'HALT', 'success')
    if (typeChecker.isStackTypeArray(resp.stack[0])){
      assert.deepEqual(resp.stack[0].value , [
        {
          "type": "Integer",
          "value": "1"
        },
        {
            "type": "Integer",
            "value": "20"
        },
        {
            "type": "Integer",
            "value": "100"
        },
        {
            "type": "Integer",
            "value": "123"
        }
      ])
    }else{
      assert.fail('stack return is not Array')
    }
  })

  it('tests map return', async () => {
    const invoker = await NeonInvoker.init({
      rpcAddress: NeonInvoker.TESTNET,
    })

    const resp = await invoker.testInvoke({
      invocations: [
        {
          scriptHash: '0x8b43ab0c83b7d12cf35a0e780072bc314a688796',
          operation: 'main',
          args: [ ]
        },
      ],
    })

    assert.equal(resp.state, 'HALT', 'success')
    if (typeChecker.isStackTypeMap(resp.stack[0])){
      assert.deepEqual(resp.stack[0].value, [
        {
          key: {
            type: "ByteString",
            value: "YQ=="
          },
          value: {
            type: "Integer",
            value: "4"
          }
        },
        {
          key: {
            type: "Integer",
            value: "13"
          },
          value: {
            type: "Integer",
            value: "3"
          }
        }
      ])
    } else{
      assert.fail('stack return is not Map')
    }
  })

})
