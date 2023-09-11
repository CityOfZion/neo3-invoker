> ### ⚠️ This repository has been moved to [@CityOfZion/neon-dappkit](https://github.com/CityOfZion/neon-dappkit)
> Which has the same classes and methods, making migration very easy.

---

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

### Install

```bash
npm i @cityofzion/neo3-invoker
```

### Documentation

Checkout the auto-generated [Docs](https://htmlpreview.github.io/?https://raw.githubusercontent.com/CityOfZion/neo3-invoker/master/packages/neo3-invoker/docs/modules.html)
based on the [Code](packages/neo3-invoker/src/index.ts).

> If you are unsure about the expected value for each argument type, [Checkout these examples](packages/neo3-invoker/README.MD#arguments-examples)

## Neon-Invoker

Neon-Invoker is a library that implements the Neo3-Invoker specification and uses Neon-JS as the invoker library. It should be used when the dApp developer doesn't need a wallet input from the final user.

[Checkout the Docs](packages/neon-invoker/README.md)

## Other Implementations

Any library can implement the Neo3-Invoker specification, if you have an implementation, please create a PR to update this list.

- [WalletConnectSDK](https://github.com/CityOfZion/wallet-connect-sdk)

(yes, a single item list is a bit weird 😅, send us your implementations!)
