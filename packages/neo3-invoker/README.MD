<p align="center">
  <img
    src=".github/resources/images/coz.png"
    width="200px;">
</p>

<p align="center">
  Neo3-Invoker - A declarative SmartContract Invocation Spec.
  <br/> Made with ❤ by <b>COZ.IO</b>
</p>

# Neo3-Invoker

Neo3-Invoker is a specification of how SmartContract client SDKs can interact with different invoker libraries such Neon-JS or WalletConnect.

With Neo3-Invoker a SDK don't need to reimplement the wheel and can focus on the SmartContract communication format.
Taking advantage of the declarative nature of the specification, the SDK can be used with different invoker libraries, it only depends on what the dApp developer wants to use.

Visit the [main page](../../README.md) of the project.

## Arguments examples:

For these examples, we are starting from the point where an invoker has already been initialized and there is a `contractScriptHash` variable with the correct value.

### Any

It is expecting to receive a string as value on args.

```ts
const anyValue = 'anything'
invoker.testInvoke({
  invocations: [
    {
      operation: 'method',
      scriptHash: contractScriptHash,
      args: [{ type: 'Any', value: anyValue }],
    },
  ],
})
```

### String

It is expecting to receive an UTF-8 string as value on args.

```ts
const utfValue = 'UTF-8 string'
invoker.testInvoke({
  invocations: [
    {
      operation: 'method',
      scriptHash: contractScriptHash,
      args: [{ type: 'String', value: utfValue }],
    },
  ],
})
```

### Boolean

It is expecting to receive a boolean as value on args.

```ts
const booleanValue = true
invoker.testInvoke({
  invocations: [
    {
      operation: 'method',
      scriptHash: contractScriptHash,
      args: [{ type: 'Boolean', value: booleanValue }],
    },
  ],
})
```

### PublicKey

It is expecting to receive a HEX string as value on args. Compressed or Uncompressed formats are allowed.

```ts
const compressedHexString = '035a928f201639204e06b4368b1a93365462a8ebbff0b8818151b74faab3a2b61a'
invoker.testInvoke({
  invocations: [
    {
      operation: 'method',
      scriptHash: contractScriptHash,
      args: [{ type: 'PublicKey', value: hexString }],
    },
  ],
})

const uncompressedHexString =
  '045a928f201639204e06b4368b1a93365462a8ebbff0b8818151b74faab3a2b61a35dfabcb79ac492a2a88588d2f2e73f045cd8af58059282e09d693dc340e113f'
invoker.testInvoke({
  invocations: [
    {
      operation: 'method',
      scriptHash: contractScriptHash,
      args: [{ type: 'PublicKey', value: uncompressedHexString }],
    },
  ],
})
```

### Hash160

It is expecting to receive a HEX as value on args. Automatically converts an address to scripthash if provided.

```ts
//Address
const addressValue = 'NNLi44dJNXtDNSBkofB48aTVYtb1zZrNEs'
invoker.testInvoke({
  invocations: [
    {
      operation: 'method',
      scriptHash: contractScriptHash,
      args: [{ type: 'Hash160', value: addressHexValue }],
    },
  ],
})

//ScriptHash
const scriptHashValue = '0xa5de523ae9d99be784a536e9412b7a3cbe049e1a'
invoker.testInvoke({
  invocations: [
    {
      operation: 'method',
      scriptHash: contractScriptHash,
      args: [{ type: 'Hash160', value: scriptHashValue }],
    },
  ],
})
```

### Hash256

It is expecting to receive a HEX as value on args.

```ts
const transactionId = '0x0f3b6366b53cd83290769fb5c2cd4f05c4441dbb02af4dbb58a82a46a120ca17'
invoker.testInvoke({
  invocations: [
    {
      operation: 'method',
      scriptHash: contractScriptHash,
      args: [{ type: 'Hash256', value: transactionId }],
    },
  ],
})
```

### Integer

It is expecting to receive a number as value on args. You can pass a string that represents a number.

```ts
const numberValue = 128
invoker.testInvoke({
  invocations: [
    {
      operation: 'method',
      scriptHash: contractScriptHash,
      args: [{ type: 'Integer', value: numberValue }],
    },
  ],
})

const numberAsStringValue = '128'
invoker.testInvoke({
  invocations: [
    {
      operation: 'method',
      scriptHash: contractScriptHash,
      args: [{ type: 'Integer', value: numberAsStringValue }],
    },
  ],
})
```

### Array

It is expecting to receive an array of other arguments as value on args.

```ts
invoker.testInvoke({
  invocations: [
    {
      operation: 'method',
      scriptHash: contractScriptHash,
      args: [
        {
          type: 'Array',
          value: [
            { type: 'String', value: 'UTF-8 string' },
            { type: 'Integer', value: 128 },
            { type: 'Hash160', value: 'NNLi44dJNXtDNSBkofB48aTVYtb1zZrNEs' },
          ],
        },
      ],
    },
  ],
})
```

### ByteArray

It is expecting to receive a HEX string as value on args. It automatically converts a hex to base64.

```ts
const hexValue = 'HEX string'
invoker.testInvoke({
  invocations: [
    {
      operation: 'method',
      scriptHash: contractScriptHash,
      args: [{ type: 'ByteArray', value: hexValue }],
    },
  ],
})
```
