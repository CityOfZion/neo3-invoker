"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const Neon = __importStar(require("@cityofzion/neon-core"));
class NeonInvoker {
    constructor(options) {
        this.options = options;
    }
    testInvoke(cim) {
        return __awaiter(this, void 0, void 0, function* () {
            const script = NeonInvoker.buildScriptBuilder(cim);
            return yield new neon_js_1.rpc.RPCClient(this.options.rpcAddress).invokeScript(neon_js_1.u.HexString.fromHex(script), this.options.account ? NeonInvoker.buildMultipleSigner(this.options.account, cim.signers) : undefined);
        });
    }
    invokeFunction(cim) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.options.account)
                throw new Error('You need to provide an account to sign the transaction');
            const script = NeonInvoker.buildScriptBuilder(cim);
            const rpcClient = new neon_js_1.rpc.RPCClient(this.options.rpcAddress);
            const currentHeight = yield rpcClient.getBlockCount();
            let trx = new neon_js_1.tx.Transaction({
                script: neon_js_1.u.HexString.fromHex(script),
                validUntilBlock: currentHeight + this.options.validBlocks,
                signers: NeonInvoker.buildMultipleSigner(this.options.account, cim.signers),
            });
            let systemFeeOverride;
            let networkFeeOverride;
            if (cim.systemFeeOverride) {
                systemFeeOverride = neon_js_1.u.BigInteger.fromNumber(cim.systemFeeOverride);
            }
            else {
                const systemFee = yield this.getSystemFee(cim);
                systemFeeOverride = systemFee.add((_a = cim.extraSystemFee) !== null && _a !== void 0 ? _a : 0);
            }
            if (cim.networkFeeOverride) {
                networkFeeOverride = neon_js_1.u.BigInteger.fromNumber(cim.networkFeeOverride);
            }
            else {
                const networkFee = yield this.getNetworkFee(cim);
                networkFeeOverride = networkFee.add((_b = cim.extraNetworkFee) !== null && _b !== void 0 ? _b : 0);
            }
            trx.networkFee = networkFeeOverride;
            trx.systemFee = systemFeeOverride;
            if (this.options.signingCallback) {
                trx.addWitness(new neon_js_1.tx.Witness({
                    invocationScript: '',
                    verificationScript: neon_js_1.wallet.getVerificationScriptFromPublicKey(this.options.account.publicKey),
                }));
                const facade = yield neon_js_1.api.NetworkFacade.fromConfig({
                    node: this.options.rpcAddress,
                });
                trx = yield facade.sign(trx, {
                    signingCallback: this.options.signingCallback,
                });
            }
            else {
                trx.sign(this.options.account, this.options.networkMagic);
            }
            return yield rpcClient.sendRawTransaction(trx);
        });
    }
    calculateFee(cim) {
        return __awaiter(this, void 0, void 0, function* () {
            const networkFee = yield this.getNetworkFee(cim);
            const systemFee = yield this.getSystemFee(cim);
            return {
                networkFee,
                systemFee,
                total: Number(networkFee.add(systemFee).toDecimal(8)),
            };
        });
    }
    getNetworkFee(cim) {
        return __awaiter(this, void 0, void 0, function* () {
            const script = NeonInvoker.buildScriptBuilder(cim);
            const rpcClient = new neon_js_1.rpc.RPCClient(this.options.rpcAddress);
            const currentHeight = yield rpcClient.getBlockCount();
            const trx = new neon_js_1.tx.Transaction({
                script: neon_js_1.u.HexString.fromHex(script),
                validUntilBlock: currentHeight + this.options.validBlocks,
                signers: NeonInvoker.buildMultipleSigner(this.options.account, cim.signers),
            });
            if (this.options.account) {
                trx.sign(this.options.account, this.options.networkMagic);
            }
            const networkFee = yield neon_js_1.api.smartCalculateNetworkFee(trx, rpcClient);
            return networkFee;
        });
    }
    getSystemFee(cim) {
        return __awaiter(this, void 0, void 0, function* () {
            const { gasconsumed } = yield this.testInvoke(cim);
            const systemFee = neon_js_1.u.BigInteger.fromNumber(gasconsumed);
            return systemFee;
        });
    }
    traverseIterator(sessionId, iteratorId, count) {
        return __awaiter(this, void 0, void 0, function* () {
            const rpcClient = new neon_js_1.rpc.RPCClient(this.options.rpcAddress);
            const result = yield rpcClient.traverseIterator(sessionId, iteratorId, count);
            return result.map((item) => ({ value: item.value, type: item.type }));
        });
    }
    static init(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const networkMagic = yield this.getMagicOfRpcAddress(options.rpcAddress);
            return new NeonInvoker(Object.assign(Object.assign({}, options), { validBlocks: 100, networkMagic }));
        });
    }
    static getMagicOfRpcAddress(rpcAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const resp = yield new neon_js_1.rpc.RPCClient(rpcAddress).getVersion();
            return resp.protocol.network;
        });
    }
    static buildScriptBuilder(cim) {
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
        return sb.build();
    }
    static convertParams(args) {
        return (args !== null && args !== void 0 ? args : []).map(a => {
            if (a.type === undefined)
                throw new Error('Invalid argument type');
            if (a.value === undefined)
                throw new Error('Invalid argument value');
            switch (a.type) {
                case 'Any':
                    return neon_js_1.sc.ContractParam.any(a.value);
                case 'String':
                    return neon_js_1.sc.ContractParam.string(a.value);
                case 'Boolean':
                    return neon_js_1.sc.ContractParam.boolean(a.value);
                case 'PublicKey':
                    return neon_js_1.sc.ContractParam.publicKey(a.value);
                case 'ScriptHash':
                    return neon_js_1.sc.ContractParam.hash160(Neon.u.HexString.fromHex(a.value));
                case 'Address':
                case 'Hash160':
                    return neon_js_1.sc.ContractParam.hash160(a.value);
                case 'Hash256':
                    return neon_js_1.sc.ContractParam.hash256(a.value);
                case 'Integer':
                    return neon_js_1.sc.ContractParam.integer(a.value);
                case 'Array':
                    return neon_js_1.sc.ContractParam.array(...this.convertParams(a.value));
                case 'ByteArray':
                    return neon_js_1.sc.ContractParam.byteArray(neon_js_1.u.hex2base64(a.value));
            }
        });
    }
    static buildSigner(defaultAccount, signerEntry) {
        var _a, _b;
        let scopes = (_a = signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.scopes) !== null && _a !== void 0 ? _a : 'CalledByEntry';
        if (typeof scopes === 'number') {
            scopes = Neon.tx.toString(scopes);
        }
        const account = (_b = signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.account) !== null && _b !== void 0 ? _b : defaultAccount === null || defaultAccount === void 0 ? void 0 : defaultAccount.scriptHash;
        if (!account)
            throw new Error('You need to provide an default account or an account for each signer');
        return neon_js_1.tx.Signer.fromJson({
            scopes,
            account,
            allowedcontracts: signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.allowedContracts,
            allowedgroups: signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.allowedGroups,
            rules: signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.rules,
        });
    }
    static buildMultipleSigner(defaultAccount, signers) {
        return !(signers === null || signers === void 0 ? void 0 : signers.length) ? [this.buildSigner(defaultAccount)] : signers.map(s => this.buildSigner(defaultAccount, s));
    }
}
exports.NeonInvoker = NeonInvoker;
NeonInvoker.MAINNET = 'https://mainnet1.neo.coz.io:443';
NeonInvoker.TESTNET = 'https://testnet1.neo.coz.io:443';
