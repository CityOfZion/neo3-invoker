import { ContractInvocationMulti, Signer, Neo3Invoker, Arg, InvokeResult, StackItemJson, BuiltTransaction } from '@cityofzion/neo3-invoker';
import { api } from '@cityofzion/neon-js';
import * as Neon from '@cityofzion/neon-core';
export type CalculateFee = {
    networkFee: Neon.u.BigInteger;
    systemFee: Neon.u.BigInteger;
    total: number;
};
export type ExtendedArg = Arg | {
    type: 'Address';
    value: string;
} | {
    type: 'ScriptHash';
    value: string;
};
export type InitOptions = {
    rpcAddress: string;
    account?: Neon.wallet.Account | Neon.wallet.Account[];
    signingCallback?: api.SigningFunction;
};
export type Options = InitOptions & {
    networkMagic: number;
    validBlocks: number;
};
export declare class NeonInvoker implements Neo3Invoker {
    options: Options;
    static MAINNET: string;
    static TESTNET: string;
    private constructor();
    testInvoke(cim: ContractInvocationMulti): Promise<InvokeResult>;
    invokeFunction(cim: ContractInvocationMulti | BuiltTransaction): Promise<string>;
    signTransaction(cim: ContractInvocationMulti | BuiltTransaction): Promise<BuiltTransaction>;
    private cimToTx;
    private signTx;
    private invokeTx;
    private cimOrBtToSignedTx;
    private isBt;
    private btToTx;
    private cimAndTxToBt;
    calculateFee(cim: ContractInvocationMulti): Promise<CalculateFee>;
    getNetworkFee(cim: ContractInvocationMulti): Promise<Neon.u.BigInteger>;
    getSystemFee(cim: ContractInvocationMulti): Promise<Neon.u.BigInteger>;
    traverseIterator(sessionId: string, iteratorId: string, count: number): Promise<StackItemJson[]>;
    static init(options: InitOptions): Promise<NeonInvoker>;
    static getMagicOfRpcAddress(rpcAddress: string): Promise<number>;
    private buildScriptHex;
    static convertParams(args: ExtendedArg[] | undefined): Neon.sc.ContractParam[];
    static buildSigner(optionsAccount: Neon.wallet.Account | undefined, signerEntry?: Signer): Neon.tx.Signer;
    static buildMultipleSigner(optionAccounts: (Neon.wallet.Account | undefined)[], signers?: Signer[]): Neon.tx.Signer[];
    private normalizeAccountArray;
}
