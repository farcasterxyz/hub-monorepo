# Ed25519Signer

An Ed25519Signer is initialized with an Ed25519 key pair and can be used with [Builders](../builders/builders.md) to sign Farcaster Messages.

## Properties

| Name           | Type         | Description                                 |
| :------------- | :----------- | :------------------------------------------ |
| `scheme`       | `Uint8Array` | Signature scheme used when signing messages |
| `signerKey`    | `Uint8Array` | 32-byte EdDSA public key                    |
| `signerKeyHex` | `string`     | 32-byte EdDSA public key in hex format      |

## Constructors

### `static` new Ed25519Signer

#### Usage

```typescript
import { Ed25519Signer } from '@farcaster/hub-nodejs';
import * as ed from '@noble/ed25519';

const privateKeyBytes = ed.utils.randomPrivateKey();
const signer = Ed25519Signer.fromPrivateKey(privateKeyBytes)._unsafeUnwrap();
```

#### Returns

| Value           | Description               |
| :-------------- | :------------------------ |
| `Ed25519Signer` | An Ed25519Signer instance |

#### Parameters

| Name           | Type         | Description                            |
| :------------- | :----------- | :------------------------------------- |
| `privateKey`   | `Uint8Array` | Bytes of the Signers private key       |
| `signerKey`    | `Uint8Array` | 32-byte EdDSA public key               |
| `signerKeyHex` | `string`     | 32-byte EdDSA public key in hex format |

---

### `static` fromPrivateKey

Creates an Ed25519 signer from a private key.

#### Usage

```typescript
import { Ed25519Signer } from '@farcaster/hub-nodejs';
import * as ed from '@noble/ed25519';

const privateKeyBytes = ed.utils.randomPrivateKey();
const signer = Ed25519Signer.fromPrivateKey(privateKeyBytes)._unsafeUnwrap();
```

#### Returns

| Value                      | Description                                      |
| :------------------------- | :----------------------------------------------- |
| `HubResult<Ed25519Signer>` | A HubResult containing an Ed25519Signer instance |

#### Parameters

| Name         | Type         | Description                                 |
| :----------- | :----------- | :------------------------------------------ |
| `privateKey` | `Uint8Array` | The 32-byte private key to use for signing. |

---

## Methods

### signMessageHash

Generates a 256-bit signature using from EdDSA key pair.

#### Usage

```typescript
import { Ed25519Signer } from '@farcaster/hub-nodejs';
import { randomBytes } from 'crypto';
import * as ed from '@noble/ed25519';

const privateKeyBytes = ed.utils.randomPrivateKey();
const signer = new Ed25519Signer(privateKeyBytes);

const messageBytes = randomBytes(32);
const messageHash = crypto.createHash('sha256').update(messageBytes).digest();

const signature = await signer.signMessageHash(messageHash);
```

#### Returns

| Value                        | Description                                                        |
| :--------------------------- | :----------------------------------------------------------------- |
| `HubAsyncResult<Uint8Array>` | A HubAsyncResult containing the 256-bit signature as a Uint8Array. |

#### Parameters

| Name   | Type         | Description                                   |
| :----- | :----------- | :-------------------------------------------- |
| `hash` | `Uint8Array` | The 256-bit hash of the message to be signed. |

---

### signMessageHashHex

Generates a 256-bit hex signature from an EdDSA key pair for a given message hash in hex format.

#### Usage

```typescript
import { Ed25519Signer } from '@farcaster/hub-nodejs';
import { randomBytes } from 'crypto';
import * as ed from '@noble/ed25519';

const privateKeyBytes = ed.utils.randomPrivateKey();
const signer = new Ed25519Signer(privateKeyBytes);

const messageBytes = randomBytes(32);
const messageHash = messageBytes.toString('hex');

const signature = await signer.signMessageHashHex(messageHash);
```

#### Returns

| Value                    | Description                                                        |
| :----------------------- | :----------------------------------------------------------------- |
| `HubAsyncResult<string>` | A HubAsyncResult containing the 256-bit signature as a hex string. |

#### Parameters

| Name   | Type     | Description                                         |
| :----- | :------- | :-------------------------------------------------- |
| `hash` | `string` | The hash of the message to be signed in hex format. |
