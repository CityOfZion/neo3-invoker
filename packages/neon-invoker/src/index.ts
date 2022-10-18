import {ContractInvocationMulti, Signer, Neo3Invoker, Arg} from '@cityofzion/neo3-invoker'
import { tx, u, rpc, sc, experimental } from '@cityofzion/neon-js'
import * as Neon from '@cityofzion/neon-core'
import { wallet } from '@cityofzion/neon-core'

export type RpcConfig = {
  rpcAddress: string
  networkMagic: number
}

export class NeonInvoker implements Neo3Invoker {
  static MAINNET = 'https://mainnet1.neo.coz.io:443'
  static TESTNET = 'https://testnet1.neo.coz.io:443'

  private constructor (public rpcConfig: RpcConfig, public account: wallet.Account | undefined) {
  }

  static async init (rpcAddress: string, account?: wallet.Account): Promise<NeonInvoker> {
    const networkMagic = await this.getMagicOfRpcAddress(rpcAddress)
    return new NeonInvoker({ rpcAddress, networkMagic }, account)
  }

  static async getMagicOfRpcAddress (rpcAddress: string): Promise<number> {
    const resp: any = await new rpc.RPCClient(rpcAddress).execute(
      new rpc.Query({
        method: 'getversion',
        params: [],
        id: 1,
        jsonrpc: '2.0',
      })
    )

    return resp.protocol.network
  }

  async testInvoke (
    cim: ContractInvocationMulti
  ): Promise<Neon.rpc.InvokeResult> {
    const sb = new sc.ScriptBuilder()

    cim.invocations.forEach(c => {
      sb.emitContractCall({
        scriptHash: c.scriptHash,
        operation: c.operation,
        args: NeonInvoker.convertParams(c.args),
      })

      if (c.abortOnFail) {
        sb.emit(0x39)
      }
    })

    const script = sb.build()
    return await new rpc.RPCClient(this.rpcConfig.rpcAddress).invokeScript(
      u.HexString.fromHex(script),
      this.account ? NeonInvoker.buildMultipleSigner(this.account, cim.signers) : undefined
    )
  }

  async invokeFunction (cim: ContractInvocationMulti): Promise<string> {
    const sb = new sc.ScriptBuilder()

    cim.invocations.forEach(c => {
      sb.emitContractCall({
        scriptHash: c.scriptHash,
        operation: c.operation,
        args: NeonInvoker.convertParams(c.args),
      })

      if (c.abortOnFail) {
        sb.emit(0x39)
      }
    })

    const script = sb.build()

    const rpcClient = new rpc.RPCClient(this.rpcConfig.rpcAddress)

    const currentHeight = await rpcClient.getBlockCount()

    const trx = new tx.Transaction({
      script: u.HexString.fromHex(script),
      validUntilBlock: currentHeight + 100,
      signers: NeonInvoker.buildMultipleSigner(this.account, cim.signers),
    })

    const config = {
      ...this.rpcConfig,
      account: this.account,
    }

    const systemFeeOverride = cim.systemFeeOverride
      ? u.BigInteger.fromNumber(cim.systemFeeOverride)
      : cim.extraSystemFee
        ? (await experimental.txHelpers.getSystemFee(trx.script, config, trx.signers)).add(cim.extraSystemFee)
        : undefined

    const networkFeeOverride = cim.networkFeeOverride
      ? u.BigInteger.fromNumber(cim.networkFeeOverride)
      : cim.extraNetworkFee
        ? (await experimental.txHelpers.calculateNetworkFee(trx, this.account, config)).add(cim.extraNetworkFee)
        : undefined

    await experimental.txHelpers.addFees(trx, {
      ...config,
      systemFeeOverride,
      networkFeeOverride,
    })

    trx.sign(this.account, this.rpcConfig.networkMagic)

    return await rpcClient.sendRawTransaction(trx)
  }

  static convertParams (args: Arg[]): Neon.sc.ContractParam[] {
    return args.map(a => {
      if (a.value === undefined) return a

      switch (a.type) {
        case 'Any': return sc.ContractParam.any(a.value)
        case 'String': return sc.ContractParam.string(a.value)
        case 'Boolean': return sc.ContractParam.boolean(a.value)
        case 'PublicKey': return sc.ContractParam.publicKey(a.value)
        case 'Address':
        case 'Hash160':
          return sc.ContractParam.hash160(a.value)
        case 'Hash256': return sc.ContractParam.hash256(a.value)
        case 'Integer': return sc.ContractParam.integer(a.value)
        case 'ScriptHash': return sc.ContractParam.hash160(Neon.u.HexString.fromHex(a.value))
        case 'Array': return sc.ContractParam.array(...this.convertParams(a.value))
        case 'ByteArray': return sc.ContractParam.byteArray(a.value)
        default: return a
      }
    })
  }

  static buildSigner (account: Neon.wallet.Account, signerEntry?: Signer): Neon.tx.Signer {
    const signer = new tx.Signer({
      account: account.scriptHash,
    })

    signer.scopes = signerEntry?.scopes ?? Neon.tx.WitnessScope.CalledByEntry
    if (signerEntry?.allowedContracts) {
      signer.allowedContracts = signerEntry.allowedContracts.map(ac => u.HexString.fromHex(ac))
    }
    if (signerEntry?.allowedGroups) {
      signer.allowedGroups = signerEntry.allowedGroups.map(ac => u.HexString.fromHex(ac))
    }

    return signer
  }

  static buildMultipleSigner (account: Neon.wallet.Account, signers: Signer[]): Neon.tx.Signer[] {
    return !signers?.length ? [this.buildSigner(account)] : signers.map(s => this.buildSigner(account, s))
  }
}
