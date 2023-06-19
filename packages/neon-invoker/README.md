<p align="center">
  <img
    src="../../.github/resources/images/coz.png"
    width="200px;">
</p>

<p align="center">
  Neon-Invoker - A Neo3-Invoker implementation using Neon-JS
  <br/> Made with ❤ by <b>COZ.IO</b>
</p>

# Neon-Invoker

## Install

```bash
npm i @cityofzion/neon-invoker
```

## Initialize NeonInvoker

To use NeonInvoker as a Neo3Invoker you can simply call `NeonInvoker.init` and pass the `NeonInvoker` instance to the SDK that requires a `Neo3Invoker`.

To sign the transactions you should pass an account to the `NeonInvoker.init` method. You can use the `Account` class from `@cityofzion/neon-core` to create an account.

```ts
import { NeonInvoker } from '@cityofzion/neon-invoker'
import { default as Neon } from '@cityofzion/neon-js'

const account = Neon.create.account('NKuyBkoGdZZSLyPbJEetheRhMjeznFZszf')

const neonInvoker: Neo3Invoker = await NeonInvoker.init({
  rpcAddress: NeonInvoker.MAINNET,
  account,
})
```

You can also pass an signingCallback to the `NeonInvoker.init` method. It should return a `Promise` of signature string.

```ts
import { NeonInvoker } from '@cityofzion/neon-invoker'
import { default as Neon } from '@cityofzion/neon-js'

const account = Neon.create.account('NKuyBkoGdZZSLyPbJEetheRhMjeznFZszf')

const neonInvoker: Neo3Invoker = await NeonInvoker.init({
  rpcAddress: NeonInvoker.MAINNET,
  account,
  signingCallback: (transactionClass, { network, witnessIndex }) => {
    const signature = '' // Signature for account
    return signature
  },
})
```

If you don't want to sign, simply don't pass an account.

```ts
import { NeonInvoker } from '@cityofzion/neon-invoker'

const neonInvoker: Neo3Invoker = await NeonInvoker.init({
  rpcAddress: NeonInvoker.MAINNET,
})
```

You can also pass a custom RPC endpoint to the `NeonInvoker.init` method.

Another example of initialization is:

```ts
const neonInvoker: Neo3Invoker = await NeonInvoker.init({
  rpcAddress: 'http://127.0.0.1:5001',
  account,
})
```

## Usage

The usage of NeonInvoker is documented in the [Neo3-Invoker Docs](https://htmlpreview.github.io/?https://raw.githubusercontent.com/CityOfZion/neo3-invoker/master/packages/neo3-invoker/docs/modules.html).
