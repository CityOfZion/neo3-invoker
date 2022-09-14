import { rpc, tx } from '@cityofzion/neon-core'

export type Signer = {
  scopes: tx.WitnessScope
  account?: string
  allowedContracts?: string[]
  allowedGroups?: string[]
}

export type ContractInvocation = {
  scriptHash: string
  operation: string
  args: any[]
  abortOnFail?: boolean
}

export type ContractInvocationMulti = {
  signers: Signer[]
  invocations: ContractInvocation[]
  extraSystemFee?: number
  systemFeeOverride?: number
  extraNetworkFee?: number
  networkFeeOverride?: number
}

export interface Neo3Invoker {
  testInvoke: (cim: ContractInvocationMulti) => Promise<rpc.InvokeResult>
  invokeFunction: (cim: ContractInvocationMulti) => Promise<string>
}
