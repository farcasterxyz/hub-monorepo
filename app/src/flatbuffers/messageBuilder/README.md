# MessageBuilder

Ergonomic, type-safe message constructor.

## Usage

There are two message builder classes, `SignerMessageBuilder` for constructing signer message with an ECDSA signature and `MessageBuilder`
for constructing all other messags.

```typescript
const signerBuilder = new SignerMessageBuilder({ fid, privateKey }); // privateKey of Ethereum private
const signerAdd = signerBuilder.makeSignerAdd({ publicKey: ed25519.publicKey, privateKey: ed25519.privateKey });

const builder = new MessageBuilder({ fid, privateKey: ed25519.privateKey });
const cast = builder.makeCast({ text, embeds, mentions, parent });
```
