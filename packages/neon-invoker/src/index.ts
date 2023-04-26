import {
  ContractInvocationMulti,
  Signer,
  Neo3Invoker,
  Arg,
  InvokeResult,
  StackItemJson,
} from '@cityofzion/neo3-invoker'
import { tx, u, rpc, sc, experimental, api } from '@cityofzion/neon-js'
import * as Neon from '@cityofzion/neon-core'
import { CommonConfig } from '@cityofzion/neon-js/lib/experimental/types'
import { ContractParamType } from '@cityofzion/neon-core/lib/sc'

export type RpcConfig = {
  rpcAddress: string
  networkMagic: number
}

export type CalculateFee = {
  networkFee: Neon.u.BigInteger
  systemFee: Neon.u.BigInteger
  total: number
}

export type ExtendedArg = Arg | { type: 'Address'; value: string } | { type: 'ScriptHash'; value: string }

export class NeonInvoker implements Neo3Invoker {
  static MAINNET = 'https://mainnet1.neo.coz.io:443'
  static TESTNET = 'https://testnet1.neo.coz.io:443'

  private constructor(public rpcConfig: RpcConfig, public account: Neon.wallet.Account | undefined) {}

  static async init(rpcAddress: string, account?: Neon.wallet.Account): Promise<NeonInvoker> {
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

  async testInvoke(cim: ContractInvocationMulti): Promise<InvokeResult> {
    const script = NeonInvoker.buildScriptBuilder(cim)

    return await new rpc.RPCClient(this.rpcConfig.rpcAddress).invokeScript(
      u.HexString.fromHex(script),
      this.account ? NeonInvoker.buildMultipleSigner(this.account, cim.signers) : undefined
    )
  }

  async invokeFunction(cim: ContractInvocationMulti): Promise<string> {
    const script = NeonInvoker.buildScriptBuilder(cim)

    const rpcClient = new rpc.RPCClient(this.rpcConfig.rpcAddress)

    const currentHeight = await rpcClient.getBlockCount()

    const trx = this.buildTransaction(script, currentHeight + 100, cim.signers)

    const config = {
      ...this.rpcConfig,
      account: this.account,
    }

    const systemFeeOverride = await this.overrideSystemFeeOnTransaction(trx, config, cim)

    const networkFeeOverride = await this.overrideNetworkFeeOnTransaction(trx, config, cim)

    await NeonInvoker.addFeesToTransaction(trx, {
      ...config,
      systemFeeOverride,
      networkFeeOverride,
    })

    this.signTransaction(trx)

    return await this.sendTransaction(trx)
  }

  async calculateFee(cim: ContractInvocationMulti): Promise<CalculateFee> {
    const script = NeonInvoker.buildScriptBuilder(cim)

    const rpcClient = new rpc.RPCClient(this.rpcConfig.rpcAddress)

    const currentHeight = await rpcClient.getBlockCount()

    const transation = this.buildTransaction(script, currentHeight + 100, cim.signers)

    this.signTransaction(transation)

    const networkFee = await api.smartCalculateNetworkFee(transation, rpcClient)

    const { gasconsumed } = await rpcClient.invokeScript(
      u.HexString.fromHex(script),
      this.account ? NeonInvoker.buildMultipleSigner(this.account, cim.signers) : undefined
    )

    const systemFee = u.BigInteger.fromNumber(gasconsumed)

    return {
      networkFee,
      systemFee,
      total: Number(networkFee.add(systemFee).toDecimal(8)),
    }
  }

  async traverseIterator(sessionId: string, iteratorId: string, count: number): Promise<StackItemJson[]> {
    const result = await new rpc.RPCClient(this.rpcConfig.rpcAddress).traverseIterator(sessionId, iteratorId, count)

    return result.map((item): StackItemJson => ({ value: item.value as any, type: item.type as any }))
  }

  buildTransaction(script: string, validUntilBlock: number, signers: Signer[]) {
    return new tx.Transaction({
      script: u.HexString.fromHex(script),
      validUntilBlock,
      signers: NeonInvoker.buildMultipleSigner(this.account, signers),
    })
  }

  signTransaction(trx: Neon.tx.Transaction) {
    return trx.sign(this.account, this.rpcConfig.networkMagic)
  }

  async sendTransaction(trx: Neon.tx.Transaction) {
    const rpcClient = new rpc.RPCClient(this.rpcConfig.rpcAddress)
    return await rpcClient.sendRawTransaction(trx)
  }

  static buildScriptBuilder(cim: ContractInvocationMulti): string {
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

    return sb.build()
  }

  async overrideSystemFeeOnTransaction(trx: Neon.tx.Transaction, config: CommonConfig, cim: ContractInvocationMulti) {
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

  static convertParams(args: ExtendedArg[] | undefined): Neon.sc.ContractParam[] {
    return (args ?? []).map(a => {
      if (a.type === undefined) throw new Error('Invalid argument type')
      if (a.value === undefined) throw new Error('Invalid argument value')

      switch (a.type) {
        case 'Any':
          return sc.ContractParam.any(a.value)
        case 'String':
          return sc.ContractParam.string(a.value)
        case 'Boolean':
          return sc.ContractParam.boolean(a.value)
        case 'PublicKey':
          return sc.ContractParam.publicKey(a.value)
        case 'ScriptHash':
          return sc.ContractParam.hash160(Neon.u.HexString.fromHex(a.value))
        case 'Address':
        case 'Hash160':
          return sc.ContractParam.hash160(a.value)
        case 'Hash256':
          return sc.ContractParam.hash256(a.value)
        case 'Integer':
          return sc.ContractParam.integer(a.value)
        case 'Array':
          return sc.ContractParam.array(...this.convertParams(a.value))
        case 'ByteArray':
          return sc.ContractParam.byteArray(u.hex2base64(a.value))
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
      rules: signerEntry?.rules,
    })
  }

  static buildMultipleSigner(defaultAccount: Neon.wallet.Account, signers: Signer[] | undefined): Neon.tx.Signer[] {
    return !signers?.length ? [this.buildSigner(defaultAccount)] : signers.map(s => this.buildSigner(defaultAccount, s))
  }
}
