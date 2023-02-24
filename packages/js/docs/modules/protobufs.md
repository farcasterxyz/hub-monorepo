[@farcaster/js](../README.md) / [Exports](../modules.md) / protobufs

# Namespace: protobufs

## Table of contents

### Enumerations

- [FarcasterNetwork](../enums/protobufs.FarcasterNetwork.md)
- [GossipVersion](../enums/protobufs.GossipVersion.md)
- [HashScheme](../enums/protobufs.HashScheme.md)
- [HubEventType](../enums/protobufs.HubEventType.md)
- [IdRegistryEventType](../enums/protobufs.IdRegistryEventType.md)
- [MessageType](../enums/protobufs.MessageType.md)
- [NameRegistryEventType](../enums/protobufs.NameRegistryEventType.md)
- [ReactionType](../enums/protobufs.ReactionType.md)
- [SignatureScheme](../enums/protobufs.SignatureScheme.md)
- [UserDataType](../enums/protobufs.UserDataType.md)

### Interfaces

- [AdminServiceClient](../interfaces/protobufs.AdminServiceClient.md)
- [AdminServiceServer](../interfaces/protobufs.AdminServiceServer.md)
- [CastAddBody](../interfaces/protobufs.CastAddBody.md)
- [CastId](../interfaces/protobufs.CastId.md)
- [CastRemoveBody](../interfaces/protobufs.CastRemoveBody.md)
- [ContactInfoContent](../interfaces/protobufs.ContactInfoContent.md)
- [DbTrieNode](../interfaces/protobufs.DbTrieNode.md)
- [Empty](../interfaces/protobufs.Empty.md)
- [EventRequest](../interfaces/protobufs.EventRequest.md)
- [FidRequest](../interfaces/protobufs.FidRequest.md)
- [FidsResponse](../interfaces/protobufs.FidsResponse.md)
- [GossipAddressInfo](../interfaces/protobufs.GossipAddressInfo.md)
- [GossipMessage](../interfaces/protobufs.GossipMessage.md)
- [HubEvent](../interfaces/protobufs.HubEvent.md)
- [HubInfoResponse](../interfaces/protobufs.HubInfoResponse.md)
- [HubServiceClient](../interfaces/protobufs.HubServiceClient.md)
- [HubServiceServer](../interfaces/protobufs.HubServiceServer.md)
- [HubState](../interfaces/protobufs.HubState.md)
- [IdRegistryEvent](../interfaces/protobufs.IdRegistryEvent.md)
- [MergeIdRegistryEventBody](../interfaces/protobufs.MergeIdRegistryEventBody.md)
- [MergeMessageBody](../interfaces/protobufs.MergeMessageBody.md)
- [MergeNameRegistryEventBody](../interfaces/protobufs.MergeNameRegistryEventBody.md)
- [Message](../interfaces/protobufs.Message.md)
- [MessageData](../interfaces/protobufs.MessageData.md)
- [MessagesResponse](../interfaces/protobufs.MessagesResponse.md)
- [NameRegistryEvent](../interfaces/protobufs.NameRegistryEvent.md)
- [NameRegistryEventRequest](../interfaces/protobufs.NameRegistryEventRequest.md)
- [PruneMessageBody](../interfaces/protobufs.PruneMessageBody.md)
- [ReactionBody](../interfaces/protobufs.ReactionBody.md)
- [ReactionRequest](../interfaces/protobufs.ReactionRequest.md)
- [ReactionsByCastRequest](../interfaces/protobufs.ReactionsByCastRequest.md)
- [ReactionsByFidRequest](../interfaces/protobufs.ReactionsByFidRequest.md)
- [RevokeMessageBody](../interfaces/protobufs.RevokeMessageBody.md)
- [RevokeSignerJobPayload](../interfaces/protobufs.RevokeSignerJobPayload.md)
- [SignerBody](../interfaces/protobufs.SignerBody.md)
- [SignerRequest](../interfaces/protobufs.SignerRequest.md)
- [SubscribeRequest](../interfaces/protobufs.SubscribeRequest.md)
- [SyncIds](../interfaces/protobufs.SyncIds.md)
- [TrieNodeMetadataResponse](../interfaces/protobufs.TrieNodeMetadataResponse.md)
- [TrieNodePrefix](../interfaces/protobufs.TrieNodePrefix.md)
- [TrieNodeSnapshotResponse](../interfaces/protobufs.TrieNodeSnapshotResponse.md)
- [UpdateNameRegistryEventExpiryJobPayload](../interfaces/protobufs.UpdateNameRegistryEventExpiryJobPayload.md)
- [UserDataBody](../interfaces/protobufs.UserDataBody.md)
- [UserDataRequest](../interfaces/protobufs.UserDataRequest.md)
- [VerificationAddEthAddressBody](../interfaces/protobufs.VerificationAddEthAddressBody.md)
- [VerificationRemoveBody](../interfaces/protobufs.VerificationRemoveBody.md)
- [VerificationRequest](../interfaces/protobufs.VerificationRequest.md)

### Type Aliases

