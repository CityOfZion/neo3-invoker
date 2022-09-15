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
import {default as Neon} from '@cityofzion/neon-js'

const acct = Neon.create.account('NKuyBkoGdZZSLyPbJEetheRhMjeznFZszf')

const neonInvoker: Neo3Invoker = await NeonInvoker.init(acct)
```

If you don't wanna sign, simply pass `undefined` as the account.
```ts
import { NeonInvoker } from '@cityofzion/neon-invoker'

const neonInvoker: Neo3Invoker = await NeonInvoker.init(undefined)
```

There is an additional parameter `rpcEndpoint` that can be used to specify the RPC endpoint to use. If not specified,
the default `network` will be `TestNet` and the default `rpc` will be `https://test1.cityofzion.io:443`.

Another example of initialization is:
```ts
const neonInvoker: Neo3Invoker = await NeonInvoker.init(acct, 'http://127.0.0.1:5001')
```

## Usage
The usage of NeonInvoker is documented in the [Neo3-Invoker Docs](https://htmlpreview.github.io/?https://raw.githubusercontent.com/CityOfZion/neo3-invoker/master/packages/neo3-invoker/docs/modules.html).
