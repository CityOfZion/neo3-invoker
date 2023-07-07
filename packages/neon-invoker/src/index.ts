import {
  ContractInvocationMulti,
  Signer,
  Neo3Invoker,
  Arg,
  InvokeResult,
  StackItemJson,
} from '@cityofzion/neo3-invoker'
import { tx, u, rpc, sc, api, wallet } from '@cityofzion/neon-js'
import * as Neon from '@cityofzion/neon-core'

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

export type InitOptions = {
  rpcAddress: string
  account?: Neon.wallet.Account
  signingCallback?: api.SigningFunction
}

export type Options = InitOptions & {
  networkMagic: number
  validBlocks: number
}
export class NeonInvoker implements Neo3Invoker {
  static MAINNET = 'https://mainnet1.neo.coz.io:443'
  static TESTNET = 'https://testnet1.neo.coz.io:443'

  private constructor(public options: Options) {}

  async testInvoke(cim: ContractInvocationMulti): Promise<InvokeResult> {
    const script = NeonInvoker.buildScriptBuilder(cim)

    return await new rpc.RPCClient(this.options.rpcAddress).invokeScript(
      u.HexString.fromHex(script),
      this.options.account ? NeonInvoker.buildMultipleSigner(this.options.account, cim.signers) : undefined
    )
  }

  async invokeFunction(cim: ContractInvocationMulti): Promise<string> {
    if (!this.options.account) throw new Error('You need to provide an account to sign the transaction')

    const script = NeonInvoker.buildScriptBuilder(cim)

    const rpcClient = new rpc.RPCClient(this.options.rpcAddress)
    const currentHeight = await rpcClient.getBlockCount()

    let trx = new tx.Transaction({
      script: u.HexString.fromHex(script),
      validUntilBlock: currentHeight + this.options.validBlocks,
      signers: NeonInvoker.buildMultipleSigner(this.options.account, cim.signers),
    })

    const systemFee = await this.getSystemFee(cim)
    const networkFee = await this.getNetworkFee(cim)
    trx.networkFee = networkFee
    trx.systemFee = systemFee

    if (this.options.signingCallback) {
      trx.addWitness(
        new tx.Witness({
          invocationScript: '',
          verificationScript: wallet.getVerificationScriptFromPublicKey(this.options.account.publicKey),
        })
      )

      const facade = await api.NetworkFacade.fromConfig({
        node: this.options.rpcAddress,
      })

      trx = await facade.sign(trx, {
        signingCallback: this.options.signingCallback,
      })
    } else {
      trx.sign(this.options.account, this.options.networkMagic)
    }

    return await rpcClient.sendRawTransaction(trx)
  }

  async calculateFee(cim: ContractInvocationMulti): Promise<CalculateFee> {
    const networkFee = await this.getNetworkFee(cim)
    const systemFee = await this.getSystemFee(cim)

    return {
      networkFee,
      systemFee,
      total: Number(networkFee.add(systemFee).toDecimal(8)),
    }
  }

  async getNetworkFee(cim: ContractInvocationMulti): Promise<Neon.u.BigInteger> {
    if (cim.networkFeeOverride) {
      return u.BigInteger.fromNumber(cim.networkFeeOverride)
    }

    const script = NeonInvoker.buildScriptBuilder(cim)

    const rpcClient = new rpc.RPCClient(this.options.rpcAddress)
    const currentHeight = await rpcClient.getBlockCount()

    const trx = new tx.Transaction({
      script: u.HexString.fromHex(script),
      validUntilBlock: currentHeight + this.options.validBlocks,
      signers: NeonInvoker.buildMultipleSigner(this.options.account, cim.signers),
    })

    if (this.options.account) {
      trx.sign(this.options.account, this.options.networkMagic)
    }

    const networkFee = await api.smartCalculateNetworkFee(trx, rpcClient)

    return networkFee.add(cim.extraNetworkFee ?? 0)
  }

  async getSystemFee(cim: ContractInvocationMulti): Promise<Neon.u.BigInteger> {
    if (cim.systemFeeOverride) {
      return u.BigInteger.fromNumber(cim.systemFeeOverride)
    }

    const { gasconsumed } = await this.testInvoke(cim)
    const systemFee = u.BigInteger.fromNumber(gasconsumed)

    return systemFee.add(cim.extraSystemFee ?? 0)
  }

  async traverseIterator(sessionId: string, iteratorId: string, count: number): Promise<StackItemJson[]> {
    const rpcClient = new rpc.RPCClient(this.options.rpcAddress)
    const result = await rpcClient.traverseIterator(sessionId, iteratorId, count)

    return result.map((item): StackItemJson => ({ value: item.value as any, type: item.type as any }))
  }

  static async init(options: InitOptions): Promise<NeonInvoker> {
    const networkMagic = await this.getMagicOfRpcAddress(options.rpcAddress)
    return new NeonInvoker({ ...options, validBlocks: 100, networkMagic })
  }

  static async getMagicOfRpcAddress(rpcAddress: string): Promise<number> {
    const resp = await new rpc.RPCClient(rpcAddress).getVersion()
    return resp.protocol.network
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

  static buildSigner(defaultAccount?: Neon.wallet.Account, signerEntry?: Signer): Neon.tx.Signer {
    let scopes = signerEntry?.scopes ?? 'CalledByEntry'
    if (typeof scopes === 'number') {
      scopes = Neon.tx.toString(scopes)
    }

    const account = signerEntry?.account ?? defaultAccount?.scriptHash
    if (!account) throw new Error('You need to provide an default account or an account for each signer')

    return tx.Signer.fromJson({
      scopes,
      account,
      allowedcontracts: signerEntry?.allowedContracts,
      allowedgroups: signerEntry?.allowedGroups,
      rules: signerEntry?.rules,
    })
  }

  static buildMultipleSigner(defaultAccount?: Neon.wallet.Account, signers?: Signer[]): Neon.tx.Signer[] {
    return !signers?.length ? [this.buildSigner(defaultAccount)] : signers.map(s => this.buildSigner(defaultAccount, s))
  }
}
