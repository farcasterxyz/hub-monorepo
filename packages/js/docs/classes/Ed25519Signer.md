[@farcaster/js](../README.md) / [Exports](../modules.md) / Ed25519Signer

# Class: Ed25519Signer

## Hierarchy

- `Ed25519Signer`

  ↳ **`Ed25519Signer`**

## Table of contents

### Constructors

- [constructor](Ed25519Signer.md#constructor)

### Properties

- [scheme](Ed25519Signer.md#scheme)
- [signerKey](Ed25519Signer.md#signerkey)
- [signerKeyHex](Ed25519Signer.md#signerkeyhex)

### Methods

- [signMessageHash](Ed25519Signer.md#signmessagehash)
- [signMessageHashHex](Ed25519Signer.md#signmessagehashhex)
- [fromPrivateKey](Ed25519Signer.md#fromprivatekey)

## Constructors

### constructor

• **new Ed25519Signer**(`privateKey`, `signerKey`, `signerKeyHex`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `privateKey` | `Uint8Array` |
| `signerKey` | `Uint8Array` |
| `signerKeyHex` | `string` |

#### Inherited from

BaseEd25519Signer.constructor

## Properties

### scheme

• `Readonly` **scheme**: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs.SignatureScheme.md#signature_scheme_ed25519) = `SignatureScheme.SIGNATURE_SCHEME_ED25519`

Signature scheme as defined in protobufs

#### Inherited from

BaseEd25519Signer.scheme

___

### signerKey

• `Readonly` **signerKey**: `Uint8Array`

32-byte EdDSA public key

#### Inherited from

BaseEd25519Signer.signerKey

___

### signerKeyHex

• `Readonly` **signerKeyHex**: `string`

32-byte EdDSA public key in hex format

#### Inherited from

BaseEd25519Signer.signerKeyHex

## Methods

### signMessageHash

▸ **signMessageHash**(`hash`)

Generates a 256-bit signature using from EdDSA key pair.

**`Example`**

```typescript
import { Ed25519Signer } from '@farcaster/js';
import { randomBytes } from 'crypto';
import * as ed from '@noble/ed25519';

const privateKeyBytes = ed.utils.randomPrivateKey();
const signer = new Ed25519Signer(privateKeyBytes);

const messageBytes = randomBytes(32);
const messageHash = crypto.createHash('sha256').update(messageBytes).digest();

const signature = await signer.signMessageHash(messageHash);

console.log(signature._unsafeUnwrap());
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `hash` | `Uint8Array` | The 256-bit hash of the message to be signed. |

#### Inherited from

BaseEd25519Signer.signMessageHash

___

### signMessageHashHex

▸ **signMessageHashHex**(`hash`)

Generates a 256-bit hex signature from an EdDSA key pair for a given message hash in hex format.

**`Example`**

```typescript
import { Ed25519Signer } from '@farcaster/js';
import { randomBytes } from 'crypto';
import * as ed from '@noble/ed25519';

const privateKeyBytes = ed.utils.randomPrivateKey();
const signer = new Ed25519Signer(privateKeyBytes);

const messageBytes = randomBytes(32);
const messageHash = messageBytes.toString('hex');

const signature = await signer.signMessageHashHex(messageHash);

console.log(signature._unsafeUnwrap()); // 0x9f1c7e13b9d0b8...
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `hash` | `string` | The hash of the message to be signed in hex format. |

___

### fromPrivateKey

▸ `Static` **fromPrivateKey**(`privateKey`)

Creates an Ed25519 signer from a private key.

**`Example`**

```typescript
import { Ed25519Signer } from '@farcaster/js';
import * as ed from '@noble/ed25519';

const privateKeyBytes = ed.utils.randomPrivateKey();
const signer = Ed25519Signer.fromPrivateKey(privateKeyBytes)._unsafeUnwrap();
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `privateKey` | `Uint8Array` | The 32-byte private key to use for signing. |

#### Overrides

BaseEd25519Signer.fromPrivateKey
