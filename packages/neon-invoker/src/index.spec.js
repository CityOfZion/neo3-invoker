const { NeonInvoker } = require('../dist/index')
const Neon = require('@cityofzion/neon-core')
const assert = require('assert')

describe('Neon Tests', function () {
  this.timeout(60000)

  it("can transfer", async () => {
    const acc = new Neon.wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014')
    const invoker = await NeonInvoker.init(NeonInvoker.TESTNET, acc)

    const txId = await invoker.invokeFunction({
      invocations: [{
        scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
        operation: 'transfer',
        args: [
          { type: 'Hash160', value: acc.address },
          { type: 'Hash160', value: 'NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr' },
          { type: 'Integer', value: 100000000 },
          { type: 'Array', value: [] }
        ]
      }],
      signers: [{
        account: acc.scriptHash,
        scopes: Neon.tx.WitnessScope.CalledByEntry,
        rules: []
      }]
    })

    assert(txId.length > 0, 'has txId')
    return true
  })

  it("check symbol", async () => {
    const invoker = await NeonInvoker.init(NeonInvoker.TESTNET)

    const resp = await invoker.testInvoke({
      invocations: [{
        scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
        operation: 'symbol',
      }]
    })

    assert.equal(resp.state, 'HALT', 'success')
    assert.equal(resp.stack[0].value, 'R0FT', 'correct symbol')
    return true
  })

})
