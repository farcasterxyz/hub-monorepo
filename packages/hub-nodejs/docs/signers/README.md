# Signers

Signers are used to sign messages. There are two signature schemes, Eip712 signatures are used to sign SignerAdd and SignerRemove messages, and an Ed25519 key-pair is used to sign all other messages.

The following signer implementations are provided:

- [NobleEd25519Signer](./NobleEd25519Signer.md)
- [EthersEip712Signer](./EthersEip712Signer.md), for use with ethers v6
- [EthersV5Eip712Signer](./EthersV5Eip712Signer.md), for use with ethers v5

If you'd prefer to use a different library for signing messages, additional signer classes can be made by extending the `Eip712Signer` and `Ed25519Signer` classes.
