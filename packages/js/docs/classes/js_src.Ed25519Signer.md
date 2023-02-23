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

generates 256-bit signature from an EdDSA key pair

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `Uint8Array` |

#### Returns

`HubAsyncResult`<`Uint8Array`\>

#### Inherited from

BaseEd25519Signer.signMessageHash

#### Defined in

utils/dist/index.d.ts:142

___

### signMessageHashHex

▸ **signMessageHashHex**(`hash`): `HubAsyncResult`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `string` |

#### Returns

`HubAsyncResult`<`string`\>

#### Defined in

[js/src/signers.ts:129](https://github.com/vinliao/hubble/blob/b933e0c/packages/js/src/signers.ts#L129)

___

### fromPrivateKey

▸ `Static` **fromPrivateKey**(`privateKey`): `HubResult`<[`Ed25519Signer`](js_src.Ed25519Signer.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `privateKey` | `Uint8Array` |

#### Returns

`HubResult`<[`Ed25519Signer`](js_src.Ed25519Signer.md)\>

#### Overrides

BaseEd25519Signer.fromPrivateKey

#### Defined in

[js/src/signers.ts:122](https://github.com/vinliao/hubble/blob/b933e0c/packages/js/src/signers.ts#L122)
