[hubble](../README.md) / [Modules](../modules.md) / protobufs/src

# Module: protobufs/src

## Table of contents

### Enumerations

- [EventType](../enums/protobufs_src.EventType.md)
- [FarcasterNetwork](../enums/protobufs_src.FarcasterNetwork.md)
- [GossipVersion](../enums/protobufs_src.GossipVersion.md)
- [HashScheme](../enums/protobufs_src.HashScheme.md)
- [IdRegistryEventType](../enums/protobufs_src.IdRegistryEventType.md)
- [MessageType](../enums/protobufs_src.MessageType.md)
- [NameRegistryEventType](../enums/protobufs_src.NameRegistryEventType.md)
- [ReactionType](../enums/protobufs_src.ReactionType.md)
- [SignatureScheme](../enums/protobufs_src.SignatureScheme.md)
- [UserDataType](../enums/protobufs_src.UserDataType.md)

### Interfaces

- [AmpBody](../interfaces/protobufs_src.AmpBody.md)
- [AmpRequest](../interfaces/protobufs_src.AmpRequest.md)
- [CastAddBody](../interfaces/protobufs_src.CastAddBody.md)
- [CastId](../interfaces/protobufs_src.CastId.md)
- [CastRemoveBody](../interfaces/protobufs_src.CastRemoveBody.md)
- [ContactInfoContent](../interfaces/protobufs_src.ContactInfoContent.md)
- [DbTrieNode](../interfaces/protobufs_src.DbTrieNode.md)
- [Empty](../interfaces/protobufs_src.Empty.md)
- [EventResponse](../interfaces/protobufs_src.EventResponse.md)
- [FidRequest](../interfaces/protobufs_src.FidRequest.md)
- [FidsResponse](../interfaces/protobufs_src.FidsResponse.md)
- [GossipAddressInfo](../interfaces/protobufs_src.GossipAddressInfo.md)
- [GossipMessage](../interfaces/protobufs_src.GossipMessage.md)
- [HubInfoResponse](../interfaces/protobufs_src.HubInfoResponse.md)
- [HubServiceClient](../interfaces/protobufs_src.HubServiceClient.md)
- [HubServiceServer](../interfaces/protobufs_src.HubServiceServer.md)
- [HubState](../interfaces/protobufs_src.HubState.md)
- [IdRegistryEvent](../interfaces/protobufs_src.IdRegistryEvent.md)
- [Message](../interfaces/protobufs_src.Message.md)
- [MessageData](../interfaces/protobufs_src.MessageData.md)
- [MessagesResponse](../interfaces/protobufs_src.MessagesResponse.md)
- [NameRegistryEvent](../interfaces/protobufs_src.NameRegistryEvent.md)
- [NameRegistryEventRequest](../interfaces/protobufs_src.NameRegistryEventRequest.md)
- [ReactionBody](../interfaces/protobufs_src.ReactionBody.md)
- [ReactionRequest](../interfaces/protobufs_src.ReactionRequest.md)
- [ReactionsByCastRequest](../interfaces/protobufs_src.ReactionsByCastRequest.md)
- [ReactionsByFidRequest](../interfaces/protobufs_src.ReactionsByFidRequest.md)
- [RevokeSignerJobPayload](../interfaces/protobufs_src.RevokeSignerJobPayload.md)
- [SignerBody](../interfaces/protobufs_src.SignerBody.md)
- [SignerRequest](../interfaces/protobufs_src.SignerRequest.md)
- [SubscribeRequest](../interfaces/protobufs_src.SubscribeRequest.md)
- [SyncIds](../interfaces/protobufs_src.SyncIds.md)
- [TrieNodeMetadataResponse](../interfaces/protobufs_src.TrieNodeMetadataResponse.md)
- [TrieNodePrefix](../interfaces/protobufs_src.TrieNodePrefix.md)
- [TrieNodeSnapshotResponse](../interfaces/protobufs_src.TrieNodeSnapshotResponse.md)
- [UpdateNameRegistryEventExpiryJobPayload](../interfaces/protobufs_src.UpdateNameRegistryEventExpiryJobPayload.md)
- [UserDataBody](../interfaces/protobufs_src.UserDataBody.md)
- [UserDataRequest](../interfaces/protobufs_src.UserDataRequest.md)
- [VerificationAddEthAddressBody](../interfaces/protobufs_src.VerificationAddEthAddressBody.md)
- [VerificationRemoveBody](../interfaces/protobufs_src.VerificationRemoveBody.md)
- [VerificationRequest](../interfaces/protobufs_src.VerificationRequest.md)

### Type Aliases

