[@farcaster/js](../README.md) / [Exports](../modules.md) / types

# Namespace: types

## Table of contents

### References

- [FarcasterNetwork](types.md#farcasternetwork)
- [HashScheme](types.md#hashscheme)
- [MessageType](types.md#messagetype)
- [ReactionType](types.md#reactiontype)
- [SignatureScheme](types.md#signaturescheme)
- [UserDataType](types.md#userdatatype)

### Type Aliases

- [AmpBody](types.md#ampbody)
- [CastAddBody](types.md#castaddbody)
- [CastAddData](types.md#castadddata)
- [CastAddMessage](types.md#castaddmessage)
- [CastId](types.md#castid)
- [CastRemoveBody](types.md#castremovebody)
- [CastRemoveData](types.md#castremovedata)
- [CastRemoveMessage](types.md#castremovemessage)
- [HubEvent](types.md#hubevent)
- [IdRegistryEvent](types.md#idregistryevent)
- [MergeIdRegistryEventHubEvent](types.md#mergeidregistryeventhubevent)
- [MergeMessageHubEvent](types.md#mergemessagehubevent)
- [MergeNameRegistryEventHubEvent](types.md#mergenameregistryeventhubevent)
- [Message](types.md#message)
- [MessageBody](types.md#messagebody)
- [MessageData](types.md#messagedata)
- [NameRegistryEvent](types.md#nameregistryevent)
- [PruneMessageHubEvent](types.md#prunemessagehubevent)
- [ReactionAddData](types.md#reactionadddata)
- [ReactionAddMessage](types.md#reactionaddmessage)
- [ReactionBody](types.md#reactionbody)
- [ReactionRemoveData](types.md#reactionremovedata)
- [ReactionRemoveMessage](types.md#reactionremovemessage)
- [RevokeMessageHubEvent](types.md#revokemessagehubevent)
- [SignerAddData](types.md#signeradddata)
- [SignerAddMessage](types.md#signeraddmessage)
- [SignerBody](types.md#signerbody)
- [SignerRemoveData](types.md#signerremovedata)
- [SignerRemoveMessage](types.md#signerremovemessage)
- [UserDataAddData](types.md#userdataadddata)
- [UserDataAddMessage](types.md#userdataaddmessage)
- [UserDataBody](types.md#userdatabody)
- [VerificationAddEthAddressBody](types.md#verificationaddethaddressbody)
- [VerificationAddEthAddressData](types.md#verificationaddethaddressdata)
- [VerificationAddEthAddressMessage](types.md#verificationaddethaddressmessage)
- [VerificationEthAddressClaim](types.md#verificationethaddressclaim)
- [VerificationRemoveBody](types.md#verificationremovebody)
- [VerificationRemoveData](types.md#verificationremovedata)
- [VerificationRemoveMessage](types.md#verificationremovemessage)

## References

### FarcasterNetwork

Re-exports [FarcasterNetwork](../enums/protobufs.FarcasterNetwork.md)

___

### HashScheme

Re-exports [HashScheme](../enums/protobufs.HashScheme.md)

___

### MessageType

Re-exports [MessageType](../enums/protobufs.MessageType.md)

___

### ReactionType

Re-exports [ReactionType](../enums/protobufs.ReactionType.md)

___

### SignatureScheme

Re-exports [SignatureScheme](../enums/protobufs.SignatureScheme.md)

___

### UserDataType

Re-exports [UserDataType](../enums/protobufs.UserDataType.md)

## Type Aliases

### AmpBody

Ƭ **AmpBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `targetFid` | `number` |

___

### CastAddBody

Ƭ **CastAddBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `embeds?` | `string`[] |
| `mentions?` | `number`[] |
| `mentionsPositions?` | `number`[] |
| `parent?` | [`CastId`](types.md#castid) |
| `text` | `string` |

___

### CastAddData

Ƭ **CastAddData**: [`MessageData`](types.md#messagedata)<[`CastAddBody`](types.md#castaddbody), [`MESSAGE_TYPE_CAST_ADD`](../enums/protobufs.MessageType.md#message_type_cast_add)\>

___

### CastAddMessage

Ƭ **CastAddMessage**: [`Message`](types.md#message)<[`CastAddData`](types.md#castadddata)\>

___

### CastId

Ƭ **CastId**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `hash` | `string` |

___

### CastRemoveBody

Ƭ **CastRemoveBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `targetHash` | `string` |

___

### CastRemoveData

Ƭ **CastRemoveData**: [`MessageData`](types.md#messagedata)<[`CastRemoveBody`](types.md#castremovebody), [`MESSAGE_TYPE_CAST_REMOVE`](../enums/protobufs.MessageType.md#message_type_cast_remove)\>

___

### CastRemoveMessage

Ƭ **CastRemoveMessage**: [`Message`](types.md#message)<[`CastRemoveData`](types.md#castremovedata)\>

___

### HubEvent

Ƭ **HubEvent**: [`MergeMessageHubEvent`](types.md#mergemessagehubevent) \| [`PruneMessageHubEvent`](types.md#prunemessagehubevent) \| [`RevokeMessageHubEvent`](types.md#revokemessagehubevent) \| [`MergeIdRegistryEventHubEvent`](types.md#mergeidregistryeventhubevent) \| [`MergeNameRegistryEventHubEvent`](types.md#mergenameregistryeventhubevent)

___

### IdRegistryEvent

Ƭ **IdRegistryEvent**: `Readonly`<{ `_protobuf`: [`IdRegistryEvent`](protobufs.md#idregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `fid`: `number` ; `from`: `string` \| `undefined` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`IdRegistryEventType`](../enums/protobufs.IdRegistryEventType.md)  }\>

___

### MergeIdRegistryEventHubEvent

Ƭ **MergeIdRegistryEventHubEvent**: `GenericHubEvent` & { `idRegistryEvent`: [`IdRegistryEvent`](types.md#idregistryevent) ; `type`: [`HUB_EVENT_TYPE_MERGE_ID_REGISTRY_EVENT`](../enums/protobufs.HubEventType.md#hub_event_type_merge_id_registry_event)  }

___

### MergeMessageHubEvent

Ƭ **MergeMessageHubEvent**: `GenericHubEvent` & { `deletedMessages?`: [`Message`](types.md#message)[] ; `message`: [`Message`](types.md#message) ; `type`: [`HUB_EVENT_TYPE_MERGE_MESSAGE`](../enums/protobufs.HubEventType.md#hub_event_type_merge_message)  }

___

### MergeNameRegistryEventHubEvent

Ƭ **MergeNameRegistryEventHubEvent**: `GenericHubEvent` & { `nameRegistryEvent`: [`NameRegistryEvent`](types.md#nameregistryevent) ; `type`: [`HUB_EVENT_TYPE_MERGE_NAME_REGISTRY_EVENT`](../enums/protobufs.HubEventType.md#hub_event_type_merge_name_registry_event)  }

___

### Message

Ƭ **Message**<`TData`\>: `Readonly`<{ `_protobuf`: [`Message`](protobufs.md#message) ; `data`: `TData` ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TData` | [`MessageData`](types.md#messagedata) |

___

### MessageBody

Ƭ **MessageBody**: [`CastAddBody`](types.md#castaddbody) \| [`CastRemoveBody`](types.md#castremovebody) \| [`ReactionBody`](types.md#reactionbody) \| [`VerificationAddEthAddressBody`](types.md#verificationaddethaddressbody) \| [`VerificationRemoveBody`](types.md#verificationremovebody) \| [`SignerBody`](types.md#signerbody) \| [`UserDataBody`](types.md#userdatabody)

___

### MessageData

Ƭ **MessageData**<`TBody`, `TType`\>: `Object`

#### Type parameters

| Name | Type |
| :------ | :------ |
| `TBody` | [`MessageBody`](types.md#messagebody) |
| `TType` | [`MessageType`](../enums/protobufs.MessageType.md) |

#### Type declaration

| Name | Type |
| :------ | :------ |
| `_protobuf` | [`MessageData`](protobufs.md#messagedata) |
| `body` | `TBody` |
| `fid` | `number` |
| `network` | [`FarcasterNetwork`](../enums/protobufs.FarcasterNetwork.md) |
| `timestamp` | `number` |
| `type` | `TType` |

___

### NameRegistryEvent

Ƭ **NameRegistryEvent**: `Readonly`<{ `_protobuf`: [`NameRegistryEvent`](protobufs.md#nameregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `expiry`: `number` \| `undefined` ; `fname`: `string` ; `from`: `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`NameRegistryEventType`](../enums/protobufs.NameRegistryEventType.md)  }\>

___

### PruneMessageHubEvent

Ƭ **PruneMessageHubEvent**: `GenericHubEvent` & { `message`: [`Message`](types.md#message) ; `type`: [`HUB_EVENT_TYPE_PRUNE_MESSAGE`](../enums/protobufs.HubEventType.md#hub_event_type_prune_message)  }

___

### ReactionAddData

Ƭ **ReactionAddData**: [`MessageData`](types.md#messagedata)<[`ReactionBody`](types.md#reactionbody), [`MESSAGE_TYPE_REACTION_ADD`](../enums/protobufs.MessageType.md#message_type_reaction_add)\>

___

### ReactionAddMessage

Ƭ **ReactionAddMessage**: [`Message`](types.md#message)<[`ReactionAddData`](types.md#reactionadddata)\>

___

### ReactionBody

Ƭ **ReactionBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `target` | [`CastId`](types.md#castid) |
| `type` | [`ReactionType`](../enums/protobufs.ReactionType.md) |

___

### ReactionRemoveData

Ƭ **ReactionRemoveData**: [`MessageData`](types.md#messagedata)<[`ReactionBody`](types.md#reactionbody), [`MESSAGE_TYPE_REACTION_REMOVE`](../enums/protobufs.MessageType.md#message_type_reaction_remove)\>

___

### ReactionRemoveMessage

Ƭ **ReactionRemoveMessage**: [`Message`](types.md#message)<[`ReactionRemoveData`](types.md#reactionremovedata)\>

___

### RevokeMessageHubEvent

Ƭ **RevokeMessageHubEvent**: `GenericHubEvent` & { `message`: [`Message`](types.md#message) ; `type`: [`HUB_EVENT_TYPE_REVOKE_MESSAGE`](../enums/protobufs.HubEventType.md#hub_event_type_revoke_message)  }

___

### SignerAddData

Ƭ **SignerAddData**: [`MessageData`](types.md#messagedata)<[`SignerBody`](types.md#signerbody), [`MESSAGE_TYPE_SIGNER_ADD`](../enums/protobufs.MessageType.md#message_type_signer_add)\>

___

### SignerAddMessage

Ƭ **SignerAddMessage**: [`Message`](types.md#message)<[`SignerAddData`](types.md#signeradddata)\>

___

### SignerBody

Ƭ **SignerBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `signer` | `string` |

___

### SignerRemoveData

Ƭ **SignerRemoveData**: [`MessageData`](types.md#messagedata)<[`SignerBody`](types.md#signerbody), [`MESSAGE_TYPE_SIGNER_REMOVE`](../enums/protobufs.MessageType.md#message_type_signer_remove)\>

___

### SignerRemoveMessage

Ƭ **SignerRemoveMessage**: [`Message`](types.md#message)<[`SignerRemoveData`](types.md#signerremovedata)\>

___

### UserDataAddData

Ƭ **UserDataAddData**: [`MessageData`](types.md#messagedata)<[`UserDataBody`](types.md#userdatabody), [`MESSAGE_TYPE_USER_DATA_ADD`](../enums/protobufs.MessageType.md#message_type_user_data_add)\>

___

### UserDataAddMessage

Ƭ **UserDataAddMessage**: [`Message`](types.md#message)<[`UserDataAddData`](types.md#userdataadddata)\>

___

### UserDataBody

Ƭ **UserDataBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `type` | [`UserDataType`](../enums/protobufs.UserDataType.md) |
| `value` | `string` |

___

### VerificationAddEthAddressBody

Ƭ **VerificationAddEthAddressBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `blockHash` | `string` |
| `ethSignature` | `string` |

___

### VerificationAddEthAddressData

Ƭ **VerificationAddEthAddressData**: [`MessageData`](types.md#messagedata)<[`VerificationAddEthAddressBody`](types.md#verificationaddethaddressbody), [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](../enums/protobufs.MessageType.md#message_type_verification_add_eth_address)\>

___

### VerificationAddEthAddressMessage

Ƭ **VerificationAddEthAddressMessage**: [`Message`](types.md#message)<[`VerificationAddEthAddressData`](types.md#verificationaddethaddressdata)\>

___

### VerificationEthAddressClaim

Ƭ **VerificationEthAddressClaim**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `blockHash` | `string` |
| `fid` | `BigNumber` |
| `network` | [`FarcasterNetwork`](../enums/protobufs.FarcasterNetwork.md) |

___

### VerificationRemoveBody

Ƭ **VerificationRemoveBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `address` | `string` |

___

### VerificationRemoveData

Ƭ **VerificationRemoveData**: [`MessageData`](types.md#messagedata)<[`VerificationRemoveBody`](types.md#verificationremovebody), [`MESSAGE_TYPE_VERIFICATION_REMOVE`](../enums/protobufs.MessageType.md#message_type_verification_remove)\>

___

### VerificationRemoveMessage

Ƭ **VerificationRemoveMessage**: [`Message`](types.md#message)<[`VerificationRemoveData`](types.md#verificationremovedata)\>
