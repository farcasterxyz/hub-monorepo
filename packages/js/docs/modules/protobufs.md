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
| `service` | { `deleteAllMessagesFromDb`: { `path`: ``"/AdminService/DeleteAllMessagesFromDb"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `responseStream`: ``false``  } ; `rebuildSyncTrie`: { `path`: ``"/AdminService/RebuildSyncTrie"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `responseStream`: ``false``  }  } |
| `service.deleteAllMessagesFromDb` | { `path`: ``"/AdminService/DeleteAllMessagesFromDb"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `responseStream`: ``false``  } |
| `service.deleteAllMessagesFromDb.path` | ``"/AdminService/DeleteAllMessagesFromDb"`` |
| `service.deleteAllMessagesFromDb.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.deleteAllMessagesFromDb.requestSerialize` | (`value`: [`Empty`](protobufs.md#empty)) =>  |
| `service.deleteAllMessagesFromDb.requestStream` | ``false`` |
| `service.deleteAllMessagesFromDb.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.deleteAllMessagesFromDb.responseSerialize` | (`value`: [`Empty`](protobufs.md#empty)) =>  |
| `service.deleteAllMessagesFromDb.responseStream` | ``false`` |
| `service.rebuildSyncTrie` | { `path`: ``"/AdminService/RebuildSyncTrie"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `responseStream`: ``false``  } |
| `service.rebuildSyncTrie.path` | ``"/AdminService/RebuildSyncTrie"`` |
| `service.rebuildSyncTrie.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.rebuildSyncTrie.requestSerialize` | (`value`: [`Empty`](protobufs.md#empty)) =>  |
| `service.rebuildSyncTrie.requestStream` | ``false`` |
| `service.rebuildSyncTrie.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.rebuildSyncTrie.responseSerialize` | (`value`: [`Empty`](protobufs.md#empty)) =>  |
| `service.rebuildSyncTrie.responseStream` | ``false`` |

___

### AdminServiceService

• **AdminServiceService**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `deleteAllMessagesFromDb` | { `path`: ``"/AdminService/DeleteAllMessagesFromDb"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `responseStream`: ``false``  } |
| `deleteAllMessagesFromDb.path` | ``"/AdminService/DeleteAllMessagesFromDb"`` |
| `deleteAllMessagesFromDb.requestDeserialize` | (`value`: `Buffer`) =>  |
| `deleteAllMessagesFromDb.requestSerialize` | (`value`: [`Empty`](protobufs.md#empty)) =>  |
| `deleteAllMessagesFromDb.requestStream` | ``false`` |
| `deleteAllMessagesFromDb.responseDeserialize` | (`value`: `Buffer`) =>  |
| `deleteAllMessagesFromDb.responseSerialize` | (`value`: [`Empty`](protobufs.md#empty)) =>  |
| `deleteAllMessagesFromDb.responseStream` | ``false`` |
| `rebuildSyncTrie` | { `path`: ``"/AdminService/RebuildSyncTrie"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `responseStream`: ``false``  } |
| `rebuildSyncTrie.path` | ``"/AdminService/RebuildSyncTrie"`` |
| `rebuildSyncTrie.requestDeserialize` | (`value`: `Buffer`) =>  |
| `rebuildSyncTrie.requestSerialize` | (`value`: [`Empty`](protobufs.md#empty)) =>  |
| `rebuildSyncTrie.requestStream` | ``false`` |
| `rebuildSyncTrie.responseDeserialize` | (`value`: `Buffer`) =>  |
| `rebuildSyncTrie.responseSerialize` | (`value`: [`Empty`](protobufs.md#empty)) =>  |
| `rebuildSyncTrie.responseStream` | ``false`` |

___

### CastAddBody

• **CastAddBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`CastAddBody`](protobufs.md#castaddbody), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`CastAddBody`](protobufs.md#castaddbody)) =>  |

___

### CastId

• **CastId**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`CastId`](protobufs.md#castid), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`CastId`](protobufs.md#castid)) =>  |

___

### CastRemoveBody

• **CastRemoveBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`CastRemoveBody`](protobufs.md#castremovebody), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`CastRemoveBody`](protobufs.md#castremovebody)) =>  |

___

### ContactInfoContent

• **ContactInfoContent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`ContactInfoContent`](protobufs.md#contactinfocontent), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`ContactInfoContent`](protobufs.md#contactinfocontent)) =>  |

___

### DbTrieNode

• **DbTrieNode**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`DbTrieNode`](protobufs.md#dbtrienode), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`DbTrieNode`](protobufs.md#dbtrienode)) =>  |

___

### Empty

• **Empty**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`_`: [`Empty`](protobufs.md#empty), `writer?`: `Writer`) =>  |
| `fromJSON` | (`_`: `any`) =>  |
| `fromPartial` | <I_1\>(`_`: `I_1`) =>  |
| `toJSON` | (`_`: [`Empty`](protobufs.md#empty)) =>  |

___

### EventRequest

• **EventRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`EventRequest`](protobufs.md#eventrequest), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`EventRequest`](protobufs.md#eventrequest)) =>  |

___

### FidRequest

• **FidRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`FidRequest`](protobufs.md#fidrequest), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`FidRequest`](protobufs.md#fidrequest)) =>  |

___

### FidsResponse

• **FidsResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`FidsResponse`](protobufs.md#fidsresponse), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`FidsResponse`](protobufs.md#fidsresponse)) =>  |

___

### GossipAddressInfo

• **GossipAddressInfo**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`GossipAddressInfo`](protobufs.md#gossipaddressinfo), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`GossipAddressInfo`](protobufs.md#gossipaddressinfo)) =>  |

___

### GossipMessage

• **GossipMessage**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`GossipMessage`](protobufs.md#gossipmessage), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`GossipMessage`](protobufs.md#gossipmessage)) =>  |

___

### HubEvent

• **HubEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`HubEvent`](protobufs.md#hubevent), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`HubEvent`](protobufs.md#hubevent)) =>  |

___

### HubInfoResponse

• **HubInfoResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`HubInfoResponse`](protobufs.md#hubinforesponse), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`HubInfoResponse`](protobufs.md#hubinforesponse)) =>  |

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
| `service` | { `getAllCastMessagesByFid`: { `path`: ``"/HubService/GetAllCastMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } ; `getAllMessagesBySyncIds`: { `path`: ``"/HubService/GetAllMessagesBySyncIds"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`SyncIds`](protobufs.md#syncids)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } ; `getAllReactionMessagesByFid`: { `path`: ``"/HubService/GetAllReactionMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } ; `getAllSignerMessagesByFid`: { `path`: ``"/HubService/GetAllSignerMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } ; `getAllSyncIdsByPrefix`: { `path`: ``"/HubService/GetAllSyncIdsByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`SyncIds`](protobufs.md#syncids)) =>  ; `responseStream`: ``false``  } ; `getAllUserDataMessagesByFid`: { `path`: ``"/HubService/GetAllUserDataMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } ; `getAllVerificationMessagesByFid`: { `path`: ``"/HubService/GetAllVerificationMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } ; `getCast`: { `path`: ``"/HubService/GetCast"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`CastId`](protobufs.md#castid)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } ; `getCastsByFid`: { `path`: ``"/HubService/GetCastsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } ; `getCastsByMention`: { `path`: ``"/HubService/GetCastsByMention"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } ; `getCastsByParent`: { `path`: ``"/HubService/GetCastsByParent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`CastId`](protobufs.md#castid)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } ; `getEvent`: { `path`: ``"/HubService/GetEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`EventRequest`](protobufs.md#eventrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`HubEvent`](protobufs.md#hubevent)) =>  ; `responseStream`: ``false``  } ; `getFids`: { `path`: ``"/HubService/GetFids"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`FidsResponse`](protobufs.md#fidsresponse)) =>  ; `responseStream`: ``false``  } ; `getIdRegistryEvent`: { `path`: ``"/HubService/GetIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) =>  ; `responseStream`: ``false``  } ; `getInfo`: { `path`: ``"/HubService/GetInfo"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`HubInfoResponse`](protobufs.md#hubinforesponse)) =>  ; `responseStream`: ``false``  } ; `getNameRegistryEvent`: { `path`: ``"/HubService/GetNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) =>  ; `responseStream`: ``false``  } ; `getReaction`: { `path`: ``"/HubService/GetReaction"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`ReactionRequest`](protobufs.md#reactionrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } ; `getReactionsByCast`: { `path`: ``"/HubService/GetReactionsByCast"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } ; `getReactionsByFid`: { `path`: ``"/HubService/GetReactionsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } ; `getSigner`: { `path`: ``"/HubService/GetSigner"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`SignerRequest`](protobufs.md#signerrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } ; `getSignersByFid`: { `path`: ``"/HubService/GetSignersByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } ; `getSyncMetadataByPrefix`: { `path`: ``"/HubService/GetSyncMetadataByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse)) =>  ; `responseStream`: ``false``  } ; `getSyncSnapshotByPrefix`: { `path`: ``"/HubService/GetSyncSnapshotByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse)) =>  ; `responseStream`: ``false``  } ; `getUserData`: { `path`: ``"/HubService/GetUserData"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`UserDataRequest`](protobufs.md#userdatarequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } ; `getUserDataByFid`: { `path`: ``"/HubService/GetUserDataByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } ; `getVerification`: { `path`: ``"/HubService/GetVerification"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`VerificationRequest`](protobufs.md#verificationrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } ; `getVerificationsByFid`: { `path`: ``"/HubService/GetVerificationsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } ; `submitIdRegistryEvent`: { `path`: ``"/HubService/SubmitIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) =>  ; `responseStream`: ``false``  } ; `submitMessage`: { `path`: ``"/HubService/SubmitMessage"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } ; `submitNameRegistryEvent`: { `path`: ``"/HubService/SubmitNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) =>  ; `responseStream`: ``false``  } ; `subscribe`: { `path`: ``"/HubService/Subscribe"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`SubscribeRequest`](protobufs.md#subscriberequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`HubEvent`](protobufs.md#hubevent)) =>  ; `responseStream`: ``true``  }  } |
| `service.getAllCastMessagesByFid` | { `path`: ``"/HubService/GetAllCastMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getAllCastMessagesByFid.path` | ``"/HubService/GetAllCastMessagesByFid"`` |
| `service.getAllCastMessagesByFid.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getAllCastMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  |
| `service.getAllCastMessagesByFid.requestStream` | ``false`` |
| `service.getAllCastMessagesByFid.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getAllCastMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  |
| `service.getAllCastMessagesByFid.responseStream` | ``false`` |
| `service.getAllMessagesBySyncIds` | { `path`: ``"/HubService/GetAllMessagesBySyncIds"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`SyncIds`](protobufs.md#syncids)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getAllMessagesBySyncIds.path` | ``"/HubService/GetAllMessagesBySyncIds"`` |
| `service.getAllMessagesBySyncIds.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getAllMessagesBySyncIds.requestSerialize` | (`value`: [`SyncIds`](protobufs.md#syncids)) =>  |
| `service.getAllMessagesBySyncIds.requestStream` | ``false`` |
| `service.getAllMessagesBySyncIds.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getAllMessagesBySyncIds.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  |
| `service.getAllMessagesBySyncIds.responseStream` | ``false`` |
| `service.getAllReactionMessagesByFid` | { `path`: ``"/HubService/GetAllReactionMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getAllReactionMessagesByFid.path` | ``"/HubService/GetAllReactionMessagesByFid"`` |
| `service.getAllReactionMessagesByFid.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getAllReactionMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  |
| `service.getAllReactionMessagesByFid.requestStream` | ``false`` |
| `service.getAllReactionMessagesByFid.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getAllReactionMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  |
| `service.getAllReactionMessagesByFid.responseStream` | ``false`` |
| `service.getAllSignerMessagesByFid` | { `path`: ``"/HubService/GetAllSignerMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getAllSignerMessagesByFid.path` | ``"/HubService/GetAllSignerMessagesByFid"`` |
| `service.getAllSignerMessagesByFid.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getAllSignerMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  |
| `service.getAllSignerMessagesByFid.requestStream` | ``false`` |
| `service.getAllSignerMessagesByFid.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getAllSignerMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  |
| `service.getAllSignerMessagesByFid.responseStream` | ``false`` |
| `service.getAllSyncIdsByPrefix` | { `path`: ``"/HubService/GetAllSyncIdsByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`SyncIds`](protobufs.md#syncids)) =>  ; `responseStream`: ``false``  } |
| `service.getAllSyncIdsByPrefix.path` | ``"/HubService/GetAllSyncIdsByPrefix"`` |
| `service.getAllSyncIdsByPrefix.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getAllSyncIdsByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) =>  |
| `service.getAllSyncIdsByPrefix.requestStream` | ``false`` |
| `service.getAllSyncIdsByPrefix.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getAllSyncIdsByPrefix.responseSerialize` | (`value`: [`SyncIds`](protobufs.md#syncids)) =>  |
| `service.getAllSyncIdsByPrefix.responseStream` | ``false`` |
| `service.getAllUserDataMessagesByFid` | { `path`: ``"/HubService/GetAllUserDataMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getAllUserDataMessagesByFid.path` | ``"/HubService/GetAllUserDataMessagesByFid"`` |
| `service.getAllUserDataMessagesByFid.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getAllUserDataMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  |
| `service.getAllUserDataMessagesByFid.requestStream` | ``false`` |
| `service.getAllUserDataMessagesByFid.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getAllUserDataMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  |
| `service.getAllUserDataMessagesByFid.responseStream` | ``false`` |
| `service.getAllVerificationMessagesByFid` | { `path`: ``"/HubService/GetAllVerificationMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getAllVerificationMessagesByFid.path` | ``"/HubService/GetAllVerificationMessagesByFid"`` |
| `service.getAllVerificationMessagesByFid.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getAllVerificationMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  |
| `service.getAllVerificationMessagesByFid.requestStream` | ``false`` |
| `service.getAllVerificationMessagesByFid.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getAllVerificationMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  |
| `service.getAllVerificationMessagesByFid.responseStream` | ``false`` |
| `service.getCast` | { `path`: ``"/HubService/GetCast"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`CastId`](protobufs.md#castid)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } |
| `service.getCast.path` | ``"/HubService/GetCast"`` |
| `service.getCast.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getCast.requestSerialize` | (`value`: [`CastId`](protobufs.md#castid)) =>  |
| `service.getCast.requestStream` | ``false`` |
| `service.getCast.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getCast.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) =>  |
| `service.getCast.responseStream` | ``false`` |
| `service.getCastsByFid` | { `path`: ``"/HubService/GetCastsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getCastsByFid.path` | ``"/HubService/GetCastsByFid"`` |
| `service.getCastsByFid.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getCastsByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  |
| `service.getCastsByFid.requestStream` | ``false`` |
| `service.getCastsByFid.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getCastsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  |
| `service.getCastsByFid.responseStream` | ``false`` |
| `service.getCastsByMention` | { `path`: ``"/HubService/GetCastsByMention"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getCastsByMention.path` | ``"/HubService/GetCastsByMention"`` |
| `service.getCastsByMention.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getCastsByMention.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  |
| `service.getCastsByMention.requestStream` | ``false`` |
| `service.getCastsByMention.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getCastsByMention.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  |
| `service.getCastsByMention.responseStream` | ``false`` |
| `service.getCastsByParent` | { `path`: ``"/HubService/GetCastsByParent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`CastId`](protobufs.md#castid)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getCastsByParent.path` | ``"/HubService/GetCastsByParent"`` |
| `service.getCastsByParent.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getCastsByParent.requestSerialize` | (`value`: [`CastId`](protobufs.md#castid)) =>  |
| `service.getCastsByParent.requestStream` | ``false`` |
| `service.getCastsByParent.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getCastsByParent.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  |
| `service.getCastsByParent.responseStream` | ``false`` |
| `service.getEvent` | { `path`: ``"/HubService/GetEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`EventRequest`](protobufs.md#eventrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`HubEvent`](protobufs.md#hubevent)) =>  ; `responseStream`: ``false``  } |
| `service.getEvent.path` | ``"/HubService/GetEvent"`` |
| `service.getEvent.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getEvent.requestSerialize` | (`value`: [`EventRequest`](protobufs.md#eventrequest)) =>  |
| `service.getEvent.requestStream` | ``false`` |
| `service.getEvent.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getEvent.responseSerialize` | (`value`: [`HubEvent`](protobufs.md#hubevent)) =>  |
| `service.getEvent.responseStream` | ``false`` |
| `service.getFids` | { `path`: ``"/HubService/GetFids"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`FidsResponse`](protobufs.md#fidsresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getFids.path` | ``"/HubService/GetFids"`` |
| `service.getFids.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getFids.requestSerialize` | (`value`: [`Empty`](protobufs.md#empty)) =>  |
| `service.getFids.requestStream` | ``false`` |
| `service.getFids.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getFids.responseSerialize` | (`value`: [`FidsResponse`](protobufs.md#fidsresponse)) =>  |
| `service.getFids.responseStream` | ``false`` |
| `service.getIdRegistryEvent` | { `path`: ``"/HubService/GetIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) =>  ; `responseStream`: ``false``  } |
| `service.getIdRegistryEvent.path` | ``"/HubService/GetIdRegistryEvent"`` |
| `service.getIdRegistryEvent.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getIdRegistryEvent.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  |
| `service.getIdRegistryEvent.requestStream` | ``false`` |
| `service.getIdRegistryEvent.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getIdRegistryEvent.responseSerialize` | (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) =>  |
| `service.getIdRegistryEvent.responseStream` | ``false`` |
| `service.getInfo` | { `path`: ``"/HubService/GetInfo"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`HubInfoResponse`](protobufs.md#hubinforesponse)) =>  ; `responseStream`: ``false``  } |
| `service.getInfo.path` | ``"/HubService/GetInfo"`` |
| `service.getInfo.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getInfo.requestSerialize` | (`value`: [`Empty`](protobufs.md#empty)) =>  |
| `service.getInfo.requestStream` | ``false`` |
| `service.getInfo.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getInfo.responseSerialize` | (`value`: [`HubInfoResponse`](protobufs.md#hubinforesponse)) =>  |
| `service.getInfo.responseStream` | ``false`` |
| `service.getNameRegistryEvent` | { `path`: ``"/HubService/GetNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) =>  ; `responseStream`: ``false``  } |
| `service.getNameRegistryEvent.path` | ``"/HubService/GetNameRegistryEvent"`` |
| `service.getNameRegistryEvent.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getNameRegistryEvent.requestSerialize` | (`value`: [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest)) =>  |
| `service.getNameRegistryEvent.requestStream` | ``false`` |
| `service.getNameRegistryEvent.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getNameRegistryEvent.responseSerialize` | (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) =>  |
| `service.getNameRegistryEvent.responseStream` | ``false`` |
| `service.getReaction` | { `path`: ``"/HubService/GetReaction"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`ReactionRequest`](protobufs.md#reactionrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } |
| `service.getReaction.path` | ``"/HubService/GetReaction"`` |
| `service.getReaction.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getReaction.requestSerialize` | (`value`: [`ReactionRequest`](protobufs.md#reactionrequest)) =>  |
| `service.getReaction.requestStream` | ``false`` |
| `service.getReaction.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getReaction.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) =>  |
| `service.getReaction.responseStream` | ``false`` |
| `service.getReactionsByCast` | { `path`: ``"/HubService/GetReactionsByCast"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getReactionsByCast.path` | ``"/HubService/GetReactionsByCast"`` |
| `service.getReactionsByCast.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getReactionsByCast.requestSerialize` | (`value`: [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest)) =>  |
| `service.getReactionsByCast.requestStream` | ``false`` |
| `service.getReactionsByCast.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getReactionsByCast.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  |
| `service.getReactionsByCast.responseStream` | ``false`` |
| `service.getReactionsByFid` | { `path`: ``"/HubService/GetReactionsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getReactionsByFid.path` | ``"/HubService/GetReactionsByFid"`` |
| `service.getReactionsByFid.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getReactionsByFid.requestSerialize` | (`value`: [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest)) =>  |
| `service.getReactionsByFid.requestStream` | ``false`` |
| `service.getReactionsByFid.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getReactionsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  |
| `service.getReactionsByFid.responseStream` | ``false`` |
| `service.getSigner` | { `path`: ``"/HubService/GetSigner"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`SignerRequest`](protobufs.md#signerrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } |
| `service.getSigner.path` | ``"/HubService/GetSigner"`` |
| `service.getSigner.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getSigner.requestSerialize` | (`value`: [`SignerRequest`](protobufs.md#signerrequest)) =>  |
| `service.getSigner.requestStream` | ``false`` |
| `service.getSigner.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getSigner.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) =>  |
| `service.getSigner.responseStream` | ``false`` |
| `service.getSignersByFid` | { `path`: ``"/HubService/GetSignersByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getSignersByFid.path` | ``"/HubService/GetSignersByFid"`` |
| `service.getSignersByFid.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getSignersByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  |
| `service.getSignersByFid.requestStream` | ``false`` |
| `service.getSignersByFid.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getSignersByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  |
| `service.getSignersByFid.responseStream` | ``false`` |
| `service.getSyncMetadataByPrefix` | { `path`: ``"/HubService/GetSyncMetadataByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getSyncMetadataByPrefix.path` | ``"/HubService/GetSyncMetadataByPrefix"`` |
| `service.getSyncMetadataByPrefix.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getSyncMetadataByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) =>  |
| `service.getSyncMetadataByPrefix.requestStream` | ``false`` |
| `service.getSyncMetadataByPrefix.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getSyncMetadataByPrefix.responseSerialize` | (`value`: [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse)) =>  |
| `service.getSyncMetadataByPrefix.responseStream` | ``false`` |
| `service.getSyncSnapshotByPrefix` | { `path`: ``"/HubService/GetSyncSnapshotByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getSyncSnapshotByPrefix.path` | ``"/HubService/GetSyncSnapshotByPrefix"`` |
| `service.getSyncSnapshotByPrefix.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getSyncSnapshotByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) =>  |
| `service.getSyncSnapshotByPrefix.requestStream` | ``false`` |
| `service.getSyncSnapshotByPrefix.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getSyncSnapshotByPrefix.responseSerialize` | (`value`: [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse)) =>  |
| `service.getSyncSnapshotByPrefix.responseStream` | ``false`` |
| `service.getUserData` | { `path`: ``"/HubService/GetUserData"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`UserDataRequest`](protobufs.md#userdatarequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } |
| `service.getUserData.path` | ``"/HubService/GetUserData"`` |
| `service.getUserData.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getUserData.requestSerialize` | (`value`: [`UserDataRequest`](protobufs.md#userdatarequest)) =>  |
| `service.getUserData.requestStream` | ``false`` |
| `service.getUserData.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getUserData.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) =>  |
| `service.getUserData.responseStream` | ``false`` |
| `service.getUserDataByFid` | { `path`: ``"/HubService/GetUserDataByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getUserDataByFid.path` | ``"/HubService/GetUserDataByFid"`` |
| `service.getUserDataByFid.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getUserDataByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  |
| `service.getUserDataByFid.requestStream` | ``false`` |
| `service.getUserDataByFid.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getUserDataByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  |
| `service.getUserDataByFid.responseStream` | ``false`` |
| `service.getVerification` | { `path`: ``"/HubService/GetVerification"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`VerificationRequest`](protobufs.md#verificationrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } |
| `service.getVerification.path` | ``"/HubService/GetVerification"`` |
| `service.getVerification.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getVerification.requestSerialize` | (`value`: [`VerificationRequest`](protobufs.md#verificationrequest)) =>  |
| `service.getVerification.requestStream` | ``false`` |
| `service.getVerification.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getVerification.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) =>  |
| `service.getVerification.responseStream` | ``false`` |
| `service.getVerificationsByFid` | { `path`: ``"/HubService/GetVerificationsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } |
| `service.getVerificationsByFid.path` | ``"/HubService/GetVerificationsByFid"`` |
| `service.getVerificationsByFid.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.getVerificationsByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  |
| `service.getVerificationsByFid.requestStream` | ``false`` |
| `service.getVerificationsByFid.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.getVerificationsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  |
| `service.getVerificationsByFid.responseStream` | ``false`` |
| `service.submitIdRegistryEvent` | { `path`: ``"/HubService/SubmitIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) =>  ; `responseStream`: ``false``  } |
| `service.submitIdRegistryEvent.path` | ``"/HubService/SubmitIdRegistryEvent"`` |
| `service.submitIdRegistryEvent.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.submitIdRegistryEvent.requestSerialize` | (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) =>  |
| `service.submitIdRegistryEvent.requestStream` | ``false`` |
| `service.submitIdRegistryEvent.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.submitIdRegistryEvent.responseSerialize` | (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) =>  |
| `service.submitIdRegistryEvent.responseStream` | ``false`` |
| `service.submitMessage` | { `path`: ``"/HubService/SubmitMessage"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } |
| `service.submitMessage.path` | ``"/HubService/SubmitMessage"`` |
| `service.submitMessage.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.submitMessage.requestSerialize` | (`value`: [`Message`](protobufs.md#message)) =>  |
| `service.submitMessage.requestStream` | ``false`` |
| `service.submitMessage.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.submitMessage.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) =>  |
| `service.submitMessage.responseStream` | ``false`` |
| `service.submitNameRegistryEvent` | { `path`: ``"/HubService/SubmitNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) =>  ; `responseStream`: ``false``  } |
| `service.submitNameRegistryEvent.path` | ``"/HubService/SubmitNameRegistryEvent"`` |
| `service.submitNameRegistryEvent.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.submitNameRegistryEvent.requestSerialize` | (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) =>  |
| `service.submitNameRegistryEvent.requestStream` | ``false`` |
| `service.submitNameRegistryEvent.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.submitNameRegistryEvent.responseSerialize` | (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) =>  |
| `service.submitNameRegistryEvent.responseStream` | ``false`` |
| `service.subscribe` | { `path`: ``"/HubService/Subscribe"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`SubscribeRequest`](protobufs.md#subscriberequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`HubEvent`](protobufs.md#hubevent)) =>  ; `responseStream`: ``true``  } |
| `service.subscribe.path` | ``"/HubService/Subscribe"`` |
| `service.subscribe.requestDeserialize` | (`value`: `Buffer`) =>  |
| `service.subscribe.requestSerialize` | (`value`: [`SubscribeRequest`](protobufs.md#subscriberequest)) =>  |
| `service.subscribe.requestStream` | ``false`` |
| `service.subscribe.responseDeserialize` | (`value`: `Buffer`) =>  |
| `service.subscribe.responseSerialize` | (`value`: [`HubEvent`](protobufs.md#hubevent)) =>  |
| `service.subscribe.responseStream` | ``true`` |

___

### HubServiceService

• **HubServiceService**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `getAllCastMessagesByFid` | { `path`: ``"/HubService/GetAllCastMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } | Bulk Methods |
| `getAllCastMessagesByFid.path` | ``"/HubService/GetAllCastMessagesByFid"`` | - |
| `getAllCastMessagesByFid.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getAllCastMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  | - |
| `getAllCastMessagesByFid.requestStream` | ``false`` | - |
| `getAllCastMessagesByFid.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getAllCastMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  | - |
| `getAllCastMessagesByFid.responseStream` | ``false`` | - |
| `getAllMessagesBySyncIds` | { `path`: ``"/HubService/GetAllMessagesBySyncIds"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`SyncIds`](protobufs.md#syncids)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } | - |
| `getAllMessagesBySyncIds.path` | ``"/HubService/GetAllMessagesBySyncIds"`` | - |
| `getAllMessagesBySyncIds.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getAllMessagesBySyncIds.requestSerialize` | (`value`: [`SyncIds`](protobufs.md#syncids)) =>  | - |
| `getAllMessagesBySyncIds.requestStream` | ``false`` | - |
| `getAllMessagesBySyncIds.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getAllMessagesBySyncIds.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  | - |
| `getAllMessagesBySyncIds.responseStream` | ``false`` | - |
| `getAllReactionMessagesByFid` | { `path`: ``"/HubService/GetAllReactionMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } | - |
| `getAllReactionMessagesByFid.path` | ``"/HubService/GetAllReactionMessagesByFid"`` | - |
| `getAllReactionMessagesByFid.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getAllReactionMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  | - |
| `getAllReactionMessagesByFid.requestStream` | ``false`` | - |
| `getAllReactionMessagesByFid.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getAllReactionMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  | - |
| `getAllReactionMessagesByFid.responseStream` | ``false`` | - |
| `getAllSignerMessagesByFid` | { `path`: ``"/HubService/GetAllSignerMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } | - |
| `getAllSignerMessagesByFid.path` | ``"/HubService/GetAllSignerMessagesByFid"`` | - |
| `getAllSignerMessagesByFid.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getAllSignerMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  | - |
| `getAllSignerMessagesByFid.requestStream` | ``false`` | - |
| `getAllSignerMessagesByFid.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getAllSignerMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  | - |
| `getAllSignerMessagesByFid.responseStream` | ``false`` | - |
| `getAllSyncIdsByPrefix` | { `path`: ``"/HubService/GetAllSyncIdsByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`SyncIds`](protobufs.md#syncids)) =>  ; `responseStream`: ``false``  } | - |
| `getAllSyncIdsByPrefix.path` | ``"/HubService/GetAllSyncIdsByPrefix"`` | - |
| `getAllSyncIdsByPrefix.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getAllSyncIdsByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) =>  | - |
| `getAllSyncIdsByPrefix.requestStream` | ``false`` | - |
| `getAllSyncIdsByPrefix.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getAllSyncIdsByPrefix.responseSerialize` | (`value`: [`SyncIds`](protobufs.md#syncids)) =>  | - |
| `getAllSyncIdsByPrefix.responseStream` | ``false`` | - |
| `getAllUserDataMessagesByFid` | { `path`: ``"/HubService/GetAllUserDataMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } | - |
| `getAllUserDataMessagesByFid.path` | ``"/HubService/GetAllUserDataMessagesByFid"`` | - |
| `getAllUserDataMessagesByFid.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getAllUserDataMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  | - |
| `getAllUserDataMessagesByFid.requestStream` | ``false`` | - |
| `getAllUserDataMessagesByFid.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getAllUserDataMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  | - |
| `getAllUserDataMessagesByFid.responseStream` | ``false`` | - |
| `getAllVerificationMessagesByFid` | { `path`: ``"/HubService/GetAllVerificationMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } | - |
| `getAllVerificationMessagesByFid.path` | ``"/HubService/GetAllVerificationMessagesByFid"`` | - |
| `getAllVerificationMessagesByFid.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getAllVerificationMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  | - |
| `getAllVerificationMessagesByFid.requestStream` | ``false`` | - |
| `getAllVerificationMessagesByFid.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getAllVerificationMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  | - |
| `getAllVerificationMessagesByFid.responseStream` | ``false`` | - |
| `getCast` | { `path`: ``"/HubService/GetCast"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`CastId`](protobufs.md#castid)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } | Casts |
| `getCast.path` | ``"/HubService/GetCast"`` | - |
| `getCast.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getCast.requestSerialize` | (`value`: [`CastId`](protobufs.md#castid)) =>  | - |
| `getCast.requestStream` | ``false`` | - |
| `getCast.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getCast.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) =>  | - |
| `getCast.responseStream` | ``false`` | - |
| `getCastsByFid` | { `path`: ``"/HubService/GetCastsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } | - |
| `getCastsByFid.path` | ``"/HubService/GetCastsByFid"`` | - |
| `getCastsByFid.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getCastsByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  | - |
| `getCastsByFid.requestStream` | ``false`` | - |
| `getCastsByFid.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getCastsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  | - |
| `getCastsByFid.responseStream` | ``false`` | - |
| `getCastsByMention` | { `path`: ``"/HubService/GetCastsByMention"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } | - |
| `getCastsByMention.path` | ``"/HubService/GetCastsByMention"`` | - |
| `getCastsByMention.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getCastsByMention.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  | - |
| `getCastsByMention.requestStream` | ``false`` | - |
| `getCastsByMention.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getCastsByMention.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  | - |
| `getCastsByMention.responseStream` | ``false`` | - |
| `getCastsByParent` | { `path`: ``"/HubService/GetCastsByParent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`CastId`](protobufs.md#castid)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } | - |
| `getCastsByParent.path` | ``"/HubService/GetCastsByParent"`` | - |
| `getCastsByParent.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getCastsByParent.requestSerialize` | (`value`: [`CastId`](protobufs.md#castid)) =>  | - |
| `getCastsByParent.requestStream` | ``false`` | - |
| `getCastsByParent.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getCastsByParent.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  | - |
| `getCastsByParent.responseStream` | ``false`` | - |
| `getEvent` | { `path`: ``"/HubService/GetEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`EventRequest`](protobufs.md#eventrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`HubEvent`](protobufs.md#hubevent)) =>  ; `responseStream`: ``false``  } | - |
| `getEvent.path` | ``"/HubService/GetEvent"`` | - |
| `getEvent.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getEvent.requestSerialize` | (`value`: [`EventRequest`](protobufs.md#eventrequest)) =>  | - |
| `getEvent.requestStream` | ``false`` | - |
| `getEvent.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getEvent.responseSerialize` | (`value`: [`HubEvent`](protobufs.md#hubevent)) =>  | - |
| `getEvent.responseStream` | ``false`` | - |
| `getFids` | { `path`: ``"/HubService/GetFids"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`FidsResponse`](protobufs.md#fidsresponse)) =>  ; `responseStream`: ``false``  } | - |
| `getFids.path` | ``"/HubService/GetFids"`` | - |
| `getFids.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getFids.requestSerialize` | (`value`: [`Empty`](protobufs.md#empty)) =>  | - |
| `getFids.requestStream` | ``false`` | - |
| `getFids.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getFids.responseSerialize` | (`value`: [`FidsResponse`](protobufs.md#fidsresponse)) =>  | - |
| `getFids.responseStream` | ``false`` | - |
| `getIdRegistryEvent` | { `path`: ``"/HubService/GetIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) =>  ; `responseStream`: ``false``  } | - |
| `getIdRegistryEvent.path` | ``"/HubService/GetIdRegistryEvent"`` | - |
| `getIdRegistryEvent.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getIdRegistryEvent.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  | - |
| `getIdRegistryEvent.requestStream` | ``false`` | - |
| `getIdRegistryEvent.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getIdRegistryEvent.responseSerialize` | (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) =>  | - |
| `getIdRegistryEvent.responseStream` | ``false`` | - |
| `getInfo` | { `path`: ``"/HubService/GetInfo"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`Empty`](protobufs.md#empty)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`HubInfoResponse`](protobufs.md#hubinforesponse)) =>  ; `responseStream`: ``false``  } | Sync Methods |
| `getInfo.path` | ``"/HubService/GetInfo"`` | - |
| `getInfo.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getInfo.requestSerialize` | (`value`: [`Empty`](protobufs.md#empty)) =>  | - |
| `getInfo.requestStream` | ``false`` | - |
| `getInfo.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getInfo.responseSerialize` | (`value`: [`HubInfoResponse`](protobufs.md#hubinforesponse)) =>  | - |
| `getInfo.responseStream` | ``false`` | - |
| `getNameRegistryEvent` | { `path`: ``"/HubService/GetNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) =>  ; `responseStream`: ``false``  } | - |
| `getNameRegistryEvent.path` | ``"/HubService/GetNameRegistryEvent"`` | - |
| `getNameRegistryEvent.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getNameRegistryEvent.requestSerialize` | (`value`: [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest)) =>  | - |
| `getNameRegistryEvent.requestStream` | ``false`` | - |
| `getNameRegistryEvent.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getNameRegistryEvent.responseSerialize` | (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) =>  | - |
| `getNameRegistryEvent.responseStream` | ``false`` | - |
| `getReaction` | { `path`: ``"/HubService/GetReaction"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`ReactionRequest`](protobufs.md#reactionrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } | Reactions |
| `getReaction.path` | ``"/HubService/GetReaction"`` | - |
| `getReaction.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getReaction.requestSerialize` | (`value`: [`ReactionRequest`](protobufs.md#reactionrequest)) =>  | - |
| `getReaction.requestStream` | ``false`` | - |
| `getReaction.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getReaction.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) =>  | - |
| `getReaction.responseStream` | ``false`` | - |
| `getReactionsByCast` | { `path`: ``"/HubService/GetReactionsByCast"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } | - |
| `getReactionsByCast.path` | ``"/HubService/GetReactionsByCast"`` | - |
| `getReactionsByCast.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getReactionsByCast.requestSerialize` | (`value`: [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest)) =>  | - |
| `getReactionsByCast.requestStream` | ``false`` | - |
| `getReactionsByCast.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getReactionsByCast.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  | - |
| `getReactionsByCast.responseStream` | ``false`` | - |
| `getReactionsByFid` | { `path`: ``"/HubService/GetReactionsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } | - |
| `getReactionsByFid.path` | ``"/HubService/GetReactionsByFid"`` | - |
| `getReactionsByFid.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getReactionsByFid.requestSerialize` | (`value`: [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest)) =>  | - |
| `getReactionsByFid.requestStream` | ``false`` | - |
| `getReactionsByFid.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getReactionsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  | - |
| `getReactionsByFid.responseStream` | ``false`` | - |
| `getSigner` | { `path`: ``"/HubService/GetSigner"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`SignerRequest`](protobufs.md#signerrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } | Signer |
| `getSigner.path` | ``"/HubService/GetSigner"`` | - |
| `getSigner.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getSigner.requestSerialize` | (`value`: [`SignerRequest`](protobufs.md#signerrequest)) =>  | - |
| `getSigner.requestStream` | ``false`` | - |
| `getSigner.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getSigner.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) =>  | - |
| `getSigner.responseStream` | ``false`` | - |
| `getSignersByFid` | { `path`: ``"/HubService/GetSignersByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } | - |
| `getSignersByFid.path` | ``"/HubService/GetSignersByFid"`` | - |
| `getSignersByFid.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getSignersByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  | - |
| `getSignersByFid.requestStream` | ``false`` | - |
| `getSignersByFid.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getSignersByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  | - |
| `getSignersByFid.responseStream` | ``false`` | - |
| `getSyncMetadataByPrefix` | { `path`: ``"/HubService/GetSyncMetadataByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse)) =>  ; `responseStream`: ``false``  } | - |
| `getSyncMetadataByPrefix.path` | ``"/HubService/GetSyncMetadataByPrefix"`` | - |
| `getSyncMetadataByPrefix.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getSyncMetadataByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) =>  | - |
| `getSyncMetadataByPrefix.requestStream` | ``false`` | - |
| `getSyncMetadataByPrefix.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getSyncMetadataByPrefix.responseSerialize` | (`value`: [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse)) =>  | - |
| `getSyncMetadataByPrefix.responseStream` | ``false`` | - |
| `getSyncSnapshotByPrefix` | { `path`: ``"/HubService/GetSyncSnapshotByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse)) =>  ; `responseStream`: ``false``  } | - |
| `getSyncSnapshotByPrefix.path` | ``"/HubService/GetSyncSnapshotByPrefix"`` | - |
| `getSyncSnapshotByPrefix.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getSyncSnapshotByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) =>  | - |
| `getSyncSnapshotByPrefix.requestStream` | ``false`` | - |
| `getSyncSnapshotByPrefix.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getSyncSnapshotByPrefix.responseSerialize` | (`value`: [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse)) =>  | - |
| `getSyncSnapshotByPrefix.responseStream` | ``false`` | - |
| `getUserData` | { `path`: ``"/HubService/GetUserData"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`UserDataRequest`](protobufs.md#userdatarequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } | User Data |
| `getUserData.path` | ``"/HubService/GetUserData"`` | - |
| `getUserData.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getUserData.requestSerialize` | (`value`: [`UserDataRequest`](protobufs.md#userdatarequest)) =>  | - |
| `getUserData.requestStream` | ``false`` | - |
| `getUserData.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getUserData.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) =>  | - |
| `getUserData.responseStream` | ``false`` | - |
| `getUserDataByFid` | { `path`: ``"/HubService/GetUserDataByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } | - |
| `getUserDataByFid.path` | ``"/HubService/GetUserDataByFid"`` | - |
| `getUserDataByFid.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getUserDataByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  | - |
| `getUserDataByFid.requestStream` | ``false`` | - |
| `getUserDataByFid.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getUserDataByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  | - |
| `getUserDataByFid.responseStream` | ``false`` | - |
| `getVerification` | { `path`: ``"/HubService/GetVerification"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`VerificationRequest`](protobufs.md#verificationrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } | Verifications |
| `getVerification.path` | ``"/HubService/GetVerification"`` | - |
| `getVerification.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getVerification.requestSerialize` | (`value`: [`VerificationRequest`](protobufs.md#verificationrequest)) =>  | - |
| `getVerification.requestStream` | ``false`` | - |
| `getVerification.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getVerification.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) =>  | - |
| `getVerification.responseStream` | ``false`` | - |
| `getVerificationsByFid` | { `path`: ``"/HubService/GetVerificationsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  ; `responseStream`: ``false``  } | - |
| `getVerificationsByFid.path` | ``"/HubService/GetVerificationsByFid"`` | - |
| `getVerificationsByFid.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `getVerificationsByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs.md#fidrequest)) =>  | - |
| `getVerificationsByFid.requestStream` | ``false`` | - |
| `getVerificationsByFid.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `getVerificationsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  | - |
| `getVerificationsByFid.responseStream` | ``false`` | - |
| `submitIdRegistryEvent` | { `path`: ``"/HubService/SubmitIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) =>  ; `responseStream`: ``false``  } | - |
| `submitIdRegistryEvent.path` | ``"/HubService/SubmitIdRegistryEvent"`` | - |
| `submitIdRegistryEvent.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `submitIdRegistryEvent.requestSerialize` | (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) =>  | - |
| `submitIdRegistryEvent.requestStream` | ``false`` | - |
| `submitIdRegistryEvent.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `submitIdRegistryEvent.responseSerialize` | (`value`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) =>  | - |
| `submitIdRegistryEvent.responseStream` | ``false`` | - |
| `submitMessage` | { `path`: ``"/HubService/SubmitMessage"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`Message`](protobufs.md#message)) =>  ; `responseStream`: ``false``  } | Submit Methods |
| `submitMessage.path` | ``"/HubService/SubmitMessage"`` | - |
| `submitMessage.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `submitMessage.requestSerialize` | (`value`: [`Message`](protobufs.md#message)) =>  | - |
| `submitMessage.requestStream` | ``false`` | - |
| `submitMessage.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `submitMessage.responseSerialize` | (`value`: [`Message`](protobufs.md#message)) =>  | - |
| `submitMessage.responseStream` | ``false`` | - |
| `submitNameRegistryEvent` | { `path`: ``"/HubService/SubmitNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) =>  ; `responseStream`: ``false``  } | - |
| `submitNameRegistryEvent.path` | ``"/HubService/SubmitNameRegistryEvent"`` | - |
| `submitNameRegistryEvent.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `submitNameRegistryEvent.requestSerialize` | (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) =>  | - |
| `submitNameRegistryEvent.requestStream` | ``false`` | - |
| `submitNameRegistryEvent.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `submitNameRegistryEvent.responseSerialize` | (`value`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) =>  | - |
| `submitNameRegistryEvent.responseStream` | ``false`` | - |
| `subscribe` | { `path`: ``"/HubService/Subscribe"`` ; `requestDeserialize`: (`value`: `Buffer`) =>  ; `requestSerialize`: (`value`: [`SubscribeRequest`](protobufs.md#subscriberequest)) =>  ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) =>  ; `responseSerialize`: (`value`: [`HubEvent`](protobufs.md#hubevent)) =>  ; `responseStream`: ``true``  } | Event Methods |
| `subscribe.path` | ``"/HubService/Subscribe"`` | - |
| `subscribe.requestDeserialize` | (`value`: `Buffer`) =>  | - |
| `subscribe.requestSerialize` | (`value`: [`SubscribeRequest`](protobufs.md#subscriberequest)) =>  | - |
| `subscribe.requestStream` | ``false`` | - |
| `subscribe.responseDeserialize` | (`value`: `Buffer`) =>  | - |
| `subscribe.responseSerialize` | (`value`: [`HubEvent`](protobufs.md#hubevent)) =>  | - |
| `subscribe.responseStream` | ``true`` | - |

___

### HubState

• **HubState**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`HubState`](protobufs.md#hubstate), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`HubState`](protobufs.md#hubstate)) =>  |

___

### IdRegistryEvent

• **IdRegistryEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`IdRegistryEvent`](protobufs.md#idregistryevent), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`IdRegistryEvent`](protobufs.md#idregistryevent)) =>  |

___

### MergeIdRegistryEventBody

• **MergeIdRegistryEventBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`MergeIdRegistryEventBody`](protobufs.md#mergeidregistryeventbody), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`MergeIdRegistryEventBody`](protobufs.md#mergeidregistryeventbody)) =>  |

___

### MergeMessageBody

• **MergeMessageBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`MergeMessageBody`](protobufs.md#mergemessagebody), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`MergeMessageBody`](protobufs.md#mergemessagebody)) =>  |

___

### MergeNameRegistryEventBody

• **MergeNameRegistryEventBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`MergeNameRegistryEventBody`](protobufs.md#mergenameregistryeventbody), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`MergeNameRegistryEventBody`](protobufs.md#mergenameregistryeventbody)) =>  |

___

### Message

• **Message**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`Message`](protobufs.md#message), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`Message`](protobufs.md#message)) =>  |

___

### MessageData

• **MessageData**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`MessageData`](protobufs.md#messagedata), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`MessageData`](protobufs.md#messagedata)) =>  |

___

### MessagesResponse

• **MessagesResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`MessagesResponse`](protobufs.md#messagesresponse), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`MessagesResponse`](protobufs.md#messagesresponse)) =>  |

___

### NameRegistryEvent

• **NameRegistryEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`NameRegistryEvent`](protobufs.md#nameregistryevent), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`NameRegistryEvent`](protobufs.md#nameregistryevent)) =>  |

___

### NameRegistryEventRequest

• **NameRegistryEventRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`NameRegistryEventRequest`](protobufs.md#nameregistryeventrequest)) =>  |

___

### PruneMessageBody

• **PruneMessageBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`PruneMessageBody`](protobufs.md#prunemessagebody), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`PruneMessageBody`](protobufs.md#prunemessagebody)) =>  |

___

### ReactionBody

• **ReactionBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`ReactionBody`](protobufs.md#reactionbody), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`ReactionBody`](protobufs.md#reactionbody)) =>  |

___

### ReactionRequest

• **ReactionRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`ReactionRequest`](protobufs.md#reactionrequest), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`ReactionRequest`](protobufs.md#reactionrequest)) =>  |

___

### ReactionsByCastRequest

• **ReactionsByCastRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`ReactionsByCastRequest`](protobufs.md#reactionsbycastrequest)) =>  |

___

### ReactionsByFidRequest

• **ReactionsByFidRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`ReactionsByFidRequest`](protobufs.md#reactionsbyfidrequest)) =>  |

___

### RevokeMessageBody

• **RevokeMessageBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`RevokeMessageBody`](protobufs.md#revokemessagebody), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`RevokeMessageBody`](protobufs.md#revokemessagebody)) =>  |

___

### RevokeSignerJobPayload

• **RevokeSignerJobPayload**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`RevokeSignerJobPayload`](protobufs.md#revokesignerjobpayload), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`RevokeSignerJobPayload`](protobufs.md#revokesignerjobpayload)) =>  |

___

### SignerBody

• **SignerBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`SignerBody`](protobufs.md#signerbody), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`SignerBody`](protobufs.md#signerbody)) =>  |

___

### SignerRequest

• **SignerRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`SignerRequest`](protobufs.md#signerrequest), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`SignerRequest`](protobufs.md#signerrequest)) =>  |

___

### SubscribeRequest

• **SubscribeRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`SubscribeRequest`](protobufs.md#subscriberequest), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`SubscribeRequest`](protobufs.md#subscriberequest)) =>  |

___

### SyncIds

• **SyncIds**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`SyncIds`](protobufs.md#syncids), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`SyncIds`](protobufs.md#syncids)) =>  |

___

### TrieNodeMetadataResponse

• **TrieNodeMetadataResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`TrieNodeMetadataResponse`](protobufs.md#trienodemetadataresponse)) =>  |

___

### TrieNodePrefix

• **TrieNodePrefix**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`TrieNodePrefix`](protobufs.md#trienodeprefix), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`TrieNodePrefix`](protobufs.md#trienodeprefix)) =>  |

___

### TrieNodeSnapshotResponse

• **TrieNodeSnapshotResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`TrieNodeSnapshotResponse`](protobufs.md#trienodesnapshotresponse)) =>  |

___

### UpdateNameRegistryEventExpiryJobPayload

• **UpdateNameRegistryEventExpiryJobPayload**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`UpdateNameRegistryEventExpiryJobPayload`](protobufs.md#updatenameregistryeventexpiryjobpayload), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`UpdateNameRegistryEventExpiryJobPayload`](protobufs.md#updatenameregistryeventexpiryjobpayload)) =>  |

___

### UserDataBody

• **UserDataBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`UserDataBody`](protobufs.md#userdatabody), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`UserDataBody`](protobufs.md#userdatabody)) =>  |

___

### UserDataRequest

• **UserDataRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`UserDataRequest`](protobufs.md#userdatarequest), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`UserDataRequest`](protobufs.md#userdatarequest)) =>  |

___

### VerificationAddEthAddressBody

• **VerificationAddEthAddressBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`VerificationAddEthAddressBody`](protobufs.md#verificationaddethaddressbody), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`VerificationAddEthAddressBody`](protobufs.md#verificationaddethaddressbody)) =>  |

___

### VerificationRemoveBody

• **VerificationRemoveBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`VerificationRemoveBody`](protobufs.md#verificationremovebody), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`VerificationRemoveBody`](protobufs.md#verificationremovebody)) =>  |

___

### VerificationRequest

• **VerificationRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) =>  |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) =>  |
| `encode` | (`message`: [`VerificationRequest`](protobufs.md#verificationrequest), `writer?`: `Writer`) =>  |
| `fromJSON` | (`object`: `any`) =>  |
| `fromPartial` | <I_1\>(`object`: `I_1`) =>  |
| `toJSON` | (`message`: [`VerificationRequest`](protobufs.md#verificationrequest)) =>  |

## Functions

### farcasterNetworkFromJSON

▸ **farcasterNetworkFromJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

___

### farcasterNetworkToJSON

▸ **farcasterNetworkToJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`FarcasterNetwork`](../enums/protobufs.FarcasterNetwork.md) |

___

### getAdminClient

▸ **getAdminClient**(`address`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

___

### getClient

▸ **getClient**(`address`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

___

### getServer

▸ **getServer**()

___

### gossipVersionFromJSON

▸ **gossipVersionFromJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

___

### gossipVersionToJSON

▸ **gossipVersionToJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`GossipVersion`](../enums/protobufs.GossipVersion.md) |

___

### hashSchemeFromJSON

▸ **hashSchemeFromJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

___

### hashSchemeToJSON

▸ **hashSchemeToJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`HashScheme`](../enums/protobufs.HashScheme.md) |

___

### hubEventTypeFromJSON

▸ **hubEventTypeFromJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

___

### hubEventTypeToJSON

▸ **hubEventTypeToJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`HubEventType`](../enums/protobufs.HubEventType.md) |

___

### idRegistryEventTypeFromJSON

▸ **idRegistryEventTypeFromJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

___

### idRegistryEventTypeToJSON

▸ **idRegistryEventTypeToJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`IdRegistryEventType`](../enums/protobufs.IdRegistryEventType.md) |

___

### isCastAddData

▸ **isCastAddData**(`data`)

Message typeguards

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

___

### isCastAddMessage

▸ **isCastAddMessage**(`message`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

___

### isCastRemoveData

▸ **isCastRemoveData**(`data`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

___

### isCastRemoveMessage

▸ **isCastRemoveMessage**(`message`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

___

### isMergeIdRegistryEventHubEvent

▸ **isMergeIdRegistryEventHubEvent**(`event`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`HubEvent`](protobufs.md#hubevent) |

___

### isMergeMessageHubEvent

▸ **isMergeMessageHubEvent**(`event`)

Hub event typeguards

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`HubEvent`](protobufs.md#hubevent) |

___

### isMergeNameRegistryEventHubEvent

▸ **isMergeNameRegistryEventHubEvent**(`event`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`HubEvent`](protobufs.md#hubevent) |

___

### isPruneMessageHubEvent

▸ **isPruneMessageHubEvent**(`event`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`HubEvent`](protobufs.md#hubevent) |

___

### isReactionAddData

▸ **isReactionAddData**(`data`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

___

### isReactionAddMessage

▸ **isReactionAddMessage**(`message`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

___

### isReactionRemoveData

▸ **isReactionRemoveData**(`data`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

___

### isReactionRemoveMessage

▸ **isReactionRemoveMessage**(`message`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

___

### isRevokeMessageHubEvent

▸ **isRevokeMessageHubEvent**(`event`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `event` | [`HubEvent`](protobufs.md#hubevent) |

___

### isSignerAddData

▸ **isSignerAddData**(`data`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

___

### isSignerAddMessage

▸ **isSignerAddMessage**(`message`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

___

### isSignerRemoveData

▸ **isSignerRemoveData**(`data`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

___

### isSignerRemoveMessage

▸ **isSignerRemoveMessage**(`message`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

___

### isUserDataAddData

▸ **isUserDataAddData**(`data`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

___

### isUserDataAddMessage

▸ **isUserDataAddMessage**(`message`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

___

### isVerificationAddEthAddressData

▸ **isVerificationAddEthAddressData**(`data`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

___

### isVerificationAddEthAddressMessage

▸ **isVerificationAddEthAddressMessage**(`message`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

___

### isVerificationRemoveData

▸ **isVerificationRemoveData**(`data`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs.md#messagedata) |

___

### isVerificationRemoveMessage

▸ **isVerificationRemoveMessage**(`message`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs.md#message) |

___

### messageTypeFromJSON

▸ **messageTypeFromJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

___

### messageTypeToJSON

▸ **messageTypeToJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`MessageType`](../enums/protobufs.MessageType.md) |

___

### nameRegistryEventTypeFromJSON

▸ **nameRegistryEventTypeFromJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

___

### nameRegistryEventTypeToJSON

▸ **nameRegistryEventTypeToJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`NameRegistryEventType`](../enums/protobufs.NameRegistryEventType.md) |

___

### reactionTypeFromJSON

▸ **reactionTypeFromJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

___

### reactionTypeToJSON

▸ **reactionTypeToJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`ReactionType`](../enums/protobufs.ReactionType.md) |

___

### signatureSchemeFromJSON

▸ **signatureSchemeFromJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

___

### signatureSchemeToJSON

▸ **signatureSchemeToJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) |

___

### userDataTypeFromJSON

▸ **userDataTypeFromJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

___

### userDataTypeToJSON

▸ **userDataTypeToJSON**(`object`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`UserDataType`](../enums/protobufs.UserDataType.md) |
