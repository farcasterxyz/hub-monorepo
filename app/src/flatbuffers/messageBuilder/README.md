# MessageBuilder

Ergonomic, type-safe message constructor.

## Usage

Constructing a signer message with an ECDSA signature:

```typescript
const ethersSigner = new EthersMessageSigner(signer.wallet);
const builder = new MessageBuilder({ fid, eip712Signer: ethersMessageSigner });
const signerAdd = builder.makeSignerAdd({ publicKey: keypair.publicKey, privateKey: keypair.privateKey });
```

Since `privateKey` is supplied to `makeSignerAdd`, an EdDSA signer will be setup and used to sign additional messages:

```typescript
builder.makeCast({ text, embeds, mentions, parent });
```

If an EdDSA signer has previously been added, signed messages can be constructed as follows:

```typescript
const ed25519Signer = new Ed25519MessageSigner(privateKey, publicKey);
const builder = new MessageBuilder({ fid, ed25519Signer });
const cast = builder.makeCast({ text, embeds, mentions, parent });
```
