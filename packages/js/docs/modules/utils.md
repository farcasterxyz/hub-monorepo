[@farcaster/js](../README.md) / [Exports](../modules.md) / utils

# Namespace: utils

## Table of contents

### Functions

- [deserializeAmpBody](utils.md#deserializeampbody)
- [deserializeBlockHash](utils.md#deserializeblockhash)
- [deserializeCastAddBody](utils.md#deserializecastaddbody)
- [deserializeCastId](utils.md#deserializecastid)
- [deserializeCastRemoveBody](utils.md#deserializecastremovebody)
- [deserializeEd25519PublicKey](utils.md#deserializeed25519publickey)
- [deserializeEd25519Signature](utils.md#deserializeed25519signature)
- [deserializeEip712Signature](utils.md#deserializeeip712signature)
- [deserializeEthAddress](utils.md#deserializeethaddress)
- [deserializeEventResponse](utils.md#deserializeeventresponse)
- [deserializeFname](utils.md#deserializefname)
- [deserializeIdRegistryEvent](utils.md#deserializeidregistryevent)
- [deserializeMessage](utils.md#deserializemessage)
- [deserializeMessageData](utils.md#deserializemessagedata)
- [deserializeMessageHash](utils.md#deserializemessagehash)
- [deserializeNameRegistryEvent](utils.md#deserializenameregistryevent)
- [deserializeReactionBody](utils.md#deserializereactionbody)
- [deserializeSignerBody](utils.md#deserializesignerbody)
- [deserializeTransactionHash](utils.md#deserializetransactionhash)
- [deserializeUserDataBody](utils.md#deserializeuserdatabody)
- [deserializeVerificationAddEthAddressBody](utils.md#deserializeverificationaddethaddressbody)
- [deserializeVerificationRemoveBody](utils.md#deserializeverificationremovebody)
- [serializeAmpBody](utils.md#serializeampbody)
- [serializeBlockHash](utils.md#serializeblockhash)
- [serializeCastAddBody](utils.md#serializecastaddbody)
- [serializeCastId](utils.md#serializecastid)
- [serializeCastRemoveBody](utils.md#serializecastremovebody)
- [serializeEd25519PublicKey](utils.md#serializeed25519publickey)
- [serializeEip712Signature](utils.md#serializeeip712signature)
- [serializeEthAddress](utils.md#serializeethaddress)
- [serializeFname](utils.md#serializefname)
- [serializeMessageHash](utils.md#serializemessagehash)
- [serializeReactionBody](utils.md#serializereactionbody)
- [serializeSignerBody](utils.md#serializesignerbody)
- [serializeUserDataBody](utils.md#serializeuserdatabody)
- [serializeVerificationAddEthAddressBody](utils.md#serializeverificationaddethaddressbody)
- [serializeVerificationRemoveBody](utils.md#serializeverificationremovebody)

## Functions

### deserializeAmpBody

▸ **deserializeAmpBody**(`protobuf`): `HubResult`<[`AmpBody`](types.md#ampbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`AmpBody`](protobufs.md#ampbody) |

#### Returns

`HubResult`<[`AmpBody`](types.md#ampbody)\>

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

___

### deserializeCastAddBody

▸ **deserializeCastAddBody**(`protobuf`): `HubResult`<[`CastAddBody`](types.md#castaddbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`CastAddBody`](protobufs.md#castaddbody) |

#### Returns

`HubResult`<[`CastAddBody`](types.md#castaddbody)\>

___

### deserializeCastId

▸ **deserializeCastId**(`protobuf`): `HubResult`<[`CastId`](types.md#castid)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`CastId`](protobufs.md#castid) |

#### Returns

`HubResult`<[`CastId`](types.md#castid)\>

___

### deserializeCastRemoveBody

▸ **deserializeCastRemoveBody**(`protobuf`): `HubResult`<[`CastRemoveBody`](types.md#castremovebody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`CastRemoveBody`](protobufs.md#castremovebody) |

#### Returns

`HubResult`<[`CastRemoveBody`](types.md#castremovebody)\>

___

### deserializeEd25519PublicKey

▸ **deserializeEd25519PublicKey**(`publicKey`): `HubResult`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `publicKey` | `Uint8Array` |

#### Returns

`HubResult`<`string`\>

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

___

### deserializeEthAddress

▸ **deserializeEthAddress**(`ethAddress`): `HubResult`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `ethAddress` | `Uint8Array` |

#### Returns

`HubResult`<`string`\>

___

### deserializeEventResponse

▸ **deserializeEventResponse**(`protobuf`): `HubResult`<[`EventResponse`](types.md#eventresponse)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`EventResponse`](protobufs.md#eventresponse) |

#### Returns

`HubResult`<[`EventResponse`](types.md#eventresponse)\>

___

### deserializeFname

▸ **deserializeFname**(`fname`): `HubResult`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fname` | `Uint8Array` |

#### Returns

`HubResult`<`string`\>

___

### deserializeIdRegistryEvent

▸ **deserializeIdRegistryEvent**(`protobuf`): `HubResult`<`Readonly`<{ `_protobuf`: [`IdRegistryEvent`](protobufs.md#idregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `fid`: `number` ; `from`: `undefined` \| `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`IdRegistryEventType`](../enums/protobufs.IdRegistryEventType.md)  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`IdRegistryEvent`](protobufs.md#idregistryevent) |

#### Returns

`HubResult`<`Readonly`<{ `_protobuf`: [`IdRegistryEvent`](protobufs.md#idregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `fid`: `number` ; `from`: `undefined` \| `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`IdRegistryEventType`](../enums/protobufs.IdRegistryEventType.md)  }\>\>

___

### deserializeMessage

▸ **deserializeMessage**(`protobuf`): `HubResult`<`Readonly`<{ `_protobuf`: [`Message`](protobufs.md#message) ; `data`: [`MessageData`](types.md#messagedata)<[`MessageBody`](types.md#messagebody), [`MessageType`](../enums/protobufs.MessageType.md)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`Message`](protobufs.md#message) |

#### Returns

`HubResult`<`Readonly`<{ `_protobuf`: [`Message`](protobufs.md#message) ; `data`: [`MessageData`](types.md#messagedata)<[`MessageBody`](types.md#messagebody), [`MessageType`](../enums/protobufs.MessageType.md)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

___

### deserializeMessageData

▸ **deserializeMessageData**(`protobuf`): `HubResult`<[`MessageData`](types.md#messagedata)<[`MessageBody`](types.md#messagebody), [`MessageType`](../enums/protobufs.MessageType.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`MessageData`](protobufs.md#messagedata) |

#### Returns

`HubResult`<[`MessageData`](types.md#messagedata)<[`MessageBody`](types.md#messagebody), [`MessageType`](../enums/protobufs.MessageType.md)\>\>

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

___

### deserializeNameRegistryEvent

▸ **deserializeNameRegistryEvent**(`protobuf`): `HubResult`<`Readonly`<{ `_protobuf`: [`NameRegistryEvent`](protobufs.md#nameregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `expiry`: `undefined` \| `number` ; `fname`: `string` ; `from`: `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`NameRegistryEventType`](../enums/protobufs.NameRegistryEventType.md)  }\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`NameRegistryEvent`](protobufs.md#nameregistryevent) |

#### Returns

`HubResult`<`Readonly`<{ `_protobuf`: [`NameRegistryEvent`](protobufs.md#nameregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `expiry`: `undefined` \| `number` ; `fname`: `string` ; `from`: `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`NameRegistryEventType`](../enums/protobufs.NameRegistryEventType.md)  }\>\>

___

### deserializeReactionBody

▸ **deserializeReactionBody**(`protobuf`): `HubResult`<[`ReactionBody`](types.md#reactionbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`ReactionBody`](protobufs.md#reactionbody) |

#### Returns

`HubResult`<[`ReactionBody`](types.md#reactionbody)\>

___

### deserializeSignerBody

▸ **deserializeSignerBody**(`protobuf`): `HubResult`<[`SignerBody`](types.md#signerbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`SignerBody`](protobufs.md#signerbody) |

#### Returns

`HubResult`<[`SignerBody`](types.md#signerbody)\>

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

___

### deserializeUserDataBody

▸ **deserializeUserDataBody**(`protobuf`): `HubResult`<[`UserDataBody`](types.md#userdatabody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`UserDataBody`](protobufs.md#userdatabody) |

#### Returns

`HubResult`<[`UserDataBody`](types.md#userdatabody)\>

___

### deserializeVerificationAddEthAddressBody

▸ **deserializeVerificationAddEthAddressBody**(`protobuf`): `HubResult`<[`VerificationAddEthAddressBody`](types.md#verificationaddethaddressbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`VerificationAddEthAddressBody`](protobufs.md#verificationaddethaddressbody) |

#### Returns

`HubResult`<[`VerificationAddEthAddressBody`](types.md#verificationaddethaddressbody)\>

___

### deserializeVerificationRemoveBody

▸ **deserializeVerificationRemoveBody**(`protobuf`): `HubResult`<[`VerificationRemoveBody`](types.md#verificationremovebody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`VerificationRemoveBody`](protobufs.md#verificationremovebody) |

#### Returns

`HubResult`<[`VerificationRemoveBody`](types.md#verificationremovebody)\>

___

### serializeAmpBody

▸ **serializeAmpBody**(`body`): `HubResult`<[`AmpBody`](protobufs.md#ampbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`AmpBody`](types.md#ampbody) |

#### Returns

`HubResult`<[`AmpBody`](protobufs.md#ampbody)\>

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

___

### serializeCastAddBody

▸ **serializeCastAddBody**(`body`): `HubResult`<[`CastAddBody`](protobufs.md#castaddbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`CastAddBody`](types.md#castaddbody) |

#### Returns

`HubResult`<[`CastAddBody`](protobufs.md#castaddbody)\>

___

### serializeCastId

▸ **serializeCastId**(`castId`): `HubResult`<[`CastId`](protobufs.md#castid)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `castId` | [`CastId`](types.md#castid) |

#### Returns

`HubResult`<[`CastId`](protobufs.md#castid)\>

___

### serializeCastRemoveBody

▸ **serializeCastRemoveBody**(`body`): `HubResult`<[`CastRemoveBody`](protobufs.md#castremovebody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`CastRemoveBody`](types.md#castremovebody) |

#### Returns

`HubResult`<[`CastRemoveBody`](protobufs.md#castremovebody)\>

___

### serializeEd25519PublicKey

▸ **serializeEd25519PublicKey**(`publicKey`): `HubResult`<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `publicKey` | `string` |

#### Returns

`HubResult`<`Uint8Array`\>

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

___

### serializeEthAddress

▸ **serializeEthAddress**(`ethAddress`): `HubResult`<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `ethAddress` | `string` |

#### Returns

`HubResult`<`Uint8Array`\>

___

### serializeFname

▸ **serializeFname**(`fname`): `HubResult`<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `fname` | `string` |

#### Returns

`HubResult`<`Uint8Array`\>

___

### serializeMessageHash

▸ **serializeMessageHash**(`hash`): `HubResult`<`Uint8Array`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `string` |

#### Returns

`HubResult`<`Uint8Array`\>

___

### serializeReactionBody

▸ **serializeReactionBody**(`body`): `HubResult`<[`ReactionBody`](protobufs.md#reactionbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`ReactionBody`](types.md#reactionbody) |

#### Returns

`HubResult`<[`ReactionBody`](protobufs.md#reactionbody)\>

___

### serializeSignerBody

▸ **serializeSignerBody**(`body`): `HubResult`<[`SignerBody`](protobufs.md#signerbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`SignerBody`](types.md#signerbody) |

#### Returns

`HubResult`<[`SignerBody`](protobufs.md#signerbody)\>

___

### serializeUserDataBody

▸ **serializeUserDataBody**(`body`): `HubResult`<[`UserDataBody`](protobufs.md#userdatabody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`UserDataBody`](types.md#userdatabody) |

#### Returns

`HubResult`<[`UserDataBody`](protobufs.md#userdatabody)\>

___

### serializeVerificationAddEthAddressBody

▸ **serializeVerificationAddEthAddressBody**(`body`): `HubResult`<[`VerificationAddEthAddressBody`](protobufs.md#verificationaddethaddressbody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`VerificationAddEthAddressBody`](types.md#verificationaddethaddressbody) |

#### Returns

`HubResult`<[`VerificationAddEthAddressBody`](protobufs.md#verificationaddethaddressbody)\>

___

### serializeVerificationRemoveBody

▸ **serializeVerificationRemoveBody**(`body`): `HubResult`<[`VerificationRemoveBody`](protobufs.md#verificationremovebody)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`VerificationRemoveBody`](types.md#verificationremovebody) |

#### Returns

`HubResult`<[`VerificationRemoveBody`](protobufs.md#verificationremovebody)\>
