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
            const trx = this.buildTransaction(script, currentHeight + 100, cim.signers);
            const config = Object.assign(Object.assign({}, this.rpcConfig), { account: this.account });
            const systemFeeOverride = yield NeonInvoker.overrideSystemFeeOnTransaction(trx, config, cim);
            const networkFeeOverride = yield this.overrideNetworkFeeOnTransaction(trx, config, cim);
            yield NeonInvoker.addFeesToTransaction(trx, Object.assign(Object.assign({}, config), { systemFeeOverride,
                networkFeeOverride }));
            this.signTransaction(trx);
            return yield this.sendTransaction(trx);
        });
    }
    buildTransaction(script, validUntilBlock, signers) {
        return new neon_js_1.tx.Transaction({
            script: neon_js_1.u.HexString.fromHex(script),
            validUntilBlock,
            signers: NeonInvoker.buildMultipleSigner(this.account, signers)
        });
    }
    static overrideSystemFeeOnTransaction(trx, config, cim) {
        return __awaiter(this, void 0, void 0, function* () {
            const systemFeeOverride = cim.systemFeeOverride
                ? neon_js_1.u.BigInteger.fromNumber(cim.systemFeeOverride)
                : cim.extraSystemFee
                    ? (yield neon_js_1.experimental.txHelpers.getSystemFee(trx.script, config, trx.signers)).add(cim.extraSystemFee)
                    : undefined;
            return systemFeeOverride;
        });
    }
    overrideNetworkFeeOnTransaction(trx, config, cim) {
        return __awaiter(this, void 0, void 0, function* () {
            const networkFeeOverride = cim.networkFeeOverride
                ? neon_js_1.u.BigInteger.fromNumber(cim.networkFeeOverride)
                : cim.extraNetworkFee
                    ? (yield neon_js_1.experimental.txHelpers.calculateNetworkFee(trx, this.account, config)).add(cim.extraNetworkFee)
                    : undefined;
            return networkFeeOverride;
        });
    }
    static addFeesToTransaction(trx, config) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield neon_js_1.experimental.txHelpers.addFees(trx, config);
        });
    }
    signTransaction(trx) {
        return trx.sign(this.account, this.rpcConfig.networkMagic);
    }
    sendTransaction(trx) {
        return __awaiter(this, void 0, void 0, function* () {
            const rpcClient = new neon_js_1.rpc.RPCClient(this.rpcConfig.rpcAddress);
            return yield rpcClient.sendRawTransaction(trx);
        });
    }
    static convertParams(args) {
        return (args !== null && args !== void 0 ? args : []).map(a => {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            switch (a.type) {
                case 'Any': return neon_js_1.sc.ContractParam.any(a.value);
                case 'String': return neon_js_1.sc.ContractParam.string((_a = a.value) !== null && _a !== void 0 ? _a : '');
                case 'Boolean': return neon_js_1.sc.ContractParam.boolean((_b = a.value) !== null && _b !== void 0 ? _b : false);
                case 'PublicKey': return neon_js_1.sc.ContractParam.publicKey((_c = a.value) !== null && _c !== void 0 ? _c : '');
                case 'Address':
                case 'Hash160':
                    return neon_js_1.sc.ContractParam.hash160((_d = a.value) !== null && _d !== void 0 ? _d : '');
                case 'Hash256': return neon_js_1.sc.ContractParam.hash256((_e = a.value) !== null && _e !== void 0 ? _e : '');
                case 'Integer': return neon_js_1.sc.ContractParam.integer((_f = a.value) !== null && _f !== void 0 ? _f : '');
                case 'ScriptHash': return neon_js_1.sc.ContractParam.hash160(Neon.u.HexString.fromHex((_g = a.value) !== null && _g !== void 0 ? _g : ''));
                case 'Array': return neon_js_1.sc.ContractParam.array(...this.convertParams(((_h = a.value) !== null && _h !== void 0 ? _h : [])));
                case 'ByteArray': return neon_js_1.sc.ContractParam.byteArray((_j = a.value) !== null && _j !== void 0 ? _j : '');
            }
        });
    }
    static buildSigner(defaultAccount, signerEntry) {
        var _a, _b;
        let scopes = (_a = signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.scopes) !== null && _a !== void 0 ? _a : 'CalledByEntry';
        if (typeof scopes === 'number') {
            scopes = Neon.tx.toString(scopes);
        }
        return neon_js_1.tx.Signer.fromJson({
            scopes,
            account: (_b = signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.account) !== null && _b !== void 0 ? _b : defaultAccount.scriptHash,
            allowedcontracts: signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.allowedContracts,
            allowedgroups: signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.allowedGroups,
            rules: signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.rules
        });
    }
    static buildMultipleSigner(defaultAccount, signers) {
        return !(signers === null || signers === void 0 ? void 0 : signers.length) ? [this.buildSigner(defaultAccount)] : signers.map(s => this.buildSigner(defaultAccount, s));
    }
}
exports.NeonInvoker = NeonInvoker;
NeonInvoker.MAINNET = 'https://mainnet1.neo.coz.io:443';
NeonInvoker.TESTNET = 'https://testnet1.neo.coz.io:443';
