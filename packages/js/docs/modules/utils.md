[@farcaster/js](../README.md) / [Exports](../modules.md) / utils

# Namespace: utils

## Table of contents

### Functions

- [deserializeBlockHash](utils.md#deserializeblockhash)
- [deserializeCastAddBody](utils.md#deserializecastaddbody)
- [deserializeCastId](utils.md#deserializecastid)
- [deserializeCastRemoveBody](utils.md#deserializecastremovebody)
- [deserializeEd25519PublicKey](utils.md#deserializeed25519publickey)
- [deserializeEd25519Signature](utils.md#deserializeed25519signature)
- [deserializeEip712Signature](utils.md#deserializeeip712signature)
- [deserializeEthAddress](utils.md#deserializeethaddress)
- [deserializeFname](utils.md#deserializefname)
- [deserializeHubEvent](utils.md#deserializehubevent)
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

### deserializeBlockHash

▸ **deserializeBlockHash**(`bytes`)

Deserialize a block hash from a byte array to hex string.

#### Parameters

| Name | Type |
| :------ | :------ |
| `bytes` | `Uint8Array` |

___

### deserializeCastAddBody

▸ **deserializeCastAddBody**(`protobuf`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`CastAddBody`](protobufs.md#castaddbody) |

___

### deserializeCastId

▸ **deserializeCastId**(`protobuf`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`CastId`](protobufs.md#castid) |

___

### deserializeCastRemoveBody

▸ **deserializeCastRemoveBody**(`protobuf`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`CastRemoveBody`](protobufs.md#castremovebody) |

___

### deserializeEd25519PublicKey

▸ **deserializeEd25519PublicKey**(`publicKey`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `publicKey` | `Uint8Array` |

___

### deserializeEd25519Signature

▸ **deserializeEd25519Signature**(`bytes`)

Deserialize an Ed25519 signature from a byte array to hex string.

#### Parameters

| Name | Type |
| :------ | :------ |
| `bytes` | `Uint8Array` |

___

### deserializeEip712Signature

▸ **deserializeEip712Signature**(`bytes`)

Deserialize an EIP-712 signature from a byte array to hex string.

#### Parameters

| Name | Type |
| :------ | :------ |
| `bytes` | `Uint8Array` |

___

### deserializeEthAddress

▸ **deserializeEthAddress**(`ethAddress`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `ethAddress` | `Uint8Array` |

___

### deserializeFname

▸ **deserializeFname**(`fname`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `fname` | `Uint8Array` |

___

### deserializeHubEvent

▸ **deserializeHubEvent**(`protobuf`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`HubEvent`](protobufs.md#hubevent) |

___

### deserializeIdRegistryEvent

▸ **deserializeIdRegistryEvent**(`protobuf`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`IdRegistryEvent`](protobufs.md#idregistryevent) |

___

### deserializeMessage

▸ **deserializeMessage**(`protobuf`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`Message`](protobufs.md#message) |

___

### deserializeMessageData

▸ **deserializeMessageData**(`protobuf`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`MessageData`](protobufs.md#messagedata) |

___

### deserializeMessageHash

▸ **deserializeMessageHash**(`bytes`)

Deserialize a message hash from a byte array to hex string.

#### Parameters

| Name | Type |
| :------ | :------ |
| `bytes` | `Uint8Array` |

___

### deserializeNameRegistryEvent

▸ **deserializeNameRegistryEvent**(`protobuf`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`NameRegistryEvent`](protobufs.md#nameregistryevent) |

___

### deserializeReactionBody

▸ **deserializeReactionBody**(`protobuf`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`ReactionBody`](protobufs.md#reactionbody) |

___

### deserializeSignerBody

▸ **deserializeSignerBody**(`protobuf`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`SignerBody`](protobufs.md#signerbody) |

___

### deserializeTransactionHash

▸ **deserializeTransactionHash**(`bytes`)

Deserialize a transaction hash from a byte array to hex string.

#### Parameters

| Name | Type |
| :------ | :------ |
| `bytes` | `Uint8Array` |

___

### deserializeUserDataBody

▸ **deserializeUserDataBody**(`protobuf`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`UserDataBody`](protobufs.md#userdatabody) |

___

### deserializeVerificationAddEthAddressBody

▸ **deserializeVerificationAddEthAddressBody**(`protobuf`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`VerificationAddEthAddressBody`](protobufs.md#verificationaddethaddressbody) |

___

### deserializeVerificationRemoveBody

▸ **deserializeVerificationRemoveBody**(`protobuf`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `protobuf` | [`VerificationRemoveBody`](protobufs.md#verificationremovebody) |

___

### serializeBlockHash

▸ **serializeBlockHash**(`hash`)

Serializes a block hash from a hex string to byte array.

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `string` |

___

### serializeCastAddBody

▸ **serializeCastAddBody**(`body`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`CastAddBody`](types.md#castaddbody) |

___

### serializeCastId

▸ **serializeCastId**(`castId`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `castId` | [`CastId`](types.md#castid) |

___

### serializeCastRemoveBody

▸ **serializeCastRemoveBody**(`body`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`CastRemoveBody`](types.md#castremovebody) |

___

### serializeEd25519PublicKey

▸ **serializeEd25519PublicKey**(`publicKey`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `publicKey` | `string` |

___

### serializeEip712Signature

▸ **serializeEip712Signature**(`hash`)

Serializes an EIP-712 from a hex string to byte array.

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `string` |

___

### serializeEthAddress

▸ **serializeEthAddress**(`ethAddress`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `ethAddress` | `string` |

___

### serializeFname

▸ **serializeFname**(`fname`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `fname` | `string` |

___

### serializeMessageHash

▸ **serializeMessageHash**(`hash`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `hash` | `string` |

___

### serializeReactionBody

▸ **serializeReactionBody**(`body`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`ReactionBody`](types.md#reactionbody) |

___

### serializeSignerBody

▸ **serializeSignerBody**(`body`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`SignerBody`](types.md#signerbody) |

___

### serializeUserDataBody

▸ **serializeUserDataBody**(`body`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`UserDataBody`](types.md#userdatabody) |

___

### serializeVerificationAddEthAddressBody

▸ **serializeVerificationAddEthAddressBody**(`body`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`VerificationAddEthAddressBody`](types.md#verificationaddethaddressbody) |

___

### serializeVerificationRemoveBody

▸ **serializeVerificationRemoveBody**(`body`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | [`VerificationRemoveBody`](types.md#verificationremovebody) |
