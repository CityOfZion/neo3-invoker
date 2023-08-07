export interface BooleanWitnessCondition {
  type: 'Boolean'
  expression: boolean
}

export interface NotWitnessCondition {
  type: 'Not'
  expression: WitnessCondition
}

export interface AndWitnessCondition {
  type: 'And'
  expressions: WitnessCondition[]
}

export interface OrWitnessCondition {
  type: 'Or'
  expressions: WitnessCondition[]
}

export interface ScriptHashWitnessCondition {
  type: 'ScriptHash'
  // Scripthash
  hash: string
}

export interface GroupWitnessCondition {
  type: 'Group'
  // Public key
  group: string
}

export interface CalledByEntryWitnessCondition {
  type: 'CalledByEntry'
}

export interface CalledByContractWitnessCondition {
  type: 'CalledByContract'
  // Scripthash
  hash: string
}

export interface CalledByGroupWitnessCondition {
  type: 'CalledByGroup'
  // Public key
  group: string
}

export type WitnessCondition =
  | BooleanWitnessCondition
  | AndWitnessCondition
  | NotWitnessCondition
  | OrWitnessCondition
  | ScriptHashWitnessCondition
  | GroupWitnessCondition
  | CalledByEntryWitnessCondition
  | CalledByContractWitnessCondition
  | CalledByGroupWitnessCondition

export interface WitnessRule {
  action: string
  condition: WitnessCondition
}

/**
 * A simple interface that defines the signing options, which privileges the user needs to give for the SmartContract.
 * Usually the default signer is enough: `{ scopes: WitnessScope.CalledByEntry }`
 * But you may need additional authorization, for instance, allow the SmartContract to invoke another specific contract:
 *
 * ```
 * {
 *   scopes: WitnessScope.CustomContracts,
 *   allowedContracts: ['0xf970f4ccecd765b63732b821775dc38c25d74f23']
 * }
 * ```
 *
 */
export type Signer = {
  /**
   * The level of permission the invocation needs
   */
  scopes: string | number
  /**
   * An optional scriptHash to be used to sign, if no account is provided the user selected account will be used
   */
  account?: string
  /**
   * When the scopes is `WitnessScope.CustomContracts`, you need to specify which contracts are allowed
   */
  allowedContracts?: string[]
  /**
   * When the scopes is `WitnessScope.CustomGroups`, you need to specify which groups are allowed
   */
  allowedGroups?: string[]

  rules?: WitnessRule[]
}

export type AnyArgType = { type: 'Any'; value: any }
export type StringArgType = { type: 'String'; value: string }
export type BooleanArgType = { type: 'Boolean'; value: boolean }
export type PublicKeyArgType = { type: 'PublicKey'; value: string }
export type Hash160ArgType = { type: 'Hash160'; value: string }
export type Hash256ArgType = { type: 'Hash256'; value: string }
export type IntegerArgType = { type: 'Integer'; value: string }
export type ArrayArgType = { type: 'Array'; value: Arg[] }
export type MapArgType = { type: 'Map'; value: { key: Arg; value: Arg}[] }
export type ByteArrayArgType = { type: 'ByteArray'; value: string }

export type Arg =
  | AnyArgType
  | StringArgType
  | BooleanArgType
  | PublicKeyArgType
  | Hash160ArgType
  | Hash256ArgType
  | IntegerArgType
  | ArrayArgType
  | MapArgType
  | ByteArrayArgType

/**
 * A simple interface that defines the invocation options
 */
export type ContractInvocation = {
  /**
   * The SmartContract ScriptHash
   */
  scriptHash: string
  /**
   * The SmartContract's method name
   */
  operation: string
  /**
   * The parameters to be sent to the method
   */
  args?: Arg[]
  /**
   * When requesting multiple invocations, you can set `abortOnFail` to true on some invocations so the VM will abort the rest of the calls if this invocation returns `false`
   */
  abortOnFail?: boolean
}

/**
 * A simple interface that defines the MultiInvoke options
 */
export type ContractInvocationMulti = {
  /**
   * the signing options
   */
  signers?: Signer[]
  /**
   * The array of invocations
   */
  invocations: ContractInvocation[]
  /**
   * an optional fee to be added to the calculated system fee
   */
  extraSystemFee?: number
  /**
   * for the cases you need to calculate the system fee by yourself
   */
  systemFeeOverride?: number
  /**
   * an optional fee to be added to the calculated network fee
   */
  extraNetworkFee?: number
  /**
   * for the cases you need to calculate the network fee by yourself
   */
  networkFeeOverride?: number
}

export type ArrayResponseArgType = { type: 'Array'; value: RpcResponseStackItem[] }
export type MapResponseArgType = { type: 'Map'; value: { key: RpcResponseStackItem; value: RpcResponseStackItem}[] }
export type ByteStringArgType = { type: 'ByteString'; value: string }
export type InteropInterfaceArgType = { type: 'InteropInterface'; interface: string; id: string }
export type PointerArgType = { type: 'Pointer'; value: string }
export type BufferArgType = { type: 'Buffer'; value: string }
export type StructArgType = { type: 'Struct'; value: RpcResponseStackItem[] }

