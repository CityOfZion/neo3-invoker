import { AnyArgType,
  BooleanArgType,
  IntegerArgType,
  ArrayResponseArgType,
  MapResponseArgType,
  ByteStringArgType,
  InteropInterfaceArgType,
  PointerArgType,
  BufferArgType,
  StructArgType,
  RpcResponseStackItem
} from "@cityofzion/neo3-invoker"

export function isStackTypeAny(item: any): item is AnyArgType{
  return typeof item === 'object' && item.type === 'Any'
}
export function isStackTypeBoolean(item: any): item is BooleanArgType{
  return typeof item === 'object' && item.type === 'Boolean' && typeof item.value === 'boolean'
}
export function isStackTypeInteger(item: any): item is IntegerArgType{
  return typeof item === 'object' && item.type === 'Integer' && typeof item.value === 'string'
}
export function isStackTypeArray(item: any): item is ArrayResponseArgType{
  return typeof item === 'object' && item.type === 'Array' && Array.isArray(item.value) && item.value.every((i: any) => isRpcResponseStackItem(i))
}
export function isStackTypeMap(item: any): item is MapResponseArgType{
  return typeof item === 'object' && item.type === 'Map' && Array.isArray(item.value) && item.value.every((i: any) => isRpcResponseStackItem(i.key) && isRpcResponseStackItem(i.value))
}
export function isStackTypeByteString(item: any): item is ByteStringArgType{
  return typeof item === 'object' && item.type === 'ByteString' && typeof item.value === 'string'
}
export function isStackTypeInteropInterface(item: any): item is InteropInterfaceArgType{
  return typeof item === 'object' && item.type === 'InteropInterface' && typeof item.interface === 'string' && typeof item.id === 'string'
}
export function isStackTypePointer(item: any): item is PointerArgType{
  return typeof item === 'object' && item.type === 'Pointer' && typeof item.value === 'string'
}
export function isStackTypeBuffer(item: any): item is BufferArgType{
  return typeof item === 'object' && item.type === 'Buffer' && typeof item.value === 'string'
}
export function isStackTypeStruct(item: any): item is StructArgType{
  return typeof item === 'object' && item.type === 'Struct' && Array.isArray(item.value) && item.value.every((i: any) => isRpcResponseStackItem(i))
}
export function isRpcResponseStackItem(item: any): item is RpcResponseStackItem{
  return (
    isStackTypeAny(item) || isStackTypeBoolean(item) || isStackTypeInteger(item) ||
    isStackTypeArray(item) || isStackTypeMap(item) || isStackTypeByteString(item) ||
    isStackTypeInteropInterface(item) || isStackTypePointer(item) || isStackTypeBuffer(item) ||
    isStackTypeStruct(item)
  )
}
