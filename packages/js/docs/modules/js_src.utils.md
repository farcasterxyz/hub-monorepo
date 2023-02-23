[hubble](../README.md) / [Modules](../modules.md) / [js/src](js_src.md) / utils

# Namespace: utils

[js/src](js_src.md).utils

## Table of contents

### Functions

- [deserializeAmpBody](js_src.utils.md#deserializeampbody)
- [deserializeBlockHash](js_src.utils.md#deserializeblockhash)
- [deserializeCastAddBody](js_src.utils.md#deserializecastaddbody)
- [deserializeCastId](js_src.utils.md#deserializecastid)
- [deserializeCastRemoveBody](js_src.utils.md#deserializecastremovebody)
- [deserializeEd25519PublicKey](js_src.utils.md#deserializeed25519publickey)
- [deserializeEd25519Signature](js_src.utils.md#deserializeed25519signature)
- [deserializeEip712Signature](js_src.utils.md#deserializeeip712signature)
- [deserializeEthAddress](js_src.utils.md#deserializeethaddress)
- [deserializeEventResponse](js_src.utils.md#deserializeeventresponse)
- [deserializeFname](js_src.utils.md#deserializefname)
- [deserializeIdRegistryEvent](js_src.utils.md#deserializeidregistryevent)
- [deserializeMessage](js_src.utils.md#deserializemessage)
- [deserializeMessageData](js_src.utils.md#deserializemessagedata)
- [deserializeMessageHash](js_src.utils.md#deserializemessagehash)
- [deserializeNameRegistryEvent](js_src.utils.md#deserializenameregistryevent)
- [deserializeReactionBody](js_src.utils.md#deserializereactionbody)
- [deserializeSignerBody](js_src.utils.md#deserializesignerbody)
- [deserializeTransactionHash](js_src.utils.md#deserializetransactionhash)
- [deserializeUserDataBody](js_src.utils.md#deserializeuserdatabody)
- [deserializeVerificationAddEthAddressBody](js_src.utils.md#deserializeverificationaddethaddressbody)
- [deserializeVerificationRemoveBody](js_src.utils.md#deserializeverificationremovebody)
- [serializeAmpBody](js_src.utils.md#serializeampbody)
- [serializeBlockHash](js_src.utils.md#serializeblockhash)
- [serializeCastAddBody](js_src.utils.md#serializecastaddbody)
- [serializeCastId](js_src.utils.md#serializecastid)
- [serializeCastRemoveBody](js_src.utils.md#serializecastremovebody)
- [serializeEd25519PublicKey](js_src.utils.md#serializeed25519publickey)
- [serializeEip712Signature](js_src.utils.md#serializeeip712signature)
- [serializeEthAddress](js_src.utils.md#serializeethaddress)
- [serializeFname](js_src.utils.md#serializefname)
- [serializeMessageHash](js_src.utils.md#serializemessagehash)
- [serializeReactionBody](js_src.utils.md#serializereactionbody)
- [serializeSignerBody](js_src.utils.md#serializesignerbody)
- [serializeUserDataBody](js_src.utils.md#serializeuserdatabody)
- [serializeVerificationAddEthAddressBody](js_src.utils.md#serializeverificationaddethaddressbody)
- [serializeVerificationRemoveBody](js_src.utils.md#serializeverificationremovebody)

## Functions

### deserializeAmpBody

▸ **deserializeAmpBody**(`protobuf`): `HubResult`<[`AmpBody`](js_src.types.md#ampbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`AmpBody`](js_src.protobufs.md#ampbody) |

#### Returns

`HubResult`<[`AmpBody`](js_src.types.md#ampbody)\>

#### Defined in

[js/src/utils.ts:283](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L283)

___

### deserializeBlockHash

▸ **deserializeBlockHash**(`bytes`): `HubResult`<`string`\>

Deserialize a block hash from a byte array to hex string.

#### Parameters

| Name | Type |
| :------ | :------ |
| `bytes` | `Uint8Array` |

#### Returns

`HubResult`<`string`\>

#### Defined in

[js/src/utils.ts:408](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L408)

___

### deserializeCastAddBody

▸ **deserializeCastAddBody**(`protobuf`): `HubResult`<[`CastAddBody`](js_src.types.md#castaddbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`CastAddBody`](js_src.protobufs.md#castaddbody) |

#### Returns

`HubResult`<[`CastAddBody`](js_src.types.md#castaddbody)\>

#### Defined in

[js/src/utils.ts:211](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L211)

___

### deserializeCastId

▸ **deserializeCastId**(`protobuf`): `HubResult`<[`CastId`](js_src.types.md#castid)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`CastId`](js_src.protobufs.md#castid) |

#### Returns

`HubResult`<[`CastId`](js_src.types.md#castid)\>

#### Defined in

[js/src/utils.ts:380](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L380)

___

### deserializeCastRemoveBody

▸ **deserializeCastRemoveBody**(`protobuf`): `HubResult`<[`CastRemoveBody`](js_src.types.md#castremovebody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`CastRemoveBody`](js_src.protobufs.md#castremovebody) |

#### Returns

`HubResult`<[`CastRemoveBody`](js_src.types.md#castremovebody)\>

#### Defined in

[js/src/utils.ts:243](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L243)

___

### deserializeEd25519PublicKey

▸ **deserializeEd25519PublicKey**(`publicKey`): `HubResult`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `publicKey` | `Uint8Array` |

#### Returns

`HubResult`<`string`\>

#### Defined in

[js/src/utils.ts:477](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L477)

___

### deserializeEd25519Signature

▸ **deserializeEd25519Signature**(`bytes`): `HubResult`<`string`\>

Deserialize an Ed25519 signature from a byte array to hex string.

#### Parameters

| Name | Type |
| :------ | :------ |
| `bytes` | `Uint8Array` |

#### Returns

`HubResult`<`string`\>

#### Defined in

[js/src/utils.ts:443](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L443)

___

### deserializeEip712Signature

▸ **deserializeEip712Signature**(`bytes`): `HubResult`<`string`\>

Deserialize an EIP-712 signature from a byte array to hex string.

#### Parameters

| Name | Type |
| :------ | :------ |
| `bytes` | `Uint8Array` |

#### Returns

`HubResult`<`string`\>

#### Defined in

[js/src/utils.ts:429](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L429)

___

### deserializeEthAddress

▸ **deserializeEthAddress**(`ethAddress`): `HubResult`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `ethAddress` | `Uint8Array` |

#### Returns

`HubResult`<`string`\>

#### Defined in

[js/src/utils.ts:466](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L466)

___

### deserializeEventResponse

▸ **deserializeEventResponse**(`protobuf`): `HubResult`<[`EventResponse`](js_src.types.md#eventresponse)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`EventResponse`](js_src.protobufs.md#eventresponse) |

#### Returns

`HubResult`<[`EventResponse`](js_src.types.md#eventresponse)\>

#### Defined in

[js/src/utils.ts:19](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L19)

___

### deserializeFname

▸ **deserializeFname**(`fname`): `HubResult`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fname` | `Uint8Array` |

#### Returns

`HubResult`<`string`\>

#### Defined in

[js/src/utils.ts:458](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L458)

___

### deserializeIdRegistryEvent

▸ **deserializeIdRegistryEvent**(`protobuf`): `HubResult`<`Readonly`<{ `_protobuf`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `fid`: `number` ; `from`: `undefined` \| `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`IdRegistryEventType`](../enums/js_src.protobufs.IdRegistryEventType.md)  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) |

#### Returns

`HubResult`<`Readonly`<{ `_protobuf`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `fid`: `number` ; `from`: `undefined` \| `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`IdRegistryEventType`](../enums/js_src.protobufs.IdRegistryEventType.md)  }\>\>

#### Defined in

[js/src/utils.ts:102](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L102)

___

### deserializeMessage

▸ **deserializeMessage**(`protobuf`): `HubResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`MessageBody`](js_src.types.md#messagebody), [`MessageType`](../enums/js_src.protobufs.MessageType.md)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`Message`](js_src.protobufs.md#message) |

#### Returns

`HubResult`<`Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: [`MessageData`](js_src.types.md#messagedata)<[`MessageBody`](js_src.types.md#messagebody), [`MessageType`](../enums/js_src.protobufs.MessageType.md)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Defined in

[js/src/utils.ts:134](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L134)

___

### deserializeMessageData

▸ **deserializeMessageData**(`protobuf`): `HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`MessageBody`](js_src.types.md#messagebody), [`MessageType`](../enums/js_src.protobufs.MessageType.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`MessageData`](js_src.protobufs.md#messagedata) |

#### Returns

`HubResult`<[`MessageData`](js_src.types.md#messagedata)<[`MessageBody`](js_src.types.md#messagebody), [`MessageType`](../enums/js_src.protobufs.MessageType.md)\>\>

#### Defined in

[js/src/utils.ts:162](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L162)

___

### deserializeMessageHash

▸ **deserializeMessageHash**(`bytes`): `HubResult`<`string`\>

Deserialize a message hash from a byte array to hex string.

#### Parameters

| Name | Type |
| :------ | :------ |
| `bytes` | `Uint8Array` |

#### Returns

`HubResult`<`string`\>

#### Defined in

[js/src/utils.ts:450](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L450)

___

### deserializeNameRegistryEvent

▸ **deserializeNameRegistryEvent**(`protobuf`): `HubResult`<`Readonly`<{ `_protobuf`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `expiry`: `undefined` \| `number` ; `fname`: `string` ; `from`: `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`NameRegistryEventType`](../enums/js_src.protobufs.NameRegistryEventType.md)  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) |

#### Returns

`HubResult`<`Readonly`<{ `_protobuf`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `expiry`: `undefined` \| `number` ; `fname`: `string` ; `from`: `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`NameRegistryEventType`](../enums/js_src.protobufs.NameRegistryEventType.md)  }\>\>

#### Defined in

[js/src/utils.ts:65](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L65)

___

### deserializeReactionBody

▸ **deserializeReactionBody**(`protobuf`): `HubResult`<[`ReactionBody`](js_src.types.md#reactionbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`ReactionBody`](js_src.protobufs.md#reactionbody) |

#### Returns

`HubResult`<[`ReactionBody`](js_src.types.md#reactionbody)\>

#### Defined in

[js/src/utils.ts:358](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L358)

___

### deserializeSignerBody

▸ **deserializeSignerBody**(`protobuf`): `HubResult`<[`SignerBody`](js_src.types.md#signerbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`SignerBody`](js_src.protobufs.md#signerbody) |

#### Returns

`HubResult`<[`SignerBody`](js_src.types.md#signerbody)\>

#### Defined in

[js/src/utils.ts:291](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L291)

___

### deserializeTransactionHash

▸ **deserializeTransactionHash**(`bytes`): `HubResult`<`string`\>

Deserialize a transaction hash from a byte array to hex string.

#### Parameters

| Name | Type |
| :------ | :------ |
| `bytes` | `Uint8Array` |

#### Returns

`HubResult`<`string`\>

#### Defined in

[js/src/utils.ts:422](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L422)

___

### deserializeUserDataBody

▸ **deserializeUserDataBody**(`protobuf`): `HubResult`<[`UserDataBody`](js_src.types.md#userdatabody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`UserDataBody`](js_src.protobufs.md#userdatabody) |

#### Returns

`HubResult`<[`UserDataBody`](js_src.types.md#userdatabody)\>

#### Defined in

[js/src/utils.ts:347](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L347)

___

### deserializeVerificationAddEthAddressBody

▸ **deserializeVerificationAddEthAddressBody**(`protobuf`): `HubResult`<[`VerificationAddEthAddressBody`](js_src.types.md#verificationaddethaddressbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`VerificationAddEthAddressBody`](js_src.protobufs.md#verificationaddethaddressbody) |

#### Returns

`HubResult`<[`VerificationAddEthAddressBody`](js_src.types.md#verificationaddethaddressbody)\>

#### Defined in

[js/src/utils.ts:261](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L261)

___

### deserializeVerificationRemoveBody

▸ **deserializeVerificationRemoveBody**(`protobuf`): `HubResult`<[`VerificationRemoveBody`](js_src.types.md#verificationremovebody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`VerificationRemoveBody`](js_src.protobufs.md#verificationremovebody) |

#### Returns

`HubResult`<[`VerificationRemoveBody`](js_src.types.md#verificationremovebody)\>

#### Defined in

[js/src/utils.ts:329](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L329)

___

### serializeAmpBody

▸ **serializeAmpBody**(`body`): `HubResult`<[`AmpBody`](js_src.protobufs.md#ampbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`AmpBody`](js_src.types.md#ampbody) |

#### Returns

`HubResult`<[`AmpBody`](js_src.protobufs.md#ampbody)\>

#### Defined in

[js/src/utils.ts:287](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L287)

___

### serializeBlockHash

▸ **serializeBlockHash**(`hash`): `HubResult`<`Uint8Array`\>

Serializes a block hash from a hex string to byte array.

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `string` |

#### Returns

`HubResult`<`Uint8Array`\>

#### Defined in

[js/src/utils.ts:415](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L415)

___

### serializeCastAddBody

▸ **serializeCastAddBody**(`body`): `HubResult`<[`CastAddBody`](js_src.protobufs.md#castaddbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`CastAddBody`](js_src.types.md#castaddbody) |

#### Returns

`HubResult`<[`CastAddBody`](js_src.protobufs.md#castaddbody)\>

#### Defined in

[js/src/utils.ts:226](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L226)

___

### serializeCastId

▸ **serializeCastId**(`castId`): `HubResult`<[`CastId`](js_src.protobufs.md#castid)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `castId` | [`CastId`](js_src.types.md#castid) |

#### Returns

`HubResult`<[`CastId`](js_src.protobufs.md#castid)\>

#### Defined in

[js/src/utils.ts:392](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L392)

___

### serializeCastRemoveBody

▸ **serializeCastRemoveBody**(`body`): `HubResult`<[`CastRemoveBody`](js_src.protobufs.md#castremovebody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`CastRemoveBody`](js_src.types.md#castremovebody) |

#### Returns

`HubResult`<[`CastRemoveBody`](js_src.protobufs.md#castremovebody)\>

#### Defined in

[js/src/utils.ts:252](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L252)

___

### serializeEd25519PublicKey

▸ **serializeEd25519PublicKey**(`publicKey`): `HubResult`<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `publicKey` | `string` |

#### Returns

`HubResult`<`Uint8Array`\>

#### Defined in

[js/src/utils.ts:481](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L481)

___

### serializeEip712Signature

▸ **serializeEip712Signature**(`hash`): `HubResult`<`Uint8Array`\>

Serializes an EIP-712 from a hex string to byte array.

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `string` |

#### Returns

`HubResult`<`Uint8Array`\>

#### Defined in

[js/src/utils.ts:436](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L436)

___

### serializeEthAddress

▸ **serializeEthAddress**(`ethAddress`): `HubResult`<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `ethAddress` | `string` |

#### Returns

`HubResult`<`Uint8Array`\>

#### Defined in

[js/src/utils.ts:470](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L470)

___

### serializeFname

▸ **serializeFname**(`fname`): `HubResult`<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fname` | `string` |

#### Returns

`HubResult`<`Uint8Array`\>

#### Defined in

[js/src/utils.ts:462](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L462)

___

### serializeMessageHash

▸ **serializeMessageHash**(`hash`): `HubResult`<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `string` |

#### Returns

`HubResult`<`Uint8Array`\>

#### Defined in

[js/src/utils.ts:454](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L454)

___

### serializeReactionBody

▸ **serializeReactionBody**(`body`): `HubResult`<[`ReactionBody`](js_src.protobufs.md#reactionbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`ReactionBody`](js_src.types.md#reactionbody) |

#### Returns

`HubResult`<[`ReactionBody`](js_src.protobufs.md#reactionbody)\>

#### Defined in

[js/src/utils.ts:372](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L372)

___

### serializeSignerBody

▸ **serializeSignerBody**(`body`): `HubResult`<[`SignerBody`](js_src.protobufs.md#signerbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`SignerBody`](js_src.types.md#signerbody) |

#### Returns

`HubResult`<[`SignerBody`](js_src.protobufs.md#signerbody)\>

#### Defined in

[js/src/utils.ts:302](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L302)

___

### serializeUserDataBody

▸ **serializeUserDataBody**(`body`): `HubResult`<[`UserDataBody`](js_src.protobufs.md#userdatabody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`UserDataBody`](js_src.types.md#userdatabody) |

#### Returns

`HubResult`<[`UserDataBody`](js_src.protobufs.md#userdatabody)\>

#### Defined in

[js/src/utils.ts:354](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L354)

___

### serializeVerificationAddEthAddressBody

▸ **serializeVerificationAddEthAddressBody**(`body`): `HubResult`<[`VerificationAddEthAddressBody`](js_src.protobufs.md#verificationaddethaddressbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`VerificationAddEthAddressBody`](js_src.types.md#verificationaddethaddressbody) |

#### Returns

`HubResult`<[`VerificationAddEthAddressBody`](js_src.protobufs.md#verificationaddethaddressbody)\>

#### Defined in

[js/src/utils.ts:311](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L311)

___

### serializeVerificationRemoveBody

▸ **serializeVerificationRemoveBody**(`body`): `HubResult`<[`VerificationRemoveBody`](js_src.protobufs.md#verificationremovebody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`VerificationRemoveBody`](js_src.types.md#verificationremovebody) |

#### Returns

`HubResult`<[`VerificationRemoveBody`](js_src.protobufs.md#verificationremovebody)\>

#### Defined in

[js/src/utils.ts:339](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/utils.ts#L339)
