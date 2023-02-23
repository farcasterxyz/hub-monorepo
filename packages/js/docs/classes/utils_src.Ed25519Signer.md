[hubble](../README.md) / [Modules](../modules.md) / [utils/src](../modules/utils_src.md) / Ed25519Signer

# Class: Ed25519Signer

[utils/src](../modules/utils_src.md).Ed25519Signer

## Implements

- [`Signer`](../interfaces/utils_src.Signer.md)

## Table of contents

### Constructors

- [constructor](utils_src.Ed25519Signer.md#constructor)

### Properties

- [\_privateKey](utils_src.Ed25519Signer.md#_privatekey)
- [scheme](utils_src.Ed25519Signer.md#scheme)
- [signerKey](utils_src.Ed25519Signer.md#signerkey)
- [signerKeyHex](utils_src.Ed25519Signer.md#signerkeyhex)

### Methods

- [signMessageHash](utils_src.Ed25519Signer.md#signmessagehash)
- [fromPrivateKey](utils_src.Ed25519Signer.md#fromprivatekey)

## Constructors

### constructor

• **new Ed25519Signer**(`privateKey`, `signerKey`, `signerKeyHex`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `privateKey` | `Uint8Array` |
| `signerKey` | `Uint8Array` |
| `signerKeyHex` | `string` |

#### Defined in

[utils/src/signers/ed25519Signer.ts:23](https://github.com/vinliao/hubble/blob/4e20c6c/packages/utils/src/signers/ed25519Signer.ts#L23)

## Properties

### \_privateKey

• `Private` `Readonly` **\_privateKey**: `Uint8Array`

#### Defined in

[utils/src/signers/ed25519Signer.ts:14](https://github.com/vinliao/hubble/blob/4e20c6c/packages/utils/src/signers/ed25519Signer.ts#L14)

___

### scheme

• `Readonly` **scheme**: [`SIGNATURE_SCHEME_ED25519`](../enums/js_src.protobufs.SignatureScheme.md#signature_scheme_ed25519) = `SignatureScheme.SIGNATURE_SCHEME_ED25519`

#### Implementation of

[Signer](../interfaces/utils_src.Signer.md).[scheme](../interfaces/utils_src.Signer.md#scheme)

#### Defined in

[utils/src/signers/ed25519Signer.ts:8](https://github.com/vinliao/hubble/blob/4e20c6c/packages/utils/src/signers/ed25519Signer.ts#L8)

___

### signerKey

• `Readonly` **signerKey**: `Uint8Array`

20-byte wallet address

#### Implementation of

[Signer](../interfaces/utils_src.Signer.md).[signerKey](../interfaces/utils_src.Signer.md#signerkey)

#### Defined in

[utils/src/signers/ed25519Signer.ts:11](https://github.com/vinliao/hubble/blob/4e20c6c/packages/utils/src/signers/ed25519Signer.ts#L11)

___

### signerKeyHex

• `Readonly` **signerKeyHex**: `string`

#### Implementation of

[Signer](../interfaces/utils_src.Signer.md).[signerKeyHex](../interfaces/utils_src.Signer.md#signerkeyhex)

#### Defined in

[utils/src/signers/ed25519Signer.ts:12](https://github.com/vinliao/hubble/blob/4e20c6c/packages/utils/src/signers/ed25519Signer.ts#L12)

## Methods

### signMessageHash

▸ **signMessageHash**(`hash`): [`HubAsyncResult`](../modules/utils_src.md#hubasyncresult)<`Uint8Array`\>

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

[`HubAsyncResult`](../modules/utils_src.md#hubasyncresult)<`Uint8Array`\>

A HubAsyncResult containing the signature as a Uint8Array.

#### Implementation of

[Signer](../interfaces/utils_src.Signer.md).[signMessageHash](../interfaces/utils_src.Signer.md#signmessagehash)

#### Defined in

[utils/src/signers/ed25519Signer.ts:56](https://github.com/vinliao/hubble/blob/4e20c6c/packages/utils/src/signers/ed25519Signer.ts#L56)

___

### fromPrivateKey

▸ `Static` **fromPrivateKey**(`privateKey`): [`HubResult`](../modules/utils_src.md#hubresult)<[`Ed25519Signer`](utils_src.Ed25519Signer.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `privateKey` | `Uint8Array` |

#### Returns

[`HubResult`](../modules/utils_src.md#hubresult)<[`Ed25519Signer`](utils_src.Ed25519Signer.md)\>

#### Defined in

[utils/src/signers/ed25519Signer.ts:16](https://github.com/vinliao/hubble/blob/4e20c6c/packages/utils/src/signers/ed25519Signer.ts#L16)
