[hubble](../README.md) / [Modules](../modules.md) / [utils/src](../modules/utils_src.md) / Signer

# Interface: Signer

[utils/src](../modules/utils_src.md).Signer

## Implemented by

- [`Ed25519Signer`](../classes/utils_src.Ed25519Signer.md)
- [`Eip712Signer`](../classes/utils_src.Eip712Signer.md)

## Table of contents

### Properties

- [scheme](utils_src.Signer.md#scheme)
- [signerKey](utils_src.Signer.md#signerkey)
- [signerKeyHex](utils_src.Signer.md#signerkeyhex)

### Methods

- [signMessageHash](utils_src.Signer.md#signmessagehash)

## Properties

### scheme

• `Readonly` **scheme**: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md)

#### Defined in

[utils/src/signers/signer.ts:5](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/signers/signer.ts#L5)

___

### signerKey

• `Readonly` **signerKey**: `Uint8Array`

#### Defined in

[utils/src/signers/signer.ts:6](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/signers/signer.ts#L6)

___

### signerKeyHex

• `Readonly` **signerKeyHex**: `string`

#### Defined in

[utils/src/signers/signer.ts:7](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/signers/signer.ts#L7)

## Methods

### signMessageHash

▸ **signMessageHash**(`hash`): [`HubAsyncResult`](../modules/utils_src.md#hubasyncresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `Uint8Array` |

#### Returns

[`HubAsyncResult`](../modules/utils_src.md#hubasyncresult)<`Uint8Array`\>

#### Defined in

[utils/src/signers/signer.ts:9](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/signers/signer.ts#L9)
