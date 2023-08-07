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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const neon_core_1 = require("@cityofzion/neon-core");
const assert_1 = __importDefault(require("assert"));
describe('Neon Tests', function () {
    this.timeout(60000);
    it('can transfer', () => __awaiter(this, void 0, void 0, function* () {
        const account = new neon_core_1.wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014');
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
            account,
        });
        const txId = yield invoker.invokeFunction({
            invocations: [
                {
                    scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
                    operation: 'transfer',
                    args: [
                        { type: 'Hash160', value: account.address },
                        { type: 'Hash160', value: 'NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr' },
                        { type: 'Integer', value: '100000000' },
                        { type: 'Array', value: [] },
                    ],
                },
            ],
            signers: [
                {
                    account: account.scriptHash,
                    scopes: neon_core_1.tx.WitnessScope.CalledByEntry,
                    rules: [],
                },
            ],
        });
        (0, assert_1.default)(txId.length > 0, 'has txId');
        return true;
    }));
    it('can calculate fees', () => __awaiter(this, void 0, void 0, function* () {
        const account = new neon_core_1.wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014');
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
            account,
        });
        const param = {
            invocations: [
                {
                    scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
                    operation: 'transfer',
                    args: [
                        { type: 'Hash160', value: account.address },
                        { type: 'Hash160', value: 'NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr' },
                        { type: 'Integer', value: '100000000' },
                        { type: 'Array', value: [] },
                    ],
                },
            ],
            signers: [
                {
                    account: account.scriptHash,
                    scopes: neon_core_1.tx.WitnessScope.CalledByEntry,
                    rules: [],
                },
            ],
        };
        const { networkFee, systemFee, total } = yield invoker.calculateFee(param);
        (0, assert_1.default)(Number(networkFee) > 0, 'has networkFee');
        (0, assert_1.default)(Number(systemFee) > 0, 'has systemFee');
        (0, assert_1.default)(total === Number(networkFee.add(systemFee).toDecimal(8)), 'has totalFee');
        const { networkFee: networkFeeOverridden, systemFee: systemFeeOverridden } = yield invoker.calculateFee(Object.assign({ networkFeeOverride: 20000, systemFeeOverride: 10000 }, param));
        (0, assert_1.default)(Number(networkFeeOverridden) === 20000, 'has networkFee overridden');
        (0, assert_1.default)(Number(systemFeeOverridden) === 10000, 'has systemFee overridden');
        const { networkFee: networkFeeExtra, systemFee: systemFeeExtra } = yield invoker.calculateFee(Object.assign({ extraNetworkFee: 20000, extraSystemFee: 10000 }, param));
        (0, assert_1.default)(Number(networkFeeExtra) === Number(networkFee) + 20000, 'has networkFee overridden');
        (0, assert_1.default)(Number(systemFeeExtra) === Number(systemFee) + 10000, 'has systemFee overridden');
    }));
    it('check symbol', () => __awaiter(this, void 0, void 0, function* () {
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
        });
        const resp = yield invoker.testInvoke({
            invocations: [
                {
                    scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
                    operation: 'symbol',
                },
            ],
        });
        assert_1.default.equal(resp.state, 'HALT', 'success');
        if (index_1.typeChecker.isStackTypeByteString(resp.stack[0])) {
            assert_1.default.equal(resp.stack[0].value, 'R0FT', 'correct symbol');
        }
        else {
            assert_1.default.fail('stack return is not ByteString');
        }
    }));
});
describe('Invoke return type and value tests', function () {
    it('tests integer return', () => __awaiter(this, void 0, void 0, function* () {
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
        });
        const resp = yield invoker.testInvoke({
            invocations: [
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'negative_number',
                    args: []
                },
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'return_same_int',
                    args: [{ type: 'Integer', value: '1234' }]
                },
            ],
        });
        assert_1.default.equal(resp.state, 'HALT', 'success');
        if (index_1.typeChecker.isStackTypeInteger(resp.stack[0])) {
            assert_1.default.equal(resp.stack[0].value, '-100');
        }
        else {
            assert_1.default.fail('stack return is not Integer');
        }
        if (index_1.typeChecker.isStackTypeInteger(resp.stack[1])) {
            assert_1.default.equal(resp.stack[1].value, '1234');
        }
        else {
            assert_1.default.fail('stack return is not Integer');
        }
    }));
    it('tests boolean return', () => __awaiter(this, void 0, void 0, function* () {
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
        });
        const resp = yield invoker.testInvoke({
            invocations: [
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'bool_true',
                    args: []
                },
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'bool_false',
                    args: []
                },
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'return_same_bool',
                    args: [{ type: 'Boolean', value: true }]
                },
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'return_same_bool',
                    args: [{ type: 'Boolean', value: false }]
                },
            ],
        });
        assert_1.default.equal(resp.state, 'HALT', 'success');
        if (index_1.typeChecker.isStackTypeBoolean(resp.stack[0])) {
            assert_1.default.equal(resp.stack[0].value, true);
        }
        else {
            assert_1.default.fail('stack return is not Boolean');
        }
        if (index_1.typeChecker.isStackTypeBoolean(resp.stack[1])) {
            assert_1.default.equal(resp.stack[1].value, false);
        }
        else {
            assert_1.default.fail('stack return is not Boolean');
        }
        if (index_1.typeChecker.isStackTypeBoolean(resp.stack[2])) {
            assert_1.default.equal(resp.stack[2].value, true);
        }
        else {
            assert_1.default.fail('stack return is not Boolean');
        }
        if (index_1.typeChecker.isStackTypeBoolean(resp.stack[3])) {
            assert_1.default.equal(resp.stack[3].value, false);
        }
        else {
            assert_1.default.fail('stack return is not Boolean');
        }
    }));
    it('tests boolean return', () => __awaiter(this, void 0, void 0, function* () {
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
        });
        const resp = yield invoker.testInvoke({
            invocations: [
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'bool_true',
                    args: []
                },
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'bool_false',
                    args: []
                },
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'return_same_bool',
                    args: [{ type: 'Boolean', value: true }]
                },
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'return_same_bool',
                    args: [{ type: 'Boolean', value: false }]
                },
            ],
        });
        assert_1.default.equal(resp.state, 'HALT', 'success');
        if (index_1.typeChecker.isStackTypeBoolean(resp.stack[0])) {
            assert_1.default.equal(resp.stack[0].value, true);
        }
        else {
            assert_1.default.fail('stack return is not Boolean');
        }
        if (index_1.typeChecker.isStackTypeBoolean(resp.stack[1])) {
            assert_1.default.equal(resp.stack[1].value, false);
        }
        else {
            assert_1.default.fail('stack return is not Boolean');
        }
        if (index_1.typeChecker.isStackTypeBoolean(resp.stack[2])) {
            assert_1.default.equal(resp.stack[2].value, true);
        }
        else {
            assert_1.default.fail('stack return is not Boolean');
        }
        if (index_1.typeChecker.isStackTypeBoolean(resp.stack[3])) {
            assert_1.default.equal(resp.stack[3].value, false);
        }
        else {
            assert_1.default.fail('stack return is not Boolean');
        }
    }));
    it('tests array return', () => __awaiter(this, void 0, void 0, function* () {
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
        });
        const resp = yield invoker.testInvoke({
            invocations: [
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'positive_numbers',
                    args: []
                },
            ],
        });
        assert_1.default.equal(resp.state, 'HALT', 'success');
        if (index_1.typeChecker.isStackTypeArray(resp.stack[0])) {
            assert_1.default.deepEqual(resp.stack[0].value, [
                {
                    "type": "Integer",
                    "value": "1"
                },
                {
                    "type": "Integer",
                    "value": "20"
                },
                {
                    "type": "Integer",
                    "value": "100"
                },
                {
                    "type": "Integer",
                    "value": "123"
                }
            ]);
        }
        else {
            assert_1.default.fail('stack return is not Array');
        }
    }));
    it('tests bytestring return', () => __awaiter(this, void 0, void 0, function* () {
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
        });
        const resp = yield invoker.testInvoke({
            invocations: [
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'return_str',
                    args: []
                },
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'return_bytes',
                    args: []
                },
            ],
        });
        assert_1.default.equal(resp.state, 'HALT', 'success');
        if (index_1.typeChecker.isStackTypeByteString(resp.stack[0])) {
            assert_1.default.deepEqual(resp.stack[0].value, 'dGVzdGluZyBzdHJpbmcgcmV0dXJu');
        }
        else {
            assert_1.default.fail('stack return is not ByteString');
        }
        if (index_1.typeChecker.isStackTypeByteString(resp.stack[1])) {
            assert_1.default.deepEqual(resp.stack[1].value, 'dGVzdGluZyBzdHJpbmcgcmV0dXJu');
        }
        else {
            assert_1.default.fail('stack return is not ByteString');
        }
    }));
    it('tests array return', () => __awaiter(this, void 0, void 0, function* () {
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
        });
        const resp = yield invoker.testInvoke({
            invocations: [
                {
                    scriptHash: '0x7346e59b3b3516467390a11c390679ab46b37af3',
                    operation: 'positive_numbers',
                    args: []
                },
            ],
        });
        assert_1.default.equal(resp.state, 'HALT', 'success');
        if (index_1.typeChecker.isStackTypeArray(resp.stack[0])) {
            assert_1.default.deepEqual(resp.stack[0].value, [
                {
                    "type": "Integer",
                    "value": "1"
                },
                {
                    "type": "Integer",
                    "value": "20"
                },
                {
                    "type": "Integer",
                    "value": "100"
                },
                {
                    "type": "Integer",
                    "value": "123"
                }
            ]);
        }
        else {
            assert_1.default.fail('stack return is not Array');
        }
    }));
    it('tests map return', () => __awaiter(this, void 0, void 0, function* () {
        const invoker = yield index_1.NeonInvoker.init({
            rpcAddress: index_1.NeonInvoker.TESTNET,
        });
        const resp = yield invoker.testInvoke({
            invocations: [
                {
                    scriptHash: '0x8b43ab0c83b7d12cf35a0e780072bc314a688796',
                    operation: 'main',
                    args: []
                },
            ],
        });
        assert_1.default.equal(resp.state, 'HALT', 'success');
        if (index_1.typeChecker.isStackTypeMap(resp.stack[0])) {
            assert_1.default.deepEqual(resp.stack[0].value, [
                {
                    key: {
                        type: "ByteString",
                        value: "YQ=="
                    },
                    value: {
                        type: "Integer",
                        value: "4"
                    }
                },
                {
                    key: {
                        type: "Integer",
                        value: "13"
                    },
                    value: {
                        type: "Integer",
                        value: "3"
                    }
                }
            ]);
        }
        else {
            assert_1.default.fail('stack return is not Map');
        }
    }));
});
