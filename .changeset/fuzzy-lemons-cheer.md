---
'@farcaster/hub-nodejs': minor
'@farcaster/utils': minor
---

refactor: generic and library specific signer classes

- `Eip712Signer` has been renamed to `EthersEip712Signer` and should be built with `new EthersEip712Signer(wallet)` instead of `Eip712Signer.fromSigner`
- `Ed25519Signer` has been renamed to `NobleEd25519Signer` and should be built with `new NobleEd25519Signer(privateKey)` instead of `Ed25519Signer.fromPrivateKey`