- [AmpAddData](protobufs_src.md#ampadddata)
- [AmpAddMessage](protobufs_src.md#ampaddmessage)
- [AmpRemoveData](protobufs_src.md#ampremovedata)
- [AmpRemoveMessage](protobufs_src.md#ampremovemessage)
- [CastAddData](protobufs_src.md#castadddata)
- [CastAddMessage](protobufs_src.md#castaddmessage)
- [CastRemoveData](protobufs_src.md#castremovedata)
- [CastRemoveMessage](protobufs_src.md#castremovemessage)
- [HubServiceService](protobufs_src.md#hubserviceservice)
- [ReactionAddData](protobufs_src.md#reactionadddata)
- [ReactionAddMessage](protobufs_src.md#reactionaddmessage)
- [ReactionRemoveData](protobufs_src.md#reactionremovedata)
- [ReactionRemoveMessage](protobufs_src.md#reactionremovemessage)
- [SignerAddData](protobufs_src.md#signeradddata)
- [SignerAddMessage](protobufs_src.md#signeraddmessage)
- [SignerRemoveData](protobufs_src.md#signerremovedata)
- [SignerRemoveMessage](protobufs_src.md#signerremovemessage)
- [UserDataAddData](protobufs_src.md#userdataadddata)
- [UserDataAddMessage](protobufs_src.md#userdataaddmessage)
- [VerificationAddEthAddressData](protobufs_src.md#verificationaddethaddressdata)
- [VerificationAddEthAddressMessage](protobufs_src.md#verificationaddethaddressmessage)
- [VerificationRemoveData](protobufs_src.md#verificationremovedata)
- [VerificationRemoveMessage](protobufs_src.md#verificationremovemessage)

### Variables

- [AmpBody](protobufs_src.md#ampbody)
- [AmpRequest](protobufs_src.md#amprequest)
- [CastAddBody](protobufs_src.md#castaddbody)
- [CastId](protobufs_src.md#castid)
- [CastRemoveBody](protobufs_src.md#castremovebody)
- [ContactInfoContent](protobufs_src.md#contactinfocontent)
- [DbTrieNode](protobufs_src.md#dbtrienode)
- [Empty](protobufs_src.md#empty)
- [EventResponse](protobufs_src.md#eventresponse)
- [FidRequest](protobufs_src.md#fidrequest)
- [FidsResponse](protobufs_src.md#fidsresponse)
- [GossipAddressInfo](protobufs_src.md#gossipaddressinfo)
- [GossipMessage](protobufs_src.md#gossipmessage)
- [HubInfoResponse](protobufs_src.md#hubinforesponse)
- [HubServiceClient](protobufs_src.md#hubserviceclient)
- [HubServiceService](protobufs_src.md#hubserviceservice-1)
- [HubState](protobufs_src.md#hubstate)
- [IdRegistryEvent](protobufs_src.md#idregistryevent)
- [Message](protobufs_src.md#message)
- [MessageData](protobufs_src.md#messagedata)
- [MessagesResponse](protobufs_src.md#messagesresponse)
- [NameRegistryEvent](protobufs_src.md#nameregistryevent)
- [NameRegistryEventRequest](protobufs_src.md#nameregistryeventrequest)
- [ReactionBody](protobufs_src.md#reactionbody)
- [ReactionRequest](protobufs_src.md#reactionrequest)
- [ReactionsByCastRequest](protobufs_src.md#reactionsbycastrequest)
- [ReactionsByFidRequest](protobufs_src.md#reactionsbyfidrequest)
- [RevokeSignerJobPayload](protobufs_src.md#revokesignerjobpayload)
- [SignerBody](protobufs_src.md#signerbody)
- [SignerRequest](protobufs_src.md#signerrequest)
- [SubscribeRequest](protobufs_src.md#subscriberequest)
- [SyncIds](protobufs_src.md#syncids)
- [TrieNodeMetadataResponse](protobufs_src.md#trienodemetadataresponse)
- [TrieNodePrefix](protobufs_src.md#trienodeprefix)
- [TrieNodeSnapshotResponse](protobufs_src.md#trienodesnapshotresponse)
- [UpdateNameRegistryEventExpiryJobPayload](protobufs_src.md#updatenameregistryeventexpiryjobpayload)
- [UserDataBody](protobufs_src.md#userdatabody)
- [UserDataRequest](protobufs_src.md#userdatarequest)
- [VerificationAddEthAddressBody](protobufs_src.md#verificationaddethaddressbody)
- [VerificationRemoveBody](protobufs_src.md#verificationremovebody)
- [VerificationRequest](protobufs_src.md#verificationrequest)

### Functions

- [eventTypeFromJSON](protobufs_src.md#eventtypefromjson)
- [eventTypeToJSON](protobufs_src.md#eventtypetojson)
- [farcasterNetworkFromJSON](protobufs_src.md#farcasternetworkfromjson)
- [farcasterNetworkToJSON](protobufs_src.md#farcasternetworktojson)
- [getClient](protobufs_src.md#getclient)
- [getServer](protobufs_src.md#getserver)
- [gossipVersionFromJSON](protobufs_src.md#gossipversionfromjson)
- [gossipVersionToJSON](protobufs_src.md#gossipversiontojson)
- [hashSchemeFromJSON](protobufs_src.md#hashschemefromjson)
- [hashSchemeToJSON](protobufs_src.md#hashschemetojson)
- [idRegistryEventTypeFromJSON](protobufs_src.md#idregistryeventtypefromjson)
- [idRegistryEventTypeToJSON](protobufs_src.md#idregistryeventtypetojson)
- [isAmpAddData](protobufs_src.md#isampadddata)
- [isAmpAddMessage](protobufs_src.md#isampaddmessage)
- [isAmpRemoveData](protobufs_src.md#isampremovedata)
- [isAmpRemoveMessage](protobufs_src.md#isampremovemessage)
- [isCastAddData](protobufs_src.md#iscastadddata)
- [isCastAddMessage](protobufs_src.md#iscastaddmessage)
- [isCastRemoveData](protobufs_src.md#iscastremovedata)
- [isCastRemoveMessage](protobufs_src.md#iscastremovemessage)
- [isReactionAddData](protobufs_src.md#isreactionadddata)
- [isReactionAddMessage](protobufs_src.md#isreactionaddmessage)
- [isReactionRemoveData](protobufs_src.md#isreactionremovedata)
- [isReactionRemoveMessage](protobufs_src.md#isreactionremovemessage)
- [isSignerAddData](protobufs_src.md#issigneradddata)
- [isSignerAddMessage](protobufs_src.md#issigneraddmessage)
- [isSignerRemoveData](protobufs_src.md#issignerremovedata)
- [isSignerRemoveMessage](protobufs_src.md#issignerremovemessage)
- [isUserDataAddData](protobufs_src.md#isuserdataadddata)
- [isUserDataAddMessage](protobufs_src.md#isuserdataaddmessage)
- [isVerificationAddEthAddressData](protobufs_src.md#isverificationaddethaddressdata)
- [isVerificationAddEthAddressMessage](protobufs_src.md#isverificationaddethaddressmessage)
- [isVerificationRemoveData](protobufs_src.md#isverificationremovedata)
- [isVerificationRemoveMessage](protobufs_src.md#isverificationremovemessage)
- [messageTypeFromJSON](protobufs_src.md#messagetypefromjson)
- [messageTypeToJSON](protobufs_src.md#messagetypetojson)
- [nameRegistryEventTypeFromJSON](protobufs_src.md#nameregistryeventtypefromjson)
- [nameRegistryEventTypeToJSON](protobufs_src.md#nameregistryeventtypetojson)
- [reactionTypeFromJSON](protobufs_src.md#reactiontypefromjson)
- [reactionTypeToJSON](protobufs_src.md#reactiontypetojson)
- [signatureSchemeFromJSON](protobufs_src.md#signatureschemefromjson)
- [signatureSchemeToJSON](protobufs_src.md#signatureschemetojson)
- [userDataTypeFromJSON](protobufs_src.md#userdatatypefromjson)
- [userDataTypeToJSON](protobufs_src.md#userdatatypetojson)

## Type Aliases

### AmpAddData

Ƭ **AmpAddData**: [`MessageData`](protobufs_src.md#messagedata) & { `ampBody`: [`AmpBody`](protobufs_src.md#ampbody) ; `type`: [`MESSAGE_TYPE_AMP_ADD`](../enums/protobufs_src.MessageType.md#message_type_amp_add)  }

#### Defined in

[protobufs/src/types.ts:43](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L43)

___

### AmpAddMessage

Ƭ **AmpAddMessage**: [`Message`](protobufs_src.md#message) & { `data`: [`AmpAddData`](protobufs_src.md#ampadddata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs_src.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

[protobufs/src/types.ts:48](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L48)

___

### AmpRemoveData

Ƭ **AmpRemoveData**: [`MessageData`](protobufs_src.md#messagedata) & { `ampBody`: [`AmpBody`](protobufs_src.md#ampbody) ; `type`: [`MESSAGE_TYPE_AMP_REMOVE`](../enums/protobufs_src.MessageType.md#message_type_amp_remove)  }

#### Defined in

[protobufs/src/types.ts:53](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L53)

___

### AmpRemoveMessage

Ƭ **AmpRemoveMessage**: [`Message`](protobufs_src.md#message) & { `data`: [`AmpRemoveData`](protobufs_src.md#ampremovedata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs_src.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

[protobufs/src/types.ts:58](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L58)

___

### CastAddData

Ƭ **CastAddData**: [`MessageData`](protobufs_src.md#messagedata) & { `castAddBody`: [`CastAddBody`](protobufs_src.md#castaddbody) ; `type`: [`MESSAGE_TYPE_CAST_ADD`](../enums/protobufs_src.MessageType.md#message_type_cast_add)  }

#### Defined in

[protobufs/src/types.ts:3](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L3)

___

### CastAddMessage

Ƭ **CastAddMessage**: [`Message`](protobufs_src.md#message) & { `data`: [`CastAddData`](protobufs_src.md#castadddata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs_src.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

[protobufs/src/types.ts:8](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L8)

___

### CastRemoveData

Ƭ **CastRemoveData**: [`MessageData`](protobufs_src.md#messagedata) & { `castRemoveBody`: [`CastRemoveBody`](protobufs_src.md#castremovebody) ; `type`: [`MESSAGE_TYPE_CAST_REMOVE`](../enums/protobufs_src.MessageType.md#message_type_cast_remove)  }

#### Defined in

[protobufs/src/types.ts:13](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L13)

___

### CastRemoveMessage

Ƭ **CastRemoveMessage**: [`Message`](protobufs_src.md#message) & { `data`: [`CastRemoveData`](protobufs_src.md#castremovedata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs_src.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

[protobufs/src/types.ts:18](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L18)

___

### HubServiceService

Ƭ **HubServiceService**: typeof [`HubServiceService`](protobufs_src.md#hubserviceservice-1)

#### Defined in

[protobufs/src/generated/rpc.ts:1430](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L1430)

[protobufs/src/generated/rpc.ts:1431](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L1431)

___

### ReactionAddData

Ƭ **ReactionAddData**: [`MessageData`](protobufs_src.md#messagedata) & { `reactionBody`: [`ReactionBody`](protobufs_src.md#reactionbody) ; `type`: [`MESSAGE_TYPE_REACTION_ADD`](../enums/protobufs_src.MessageType.md#message_type_reaction_add)  }

#### Defined in

[protobufs/src/types.ts:23](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L23)

___

### ReactionAddMessage

Ƭ **ReactionAddMessage**: [`Message`](protobufs_src.md#message) & { `data`: [`ReactionAddData`](protobufs_src.md#reactionadddata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs_src.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

[protobufs/src/types.ts:28](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L28)

___

### ReactionRemoveData

Ƭ **ReactionRemoveData**: [`MessageData`](protobufs_src.md#messagedata) & { `reactionBody`: [`ReactionBody`](protobufs_src.md#reactionbody) ; `type`: [`MESSAGE_TYPE_REACTION_REMOVE`](../enums/protobufs_src.MessageType.md#message_type_reaction_remove)  }

#### Defined in

[protobufs/src/types.ts:33](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L33)

___

### ReactionRemoveMessage

Ƭ **ReactionRemoveMessage**: [`Message`](protobufs_src.md#message) & { `data`: [`ReactionRemoveData`](protobufs_src.md#reactionremovedata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs_src.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

[protobufs/src/types.ts:38](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L38)

___

### SignerAddData

Ƭ **SignerAddData**: [`MessageData`](protobufs_src.md#messagedata) & { `signerBody`: [`SignerBody`](protobufs_src.md#signerbody) ; `type`: [`MESSAGE_TYPE_SIGNER_ADD`](../enums/protobufs_src.MessageType.md#message_type_signer_add)  }

#### Defined in

[protobufs/src/types.ts:83](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L83)

___

### SignerAddMessage

Ƭ **SignerAddMessage**: [`Message`](protobufs_src.md#message) & { `data`: [`SignerAddData`](protobufs_src.md#signeradddata) ; `signatureScheme`: [`SIGNATURE_SCHEME_EIP712`](../enums/protobufs_src.SignatureScheme.md#signature_scheme_eip712)  }

#### Defined in

[protobufs/src/types.ts:88](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L88)

___

### SignerRemoveData

Ƭ **SignerRemoveData**: [`MessageData`](protobufs_src.md#messagedata) & { `signerBody`: [`SignerBody`](protobufs_src.md#signerbody) ; `type`: [`MESSAGE_TYPE_SIGNER_REMOVE`](../enums/protobufs_src.MessageType.md#message_type_signer_remove)  }

#### Defined in

[protobufs/src/types.ts:93](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L93)

___

### SignerRemoveMessage

Ƭ **SignerRemoveMessage**: [`Message`](protobufs_src.md#message) & { `data`: [`SignerRemoveData`](protobufs_src.md#signerremovedata) ; `signatureScheme`: [`SIGNATURE_SCHEME_EIP712`](../enums/protobufs_src.SignatureScheme.md#signature_scheme_eip712)  }

#### Defined in

[protobufs/src/types.ts:98](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L98)

___

### UserDataAddData

Ƭ **UserDataAddData**: [`MessageData`](protobufs_src.md#messagedata) & { `type`: [`MESSAGE_TYPE_USER_DATA_ADD`](../enums/protobufs_src.MessageType.md#message_type_user_data_add) ; `userDataBody`: [`UserDataBody`](protobufs_src.md#userdatabody)  }

#### Defined in

[protobufs/src/types.ts:103](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L103)

___

### UserDataAddMessage

Ƭ **UserDataAddMessage**: [`Message`](protobufs_src.md#message) & { `data`: [`UserDataAddData`](protobufs_src.md#userdataadddata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs_src.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

[protobufs/src/types.ts:108](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L108)

___

### VerificationAddEthAddressData

Ƭ **VerificationAddEthAddressData**: [`MessageData`](protobufs_src.md#messagedata) & { `type`: [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](../enums/protobufs_src.MessageType.md#message_type_verification_add_eth_address) ; `verificationAddEthAddressBody`: [`VerificationAddEthAddressBody`](protobufs_src.md#verificationaddethaddressbody)  }

#### Defined in

[protobufs/src/types.ts:63](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L63)

___

### VerificationAddEthAddressMessage

Ƭ **VerificationAddEthAddressMessage**: [`Message`](protobufs_src.md#message) & { `data`: [`VerificationAddEthAddressData`](protobufs_src.md#verificationaddethaddressdata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs_src.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

[protobufs/src/types.ts:68](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L68)

___

### VerificationRemoveData

Ƭ **VerificationRemoveData**: [`MessageData`](protobufs_src.md#messagedata) & { `type`: [`MESSAGE_TYPE_VERIFICATION_REMOVE`](../enums/protobufs_src.MessageType.md#message_type_verification_remove) ; `verificationRemoveBody`: [`VerificationRemoveBody`](protobufs_src.md#verificationremovebody)  }

#### Defined in

[protobufs/src/types.ts:73](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L73)

___

### VerificationRemoveMessage

Ƭ **VerificationRemoveMessage**: [`Message`](protobufs_src.md#message) & { `data`: [`VerificationRemoveData`](protobufs_src.md#verificationremovedata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/protobufs_src.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

[protobufs/src/types.ts:78](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/types.ts#L78)

## Variables

### AmpBody

• **AmpBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`AmpBody`](protobufs_src.md#ampbody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`AmpBody`](protobufs_src.md#ampbody) |
| `encode` | (`message`: [`AmpBody`](protobufs_src.md#ampbody), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`AmpBody`](protobufs_src.md#ampbody) |
| `fromPartial` | <I\>(`object`: `I`) => [`AmpBody`](protobufs_src.md#ampbody) |
| `toJSON` | (`message`: [`AmpBody`](protobufs_src.md#ampbody)) => `unknown` |

#### Defined in

[protobufs/src/generated/message.ts:339](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L339)

[protobufs/src/generated/message.ts:694](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L694)

___

### AmpRequest

• **AmpRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`AmpRequest`](protobufs_src.md#amprequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`AmpRequest`](protobufs_src.md#amprequest) |
| `encode` | (`message`: [`AmpRequest`](protobufs_src.md#amprequest), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`AmpRequest`](protobufs_src.md#amprequest) |
| `fromPartial` | <I\>(`object`: `I`) => [`AmpRequest`](protobufs_src.md#amprequest) |
| `toJSON` | (`message`: [`AmpRequest`](protobufs_src.md#amprequest)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:161](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L161)

[protobufs/src/generated/rpc.ts:1132](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L1132)

___

### CastAddBody

• **CastAddBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`CastAddBody`](protobufs_src.md#castaddbody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`CastAddBody`](protobufs_src.md#castaddbody) |
| `encode` | (`message`: [`CastAddBody`](protobufs_src.md#castaddbody), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`CastAddBody`](protobufs_src.md#castaddbody) |
| `fromPartial` | <I\>(`object`: `I`) => [`CastAddBody`](protobufs_src.md#castaddbody) |
| `toJSON` | (`message`: [`CastAddBody`](protobufs_src.md#castaddbody)) => `unknown` |

#### Defined in

[protobufs/src/generated/message.ts:322](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L322)

[protobufs/src/generated/message.ts:453](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L453)

___

### CastId

• **CastId**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`CastId`](protobufs_src.md#castid) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`CastId`](protobufs_src.md#castid) |
| `encode` | (`message`: [`CastId`](protobufs_src.md#castid), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`CastId`](protobufs_src.md#castid) |
| `fromPartial` | <I\>(`object`: `I`) => [`CastId`](protobufs_src.md#castid) |
| `toJSON` | (`message`: [`CastId`](protobufs_src.md#castid)) => `unknown` |

#### Defined in

[protobufs/src/generated/message.ts:317](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L317)

[protobufs/src/generated/message.ts:390](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L390)

___

### CastRemoveBody

• **CastRemoveBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`CastRemoveBody`](protobufs_src.md#castremovebody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`CastRemoveBody`](protobufs_src.md#castremovebody) |
| `encode` | (`message`: [`CastRemoveBody`](protobufs_src.md#castremovebody), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`CastRemoveBody`](protobufs_src.md#castremovebody) |
| `fromPartial` | <I\>(`object`: `I`) => [`CastRemoveBody`](protobufs_src.md#castremovebody) |
| `toJSON` | (`message`: [`CastRemoveBody`](protobufs_src.md#castremovebody)) => `unknown` |

#### Defined in

[protobufs/src/generated/message.ts:330](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L330)

[protobufs/src/generated/message.ts:577](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L577)

___

### ContactInfoContent

• **ContactInfoContent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`ContactInfoContent`](protobufs_src.md#contactinfocontent) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`ContactInfoContent`](protobufs_src.md#contactinfocontent) |
| `encode` | (`message`: [`ContactInfoContent`](protobufs_src.md#contactinfocontent), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`ContactInfoContent`](protobufs_src.md#contactinfocontent) |
| `fromPartial` | <I\>(`object`: `I`) => [`ContactInfoContent`](protobufs_src.md#contactinfocontent) |
| `toJSON` | (`message`: [`ContactInfoContent`](protobufs_src.md#contactinfocontent)) => `unknown` |

#### Defined in

[protobufs/src/generated/gossip.ts:39](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/gossip.ts#L39)

[protobufs/src/generated/gossip.ts:130](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/gossip.ts#L130)

___

### DbTrieNode

• **DbTrieNode**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`DbTrieNode`](protobufs_src.md#dbtrienode) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`DbTrieNode`](protobufs_src.md#dbtrienode) |
| `encode` | (`message`: [`DbTrieNode`](protobufs_src.md#dbtrienode), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`DbTrieNode`](protobufs_src.md#dbtrienode) |
| `fromPartial` | <I\>(`object`: `I`) => [`DbTrieNode`](protobufs_src.md#dbtrienode) |
| `toJSON` | (`message`: [`DbTrieNode`](protobufs_src.md#dbtrienode)) => `unknown` |

#### Defined in

[protobufs/src/generated/sync_trie.ts:4](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/sync_trie.ts#L4)

[protobufs/src/generated/sync_trie.ts:15](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/sync_trie.ts#L15)

___

### Empty

• **Empty**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`Empty`](protobufs_src.md#empty) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`Empty`](protobufs_src.md#empty) |
| `encode` | (`_`: [`Empty`](protobufs_src.md#empty), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`_`: `any`) => [`Empty`](protobufs_src.md#empty) |
| `fromPartial` | <I\>(`_`: `I`) => [`Empty`](protobufs_src.md#empty) |
| `toJSON` | (`_`: [`Empty`](protobufs_src.md#empty)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:88](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L88)

[protobufs/src/generated/rpc.ts:189](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L189)

___

### EventResponse

• **EventResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`EventResponse`](protobufs_src.md#eventresponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`EventResponse`](protobufs_src.md#eventresponse) |
| `encode` | (`message`: [`EventResponse`](protobufs_src.md#eventresponse), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`EventResponse`](protobufs_src.md#eventresponse) |
| `fromPartial` | <I\>(`object`: `I`) => [`EventResponse`](protobufs_src.md#eventresponse) |
| `toJSON` | (`message`: [`EventResponse`](protobufs_src.md#eventresponse)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:91](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L91)

[protobufs/src/generated/rpc.ts:232](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L232)

___

### FidRequest

• **FidRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `encode` | (`message`: [`FidRequest`](protobufs_src.md#fidrequest), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `fromPartial` | <I\>(`object`: `I`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `toJSON` | (`message`: [`FidRequest`](protobufs_src.md#fidrequest)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:133](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L133)

[protobufs/src/generated/rpc.ts:763](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L763)

___

### FidsResponse

• **FidsResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`FidsResponse`](protobufs_src.md#fidsresponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`FidsResponse`](protobufs_src.md#fidsresponse) |
| `encode` | (`message`: [`FidsResponse`](protobufs_src.md#fidsresponse), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`FidsResponse`](protobufs_src.md#fidsresponse) |
| `fromPartial` | <I\>(`object`: `I`) => [`FidsResponse`](protobufs_src.md#fidsresponse) |
| `toJSON` | (`message`: [`FidsResponse`](protobufs_src.md#fidsresponse)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:137](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L137)

[protobufs/src/generated/rpc.ts:814](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L814)

___

### GossipAddressInfo

• **GossipAddressInfo**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`GossipAddressInfo`](protobufs_src.md#gossipaddressinfo) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`GossipAddressInfo`](protobufs_src.md#gossipaddressinfo) |
| `encode` | (`message`: [`GossipAddressInfo`](protobufs_src.md#gossipaddressinfo), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`GossipAddressInfo`](protobufs_src.md#gossipaddressinfo) |
| `fromPartial` | <I\>(`object`: `I`) => [`GossipAddressInfo`](protobufs_src.md#gossipaddressinfo) |
| `toJSON` | (`message`: [`GossipAddressInfo`](protobufs_src.md#gossipaddressinfo)) => `unknown` |

#### Defined in

[protobufs/src/generated/gossip.ts:33](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/gossip.ts#L33)

[protobufs/src/generated/gossip.ts:59](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/gossip.ts#L59)

___

### GossipMessage

• **GossipMessage**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`GossipMessage`](protobufs_src.md#gossipmessage) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`GossipMessage`](protobufs_src.md#gossipmessage) |
| `encode` | (`message`: [`GossipMessage`](protobufs_src.md#gossipmessage), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`GossipMessage`](protobufs_src.md#gossipmessage) |
| `fromPartial` | <I\>(`object`: `I`) => [`GossipMessage`](protobufs_src.md#gossipmessage) |
| `toJSON` | (`message`: [`GossipMessage`](protobufs_src.md#gossipmessage)) => `unknown` |

#### Defined in

[protobufs/src/generated/gossip.ts:46](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/gossip.ts#L46)

[protobufs/src/generated/gossip.ts:227](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/gossip.ts#L227)

___

### HubInfoResponse

• **HubInfoResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`HubInfoResponse`](protobufs_src.md#hubinforesponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`HubInfoResponse`](protobufs_src.md#hubinforesponse) |
| `encode` | (`message`: [`HubInfoResponse`](protobufs_src.md#hubinforesponse), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`HubInfoResponse`](protobufs_src.md#hubinforesponse) |
| `fromPartial` | <I\>(`object`: `I`) => [`HubInfoResponse`](protobufs_src.md#hubinforesponse) |
| `toJSON` | (`message`: [`HubInfoResponse`](protobufs_src.md#hubinforesponse)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:104](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L104)

[protobufs/src/generated/rpc.ts:404](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L404)

___

### HubServiceClient

• **HubServiceClient**: `Object`

#### Call signature

• **new HubServiceClient**(`address`, `credentials`, `options?`): [`HubServiceClient`](protobufs_src.md#hubserviceclient)

##### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `credentials` | `ChannelCredentials` |
| `options?` | `Partial`<`ClientOptions`\> |

##### Returns

[`HubServiceClient`](protobufs_src.md#hubserviceclient)

#### Type declaration

| Name | Type |
| :------ | :------ |
| `service` | { `getAllAmpMessagesByFid`: { `path`: ``"/HubService/GetAllAmpMessagesByFid"`` = "/HubService/GetAllAmpMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getAllCastMessagesByFid`: { `path`: ``"/HubService/GetAllCastMessagesByFid"`` = "/HubService/GetAllCastMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getAllMessagesBySyncIds`: { `path`: ``"/HubService/GetAllMessagesBySyncIds"`` = "/HubService/GetAllMessagesBySyncIds"; `requestDeserialize`: (`value`: `Buffer`) => [`SyncIds`](protobufs_src.md#syncids) ; `requestSerialize`: (`value`: [`SyncIds`](protobufs_src.md#syncids)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getAllReactionMessagesByFid`: { `path`: ``"/HubService/GetAllReactionMessagesByFid"`` = "/HubService/GetAllReactionMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getAllSignerMessagesByFid`: { `path`: ``"/HubService/GetAllSignerMessagesByFid"`` = "/HubService/GetAllSignerMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getAllSyncIdsByPrefix`: { `path`: ``"/HubService/GetAllSyncIdsByPrefix"`` = "/HubService/GetAllSyncIdsByPrefix"; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`SyncIds`](protobufs_src.md#syncids) ; `responseSerialize`: (`value`: [`SyncIds`](protobufs_src.md#syncids)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getAllUserDataMessagesByFid`: { `path`: ``"/HubService/GetAllUserDataMessagesByFid"`` = "/HubService/GetAllUserDataMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getAllVerificationMessagesByFid`: { `path`: ``"/HubService/GetAllVerificationMessagesByFid"`` = "/HubService/GetAllVerificationMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getAmp`: { `path`: ``"/HubService/GetAmp"`` = "/HubService/GetAmp"; `requestDeserialize`: (`value`: `Buffer`) => [`AmpRequest`](protobufs_src.md#amprequest) ; `requestSerialize`: (`value`: [`AmpRequest`](protobufs_src.md#amprequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getAmpsByFid`: { `path`: ``"/HubService/GetAmpsByFid"`` = "/HubService/GetAmpsByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getAmpsByUser`: { `path`: ``"/HubService/GetAmpsByUser"`` = "/HubService/GetAmpsByUser"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getCast`: { `path`: ``"/HubService/GetCast"`` = "/HubService/GetCast"; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](protobufs_src.md#castid) ; `requestSerialize`: (`value`: [`CastId`](protobufs_src.md#castid)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getCastsByFid`: { `path`: ``"/HubService/GetCastsByFid"`` = "/HubService/GetCastsByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getCastsByMention`: { `path`: ``"/HubService/GetCastsByMention"`` = "/HubService/GetCastsByMention"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getCastsByParent`: { `path`: ``"/HubService/GetCastsByParent"`` = "/HubService/GetCastsByParent"; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](protobufs_src.md#castid) ; `requestSerialize`: (`value`: [`CastId`](protobufs_src.md#castid)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getFids`: { `path`: ``"/HubService/GetFids"`` = "/HubService/GetFids"; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs_src.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs_src.md#empty)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`FidsResponse`](protobufs_src.md#fidsresponse) ; `responseSerialize`: (`value`: [`FidsResponse`](protobufs_src.md#fidsresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getIdRegistryEvent`: { `path`: ``"/HubService/GetIdRegistryEvent"`` = "/HubService/GetIdRegistryEvent"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getInfo`: { `path`: ``"/HubService/GetInfo"`` = "/HubService/GetInfo"; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs_src.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs_src.md#empty)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`HubInfoResponse`](protobufs_src.md#hubinforesponse) ; `responseSerialize`: (`value`: [`HubInfoResponse`](protobufs_src.md#hubinforesponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getNameRegistryEvent`: { `path`: ``"/HubService/GetNameRegistryEvent"`` = "/HubService/GetNameRegistryEvent"; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEventRequest`](protobufs_src.md#nameregistryeventrequest) ; `requestSerialize`: (`value`: [`NameRegistryEventRequest`](protobufs_src.md#nameregistryeventrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getReaction`: { `path`: ``"/HubService/GetReaction"`` = "/HubService/GetReaction"; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionRequest`](protobufs_src.md#reactionrequest) ; `requestSerialize`: (`value`: [`ReactionRequest`](protobufs_src.md#reactionrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getReactionsByCast`: { `path`: ``"/HubService/GetReactionsByCast"`` = "/HubService/GetReactionsByCast"; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByCastRequest`](protobufs_src.md#reactionsbycastrequest) ; `requestSerialize`: (`value`: [`ReactionsByCastRequest`](protobufs_src.md#reactionsbycastrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getReactionsByFid`: { `path`: ``"/HubService/GetReactionsByFid"`` = "/HubService/GetReactionsByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByFidRequest`](protobufs_src.md#reactionsbyfidrequest) ; `requestSerialize`: (`value`: [`ReactionsByFidRequest`](protobufs_src.md#reactionsbyfidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getSigner`: { `path`: ``"/HubService/GetSigner"`` = "/HubService/GetSigner"; `requestDeserialize`: (`value`: `Buffer`) => [`SignerRequest`](protobufs_src.md#signerrequest) ; `requestSerialize`: (`value`: [`SignerRequest`](protobufs_src.md#signerrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getSignersByFid`: { `path`: ``"/HubService/GetSignersByFid"`` = "/HubService/GetSignersByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getSyncMetadataByPrefix`: { `path`: ``"/HubService/GetSyncMetadataByPrefix"`` = "/HubService/GetSyncMetadataByPrefix"; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeMetadataResponse`](protobufs_src.md#trienodemetadataresponse) ; `responseSerialize`: (`value`: [`TrieNodeMetadataResponse`](protobufs_src.md#trienodemetadataresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getSyncSnapshotByPrefix`: { `path`: ``"/HubService/GetSyncSnapshotByPrefix"`` = "/HubService/GetSyncSnapshotByPrefix"; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeSnapshotResponse`](protobufs_src.md#trienodesnapshotresponse) ; `responseSerialize`: (`value`: [`TrieNodeSnapshotResponse`](protobufs_src.md#trienodesnapshotresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getUserData`: { `path`: ``"/HubService/GetUserData"`` = "/HubService/GetUserData"; `requestDeserialize`: (`value`: `Buffer`) => [`UserDataRequest`](protobufs_src.md#userdatarequest) ; `requestSerialize`: (`value`: [`UserDataRequest`](protobufs_src.md#userdatarequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getUserDataByFid`: { `path`: ``"/HubService/GetUserDataByFid"`` = "/HubService/GetUserDataByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getVerification`: { `path`: ``"/HubService/GetVerification"`` = "/HubService/GetVerification"; `requestDeserialize`: (`value`: `Buffer`) => [`VerificationRequest`](protobufs_src.md#verificationrequest) ; `requestSerialize`: (`value`: [`VerificationRequest`](protobufs_src.md#verificationrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } ; `getVerificationsByFid`: { `path`: ``"/HubService/GetVerificationsByFid"`` = "/HubService/GetVerificationsByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } ; `submitIdRegistryEvent`: { `path`: ``"/HubService/SubmitIdRegistryEvent"`` = "/HubService/SubmitIdRegistryEvent"; `requestDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) ; `requestSerialize`: (`value`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false`` = false } ; `submitMessage`: { `path`: ``"/HubService/SubmitMessage"`` = "/HubService/SubmitMessage"; `requestDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `requestSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } ; `submitNameRegistryEvent`: { `path`: ``"/HubService/SubmitNameRegistryEvent"`` = "/HubService/SubmitNameRegistryEvent"; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) ; `requestSerialize`: (`value`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false`` = false } ; `subscribe`: { `path`: ``"/HubService/Subscribe"`` = "/HubService/Subscribe"; `requestDeserialize`: (`value`: `Buffer`) => [`SubscribeRequest`](protobufs_src.md#subscriberequest) ; `requestSerialize`: (`value`: [`SubscribeRequest`](protobufs_src.md#subscriberequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`EventResponse`](protobufs_src.md#eventresponse) ; `responseSerialize`: (`value`: [`EventResponse`](protobufs_src.md#eventresponse)) => `Buffer` ; `responseStream`: ``true`` = true }  } |
| `service.getAllAmpMessagesByFid` | { `path`: ``"/HubService/GetAllAmpMessagesByFid"`` = "/HubService/GetAllAmpMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getAllAmpMessagesByFid.path` | ``"/HubService/GetAllAmpMessagesByFid"`` |
| `service.getAllAmpMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `service.getAllAmpMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` |
| `service.getAllAmpMessagesByFid.requestStream` | ``false`` |
| `service.getAllAmpMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getAllAmpMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getAllAmpMessagesByFid.responseStream` | ``false`` |
| `service.getAllCastMessagesByFid` | { `path`: ``"/HubService/GetAllCastMessagesByFid"`` = "/HubService/GetAllCastMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getAllCastMessagesByFid.path` | ``"/HubService/GetAllCastMessagesByFid"`` |
| `service.getAllCastMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `service.getAllCastMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` |
| `service.getAllCastMessagesByFid.requestStream` | ``false`` |
| `service.getAllCastMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getAllCastMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getAllCastMessagesByFid.responseStream` | ``false`` |
| `service.getAllMessagesBySyncIds` | { `path`: ``"/HubService/GetAllMessagesBySyncIds"`` = "/HubService/GetAllMessagesBySyncIds"; `requestDeserialize`: (`value`: `Buffer`) => [`SyncIds`](protobufs_src.md#syncids) ; `requestSerialize`: (`value`: [`SyncIds`](protobufs_src.md#syncids)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getAllMessagesBySyncIds.path` | ``"/HubService/GetAllMessagesBySyncIds"`` |
| `service.getAllMessagesBySyncIds.requestDeserialize` | (`value`: `Buffer`) => [`SyncIds`](protobufs_src.md#syncids) |
| `service.getAllMessagesBySyncIds.requestSerialize` | (`value`: [`SyncIds`](protobufs_src.md#syncids)) => `Buffer` |
| `service.getAllMessagesBySyncIds.requestStream` | ``false`` |
| `service.getAllMessagesBySyncIds.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getAllMessagesBySyncIds.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getAllMessagesBySyncIds.responseStream` | ``false`` |
| `service.getAllReactionMessagesByFid` | { `path`: ``"/HubService/GetAllReactionMessagesByFid"`` = "/HubService/GetAllReactionMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getAllReactionMessagesByFid.path` | ``"/HubService/GetAllReactionMessagesByFid"`` |
| `service.getAllReactionMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `service.getAllReactionMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` |
| `service.getAllReactionMessagesByFid.requestStream` | ``false`` |
| `service.getAllReactionMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getAllReactionMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getAllReactionMessagesByFid.responseStream` | ``false`` |
| `service.getAllSignerMessagesByFid` | { `path`: ``"/HubService/GetAllSignerMessagesByFid"`` = "/HubService/GetAllSignerMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getAllSignerMessagesByFid.path` | ``"/HubService/GetAllSignerMessagesByFid"`` |
| `service.getAllSignerMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `service.getAllSignerMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` |
| `service.getAllSignerMessagesByFid.requestStream` | ``false`` |
| `service.getAllSignerMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getAllSignerMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getAllSignerMessagesByFid.responseStream` | ``false`` |
| `service.getAllSyncIdsByPrefix` | { `path`: ``"/HubService/GetAllSyncIdsByPrefix"`` = "/HubService/GetAllSyncIdsByPrefix"; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`SyncIds`](protobufs_src.md#syncids) ; `responseSerialize`: (`value`: [`SyncIds`](protobufs_src.md#syncids)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getAllSyncIdsByPrefix.path` | ``"/HubService/GetAllSyncIdsByPrefix"`` |
| `service.getAllSyncIdsByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) |
| `service.getAllSyncIdsByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix)) => `Buffer` |
| `service.getAllSyncIdsByPrefix.requestStream` | ``false`` |
| `service.getAllSyncIdsByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`SyncIds`](protobufs_src.md#syncids) |
| `service.getAllSyncIdsByPrefix.responseSerialize` | (`value`: [`SyncIds`](protobufs_src.md#syncids)) => `Buffer` |
| `service.getAllSyncIdsByPrefix.responseStream` | ``false`` |
| `service.getAllUserDataMessagesByFid` | { `path`: ``"/HubService/GetAllUserDataMessagesByFid"`` = "/HubService/GetAllUserDataMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getAllUserDataMessagesByFid.path` | ``"/HubService/GetAllUserDataMessagesByFid"`` |
| `service.getAllUserDataMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `service.getAllUserDataMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` |
| `service.getAllUserDataMessagesByFid.requestStream` | ``false`` |
| `service.getAllUserDataMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getAllUserDataMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getAllUserDataMessagesByFid.responseStream` | ``false`` |
| `service.getAllVerificationMessagesByFid` | { `path`: ``"/HubService/GetAllVerificationMessagesByFid"`` = "/HubService/GetAllVerificationMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getAllVerificationMessagesByFid.path` | ``"/HubService/GetAllVerificationMessagesByFid"`` |
| `service.getAllVerificationMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `service.getAllVerificationMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` |
| `service.getAllVerificationMessagesByFid.requestStream` | ``false`` |
| `service.getAllVerificationMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getAllVerificationMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getAllVerificationMessagesByFid.responseStream` | ``false`` |
| `service.getAmp` | { `path`: ``"/HubService/GetAmp"`` = "/HubService/GetAmp"; `requestDeserialize`: (`value`: `Buffer`) => [`AmpRequest`](protobufs_src.md#amprequest) ; `requestSerialize`: (`value`: [`AmpRequest`](protobufs_src.md#amprequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getAmp.path` | ``"/HubService/GetAmp"`` |
| `service.getAmp.requestDeserialize` | (`value`: `Buffer`) => [`AmpRequest`](protobufs_src.md#amprequest) |
| `service.getAmp.requestSerialize` | (`value`: [`AmpRequest`](protobufs_src.md#amprequest)) => `Buffer` |
| `service.getAmp.requestStream` | ``false`` |
| `service.getAmp.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) |
| `service.getAmp.responseSerialize` | (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` |
| `service.getAmp.responseStream` | ``false`` |
| `service.getAmpsByFid` | { `path`: ``"/HubService/GetAmpsByFid"`` = "/HubService/GetAmpsByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getAmpsByFid.path` | ``"/HubService/GetAmpsByFid"`` |
| `service.getAmpsByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `service.getAmpsByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` |
| `service.getAmpsByFid.requestStream` | ``false`` |
| `service.getAmpsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getAmpsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getAmpsByFid.responseStream` | ``false`` |
| `service.getAmpsByUser` | { `path`: ``"/HubService/GetAmpsByUser"`` = "/HubService/GetAmpsByUser"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getAmpsByUser.path` | ``"/HubService/GetAmpsByUser"`` |
| `service.getAmpsByUser.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `service.getAmpsByUser.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` |
| `service.getAmpsByUser.requestStream` | ``false`` |
| `service.getAmpsByUser.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getAmpsByUser.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getAmpsByUser.responseStream` | ``false`` |
| `service.getCast` | { `path`: ``"/HubService/GetCast"`` = "/HubService/GetCast"; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](protobufs_src.md#castid) ; `requestSerialize`: (`value`: [`CastId`](protobufs_src.md#castid)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getCast.path` | ``"/HubService/GetCast"`` |
| `service.getCast.requestDeserialize` | (`value`: `Buffer`) => [`CastId`](protobufs_src.md#castid) |
| `service.getCast.requestSerialize` | (`value`: [`CastId`](protobufs_src.md#castid)) => `Buffer` |
| `service.getCast.requestStream` | ``false`` |
| `service.getCast.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) |
| `service.getCast.responseSerialize` | (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` |
| `service.getCast.responseStream` | ``false`` |
| `service.getCastsByFid` | { `path`: ``"/HubService/GetCastsByFid"`` = "/HubService/GetCastsByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getCastsByFid.path` | ``"/HubService/GetCastsByFid"`` |
| `service.getCastsByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `service.getCastsByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` |
| `service.getCastsByFid.requestStream` | ``false`` |
| `service.getCastsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getCastsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getCastsByFid.responseStream` | ``false`` |
| `service.getCastsByMention` | { `path`: ``"/HubService/GetCastsByMention"`` = "/HubService/GetCastsByMention"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getCastsByMention.path` | ``"/HubService/GetCastsByMention"`` |
| `service.getCastsByMention.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `service.getCastsByMention.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` |
| `service.getCastsByMention.requestStream` | ``false`` |
| `service.getCastsByMention.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getCastsByMention.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getCastsByMention.responseStream` | ``false`` |
| `service.getCastsByParent` | { `path`: ``"/HubService/GetCastsByParent"`` = "/HubService/GetCastsByParent"; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](protobufs_src.md#castid) ; `requestSerialize`: (`value`: [`CastId`](protobufs_src.md#castid)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getCastsByParent.path` | ``"/HubService/GetCastsByParent"`` |
| `service.getCastsByParent.requestDeserialize` | (`value`: `Buffer`) => [`CastId`](protobufs_src.md#castid) |
| `service.getCastsByParent.requestSerialize` | (`value`: [`CastId`](protobufs_src.md#castid)) => `Buffer` |
| `service.getCastsByParent.requestStream` | ``false`` |
| `service.getCastsByParent.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getCastsByParent.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getCastsByParent.responseStream` | ``false`` |
| `service.getFids` | { `path`: ``"/HubService/GetFids"`` = "/HubService/GetFids"; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs_src.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs_src.md#empty)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`FidsResponse`](protobufs_src.md#fidsresponse) ; `responseSerialize`: (`value`: [`FidsResponse`](protobufs_src.md#fidsresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getFids.path` | ``"/HubService/GetFids"`` |
| `service.getFids.requestDeserialize` | (`value`: `Buffer`) => [`Empty`](protobufs_src.md#empty) |
| `service.getFids.requestSerialize` | (`value`: [`Empty`](protobufs_src.md#empty)) => `Buffer` |
| `service.getFids.requestStream` | ``false`` |
| `service.getFids.responseDeserialize` | (`value`: `Buffer`) => [`FidsResponse`](protobufs_src.md#fidsresponse) |
| `service.getFids.responseSerialize` | (`value`: [`FidsResponse`](protobufs_src.md#fidsresponse)) => `Buffer` |
| `service.getFids.responseStream` | ``false`` |
| `service.getIdRegistryEvent` | { `path`: ``"/HubService/GetIdRegistryEvent"`` = "/HubService/GetIdRegistryEvent"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getIdRegistryEvent.path` | ``"/HubService/GetIdRegistryEvent"`` |
| `service.getIdRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `service.getIdRegistryEvent.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` |
| `service.getIdRegistryEvent.requestStream` | ``false`` |
| `service.getIdRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) |
| `service.getIdRegistryEvent.responseSerialize` | (`value`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent)) => `Buffer` |
| `service.getIdRegistryEvent.responseStream` | ``false`` |
| `service.getInfo` | { `path`: ``"/HubService/GetInfo"`` = "/HubService/GetInfo"; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs_src.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs_src.md#empty)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`HubInfoResponse`](protobufs_src.md#hubinforesponse) ; `responseSerialize`: (`value`: [`HubInfoResponse`](protobufs_src.md#hubinforesponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getInfo.path` | ``"/HubService/GetInfo"`` |
| `service.getInfo.requestDeserialize` | (`value`: `Buffer`) => [`Empty`](protobufs_src.md#empty) |
| `service.getInfo.requestSerialize` | (`value`: [`Empty`](protobufs_src.md#empty)) => `Buffer` |
| `service.getInfo.requestStream` | ``false`` |
| `service.getInfo.responseDeserialize` | (`value`: `Buffer`) => [`HubInfoResponse`](protobufs_src.md#hubinforesponse) |
| `service.getInfo.responseSerialize` | (`value`: [`HubInfoResponse`](protobufs_src.md#hubinforesponse)) => `Buffer` |
| `service.getInfo.responseStream` | ``false`` |
| `service.getNameRegistryEvent` | { `path`: ``"/HubService/GetNameRegistryEvent"`` = "/HubService/GetNameRegistryEvent"; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEventRequest`](protobufs_src.md#nameregistryeventrequest) ; `requestSerialize`: (`value`: [`NameRegistryEventRequest`](protobufs_src.md#nameregistryeventrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getNameRegistryEvent.path` | ``"/HubService/GetNameRegistryEvent"`` |
| `service.getNameRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`NameRegistryEventRequest`](protobufs_src.md#nameregistryeventrequest) |
| `service.getNameRegistryEvent.requestSerialize` | (`value`: [`NameRegistryEventRequest`](protobufs_src.md#nameregistryeventrequest)) => `Buffer` |
| `service.getNameRegistryEvent.requestStream` | ``false`` |
| `service.getNameRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) |
| `service.getNameRegistryEvent.responseSerialize` | (`value`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent)) => `Buffer` |
| `service.getNameRegistryEvent.responseStream` | ``false`` |
| `service.getReaction` | { `path`: ``"/HubService/GetReaction"`` = "/HubService/GetReaction"; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionRequest`](protobufs_src.md#reactionrequest) ; `requestSerialize`: (`value`: [`ReactionRequest`](protobufs_src.md#reactionrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getReaction.path` | ``"/HubService/GetReaction"`` |
| `service.getReaction.requestDeserialize` | (`value`: `Buffer`) => [`ReactionRequest`](protobufs_src.md#reactionrequest) |
| `service.getReaction.requestSerialize` | (`value`: [`ReactionRequest`](protobufs_src.md#reactionrequest)) => `Buffer` |
| `service.getReaction.requestStream` | ``false`` |
| `service.getReaction.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) |
| `service.getReaction.responseSerialize` | (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` |
| `service.getReaction.responseStream` | ``false`` |
| `service.getReactionsByCast` | { `path`: ``"/HubService/GetReactionsByCast"`` = "/HubService/GetReactionsByCast"; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByCastRequest`](protobufs_src.md#reactionsbycastrequest) ; `requestSerialize`: (`value`: [`ReactionsByCastRequest`](protobufs_src.md#reactionsbycastrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getReactionsByCast.path` | ``"/HubService/GetReactionsByCast"`` |
| `service.getReactionsByCast.requestDeserialize` | (`value`: `Buffer`) => [`ReactionsByCastRequest`](protobufs_src.md#reactionsbycastrequest) |
| `service.getReactionsByCast.requestSerialize` | (`value`: [`ReactionsByCastRequest`](protobufs_src.md#reactionsbycastrequest)) => `Buffer` |
| `service.getReactionsByCast.requestStream` | ``false`` |
| `service.getReactionsByCast.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getReactionsByCast.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getReactionsByCast.responseStream` | ``false`` |
| `service.getReactionsByFid` | { `path`: ``"/HubService/GetReactionsByFid"`` = "/HubService/GetReactionsByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByFidRequest`](protobufs_src.md#reactionsbyfidrequest) ; `requestSerialize`: (`value`: [`ReactionsByFidRequest`](protobufs_src.md#reactionsbyfidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getReactionsByFid.path` | ``"/HubService/GetReactionsByFid"`` |
| `service.getReactionsByFid.requestDeserialize` | (`value`: `Buffer`) => [`ReactionsByFidRequest`](protobufs_src.md#reactionsbyfidrequest) |
| `service.getReactionsByFid.requestSerialize` | (`value`: [`ReactionsByFidRequest`](protobufs_src.md#reactionsbyfidrequest)) => `Buffer` |
| `service.getReactionsByFid.requestStream` | ``false`` |
| `service.getReactionsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getReactionsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getReactionsByFid.responseStream` | ``false`` |
| `service.getSigner` | { `path`: ``"/HubService/GetSigner"`` = "/HubService/GetSigner"; `requestDeserialize`: (`value`: `Buffer`) => [`SignerRequest`](protobufs_src.md#signerrequest) ; `requestSerialize`: (`value`: [`SignerRequest`](protobufs_src.md#signerrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getSigner.path` | ``"/HubService/GetSigner"`` |
| `service.getSigner.requestDeserialize` | (`value`: `Buffer`) => [`SignerRequest`](protobufs_src.md#signerrequest) |
| `service.getSigner.requestSerialize` | (`value`: [`SignerRequest`](protobufs_src.md#signerrequest)) => `Buffer` |
| `service.getSigner.requestStream` | ``false`` |
| `service.getSigner.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) |
| `service.getSigner.responseSerialize` | (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` |
| `service.getSigner.responseStream` | ``false`` |
| `service.getSignersByFid` | { `path`: ``"/HubService/GetSignersByFid"`` = "/HubService/GetSignersByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getSignersByFid.path` | ``"/HubService/GetSignersByFid"`` |
| `service.getSignersByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `service.getSignersByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` |
| `service.getSignersByFid.requestStream` | ``false`` |
| `service.getSignersByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getSignersByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getSignersByFid.responseStream` | ``false`` |
| `service.getSyncMetadataByPrefix` | { `path`: ``"/HubService/GetSyncMetadataByPrefix"`` = "/HubService/GetSyncMetadataByPrefix"; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeMetadataResponse`](protobufs_src.md#trienodemetadataresponse) ; `responseSerialize`: (`value`: [`TrieNodeMetadataResponse`](protobufs_src.md#trienodemetadataresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getSyncMetadataByPrefix.path` | ``"/HubService/GetSyncMetadataByPrefix"`` |
| `service.getSyncMetadataByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) |
| `service.getSyncMetadataByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix)) => `Buffer` |
| `service.getSyncMetadataByPrefix.requestStream` | ``false`` |
| `service.getSyncMetadataByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`TrieNodeMetadataResponse`](protobufs_src.md#trienodemetadataresponse) |
| `service.getSyncMetadataByPrefix.responseSerialize` | (`value`: [`TrieNodeMetadataResponse`](protobufs_src.md#trienodemetadataresponse)) => `Buffer` |
| `service.getSyncMetadataByPrefix.responseStream` | ``false`` |
| `service.getSyncSnapshotByPrefix` | { `path`: ``"/HubService/GetSyncSnapshotByPrefix"`` = "/HubService/GetSyncSnapshotByPrefix"; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeSnapshotResponse`](protobufs_src.md#trienodesnapshotresponse) ; `responseSerialize`: (`value`: [`TrieNodeSnapshotResponse`](protobufs_src.md#trienodesnapshotresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getSyncSnapshotByPrefix.path` | ``"/HubService/GetSyncSnapshotByPrefix"`` |
| `service.getSyncSnapshotByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) |
| `service.getSyncSnapshotByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix)) => `Buffer` |
| `service.getSyncSnapshotByPrefix.requestStream` | ``false`` |
| `service.getSyncSnapshotByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`TrieNodeSnapshotResponse`](protobufs_src.md#trienodesnapshotresponse) |
| `service.getSyncSnapshotByPrefix.responseSerialize` | (`value`: [`TrieNodeSnapshotResponse`](protobufs_src.md#trienodesnapshotresponse)) => `Buffer` |
| `service.getSyncSnapshotByPrefix.responseStream` | ``false`` |
| `service.getUserData` | { `path`: ``"/HubService/GetUserData"`` = "/HubService/GetUserData"; `requestDeserialize`: (`value`: `Buffer`) => [`UserDataRequest`](protobufs_src.md#userdatarequest) ; `requestSerialize`: (`value`: [`UserDataRequest`](protobufs_src.md#userdatarequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getUserData.path` | ``"/HubService/GetUserData"`` |
| `service.getUserData.requestDeserialize` | (`value`: `Buffer`) => [`UserDataRequest`](protobufs_src.md#userdatarequest) |
| `service.getUserData.requestSerialize` | (`value`: [`UserDataRequest`](protobufs_src.md#userdatarequest)) => `Buffer` |
| `service.getUserData.requestStream` | ``false`` |
| `service.getUserData.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) |
| `service.getUserData.responseSerialize` | (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` |
| `service.getUserData.responseStream` | ``false`` |
| `service.getUserDataByFid` | { `path`: ``"/HubService/GetUserDataByFid"`` = "/HubService/GetUserDataByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getUserDataByFid.path` | ``"/HubService/GetUserDataByFid"`` |
| `service.getUserDataByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `service.getUserDataByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` |
| `service.getUserDataByFid.requestStream` | ``false`` |
| `service.getUserDataByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getUserDataByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getUserDataByFid.responseStream` | ``false`` |
| `service.getVerification` | { `path`: ``"/HubService/GetVerification"`` = "/HubService/GetVerification"; `requestDeserialize`: (`value`: `Buffer`) => [`VerificationRequest`](protobufs_src.md#verificationrequest) ; `requestSerialize`: (`value`: [`VerificationRequest`](protobufs_src.md#verificationrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getVerification.path` | ``"/HubService/GetVerification"`` |
| `service.getVerification.requestDeserialize` | (`value`: `Buffer`) => [`VerificationRequest`](protobufs_src.md#verificationrequest) |
| `service.getVerification.requestSerialize` | (`value`: [`VerificationRequest`](protobufs_src.md#verificationrequest)) => `Buffer` |
| `service.getVerification.requestStream` | ``false`` |
| `service.getVerification.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) |
| `service.getVerification.responseSerialize` | (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` |
| `service.getVerification.responseStream` | ``false`` |
| `service.getVerificationsByFid` | { `path`: ``"/HubService/GetVerificationsByFid"`` = "/HubService/GetVerificationsByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.getVerificationsByFid.path` | ``"/HubService/GetVerificationsByFid"`` |
| `service.getVerificationsByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) |
| `service.getVerificationsByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` |
| `service.getVerificationsByFid.requestStream` | ``false`` |
| `service.getVerificationsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `service.getVerificationsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` |
| `service.getVerificationsByFid.responseStream` | ``false`` |
| `service.submitIdRegistryEvent` | { `path`: ``"/HubService/SubmitIdRegistryEvent"`` = "/HubService/SubmitIdRegistryEvent"; `requestDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) ; `requestSerialize`: (`value`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.submitIdRegistryEvent.path` | ``"/HubService/SubmitIdRegistryEvent"`` |
| `service.submitIdRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) |
| `service.submitIdRegistryEvent.requestSerialize` | (`value`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent)) => `Buffer` |
| `service.submitIdRegistryEvent.requestStream` | ``false`` |
| `service.submitIdRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) |
| `service.submitIdRegistryEvent.responseSerialize` | (`value`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent)) => `Buffer` |
| `service.submitIdRegistryEvent.responseStream` | ``false`` |
| `service.submitMessage` | { `path`: ``"/HubService/SubmitMessage"`` = "/HubService/SubmitMessage"; `requestDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `requestSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.submitMessage.path` | ``"/HubService/SubmitMessage"`` |
| `service.submitMessage.requestDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) |
| `service.submitMessage.requestSerialize` | (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` |
| `service.submitMessage.requestStream` | ``false`` |
| `service.submitMessage.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) |
| `service.submitMessage.responseSerialize` | (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` |
| `service.submitMessage.responseStream` | ``false`` |
| `service.submitNameRegistryEvent` | { `path`: ``"/HubService/SubmitNameRegistryEvent"`` = "/HubService/SubmitNameRegistryEvent"; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) ; `requestSerialize`: (`value`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false`` = false } |
| `service.submitNameRegistryEvent.path` | ``"/HubService/SubmitNameRegistryEvent"`` |
| `service.submitNameRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) |
| `service.submitNameRegistryEvent.requestSerialize` | (`value`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent)) => `Buffer` |
| `service.submitNameRegistryEvent.requestStream` | ``false`` |
| `service.submitNameRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) |
| `service.submitNameRegistryEvent.responseSerialize` | (`value`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent)) => `Buffer` |
| `service.submitNameRegistryEvent.responseStream` | ``false`` |
| `service.subscribe` | { `path`: ``"/HubService/Subscribe"`` = "/HubService/Subscribe"; `requestDeserialize`: (`value`: `Buffer`) => [`SubscribeRequest`](protobufs_src.md#subscriberequest) ; `requestSerialize`: (`value`: [`SubscribeRequest`](protobufs_src.md#subscriberequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`EventResponse`](protobufs_src.md#eventresponse) ; `responseSerialize`: (`value`: [`EventResponse`](protobufs_src.md#eventresponse)) => `Buffer` ; `responseStream`: ``true`` = true } |
| `service.subscribe.path` | ``"/HubService/Subscribe"`` |
| `service.subscribe.requestDeserialize` | (`value`: `Buffer`) => [`SubscribeRequest`](protobufs_src.md#subscriberequest) |
| `service.subscribe.requestSerialize` | (`value`: [`SubscribeRequest`](protobufs_src.md#subscriberequest)) => `Buffer` |
| `service.subscribe.requestStream` | ``false`` |
| `service.subscribe.responseDeserialize` | (`value`: `Buffer`) => [`EventResponse`](protobufs_src.md#eventresponse) |
| `service.subscribe.responseSerialize` | (`value`: [`EventResponse`](protobufs_src.md#eventresponse)) => `Buffer` |
| `service.subscribe.responseStream` | ``true`` |

#### Defined in

[protobufs/src/generated/rpc.ts:1799](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L1799)

[protobufs/src/generated/rpc.ts:2295](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L2295)

___

### HubServiceService

• **HubServiceService**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `getAllAmpMessagesByFid` | { `path`: ``"/HubService/GetAllAmpMessagesByFid"`` = "/HubService/GetAllAmpMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getAllAmpMessagesByFid.path` | ``"/HubService/GetAllAmpMessagesByFid"`` | - |
| `getAllAmpMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) | - |
| `getAllAmpMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` | - |
| `getAllAmpMessagesByFid.requestStream` | ``false`` | - |
| `getAllAmpMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getAllAmpMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getAllAmpMessagesByFid.responseStream` | ``false`` | - |
| `getAllCastMessagesByFid` | { `path`: ``"/HubService/GetAllCastMessagesByFid"`` = "/HubService/GetAllCastMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | Bulk Methods |
| `getAllCastMessagesByFid.path` | ``"/HubService/GetAllCastMessagesByFid"`` | - |
| `getAllCastMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) | - |
| `getAllCastMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` | - |
| `getAllCastMessagesByFid.requestStream` | ``false`` | - |
| `getAllCastMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getAllCastMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getAllCastMessagesByFid.responseStream` | ``false`` | - |
| `getAllMessagesBySyncIds` | { `path`: ``"/HubService/GetAllMessagesBySyncIds"`` = "/HubService/GetAllMessagesBySyncIds"; `requestDeserialize`: (`value`: `Buffer`) => [`SyncIds`](protobufs_src.md#syncids) ; `requestSerialize`: (`value`: [`SyncIds`](protobufs_src.md#syncids)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getAllMessagesBySyncIds.path` | ``"/HubService/GetAllMessagesBySyncIds"`` | - |
| `getAllMessagesBySyncIds.requestDeserialize` | (`value`: `Buffer`) => [`SyncIds`](protobufs_src.md#syncids) | - |
| `getAllMessagesBySyncIds.requestSerialize` | (`value`: [`SyncIds`](protobufs_src.md#syncids)) => `Buffer` | - |
| `getAllMessagesBySyncIds.requestStream` | ``false`` | - |
| `getAllMessagesBySyncIds.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getAllMessagesBySyncIds.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getAllMessagesBySyncIds.responseStream` | ``false`` | - |
| `getAllReactionMessagesByFid` | { `path`: ``"/HubService/GetAllReactionMessagesByFid"`` = "/HubService/GetAllReactionMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getAllReactionMessagesByFid.path` | ``"/HubService/GetAllReactionMessagesByFid"`` | - |
| `getAllReactionMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) | - |
| `getAllReactionMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` | - |
| `getAllReactionMessagesByFid.requestStream` | ``false`` | - |
| `getAllReactionMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getAllReactionMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getAllReactionMessagesByFid.responseStream` | ``false`` | - |
| `getAllSignerMessagesByFid` | { `path`: ``"/HubService/GetAllSignerMessagesByFid"`` = "/HubService/GetAllSignerMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getAllSignerMessagesByFid.path` | ``"/HubService/GetAllSignerMessagesByFid"`` | - |
| `getAllSignerMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) | - |
| `getAllSignerMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` | - |
| `getAllSignerMessagesByFid.requestStream` | ``false`` | - |
| `getAllSignerMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getAllSignerMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getAllSignerMessagesByFid.responseStream` | ``false`` | - |
| `getAllSyncIdsByPrefix` | { `path`: ``"/HubService/GetAllSyncIdsByPrefix"`` = "/HubService/GetAllSyncIdsByPrefix"; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`SyncIds`](protobufs_src.md#syncids) ; `responseSerialize`: (`value`: [`SyncIds`](protobufs_src.md#syncids)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getAllSyncIdsByPrefix.path` | ``"/HubService/GetAllSyncIdsByPrefix"`` | - |
| `getAllSyncIdsByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) | - |
| `getAllSyncIdsByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix)) => `Buffer` | - |
| `getAllSyncIdsByPrefix.requestStream` | ``false`` | - |
| `getAllSyncIdsByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`SyncIds`](protobufs_src.md#syncids) | - |
| `getAllSyncIdsByPrefix.responseSerialize` | (`value`: [`SyncIds`](protobufs_src.md#syncids)) => `Buffer` | - |
| `getAllSyncIdsByPrefix.responseStream` | ``false`` | - |
| `getAllUserDataMessagesByFid` | { `path`: ``"/HubService/GetAllUserDataMessagesByFid"`` = "/HubService/GetAllUserDataMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getAllUserDataMessagesByFid.path` | ``"/HubService/GetAllUserDataMessagesByFid"`` | - |
| `getAllUserDataMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) | - |
| `getAllUserDataMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` | - |
| `getAllUserDataMessagesByFid.requestStream` | ``false`` | - |
| `getAllUserDataMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getAllUserDataMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getAllUserDataMessagesByFid.responseStream` | ``false`` | - |
| `getAllVerificationMessagesByFid` | { `path`: ``"/HubService/GetAllVerificationMessagesByFid"`` = "/HubService/GetAllVerificationMessagesByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getAllVerificationMessagesByFid.path` | ``"/HubService/GetAllVerificationMessagesByFid"`` | - |
| `getAllVerificationMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) | - |
| `getAllVerificationMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` | - |
| `getAllVerificationMessagesByFid.requestStream` | ``false`` | - |
| `getAllVerificationMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getAllVerificationMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getAllVerificationMessagesByFid.responseStream` | ``false`` | - |
| `getAmp` | { `path`: ``"/HubService/GetAmp"`` = "/HubService/GetAmp"; `requestDeserialize`: (`value`: `Buffer`) => [`AmpRequest`](protobufs_src.md#amprequest) ; `requestSerialize`: (`value`: [`AmpRequest`](protobufs_src.md#amprequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } | Amps |
| `getAmp.path` | ``"/HubService/GetAmp"`` | - |
| `getAmp.requestDeserialize` | (`value`: `Buffer`) => [`AmpRequest`](protobufs_src.md#amprequest) | - |
| `getAmp.requestSerialize` | (`value`: [`AmpRequest`](protobufs_src.md#amprequest)) => `Buffer` | - |
| `getAmp.requestStream` | ``false`` | - |
| `getAmp.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) | - |
| `getAmp.responseSerialize` | (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` | - |
| `getAmp.responseStream` | ``false`` | - |
| `getAmpsByFid` | { `path`: ``"/HubService/GetAmpsByFid"`` = "/HubService/GetAmpsByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getAmpsByFid.path` | ``"/HubService/GetAmpsByFid"`` | - |
| `getAmpsByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) | - |
| `getAmpsByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` | - |
| `getAmpsByFid.requestStream` | ``false`` | - |
| `getAmpsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getAmpsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getAmpsByFid.responseStream` | ``false`` | - |
| `getAmpsByUser` | { `path`: ``"/HubService/GetAmpsByUser"`` = "/HubService/GetAmpsByUser"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getAmpsByUser.path` | ``"/HubService/GetAmpsByUser"`` | - |
| `getAmpsByUser.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) | - |
| `getAmpsByUser.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` | - |
| `getAmpsByUser.requestStream` | ``false`` | - |
| `getAmpsByUser.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getAmpsByUser.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getAmpsByUser.responseStream` | ``false`` | - |
| `getCast` | { `path`: ``"/HubService/GetCast"`` = "/HubService/GetCast"; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](protobufs_src.md#castid) ; `requestSerialize`: (`value`: [`CastId`](protobufs_src.md#castid)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } | Casts |
| `getCast.path` | ``"/HubService/GetCast"`` | - |
| `getCast.requestDeserialize` | (`value`: `Buffer`) => [`CastId`](protobufs_src.md#castid) | - |
| `getCast.requestSerialize` | (`value`: [`CastId`](protobufs_src.md#castid)) => `Buffer` | - |
| `getCast.requestStream` | ``false`` | - |
| `getCast.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) | - |
| `getCast.responseSerialize` | (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` | - |
| `getCast.responseStream` | ``false`` | - |
| `getCastsByFid` | { `path`: ``"/HubService/GetCastsByFid"`` = "/HubService/GetCastsByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getCastsByFid.path` | ``"/HubService/GetCastsByFid"`` | - |
| `getCastsByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) | - |
| `getCastsByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` | - |
| `getCastsByFid.requestStream` | ``false`` | - |
| `getCastsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getCastsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getCastsByFid.responseStream` | ``false`` | - |
| `getCastsByMention` | { `path`: ``"/HubService/GetCastsByMention"`` = "/HubService/GetCastsByMention"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getCastsByMention.path` | ``"/HubService/GetCastsByMention"`` | - |
| `getCastsByMention.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) | - |
| `getCastsByMention.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` | - |
| `getCastsByMention.requestStream` | ``false`` | - |
| `getCastsByMention.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getCastsByMention.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getCastsByMention.responseStream` | ``false`` | - |
| `getCastsByParent` | { `path`: ``"/HubService/GetCastsByParent"`` = "/HubService/GetCastsByParent"; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](protobufs_src.md#castid) ; `requestSerialize`: (`value`: [`CastId`](protobufs_src.md#castid)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getCastsByParent.path` | ``"/HubService/GetCastsByParent"`` | - |
| `getCastsByParent.requestDeserialize` | (`value`: `Buffer`) => [`CastId`](protobufs_src.md#castid) | - |
| `getCastsByParent.requestSerialize` | (`value`: [`CastId`](protobufs_src.md#castid)) => `Buffer` | - |
| `getCastsByParent.requestStream` | ``false`` | - |
| `getCastsByParent.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getCastsByParent.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getCastsByParent.responseStream` | ``false`` | - |
| `getFids` | { `path`: ``"/HubService/GetFids"`` = "/HubService/GetFids"; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs_src.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs_src.md#empty)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`FidsResponse`](protobufs_src.md#fidsresponse) ; `responseSerialize`: (`value`: [`FidsResponse`](protobufs_src.md#fidsresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getFids.path` | ``"/HubService/GetFids"`` | - |
| `getFids.requestDeserialize` | (`value`: `Buffer`) => [`Empty`](protobufs_src.md#empty) | - |
| `getFids.requestSerialize` | (`value`: [`Empty`](protobufs_src.md#empty)) => `Buffer` | - |
| `getFids.requestStream` | ``false`` | - |
| `getFids.responseDeserialize` | (`value`: `Buffer`) => [`FidsResponse`](protobufs_src.md#fidsresponse) | - |
| `getFids.responseSerialize` | (`value`: [`FidsResponse`](protobufs_src.md#fidsresponse)) => `Buffer` | - |
| `getFids.responseStream` | ``false`` | - |
| `getIdRegistryEvent` | { `path`: ``"/HubService/GetIdRegistryEvent"`` = "/HubService/GetIdRegistryEvent"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getIdRegistryEvent.path` | ``"/HubService/GetIdRegistryEvent"`` | - |
| `getIdRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) | - |
| `getIdRegistryEvent.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` | - |
| `getIdRegistryEvent.requestStream` | ``false`` | - |
| `getIdRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) | - |
| `getIdRegistryEvent.responseSerialize` | (`value`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent)) => `Buffer` | - |
| `getIdRegistryEvent.responseStream` | ``false`` | - |
| `getInfo` | { `path`: ``"/HubService/GetInfo"`` = "/HubService/GetInfo"; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](protobufs_src.md#empty) ; `requestSerialize`: (`value`: [`Empty`](protobufs_src.md#empty)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`HubInfoResponse`](protobufs_src.md#hubinforesponse) ; `responseSerialize`: (`value`: [`HubInfoResponse`](protobufs_src.md#hubinforesponse)) => `Buffer` ; `responseStream`: ``false`` = false } | Sync Methods |
| `getInfo.path` | ``"/HubService/GetInfo"`` | - |
| `getInfo.requestDeserialize` | (`value`: `Buffer`) => [`Empty`](protobufs_src.md#empty) | - |
| `getInfo.requestSerialize` | (`value`: [`Empty`](protobufs_src.md#empty)) => `Buffer` | - |
| `getInfo.requestStream` | ``false`` | - |
| `getInfo.responseDeserialize` | (`value`: `Buffer`) => [`HubInfoResponse`](protobufs_src.md#hubinforesponse) | - |
| `getInfo.responseSerialize` | (`value`: [`HubInfoResponse`](protobufs_src.md#hubinforesponse)) => `Buffer` | - |
| `getInfo.responseStream` | ``false`` | - |
| `getNameRegistryEvent` | { `path`: ``"/HubService/GetNameRegistryEvent"`` = "/HubService/GetNameRegistryEvent"; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEventRequest`](protobufs_src.md#nameregistryeventrequest) ; `requestSerialize`: (`value`: [`NameRegistryEventRequest`](protobufs_src.md#nameregistryeventrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getNameRegistryEvent.path` | ``"/HubService/GetNameRegistryEvent"`` | - |
| `getNameRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`NameRegistryEventRequest`](protobufs_src.md#nameregistryeventrequest) | - |
| `getNameRegistryEvent.requestSerialize` | (`value`: [`NameRegistryEventRequest`](protobufs_src.md#nameregistryeventrequest)) => `Buffer` | - |
| `getNameRegistryEvent.requestStream` | ``false`` | - |
| `getNameRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) | - |
| `getNameRegistryEvent.responseSerialize` | (`value`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent)) => `Buffer` | - |
| `getNameRegistryEvent.responseStream` | ``false`` | - |
| `getReaction` | { `path`: ``"/HubService/GetReaction"`` = "/HubService/GetReaction"; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionRequest`](protobufs_src.md#reactionrequest) ; `requestSerialize`: (`value`: [`ReactionRequest`](protobufs_src.md#reactionrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } | Reactions |
| `getReaction.path` | ``"/HubService/GetReaction"`` | - |
| `getReaction.requestDeserialize` | (`value`: `Buffer`) => [`ReactionRequest`](protobufs_src.md#reactionrequest) | - |
| `getReaction.requestSerialize` | (`value`: [`ReactionRequest`](protobufs_src.md#reactionrequest)) => `Buffer` | - |
| `getReaction.requestStream` | ``false`` | - |
| `getReaction.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) | - |
| `getReaction.responseSerialize` | (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` | - |
| `getReaction.responseStream` | ``false`` | - |
| `getReactionsByCast` | { `path`: ``"/HubService/GetReactionsByCast"`` = "/HubService/GetReactionsByCast"; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByCastRequest`](protobufs_src.md#reactionsbycastrequest) ; `requestSerialize`: (`value`: [`ReactionsByCastRequest`](protobufs_src.md#reactionsbycastrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getReactionsByCast.path` | ``"/HubService/GetReactionsByCast"`` | - |
| `getReactionsByCast.requestDeserialize` | (`value`: `Buffer`) => [`ReactionsByCastRequest`](protobufs_src.md#reactionsbycastrequest) | - |
| `getReactionsByCast.requestSerialize` | (`value`: [`ReactionsByCastRequest`](protobufs_src.md#reactionsbycastrequest)) => `Buffer` | - |
| `getReactionsByCast.requestStream` | ``false`` | - |
| `getReactionsByCast.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getReactionsByCast.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getReactionsByCast.responseStream` | ``false`` | - |
| `getReactionsByFid` | { `path`: ``"/HubService/GetReactionsByFid"`` = "/HubService/GetReactionsByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByFidRequest`](protobufs_src.md#reactionsbyfidrequest) ; `requestSerialize`: (`value`: [`ReactionsByFidRequest`](protobufs_src.md#reactionsbyfidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getReactionsByFid.path` | ``"/HubService/GetReactionsByFid"`` | - |
| `getReactionsByFid.requestDeserialize` | (`value`: `Buffer`) => [`ReactionsByFidRequest`](protobufs_src.md#reactionsbyfidrequest) | - |
| `getReactionsByFid.requestSerialize` | (`value`: [`ReactionsByFidRequest`](protobufs_src.md#reactionsbyfidrequest)) => `Buffer` | - |
| `getReactionsByFid.requestStream` | ``false`` | - |
| `getReactionsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getReactionsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getReactionsByFid.responseStream` | ``false`` | - |
| `getSigner` | { `path`: ``"/HubService/GetSigner"`` = "/HubService/GetSigner"; `requestDeserialize`: (`value`: `Buffer`) => [`SignerRequest`](protobufs_src.md#signerrequest) ; `requestSerialize`: (`value`: [`SignerRequest`](protobufs_src.md#signerrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } | Signer |
| `getSigner.path` | ``"/HubService/GetSigner"`` | - |
| `getSigner.requestDeserialize` | (`value`: `Buffer`) => [`SignerRequest`](protobufs_src.md#signerrequest) | - |
| `getSigner.requestSerialize` | (`value`: [`SignerRequest`](protobufs_src.md#signerrequest)) => `Buffer` | - |
| `getSigner.requestStream` | ``false`` | - |
| `getSigner.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) | - |
| `getSigner.responseSerialize` | (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` | - |
| `getSigner.responseStream` | ``false`` | - |
| `getSignersByFid` | { `path`: ``"/HubService/GetSignersByFid"`` = "/HubService/GetSignersByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getSignersByFid.path` | ``"/HubService/GetSignersByFid"`` | - |
| `getSignersByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) | - |
| `getSignersByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` | - |
| `getSignersByFid.requestStream` | ``false`` | - |
| `getSignersByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getSignersByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getSignersByFid.responseStream` | ``false`` | - |
| `getSyncMetadataByPrefix` | { `path`: ``"/HubService/GetSyncMetadataByPrefix"`` = "/HubService/GetSyncMetadataByPrefix"; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeMetadataResponse`](protobufs_src.md#trienodemetadataresponse) ; `responseSerialize`: (`value`: [`TrieNodeMetadataResponse`](protobufs_src.md#trienodemetadataresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getSyncMetadataByPrefix.path` | ``"/HubService/GetSyncMetadataByPrefix"`` | - |
| `getSyncMetadataByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) | - |
| `getSyncMetadataByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix)) => `Buffer` | - |
| `getSyncMetadataByPrefix.requestStream` | ``false`` | - |
| `getSyncMetadataByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`TrieNodeMetadataResponse`](protobufs_src.md#trienodemetadataresponse) | - |
| `getSyncMetadataByPrefix.responseSerialize` | (`value`: [`TrieNodeMetadataResponse`](protobufs_src.md#trienodemetadataresponse)) => `Buffer` | - |
| `getSyncMetadataByPrefix.responseStream` | ``false`` | - |
| `getSyncSnapshotByPrefix` | { `path`: ``"/HubService/GetSyncSnapshotByPrefix"`` = "/HubService/GetSyncSnapshotByPrefix"; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeSnapshotResponse`](protobufs_src.md#trienodesnapshotresponse) ; `responseSerialize`: (`value`: [`TrieNodeSnapshotResponse`](protobufs_src.md#trienodesnapshotresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getSyncSnapshotByPrefix.path` | ``"/HubService/GetSyncSnapshotByPrefix"`` | - |
| `getSyncSnapshotByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) | - |
| `getSyncSnapshotByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix)) => `Buffer` | - |
| `getSyncSnapshotByPrefix.requestStream` | ``false`` | - |
| `getSyncSnapshotByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`TrieNodeSnapshotResponse`](protobufs_src.md#trienodesnapshotresponse) | - |
| `getSyncSnapshotByPrefix.responseSerialize` | (`value`: [`TrieNodeSnapshotResponse`](protobufs_src.md#trienodesnapshotresponse)) => `Buffer` | - |
| `getSyncSnapshotByPrefix.responseStream` | ``false`` | - |
| `getUserData` | { `path`: ``"/HubService/GetUserData"`` = "/HubService/GetUserData"; `requestDeserialize`: (`value`: `Buffer`) => [`UserDataRequest`](protobufs_src.md#userdatarequest) ; `requestSerialize`: (`value`: [`UserDataRequest`](protobufs_src.md#userdatarequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } | User Data |
| `getUserData.path` | ``"/HubService/GetUserData"`` | - |
| `getUserData.requestDeserialize` | (`value`: `Buffer`) => [`UserDataRequest`](protobufs_src.md#userdatarequest) | - |
| `getUserData.requestSerialize` | (`value`: [`UserDataRequest`](protobufs_src.md#userdatarequest)) => `Buffer` | - |
| `getUserData.requestStream` | ``false`` | - |
| `getUserData.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) | - |
| `getUserData.responseSerialize` | (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` | - |
| `getUserData.responseStream` | ``false`` | - |
| `getUserDataByFid` | { `path`: ``"/HubService/GetUserDataByFid"`` = "/HubService/GetUserDataByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getUserDataByFid.path` | ``"/HubService/GetUserDataByFid"`` | - |
| `getUserDataByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) | - |
| `getUserDataByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` | - |
| `getUserDataByFid.requestStream` | ``false`` | - |
| `getUserDataByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getUserDataByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getUserDataByFid.responseStream` | ``false`` | - |
| `getVerification` | { `path`: ``"/HubService/GetVerification"`` = "/HubService/GetVerification"; `requestDeserialize`: (`value`: `Buffer`) => [`VerificationRequest`](protobufs_src.md#verificationrequest) ; `requestSerialize`: (`value`: [`VerificationRequest`](protobufs_src.md#verificationrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } | Verifications |
| `getVerification.path` | ``"/HubService/GetVerification"`` | - |
| `getVerification.requestDeserialize` | (`value`: `Buffer`) => [`VerificationRequest`](protobufs_src.md#verificationrequest) | - |
| `getVerification.requestSerialize` | (`value`: [`VerificationRequest`](protobufs_src.md#verificationrequest)) => `Buffer` | - |
| `getVerification.requestStream` | ``false`` | - |
| `getVerification.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) | - |
| `getVerification.responseSerialize` | (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` | - |
| `getVerification.responseStream` | ``false`` | - |
| `getVerificationsByFid` | { `path`: ``"/HubService/GetVerificationsByFid"`` = "/HubService/GetVerificationsByFid"; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `getVerificationsByFid.path` | ``"/HubService/GetVerificationsByFid"`` | - |
| `getVerificationsByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](protobufs_src.md#fidrequest) | - |
| `getVerificationsByFid.requestSerialize` | (`value`: [`FidRequest`](protobufs_src.md#fidrequest)) => `Buffer` | - |
| `getVerificationsByFid.requestStream` | ``false`` | - |
| `getVerificationsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) | - |
| `getVerificationsByFid.responseSerialize` | (`value`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `Buffer` | - |
| `getVerificationsByFid.responseStream` | ``false`` | - |
| `submitIdRegistryEvent` | { `path`: ``"/HubService/SubmitIdRegistryEvent"`` = "/HubService/SubmitIdRegistryEvent"; `requestDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) ; `requestSerialize`: (`value`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `submitIdRegistryEvent.path` | ``"/HubService/SubmitIdRegistryEvent"`` | - |
| `submitIdRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) | - |
| `submitIdRegistryEvent.requestSerialize` | (`value`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent)) => `Buffer` | - |
| `submitIdRegistryEvent.requestStream` | ``false`` | - |
| `submitIdRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) | - |
| `submitIdRegistryEvent.responseSerialize` | (`value`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent)) => `Buffer` | - |
| `submitIdRegistryEvent.responseStream` | ``false`` | - |
| `submitMessage` | { `path`: ``"/HubService/SubmitMessage"`` = "/HubService/SubmitMessage"; `requestDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `requestSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) ; `responseSerialize`: (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` ; `responseStream`: ``false`` = false } | Submit Methods |
| `submitMessage.path` | ``"/HubService/SubmitMessage"`` | - |
| `submitMessage.requestDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) | - |
| `submitMessage.requestSerialize` | (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` | - |
| `submitMessage.requestStream` | ``false`` | - |
| `submitMessage.responseDeserialize` | (`value`: `Buffer`) => [`Message`](protobufs_src.md#message) | - |
| `submitMessage.responseSerialize` | (`value`: [`Message`](protobufs_src.md#message)) => `Buffer` | - |
| `submitMessage.responseStream` | ``false`` | - |
| `submitNameRegistryEvent` | { `path`: ``"/HubService/SubmitNameRegistryEvent"`` = "/HubService/SubmitNameRegistryEvent"; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) ; `requestSerialize`: (`value`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false`` = false } | - |
| `submitNameRegistryEvent.path` | ``"/HubService/SubmitNameRegistryEvent"`` | - |
| `submitNameRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) | - |
| `submitNameRegistryEvent.requestSerialize` | (`value`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent)) => `Buffer` | - |
| `submitNameRegistryEvent.requestStream` | ``false`` | - |
| `submitNameRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) | - |
| `submitNameRegistryEvent.responseSerialize` | (`value`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent)) => `Buffer` | - |
| `submitNameRegistryEvent.responseStream` | ``false`` | - |
| `subscribe` | { `path`: ``"/HubService/Subscribe"`` = "/HubService/Subscribe"; `requestDeserialize`: (`value`: `Buffer`) => [`SubscribeRequest`](protobufs_src.md#subscriberequest) ; `requestSerialize`: (`value`: [`SubscribeRequest`](protobufs_src.md#subscriberequest)) => `Buffer` ; `requestStream`: ``false`` = false; `responseDeserialize`: (`value`: `Buffer`) => [`EventResponse`](protobufs_src.md#eventresponse) ; `responseSerialize`: (`value`: [`EventResponse`](protobufs_src.md#eventresponse)) => `Buffer` ; `responseStream`: ``true`` = true } | Event Methods |
| `subscribe.path` | ``"/HubService/Subscribe"`` | - |
| `subscribe.requestDeserialize` | (`value`: `Buffer`) => [`SubscribeRequest`](protobufs_src.md#subscriberequest) | - |
| `subscribe.requestSerialize` | (`value`: [`SubscribeRequest`](protobufs_src.md#subscriberequest)) => `Buffer` | - |
| `subscribe.requestStream` | ``false`` | - |
| `subscribe.responseDeserialize` | (`value`: `Buffer`) => [`EventResponse`](protobufs_src.md#eventresponse) | - |
| `subscribe.responseSerialize` | (`value`: [`EventResponse`](protobufs_src.md#eventresponse)) => `Buffer` | - |
| `subscribe.responseStream` | ``true`` | - |

#### Defined in

[protobufs/src/generated/rpc.ts:1430](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L1430)

[protobufs/src/generated/rpc.ts:1431](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L1431)

___

### HubState

• **HubState**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`HubState`](protobufs_src.md#hubstate) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`HubState`](protobufs_src.md#hubstate) |
| `encode` | (`message`: [`HubState`](protobufs_src.md#hubstate), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`HubState`](protobufs_src.md#hubstate) |
| `fromPartial` | <I\>(`object`: `I`) => [`HubState`](protobufs_src.md#hubstate) |
| `toJSON` | (`message`: [`HubState`](protobufs_src.md#hubstate)) => `unknown` |

#### Defined in

[protobufs/src/generated/hub_state.ts:4](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/hub_state.ts#L4)

[protobufs/src/generated/hub_state.ts:12](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/hub_state.ts#L12)

___

### IdRegistryEvent

• **IdRegistryEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) |
| `encode` | (`message`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) |
| `fromPartial` | <I\>(`object`: `I`) => [`IdRegistryEvent`](protobufs_src.md#idregistryevent) |
| `toJSON` | (`message`: [`IdRegistryEvent`](protobufs_src.md#idregistryevent)) => `unknown` |

#### Defined in

[protobufs/src/generated/id_registry_event.ts:44](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/id_registry_event.ts#L44)

[protobufs/src/generated/id_registry_event.ts:68](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/id_registry_event.ts#L68)

___

### Message

• **Message**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`Message`](protobufs_src.md#message) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`Message`](protobufs_src.md#message) |
| `encode` | (`message`: [`Message`](protobufs_src.md#message), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`Message`](protobufs_src.md#message) |
| `fromPartial` | <I\>(`object`: `I`) => [`Message`](protobufs_src.md#message) |
| `toJSON` | (`message`: [`Message`](protobufs_src.md#message)) => `unknown` |

#### Defined in

[protobufs/src/generated/message.ts:377](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L377)

[protobufs/src/generated/message.ts:1193](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L1193)

___

### MessageData

• **MessageData**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`MessageData`](protobufs_src.md#messagedata) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`MessageData`](protobufs_src.md#messagedata) |
| `encode` | (`message`: [`MessageData`](protobufs_src.md#messagedata), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`MessageData`](protobufs_src.md#messagedata) |
| `fromPartial` | <I\>(`object`: `I`) => [`MessageData`](protobufs_src.md#messagedata) |
| `toJSON` | (`message`: [`MessageData`](protobufs_src.md#messagedata)) => `unknown` |

#### Defined in

[protobufs/src/generated/message.ts:362](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L362)

[protobufs/src/generated/message.ts:1002](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L1002)

___

### MessagesResponse

• **MessagesResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `encode` | (`message`: [`MessagesResponse`](protobufs_src.md#messagesresponse), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `fromPartial` | <I\>(`object`: `I`) => [`MessagesResponse`](protobufs_src.md#messagesresponse) |
| `toJSON` | (`message`: [`MessagesResponse`](protobufs_src.md#messagesresponse)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:141](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L141)

[protobufs/src/generated/rpc.ts:878](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L878)

___

### NameRegistryEvent

• **NameRegistryEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) |
| `encode` | (`message`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) |
| `fromPartial` | <I\>(`object`: `I`) => [`NameRegistryEvent`](protobufs_src.md#nameregistryevent) |
| `toJSON` | (`message`: [`NameRegistryEvent`](protobufs_src.md#nameregistryevent)) => `unknown` |

#### Defined in

[protobufs/src/generated/name_registry_event.ts:43](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/name_registry_event.ts#L43)

[protobufs/src/generated/name_registry_event.ts:69](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/name_registry_event.ts#L69)

___

### NameRegistryEventRequest

• **NameRegistryEventRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`NameRegistryEventRequest`](protobufs_src.md#nameregistryeventrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`NameRegistryEventRequest`](protobufs_src.md#nameregistryeventrequest) |
| `encode` | (`message`: [`NameRegistryEventRequest`](protobufs_src.md#nameregistryeventrequest), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`NameRegistryEventRequest`](protobufs_src.md#nameregistryeventrequest) |
| `fromPartial` | <I\>(`object`: `I`) => [`NameRegistryEventRequest`](protobufs_src.md#nameregistryeventrequest) |
| `toJSON` | (`message`: [`NameRegistryEventRequest`](protobufs_src.md#nameregistryeventrequest)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:171](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L171)

[protobufs/src/generated/rpc.ts:1256](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L1256)

___

### ReactionBody

• **ReactionBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`ReactionBody`](protobufs_src.md#reactionbody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`ReactionBody`](protobufs_src.md#reactionbody) |
| `encode` | (`message`: [`ReactionBody`](protobufs_src.md#reactionbody), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`ReactionBody`](protobufs_src.md#reactionbody) |
| `fromPartial` | <I\>(`object`: `I`) => [`ReactionBody`](protobufs_src.md#reactionbody) |
| `toJSON` | (`message`: [`ReactionBody`](protobufs_src.md#reactionbody)) => `unknown` |

#### Defined in

[protobufs/src/generated/message.ts:334](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L334)

[protobufs/src/generated/message.ts:629](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L629)

___

### ReactionRequest

• **ReactionRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`ReactionRequest`](protobufs_src.md#reactionrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`ReactionRequest`](protobufs_src.md#reactionrequest) |
| `encode` | (`message`: [`ReactionRequest`](protobufs_src.md#reactionrequest), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`ReactionRequest`](protobufs_src.md#reactionrequest) |
| `fromPartial` | <I\>(`object`: `I`) => [`ReactionRequest`](protobufs_src.md#reactionrequest) |
| `toJSON` | (`message`: [`ReactionRequest`](protobufs_src.md#reactionrequest)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:145](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L145)

[protobufs/src/generated/rpc.ts:933](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L933)

___

### ReactionsByCastRequest

• **ReactionsByCastRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`ReactionsByCastRequest`](protobufs_src.md#reactionsbycastrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`ReactionsByCastRequest`](protobufs_src.md#reactionsbycastrequest) |
| `encode` | (`message`: [`ReactionsByCastRequest`](protobufs_src.md#reactionsbycastrequest), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`ReactionsByCastRequest`](protobufs_src.md#reactionsbycastrequest) |
| `fromPartial` | <I\>(`object`: `I`) => [`ReactionsByCastRequest`](protobufs_src.md#reactionsbycastrequest) |
| `toJSON` | (`message`: [`ReactionsByCastRequest`](protobufs_src.md#reactionsbycastrequest)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:156](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L156)

[protobufs/src/generated/rpc.ts:1068](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L1068)

___

### ReactionsByFidRequest

• **ReactionsByFidRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`ReactionsByFidRequest`](protobufs_src.md#reactionsbyfidrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`ReactionsByFidRequest`](protobufs_src.md#reactionsbyfidrequest) |
| `encode` | (`message`: [`ReactionsByFidRequest`](protobufs_src.md#reactionsbyfidrequest), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`ReactionsByFidRequest`](protobufs_src.md#reactionsbyfidrequest) |
| `fromPartial` | <I\>(`object`: `I`) => [`ReactionsByFidRequest`](protobufs_src.md#reactionsbyfidrequest) |
| `toJSON` | (`message`: [`ReactionsByFidRequest`](protobufs_src.md#reactionsbyfidrequest)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:151](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L151)

[protobufs/src/generated/rpc.ts:1006](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L1006)

___

### RevokeSignerJobPayload

• **RevokeSignerJobPayload**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`RevokeSignerJobPayload`](protobufs_src.md#revokesignerjobpayload) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`RevokeSignerJobPayload`](protobufs_src.md#revokesignerjobpayload) |
| `encode` | (`message`: [`RevokeSignerJobPayload`](protobufs_src.md#revokesignerjobpayload), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`RevokeSignerJobPayload`](protobufs_src.md#revokesignerjobpayload) |
| `fromPartial` | <I\>(`object`: `I`) => [`RevokeSignerJobPayload`](protobufs_src.md#revokesignerjobpayload) |
| `toJSON` | (`message`: [`RevokeSignerJobPayload`](protobufs_src.md#revokesignerjobpayload)) => `unknown` |

#### Defined in

[protobufs/src/generated/job.ts:5](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/job.ts#L5)

[protobufs/src/generated/job.ts:18](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/job.ts#L18)

___

### SignerBody

• **SignerBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`SignerBody`](protobufs_src.md#signerbody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`SignerBody`](protobufs_src.md#signerbody) |
| `encode` | (`message`: [`SignerBody`](protobufs_src.md#signerbody), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`SignerBody`](protobufs_src.md#signerbody) |
| `fromPartial` | <I\>(`object`: `I`) => [`SignerBody`](protobufs_src.md#signerbody) |
| `toJSON` | (`message`: [`SignerBody`](protobufs_src.md#signerbody)) => `unknown` |

#### Defined in

[protobufs/src/generated/message.ts:353](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L353)

[protobufs/src/generated/message.ts:875](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L875)

___

### SignerRequest

• **SignerRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`SignerRequest`](protobufs_src.md#signerrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`SignerRequest`](protobufs_src.md#signerrequest) |
| `encode` | (`message`: [`SignerRequest`](protobufs_src.md#signerrequest), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`SignerRequest`](protobufs_src.md#signerrequest) |
| `fromPartial` | <I\>(`object`: `I`) => [`SignerRequest`](protobufs_src.md#signerrequest) |
| `toJSON` | (`message`: [`SignerRequest`](protobufs_src.md#signerrequest)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:180](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L180)

[protobufs/src/generated/rpc.ts:1371](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L1371)

___

### SubscribeRequest

• **SubscribeRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`SubscribeRequest`](protobufs_src.md#subscriberequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`SubscribeRequest`](protobufs_src.md#subscriberequest) |
| `encode` | (`message`: [`SubscribeRequest`](protobufs_src.md#subscriberequest), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`SubscribeRequest`](protobufs_src.md#subscriberequest) |
| `fromPartial` | <I\>(`object`: `I`) => [`SubscribeRequest`](protobufs_src.md#subscriberequest) |
| `toJSON` | (`message`: [`SubscribeRequest`](protobufs_src.md#subscriberequest)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:99](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L99)

[protobufs/src/generated/rpc.ts:338](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L338)

___

### SyncIds

• **SyncIds**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`SyncIds`](protobufs_src.md#syncids) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`SyncIds`](protobufs_src.md#syncids) |
| `encode` | (`message`: [`SyncIds`](protobufs_src.md#syncids), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`SyncIds`](protobufs_src.md#syncids) |
| `fromPartial` | <I\>(`object`: `I`) => [`SyncIds`](protobufs_src.md#syncids) |
| `toJSON` | (`message`: [`SyncIds`](protobufs_src.md#syncids)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:129](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L129)

[protobufs/src/generated/rpc.ts:708](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L708)

___

### TrieNodeMetadataResponse

• **TrieNodeMetadataResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`TrieNodeMetadataResponse`](protobufs_src.md#trienodemetadataresponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`TrieNodeMetadataResponse`](protobufs_src.md#trienodemetadataresponse) |
| `encode` | (`message`: [`TrieNodeMetadataResponse`](protobufs_src.md#trienodemetadataresponse), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`TrieNodeMetadataResponse`](protobufs_src.md#trienodemetadataresponse) |
| `fromPartial` | <I\>(`object`: `I`) => [`TrieNodeMetadataResponse`](protobufs_src.md#trienodemetadataresponse) |
| `toJSON` | (`message`: [`TrieNodeMetadataResponse`](protobufs_src.md#trienodemetadataresponse)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:111](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L111)

[protobufs/src/generated/rpc.ts:484](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L484)

___

### TrieNodePrefix

• **TrieNodePrefix**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) |
| `encode` | (`message`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) |
| `fromPartial` | <I\>(`object`: `I`) => [`TrieNodePrefix`](protobufs_src.md#trienodeprefix) |
| `toJSON` | (`message`: [`TrieNodePrefix`](protobufs_src.md#trienodeprefix)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:125](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L125)

[protobufs/src/generated/rpc.ts:656](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L656)

___

### TrieNodeSnapshotResponse

• **TrieNodeSnapshotResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`TrieNodeSnapshotResponse`](protobufs_src.md#trienodesnapshotresponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`TrieNodeSnapshotResponse`](protobufs_src.md#trienodesnapshotresponse) |
| `encode` | (`message`: [`TrieNodeSnapshotResponse`](protobufs_src.md#trienodesnapshotresponse), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`TrieNodeSnapshotResponse`](protobufs_src.md#trienodesnapshotresponse) |
| `fromPartial` | <I\>(`object`: `I`) => [`TrieNodeSnapshotResponse`](protobufs_src.md#trienodesnapshotresponse) |
| `toJSON` | (`message`: [`TrieNodeSnapshotResponse`](protobufs_src.md#trienodesnapshotresponse)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:118](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L118)

[protobufs/src/generated/rpc.ts:571](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L571)

___

### UpdateNameRegistryEventExpiryJobPayload

• **UpdateNameRegistryEventExpiryJobPayload**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`UpdateNameRegistryEventExpiryJobPayload`](protobufs_src.md#updatenameregistryeventexpiryjobpayload) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`UpdateNameRegistryEventExpiryJobPayload`](protobufs_src.md#updatenameregistryeventexpiryjobpayload) |
| `encode` | (`message`: [`UpdateNameRegistryEventExpiryJobPayload`](protobufs_src.md#updatenameregistryeventexpiryjobpayload), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`UpdateNameRegistryEventExpiryJobPayload`](protobufs_src.md#updatenameregistryeventexpiryjobpayload) |
| `fromPartial` | <I\>(`object`: `I`) => [`UpdateNameRegistryEventExpiryJobPayload`](protobufs_src.md#updatenameregistryeventexpiryjobpayload) |
| `toJSON` | (`message`: [`UpdateNameRegistryEventExpiryJobPayload`](protobufs_src.md#updatenameregistryeventexpiryjobpayload)) => `unknown` |

#### Defined in

[protobufs/src/generated/job.ts:10](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/job.ts#L10)

[protobufs/src/generated/job.ts:81](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/job.ts#L81)

___

### UserDataBody

• **UserDataBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`UserDataBody`](protobufs_src.md#userdatabody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`UserDataBody`](protobufs_src.md#userdatabody) |
| `encode` | (`message`: [`UserDataBody`](protobufs_src.md#userdatabody), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`UserDataBody`](protobufs_src.md#userdatabody) |
| `fromPartial` | <I\>(`object`: `I`) => [`UserDataBody`](protobufs_src.md#userdatabody) |
| `toJSON` | (`message`: [`UserDataBody`](protobufs_src.md#userdatabody)) => `unknown` |

#### Defined in

[protobufs/src/generated/message.ts:357](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L357)

[protobufs/src/generated/message.ts:927](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L927)

___

### UserDataRequest

• **UserDataRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`UserDataRequest`](protobufs_src.md#userdatarequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`UserDataRequest`](protobufs_src.md#userdatarequest) |
| `encode` | (`message`: [`UserDataRequest`](protobufs_src.md#userdatarequest), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`UserDataRequest`](protobufs_src.md#userdatarequest) |
| `fromPartial` | <I\>(`object`: `I`) => [`UserDataRequest`](protobufs_src.md#userdatarequest) |
| `toJSON` | (`message`: [`UserDataRequest`](protobufs_src.md#userdatarequest)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:166](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L166)

[protobufs/src/generated/rpc.ts:1194](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L1194)

___

### VerificationAddEthAddressBody

• **VerificationAddEthAddressBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`VerificationAddEthAddressBody`](protobufs_src.md#verificationaddethaddressbody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`VerificationAddEthAddressBody`](protobufs_src.md#verificationaddethaddressbody) |
| `encode` | (`message`: [`VerificationAddEthAddressBody`](protobufs_src.md#verificationaddethaddressbody), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`VerificationAddEthAddressBody`](protobufs_src.md#verificationaddethaddressbody) |
| `fromPartial` | <I\>(`object`: `I`) => [`VerificationAddEthAddressBody`](protobufs_src.md#verificationaddethaddressbody) |
| `toJSON` | (`message`: [`VerificationAddEthAddressBody`](protobufs_src.md#verificationaddethaddressbody)) => `unknown` |

#### Defined in

[protobufs/src/generated/message.ts:343](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L343)

[protobufs/src/generated/message.ts:745](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L745)

___

### VerificationRemoveBody

• **VerificationRemoveBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`VerificationRemoveBody`](protobufs_src.md#verificationremovebody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`VerificationRemoveBody`](protobufs_src.md#verificationremovebody) |
| `encode` | (`message`: [`VerificationRemoveBody`](protobufs_src.md#verificationremovebody), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`VerificationRemoveBody`](protobufs_src.md#verificationremovebody) |
| `fromPartial` | <I\>(`object`: `I`) => [`VerificationRemoveBody`](protobufs_src.md#verificationremovebody) |
| `toJSON` | (`message`: [`VerificationRemoveBody`](protobufs_src.md#verificationremovebody)) => `unknown` |

#### Defined in

[protobufs/src/generated/message.ts:349](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L349)

[protobufs/src/generated/message.ts:823](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L823)

___

### VerificationRequest

• **VerificationRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`VerificationRequest`](protobufs_src.md#verificationrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`VerificationRequest`](protobufs_src.md#verificationrequest) |
| `encode` | (`message`: [`VerificationRequest`](protobufs_src.md#verificationrequest), `writer`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`VerificationRequest`](protobufs_src.md#verificationrequest) |
| `fromPartial` | <I\>(`object`: `I`) => [`VerificationRequest`](protobufs_src.md#verificationrequest) |
| `toJSON` | (`message`: [`VerificationRequest`](protobufs_src.md#verificationrequest)) => `unknown` |

#### Defined in

[protobufs/src/generated/rpc.ts:175](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L175)

[protobufs/src/generated/rpc.ts:1308](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L1308)

## Functions

### eventTypeFromJSON

▸ **eventTypeFromJSON**(`object`): [`EventType`](../enums/protobufs_src.EventType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`EventType`](../enums/protobufs_src.EventType.md)

#### Defined in

[protobufs/src/generated/rpc.ts:41](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L41)

___

### eventTypeToJSON

▸ **eventTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`EventType`](../enums/protobufs_src.EventType.md) |

#### Returns

`string`

#### Defined in

[protobufs/src/generated/rpc.ts:68](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/rpc.ts#L68)

___

### farcasterNetworkFromJSON

▸ **farcasterNetworkFromJSON**(`object`): [`FarcasterNetwork`](../enums/protobufs_src.FarcasterNetwork.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`FarcasterNetwork`](../enums/protobufs_src.FarcasterNetwork.md)

#### Defined in

[protobufs/src/generated/message.ts:178](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L178)

___

### farcasterNetworkToJSON

▸ **farcasterNetworkToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`FarcasterNetwork`](../enums/protobufs_src.FarcasterNetwork.md) |

#### Returns

`string`

#### Defined in

[protobufs/src/generated/message.ts:199](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L199)

___

### getClient

▸ **getClient**(`address`): [`HubServiceClient`](protobufs_src.md#hubserviceclient)

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Returns

[`HubServiceClient`](protobufs_src.md#hubserviceclient)

#### Defined in

[protobufs/src/index.ts:23](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/index.ts#L23)

___

### getServer

▸ **getServer**(): `Server`

#### Returns

`Server`

#### Defined in

[protobufs/src/index.ts:17](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/index.ts#L17)

___

### gossipVersionFromJSON

▸ **gossipVersionFromJSON**(`object`): [`GossipVersion`](../enums/protobufs_src.GossipVersion.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`GossipVersion`](../enums/protobufs_src.GossipVersion.md)

#### Defined in

[protobufs/src/generated/gossip.ts:11](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/gossip.ts#L11)

___

### gossipVersionToJSON

▸ **gossipVersionToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`GossipVersion`](../enums/protobufs_src.GossipVersion.md) |

#### Returns

`string`

#### Defined in

[protobufs/src/generated/gossip.ts:23](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/gossip.ts#L23)

___

### hashSchemeFromJSON

▸ **hashSchemeFromJSON**(`object`): [`HashScheme`](../enums/protobufs_src.HashScheme.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`HashScheme`](../enums/protobufs_src.HashScheme.md)

#### Defined in

[protobufs/src/generated/message.ts:143](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L143)

___

### hashSchemeToJSON

▸ **hashSchemeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`HashScheme`](../enums/protobufs_src.HashScheme.md) |

#### Returns

`string`

#### Defined in

[protobufs/src/generated/message.ts:158](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L158)

___

### idRegistryEventTypeFromJSON

▸ **idRegistryEventTypeFromJSON**(`object`): [`IdRegistryEventType`](../enums/protobufs_src.IdRegistryEventType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`IdRegistryEventType`](../enums/protobufs_src.IdRegistryEventType.md)

#### Defined in

[protobufs/src/generated/id_registry_event.ts:12](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/id_registry_event.ts#L12)

___

### idRegistryEventTypeToJSON

▸ **idRegistryEventTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`IdRegistryEventType`](../enums/protobufs_src.IdRegistryEventType.md) |

#### Returns

`string`

#### Defined in

[protobufs/src/generated/id_registry_event.ts:30](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/id_registry_event.ts#L30)

___

### isAmpAddData

▸ **isAmpAddData**(`data`): data is AmpAddData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs_src.md#messagedata) |

#### Returns

data is AmpAddData

#### Defined in

[protobufs/src/typeguards.ts:28](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L28)

___

### isAmpAddMessage

▸ **isAmpAddMessage**(`message`): message is AmpAddMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs_src.md#message) |

#### Returns

message is AmpAddMessage

#### Defined in

[protobufs/src/typeguards.ts:32](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L32)

___

### isAmpRemoveData

▸ **isAmpRemoveData**(`data`): data is AmpRemoveData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs_src.md#messagedata) |

#### Returns

data is AmpRemoveData

#### Defined in

[protobufs/src/typeguards.ts:40](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L40)

___

### isAmpRemoveMessage

▸ **isAmpRemoveMessage**(`message`): message is AmpRemoveMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs_src.md#message) |

#### Returns

message is AmpRemoveMessage

#### Defined in

[protobufs/src/typeguards.ts:44](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L44)

___

### isCastAddData

▸ **isCastAddData**(`data`): data is CastAddData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs_src.md#messagedata) |

#### Returns

data is CastAddData

#### Defined in

[protobufs/src/typeguards.ts:4](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L4)

___

### isCastAddMessage

▸ **isCastAddMessage**(`message`): message is CastAddMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs_src.md#message) |

#### Returns

message is CastAddMessage

#### Defined in

[protobufs/src/typeguards.ts:8](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L8)

___

### isCastRemoveData

▸ **isCastRemoveData**(`data`): data is CastRemoveData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs_src.md#messagedata) |

#### Returns

data is CastRemoveData

#### Defined in

[protobufs/src/typeguards.ts:16](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L16)

___

### isCastRemoveMessage

▸ **isCastRemoveMessage**(`message`): message is CastRemoveMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs_src.md#message) |

#### Returns

message is CastRemoveMessage

#### Defined in

[protobufs/src/typeguards.ts:20](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L20)

___

### isReactionAddData

▸ **isReactionAddData**(`data`): data is ReactionAddData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs_src.md#messagedata) |

#### Returns

data is ReactionAddData

#### Defined in

[protobufs/src/typeguards.ts:52](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L52)

___

### isReactionAddMessage

▸ **isReactionAddMessage**(`message`): message is ReactionAddMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs_src.md#message) |

#### Returns

message is ReactionAddMessage

#### Defined in

[protobufs/src/typeguards.ts:56](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L56)

___

### isReactionRemoveData

▸ **isReactionRemoveData**(`data`): data is ReactionRemoveData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs_src.md#messagedata) |

#### Returns

data is ReactionRemoveData

#### Defined in

[protobufs/src/typeguards.ts:64](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L64)

___

### isReactionRemoveMessage

▸ **isReactionRemoveMessage**(`message`): message is ReactionRemoveMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs_src.md#message) |

#### Returns

message is ReactionRemoveMessage

#### Defined in

[protobufs/src/typeguards.ts:68](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L68)

___

### isSignerAddData

▸ **isSignerAddData**(`data`): data is SignerAddData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs_src.md#messagedata) |

#### Returns

data is SignerAddData

#### Defined in

[protobufs/src/typeguards.ts:110](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L110)

___

### isSignerAddMessage

▸ **isSignerAddMessage**(`message`): message is SignerAddMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs_src.md#message) |

#### Returns

message is SignerAddMessage

#### Defined in

[protobufs/src/typeguards.ts:114](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L114)

___

### isSignerRemoveData

▸ **isSignerRemoveData**(`data`): data is SignerRemoveData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs_src.md#messagedata) |

#### Returns

data is SignerRemoveData

#### Defined in

[protobufs/src/typeguards.ts:122](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L122)

___

### isSignerRemoveMessage

▸ **isSignerRemoveMessage**(`message`): message is SignerRemoveMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs_src.md#message) |

#### Returns

message is SignerRemoveMessage

#### Defined in

[protobufs/src/typeguards.ts:126](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L126)

___

### isUserDataAddData

▸ **isUserDataAddData**(`data`): data is UserDataAddData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs_src.md#messagedata) |

#### Returns

data is UserDataAddData

#### Defined in

[protobufs/src/typeguards.ts:134](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L134)

___

### isUserDataAddMessage

▸ **isUserDataAddMessage**(`message`): message is UserDataAddMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs_src.md#message) |

#### Returns

message is UserDataAddMessage

#### Defined in

[protobufs/src/typeguards.ts:138](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L138)

___

### isVerificationAddEthAddressData

▸ **isVerificationAddEthAddressData**(`data`): data is VerificationAddEthAddressData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs_src.md#messagedata) |

#### Returns

data is VerificationAddEthAddressData

#### Defined in

[protobufs/src/typeguards.ts:76](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L76)

___

### isVerificationAddEthAddressMessage

▸ **isVerificationAddEthAddressMessage**(`message`): message is VerificationAddEthAddressMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs_src.md#message) |

#### Returns

message is VerificationAddEthAddressMessage

#### Defined in

[protobufs/src/typeguards.ts:85](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L85)

___

### isVerificationRemoveData

▸ **isVerificationRemoveData**(`data`): data is VerificationRemoveData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](protobufs_src.md#messagedata) |

#### Returns

data is VerificationRemoveData

#### Defined in

[protobufs/src/typeguards.ts:95](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L95)

___

### isVerificationRemoveMessage

▸ **isVerificationRemoveMessage**(`message`): message is VerificationRemoveMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](protobufs_src.md#message) |

#### Returns

message is VerificationRemoveMessage

#### Defined in

[protobufs/src/typeguards.ts:102](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/typeguards.ts#L102)

___

### messageTypeFromJSON

▸ **messageTypeFromJSON**(`object`): [`MessageType`](../enums/protobufs_src.MessageType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`MessageType`](../enums/protobufs_src.MessageType.md)

#### Defined in

[protobufs/src/generated/message.ts:21](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L21)

___

### messageTypeToJSON

▸ **messageTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`MessageType`](../enums/protobufs_src.MessageType.md) |

#### Returns

`string`

#### Defined in

[protobufs/src/generated/message.ts:66](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L66)

___

### nameRegistryEventTypeFromJSON

▸ **nameRegistryEventTypeFromJSON**(`object`): [`NameRegistryEventType`](../enums/protobufs_src.NameRegistryEventType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`NameRegistryEventType`](../enums/protobufs_src.NameRegistryEventType.md)

#### Defined in

[protobufs/src/generated/name_registry_event.ts:11](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/name_registry_event.ts#L11)

___

### nameRegistryEventTypeToJSON

▸ **nameRegistryEventTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`NameRegistryEventType`](../enums/protobufs_src.NameRegistryEventType.md) |

#### Returns

`string`

#### Defined in

[protobufs/src/generated/name_registry_event.ts:29](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/name_registry_event.ts#L29)

___

### reactionTypeFromJSON

▸ **reactionTypeFromJSON**(`object`): [`ReactionType`](../enums/protobufs_src.ReactionType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`ReactionType`](../enums/protobufs_src.ReactionType.md)

#### Defined in

[protobufs/src/generated/message.ts:222](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L222)

___

### reactionTypeToJSON

▸ **reactionTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`ReactionType`](../enums/protobufs_src.ReactionType.md) |

#### Returns

`string`

#### Defined in

[protobufs/src/generated/message.ts:240](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L240)

___

### signatureSchemeFromJSON

▸ **signatureSchemeFromJSON**(`object`): [`SignatureScheme`](../enums/protobufs_src.SignatureScheme.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`SignatureScheme`](../enums/protobufs_src.SignatureScheme.md)

#### Defined in

[protobufs/src/generated/message.ts:105](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L105)

___

### signatureSchemeToJSON

▸ **signatureSchemeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`SignatureScheme`](../enums/protobufs_src.SignatureScheme.md) |

#### Returns

`string`

#### Defined in

[protobufs/src/generated/message.ts:123](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L123)

___

### userDataTypeFromJSON

▸ **userDataTypeFromJSON**(`object`): [`UserDataType`](../enums/protobufs_src.UserDataType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`UserDataType`](../enums/protobufs_src.UserDataType.md)

#### Defined in

[protobufs/src/generated/message.ts:265](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L265)

___

### userDataTypeToJSON

▸ **userDataTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`UserDataType`](../enums/protobufs_src.UserDataType.md) |

#### Returns

`string`

#### Defined in

[protobufs/src/generated/message.ts:295](https://github.com/vinliao/hubble/blob/4e20c6c/packages/protobufs/src/generated/message.ts#L295)
