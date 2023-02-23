[hubble](../README.md) / [Modules](../modules.md) / utils/src

# Module: utils/src

## Table of contents

### Namespaces

- [ed25519](utils_src.ed25519.md)
- [eip712](utils_src.eip712.md)
- [validations](utils_src.validations.md)

### Classes

- [Ed25519Signer](../classes/utils_src.Ed25519Signer.md)
- [Eip712Signer](../classes/utils_src.Eip712Signer.md)
- [HubError](../classes/utils_src.HubError.md)

### Interfaces

- [Signer](../interfaces/utils_src.Signer.md)

### Type Aliases

- [HubAsyncResult](utils_src.md#hubasyncresult)
- [HubErrorCode](utils_src.md#huberrorcode)
- [HubResult](utils_src.md#hubresult)
- [HubRpcClient](utils_src.md#hubrpcclient)
- [MessageSigner](utils_src.md#messagesigner)
- [TypedDataSigner](utils_src.md#typeddatasigner)
- [VerificationEthAddressClaim](utils_src.md#verificationethaddressclaim)

### Variables

- [FARCASTER\_EPOCH](utils_src.md#farcaster_epoch)
- [Factories](utils_src.md#factories)

### Functions

- [bigNumberToBytes](utils_src.md#bignumbertobytes)
- [bytesCompare](utils_src.md#bytescompare)
- [bytesDecrement](utils_src.md#bytesdecrement)
- [bytesIncrement](utils_src.md#bytesincrement)
- [bytesToBigNumber](utils_src.md#bytestobignumber)
- [bytesToHexString](utils_src.md#bytestohexstring)
- [bytesToUtf8String](utils_src.md#bytestoutf8string)
- [fromFarcasterTime](utils_src.md#fromfarcastertime)
- [getFarcasterTime](utils_src.md#getfarcastertime)
- [getHubRpcClient](utils_src.md#gethubrpcclient)
- [hexStringToBytes](utils_src.md#hexstringtobytes)
- [isHubError](utils_src.md#ishuberror)
- [makeVerificationEthAddressClaim](utils_src.md#makeverificationethaddressclaim)
- [toFarcasterTime](utils_src.md#tofarcastertime)
- [utf8StringToBytes](utils_src.md#utf8stringtobytes)

## Type Aliases

### HubAsyncResult

Ƭ **HubAsyncResult**<`T`\>: `Promise`<[`HubResult`](utils_src.md#hubresult)<`T`\>\>

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[utils/src/errors.ts:83](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/errors.ts#L83)

___

### HubErrorCode

Ƭ **HubErrorCode**: ``"unauthenticated"`` \| ``"unauthorized"`` \| ``"bad_request"`` \| ``"bad_request.parse_failure"`` \| ``"bad_request.invalid_param"`` \| ``"bad_request.validation_failure"`` \| ``"bad_request.duplicate"`` \| ``"bad_request.conflict"`` \| ``"not_found"`` \| ``"not_implemented"`` \| ``"not_implemented.deprecated"`` \| ``"unavailable"`` \| ``"unavailable.network_failure"`` \| ``"unavailable.storage_failure"`` \| ``"unknown"``

HubErrorCode defines all the types of errors that can be raised in the Hub.

A string union type is chosen over an enumeration since TS enums are unusual types that generate
javascript code and may cause downstream issues. See:
https://www.executeprogram.com/blog/typescript-features-to-avoid

#### Defined in

[utils/src/errors.ts:57](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/errors.ts#L57)

___

### HubResult

Ƭ **HubResult**<`T`\>: `Result`<`T`, [`HubError`](../classes/utils_src.HubError.md)\>

Type alias for shorthand when handling errors

#### Type parameters

| Name |
| :------ |
| `T` |

#### Defined in

[utils/src/errors.ts:82](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/errors.ts#L82)

___

### HubRpcClient

Ƭ **HubRpcClient**: `PromisifiedClient`<[`HubServiceClient`](js_src.protobufs.md#hubserviceclient)\>

#### Defined in

[utils/src/client.ts:111](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/client.ts#L111)

___

### MessageSigner

Ƭ **MessageSigner**<`TMessageType`\>: `TMessageType` extends [`MESSAGE_TYPE_SIGNER_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_signer_add) \| [`MESSAGE_TYPE_SIGNER_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_signer_remove) ? [`Eip712Signer`](../classes/utils_src.Eip712Signer.md) : [`Ed25519Signer`](../classes/utils_src.Ed25519Signer.md)

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TMessageType` | extends [`MessageType`](../enums/js_src.protobufs.MessageType.md) |

#### Defined in

[utils/src/signers/types.ts:5](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/signers/types.ts#L5)

___

### TypedDataSigner

Ƭ **TypedDataSigner**: `EthersAbstractSigner` & `EthersTypedDataSigner`

#### Defined in

[utils/src/signers/eip712Signer.ts:12](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/signers/eip712Signer.ts#L12)

___

### VerificationEthAddressClaim

Ƭ **VerificationEthAddressClaim**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `blockHash` | `string` |
| `fid` | `BigNumber` |
| `network` | [`FarcasterNetwork`](../enums/js_src.protobufs.FarcasterNetwork.md) |

#### Defined in

[utils/src/verifications.ts:8](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/verifications.ts#L8)

## Variables

### FARCASTER\_EPOCH

• `Const` **FARCASTER\_EPOCH**: ``1609459200000``

#### Defined in

[utils/src/time.ts:4](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/time.ts#L4)

___

### Factories

• `Const` **Factories**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `AmpAddData` | `Factory`<[`AmpAddData`](js_src.protobufs.md#ampadddata), `any`, [`AmpAddData`](js_src.protobufs.md#ampadddata)\> |
| `AmpAddMessage` | `Factory`<[`AmpAddMessage`](js_src.protobufs.md#ampaddmessage), { `signer?`: [`Ed25519Signer`](../classes/utils_src.Ed25519Signer.md)  }, [`AmpAddMessage`](js_src.protobufs.md#ampaddmessage)\> |
| `AmpBody` | `Factory`<[`AmpBody`](js_src.protobufs.md#ampbody), `any`, [`AmpBody`](js_src.protobufs.md#ampbody)\> |
| `AmpRemoveData` | `Factory`<[`AmpRemoveData`](js_src.protobufs.md#ampremovedata), `any`, [`AmpRemoveData`](js_src.protobufs.md#ampremovedata)\> |
| `AmpRemoveMessage` | `Factory`<[`AmpRemoveMessage`](js_src.protobufs.md#ampremovemessage), { `signer?`: [`Ed25519Signer`](../classes/utils_src.Ed25519Signer.md)  }, [`AmpRemoveMessage`](js_src.protobufs.md#ampremovemessage)\> |
| `BlockHash` | `Factory`<`Uint8Array`, `any`, `Uint8Array`\> |
| `BlockHashHex` | `Factory`<`string`, `any`, `string`\> |
| `Bytes` | `Factory`<`Uint8Array`, { `length?`: `number`  }, `Uint8Array`\> |
| `CastAddBody` | `Factory`<[`CastAddBody`](js_src.protobufs.md#castaddbody), `any`, [`CastAddBody`](js_src.protobufs.md#castaddbody)\> |
| `CastAddData` | `Factory`<[`CastAddData`](js_src.protobufs.md#castadddata), `any`, [`CastAddData`](js_src.protobufs.md#castadddata)\> |
| `CastAddMessage` | `Factory`<[`CastAddMessage`](js_src.protobufs.md#castaddmessage), { `signer?`: [`Ed25519Signer`](../classes/utils_src.Ed25519Signer.md)  }, [`CastAddMessage`](js_src.protobufs.md#castaddmessage)\> |
| `CastId` | `Factory`<[`CastId`](js_src.protobufs.md#castid), `any`, [`CastId`](js_src.protobufs.md#castid)\> |
| `CastRemoveBody` | `Factory`<[`CastRemoveBody`](js_src.protobufs.md#castremovebody), `any`, [`CastRemoveBody`](js_src.protobufs.md#castremovebody)\> |
| `CastRemoveData` | `Factory`<[`CastRemoveData`](js_src.protobufs.md#castremovedata), `any`, [`CastRemoveData`](js_src.protobufs.md#castremovedata)\> |
| `CastRemoveMessage` | `Factory`<[`CastRemoveMessage`](js_src.protobufs.md#castremovemessage), { `signer?`: [`Ed25519Signer`](../classes/utils_src.Ed25519Signer.md)  }, [`CastRemoveMessage`](js_src.protobufs.md#castremovemessage)\> |
| `Ed25519PrivateKey` | `Factory`<`Uint8Array`, `any`, `Uint8Array`\> |
| `Ed25519PublicKeyHex` | `Factory`<`string`, `any`, `string`\> |
| `Ed25519Signature` | `Factory`<`Uint8Array`, `any`, `Uint8Array`\> |
| `Ed25519SignatureHex` | `Factory`<`string`, `any`, `string`\> |
| `Ed25519Signer` | `Factory`<[`Ed25519Signer`](../classes/utils_src.Ed25519Signer.md), `any`, [`Ed25519Signer`](../classes/utils_src.Ed25519Signer.md)\> |
| `Eip712Signature` | `Factory`<`Uint8Array`, `any`, `Uint8Array`\> |
| `Eip712SignatureHex` | `Factory`<`string`, `any`, `string`\> |
| `Eip712Signer` | `Factory`<[`Eip712Signer`](../classes/utils_src.Eip712Signer.md), `any`, [`Eip712Signer`](../classes/utils_src.Eip712Signer.md)\> |
| `EthAddress` | `Factory`<`Uint8Array`, `any`, `Uint8Array`\> |
| `EthAddressHex` | `Factory`<`string`, `any`, `string`\> |
| `FarcasterNetwork` | `Factory`<[`FarcasterNetwork`](../enums/js_src.protobufs.FarcasterNetwork.md), `any`, [`FarcasterNetwork`](../enums/js_src.protobufs.FarcasterNetwork.md)\> |
| `Fid` | `Factory`<`number`, `any`, `number`\> |
| `Fname` | `Factory`<`Uint8Array`, `any`, `Uint8Array`\> |
| `IdRegistryEvent` | `Factory`<[`IdRegistryEvent`](js_src.protobufs.md#idregistryevent), `any`, [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)\> |
| `IdRegistryEventType` | `Factory`<[`IdRegistryEventType`](../enums/js_src.protobufs.IdRegistryEventType.md), `any`, [`IdRegistryEventType`](../enums/js_src.protobufs.IdRegistryEventType.md)\> |
| `Message` | `Factory`<[`Message`](js_src.protobufs.md#message), { `signer?`: [`Ed25519Signer`](../classes/utils_src.Ed25519Signer.md) \| [`Eip712Signer`](../classes/utils_src.Eip712Signer.md)  }, [`Message`](js_src.protobufs.md#message)\> |
| `MessageData` | `Factory`<[`MessageData`](js_src.protobufs.md#messagedata), `any`, [`MessageData`](js_src.protobufs.md#messagedata)\> |
| `MessageHash` | `Factory`<`Uint8Array`, `any`, `Uint8Array`\> |
| `MessageHashHex` | `Factory`<`string`, `any`, `string`\> |
| `MessageType` | `Factory`<[`MessageType`](../enums/js_src.protobufs.MessageType.md), `any`, [`MessageType`](../enums/js_src.protobufs.MessageType.md)\> |
| `NameRegistryEvent` | `Factory`<[`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent), `any`, [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)\> |
| `NameRegistryEventType` | `Factory`<[`NameRegistryEventType`](../enums/js_src.protobufs.NameRegistryEventType.md), `any`, [`NameRegistryEventType`](../enums/js_src.protobufs.NameRegistryEventType.md)\> |
| `ReactionAddData` | `Factory`<[`ReactionAddData`](js_src.protobufs.md#reactionadddata), `any`, [`ReactionAddData`](js_src.protobufs.md#reactionadddata)\> |
| `ReactionAddMessage` | `Factory`<[`ReactionAddMessage`](js_src.protobufs.md#reactionaddmessage), { `signer?`: [`Ed25519Signer`](../classes/utils_src.Ed25519Signer.md)  }, [`ReactionAddMessage`](js_src.protobufs.md#reactionaddmessage)\> |
| `ReactionBody` | `Factory`<[`ReactionBody`](js_src.protobufs.md#reactionbody), `any`, [`ReactionBody`](js_src.protobufs.md#reactionbody)\> |
| `ReactionRemoveData` | `Factory`<[`ReactionRemoveData`](js_src.protobufs.md#reactionremovedata), `any`, [`ReactionRemoveData`](js_src.protobufs.md#reactionremovedata)\> |
| `ReactionRemoveMessage` | `Factory`<[`ReactionRemoveMessage`](js_src.protobufs.md#reactionremovemessage), { `signer?`: [`Ed25519Signer`](../classes/utils_src.Ed25519Signer.md)  }, [`ReactionRemoveMessage`](js_src.protobufs.md#reactionremovemessage)\> |
| `ReactionType` | `Factory`<[`ReactionType`](../enums/js_src.protobufs.ReactionType.md), `any`, [`ReactionType`](../enums/js_src.protobufs.ReactionType.md)\> |
| `SignerAddData` | `Factory`<[`SignerAddData`](js_src.protobufs.md#signeradddata), `any`, [`SignerAddData`](js_src.protobufs.md#signeradddata)\> |
| `SignerAddMessage` | `Factory`<[`SignerAddMessage`](js_src.protobufs.md#signeraddmessage), { `signer?`: [`Eip712Signer`](../classes/utils_src.Eip712Signer.md)  }, [`SignerAddMessage`](js_src.protobufs.md#signeraddmessage)\> |
| `SignerBody` | `Factory`<[`SignerBody`](js_src.protobufs.md#signerbody), `any`, [`SignerBody`](js_src.protobufs.md#signerbody)\> |
| `SignerRemoveData` | `Factory`<[`SignerRemoveData`](js_src.protobufs.md#signerremovedata), `any`, [`SignerRemoveData`](js_src.protobufs.md#signerremovedata)\> |
| `SignerRemoveMessage` | `Factory`<[`SignerRemoveMessage`](js_src.protobufs.md#signerremovemessage), { `signer?`: [`Eip712Signer`](../classes/utils_src.Eip712Signer.md)  }, [`SignerRemoveMessage`](js_src.protobufs.md#signerremovemessage)\> |
| `TransactionHash` | `Factory`<`Uint8Array`, `any`, `Uint8Array`\> |
| `TransactionHashHex` | `Factory`<`string`, `any`, `string`\> |
| `UserDataAddData` | `Factory`<[`UserDataAddData`](js_src.protobufs.md#userdataadddata), `any`, [`UserDataAddData`](js_src.protobufs.md#userdataadddata)\> |
| `UserDataAddMessage` | `Factory`<[`UserDataAddMessage`](js_src.protobufs.md#userdataaddmessage), { `signer?`: [`Ed25519Signer`](../classes/utils_src.Ed25519Signer.md)  }, [`UserDataAddMessage`](js_src.protobufs.md#userdataaddmessage)\> |
| `UserDataBody` | `Factory`<[`UserDataBody`](js_src.protobufs.md#userdatabody), `any`, [`UserDataBody`](js_src.protobufs.md#userdatabody)\> |
| `VerificationAddEthAddressBody` | `Factory`<[`VerificationAddEthAddressBody`](js_src.protobufs.md#verificationaddethaddressbody), { `ethSigner?`: [`Eip712Signer`](../classes/utils_src.Eip712Signer.md) ; `fid?`: `number` ; `network?`: [`FarcasterNetwork`](../enums/js_src.protobufs.FarcasterNetwork.md)  }, [`VerificationAddEthAddressBody`](js_src.protobufs.md#verificationaddethaddressbody)\> |
| `VerificationAddEthAddressData` | `Factory`<[`VerificationAddEthAddressData`](js_src.protobufs.md#verificationaddethaddressdata), { `ethSigner?`: [`Eip712Signer`](../classes/utils_src.Eip712Signer.md)  }, [`VerificationAddEthAddressData`](js_src.protobufs.md#verificationaddethaddressdata)\> |
| `VerificationAddEthAddressMessage` | `Factory`<[`VerificationAddEthAddressMessage`](js_src.protobufs.md#verificationaddethaddressmessage), { `ethSigner?`: [`Eip712Signer`](../classes/utils_src.Eip712Signer.md) ; `signer?`: [`Ed25519Signer`](../classes/utils_src.Ed25519Signer.md)  }, [`VerificationAddEthAddressMessage`](js_src.protobufs.md#verificationaddethaddressmessage)\> |
| `VerificationEthAddressClaim` | `Factory`<[`VerificationEthAddressClaim`](utils_src.md#verificationethaddressclaim), { `signer?`: [`Eip712Signer`](../classes/utils_src.Eip712Signer.md)  }, [`VerificationEthAddressClaim`](utils_src.md#verificationethaddressclaim)\> |
| `VerificationRemoveBody` | `Factory`<[`VerificationRemoveBody`](js_src.protobufs.md#verificationremovebody), `any`, [`VerificationRemoveBody`](js_src.protobufs.md#verificationremovebody)\> |
| `VerificationRemoveData` | `Factory`<[`VerificationRemoveData`](js_src.protobufs.md#verificationremovedata), `any`, [`VerificationRemoveData`](js_src.protobufs.md#verificationremovedata)\> |
| `VerificationRemoveMessage` | `Factory`<[`VerificationRemoveMessage`](js_src.protobufs.md#verificationremovemessage), { `signer?`: [`Ed25519Signer`](../classes/utils_src.Ed25519Signer.md)  }, [`VerificationRemoveMessage`](js_src.protobufs.md#verificationremovemessage)\> |

#### Defined in

[utils/src/factories.ts:600](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/factories.ts#L600)

## Functions

### bigNumberToBytes

▸ **bigNumberToBytes**(`value`): [`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `BigNumber` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Defined in

[utils/src/bytes.ts:92](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/bytes.ts#L92)

___

### bytesCompare

▸ **bytesCompare**(`a`, `b`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `a` | `Uint8Array` |
| `b` | `Uint8Array` |

#### Returns

`number`

#### Defined in

[utils/src/bytes.ts:7](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/bytes.ts#L7)

___

### bytesDecrement

▸ **bytesDecrement**(`inputBytes`): [`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `inputBytes` | `Uint8Array` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Defined in

[utils/src/bytes.ts:46](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/bytes.ts#L46)

___

### bytesIncrement

▸ **bytesIncrement**(`inputBytes`): [`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `inputBytes` | `Uint8Array` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Defined in

[utils/src/bytes.ts:28](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/bytes.ts#L28)

___

### bytesToBigNumber

▸ **bytesToBigNumber**(`bytes`): [`HubResult`](utils_src.md#hubresult)<`BigNumber`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bytes` | `Uint8Array` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`BigNumber`\>

#### Defined in

[utils/src/bytes.ts:96](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/bytes.ts#L96)

___

### bytesToHexString

▸ **bytesToHexString**(`bytes`): [`HubResult`](utils_src.md#hubresult)<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bytes` | `Uint8Array` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`string`\>

#### Defined in

[utils/src/bytes.ts:68](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/bytes.ts#L68)

___

### bytesToUtf8String

▸ **bytesToUtf8String**(`bytes`): [`HubResult`](utils_src.md#hubresult)<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `bytes` | `Uint8Array` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`string`\>

#### Defined in

[utils/src/bytes.ts:82](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/bytes.ts#L82)

___

### fromFarcasterTime

▸ **fromFarcasterTime**(`time`): [`HubResult`](utils_src.md#hubresult)<`number`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `time` | `number` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`number`\>

#### Defined in

[utils/src/time.ts:20](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/time.ts#L20)

___

### getFarcasterTime

▸ **getFarcasterTime**(): [`HubResult`](utils_src.md#hubresult)<`number`\>

#### Returns

[`HubResult`](utils_src.md#hubresult)<`number`\>

#### Defined in

[utils/src/time.ts:5](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/time.ts#L5)

___

### getHubRpcClient

▸ **getHubRpcClient**(`address`): [`HubRpcClient`](utils_src.md#hubrpcclient)

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Returns

[`HubRpcClient`](utils_src.md#hubrpcclient)

#### Defined in

[utils/src/client.ts:113](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/client.ts#L113)

___

### hexStringToBytes

▸ **hexStringToBytes**(`hex`): [`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hex` | `string` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Defined in

[utils/src/bytes.ts:75](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/bytes.ts#L75)

___

### isHubError

▸ **isHubError**(`e`): e is HubError

#### Parameters

| Name | Type |
| :------ | :------ |
| `e` | `any` |

#### Returns

e is HubError

#### Defined in

[utils/src/errors.ts:9](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/errors.ts#L9)

___

### makeVerificationEthAddressClaim

▸ **makeVerificationEthAddressClaim**(`fid`, `ethAddress`, `network`, `blockHash`): [`HubResult`](utils_src.md#hubresult)<[`VerificationEthAddressClaim`](utils_src.md#verificationethaddressclaim)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `ethAddress` | `Uint8Array` |
| `network` | [`FarcasterNetwork`](../enums/js_src.protobufs.FarcasterNetwork.md) |
| `blockHash` | `Uint8Array` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<[`VerificationEthAddressClaim`](utils_src.md#verificationethaddressclaim)\>

#### Defined in

[utils/src/verifications.ts:15](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/verifications.ts#L15)

___

### toFarcasterTime

▸ **toFarcasterTime**(`time`): [`HubResult`](utils_src.md#hubresult)<`number`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `time` | `number` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`number`\>

#### Defined in

[utils/src/time.ts:9](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/time.ts#L9)

___

### utf8StringToBytes

▸ **utf8StringToBytes**(`utf8`): [`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `utf8` | `string` |

#### Returns

[`HubResult`](utils_src.md#hubresult)<`Uint8Array`\>

#### Defined in

[utils/src/bytes.ts:87](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/bytes.ts#L87)