export type RpcResponseStackItem = 
  | AnyArgType
  | BooleanArgType
  | IntegerArgType
  | ArrayResponseArgType 
  | MapResponseArgType 
  | ByteStringArgType 
  | InteropInterfaceArgType
  | PointerArgType
  | BufferArgType
  | StructArgType

/**
 * Result from calling invokescript or invokefunction.
 */
export interface InvokeResult<T extends RpcResponseStackItem = RpcResponseStackItem> {
  /** The script that is sent for execution on the blockchain as a base64 string. */
  script: string
  /** State of VM on exit. HALT means a successful exit while FAULT means exit with error. */
  state: 'HALT' | 'FAULT'
  /** Amount of gas consumed up to the point of stopping in the VM. If state is FAULT, this value is not representative of the amount of gas it will consume if it somehow succeeds on the blockchain.
   * This is a decimal value.
   */
  gasconsumed: string
  /** A human-readable string clarifying the exception that occurred. Only available when state is "FAULT". */
  exception: string | null
  stack: T[]
  /** A ready to send transaction that wraps the script.
   * Only available when signers are provided and the sender's private key is open in the RPC node.
   * Formatted in base64-encoding.
   */
  tx?: string
  /** This properties comes when the invoke result is a iterator. You need to call the traverseIterator method to get the real result */
  session?: string
}

/**
 * The entry point for the SmartContract invocation
 */
export interface Neo3Invoker {
  /**
   * Sends an 'invokeFunction' request to the Wallet and it will communicate with the blockchain. It will consume gas and persist data to the blockchain.
   *
   * ```
   * const invocations: ContractInvocation[] = [
   *   {
   *     scriptHash: '0x010101c0775af568185025b0ce43cfaa9b990a2a',
   *     operation: 'getStream',
   *     abortOnFail: true, // if 'getStream' returns false the next invocation will not be made
   *     args: [
   *       { type: 'Integer', value: 17 }
   *     ]
   *   },
   *   {
   *     scriptHash: '0x010101c0775af568185025b0ce43cfaa9b990a2a',
   *     operation: 'transfer',
   *     args: [
   *       { type: 'Address', value: senderAddress },
   *       { type: 'Address', value: 'NbnjKGMBJzJ6j5PHeYhjJDaQ5Vy5UYu4Fv' },
   *       { type: 'Integer', value: 100000000 },
   *       { type: 'Array', value: [] }
   *     ]
   *   }
   * ]
   *
   * const signer: Signer[] = [
   *   {
   *     scopes: WitnessScope.Global
   *   }
   * ]
   *
   * const formattedRequest: ContractInvocationMulti = {
   *   signer,
   *   invocations
   * }
   * const resp = await invokeFunction(formattedRequest)
   * ```
   *
   * @param params the contract invocation options
   * @return the call result promise. It might only contain the transactionId, another call to the blockchain might be necessary to check the result.
   */
  invokeFunction: (cim: ContractInvocationMulti) => Promise<string>

  /**
   * Sends a `testInvoke` request to the Wallet and it will communicate with the blockchain.
   * It will not consume any gas but it will also not persist any data, this is often used to retrieve SmartContract information or check how much gas an invocation will cost.
   * Also, the wallet might choose to not ask the user authorization for test invocations making them easy to use.
   *
   * ```
   * const signers: Signer[] = [
   *   {
   *     scopes: WitnessScope.None
   *   }
   * ]
   *
   * const invocations: ContractInvocation[] = [
   *   {
   *     scriptHash: '0x010101c0775af568185025b0ce43cfaa9b990a2a',
   *     operation: 'getStream',
   *     abortOnFail: true, // if 'getStream' returns false the next invocation will not be made
   *     args: [
   *       { type: 'Integer', value: 17 }
   *         ],
   *   },
   *   {
   *     scriptHash: '0x010101c0775af568185025b0ce43cfaa9b990a2a',
   *     operation: 'balanceOf',
   *     args: [
   *       { type: 'Address', value: senderAddress }
   *     ]
   *   }
   * ]
   *
   * const formattedRequest: ContractInvocationMulti = {
   *   signers,
   *   invocations
   * }
   * const resp = await testInvoke(formattedRequest)
   * ```
   *
   * @param params the contract invocation options
   * @return the call result promise
   */
  testInvoke: (cim: ContractInvocationMulti) => Promise<InvokeResult>

  /**
   * Call the method traverseiterator on the rpc. This method is used to get the result of an iterator.
   * The result is the first count of data traversed in the Iterator, and follow-up requests will continue traversing from count + 1
   * @param sessionId the session id of the iterator
   * @param iteratorId the iterator id
   * @param count the number of items to retrieve
   * @return the call result promise
   */
  traverseIterator: (sessionId: string, iteratorId: string, count: number) => Promise<RpcResponseStackItem[]>
}
