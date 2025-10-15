# NobleEd25519Signer

An Ed25519Signer that is initialized with an Ed25519 key pair and can be used with [Builders](https://github.com/farcasterxyz/hub-monorepo/blob/main/packages/hub-nodejs/docs/Builders.md) to sign Farcaster Messages.

## Properties

| Name     | Type         | Description                                 |
| :------- | :----------- | :------------------------------------------ |
| `scheme` | `Uint8Array` | Signature scheme used when signing messages |

## Constructors

### `static` new NobleEd25519Signer

#### Usage

```typescript
import { NobleEd25519Signer } from '@farcaster/hub-nodejs';
import * as ed from '@noble/ed25519';

const privateKeyBytes = ed.utils.randomPrivateKey();
const signer = new NobleEd25519Signer(privateKeyBytes);
```

#### Returns

| Value                | Description                    |
| :------------------- | :----------------------------- |
| `NobleEd25519Signer` | A NobleEd25519Signer instance |

#### Parameters

| Name         | Type         | Description                      |
| :----------- | :----------- | :------------------------------- |
| `privateKey` | `Uint8Array` | Bytes of the Signer's private key |

---

## Instance Methods

### getSignerKey

Returns the 256-bit public key in bytes.

#### Usage

```typescript
const signerKeyResult = await signer.getSignerKey();
if (signerKeyResult.isOk()) {
  console.log(signerKeyResult.value);
}
```

#### Returns

| Value                        | Description                          |
| :--------------------------- | :----------------------------------- |
| `HubAsyncResult<Uint8Array>` | The 256-bit address as a Uint8Array. |

### signMessageHash

Generates a 256-bit signature of a message hash using the EdDSA key pair.

#### Usage

```typescript
import { createHash, randomBytes } from 'crypto';

const messageBytes = randomBytes(32);
const messageHash = createHash('sha256').update(messageBytes).digest();

const signatureResult = await signer.signMessageHash(messageHash);
if (signatureResult.isOk()) {
  console.log(signatureResult.value);
}
```

#### Returns

| Value                        | Description                            |
| :--------------------------- | :------------------------------------- |
| `HubAsyncResult<Uint8Array>` | The 256-bit signature as a Uint8Array. |

#### Parameters

| Name   | Type         | Description                                   |
| :----- | :----------- | :-------------------------------------------- |
| `hash` | `Uint8Array` | The 256-bit hash of the message to be signed. |

---
