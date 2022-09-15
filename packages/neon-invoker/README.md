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
```ts
import { NeonInvoker } from '@cityofzion/neon-invoker'
import {default as Neon} from '@cityofzion/neon-js'

const acct = Neon.create.account('NKuyBkoGdZZSLyPbJEetheRhMjeznFZszf')

const neonInvoker: Neo3Invoker = await NeonInvoker.init(acct)
```
The only mandatory parameter of `NeonInvoker.init` is the `account` parameter, which is the account that will be used to
sign the transaction. If you don't pass any other parameter, the default `network` will be `TestNet` and the default `rpc`
will be `https://test1.cityofzion.io:443`.

Another example of initialization is:
```ts
const neonInvoker: Neo3Invoker = await NeonInvoker.init(acct, 'http://127.0.0.1:5001')
```

## Usage
The usage of NeonInvoker is documented in the [Neo3-Invoker Docs](https://raw.githubusercontent.com/CityOfZion/neo3-invoker/packages/neo3-invoker/docs/index.html).
