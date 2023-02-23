[hubble](../README.md) / [Modules](../modules.md) / [js/src](js_src.md) / types

# Namespace: types

[js/src](js_src.md).types

## Table of contents

### References

- [FarcasterNetwork](js_src.types.md#farcasternetwork)
- [HashScheme](js_src.types.md#hashscheme)
- [MessageType](js_src.types.md#messagetype)
- [ReactionType](js_src.types.md#reactiontype)
- [SignatureScheme](js_src.types.md#signaturescheme)
- [UserDataType](js_src.types.md#userdatatype)

### Type Aliases

- [AmpAddData](js_src.types.md#ampadddata)
- [AmpAddMessage](js_src.types.md#ampaddmessage)
- [AmpBody](js_src.types.md#ampbody)
- [AmpRemoveData](js_src.types.md#ampremovedata)
- [AmpRemoveMessage](js_src.types.md#ampremovemessage)
- [CastAddBody](js_src.types.md#castaddbody)
- [CastAddData](js_src.types.md#castadddata)
- [CastAddMessage](js_src.types.md#castaddmessage)
- [CastId](js_src.types.md#castid)
- [CastRemoveBody](js_src.types.md#castremovebody)
- [CastRemoveData](js_src.types.md#castremovedata)
- [CastRemoveMessage](js_src.types.md#castremovemessage)
- [EventResponse](js_src.types.md#eventresponse)
- [IdRegistryEvent](js_src.types.md#idregistryevent)
- [IdRegistryEventResponse](js_src.types.md#idregistryeventresponse)
- [Message](js_src.types.md#message)
- [MessageBody](js_src.types.md#messagebody)
- [MessageData](js_src.types.md#messagedata)
- [MessageEventResponse](js_src.types.md#messageeventresponse)
- [NameRegistryEvent](js_src.types.md#nameregistryevent)
- [NameRegistryEventResponse](js_src.types.md#nameregistryeventresponse)
- [ReactionAddData](js_src.types.md#reactionadddata)
- [ReactionAddMessage](js_src.types.md#reactionaddmessage)
- [ReactionBody](js_src.types.md#reactionbody)
- [ReactionRemoveData](js_src.types.md#reactionremovedata)
- [ReactionRemoveMessage](js_src.types.md#reactionremovemessage)
- [SignerAddData](js_src.types.md#signeradddata)
- [SignerAddMessage](js_src.types.md#signeraddmessage)
- [SignerBody](js_src.types.md#signerbody)
- [SignerRemoveData](js_src.types.md#signerremovedata)
- [SignerRemoveMessage](js_src.types.md#signerremovemessage)
- [UserDataAddData](js_src.types.md#userdataadddata)
- [UserDataAddMessage](js_src.types.md#userdataaddmessage)
- [UserDataBody](js_src.types.md#userdatabody)
- [VerificationAddEthAddressBody](js_src.types.md#verificationaddethaddressbody)
- [VerificationAddEthAddressData](js_src.types.md#verificationaddethaddressdata)
- [VerificationAddEthAddressMessage](js_src.types.md#verificationaddethaddressmessage)
- [VerificationEthAddressClaim](js_src.types.md#verificationethaddressclaim)
- [VerificationRemoveBody](js_src.types.md#verificationremovebody)
- [VerificationRemoveData](js_src.types.md#verificationremovedata)
- [VerificationRemoveMessage](js_src.types.md#verificationremovemessage)

## References

### FarcasterNetwork

Re-exports [FarcasterNetwork](../enums/js_src.protobufs.FarcasterNetwork.md)

___

### HashScheme

Re-exports [HashScheme](../enums/js_src.protobufs.HashScheme.md)

___

### MessageType

Re-exports [MessageType](../enums/js_src.protobufs.MessageType.md)

___

### ReactionType

Re-exports [ReactionType](../enums/js_src.protobufs.ReactionType.md)

___

### SignatureScheme

Re-exports [SignatureScheme](../enums/js_src.protobufs.SignatureScheme.md)

___

### UserDataType

Re-exports [UserDataType](../enums/js_src.protobufs.UserDataType.md)

## Type Aliases

### AmpAddData

Ƭ **AmpAddData**: [`MessageData`](js_src.types.md#messagedata)<[`AmpBody`](js_src.types.md#ampbody), [`MESSAGE_TYPE_AMP_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_amp_add)\>

#### Defined in

[js/src/types.ts:36](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L36)

___

### AmpAddMessage

Ƭ **AmpAddMessage**: [`Message`](js_src.types.md#message)<[`AmpAddData`](js_src.types.md#ampadddata)\>

#### Defined in

[js/src/types.ts:54](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L54)

___

### AmpBody

Ƭ **AmpBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `targetFid` | `number` |

#### Defined in

[js/src/types.ts:94](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L94)

___

### AmpRemoveData

Ƭ **AmpRemoveData**: [`MessageData`](js_src.types.md#messagedata)<[`AmpBody`](js_src.types.md#ampbody), [`MESSAGE_TYPE_AMP_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_amp_remove)\>

#### Defined in

[js/src/types.ts:37](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L37)

___

### AmpRemoveMessage

Ƭ **AmpRemoveMessage**: [`Message`](js_src.types.md#message)<[`AmpRemoveData`](js_src.types.md#ampremovedata)\>

#### Defined in

[js/src/types.ts:55](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L55)

___

### CastAddBody

Ƭ **CastAddBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `embeds?` | `string`[] |
| `mentions?` | `number`[] |
| `mentionsPositions?` | `number`[] |
| `parent?` | [`CastId`](js_src.types.md#castid) |
| `text` | `string` |

#### Defined in

[js/src/types.ts:77](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L77)

___

### CastAddData

Ƭ **CastAddData**: [`MessageData`](js_src.types.md#messagedata)<[`CastAddBody`](js_src.types.md#castaddbody), [`MESSAGE_TYPE_CAST_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_cast_add)\>

#### Defined in

[js/src/types.ts:32](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L32)

___

### CastAddMessage

Ƭ **CastAddMessage**: [`Message`](js_src.types.md#message)<[`CastAddData`](js_src.types.md#castadddata)\>

#### Defined in

[js/src/types.ts:50](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L50)

___

### CastId

Ƭ **CastId**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `hash` | `string` |

#### Defined in

[js/src/types.ts:62](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L62)

___

### CastRemoveBody

Ƭ **CastRemoveBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `targetHash` | `string` |

#### Defined in

[js/src/types.ts:85](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L85)

___

### CastRemoveData

Ƭ **CastRemoveData**: [`MessageData`](js_src.types.md#messagedata)<[`CastRemoveBody`](js_src.types.md#castremovebody), [`MESSAGE_TYPE_CAST_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_cast_remove)\>

#### Defined in

[js/src/types.ts:33](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L33)

___

### CastRemoveMessage

Ƭ **CastRemoveMessage**: [`Message`](js_src.types.md#message)<[`CastRemoveData`](js_src.types.md#castremovedata)\>

#### Defined in

[js/src/types.ts:51](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L51)

___

### EventResponse

Ƭ **EventResponse**: [`NameRegistryEventResponse`](js_src.types.md#nameregistryeventresponse) \| [`IdRegistryEventResponse`](js_src.types.md#idregistryeventresponse) \| [`MessageEventResponse`](js_src.types.md#messageeventresponse)

#### Defined in

[js/src/types.ts:166](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L166)

___

### IdRegistryEvent

Ƭ **IdRegistryEvent**: `Readonly`<{ `_protobuf`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `fid`: `number` ; `from`: `string` \| `undefined` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`IdRegistryEventType`](../enums/js_src.protobufs.IdRegistryEventType.md)  }\>

#### Defined in

[js/src/types.ts:117](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L117)

___

### IdRegistryEventResponse

Ƭ **IdRegistryEventResponse**: `GenericEventResponse` & { `idRegistryEvent`: [`IdRegistryEvent`](js_src.types.md#idregistryevent) ; `type`: [`EVENT_TYPE_MERGE_ID_REGISTRY_EVENT`](../enums/js_src.protobufs.EventType.md#event_type_merge_id_registry_event)  }

#### Defined in

[js/src/types.ts:156](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L156)

___

### Message

Ƭ **Message**<`TData`\>: `Readonly`<{ `_protobuf`: [`Message`](js_src.protobufs.md#message) ; `data`: `TData` ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) ; `signer`: `string`  }\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TData` | [`MessageData`](js_src.types.md#messagedata) |

#### Defined in

[js/src/types.ts:13](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L13)

___

### MessageBody

Ƭ **MessageBody**: [`CastAddBody`](js_src.types.md#castaddbody) \| [`CastRemoveBody`](js_src.types.md#castremovebody) \| [`ReactionBody`](js_src.types.md#reactionbody) \| [`AmpBody`](js_src.types.md#ampbody) \| [`VerificationAddEthAddressBody`](js_src.types.md#verificationaddethaddressbody) \| [`VerificationRemoveBody`](js_src.types.md#verificationremovebody) \| [`SignerBody`](js_src.types.md#signerbody) \| [`UserDataBody`](js_src.types.md#userdatabody)

#### Defined in

[js/src/types.ts:67](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L67)

___

### MessageData

Ƭ **MessageData**<`TBody`, `TType`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TBody` | [`MessageBody`](js_src.types.md#messagebody) |
| `TType` | [`MessageType`](../enums/js_src.protobufs.MessageType.md) |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `_protobuf` | [`MessageData`](js_src.protobufs.md#messagedata) |
| `body` | `TBody` |
| `fid` | `number` |
| `network` | [`FarcasterNetwork`](../enums/js_src.protobufs.FarcasterNetwork.md) |
| `timestamp` | `number` |
| `type` | `TType` |

#### Defined in

[js/src/types.ts:23](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L23)

___

### MessageEventResponse

Ƭ **MessageEventResponse**: `GenericEventResponse` & { `deleted_messages?`: [`Message`](js_src.types.md#message)[] ; `message`: [`Message`](js_src.types.md#message) ; `type`: [`EVENT_TYPE_MERGE_MESSAGE`](../enums/js_src.protobufs.EventType.md#event_type_merge_message) \| [`EVENT_TYPE_PRUNE_MESSAGE`](../enums/js_src.protobufs.EventType.md#event_type_prune_message) \| [`EVENT_TYPE_REVOKE_MESSAGE`](../enums/js_src.protobufs.EventType.md#event_type_revoke_message)  }

#### Defined in

[js/src/types.ts:147](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L147)

___

### NameRegistryEvent

Ƭ **NameRegistryEvent**: `Readonly`<{ `_protobuf`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `expiry`: `number` \| `undefined` ; `fname`: `string` ; `from`: `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`NameRegistryEventType`](../enums/js_src.protobufs.NameRegistryEventType.md)  }\>

#### Defined in

[js/src/types.ts:129](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L129)

___

### NameRegistryEventResponse

Ƭ **NameRegistryEventResponse**: `GenericEventResponse` & { `nameRegistryEvent`: [`NameRegistryEvent`](js_src.types.md#nameregistryevent) ; `type`: [`EVENT_TYPE_MERGE_NAME_REGISTRY_EVENT`](../enums/js_src.protobufs.EventType.md#event_type_merge_name_registry_event)  }

#### Defined in

[js/src/types.ts:161](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L161)

___

### ReactionAddData

Ƭ **ReactionAddData**: [`MessageData`](js_src.types.md#messagedata)<[`ReactionBody`](js_src.types.md#reactionbody), [`MESSAGE_TYPE_REACTION_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_reaction_add)\>

#### Defined in

[js/src/types.ts:34](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L34)

___

### ReactionAddMessage

Ƭ **ReactionAddMessage**: [`Message`](js_src.types.md#message)<[`ReactionAddData`](js_src.types.md#reactionadddata)\>

#### Defined in

[js/src/types.ts:52](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L52)

___

### ReactionBody

Ƭ **ReactionBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `target` | [`CastId`](js_src.types.md#castid) |
| `type` | [`ReactionType`](../enums/js_src.protobufs.ReactionType.md) |

#### Defined in

[js/src/types.ts:89](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L89)

___

### ReactionRemoveData

Ƭ **ReactionRemoveData**: [`MessageData`](js_src.types.md#messagedata)<[`ReactionBody`](js_src.types.md#reactionbody), [`MESSAGE_TYPE_REACTION_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_reaction_remove)\>

#### Defined in

[js/src/types.ts:35](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L35)

___

### ReactionRemoveMessage

Ƭ **ReactionRemoveMessage**: [`Message`](js_src.types.md#message)<[`ReactionRemoveData`](js_src.types.md#reactionremovedata)\>

#### Defined in

[js/src/types.ts:53](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L53)

___

### SignerAddData

Ƭ **SignerAddData**: [`MessageData`](js_src.types.md#messagedata)<[`SignerBody`](js_src.types.md#signerbody), [`MESSAGE_TYPE_SIGNER_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_signer_add)\>

#### Defined in

[js/src/types.ts:46](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L46)

___

### SignerAddMessage

Ƭ **SignerAddMessage**: [`Message`](js_src.types.md#message)<[`SignerAddData`](js_src.types.md#signeradddata)\>

#### Defined in

[js/src/types.ts:58](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L58)

___

### SignerBody

Ƭ **SignerBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `signer` | `string` |

#### Defined in

[js/src/types.ts:108](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L108)

___

### SignerRemoveData

Ƭ **SignerRemoveData**: [`MessageData`](js_src.types.md#messagedata)<[`SignerBody`](js_src.types.md#signerbody), [`MESSAGE_TYPE_SIGNER_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_signer_remove)\>

#### Defined in

[js/src/types.ts:47](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L47)

___

### SignerRemoveMessage

Ƭ **SignerRemoveMessage**: [`Message`](js_src.types.md#message)<[`SignerRemoveData`](js_src.types.md#signerremovedata)\>

#### Defined in

[js/src/types.ts:59](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L59)

___

### UserDataAddData

Ƭ **UserDataAddData**: [`MessageData`](js_src.types.md#messagedata)<[`UserDataBody`](js_src.types.md#userdatabody), [`MESSAGE_TYPE_USER_DATA_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_user_data_add)\>

#### Defined in

[js/src/types.ts:48](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L48)

___

### UserDataAddMessage

Ƭ **UserDataAddMessage**: [`Message`](js_src.types.md#message)<[`UserDataAddData`](js_src.types.md#userdataadddata)\>

#### Defined in

[js/src/types.ts:60](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L60)

___

### UserDataBody

Ƭ **UserDataBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `type` | [`UserDataType`](../enums/js_src.protobufs.UserDataType.md) |
| `value` | `string` |

#### Defined in

[js/src/types.ts:112](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L112)

___

### VerificationAddEthAddressBody

Ƭ **VerificationAddEthAddressBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `blockHash` | `string` |
| `ethSignature` | `string` |

#### Defined in

[js/src/types.ts:98](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L98)

___

### VerificationAddEthAddressData

Ƭ **VerificationAddEthAddressData**: [`MessageData`](js_src.types.md#messagedata)<[`VerificationAddEthAddressBody`](js_src.types.md#verificationaddethaddressbody), [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](../enums/js_src.protobufs.MessageType.md#message_type_verification_add_eth_address)\>

#### Defined in

[js/src/types.ts:38](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L38)

___

### VerificationAddEthAddressMessage

Ƭ **VerificationAddEthAddressMessage**: [`Message`](js_src.types.md#message)<[`VerificationAddEthAddressData`](js_src.types.md#verificationaddethaddressdata)\>

#### Defined in

[js/src/types.ts:56](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L56)

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

utils/dist/index.d.ts:81

___

### VerificationRemoveBody

Ƭ **VerificationRemoveBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Defined in

[js/src/types.ts:104](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L104)

___

### VerificationRemoveData

Ƭ **VerificationRemoveData**: [`MessageData`](js_src.types.md#messagedata)<[`VerificationRemoveBody`](js_src.types.md#verificationremovebody), [`MESSAGE_TYPE_VERIFICATION_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_verification_remove)\>

#### Defined in

[js/src/types.ts:42](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L42)

___

### VerificationRemoveMessage

Ƭ **VerificationRemoveMessage**: [`Message`](js_src.types.md#message)<[`VerificationRemoveData`](js_src.types.md#verificationremovedata)\>

#### Defined in

[js/src/types.ts:57](https://github.com/vinliao/hubble/blob/4e20c6c/packages/js/src/types.ts#L57)
