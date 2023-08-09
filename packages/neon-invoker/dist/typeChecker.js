"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRpcResponseStackItem = exports.isStackTypeStruct = exports.isStackTypeBuffer = exports.isStackTypePointer = exports.isStackTypeInteropInterface = exports.isStackTypeByteString = exports.isStackTypeMap = exports.isStackTypeArray = exports.isStackTypeInteger = exports.isStackTypeBoolean = exports.isStackTypeAny = void 0;
function isStackTypeAny(item) {
    return typeof item === 'object' && item.type === 'Any';
}
exports.isStackTypeAny = isStackTypeAny;
function isStackTypeBoolean(item) {
    return typeof item === 'object' && item.type === 'Boolean' && typeof item.value === 'boolean';
}
exports.isStackTypeBoolean = isStackTypeBoolean;
function isStackTypeInteger(item) {
    return typeof item === 'object' && item.type === 'Integer' && typeof item.value === 'string';
}
exports.isStackTypeInteger = isStackTypeInteger;
function isStackTypeArray(item) {
    return typeof item === 'object' && item.type === 'Array' && Array.isArray(item.value) && item.value.every((i) => isRpcResponseStackItem(i));
}
exports.isStackTypeArray = isStackTypeArray;
function isStackTypeMap(item) {
    return typeof item === 'object' && item.type === 'Map' && Array.isArray(item.value) && item.value.every((i) => isRpcResponseStackItem(i.key) && isRpcResponseStackItem(i.value));
}
exports.isStackTypeMap = isStackTypeMap;
function isStackTypeByteString(item) {
    return typeof item === 'object' && item.type === 'ByteString' && typeof item.value === 'string';
}
exports.isStackTypeByteString = isStackTypeByteString;
function isStackTypeInteropInterface(item) {
    return typeof item === 'object' && item.type === 'InteropInterface' && typeof item.interface === 'string' && typeof item.id === 'string';
}
exports.isStackTypeInteropInterface = isStackTypeInteropInterface;
function isStackTypePointer(item) {
    return typeof item === 'object' && item.type === 'Pointer' && typeof item.value === 'string';
}
exports.isStackTypePointer = isStackTypePointer;
function isStackTypeBuffer(item) {
    return typeof item === 'object' && item.type === 'Buffer' && typeof item.value === 'string';
}
exports.isStackTypeBuffer = isStackTypeBuffer;
function isStackTypeStruct(item) {
    return typeof item === 'object' && item.type === 'Struct' && Array.isArray(item.value) && item.value.every((i) => isRpcResponseStackItem(i));
}
exports.isStackTypeStruct = isStackTypeStruct;
function isRpcResponseStackItem(item) {
    return (isStackTypeAny(item) || isStackTypeBoolean(item) || isStackTypeInteger(item) ||
        isStackTypeArray(item) || isStackTypeMap(item) || isStackTypeByteString(item) ||
        isStackTypeInteropInterface(item) || isStackTypePointer(item) || isStackTypeBuffer(item) ||
        isStackTypeStruct(item));
}
exports.isRpcResponseStackItem = isRpcResponseStackItem;