- [AdminServiceService](protobufs.md#adminserviceservice)
- [CastAddData](protobufs.md#castadddata)
- [CastAddMessage](protobufs.md#castaddmessage)
- [CastRemoveData](protobufs.md#castremovedata)
- [CastRemoveMessage](protobufs.md#castremovemessage)
- [HubServiceService](protobufs.md#hubserviceservice)
- [MergeIdRegistryEventHubEvent](protobufs.md#mergeidregistryeventhubevent)
- [MergeMessageHubEvent](protobufs.md#mergemessagehubevent)
- [MergeNameRegistryEventHubEvent](protobufs.md#mergenameregistryeventhubevent)
- [PruneMessageHubEvent](protobufs.md#prunemessagehubevent)
- [ReactionAddData](protobufs.md#reactionadddata)
- [ReactionAddMessage](protobufs.md#reactionaddmessage)
- [ReactionRemoveData](protobufs.md#reactionremovedata)
- [ReactionRemoveMessage](protobufs.md#reactionremovemessage)
- [RevokeMessageHubEvent](protobufs.md#revokemessagehubevent)
- [SignerAddData](protobufs.md#signeradddata)
- [SignerAddMessage](protobufs.md#signeraddmessage)
- [SignerRemoveData](protobufs.md#signerremovedata)
- [SignerRemoveMessage](protobufs.md#signerremovemessage)
- [UserDataAddData](protobufs.md#userdataadddata)
- [UserDataAddMessage](protobufs.md#userdataaddmessage)
- [VerificationAddEthAddressData](protobufs.md#verificationaddethaddressdata)
- [VerificationAddEthAddressMessage](protobufs.md#verificationaddethaddressmessage)
- [VerificationRemoveData](protobufs.md#verificationremovedata)
- [VerificationRemoveMessage](protobufs.md#verificationremovemessage)

### Variables

- [AdminServiceClient](protobufs.md#adminserviceclient)
- [AdminServiceService](protobufs.md#adminserviceservice-1)
- [CastAddBody](protobufs.md#castaddbody)
- [CastId](protobufs.md#castid)
- [CastRemoveBody](protobufs.md#castremovebody)
- [ContactInfoContent](protobufs.md#contactinfocontent)
- [DbTrieNode](protobufs.md#dbtrienode)
- [Empty](protobufs.md#empty)
- [EventRequest](protobufs.md#eventrequest)
- [FidRequest](protobufs.md#fidrequest)
- [FidsResponse](protobufs.md#fidsresponse)
- [GossipAddressInfo](protobufs.md#gossipaddressinfo)
- [GossipMessage](protobufs.md#gossipmessage)
- [HubEvent](protobufs.md#hubevent)
- [HubInfoResponse](protobufs.md#hubinforesponse)
- [HubServiceClient](protobufs.md#hubserviceclient)
- [HubServiceService](protobufs.md#hubserviceservice-1)
- [HubState](protobufs.md#hubstate)
- [IdRegistryEvent](protobufs.md#idregistryevent)
- [MergeIdRegistryEventBody](protobufs.md#mergeidregistryeventbody)
- [MergeMessageBody](protobufs.md#mergemessagebody)
- [MergeNameRegistryEventBody](protobufs.md#mergenameregistryeventbody)
- [Message](protobufs.md#message)
- [MessageData](protobufs.md#messagedata)
- [MessagesResponse](protobufs.md#messagesresponse)
- [NameRegistryEvent](protobufs.md#nameregistryevent)
- [NameRegistryEventRequest](protobufs.md#nameregistryeventrequest)
- [PruneMessageBody](protobufs.md#prunemessagebody)
- [ReactionBody](protobufs.md#reactionbody)
- [ReactionRequest](protobufs.md#reactionrequest)
- [ReactionsByCastRequest](protobufs.md#reactionsbycastrequest)
- [ReactionsByFidRequest](protobufs.md#reactionsbyfidrequest)
- [RevokeMessageBody](protobufs.md#revokemessagebody)
- [RevokeSignerJobPayload](protobufs.md#revokesignerjobpayload)
- [SignerBody](protobufs.md#signerbody)
- [SignerRequest](protobufs.md#signerrequest)
- [SubscribeRequest](protobufs.md#subscriberequest)
- [SyncIds](protobufs.md#syncids)
- [TrieNodeMetadataResponse](protobufs.md#trienodemetadataresponse)
- [TrieNodePrefix](protobufs.md#trienodeprefix)
- [TrieNodeSnapshotResponse](protobufs.md#trienodesnapshotresponse)
- [UpdateNameRegistryEventExpiryJobPayload](protobufs.md#updatenameregistryeventexpiryjobpayload)
- [UserDataBody](protobufs.md#userdatabody)
- [UserDataRequest](protobufs.md#userdatarequest)
- [VerificationAddEthAddressBody](protobufs.md#verificationaddethaddressbody)
- [VerificationRemoveBody](protobufs.md#verificationremovebody)
- [VerificationRequest](protobufs.md#verificationrequest)

### Functions

- [farcasterNetworkFromJSON](protobufs.md#farcasternetworkfromjson)
- [farcasterNetworkToJSON](protobufs.md#farcasternetworktojson)
- [getAdminClient](protobufs.md#getadminclient)
- [getClient](protobufs.md#getclient)
- [getServer](protobufs.md#getserver)
- [gossipVersionFromJSON](protobufs.md#gossipversionfromjson)
- [gossipVersionToJSON](protobufs.md#gossipversiontojson)
- [hashSchemeFromJSON](protobufs.md#hashschemefromjson)
- [hashSchemeToJSON](protobufs.md#hashschemetojson)
- [hubEventTypeFromJSON](protobufs.md#hubeventtypefromjson)
- [hubEventTypeToJSON](protobufs.md#hubeventtypetojson)
- [idRegistryEventTypeFromJSON](protobufs.md#idregistryeventtypefromjson)
- [idRegistryEventTypeToJSON](protobufs.md#idregistryeventtypetojson)
- [isCastAddData](protobufs.md#iscastadddata)
- [isCastAddMessage](protobufs.md#iscastaddmessage)
- [isCastRemoveData](protobufs.md#iscastremovedata)
- [isCastRemoveMessage](protobufs.md#iscastremovemessage)
- [isMergeIdRegistryEventHubEvent](protobufs.md#ismergeidregistryeventhubevent)
- [isMergeMessageHubEvent](protobufs.md#ismergemessagehubevent)
- [isMergeNameRegistryEventHubEvent](protobufs.md#ismergenameregistryeventhubevent)
- [isPruneMessageHubEvent](protobufs.md#isprunemessagehubevent)
- [isReactionAddData](protobufs.md#isreactionadddata)
- [isReactionAddMessage](protobufs.md#isreactionaddmessage)
- [isReactionRemoveData](protobufs.md#isreactionremovedata)
- [isReactionRemoveMessage](protobufs.md#isreactionremovemessage)
- [isRevokeMessageHubEvent](protobufs.md#isrevokemessagehubevent)
- [isSignerAddData](protobufs.md#issigneradddata)
- [isSignerAddMessage](protobufs.md#issigneraddmessage)
- [isSignerRemoveData](protobufs.md#issignerremovedata)
- [isSignerRemoveMessage](protobufs.md#issignerremovemessage)
- [isUserDataAddData](protobufs.md#isuserdataadddata)
- [isUserDataAddMessage](protobufs.md#isuserdataaddmessage)
- [isVerificationAddEthAddressData](protobufs.md#isverificationaddethaddressdata)
- [isVerificationAddEthAddressMessage](protobufs.md#isverificationaddethaddressmessage)
- [isVerificationRemoveData](protobufs.md#isverificationremovedata)
- [isVerificationRemoveMessage](protobufs.md#isverificationremovemessage)
- [messageTypeFromJSON](protobufs.md#messagetypefromjson)
- [messageTypeToJSON](protobufs.md#messagetypetojson)
- [nameRegistryEventTypeFromJSON](protobufs.md#nameregistryeventtypefromjson)
- [nameRegistryEventTypeToJSON](protobufs.md#nameregistryeventtypetojson)
- [reactionTypeFromJSON](protobufs.md#reactiontypefromjson)
- [reactionTypeToJSON](protobufs.md#reactiontypetojson)
- [signatureSchemeFromJSON](protobufs.md#signatureschemefromjson)
- [signatureSchemeToJSON](protobufs.md#signatureschemetojson)
- [userDataTypeFromJSON](protobufs.md#userdatatypefromjson)
- [userDataTypeToJSON](protobufs.md#userdatatypetojson)

## Type Aliases

### AdminServiceService

Ƭ **AdminServiceService**: typeof [`AdminServiceService`](protobufs.md#adminserviceservice-1)

___

### CastAddData

Ƭ **CastAddData**: [`MessageData`](protobufs.md#messagedata) & { `castAddBody`: [`CastAddBody`](protobufs.md#castaddbody) ; `type`: [`MESSAGE_TYPE_CAST_ADD`](../enums/protobufs.MessageType.md#message_type_cast_add)  }

Message types

___

### CastAddMessage

Ƭ **CastAddMessage**: [`Message`](protobufs.md#message) & { `data`: [`CastAddData`](protobufs.md#castadddata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs.SignatureScheme.md#signature_scheme_ed25519)  }

___

### CastRemoveData

Ƭ **CastRemoveData**: [`MessageData`](protobufs.md#messagedata) & { `castRemoveBody`: [`CastRemoveBody`](protobufs.md#castremovebody) ; `type`: [`MESSAGE_TYPE_CAST_REMOVE`](../enums/protobufs.MessageType.md#message_type_cast_remove)  }

___

### CastRemoveMessage

Ƭ **CastRemoveMessage**: [`Message`](protobufs.md#message) & { `data`: [`CastRemoveData`](protobufs.md#castremovedata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs.SignatureScheme.md#signature_scheme_ed25519)  }

___

### HubServiceService

Ƭ **HubServiceService**: typeof [`HubServiceService`](protobufs.md#hubserviceservice-1)

___

### MergeIdRegistryEventHubEvent

Ƭ **MergeIdRegistryEventHubEvent**: [`HubEvent`](protobufs.md#hubevent) & { `mergeIdRegistryEventBody`: [`MergeIdRegistryEventBody`](protobufs.md#mergeidregistryeventbody) & { `idRegistryEvent`: [`IdRegistryEvent`](protobufs.md#idregistryevent)  } ; `type`: [`HUB_EVENT_TYPE_MERGE_ID_REGISTRY_EVENT`](../enums/protobufs.HubEventType.md#hub_event_type_merge_id_registry_event)  }

___

### MergeMessageHubEvent

Ƭ **MergeMessageHubEvent**: [`HubEvent`](protobufs.md#hubevent) & { `mergeMessageBody`: [`MergeMessageBody`](protobufs.md#mergemessagebody) & { `message`: [`Message`](protobufs.md#message)  } ; `type`: [`HUB_EVENT_TYPE_MERGE_MESSAGE`](../enums/protobufs.HubEventType.md#hub_event_type_merge_message)  }

Hub event types

___

### MergeNameRegistryEventHubEvent

Ƭ **MergeNameRegistryEventHubEvent**: [`HubEvent`](protobufs.md#hubevent) & { `mergeNameRegistryEventBody`: [`MergeNameRegistryEventBody`](protobufs.md#mergenameregistryeventbody) & { `nameRegistryEvent`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)  } ; `type`: [`HUB_EVENT_TYPE_MERGE_NAME_REGISTRY_EVENT`](../enums/protobufs.HubEventType.md#hub_event_type_merge_name_registry_event)  }

___

### PruneMessageHubEvent

Ƭ **PruneMessageHubEvent**: [`HubEvent`](protobufs.md#hubevent) & { `pruneMessageBody`: [`PruneMessageBody`](protobufs.md#prunemessagebody) & { `message`: [`Message`](protobufs.md#message)  } ; `type`: [`HUB_EVENT_TYPE_PRUNE_MESSAGE`](../enums/protobufs.HubEventType.md#hub_event_type_prune_message)  }

___

### ReactionAddData

Ƭ **ReactionAddData**: [`MessageData`](protobufs.md#messagedata) & { `reactionBody`: [`ReactionBody`](protobufs.md#reactionbody) ; `type`: [`MESSAGE_TYPE_REACTION_ADD`](../enums/protobufs.MessageType.md#message_type_reaction_add)  }

___

### ReactionAddMessage

Ƭ **ReactionAddMessage**: [`Message`](protobufs.md#message) & { `data`: [`ReactionAddData`](protobufs.md#reactionadddata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs.SignatureScheme.md#signature_scheme_ed25519)  }

___

### ReactionRemoveData

Ƭ **ReactionRemoveData**: [`MessageData`](protobufs.md#messagedata) & { `reactionBody`: [`ReactionBody`](protobufs.md#reactionbody) ; `type`: [`MESSAGE_TYPE_REACTION_REMOVE`](../enums/protobufs.MessageType.md#message_type_reaction_remove)  }

___

### ReactionRemoveMessage

Ƭ **ReactionRemoveMessage**: [`Message`](protobufs.md#message) & { `data`: [`ReactionRemoveData`](protobufs.md#reactionremovedata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs.SignatureScheme.md#signature_scheme_ed25519)  }

___

### RevokeMessageHubEvent

Ƭ **RevokeMessageHubEvent**: [`HubEvent`](protobufs.md#hubevent) & { `revokeMessageBody`: [`RevokeMessageBody`](protobufs.md#revokemessagebody) & { `message`: [`Message`](protobufs.md#message)  } ; `type`: [`HUB_EVENT_TYPE_REVOKE_MESSAGE`](../enums/protobufs.HubEventType.md#hub_event_type_revoke_message)  }

___

### SignerAddData

Ƭ **SignerAddData**: [`MessageData`](protobufs.md#messagedata) & { `signerBody`: [`SignerBody`](protobufs.md#signerbody) ; `type`: [`MESSAGE_TYPE_SIGNER_ADD`](../enums/protobufs.MessageType.md#message_type_signer_add)  }

___

### SignerAddMessage

Ƭ **SignerAddMessage**: [`Message`](protobufs.md#message) & { `data`: [`SignerAddData`](protobufs.md#signeradddata) ; `signatureScheme`: [`SIGNATURE_SCHEME_EIP712`](../enums/protobufs.SignatureScheme.md#signature_scheme_eip712)  }

___

### SignerRemoveData

Ƭ **SignerRemoveData**: [`MessageData`](protobufs.md#messagedata) & { `signerBody`: [`SignerBody`](protobufs.md#signerbody) ; `type`: [`MESSAGE_TYPE_SIGNER_REMOVE`](../enums/protobufs.MessageType.md#message_type_signer_remove)  }

___

### SignerRemoveMessage

Ƭ **SignerRemoveMessage**: [`Message`](protobufs.md#message) & { `data`: [`SignerRemoveData`](protobufs.md#signerremovedata) ; `signatureScheme`: [`SIGNATURE_SCHEME_EIP712`](../enums/protobufs.SignatureScheme.md#signature_scheme_eip712)  }

___

### UserDataAddData

Ƭ **UserDataAddData**: [`MessageData`](protobufs.md#messagedata) & { `type`: [`MESSAGE_TYPE_USER_DATA_ADD`](../enums/protobufs.MessageType.md#message_type_user_data_add) ; `userDataBody`: [`UserDataBody`](protobufs.md#userdatabody)  }

___

### UserDataAddMessage

Ƭ **UserDataAddMessage**: [`Message`](protobufs.md#message) & { `data`: [`UserDataAddData`](protobufs.md#userdataadddata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs.SignatureScheme.md#signature_scheme_ed25519)  }

___

### VerificationAddEthAddressData

Ƭ **VerificationAddEthAddressData**: [`MessageData`](protobufs.md#messagedata) & { `type`: [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](../enums/protobufs.MessageType.md#message_type_verification_add_eth_address) ; `verificationAddEthAddressBody`: [`VerificationAddEthAddressBody`](protobufs.md#verificationaddethaddressbody)  }

___

### VerificationAddEthAddressMessage

Ƭ **VerificationAddEthAddressMessage**: [`Message`](protobufs.md#message) & { `data`: [`VerificationAddEthAddressData`](protobufs.md#verificationaddethaddressdata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs.SignatureScheme.md#signature_scheme_ed25519)  }

___

### VerificationRemoveData

Ƭ **VerificationRemoveData**: [`MessageData`](protobufs.md#messagedata) & { `type`: [`MESSAGE_TYPE_VERIFICATION_REMOVE`](../enums/protobufs.MessageType.md#message_type_verification_remove) ; `verificationRemoveBody`: [`VerificationRemoveBody`](protobufs.md#verificationremovebody)  }

___

### VerificationRemoveMessage

Ƭ **VerificationRemoveMessage**: [`Message`](protobufs.md#message) & { `data`: [`VerificationRemoveData`](protobufs.md#verificationremovedata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs.SignatureScheme.md#signature_scheme_ed25519)  }

## Variables

### AdminServiceClient

• **AdminServiceClient**: `Object`

#### Call signature

• **new AdminServiceClient**(`address`, `credentials`, `options?`): [`AdminServiceClient`](protobufs.md#adminserviceclient)

##### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `credentials` | `ChannelCredentials` |
| `options?` | `Partial`<`ClientOptions`\> |

##### Returns

[`AdminServiceClient`](protobufs.md#adminserviceclient)

#### Type declaration

| Name | Type |
| :------ | :------ |
| `service` | { `deleteAllMessagesFromDb`: { `path`: ``"/AdminService/DeleteAllMessagesFromDb"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `responseSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `responseStream`: ``false``  } ; `rebuildSyncTrie`: { `path`: ``"/AdminService/RebuildSyncTrie"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `responseSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `responseStream`: ``false``  }  } |
| `service.deleteAllMessagesFromDb` | { `path`: ``"/AdminService/DeleteAllMessagesFromDb"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `responseSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.deleteAllMessagesFromDb.path` | ``"/AdminService/DeleteAllMessagesFromDb"`` |
| `service.deleteAllMessagesFromDb.requestDeserialize` | (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) |
| `service.deleteAllMessagesFromDb.requestSerialize` | (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` |
| `service.deleteAllMessagesFromDb.requestStream` | ``false`` |
| `service.deleteAllMessagesFromDb.responseDeserialize` | (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) |
| `service.deleteAllMessagesFromDb.responseSerialize` | (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` |
| `service.deleteAllMessagesFromDb.responseStream` | ``false`` |
| `service.rebuildSyncTrie` | { `path`: ``"/AdminService/RebuildSyncTrie"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `responseSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.rebuildSyncTrie.path` | ``"/AdminService/RebuildSyncTrie"`` |
| `service.rebuildSyncTrie.requestDeserialize` | (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) |
| `service.rebuildSyncTrie.requestSerialize` | (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` |
| `service.rebuildSyncTrie.requestStream` | ``false`` |
| `service.rebuildSyncTrie.responseDeserialize` | (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) |
| `service.rebuildSyncTrie.responseSerialize` | (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` |
| `service.rebuildSyncTrie.responseStream` | ``false`` |

___

### AdminServiceService

• **AdminServiceService**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `deleteAllMessagesFromDb` | { `path`: ``"/AdminService/DeleteAllMessagesFromDb"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `responseSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `responseStream`: ``false``  } |
| `deleteAllMessagesFromDb.path` | ``"/AdminService/DeleteAllMessagesFromDb"`` |
| `deleteAllMessagesFromDb.requestDeserialize` | (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) |
| `deleteAllMessagesFromDb.requestSerialize` | (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` |
| `deleteAllMessagesFromDb.requestStream` | ``false`` |
| `deleteAllMessagesFromDb.responseDeserialize` | (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) |
| `deleteAllMessagesFromDb.responseSerialize` | (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` |
| `deleteAllMessagesFromDb.responseStream` | ``false`` |
| `rebuildSyncTrie` | { `path`: ``"/AdminService/RebuildSyncTrie"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `responseSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `responseStream`: ``false``  } |
| `rebuildSyncTrie.path` | ``"/AdminService/RebuildSyncTrie"`` |
| `rebuildSyncTrie.requestDeserialize` | (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) |
| `rebuildSyncTrie.requestSerialize` | (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` |
| `rebuildSyncTrie.requestStream` | ``false`` |
| `rebuildSyncTrie.responseDeserialize` | (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) |
| `rebuildSyncTrie.responseSerialize` | (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` |
| `rebuildSyncTrie.responseStream` | ``false`` |

___

### CastAddBody

• **CastAddBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`CastAddBody`](protobufs.md#castaddbody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`CastAddBody`](protobufs.md#castaddbody) |
| `encode` | (`message`: [`CastAddBody`](protobufs.md#castaddbody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`CastAddBody`](protobufs.md#castaddbody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`CastAddBody`](protobufs.md#castaddbody) |
| `toJSON` | (`message`: [`CastAddBody`](protobufs.md#castaddbody)) => `unknown` |

___

### CastId

• **CastId**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`CastId`](protobufs.md#castid) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`CastId`](protobufs.md#castid) |
| `encode` | (`message`: [`CastId`](protobufs.md#castid), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`CastId`](protobufs.md#castid) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`CastId`](protobufs.md#castid) |
| `toJSON` | (`message`: [`CastId`](protobufs.md#castid)) => `unknown` |

___

### CastRemoveBody

• **CastRemoveBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`CastRemoveBody`](protobufs.md#castremovebody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`CastRemoveBody`](protobufs.md#castremovebody) |
| `encode` | (`message`: [`CastRemoveBody`](protobufs.md#castremovebody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`CastRemoveBody`](protobufs.md#castremovebody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`CastRemoveBody`](protobufs.md#castremovebody) |
| `toJSON` | (`message`: [`CastRemoveBody`](protobufs.md#castremovebody)) => `unknown` |

___

### ContactInfoContent

• **ContactInfoContent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`ContactInfoContent`](protobufs.md#contactinfocontent) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`ContactInfoContent`](protobufs.md#contactinfocontent) |
| `encode` | (`message`: [`ContactInfoContent`](protobufs.md#contactinfocontent), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`ContactInfoContent`](protobufs.md#contactinfocontent) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`ContactInfoContent`](protobufs.md#contactinfocontent) |
| `toJSON` | (`message`: [`ContactInfoContent`](protobufs.md#contactinfocontent)) => `unknown` |

___

### DbTrieNode

• **DbTrieNode**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`DbTrieNode`](protobufs.md#dbtrienode) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`DbTrieNode`](protobufs.md#dbtrienode) |
| `encode` | (`message`: [`DbTrieNode`](protobufs.md#dbtrienode), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`DbTrieNode`](protobufs.md#dbtrienode) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`DbTrieNode`](protobufs.md#dbtrienode) |
| `toJSON` | (`message`: [`DbTrieNode`](protobufs.md#dbtrienode)) => `unknown` |

___

### Empty

• **Empty**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`Empty`](protobufs.md#empty) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`Empty`](protobufs.md#empty) |
| `encode` | (`_`: [`Empty`](protobufs.md#empty), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`_`: `any`) => [`Empty`](protobufs.md#empty) |
| `fromPartial` | <I_1\>(`_`: `I_1`) => [`Empty`](protobufs.md#empty) |
| `toJSON` | (`_`: [`Empty`](protobufs.md#empty)) => `unknown` |

___

### EventRequest

• **EventRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`EventRequest`](protobufs.md#eventrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`EventRequest`](protobufs.md#eventrequest) |
| `encode` | (`message`: [`EventRequest`](protobufs.md#eventrequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`EventRequest`](protobufs.md#eventrequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`EventRequest`](protobufs.md#eventrequest) |
| `toJSON` | (`message`: [`EventRequest`](protobufs.md#eventrequest)) => `unknown` |

___

### FidRequest

• **FidRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`FidRequest`](protobufs.md#fidrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`FidRequest`](protobufs.md#fidrequest) |
| `encode` | (`message`: [`FidRequest`](protobufs.md#fidrequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`FidRequest`](protobufs.md#fidrequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`FidRequest`](protobufs.md#fidrequest) |
| `toJSON` | (`message`: [`FidRequest`](protobufs.md#fidrequest)) => `unknown` |

___

### FidsResponse

• **FidsResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`FidsResponse`](protobufs.md#fidsresponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`FidsResponse`](protobufs.md#fidsresponse) |
| `encode` | (`message`: [`FidsResponse`](protobufs.md#fidsresponse), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`FidsResponse`](protobufs.md#fidsresponse) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`FidsResponse`](protobufs.md#fidsresponse) |
| `toJSON` | (`message`: [`FidsResponse`](protobufs.md#fidsresponse)) => `unknown` |

___

### GossipAddressInfo

• **GossipAddressInfo**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`GossipAddressInfo`](protobufs.md#gossipaddressinfo) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`GossipAddressInfo`](protobufs.md#gossipaddressinfo) |
| `encode` | (`message`: [`GossipAddressInfo`](protobufs.md#gossipaddressinfo), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`GossipAddressInfo`](protobufs.md#gossipaddressinfo) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`GossipAddressInfo`](protobufs.md#gossipaddressinfo) |
| `toJSON` | (`message`: [`GossipAddressInfo`](protobufs.md#gossipaddressinfo)) => `unknown` |

___

### GossipMessage

• **GossipMessage**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`GossipMessage`](protobufs.md#gossipmessage) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`GossipMessage`](protobufs.md#gossipmessage) |
| `encode` | (`message`: [`GossipMessage`](protobufs.md#gossipmessage), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`GossipMessage`](protobufs.md#gossipmessage) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`GossipMessage`](protobufs.md#gossipmessage) |
| `toJSON` | (`message`: [`GossipMessage`](protobufs.md#gossipmessage)) => `unknown` |

___

### HubEvent

• **HubEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`HubEvent`](protobufs.md#hubevent) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`HubEvent`](protobufs.md#hubevent) |
| `encode` | (`message`: [`HubEvent`](protobufs.md#hubevent), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`HubEvent`](protobufs.md#hubevent) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`HubEvent`](protobufs.md#hubevent) |
| `toJSON` | (`message`: [`HubEvent`](protobufs.md#hubevent)) => `unknown` |

___

### HubInfoResponse

• **HubInfoResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`HubInfoResponse`](protobufs.md#hubinforesponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`HubInfoResponse`](protobufs.md#hubinforesponse) |
| `encode` | (`message`: [`HubInfoResponse`](protobufs.md#hubinforesponse), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`HubInfoResponse`](protobufs.md#hubinforesponse) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`HubInfoResponse`](protobufs.md#hubinforesponse) |
| `toJSON` | (`message`: [`HubInfoResponse`](protobufs.md#hubinforesponse)) => `unknown` |

___

### HubServiceClient

• **HubServiceClient**: `Object`

#### Call signature

• **new HubServiceClient**(`address`, `credentials`, `options?`): [`HubServiceClient`](protobufs.md#hubserviceclient)

##### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `credentials` | `ChannelCredentials` |
| `options?` | `Partial`<`ClientOptions`\> |

##### Returns

[`HubServiceClient`](protobufs.md#hubserviceclient)

#### Type declaration

| Name | Type |
| :------ | :------ |
| `service` | { `getAllCastMessagesByFid`: { `path`: ``"/HubService/GetAllCastMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getAllMessagesBySyncIds`: { `path`: ``"/HubService/GetAllMessagesBySyncIds"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SyncIds`](protobufs.md#syncids) ; `requestSerialize`: (`value`: [`SyncIds`](protobufs.md#syncids)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getAllReactionMessagesByFid`: { `path`: ``"/HubService/GetAllReactionMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getAllSignerMessagesByFid`: { `path`: ``"/HubService/GetAllSignerMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getAllSyncIdsByPrefix`: { `path`: ``"/HubService/GetAllSyncIdsByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`SyncIds`](protobufs.md#syncids) ; `responseSerialize`: (`value`: [`SyncIds`](protobufs.md#syncids)) => `Buffer` ; `responseStream`: ``false``  } ; `getAllUserDataMessagesByFid`: { `path`: ``"/HubService/GetAllUserDataMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getAllVerificationMessagesByFid`: { `path`: ``"/HubService/GetAllVerificationMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getCast`: { `path`: ``"/HubService/GetCast"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](protobufs.md#castid) ; `requestSerialize`: (`value`: [`CastId`](protobufs.md#castid)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } ; `getCastsByFid`: { `path`: ``"/HubService/GetCastsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getCastsByMention`: { `path`: ``"/HubService/GetCastsByMention"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getCastsByParent`: { `path`: ``"/HubService/GetCastsByParent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](protobufs.md#castid) ; `requestSerialize`: (`value`: [`CastId`](protobufs.md#castid)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getEvent`: { `path`: ``"/HubService/GetEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`EventRequest`](protobufs.md#eventrequest) ; `requestSerialize`: (`value`: [`EventRequest`](protobufs.md#eventrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`HubEvent`](protobufs.md#hubevent) ; `responseSerialize`: (`value`: [`HubEvent`](protobufs.md#hubevent)) => `Buffer` ; `responseStream`: ``false``  } ; `getFids`: { `path`: ``"/HubService/GetFids"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`FidsResponse`](protobufs.md#fidsresponse) ; `responseSerialize`: (`value`: [`FidsResponse`](protobufs.md#fidsresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getIdRegistryEvent`: { `path`: ``"/HubService/GetIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false``  } ; `getInfo`: { `path`: ``"/HubService/GetInfo"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`HubInfoResponse`](protobufs.md#hubinforesponse) ; `responseSerialize`: (`value`: [`HubInfoResponse`](protobufs.md#hubinforesponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getNameRegistryEvent`: { `path`: ``"/HubService/GetNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest) ; `requestSerialize`: (`value`: [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false``  } ; `getReaction`: { `path`: ``"/HubService/GetReaction"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionRequest`](protobufs.md#reactionrequest) ; `requestSerialize`: (`value`: [`ReactionRequest`](protobufs.md#reactionrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } ; `getReactionsByCast`: { `path`: ``"/HubService/GetReactionsByCast"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest) ; `requestSerialize`: (`value`: [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getReactionsByFid`: { `path`: ``"/HubService/GetReactionsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest) ; `requestSerialize`: (`value`: [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getSigner`: { `path`: ``"/HubService/GetSigner"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SignerRequest`](protobufs.md#signerrequest) ; `requestSerialize`: (`value`: [`SignerRequest`](protobufs.md#signerrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } ; `getSignersByFid`: { `path`: ``"/HubService/GetSignersByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getSyncMetadataByPrefix`: { `path`: ``"/HubService/GetSyncMetadataByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse) ; `responseSerialize`: (`value`: [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getSyncSnapshotByPrefix`: { `path`: ``"/HubService/GetSyncSnapshotByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse) ; `responseSerialize`: (`value`: [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getUserData`: { `path`: ``"/HubService/GetUserData"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`UserDataRequest`](protobufs.md#userdatarequest) ; `requestSerialize`: (`value`: [`UserDataRequest`](protobufs.md#userdatarequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } ; `getUserDataByFid`: { `path`: ``"/HubService/GetUserDataByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getVerification`: { `path`: ``"/HubService/GetVerification"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`VerificationRequest`](protobufs.md#verificationrequest) ; `requestSerialize`: (`value`: [`VerificationRequest`](protobufs.md#verificationrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } ; `getVerificationsByFid`: { `path`: ``"/HubService/GetVerificationsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `submitIdRegistryEvent`: { `path`: ``"/HubService/SubmitIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) ; `requestSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false``  } ; `submitMessage`: { `path`: ``"/HubService/SubmitMessage"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `requestSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } ; `submitNameRegistryEvent`: { `path`: ``"/HubService/SubmitNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) ; `requestSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false``  } ; `subscribe`: { `path`: ``"/HubService/Subscribe"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SubscribeRequest`](protobufs.md#subscriberequest) ; `requestSerialize`: (`value`: [`SubscribeRequest`](protobufs.md#subscriberequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`HubEvent`](protobufs.md#hubevent) ; `responseSerialize`: (`value`: [`HubEvent`](protobufs.md#hubevent)) => `Buffer` ; `responseStream`: ``true``  }  } |
| `service.getAllCastMessagesByFid` | { `path`: ``"/HubService/GetAllCastMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAllCastMessagesByFid.path` | ``"/HubService/GetAllCastMessagesByFid"`` |
| `service.getAllCastMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) |
| `service.getAllCastMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` |
| `service.getAllCastMessagesByFid.requestStream` | ``false`` |
| `service.getAllCastMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `service.getAllCastMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` |
| `service.getAllCastMessagesByFid.responseStream` | ``false`` |
| `service.getAllMessagesBySyncIds` | { `path`: ``"/HubService/GetAllMessagesBySyncIds"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SyncIds`](protobufs.md#syncids) ; `requestSerialize`: (`value`: [`SyncIds`](protobufs.md#syncids)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAllMessagesBySyncIds.path` | ``"/HubService/GetAllMessagesBySyncIds"`` |
| `service.getAllMessagesBySyncIds.requestDeserialize` | (`value`: `Buffer`) => [`SyncIds`](protobufs.md#syncids) |
| `service.getAllMessagesBySyncIds.requestSerialize` | (`value`: [`SyncIds`](protobufs.md#syncids)) => `Buffer` |
| `service.getAllMessagesBySyncIds.requestStream` | ``false`` |
| `service.getAllMessagesBySyncIds.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `service.getAllMessagesBySyncIds.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` |
| `service.getAllMessagesBySyncIds.responseStream` | ``false`` |
| `service.getAllReactionMessagesByFid` | { `path`: ``"/HubService/GetAllReactionMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAllReactionMessagesByFid.path` | ``"/HubService/GetAllReactionMessagesByFid"`` |
| `service.getAllReactionMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) |
| `service.getAllReactionMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` |
| `service.getAllReactionMessagesByFid.requestStream` | ``false`` |
| `service.getAllReactionMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `service.getAllReactionMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` |
| `service.getAllReactionMessagesByFid.responseStream` | ``false`` |
| `service.getAllSignerMessagesByFid` | { `path`: ``"/HubService/GetAllSignerMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAllSignerMessagesByFid.path` | ``"/HubService/GetAllSignerMessagesByFid"`` |
| `service.getAllSignerMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) |
| `service.getAllSignerMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` |
| `service.getAllSignerMessagesByFid.requestStream` | ``false`` |
| `service.getAllSignerMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `service.getAllSignerMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` |
| `service.getAllSignerMessagesByFid.responseStream` | ``false`` |
| `service.getAllSyncIdsByPrefix` | { `path`: ``"/HubService/GetAllSyncIdsByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`SyncIds`](protobufs.md#syncids) ; `responseSerialize`: (`value`: [`SyncIds`](protobufs.md#syncids)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAllSyncIdsByPrefix.path` | ``"/HubService/GetAllSyncIdsByPrefix"`` |
| `service.getAllSyncIdsByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) |
| `service.getAllSyncIdsByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) => `Buffer` |
| `service.getAllSyncIdsByPrefix.requestStream` | ``false`` |
| `service.getAllSyncIdsByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`SyncIds`](protobufs.md#syncids) |
| `service.getAllSyncIdsByPrefix.responseSerialize` | (`value`: [`SyncIds`](protobufs.md#syncids)) => `Buffer` |
| `service.getAllSyncIdsByPrefix.responseStream` | ``false`` |
| `service.getAllUserDataMessagesByFid` | { `path`: ``"/HubService/GetAllUserDataMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAllUserDataMessagesByFid.path` | ``"/HubService/GetAllUserDataMessagesByFid"`` |
| `service.getAllUserDataMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) |
| `service.getAllUserDataMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` |
| `service.getAllUserDataMessagesByFid.requestStream` | ``false`` |
| `service.getAllUserDataMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `service.getAllUserDataMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` |
| `service.getAllUserDataMessagesByFid.responseStream` | ``false`` |
| `service.getAllVerificationMessagesByFid` | { `path`: ``"/HubService/GetAllVerificationMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAllVerificationMessagesByFid.path` | ``"/HubService/GetAllVerificationMessagesByFid"`` |
| `service.getAllVerificationMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) |
| `service.getAllVerificationMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` |
| `service.getAllVerificationMessagesByFid.requestStream` | ``false`` |
| `service.getAllVerificationMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `service.getAllVerificationMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` |
| `service.getAllVerificationMessagesByFid.responseStream` | ``false`` |
| `service.getCast` | { `path`: ``"/HubService/GetCast"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](protobufs.md#castid) ; `requestSerialize`: (`value`: [`CastId`](protobufs.md#castid)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getCast.path` | ``"/HubService/GetCast"`` |
| `service.getCast.requestDeserialize` | (`value`: `Buffer`) => [`CastId`](protobufs.md#castid) |
| `service.getCast.requestSerialize` | (`value`: [`CastId`](protobufs.md#castid)) => `Buffer` |
| `service.getCast.requestStream` | ``false`` |
| `service.getCast.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs.md#message) |
| `service.getCast.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) => `Buffer` |
| `service.getCast.responseStream` | ``false`` |
| `service.getCastsByFid` | { `path`: ``"/HubService/GetCastsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getCastsByFid.path` | ``"/HubService/GetCastsByFid"`` |
| `service.getCastsByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) |
| `service.getCastsByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` |
| `service.getCastsByFid.requestStream` | ``false`` |
| `service.getCastsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `service.getCastsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` |
| `service.getCastsByFid.responseStream` | ``false`` |
| `service.getCastsByMention` | { `path`: ``"/HubService/GetCastsByMention"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getCastsByMention.path` | ``"/HubService/GetCastsByMention"`` |
| `service.getCastsByMention.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) |
| `service.getCastsByMention.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` |
| `service.getCastsByMention.requestStream` | ``false`` |
| `service.getCastsByMention.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `service.getCastsByMention.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` |
| `service.getCastsByMention.responseStream` | ``false`` |
| `service.getCastsByParent` | { `path`: ``"/HubService/GetCastsByParent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](protobufs.md#castid) ; `requestSerialize`: (`value`: [`CastId`](protobufs.md#castid)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getCastsByParent.path` | ``"/HubService/GetCastsByParent"`` |
| `service.getCastsByParent.requestDeserialize` | (`value`: `Buffer`) => [`CastId`](protobufs.md#castid) |
| `service.getCastsByParent.requestSerialize` | (`value`: [`CastId`](protobufs.md#castid)) => `Buffer` |
| `service.getCastsByParent.requestStream` | ``false`` |
| `service.getCastsByParent.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `service.getCastsByParent.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` |
| `service.getCastsByParent.responseStream` | ``false`` |
| `service.getEvent` | { `path`: ``"/HubService/GetEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`EventRequest`](protobufs.md#eventrequest) ; `requestSerialize`: (`value`: [`EventRequest`](protobufs.md#eventrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`HubEvent`](protobufs.md#hubevent) ; `responseSerialize`: (`value`: [`HubEvent`](protobufs.md#hubevent)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getEvent.path` | ``"/HubService/GetEvent"`` |
| `service.getEvent.requestDeserialize` | (`value`: `Buffer`) => [`EventRequest`](protobufs.md#eventrequest) |
| `service.getEvent.requestSerialize` | (`value`: [`EventRequest`](protobufs.md#eventrequest)) => `Buffer` |
| `service.getEvent.requestStream` | ``false`` |
| `service.getEvent.responseDeserialize` | (`value`: `Buffer`) => [`HubEvent`](protobufs.md#hubevent) |
| `service.getEvent.responseSerialize` | (`value`: [`HubEvent`](protobufs.md#hubevent)) => `Buffer` |
| `service.getEvent.responseStream` | ``false`` |
| `service.getFids` | { `path`: ``"/HubService/GetFids"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`FidsResponse`](protobufs.md#fidsresponse) ; `responseSerialize`: (`value`: [`FidsResponse`](protobufs.md#fidsresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getFids.path` | ``"/HubService/GetFids"`` |
| `service.getFids.requestDeserialize` | (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) |
| `service.getFids.requestSerialize` | (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` |
| `service.getFids.requestStream` | ``false`` |
| `service.getFids.responseDeserialize` | (`value`: `Buffer`) => [`FidsResponse`](protobufs.md#fidsresponse) |
| `service.getFids.responseSerialize` | (`value`: [`FidsResponse`](protobufs.md#fidsresponse)) => `Buffer` |
| `service.getFids.responseStream` | ``false`` |
| `service.getIdRegistryEvent` | { `path`: ``"/HubService/GetIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getIdRegistryEvent.path` | ``"/HubService/GetIdRegistryEvent"`` |
| `service.getIdRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) |
| `service.getIdRegistryEvent.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` |
| `service.getIdRegistryEvent.requestStream` | ``false`` |
| `service.getIdRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) |
| `service.getIdRegistryEvent.responseSerialize` | (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) => `Buffer` |
| `service.getIdRegistryEvent.responseStream` | ``false`` |
| `service.getInfo` | { `path`: ``"/HubService/GetInfo"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`HubInfoResponse`](protobufs.md#hubinforesponse) ; `responseSerialize`: (`value`: [`HubInfoResponse`](protobufs.md#hubinforesponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getInfo.path` | ``"/HubService/GetInfo"`` |
| `service.getInfo.requestDeserialize` | (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) |
| `service.getInfo.requestSerialize` | (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` |
| `service.getInfo.requestStream` | ``false`` |
| `service.getInfo.responseDeserialize` | (`value`: `Buffer`) => [`HubInfoResponse`](protobufs.md#hubinforesponse) |
| `service.getInfo.responseSerialize` | (`value`: [`HubInfoResponse`](protobufs.md#hubinforesponse)) => `Buffer` |
| `service.getInfo.responseStream` | ``false`` |
| `service.getNameRegistryEvent` | { `path`: ``"/HubService/GetNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest) ; `requestSerialize`: (`value`: [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getNameRegistryEvent.path` | ``"/HubService/GetNameRegistryEvent"`` |
| `service.getNameRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest) |
| `service.getNameRegistryEvent.requestSerialize` | (`value`: [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest)) => `Buffer` |
| `service.getNameRegistryEvent.requestStream` | ``false`` |
| `service.getNameRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) |
| `service.getNameRegistryEvent.responseSerialize` | (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) => `Buffer` |
| `service.getNameRegistryEvent.responseStream` | ``false`` |
| `service.getReaction` | { `path`: ``"/HubService/GetReaction"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionRequest`](protobufs.md#reactionrequest) ; `requestSerialize`: (`value`: [`ReactionRequest`](protobufs.md#reactionrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getReaction.path` | ``"/HubService/GetReaction"`` |
| `service.getReaction.requestDeserialize` | (`value`: `Buffer`) => [`ReactionRequest`](protobufs.md#reactionrequest) |
| `service.getReaction.requestSerialize` | (`value`: [`ReactionRequest`](protobufs.md#reactionrequest)) => `Buffer` |
| `service.getReaction.requestStream` | ``false`` |
| `service.getReaction.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs.md#message) |
| `service.getReaction.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) => `Buffer` |
| `service.getReaction.responseStream` | ``false`` |
| `service.getReactionsByCast` | { `path`: ``"/HubService/GetReactionsByCast"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest) ; `requestSerialize`: (`value`: [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getReactionsByCast.path` | ``"/HubService/GetReactionsByCast"`` |
| `service.getReactionsByCast.requestDeserialize` | (`value`: `Buffer`) => [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest) |
| `service.getReactionsByCast.requestSerialize` | (`value`: [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest)) => `Buffer` |
| `service.getReactionsByCast.requestStream` | ``false`` |
| `service.getReactionsByCast.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `service.getReactionsByCast.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` |
| `service.getReactionsByCast.responseStream` | ``false`` |
| `service.getReactionsByFid` | { `path`: ``"/HubService/GetReactionsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest) ; `requestSerialize`: (`value`: [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getReactionsByFid.path` | ``"/HubService/GetReactionsByFid"`` |
| `service.getReactionsByFid.requestDeserialize` | (`value`: `Buffer`) => [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest) |
| `service.getReactionsByFid.requestSerialize` | (`value`: [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest)) => `Buffer` |
| `service.getReactionsByFid.requestStream` | ``false`` |
| `service.getReactionsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `service.getReactionsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` |
| `service.getReactionsByFid.responseStream` | ``false`` |
| `service.getSigner` | { `path`: ``"/HubService/GetSigner"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SignerRequest`](protobufs.md#signerrequest) ; `requestSerialize`: (`value`: [`SignerRequest`](protobufs.md#signerrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getSigner.path` | ``"/HubService/GetSigner"`` |
| `service.getSigner.requestDeserialize` | (`value`: `Buffer`) => [`SignerRequest`](protobufs.md#signerrequest) |
| `service.getSigner.requestSerialize` | (`value`: [`SignerRequest`](protobufs.md#signerrequest)) => `Buffer` |
| `service.getSigner.requestStream` | ``false`` |
| `service.getSigner.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs.md#message) |
| `service.getSigner.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) => `Buffer` |
| `service.getSigner.responseStream` | ``false`` |
| `service.getSignersByFid` | { `path`: ``"/HubService/GetSignersByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getSignersByFid.path` | ``"/HubService/GetSignersByFid"`` |
| `service.getSignersByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) |
| `service.getSignersByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` |
| `service.getSignersByFid.requestStream` | ``false`` |
| `service.getSignersByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `service.getSignersByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` |
| `service.getSignersByFid.responseStream` | ``false`` |
| `service.getSyncMetadataByPrefix` | { `path`: ``"/HubService/GetSyncMetadataByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse) ; `responseSerialize`: (`value`: [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getSyncMetadataByPrefix.path` | ``"/HubService/GetSyncMetadataByPrefix"`` |
| `service.getSyncMetadataByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) |
| `service.getSyncMetadataByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) => `Buffer` |
| `service.getSyncMetadataByPrefix.requestStream` | ``false`` |
| `service.getSyncMetadataByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse) |
| `service.getSyncMetadataByPrefix.responseSerialize` | (`value`: [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse)) => `Buffer` |
| `service.getSyncMetadataByPrefix.responseStream` | ``false`` |
| `service.getSyncSnapshotByPrefix` | { `path`: ``"/HubService/GetSyncSnapshotByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse) ; `responseSerialize`: (`value`: [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getSyncSnapshotByPrefix.path` | ``"/HubService/GetSyncSnapshotByPrefix"`` |
| `service.getSyncSnapshotByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) |
| `service.getSyncSnapshotByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) => `Buffer` |
| `service.getSyncSnapshotByPrefix.requestStream` | ``false`` |
| `service.getSyncSnapshotByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse) |
| `service.getSyncSnapshotByPrefix.responseSerialize` | (`value`: [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse)) => `Buffer` |
| `service.getSyncSnapshotByPrefix.responseStream` | ``false`` |
| `service.getUserData` | { `path`: ``"/HubService/GetUserData"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`UserDataRequest`](protobufs.md#userdatarequest) ; `requestSerialize`: (`value`: [`UserDataRequest`](protobufs.md#userdatarequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getUserData.path` | ``"/HubService/GetUserData"`` |
| `service.getUserData.requestDeserialize` | (`value`: `Buffer`) => [`UserDataRequest`](protobufs.md#userdatarequest) |
| `service.getUserData.requestSerialize` | (`value`: [`UserDataRequest`](protobufs.md#userdatarequest)) => `Buffer` |
| `service.getUserData.requestStream` | ``false`` |
| `service.getUserData.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs.md#message) |
| `service.getUserData.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) => `Buffer` |
| `service.getUserData.responseStream` | ``false`` |
| `service.getUserDataByFid` | { `path`: ``"/HubService/GetUserDataByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getUserDataByFid.path` | ``"/HubService/GetUserDataByFid"`` |
| `service.getUserDataByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) |
| `service.getUserDataByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` |
| `service.getUserDataByFid.requestStream` | ``false`` |
| `service.getUserDataByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `service.getUserDataByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` |
| `service.getUserDataByFid.responseStream` | ``false`` |
| `service.getVerification` | { `path`: ``"/HubService/GetVerification"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`VerificationRequest`](protobufs.md#verificationrequest) ; `requestSerialize`: (`value`: [`VerificationRequest`](protobufs.md#verificationrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getVerification.path` | ``"/HubService/GetVerification"`` |
| `service.getVerification.requestDeserialize` | (`value`: `Buffer`) => [`VerificationRequest`](protobufs.md#verificationrequest) |
| `service.getVerification.requestSerialize` | (`value`: [`VerificationRequest`](protobufs.md#verificationrequest)) => `Buffer` |
| `service.getVerification.requestStream` | ``false`` |
| `service.getVerification.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs.md#message) |
| `service.getVerification.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) => `Buffer` |
| `service.getVerification.responseStream` | ``false`` |
| `service.getVerificationsByFid` | { `path`: ``"/HubService/GetVerificationsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getVerificationsByFid.path` | ``"/HubService/GetVerificationsByFid"`` |
| `service.getVerificationsByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) |
| `service.getVerificationsByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` |
| `service.getVerificationsByFid.requestStream` | ``false`` |
| `service.getVerificationsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `service.getVerificationsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` |
| `service.getVerificationsByFid.responseStream` | ``false`` |
| `service.submitIdRegistryEvent` | { `path`: ``"/HubService/SubmitIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) ; `requestSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.submitIdRegistryEvent.path` | ``"/HubService/SubmitIdRegistryEvent"`` |
| `service.submitIdRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) |
| `service.submitIdRegistryEvent.requestSerialize` | (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) => `Buffer` |
| `service.submitIdRegistryEvent.requestStream` | ``false`` |
| `service.submitIdRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) |
| `service.submitIdRegistryEvent.responseSerialize` | (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) => `Buffer` |
| `service.submitIdRegistryEvent.responseStream` | ``false`` |
| `service.submitMessage` | { `path`: ``"/HubService/SubmitMessage"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `requestSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.submitMessage.path` | ``"/HubService/SubmitMessage"`` |
| `service.submitMessage.requestDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs.md#message) |
| `service.submitMessage.requestSerialize` | (`value`: [`Message`](protobufs.md#message)) => `Buffer` |
| `service.submitMessage.requestStream` | ``false`` |
| `service.submitMessage.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs.md#message) |
| `service.submitMessage.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) => `Buffer` |
| `service.submitMessage.responseStream` | ``false`` |
| `service.submitNameRegistryEvent` | { `path`: ``"/HubService/SubmitNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) ; `requestSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.submitNameRegistryEvent.path` | ``"/HubService/SubmitNameRegistryEvent"`` |
| `service.submitNameRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) |
| `service.submitNameRegistryEvent.requestSerialize` | (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) => `Buffer` |
| `service.submitNameRegistryEvent.requestStream` | ``false`` |
| `service.submitNameRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) |
| `service.submitNameRegistryEvent.responseSerialize` | (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) => `Buffer` |
| `service.submitNameRegistryEvent.responseStream` | ``false`` |
| `service.subscribe` | { `path`: ``"/HubService/Subscribe"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SubscribeRequest`](protobufs.md#subscriberequest) ; `requestSerialize`: (`value`: [`SubscribeRequest`](protobufs.md#subscriberequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`HubEvent`](protobufs.md#hubevent) ; `responseSerialize`: (`value`: [`HubEvent`](protobufs.md#hubevent)) => `Buffer` ; `responseStream`: ``true``  } |
| `service.subscribe.path` | ``"/HubService/Subscribe"`` |
| `service.subscribe.requestDeserialize` | (`value`: `Buffer`) => [`SubscribeRequest`](protobufs.md#subscriberequest) |
| `service.subscribe.requestSerialize` | (`value`: [`SubscribeRequest`](protobufs.md#subscriberequest)) => `Buffer` |
| `service.subscribe.requestStream` | ``false`` |
| `service.subscribe.responseDeserialize` | (`value`: `Buffer`) => [`HubEvent`](protobufs.md#hubevent) |
| `service.subscribe.responseSerialize` | (`value`: [`HubEvent`](protobufs.md#hubevent)) => `Buffer` |
| `service.subscribe.responseStream` | ``true`` |

___

### HubServiceService

• **HubServiceService**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `getAllCastMessagesByFid` | { `path`: ``"/HubService/GetAllCastMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | Bulk Methods |
| `getAllCastMessagesByFid.path` | ``"/HubService/GetAllCastMessagesByFid"`` | - |
| `getAllCastMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) | - |
| `getAllCastMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` | - |
| `getAllCastMessagesByFid.requestStream` | ``false`` | - |
| `getAllCastMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) | - |
| `getAllCastMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` | - |
| `getAllCastMessagesByFid.responseStream` | ``false`` | - |
| `getAllMessagesBySyncIds` | { `path`: ``"/HubService/GetAllMessagesBySyncIds"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SyncIds`](protobufs.md#syncids) ; `requestSerialize`: (`value`: [`SyncIds`](protobufs.md#syncids)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getAllMessagesBySyncIds.path` | ``"/HubService/GetAllMessagesBySyncIds"`` | - |
| `getAllMessagesBySyncIds.requestDeserialize` | (`value`: `Buffer`) => [`SyncIds`](protobufs.md#syncids) | - |
| `getAllMessagesBySyncIds.requestSerialize` | (`value`: [`SyncIds`](protobufs.md#syncids)) => `Buffer` | - |
| `getAllMessagesBySyncIds.requestStream` | ``false`` | - |
| `getAllMessagesBySyncIds.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) | - |
| `getAllMessagesBySyncIds.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` | - |
| `getAllMessagesBySyncIds.responseStream` | ``false`` | - |
| `getAllReactionMessagesByFid` | { `path`: ``"/HubService/GetAllReactionMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getAllReactionMessagesByFid.path` | ``"/HubService/GetAllReactionMessagesByFid"`` | - |
| `getAllReactionMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) | - |
| `getAllReactionMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` | - |
| `getAllReactionMessagesByFid.requestStream` | ``false`` | - |
| `getAllReactionMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) | - |
| `getAllReactionMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` | - |
| `getAllReactionMessagesByFid.responseStream` | ``false`` | - |
| `getAllSignerMessagesByFid` | { `path`: ``"/HubService/GetAllSignerMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getAllSignerMessagesByFid.path` | ``"/HubService/GetAllSignerMessagesByFid"`` | - |
| `getAllSignerMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) | - |
| `getAllSignerMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` | - |
| `getAllSignerMessagesByFid.requestStream` | ``false`` | - |
| `getAllSignerMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) | - |
| `getAllSignerMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` | - |
| `getAllSignerMessagesByFid.responseStream` | ``false`` | - |
| `getAllSyncIdsByPrefix` | { `path`: ``"/HubService/GetAllSyncIdsByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`SyncIds`](protobufs.md#syncids) ; `responseSerialize`: (`value`: [`SyncIds`](protobufs.md#syncids)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getAllSyncIdsByPrefix.path` | ``"/HubService/GetAllSyncIdsByPrefix"`` | - |
| `getAllSyncIdsByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) | - |
| `getAllSyncIdsByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) => `Buffer` | - |
| `getAllSyncIdsByPrefix.requestStream` | ``false`` | - |
| `getAllSyncIdsByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`SyncIds`](protobufs.md#syncids) | - |
| `getAllSyncIdsByPrefix.responseSerialize` | (`value`: [`SyncIds`](protobufs.md#syncids)) => `Buffer` | - |
| `getAllSyncIdsByPrefix.responseStream` | ``false`` | - |
| `getAllUserDataMessagesByFid` | { `path`: ``"/HubService/GetAllUserDataMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getAllUserDataMessagesByFid.path` | ``"/HubService/GetAllUserDataMessagesByFid"`` | - |
| `getAllUserDataMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) | - |
| `getAllUserDataMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` | - |
| `getAllUserDataMessagesByFid.requestStream` | ``false`` | - |
| `getAllUserDataMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) | - |
| `getAllUserDataMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` | - |
| `getAllUserDataMessagesByFid.responseStream` | ``false`` | - |
| `getAllVerificationMessagesByFid` | { `path`: ``"/HubService/GetAllVerificationMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getAllVerificationMessagesByFid.path` | ``"/HubService/GetAllVerificationMessagesByFid"`` | - |
| `getAllVerificationMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) | - |
| `getAllVerificationMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` | - |
| `getAllVerificationMessagesByFid.requestStream` | ``false`` | - |
| `getAllVerificationMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) | - |
| `getAllVerificationMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` | - |
| `getAllVerificationMessagesByFid.responseStream` | ``false`` | - |
| `getCast` | { `path`: ``"/HubService/GetCast"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](protobufs.md#castid) ; `requestSerialize`: (`value`: [`CastId`](protobufs.md#castid)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } | Casts |
| `getCast.path` | ``"/HubService/GetCast"`` | - |
| `getCast.requestDeserialize` | (`value`: `Buffer`) => [`CastId`](protobufs.md#castid) | - |
| `getCast.requestSerialize` | (`value`: [`CastId`](protobufs.md#castid)) => `Buffer` | - |
| `getCast.requestStream` | ``false`` | - |
| `getCast.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs.md#message) | - |
| `getCast.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) => `Buffer` | - |
| `getCast.responseStream` | ``false`` | - |
| `getCastsByFid` | { `path`: ``"/HubService/GetCastsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getCastsByFid.path` | ``"/HubService/GetCastsByFid"`` | - |
| `getCastsByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) | - |
| `getCastsByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` | - |
| `getCastsByFid.requestStream` | ``false`` | - |
| `getCastsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) | - |
| `getCastsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` | - |
| `getCastsByFid.responseStream` | ``false`` | - |
| `getCastsByMention` | { `path`: ``"/HubService/GetCastsByMention"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getCastsByMention.path` | ``"/HubService/GetCastsByMention"`` | - |
| `getCastsByMention.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) | - |
| `getCastsByMention.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` | - |
| `getCastsByMention.requestStream` | ``false`` | - |
| `getCastsByMention.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) | - |
| `getCastsByMention.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` | - |
| `getCastsByMention.responseStream` | ``false`` | - |
| `getCastsByParent` | { `path`: ``"/HubService/GetCastsByParent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](protobufs.md#castid) ; `requestSerialize`: (`value`: [`CastId`](protobufs.md#castid)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getCastsByParent.path` | ``"/HubService/GetCastsByParent"`` | - |
| `getCastsByParent.requestDeserialize` | (`value`: `Buffer`) => [`CastId`](protobufs.md#castid) | - |
| `getCastsByParent.requestSerialize` | (`value`: [`CastId`](protobufs.md#castid)) => `Buffer` | - |
| `getCastsByParent.requestStream` | ``false`` | - |
| `getCastsByParent.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) | - |
| `getCastsByParent.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` | - |
| `getCastsByParent.responseStream` | ``false`` | - |
| `getEvent` | { `path`: ``"/HubService/GetEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`EventRequest`](protobufs.md#eventrequest) ; `requestSerialize`: (`value`: [`EventRequest`](protobufs.md#eventrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`HubEvent`](protobufs.md#hubevent) ; `responseSerialize`: (`value`: [`HubEvent`](protobufs.md#hubevent)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getEvent.path` | ``"/HubService/GetEvent"`` | - |
| `getEvent.requestDeserialize` | (`value`: `Buffer`) => [`EventRequest`](protobufs.md#eventrequest) | - |
| `getEvent.requestSerialize` | (`value`: [`EventRequest`](protobufs.md#eventrequest)) => `Buffer` | - |
| `getEvent.requestStream` | ``false`` | - |
| `getEvent.responseDeserialize` | (`value`: `Buffer`) => [`HubEvent`](protobufs.md#hubevent) | - |
| `getEvent.responseSerialize` | (`value`: [`HubEvent`](protobufs.md#hubevent)) => `Buffer` | - |
| `getEvent.responseStream` | ``false`` | - |
| `getFids` | { `path`: ``"/HubService/GetFids"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`FidsResponse`](protobufs.md#fidsresponse) ; `responseSerialize`: (`value`: [`FidsResponse`](protobufs.md#fidsresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getFids.path` | ``"/HubService/GetFids"`` | - |
| `getFids.requestDeserialize` | (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) | - |
| `getFids.requestSerialize` | (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` | - |
| `getFids.requestStream` | ``false`` | - |
| `getFids.responseDeserialize` | (`value`: `Buffer`) => [`FidsResponse`](protobufs.md#fidsresponse) | - |
| `getFids.responseSerialize` | (`value`: [`FidsResponse`](protobufs.md#fidsresponse)) => `Buffer` | - |
| `getFids.responseStream` | ``false`` | - |
| `getIdRegistryEvent` | { `path`: ``"/HubService/GetIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getIdRegistryEvent.path` | ``"/HubService/GetIdRegistryEvent"`` | - |
| `getIdRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) | - |
| `getIdRegistryEvent.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` | - |
| `getIdRegistryEvent.requestStream` | ``false`` | - |
| `getIdRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) | - |
| `getIdRegistryEvent.responseSerialize` | (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) => `Buffer` | - |
| `getIdRegistryEvent.responseStream` | ``false`` | - |
| `getInfo` | { `path`: ``"/HubService/GetInfo"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`HubInfoResponse`](protobufs.md#hubinforesponse) ; `responseSerialize`: (`value`: [`HubInfoResponse`](protobufs.md#hubinforesponse)) => `Buffer` ; `responseStream`: ``false``  } | Sync Methods |
| `getInfo.path` | ``"/HubService/GetInfo"`` | - |
| `getInfo.requestDeserialize` | (`value`: `Buffer`) => [`Empty`](protobufs.md#empty) | - |
| `getInfo.requestSerialize` | (`value`: [`Empty`](protobufs.md#empty)) => `Buffer` | - |
| `getInfo.requestStream` | ``false`` | - |
| `getInfo.responseDeserialize` | (`value`: `Buffer`) => [`HubInfoResponse`](protobufs.md#hubinforesponse) | - |
| `getInfo.responseSerialize` | (`value`: [`HubInfoResponse`](protobufs.md#hubinforesponse)) => `Buffer` | - |
| `getInfo.responseStream` | ``false`` | - |
| `getNameRegistryEvent` | { `path`: ``"/HubService/GetNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest) ; `requestSerialize`: (`value`: [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getNameRegistryEvent.path` | ``"/HubService/GetNameRegistryEvent"`` | - |
| `getNameRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest) | - |
| `getNameRegistryEvent.requestSerialize` | (`value`: [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest)) => `Buffer` | - |
| `getNameRegistryEvent.requestStream` | ``false`` | - |
| `getNameRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) | - |
| `getNameRegistryEvent.responseSerialize` | (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) => `Buffer` | - |
| `getNameRegistryEvent.responseStream` | ``false`` | - |
| `getReaction` | { `path`: ``"/HubService/GetReaction"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionRequest`](protobufs.md#reactionrequest) ; `requestSerialize`: (`value`: [`ReactionRequest`](protobufs.md#reactionrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } | Reactions |
| `getReaction.path` | ``"/HubService/GetReaction"`` | - |
| `getReaction.requestDeserialize` | (`value`: `Buffer`) => [`ReactionRequest`](protobufs.md#reactionrequest) | - |
| `getReaction.requestSerialize` | (`value`: [`ReactionRequest`](protobufs.md#reactionrequest)) => `Buffer` | - |
| `getReaction.requestStream` | ``false`` | - |
| `getReaction.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs.md#message) | - |
| `getReaction.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) => `Buffer` | - |
| `getReaction.responseStream` | ``false`` | - |
| `getReactionsByCast` | { `path`: ``"/HubService/GetReactionsByCast"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest) ; `requestSerialize`: (`value`: [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getReactionsByCast.path` | ``"/HubService/GetReactionsByCast"`` | - |
| `getReactionsByCast.requestDeserialize` | (`value`: `Buffer`) => [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest) | - |
| `getReactionsByCast.requestSerialize` | (`value`: [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest)) => `Buffer` | - |
| `getReactionsByCast.requestStream` | ``false`` | - |
| `getReactionsByCast.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) | - |
| `getReactionsByCast.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` | - |
| `getReactionsByCast.responseStream` | ``false`` | - |
| `getReactionsByFid` | { `path`: ``"/HubService/GetReactionsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest) ; `requestSerialize`: (`value`: [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getReactionsByFid.path` | ``"/HubService/GetReactionsByFid"`` | - |
| `getReactionsByFid.requestDeserialize` | (`value`: `Buffer`) => [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest) | - |
| `getReactionsByFid.requestSerialize` | (`value`: [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest)) => `Buffer` | - |
| `getReactionsByFid.requestStream` | ``false`` | - |
| `getReactionsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) | - |
| `getReactionsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` | - |
| `getReactionsByFid.responseStream` | ``false`` | - |
| `getSigner` | { `path`: ``"/HubService/GetSigner"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SignerRequest`](protobufs.md#signerrequest) ; `requestSerialize`: (`value`: [`SignerRequest`](protobufs.md#signerrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } | Signer |
| `getSigner.path` | ``"/HubService/GetSigner"`` | - |
| `getSigner.requestDeserialize` | (`value`: `Buffer`) => [`SignerRequest`](protobufs.md#signerrequest) | - |
| `getSigner.requestSerialize` | (`value`: [`SignerRequest`](protobufs.md#signerrequest)) => `Buffer` | - |
| `getSigner.requestStream` | ``false`` | - |
| `getSigner.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs.md#message) | - |
| `getSigner.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) => `Buffer` | - |
| `getSigner.responseStream` | ``false`` | - |
| `getSignersByFid` | { `path`: ``"/HubService/GetSignersByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getSignersByFid.path` | ``"/HubService/GetSignersByFid"`` | - |
| `getSignersByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) | - |
| `getSignersByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` | - |
| `getSignersByFid.requestStream` | ``false`` | - |
| `getSignersByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) | - |
| `getSignersByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` | - |
| `getSignersByFid.responseStream` | ``false`` | - |
| `getSyncMetadataByPrefix` | { `path`: ``"/HubService/GetSyncMetadataByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse) ; `responseSerialize`: (`value`: [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getSyncMetadataByPrefix.path` | ``"/HubService/GetSyncMetadataByPrefix"`` | - |
| `getSyncMetadataByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) | - |
| `getSyncMetadataByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) => `Buffer` | - |
| `getSyncMetadataByPrefix.requestStream` | ``false`` | - |
| `getSyncMetadataByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse) | - |
| `getSyncMetadataByPrefix.responseSerialize` | (`value`: [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse)) => `Buffer` | - |
| `getSyncMetadataByPrefix.responseStream` | ``false`` | - |
| `getSyncSnapshotByPrefix` | { `path`: ``"/HubService/GetSyncSnapshotByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse) ; `responseSerialize`: (`value`: [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getSyncSnapshotByPrefix.path` | ``"/HubService/GetSyncSnapshotByPrefix"`` | - |
| `getSyncSnapshotByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) | - |
| `getSyncSnapshotByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) => `Buffer` | - |
| `getSyncSnapshotByPrefix.requestStream` | ``false`` | - |
| `getSyncSnapshotByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse) | - |
| `getSyncSnapshotByPrefix.responseSerialize` | (`value`: [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse)) => `Buffer` | - |
| `getSyncSnapshotByPrefix.responseStream` | ``false`` | - |
| `getUserData` | { `path`: ``"/HubService/GetUserData"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`UserDataRequest`](protobufs.md#userdatarequest) ; `requestSerialize`: (`value`: [`UserDataRequest`](protobufs.md#userdatarequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } | User Data |
| `getUserData.path` | ``"/HubService/GetUserData"`` | - |
| `getUserData.requestDeserialize` | (`value`: `Buffer`) => [`UserDataRequest`](protobufs.md#userdatarequest) | - |
| `getUserData.requestSerialize` | (`value`: [`UserDataRequest`](protobufs.md#userdatarequest)) => `Buffer` | - |
| `getUserData.requestStream` | ``false`` | - |
| `getUserData.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs.md#message) | - |
| `getUserData.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) => `Buffer` | - |
| `getUserData.responseStream` | ``false`` | - |
| `getUserDataByFid` | { `path`: ``"/HubService/GetUserDataByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getUserDataByFid.path` | ``"/HubService/GetUserDataByFid"`` | - |
| `getUserDataByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) | - |
| `getUserDataByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` | - |
| `getUserDataByFid.requestStream` | ``false`` | - |
| `getUserDataByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) | - |
| `getUserDataByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` | - |
| `getUserDataByFid.responseStream` | ``false`` | - |
| `getVerification` | { `path`: ``"/HubService/GetVerification"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`VerificationRequest`](protobufs.md#verificationrequest) ; `requestSerialize`: (`value`: [`VerificationRequest`](protobufs.md#verificationrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } | Verifications |
| `getVerification.path` | ``"/HubService/GetVerification"`` | - |
| `getVerification.requestDeserialize` | (`value`: `Buffer`) => [`VerificationRequest`](protobufs.md#verificationrequest) | - |
| `getVerification.requestSerialize` | (`value`: [`VerificationRequest`](protobufs.md#verificationrequest)) => `Buffer` | - |
| `getVerification.requestStream` | ``false`` | - |
| `getVerification.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs.md#message) | - |
| `getVerification.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) => `Buffer` | - |
| `getVerification.responseStream` | ``false`` | - |
| `getVerificationsByFid` | { `path`: ``"/HubService/GetVerificationsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getVerificationsByFid.path` | ``"/HubService/GetVerificationsByFid"`` | - |
| `getVerificationsByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs.md#fidrequest) | - |
| `getVerificationsByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) => `Buffer` | - |
| `getVerificationsByFid.requestStream` | ``false`` | - |
| `getVerificationsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs.md#messagesresponse) | - |
| `getVerificationsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `Buffer` | - |
| `getVerificationsByFid.responseStream` | ``false`` | - |
| `submitIdRegistryEvent` | { `path`: ``"/HubService/SubmitIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) ; `requestSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `submitIdRegistryEvent.path` | ``"/HubService/SubmitIdRegistryEvent"`` | - |
| `submitIdRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) | - |
| `submitIdRegistryEvent.requestSerialize` | (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) => `Buffer` | - |
| `submitIdRegistryEvent.requestStream` | ``false`` | - |
| `submitIdRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) | - |
| `submitIdRegistryEvent.responseSerialize` | (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) => `Buffer` | - |
| `submitIdRegistryEvent.responseStream` | ``false`` | - |
| `submitMessage` | { `path`: ``"/HubService/SubmitMessage"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `requestSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } | Submit Methods |
| `submitMessage.path` | ``"/HubService/SubmitMessage"`` | - |
| `submitMessage.requestDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs.md#message) | - |
| `submitMessage.requestSerialize` | (`value`: [`Message`](protobufs.md#message)) => `Buffer` | - |
| `submitMessage.requestStream` | ``false`` | - |
| `submitMessage.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs.md#message) | - |
| `submitMessage.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) => `Buffer` | - |
| `submitMessage.responseStream` | ``false`` | - |
| `submitNameRegistryEvent` | { `path`: ``"/HubService/SubmitNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) ; `requestSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `submitNameRegistryEvent.path` | ``"/HubService/SubmitNameRegistryEvent"`` | - |
| `submitNameRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) | - |
| `submitNameRegistryEvent.requestSerialize` | (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) => `Buffer` | - |
| `submitNameRegistryEvent.requestStream` | ``false`` | - |
| `submitNameRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) | - |
| `submitNameRegistryEvent.responseSerialize` | (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) => `Buffer` | - |
| `submitNameRegistryEvent.responseStream` | ``false`` | - |
| `subscribe` | { `path`: ``"/HubService/Subscribe"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SubscribeRequest`](protobufs.md#subscriberequest) ; `requestSerialize`: (`value`: [`SubscribeRequest`](protobufs.md#subscriberequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`HubEvent`](protobufs.md#hubevent) ; `responseSerialize`: (`value`: [`HubEvent`](protobufs.md#hubevent)) => `Buffer` ; `responseStream`: ``true``  } | Event Methods |
| `subscribe.path` | ``"/HubService/Subscribe"`` | - |
| `subscribe.requestDeserialize` | (`value`: `Buffer`) => [`SubscribeRequest`](protobufs.md#subscriberequest) | - |
| `subscribe.requestSerialize` | (`value`: [`SubscribeRequest`](protobufs.md#subscriberequest)) => `Buffer` | - |
| `subscribe.requestStream` | ``false`` | - |
| `subscribe.responseDeserialize` | (`value`: `Buffer`) => [`HubEvent`](protobufs.md#hubevent) | - |
| `subscribe.responseSerialize` | (`value`: [`HubEvent`](protobufs.md#hubevent)) => `Buffer` | - |
| `subscribe.responseStream` | ``true`` | - |

___

### HubState

• **HubState**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`HubState`](protobufs.md#hubstate) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`HubState`](protobufs.md#hubstate) |
| `encode` | (`message`: [`HubState`](protobufs.md#hubstate), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`HubState`](protobufs.md#hubstate) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`HubState`](protobufs.md#hubstate) |
| `toJSON` | (`message`: [`HubState`](protobufs.md#hubstate)) => `unknown` |

___

### IdRegistryEvent

• **IdRegistryEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) |
| `encode` | (`message`: [`IdRegistryEvent`](protobufs.md#idregistryevent), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`IdRegistryEvent`](protobufs.md#idregistryevent) |
| `toJSON` | (`message`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) => `unknown` |

___

### MergeIdRegistryEventBody

• **MergeIdRegistryEventBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`MergeIdRegistryEventBody`](protobufs.md#mergeidregistryeventbody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`MergeIdRegistryEventBody`](protobufs.md#mergeidregistryeventbody) |
| `encode` | (`message`: [`MergeIdRegistryEventBody`](protobufs.md#mergeidregistryeventbody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`MergeIdRegistryEventBody`](protobufs.md#mergeidregistryeventbody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`MergeIdRegistryEventBody`](protobufs.md#mergeidregistryeventbody) |
| `toJSON` | (`message`: [`MergeIdRegistryEventBody`](protobufs.md#mergeidregistryeventbody)) => `unknown` |

___

### MergeMessageBody

• **MergeMessageBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`MergeMessageBody`](protobufs.md#mergemessagebody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`MergeMessageBody`](protobufs.md#mergemessagebody) |
| `encode` | (`message`: [`MergeMessageBody`](protobufs.md#mergemessagebody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`MergeMessageBody`](protobufs.md#mergemessagebody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`MergeMessageBody`](protobufs.md#mergemessagebody) |
| `toJSON` | (`message`: [`MergeMessageBody`](protobufs.md#mergemessagebody)) => `unknown` |

___

### MergeNameRegistryEventBody

• **MergeNameRegistryEventBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`MergeNameRegistryEventBody`](protobufs.md#mergenameregistryeventbody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`MergeNameRegistryEventBody`](protobufs.md#mergenameregistryeventbody) |
| `encode` | (`message`: [`MergeNameRegistryEventBody`](protobufs.md#mergenameregistryeventbody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`MergeNameRegistryEventBody`](protobufs.md#mergenameregistryeventbody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`MergeNameRegistryEventBody`](protobufs.md#mergenameregistryeventbody) |
| `toJSON` | (`message`: [`MergeNameRegistryEventBody`](protobufs.md#mergenameregistryeventbody)) => `unknown` |

___

### Message

• **Message**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`Message`](protobufs.md#message) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`Message`](protobufs.md#message) |
| `encode` | (`message`: [`Message`](protobufs.md#message), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`Message`](protobufs.md#message) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`Message`](protobufs.md#message) |
| `toJSON` | (`message`: [`Message`](protobufs.md#message)) => `unknown` |

___

### MessageData

• **MessageData**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`MessageData`](protobufs.md#messagedata) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`MessageData`](protobufs.md#messagedata) |
| `encode` | (`message`: [`MessageData`](protobufs.md#messagedata), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`MessageData`](protobufs.md#messagedata) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`MessageData`](protobufs.md#messagedata) |
| `toJSON` | (`message`: [`MessageData`](protobufs.md#messagedata)) => `unknown` |

___

### MessagesResponse

• **MessagesResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `encode` | (`message`: [`MessagesResponse`](protobufs.md#messagesresponse), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`MessagesResponse`](protobufs.md#messagesresponse) |
| `toJSON` | (`message`: [`MessagesResponse`](protobufs.md#messagesresponse)) => `unknown` |

___

### NameRegistryEvent

• **NameRegistryEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) |
| `encode` | (`message`: [`NameRegistryEvent`](protobufs.md#nameregistryevent), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`NameRegistryEvent`](protobufs.md#nameregistryevent) |
| `toJSON` | (`message`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) => `unknown` |

___

### NameRegistryEventRequest

• **NameRegistryEventRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest) |
| `encode` | (`message`: [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest) |
| `toJSON` | (`message`: [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest)) => `unknown` |

___

### PruneMessageBody

• **PruneMessageBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`PruneMessageBody`](protobufs.md#prunemessagebody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`PruneMessageBody`](protobufs.md#prunemessagebody) |
| `encode` | (`message`: [`PruneMessageBody`](protobufs.md#prunemessagebody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`PruneMessageBody`](protobufs.md#prunemessagebody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`PruneMessageBody`](protobufs.md#prunemessagebody) |
| `toJSON` | (`message`: [`PruneMessageBody`](protobufs.md#prunemessagebody)) => `unknown` |

___

### ReactionBody

• **ReactionBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`ReactionBody`](protobufs.md#reactionbody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`ReactionBody`](protobufs.md#reactionbody) |
| `encode` | (`message`: [`ReactionBody`](protobufs.md#reactionbody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`ReactionBody`](protobufs.md#reactionbody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`ReactionBody`](protobufs.md#reactionbody) |
| `toJSON` | (`message`: [`ReactionBody`](protobufs.md#reactionbody)) => `unknown` |

___

### ReactionRequest

• **ReactionRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`ReactionRequest`](protobufs.md#reactionrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`ReactionRequest`](protobufs.md#reactionrequest) |
| `encode` | (`message`: [`ReactionRequest`](protobufs.md#reactionrequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`ReactionRequest`](protobufs.md#reactionrequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`ReactionRequest`](protobufs.md#reactionrequest) |
| `toJSON` | (`message`: [`ReactionRequest`](protobufs.md#reactionrequest)) => `unknown` |

___

### ReactionsByCastRequest

• **ReactionsByCastRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest) |
| `encode` | (`message`: [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest) |
| `toJSON` | (`message`: [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest)) => `unknown` |

___

### ReactionsByFidRequest

• **ReactionsByFidRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest) |
| `encode` | (`message`: [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest) |
| `toJSON` | (`message`: [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest)) => `unknown` |

___

### RevokeMessageBody

• **RevokeMessageBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`RevokeMessageBody`](protobufs.md#revokemessagebody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`RevokeMessageBody`](protobufs.md#revokemessagebody) |
| `encode` | (`message`: [`RevokeMessageBody`](protobufs.md#revokemessagebody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`RevokeMessageBody`](protobufs.md#revokemessagebody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`RevokeMessageBody`](protobufs.md#revokemessagebody) |
| `toJSON` | (`message`: [`RevokeMessageBody`](protobufs.md#revokemessagebody)) => `unknown` |

___

### RevokeSignerJobPayload

• **RevokeSignerJobPayload**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`RevokeSignerJobPayload`](protobufs.md#revokesignerjobpayload) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`RevokeSignerJobPayload`](protobufs.md#revokesignerjobpayload) |
| `encode` | (`message`: [`RevokeSignerJobPayload`](protobufs.md#revokesignerjobpayload), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`RevokeSignerJobPayload`](protobufs.md#revokesignerjobpayload) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`RevokeSignerJobPayload`](protobufs.md#revokesignerjobpayload) |
| `toJSON` | (`message`: [`RevokeSignerJobPayload`](protobufs.md#revokesignerjobpayload)) => `unknown` |

___

### SignerBody

• **SignerBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`SignerBody`](protobufs.md#signerbody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`SignerBody`](protobufs.md#signerbody) |
| `encode` | (`message`: [`SignerBody`](protobufs.md#signerbody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`SignerBody`](protobufs.md#signerbody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`SignerBody`](protobufs.md#signerbody) |
| `toJSON` | (`message`: [`SignerBody`](protobufs.md#signerbody)) => `unknown` |

___

### SignerRequest

• **SignerRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`SignerRequest`](protobufs.md#signerrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`SignerRequest`](protobufs.md#signerrequest) |
| `encode` | (`message`: [`SignerRequest`](protobufs.md#signerrequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`SignerRequest`](protobufs.md#signerrequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`SignerRequest`](protobufs.md#signerrequest) |
| `toJSON` | (`message`: [`SignerRequest`](protobufs.md#signerrequest)) => `unknown` |

___

### SubscribeRequest

• **SubscribeRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`SubscribeRequest`](protobufs.md#subscriberequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`SubscribeRequest`](protobufs.md#subscriberequest) |
| `encode` | (`message`: [`SubscribeRequest`](protobufs.md#subscriberequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`SubscribeRequest`](protobufs.md#subscriberequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`SubscribeRequest`](protobufs.md#subscriberequest) |
| `toJSON` | (`message`: [`SubscribeRequest`](protobufs.md#subscriberequest)) => `unknown` |

___

### SyncIds

• **SyncIds**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`SyncIds`](protobufs.md#syncids) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`SyncIds`](protobufs.md#syncids) |
| `encode` | (`message`: [`SyncIds`](protobufs.md#syncids), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`SyncIds`](protobufs.md#syncids) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`SyncIds`](protobufs.md#syncids) |
| `toJSON` | (`message`: [`SyncIds`](protobufs.md#syncids)) => `unknown` |

___

### TrieNodeMetadataResponse

• **TrieNodeMetadataResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse) |
| `encode` | (`message`: [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse) |
| `toJSON` | (`message`: [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse)) => `unknown` |

___

### TrieNodePrefix

• **TrieNodePrefix**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) |
| `encode` | (`message`: [`TrieNodePrefix`](protobufs.md#trienodeprefix), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`TrieNodePrefix`](protobufs.md#trienodeprefix) |
| `toJSON` | (`message`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) => `unknown` |

___

### TrieNodeSnapshotResponse

• **TrieNodeSnapshotResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse) |
| `encode` | (`message`: [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse) |
| `toJSON` | (`message`: [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse)) => `unknown` |

___

### UpdateNameRegistryEventExpiryJobPayload

• **UpdateNameRegistryEventExpiryJobPayload**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`UpdateNameRegistryEventExpiryJobPayload`](protobufs.md#updatenameregistryeventexpiryjobpayload) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`UpdateNameRegistryEventExpiryJobPayload`](protobufs.md#updatenameregistryeventexpiryjobpayload) |
| `encode` | (`message`: [`UpdateNameRegistryEventExpiryJobPayload`](protobufs.md#updatenameregistryeventexpiryjobpayload), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`UpdateNameRegistryEventExpiryJobPayload`](protobufs.md#updatenameregistryeventexpiryjobpayload) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`UpdateNameRegistryEventExpiryJobPayload`](protobufs.md#updatenameregistryeventexpiryjobpayload) |
| `toJSON` | (`message`: [`UpdateNameRegistryEventExpiryJobPayload`](protobufs.md#updatenameregistryeventexpiryjobpayload)) => `unknown` |

___

### UserDataBody

• **UserDataBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`UserDataBody`](protobufs.md#userdatabody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`UserDataBody`](protobufs.md#userdatabody) |
| `encode` | (`message`: [`UserDataBody`](protobufs.md#userdatabody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`UserDataBody`](protobufs.md#userdatabody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`UserDataBody`](protobufs.md#userdatabody) |
| `toJSON` | (`message`: [`UserDataBody`](protobufs.md#userdatabody)) => `unknown` |

___

### UserDataRequest

• **UserDataRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`UserDataRequest`](protobufs.md#userdatarequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`UserDataRequest`](protobufs.md#userdatarequest) |
| `encode` | (`message`: [`UserDataRequest`](protobufs.md#userdatarequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`UserDataRequest`](protobufs.md#userdatarequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`UserDataRequest`](protobufs.md#userdatarequest) |
| `toJSON` | (`message`: [`UserDataRequest`](protobufs.md#userdatarequest)) => `unknown` |

___

### VerificationAddEthAddressBody

• **VerificationAddEthAddressBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`VerificationAddEthAddressBody`](protobufs.md#verificationaddethaddressbody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`VerificationAddEthAddressBody`](protobufs.md#verificationaddethaddressbody) |
| `encode` | (`message`: [`VerificationAddEthAddressBody`](protobufs.md#verificationaddethaddressbody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`VerificationAddEthAddressBody`](protobufs.md#verificationaddethaddressbody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`VerificationAddEthAddressBody`](protobufs.md#verificationaddethaddressbody) |
| `toJSON` | (`message`: [`VerificationAddEthAddressBody`](protobufs.md#verificationaddethaddressbody)) => `unknown` |

___

### VerificationRemoveBody

• **VerificationRemoveBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`VerificationRemoveBody`](protobufs.md#verificationremovebody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`VerificationRemoveBody`](protobufs.md#verificationremovebody) |
| `encode` | (`message`: [`VerificationRemoveBody`](protobufs.md#verificationremovebody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`VerificationRemoveBody`](protobufs.md#verificationremovebody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`VerificationRemoveBody`](protobufs.md#verificationremovebody) |
| `toJSON` | (`message`: [`VerificationRemoveBody`](protobufs.md#verificationremovebody)) => `unknown` |

___

### VerificationRequest

• **VerificationRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`VerificationRequest`](protobufs.md#verificationrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`VerificationRequest`](protobufs.md#verificationrequest) |
| `encode` | (`message`: [`VerificationRequest`](protobufs.md#verificationrequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`VerificationRequest`](protobufs.md#verificationrequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`VerificationRequest`](protobufs.md#verificationrequest) |
| `toJSON` | (`message`: [`VerificationRequest`](protobufs.md#verificationrequest)) => `unknown` |

## Functions

### farcasterNetworkFromJSON

▸ **farcasterNetworkFromJSON**(`object`): [`FarcasterNetwork`](../enums/protobufs.FarcasterNetwork.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`FarcasterNetwork`](../enums/protobufs.FarcasterNetwork.md)

___

### farcasterNetworkToJSON

▸ **farcasterNetworkToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`FarcasterNetwork`](../enums/protobufs.FarcasterNetwork.md) |

#### Returns

`string`

___

### getAdminClient

▸ **getAdminClient**(`address`): [`AdminServiceClient`](protobufs.md#adminserviceclient)

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Returns

[`AdminServiceClient`](protobufs.md#adminserviceclient)

___

### getClient

▸ **getClient**(`address`): [`HubServiceClient`](protobufs.md#hubserviceclient)

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Returns

[`HubServiceClient`](protobufs.md#hubserviceclient)

___

### getServer

▸ **getServer**(): `Server`

#### Returns

`Server`

___

### gossipVersionFromJSON

▸ **gossipVersionFromJSON**(`object`): [`GossipVersion`](../enums/protobufs.GossipVersion.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`GossipVersion`](../enums/protobufs.GossipVersion.md)

___

### gossipVersionToJSON

▸ **gossipVersionToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`GossipVersion`](../enums/protobufs.GossipVersion.md) |

#### Returns

`string`

___

### hashSchemeFromJSON

▸ **hashSchemeFromJSON**(`object`): [`HashScheme`](../enums/protobufs.HashScheme.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`HashScheme`](../enums/protobufs.HashScheme.md)

___

### hashSchemeToJSON

▸ **hashSchemeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`HashScheme`](../enums/protobufs.HashScheme.md) |

#### Returns

`string`

___

### hubEventTypeFromJSON

▸ **hubEventTypeFromJSON**(`object`): [`HubEventType`](../enums/protobufs.HubEventType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`HubEventType`](../enums/protobufs.HubEventType.md)

___

### hubEventTypeToJSON

▸ **hubEventTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`HubEventType`](../enums/protobufs.HubEventType.md) |

#### Returns

`string`

___

### idRegistryEventTypeFromJSON

▸ **idRegistryEventTypeFromJSON**(`object`): [`IdRegistryEventType`](../enums/protobufs.IdRegistryEventType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`IdRegistryEventType`](../enums/protobufs.IdRegistryEventType.md)

___

### idRegistryEventTypeToJSON

▸ **idRegistryEventTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`IdRegistryEventType`](../enums/protobufs.IdRegistryEventType.md) |

#### Returns

`string`

___

### isCastAddData

▸ **isCastAddData**(`data`): data is CastAddData

Message typeguards

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

#### Returns

data is CastAddData

___

### isCastAddMessage

▸ **isCastAddMessage**(`message`): message is CastAddMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

#### Returns

message is CastAddMessage

___

### isCastRemoveData

▸ **isCastRemoveData**(`data`): data is CastRemoveData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

#### Returns

data is CastRemoveData

___

### isCastRemoveMessage

▸ **isCastRemoveMessage**(`message`): message is CastRemoveMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

#### Returns

message is CastRemoveMessage

___

### isMergeIdRegistryEventHubEvent

▸ **isMergeIdRegistryEventHubEvent**(`event`): event is MergeIdRegistryEventHubEvent

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`HubEvent`](protobufs.md#hubevent) |

#### Returns

event is MergeIdRegistryEventHubEvent

___

### isMergeMessageHubEvent

▸ **isMergeMessageHubEvent**(`event`): event is MergeMessageHubEvent

Hub event typeguards

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`HubEvent`](protobufs.md#hubevent) |

#### Returns

event is MergeMessageHubEvent

___

### isMergeNameRegistryEventHubEvent

▸ **isMergeNameRegistryEventHubEvent**(`event`): event is MergeNameRegistryEventHubEvent

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`HubEvent`](protobufs.md#hubevent) |

#### Returns

event is MergeNameRegistryEventHubEvent

___

### isPruneMessageHubEvent

▸ **isPruneMessageHubEvent**(`event`): event is PruneMessageHubEvent

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`HubEvent`](protobufs.md#hubevent) |

#### Returns

event is PruneMessageHubEvent

___

### isReactionAddData

▸ **isReactionAddData**(`data`): data is ReactionAddData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

#### Returns

data is ReactionAddData

___

### isReactionAddMessage

▸ **isReactionAddMessage**(`message`): message is ReactionAddMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

#### Returns

message is ReactionAddMessage

___

### isReactionRemoveData

▸ **isReactionRemoveData**(`data`): data is ReactionRemoveData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

#### Returns

data is ReactionRemoveData

___

### isReactionRemoveMessage

▸ **isReactionRemoveMessage**(`message`): message is ReactionRemoveMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

#### Returns

message is ReactionRemoveMessage

___

### isRevokeMessageHubEvent

▸ **isRevokeMessageHubEvent**(`event`): event is RevokeMessageHubEvent

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`HubEvent`](protobufs.md#hubevent) |

#### Returns

event is RevokeMessageHubEvent

___

### isSignerAddData

▸ **isSignerAddData**(`data`): data is SignerAddData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

#### Returns

data is SignerAddData

___

### isSignerAddMessage

▸ **isSignerAddMessage**(`message`): message is SignerAddMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

#### Returns

message is SignerAddMessage

___

### isSignerRemoveData

▸ **isSignerRemoveData**(`data`): data is SignerRemoveData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

#### Returns

data is SignerRemoveData

___

### isSignerRemoveMessage

▸ **isSignerRemoveMessage**(`message`): message is SignerRemoveMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

#### Returns

message is SignerRemoveMessage

___

### isUserDataAddData

▸ **isUserDataAddData**(`data`): data is UserDataAddData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

#### Returns

data is UserDataAddData

___

### isUserDataAddMessage

▸ **isUserDataAddMessage**(`message`): message is UserDataAddMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

#### Returns

message is UserDataAddMessage

___

### isVerificationAddEthAddressData

▸ **isVerificationAddEthAddressData**(`data`): data is VerificationAddEthAddressData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

#### Returns

data is VerificationAddEthAddressData

___

### isVerificationAddEthAddressMessage

▸ **isVerificationAddEthAddressMessage**(`message`): message is VerificationAddEthAddressMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

#### Returns

message is VerificationAddEthAddressMessage

___

### isVerificationRemoveData

▸ **isVerificationRemoveData**(`data`): data is VerificationRemoveData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

#### Returns

data is VerificationRemoveData

___

### isVerificationRemoveMessage

▸ **isVerificationRemoveMessage**(`message`): message is VerificationRemoveMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

#### Returns

message is VerificationRemoveMessage

___

### messageTypeFromJSON

▸ **messageTypeFromJSON**(`object`): [`MessageType`](../enums/protobufs.MessageType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`MessageType`](../enums/protobufs.MessageType.md)

___

### messageTypeToJSON

▸ **messageTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`MessageType`](../enums/protobufs.MessageType.md) |

#### Returns

`string`

___

### nameRegistryEventTypeFromJSON

▸ **nameRegistryEventTypeFromJSON**(`object`): [`NameRegistryEventType`](../enums/protobufs.NameRegistryEventType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`NameRegistryEventType`](../enums/protobufs.NameRegistryEventType.md)

___

### nameRegistryEventTypeToJSON

▸ **nameRegistryEventTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`NameRegistryEventType`](../enums/protobufs.NameRegistryEventType.md) |

#### Returns

`string`

___

### reactionTypeFromJSON

▸ **reactionTypeFromJSON**(`object`): [`ReactionType`](../enums/protobufs.ReactionType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`ReactionType`](../enums/protobufs.ReactionType.md)

___

### reactionTypeToJSON

▸ **reactionTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`ReactionType`](../enums/protobufs.ReactionType.md) |

#### Returns

`string`

___

### signatureSchemeFromJSON

▸ **signatureSchemeFromJSON**(`object`): [`SignatureScheme`](../enums/protobufs.SignatureScheme.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`SignatureScheme`](../enums/protobufs.SignatureScheme.md)

___

### signatureSchemeToJSON

▸ **signatureSchemeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) |

#### Returns

`string`

___

### userDataTypeFromJSON

▸ **userDataTypeFromJSON**(`object`): [`UserDataType`](../enums/protobufs.UserDataType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`UserDataType`](../enums/protobufs.UserDataType.md)

___

### userDataTypeToJSON

▸ **userDataTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`UserDataType`](../enums/protobufs.UserDataType.md) |

#### Returns

`string`
