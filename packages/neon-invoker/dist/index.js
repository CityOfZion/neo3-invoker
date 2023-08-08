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
            const accountArr = this.normalizeAccountArray(this.options.account);
            const script = this.buildScriptHex(cim);
            return yield new neon_js_1.rpc.RPCClient(this.options.rpcAddress).invokeScript(neon_js_1.u.HexString.fromHex(script), accountArr[0] ? NeonInvoker.buildMultipleSigner(accountArr, cim.signers) : undefined);
        });
    }
    invokeFunction(cim) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.invokeTx(yield this.cimOrBtToSignedTx(cim));
        });
    }
    signTransaction(cim) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cimAndTxToBt(cim, yield this.cimOrBtToSignedTx(cim));
        });
    }
    cimToTx(cim) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountArr = this.normalizeAccountArray(this.options.account);
            const script = this.buildScriptHex(cim);
            const rpcClient = new neon_js_1.rpc.RPCClient(this.options.rpcAddress);
            const currentHeight = yield rpcClient.getBlockCount();
            let trx = new neon_js_1.tx.Transaction({
                script: neon_js_1.u.HexString.fromHex(script),
                validUntilBlock: currentHeight + this.options.validBlocks,
                signers: NeonInvoker.buildMultipleSigner(accountArr, cim.signers),
            });
            trx.networkFee = yield this.getSystemFee(cim);
            trx.systemFee = yield this.getNetworkFee(cim);
            return trx;
        });
    }
    signTx(trx) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountArr = this.normalizeAccountArray(this.options.account);
            for (const account of accountArr) {
                if (account) {
                    if (this.options.signingCallback) {
                        trx.addWitness(new neon_js_1.tx.Witness({
                            invocationScript: '',
                            verificationScript: neon_js_1.wallet.getVerificationScriptFromPublicKey(account.publicKey),
                        }));
                        const facade = yield neon_js_1.api.NetworkFacade.fromConfig({
                            node: this.options.rpcAddress,
                        });
                        trx = yield facade.sign(trx, {
                            signingCallback: this.options.signingCallback,
                        });
                    }
                    else {
                        trx.sign(account, this.options.networkMagic);
                    }
                }
            }
            return trx;
        });
    }
    invokeTx(trx) {
        return __awaiter(this, void 0, void 0, function* () {
            const rpcClient = new neon_js_1.rpc.RPCClient(this.options.rpcAddress);
            return yield rpcClient.sendRawTransaction(trx);
        });
    }
    cimOrBtToSignedTx(cim) {
        return __awaiter(this, void 0, void 0, function* () {
            let trx;
            if (this.isBt(cim)) {
                const bt = cim;
                if (bt.script !== this.buildScriptHex(bt)) {
                    throw new Error('The script in the BuiltTransaction is not the same as the one generated from the ContractInvocationMulti');
                }
                trx = this.btToTx(bt);
            }
            else {
                trx = yield this.cimToTx(cim);
            }
            return yield this.signTx(trx);
        });
    }
    isBt(cim) {
        return cim.script !== undefined;
    }
    btToTx(signedTransaction) {
        return neon_js_1.tx.Transaction.fromJson(Object.assign(signedTransaction, { sender: '', attributes: [] }));
    }
    cimAndTxToBt(cim, trx) {
        return Object.assign(cim, trx.toJson());
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
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (cim.networkFeeOverride) {
                return neon_js_1.u.BigInteger.fromNumber(cim.networkFeeOverride);
            }
            const accountArr = this.normalizeAccountArray(this.options.account);
            const script = this.buildScriptHex(cim);
            const rpcClient = new neon_js_1.rpc.RPCClient(this.options.rpcAddress);
            const currentHeight = yield rpcClient.getBlockCount();
            const trx = new neon_js_1.tx.Transaction({
                script: neon_js_1.u.HexString.fromHex(script),
                validUntilBlock: currentHeight + this.options.validBlocks,
                signers: NeonInvoker.buildMultipleSigner(accountArr, cim.signers),
            });
            for (const account of accountArr) {
                if (account) {
                    trx.addWitness(new neon_js_1.tx.Witness({
                        invocationScript: '',
                        verificationScript: neon_js_1.wallet.getVerificationScriptFromPublicKey(account.publicKey),
                    }));
                }
            }
            const networkFee = yield neon_js_1.api.smartCalculateNetworkFee(trx, rpcClient);
            return networkFee.add((_a = cim.extraNetworkFee) !== null && _a !== void 0 ? _a : 0);
        });
    }
    getSystemFee(cim) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (cim.systemFeeOverride) {
                return neon_js_1.u.BigInteger.fromNumber(cim.systemFeeOverride);
            }
            const { gasconsumed } = yield this.testInvoke(cim);
            const systemFee = neon_js_1.u.BigInteger.fromNumber(gasconsumed);
            return systemFee.add((_a = cim.extraSystemFee) !== null && _a !== void 0 ? _a : 0);
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
    buildScriptHex(cim) {
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
    static buildSigner(optionsAccount, signerEntry) {
        var _a, _b;
        let scopes = (_a = signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.scopes) !== null && _a !== void 0 ? _a : 'CalledByEntry';
        if (typeof scopes === 'number') {
            scopes = Neon.tx.toString(scopes);
        }
        const account = (_b = signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.account) !== null && _b !== void 0 ? _b : optionsAccount === null || optionsAccount === void 0 ? void 0 : optionsAccount.scriptHash;
        if (!account)
            throw new Error('You need to provide at least one account to sign.');
        return neon_js_1.tx.Signer.fromJson({
            scopes,
            account,
            allowedcontracts: signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.allowedContracts,
            allowedgroups: signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.allowedGroups,
            rules: signerEntry === null || signerEntry === void 0 ? void 0 : signerEntry.rules,
        });
    }
    static buildMultipleSigner(optionAccounts, signers) {
        if (!(signers === null || signers === void 0 ? void 0 : signers.length)) {
            return optionAccounts.map((a) => this.buildSigner(a));
        }
        else if (signers.length === optionAccounts.length) {
            return optionAccounts.map((a, i) => this.buildSigner(a, signers[i]));
        }
        else {
            throw new Error('You need to provide an account on the constructor for each signer. At least one.');
        }
    }
    normalizeAccountArray(acc) {
        if (Array.isArray(acc)) {
            return acc;
        }
        else {
            return [acc];
        }
    }
}
exports.NeonInvoker = NeonInvoker;
NeonInvoker.MAINNET = 'https://mainnet1.neo.coz.io:443';
NeonInvoker.TESTNET = 'https://testnet1.neo.coz.io:443';
