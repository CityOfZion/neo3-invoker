import { ContractInvocationMulti, Signer, Neo3Invoker, Arg, InvokeResult, StackItemJson } from '@cityofzion/neo3-invoker';
import * as Neon from '@cityofzion/neon-core';
import { CommonConfig } from '@cityofzion/neon-js/lib/experimental/types';
export type RpcConfig = {
    rpcAddress: string;
    networkMagic: number;
};
export type CalculateFee = {
    networkFee: Neon.u.BigInteger;
    systemFee: Neon.u.BigInteger;
    total: number;
};
export declare class NeonInvoker implements Neo3Invoker {
    rpcConfig: RpcConfig;
    account: Neon.wallet.Account | undefined;
    static MAINNET: string;
    static TESTNET: string;
    private constructor();
    static init(rpcAddress: string, account?: Neon.wallet.Account): Promise<NeonInvoker>;
    static getMagicOfRpcAddress(rpcAddress: string): Promise<number>;
    testInvoke(cim: ContractInvocationMulti): Promise<InvokeResult>;
    invokeFunction(cim: ContractInvocationMulti): Promise<string>;
    calculateFee(cim: ContractInvocationMulti): Promise<CalculateFee>;
    traverseIterator(sessionId: string, iteratorId: string, count: number): Promise<StackItemJson[]>;
    buildTransaction(script: string, validUntilBlock: number, signers: Signer[]): Neon.tx.Transaction;
    signTransaction(trx: Neon.tx.Transaction): Neon.tx.Transaction;
    sendTransaction(trx: Neon.tx.Transaction): Promise<string>;
    static buildScriptBuilder(cim: ContractInvocationMulti): string;
    overrideSystemFeeOnTransaction(trx: Neon.tx.Transaction, config: CommonConfig, cim: ContractInvocationMulti): Promise<Neon.u.BigInteger>;
    overrideNetworkFeeOnTransaction(trx: Neon.tx.Transaction, config: CommonConfig, cim: ContractInvocationMulti): Promise<Neon.u.BigInteger>;
    static addFeesToTransaction(trx: Neon.tx.Transaction, config: CommonConfig): Promise<void>;
    static convertParams(args: Arg[] | undefined): Neon.sc.ContractParam[];
    static buildSigner(defaultAccount: Neon.wallet.Account, signerEntry?: Signer): Neon.tx.Signer;
    static buildMultipleSigner(defaultAccount: Neon.wallet.Account, signers: Signer[] | undefined): Neon.tx.Signer[];
}
