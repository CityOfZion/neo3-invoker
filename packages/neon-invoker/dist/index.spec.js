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
                        { type: 'Integer', value: 100000000 },
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
        const { networkFee, systemFee, total } = yield invoker.calculateFee({
            invocations: [
                {
                    scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
                    operation: 'transfer',
                    args: [
                        { type: 'Hash160', value: account.address },
                        { type: 'Hash160', value: 'NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr' },
                        { type: 'Integer', value: 100000000 },
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
        (0, assert_1.default)(Number(networkFee) > 0, 'has networkFee');
        (0, assert_1.default)(Number(systemFee) > 0, 'has systemFee');
        (0, assert_1.default)(total === Number(networkFee.add(systemFee).toDecimal(8)), 'has totalFee');
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
        assert_1.default.equal(resp.stack[0].value, 'R0FT', 'correct symbol');
        return true;
    }));
});
