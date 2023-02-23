[hubble](../README.md) / [Modules](../modules.md) / [utils/src](utils_src.md) / ed25519

# Namespace: ed25519

[utils/src](utils_src.md).ed25519

## Table of contents

### Functions

- [getPublicKey](utils_src.ed25519.md#getpublickey)
- [getPublicKeySync](utils_src.ed25519.md#getpublickeysync)
- [signMessageHash](utils_src.ed25519.md#signmessagehash)
- [verifyMessageHashSignature](utils_src.ed25519.md#verifymessagehashsignature)

## Functions

### getPublicKey

▸ **getPublicKey**(`privateKey`): [`HubAsyncResult`](utils_src.md#hubasyncresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `privateKey` | `Uint8Array` |

#### Returns

[`HubAsyncResult`](utils_src.md#hubasyncresult)<`Uint8Array`\>

#### Defined in

[utils/src/crypto/ed25519.ts:13](https://github.com/vinliao/hubble/blob/4e20c6c/packages/utils/src/crypto/ed25519.ts#L13)

___

### getPublicKeySync

▸ **getPublicKeySync**(`privateKey`): `Uint8Array`

#### Parameters

| Name | Type |
| :------ | :------ |
| `privateKey` | `Uint8Array` |

#### Returns

`Uint8Array`

#### Defined in

[utils/src/crypto/ed25519.ts:9](https://github.com/vinliao/hubble/blob/4e20c6c/packages/utils/src/crypto/ed25519.ts#L9)

___

### signMessageHash

▸ **signMessageHash**(`hash`, `privateKey`): [`HubAsyncResult`](utils_src.md#hubasyncresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `Uint8Array` |
| `privateKey` | `Uint8Array` |

#### Returns

[`HubAsyncResult`](utils_src.md#hubasyncresult)<`Uint8Array`\>

#### Defined in

[utils/src/crypto/ed25519.ts:17](https://github.com/vinliao/hubble/blob/4e20c6c/packages/utils/src/crypto/ed25519.ts#L17)

___

### verifyMessageHashSignature

▸ **verifyMessageHashSignature**(`signature`, `hash`, `publicKey`): [`HubAsyncResult`](utils_src.md#hubasyncresult)<`boolean`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `signature` | `Uint8Array` |
| `hash` | `Uint8Array` |
| `publicKey` | `Uint8Array` |

#### Returns

[`HubAsyncResult`](utils_src.md#hubasyncresult)<`boolean`\>

#### Defined in

[utils/src/crypto/ed25519.ts:21](https://github.com/vinliao/hubble/blob/4e20c6c/packages/utils/src/crypto/ed25519.ts#L21)
