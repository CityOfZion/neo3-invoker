import { ContractInvocationMulti, Signer, Neo3Invoker, Arg, InvokeResult } from '@cityofzion/neo3-invoker';
import Neon, { wallet } from '@cityofzion/neon-core';
import { CommonConfig } from '@cityofzion/neon-js/lib/experimental/types';
export declare type RpcConfig = {
    rpcAddress: string;
    networkMagic: number;
};
export declare type CalculateFee = {
    networkFee: Neon.u.BigInteger;
    systemFee: Neon.u.BigInteger;
    total: number;
};
export declare class NeonInvoker implements Neo3Invoker {
    rpcConfig: RpcConfig;
    account: wallet.Account | undefined;
    static MAINNET: string;
    static TESTNET: string;
    private constructor();
    static init(rpcAddress: string, account?: wallet.Account): Promise<NeonInvoker>;
    static getMagicOfRpcAddress(rpcAddress: string): Promise<number>;
    testInvoke(cim: ContractInvocationMulti): Promise<InvokeResult>;
    invokeFunction(cim: ContractInvocationMulti): Promise<string>;
    calculateFee(cim: ContractInvocationMulti): Promise<CalculateFee>;
    traverseIterator(sessionId: string, iteratorId: string, count: number): Promise<Neon.sc.StackItem[]>;
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
