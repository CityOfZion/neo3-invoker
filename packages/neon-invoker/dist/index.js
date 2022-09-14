"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeonInvoker = void 0;
const neon_js_1 = require("@cityofzion/neon-js");
const Neon = require("@cityofzion/neon-core");
class NeonInvoker {
    constructor(rpcConfig, account) {
        this.rpcConfig = rpcConfig;
        this.account = account;
    }
    static init(rpcAddress, account) {
        return __awaiter(this, void 0, void 0, function* () {
            const networkMagic = yield this.getMagicOfRpcAddress(rpcAddress);
            return new NeonInvoker({ rpcAddress, networkMagic }, account);
        });
    }
    static getMagicOfRpcAddress(rpcAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield new neon_js_1.rpc.RPCClient(rpcAddress).execute(new neon_js_1.rpc.Query({
                method: 'getversion',
                params: [],
                id: 1,
                jsonrpc: '2.0',
            }));
            return resp.protocol.network;
        });
    }
    testInvoke(cim) {
        return __awaiter(this, void 0, void 0, function* () {
            const sb = new neon_js_1.sc.ScriptBuilder();
            cim.invocations.forEach(c => {
                sb.emitContractCall({
                    scriptHash: c.scriptHash,
                    operation: c.operation,
                    args: NeonInvoker.convertParams(c.args),
                });
                if (c.abortOnFail) {
                    sb.emit(0x39);
                }
            });
            const script = sb.build();
            return yield new neon_js_1.rpc.RPCClient(this.rpcConfig.rpcAddress).invokeScript(neon_js_1.u.HexString.fromHex(script), this.account ? NeonInvoker.buildMultipleSigner(this.account, cim.signers) : undefined);
        });
    }
    invokeFunction(cim) {
        return __awaiter(this, void 0, void 0, function* () {
            const sb = new neon_js_1.sc.ScriptBuilder();
            cim.invocations.forEach(c => {
                sb.emitContractCall({
                    scriptHash: c.scriptHash,
                    operation: c.operation,
                    args: NeonInvoker.convertParams(c.args),
                });
                if (c.abortOnFail) {
                    sb.emit(0x39);
                }
            });
            const script = sb.build();
            const rpcClient = new neon_js_1.rpc.RPCClient(this.rpcConfig.rpcAddress);
            const currentHeight = yield rpcClient.getBlockCount();
            const trx = new neon_js_1.tx.Transaction({
                script: neon_js_1.u.HexString.fromHex(script),
                validUntilBlock: currentHeight + 100,
                signers: NeonInvoker.buildMultipleSigner(this.account, cim.signers),
            });
            const config = Object.assign(Object.assign({}, this.rpcConfig), { account: this.account });
            const systemFeeOverride = cim.systemFeeOverride
                ? neon_js_1.u.BigInteger.fromNumber(cim.systemFeeOverride)
                : cim.extraSystemFee
                    ? (yield neon_js_1.experimental.txHelpers.getSystemFee(trx.script, config, trx.signers)).add(cim.extraSystemFee)
                    : undefined;
            const networkFeeOverride = cim.networkFeeOverride
                ? neon_js_1.u.BigInteger.fromNumber(cim.networkFeeOverride)
                : cim.extraNetworkFee
                    ? (yield neon_js_1.experimental.txHelpers.calculateNetworkFee(trx, this.account, config)).add(cim.extraNetworkFee)
                    : undefined;
            yield neon_js_1.experimental.txHelpers.addFees(trx, Object.assign(Object.assign({}, config), { systemFeeOverride,
                networkFeeOverride }));
            trx.sign(this.account, this.rpcConfig.networkMagic);
            return yield rpcClient.sendRawTransaction(trx);
        });
    }
    static convertParams(args) {
        return args.map(a => {
            if (a.value === undefined)
                return a;
            switch (a.type) {
                case 'Any':
                    return neon_js_1.sc.ContractParam.any(a.value);
                case 'String':
                    return neon_js_1.sc.ContractParam.string(a.value);
                case 'Boolean':
                    return neon_js_1.sc.ContractParam.boolean(a.value);
                case 'PublicKey':
                    return neon_js_1.sc.ContractParam.publicKey(a.value);
                case 'Hash160':
                    return neon_js_1.sc.ContractParam.hash160(a.value);
                case 'Hash256':
                    return neon_js_1.sc.ContractParam.hash256(a.value);
                case 'Integer':
                    return neon_js_1.sc.ContractParam.integer(a.value);
                case 'Array':
                    return neon_js_1.sc.ContractParam.array(...this.convertParams(a.value));
                case 'ByteArray':
                    return neon_js_1.sc.ContractParam.byteArray(a.value);
                default:
                    return a;
            }
        });
    }
    static buildSigner(account, signerEntry) {
        var _a;
        const signer = new neon_js_1.tx.Signer({
            account: account.scriptHash,
        });
        signer.scopes = (_a = signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.scopes) !== null && _a !== void 0 ? _a : Neon.tx.WitnessScope.CalledByEntry;
        if (signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.allowedContracts) {
            signer.allowedContracts = signerEntry.allowedContracts.map(ac => neon_js_1.u.HexString.fromHex(ac));
        }
        if (signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.allowedGroups) {
            signer.allowedGroups = signerEntry.allowedGroups.map(ac => neon_js_1.u.HexString.fromHex(ac));
        }
        return signer;
    }
    static buildMultipleSigner(account, signers) {
        return !(signers === null || signers === void 0 ? void 0 : signers.length) ? [this.buildSigner(account)] : signers.map(s => this.buildSigner(account, s));
    }
}
exports.NeonInvoker = NeonInvoker;
