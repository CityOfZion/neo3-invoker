import { ContractInvocationMulti, Signer, Neo3Invoker, Arg, InvokeResult } from '@cityofzion/neo3-invoker';
import * as Neon from '@cityofzion/neon-core';
import { wallet } from '@cityofzion/neon-core';
export declare type RpcConfig = {
    rpcAddress: string;
    networkMagic: number;
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
    static convertParams(args: Arg[] | undefined): Neon.sc.ContractParam[];
    static buildSigner(defaultAccount: Neon.wallet.Account, signerEntry?: Signer): Neon.tx.Signer;
    static buildMultipleSigner(defaultAccount: Neon.wallet.Account, signers: Signer[] | undefined): Neon.tx.Signer[];
}
