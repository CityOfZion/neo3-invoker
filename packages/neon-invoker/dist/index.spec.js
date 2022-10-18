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
const index_1 = require("./index");
const Neon = require("@cityofzion/neon-core");
const assert = require("assert");
describe('Neon Tests', function () {
    it("can transfer", () => __awaiter(this, void 0, void 0, function* () {
        const acc = new Neon.wallet.Account('fb1f57cc1347ae5b6251dc8bae761362d2ecaafec4c87f4dc9e97fef6dd75014');
        const invoker = yield index_1.NeonInvoker.init(index_1.NeonInvoker.TESTNET, acc);
        const txId = yield invoker.invokeFunction({
            invocations: [{
                    scriptHash: '0xd2a4cff31913016155e38e474a2c06d08be276cf',
                    operation: 'transfer',
                    args: [
                        { type: 'Hash160', value: acc.address },
                        { type: 'Hash160', value: 'NhGomBpYnKXArr55nHRQ5rzy79TwKVXZbr' },
                        { type: 'Integer', value: 100000000 },
                        { type: 'Array', value: [] }
                    ]
                }],
            signers: []
        });
        assert(txId.length > 0);
    }));
});
