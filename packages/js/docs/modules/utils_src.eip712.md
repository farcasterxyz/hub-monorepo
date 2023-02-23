[hubble](../README.md) / [Modules](../modules.md) / [utils/src](utils_src.md) / eip712

# Namespace: eip712

[utils/src](utils_src.md).eip712

## Table of contents

### Variables

- [EIP\_712\_FARCASTER\_DOMAIN](utils_src.eip712.md#eip_712_farcaster_domain)
- [EIP\_712\_FARCASTER\_MESSAGE\_DATA](utils_src.eip712.md#eip_712_farcaster_message_data)
- [EIP\_712\_FARCASTER\_VERIFICATION\_CLAIM](utils_src.eip712.md#eip_712_farcaster_verification_claim)

### Functions

- [signMessageHash](utils_src.eip712.md#signmessagehash)
- [signVerificationEthAddressClaim](utils_src.eip712.md#signverificationethaddressclaim)
- [verifyMessageHashSignature](utils_src.eip712.md#verifymessagehashsignature)
- [verifyVerificationEthAddressClaimSignature](utils_src.eip712.md#verifyverificationethaddressclaimsignature)

## Variables

### EIP\_712\_FARCASTER\_DOMAIN

• `Const` **EIP\_712\_FARCASTER\_DOMAIN**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `name` | `string` |
| `salt` | `string` |
| `version` | `string` |

#### Defined in

[utils/src/crypto/eip712.ts:8](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/crypto/eip712.ts#L8)

___

### EIP\_712\_FARCASTER\_MESSAGE\_DATA

• `Const` **EIP\_712\_FARCASTER\_MESSAGE\_DATA**: { `name`: `string` = 'hash'; `type`: `string` = 'bytes' }[]

#### Defined in

[utils/src/crypto/eip712.ts:34](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/crypto/eip712.ts#L34)

___

### EIP\_712\_FARCASTER\_VERIFICATION\_CLAIM

• `Const` **EIP\_712\_FARCASTER\_VERIFICATION\_CLAIM**: { `name`: `string` = 'fid'; `type`: `string` = 'uint256' }[]

#### Defined in

[utils/src/crypto/eip712.ts:15](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/crypto/eip712.ts#L15)

## Functions

### signMessageHash

▸ **signMessageHash**(`hash`, `ethersTypedDataSigner`): [`HubAsyncResult`](utils_src.md#hubasyncresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `Uint8Array` |
| `ethersTypedDataSigner` | `TypedDataSigner` |

#### Returns

[`HubAsyncResult`](utils_src.md#hubasyncresult)<`Uint8Array`\>

#### Defined in

[utils/src/crypto/eip712.ts:78](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/crypto/eip712.ts#L78)

___

### signVerificationEthAddressClaim

▸ **signVerificationEthAddressClaim**(`claim`, `ethersTypedDataSigner`): [`HubAsyncResult`](utils_src.md#hubasyncresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `claim` | [`VerificationEthAddressClaim`](utils_src.md#verificationethaddressclaim) |
| `ethersTypedDataSigner` | `TypedDataSigner` |

#### Returns

[`HubAsyncResult`](utils_src.md#hubasyncresult)<`Uint8Array`\>

#### Defined in

[utils/src/crypto/eip712.ts:41](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/crypto/eip712.ts#L41)

___

### verifyMessageHashSignature

▸ **verifyMessageHashSignature**(`hash`, `signature`): [`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `Uint8Array` |
| `signature` | `Uint8Array` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Defined in

[utils/src/crypto/eip712.ts:95](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/crypto/eip712.ts#L95)

___

### verifyVerificationEthAddressClaimSignature

▸ **verifyVerificationEthAddressClaimSignature**(`claim`, `signature`): [`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `claim` | [`VerificationEthAddressClaim`](utils_src.md#verificationethaddressclaim) |
| `signature` | `Uint8Array` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Defined in

[utils/src/crypto/eip712.ts:58](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/crypto/eip712.ts#L58)
