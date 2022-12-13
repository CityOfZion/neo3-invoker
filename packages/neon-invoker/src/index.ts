import { ContractInvocationMulti, Signer, Neo3Invoker, Arg, InvokeResult } from '@cityofzion/neo3-invoker'
import { tx, u, rpc, sc, experimental } from '@cityofzion/neon-js'
import * as Neon from '@cityofzion/neon-core'
import { wallet } from '@cityofzion/neon-core'
import { CommonConfig } from '@cityofzion/neon-js/lib/experimental/types'

export type RpcConfig = {
  rpcAddress: string
  networkMagic: number
}

export class NeonInvoker implements Neo3Invoker {
  static MAINNET = 'https://mainnet1.neo.coz.io:443'
  static TESTNET = 'https://testnet1.neo.coz.io:443'

  private constructor(public rpcConfig: RpcConfig, public account: wallet.Account | undefined) {
  }

  static async init(rpcAddress: string, account?: wallet.Account): Promise<NeonInvoker> {
    const networkMagic = await this.getMagicOfRpcAddress(rpcAddress)
    return new NeonInvoker({ rpcAddress, networkMagic }, account)
  }

  static async getMagicOfRpcAddress(rpcAddress: string): Promise<number> {
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

  async testInvoke(
    cim: ContractInvocationMulti
  ): Promise<InvokeResult> {
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

  async invokeFunction(cim: ContractInvocationMulti): Promise<string> {
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

    const trx = this.buildTransaction(
      script,
      currentHeight + 100,
      cim.signers
    )

    const config = {
      ...this.rpcConfig,
      account: this.account,
    }

    const systemFeeOverride = await NeonInvoker.overrideSystemFeeOnTransaction(trx, config, cim)

    const networkFeeOverride = await this.overrideNetworkFeeOnTransaction(trx, config, cim)

    await NeonInvoker.addFeesToTransaction(trx, {
      ...config,
      systemFeeOverride,
      networkFeeOverride,
    })

    this.signTransaction(trx)

    return await this.sendTransaction(trx)
  }

  buildTransaction(script: string, validUntilBlock: number, signers: Signer[]) {
    return new tx.Transaction({
      script: u.HexString.fromHex(script),
      validUntilBlock,
      signers: NeonInvoker.buildMultipleSigner(this.account, signers)
    })
  }

  static async overrideSystemFeeOnTransaction(trx: Neon.tx.Transaction, config: CommonConfig, cim: ContractInvocationMulti) {
    const systemFeeOverride = cim.systemFeeOverride
      ? u.BigInteger.fromNumber(cim.systemFeeOverride)
      : cim.extraSystemFee
        ? (await experimental.txHelpers.getSystemFee(trx.script, config, trx.signers)).add(cim.extraSystemFee)
        : undefined
    return systemFeeOverride
  }

  async overrideNetworkFeeOnTransaction(trx: Neon.tx.Transaction, config: CommonConfig, cim: ContractInvocationMulti) {
    const networkFeeOverride = cim.networkFeeOverride
      ? u.BigInteger.fromNumber(cim.networkFeeOverride)
      : cim.extraNetworkFee
        ? (await experimental.txHelpers.calculateNetworkFee(trx, this.account, config)).add(cim.extraNetworkFee)
        : undefined
    return networkFeeOverride
  }

  static async addFeesToTransaction(trx: Neon.tx.Transaction, config: CommonConfig) {
    return await experimental.txHelpers.addFees(trx, config)
  }

  signTransaction(trx: Neon.tx.Transaction) {
    return trx.sign(this.account, this.rpcConfig.networkMagic)
  }

  async sendTransaction(trx: Neon.tx.Transaction) {
    const rpcClient = new rpc.RPCClient(this.rpcConfig.rpcAddress)
    return await rpcClient.sendRawTransaction(trx)
  }

  static convertParams(args: Arg[] | undefined): Neon.sc.ContractParam[] {
    return (args ?? []).map(a => {
      switch (a.type) {
        case 'Any': return sc.ContractParam.any(a.value)
        case 'String': return sc.ContractParam.string(a.value ?? '')
        case 'Boolean': return sc.ContractParam.boolean(a.value ?? false)
        case 'PublicKey': return sc.ContractParam.publicKey(a.value ?? '')
        case 'Address':
        case 'Hash160':
          return sc.ContractParam.hash160(a.value ?? '')
        case 'Hash256': return sc.ContractParam.hash256(a.value ?? '')
        case 'Integer': return sc.ContractParam.integer(a.value ?? '')
        case 'ScriptHash': return sc.ContractParam.hash160(Neon.u.HexString.fromHex(a.value ?? ''))
        case 'Array': return sc.ContractParam.array(...this.convertParams((a.value ?? []) as Arg[]))
        case 'ByteArray': return sc.ContractParam.byteArray(a.value ?? '')
      }
    })
  }

  static buildSigner(defaultAccount: Neon.wallet.Account, signerEntry?: Signer): Neon.tx.Signer {
    let scopes = signerEntry?.scopes ?? 'CalledByEntry'
    if (typeof scopes === 'number') {
      scopes = Neon.tx.toString(scopes)
    }
    return tx.Signer.fromJson({
      scopes,
      account: signerEntry?.account ?? defaultAccount.scriptHash,
      allowedcontracts: signerEntry?.allowedContracts,
      allowedgroups: signerEntry?.allowedGroups,
      rules: signerEntry?.rules
    })
  }

  static buildMultipleSigner(defaultAccount: Neon.wallet.Account, signers: Signer[] | undefined): Neon.tx.Signer[] {
    return !signers?.length ? [this.buildSigner(defaultAccount)] : signers.map(s => this.buildSigner(defaultAccount, s))
  }
}
