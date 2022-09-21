import { ContractInvocationMulti, Signer, Neo3Invoker } from '@cityofzion/neo3-invoker';
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
    testInvoke(cim: ContractInvocationMulti): Promise<Neon.rpc.InvokeResult>;
    invokeFunction(cim: ContractInvocationMulti): Promise<string>;
    static convertParams(args: any[]): Neon.sc.ContractParam[];
    static buildSigner(account: Neon.wallet.Account, signerEntry?: Signer): Neon.tx.Signer;
    static buildMultipleSigner(account: Neon.wallet.Account, signers: Signer[]): Neon.tx.Signer[];
}
