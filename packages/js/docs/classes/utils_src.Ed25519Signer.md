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

[utils/src/signers/ed25519Signer.ts:23](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/signers/ed25519Signer.ts#L23)

## Properties

### \_privateKey

• `Private` `Readonly` **\_privateKey**: `Uint8Array`

#### Defined in

[utils/src/signers/ed25519Signer.ts:14](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/signers/ed25519Signer.ts#L14)

___

### scheme

• `Readonly` **scheme**: [`SIGNATURE_SCHEME_ED25519`](../enums/js_src.protobufs.SignatureScheme.md#signature_scheme_ed25519) = `SignatureScheme.SIGNATURE_SCHEME_ED25519`

#### Implementation of

[Signer](../interfaces/utils_src.Signer.md).[scheme](../interfaces/utils_src.Signer.md#scheme)

#### Defined in

[utils/src/signers/ed25519Signer.ts:8](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/signers/ed25519Signer.ts#L8)

___

### signerKey

• `Readonly` **signerKey**: `Uint8Array`

20-byte wallet address

#### Implementation of

[Signer](../interfaces/utils_src.Signer.md).[signerKey](../interfaces/utils_src.Signer.md#signerkey)

#### Defined in

[utils/src/signers/ed25519Signer.ts:11](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/signers/ed25519Signer.ts#L11)

___

### signerKeyHex

• `Readonly` **signerKeyHex**: `string`

#### Implementation of

[Signer](../interfaces/utils_src.Signer.md).[signerKeyHex](../interfaces/utils_src.Signer.md#signerkeyhex)

#### Defined in

[utils/src/signers/ed25519Signer.ts:12](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/signers/ed25519Signer.ts#L12)

## Methods

### signMessageHash

▸ **signMessageHash**(`hash`): [`HubAsyncResult`](../modules/utils_src.md#hubasyncresult)<`Uint8Array`\>

generates 256-bit signature from an EdDSA key pair

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `Uint8Array` |

#### Returns

[`HubAsyncResult`](../modules/utils_src.md#hubasyncresult)<`Uint8Array`\>

#### Implementation of

[Signer](../interfaces/utils_src.Signer.md).[signMessageHash](../interfaces/utils_src.Signer.md#signmessagehash)

#### Defined in

[utils/src/signers/ed25519Signer.ts:30](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/signers/ed25519Signer.ts#L30)

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

[utils/src/signers/ed25519Signer.ts:16](https://github.com/vinliao/hubble/blob/b933e0c/packages/utils/src/signers/ed25519Signer.ts#L16)
