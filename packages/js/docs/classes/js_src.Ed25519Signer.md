[hubble](../README.md) / [Modules](../modules.md) / [js/src](../modules/js_src.md) / Ed25519Signer

# Class: Ed25519Signer

[js/src](../modules/js_src.md).Ed25519Signer

## Hierarchy

- `Ed25519Signer`

  ↳ **`Ed25519Signer`**

## Table of contents

### Constructors

- [constructor](js_src.Ed25519Signer.md#constructor)

### Properties

- [scheme](js_src.Ed25519Signer.md#scheme)
- [signerKey](js_src.Ed25519Signer.md#signerkey)
- [signerKeyHex](js_src.Ed25519Signer.md#signerkeyhex)

### Methods

- [signMessageHash](js_src.Ed25519Signer.md#signmessagehash)
- [signMessageHashHex](js_src.Ed25519Signer.md#signmessagehashhex)
- [fromPrivateKey](js_src.Ed25519Signer.md#fromprivatekey)

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

#### Defined in

utils/dist/index.d.ts:140

## Properties

### scheme

• `Readonly` **scheme**: [`SIGNATURE_SCHEME_ED25519`](../enums/js_src.protobufs.SignatureScheme.md#signature_scheme_ed25519) = `SignatureScheme.SIGNATURE_SCHEME_ED25519`

#### Inherited from

BaseEd25519Signer.scheme

#### Defined in

utils/dist/index.d.ts:134

___

### signerKey

• `Readonly` **signerKey**: `Uint8Array`

20-byte wallet address

#### Inherited from

BaseEd25519Signer.signerKey

#### Defined in

utils/dist/index.d.ts:136

___

### signerKeyHex

• `Readonly` **signerKeyHex**: `string`

#### Inherited from

BaseEd25519Signer.signerKeyHex

#### Defined in

utils/dist/index.d.ts:137

## Methods

### signMessageHash

▸ **signMessageHash**(`hash`): `HubAsyncResult`<`Uint8Array`\>

Generates a 256-bit signature using from EdDSA key pair.

**`Function`**

**`Name`**

ed25519Signer.signMessageHash

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

#### Returns

`HubAsyncResult`<`Uint8Array`\>

A HubAsyncResult containing the signature as a Uint8Array.

#### Inherited from

BaseEd25519Signer.signMessageHash

#### Defined in

utils/dist/index.d.ts:168

___

### signMessageHashHex

▸ **signMessageHashHex**(`hash`): `HubAsyncResult`<`string`\>

Generates a 256-bit hex signature from an EdDSA key pair for a given message hash in hex format.

**`Function`**

**`Name`**

ed25519Signer.signMessageHashHex

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

#### Returns

`HubAsyncResult`<`string`\>

A HubAsyncResult containing the signature in hex format.

#### Defined in

[js/src/signers.ts:175](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/signers.ts#L175)

___

### fromPrivateKey

▸ `Static` **fromPrivateKey**(`privateKey`): `HubResult`<[`Ed25519Signer`](js_src.Ed25519Signer.md)\>

Creates an Ed25519 signer from a private key.

**`Function`**

**`Name`**

Ed25519Signer.fromPrivateKey

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

#### Returns

`HubResult`<[`Ed25519Signer`](js_src.Ed25519Signer.md)\>

A HubResult containing an Ed25519Signer instance on success, or an error message on failure.

#### Overrides

BaseEd25519Signer.fromPrivateKey

#### Defined in

[js/src/signers.ts:141](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/signers.ts#L141)
