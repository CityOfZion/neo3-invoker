import {
  ContractInvocationMulti,
  Signer,
  Neo3Invoker,
  Arg,
  InvokeResult,
  StackItemJson,
  BuiltTransaction,
} from '@cityofzion/neo3-invoker'
import { tx, u, rpc, sc, api, wallet } from '@cityofzion/neon-js'
import * as Neon from '@cityofzion/neon-core'

export type CalculateFee = {
  networkFee: Neon.u.BigInteger
  systemFee: Neon.u.BigInteger
  total: number
}

export type ExtendedArg = Arg | { type: 'Address'; value: string } | { type: 'ScriptHash'; value: string }

export type InitOptions = {
  rpcAddress: string
  account?: Neon.wallet.Account | Neon.wallet.Account[]
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
    const accountArr = NeonInvoker.normalizeArray(this.options.account)
    const script = NeonInvoker.buildScriptHex(cim)

    return await new rpc.RPCClient(this.options.rpcAddress).invokeScript(
        u.HexString.fromHex(script),
        accountArr[0] ? NeonInvoker.buildMultipleSigner(accountArr, cim.signers) : undefined,
    )
  }

  async invokeFunction(cim: ContractInvocationMulti | BuiltTransaction): Promise<string> {
    const trx = await this.cimOrBtToSignedTx(cim)
    console.log(JSON.stringify(trx.toJson()))
    return await this.invokeTx(trx)
  }

  async signTransaction(cim: ContractInvocationMulti | BuiltTransaction): Promise<BuiltTransaction> {
    return NeonInvoker.cimAndTxToBt(cim, await this.cimOrBtToSignedTx(cim))
  }

  private async cimToTx(cim: ContractInvocationMulti): Promise<Neon.tx.Transaction> {
    const accountArr = NeonInvoker.normalizeArray(this.options.account)

    const script = NeonInvoker.buildScriptHex(cim)

    const rpcClient = new rpc.RPCClient(this.options.rpcAddress)
    const currentHeight = await rpcClient.getBlockCount()

    let trx = new tx.Transaction({
      script: u.HexString.fromHex(script),
      validUntilBlock: currentHeight + this.options.validBlocks,
      // TODO: Should I put all the signers? Even the ones that I don't have the private key? Backend and Frontend?
      // signers: NeonInvoker.buildMultipleSigner(accountArr, cim.signers),
    })

    trx.networkFee = await this.getSystemFee(cim)
    trx.systemFee = await this.getNetworkFee(cim)

    return trx
  }

  private async signTx(trx: Neon.tx.Transaction, signers?: Signer[]): Promise<Neon.tx.Transaction> {
    const accountArr = NeonInvoker.normalizeArray(this.options.account)

    // TODO: Can I put some signers on the backend and some on the frontend?
    // const txsignersArr = (trx.signers ? this.normalizeArray(trx.signers) : []) as Neon.tx.Signer[]
    //
    // trx.signers = [...txsignersArr, ...NeonInvoker.buildMultipleSigner(accountArr, signers?.slice(txsignersArr.length))]

    for (const i in accountArr) {
      const account = accountArr[i]
      if (account) {
        if (this.options.signingCallback) {
          trx.addWitness(
              new tx.Witness({
                invocationScript: '',
                verificationScript: wallet.getVerificationScriptFromPublicKey(account.publicKey),
              })
          )

          const facade = await api.NetworkFacade.fromConfig({
            node: this.options.rpcAddress,
          })

          trx = await facade.sign(trx, {
            signingCallback: this.options.signingCallback,
          })
        } else {
          trx.sign(account, this.options.networkMagic)
        }
      }
    }

    return trx
  }

  private async invokeTx(trx: Neon.tx.Transaction): Promise<string> {
    const rpcClient = new rpc.RPCClient(this.options.rpcAddress)
    return await rpcClient.sendRawTransaction(trx)
  }

  private async cimOrBtToSignedTx(cim: ContractInvocationMulti | BuiltTransaction): Promise<Neon.tx.Transaction> {
    let trx: Neon.tx.Transaction
    if (NeonInvoker.isBt(cim)) {
      const bt: BuiltTransaction = cim
      if (u.base642hex(bt.script) !== NeonInvoker.buildScriptHex(bt)) {
        throw new Error('The script in the BuiltTransaction is not the same as the one generated from the ContractInvocationMulti')
      }
      trx = NeonInvoker.btToTx(bt)
    } else {
      trx = await this.cimToTx(cim)
    }
    return await this.signTx(trx, cim.signers)
  }

  private static isBt(cim: ContractInvocationMulti | BuiltTransaction): cim is BuiltTransaction {
    return (<BuiltTransaction>cim).script !== undefined;
  }

  private static btToTx(bt: BuiltTransaction): Neon.tx.Transaction {
    const trx = Object.assign(bt, { sender: '', attributes: [] })
    return tx.Transaction.fromJson(trx as Neon.tx.TransactionJson)
  }

  private static cimAndTxToBt(cim: ContractInvocationMulti, trx: Neon.tx.Transaction): BuiltTransaction {
    return Object.assign(cim, trx.toJson()) as BuiltTransaction
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

    const accountArr = NeonInvoker.normalizeArray(this.options.account)
    const script = NeonInvoker.buildScriptHex(cim)

    const rpcClient = new rpc.RPCClient(this.options.rpcAddress)
    const currentHeight = await rpcClient.getBlockCount()

    const trx = new tx.Transaction({
      script: u.HexString.fromHex(script),
      validUntilBlock: currentHeight + this.options.validBlocks,
      signers: NeonInvoker.buildMultipleSigner(accountArr, cim.signers),
    })

    for (const account of accountArr) {
      if (account) {
        trx.addWitness(
            new tx.Witness({
              invocationScript: '',
              verificationScript: wallet.getVerificationScriptFromPublicKey(account.publicKey),
            })
        )
      }
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

  private static async getMagicOfRpcAddress(rpcAddress: string): Promise<number> {
    const resp = await new rpc.RPCClient(rpcAddress).getVersion()
    return resp.protocol.network
  }

  private static buildScriptHex(cim: ContractInvocationMulti): string {
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

  private static convertParams(args: ExtendedArg[] | undefined): Neon.sc.ContractParam[] {
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

  private static buildSigner(optionsAccount: Neon.wallet.Account | undefined, signerEntry?: Signer): Neon.tx.Signer {
    let scopes = signerEntry?.scopes ?? 'CalledByEntry'
    if (typeof scopes === 'number') {
      scopes = Neon.tx.toString(scopes)
    }

    const account = signerEntry?.account ?? optionsAccount?.scriptHash
    if (!account) throw new Error('You need to provide at least one account to sign.')

    return tx.Signer.fromJson({
      scopes,
      account,
      allowedcontracts: signerEntry?.allowedContracts,
      allowedgroups: signerEntry?.allowedGroups,
      rules: signerEntry?.rules,
    })
  }

  private static buildMultipleSigner(optionAccounts: (Neon.wallet.Account | undefined)[], signers?: Signer[]): Neon.tx.Signer[] {
    if (!signers?.length) {
      return optionAccounts.map((a) => this.buildSigner(a))
    } else if (signers.length === optionAccounts.length) {
      return optionAccounts.map((a, i) => this.buildSigner(a, signers[i]))
    } else {
      throw new Error('You need to provide an account on the constructor for each signer. At least one.')
    }
  }

  private static normalizeArray<T>(objOrArray: T | T[] | undefined): (T | undefined)[] {
    if (Array.isArray(objOrArray)) {
      return objOrArray
    } else {
      return [objOrArray]
    }
  }
}