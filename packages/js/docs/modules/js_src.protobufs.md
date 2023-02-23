[hubble](../README.md) / [Modules](../modules.md) / [js/src](js_src.md) / protobufs

# Namespace: protobufs

[js/src](js_src.md).protobufs

## Table of contents

### Enumerations

- [EventType](../enums/js_src.protobufs.EventType.md)
- [FarcasterNetwork](../enums/js_src.protobufs.FarcasterNetwork.md)
- [GossipVersion](../enums/js_src.protobufs.GossipVersion.md)
- [HashScheme](../enums/js_src.protobufs.HashScheme.md)
- [IdRegistryEventType](../enums/js_src.protobufs.IdRegistryEventType.md)
- [MessageType](../enums/js_src.protobufs.MessageType.md)
- [NameRegistryEventType](../enums/js_src.protobufs.NameRegistryEventType.md)
- [ReactionType](../enums/js_src.protobufs.ReactionType.md)
- [SignatureScheme](../enums/js_src.protobufs.SignatureScheme.md)
- [UserDataType](../enums/js_src.protobufs.UserDataType.md)

### Interfaces

- [AmpBody](../interfaces/js_src.protobufs.AmpBody.md)
- [AmpRequest](../interfaces/js_src.protobufs.AmpRequest.md)
- [CastAddBody](../interfaces/js_src.protobufs.CastAddBody.md)
- [CastId](../interfaces/js_src.protobufs.CastId.md)
- [CastRemoveBody](../interfaces/js_src.protobufs.CastRemoveBody.md)
- [ContactInfoContent](../interfaces/js_src.protobufs.ContactInfoContent.md)
- [DbTrieNode](../interfaces/js_src.protobufs.DbTrieNode.md)
- [Empty](../interfaces/js_src.protobufs.Empty.md)
- [EventResponse](../interfaces/js_src.protobufs.EventResponse.md)
- [FidRequest](../interfaces/js_src.protobufs.FidRequest.md)
- [FidsResponse](../interfaces/js_src.protobufs.FidsResponse.md)
- [GossipAddressInfo](../interfaces/js_src.protobufs.GossipAddressInfo.md)
- [GossipMessage](../interfaces/js_src.protobufs.GossipMessage.md)
- [HubInfoResponse](../interfaces/js_src.protobufs.HubInfoResponse.md)
- [HubServiceClient](../interfaces/js_src.protobufs.HubServiceClient.md)
- [HubServiceServer](../interfaces/js_src.protobufs.HubServiceServer.md)
- [HubState](../interfaces/js_src.protobufs.HubState.md)
- [IdRegistryEvent](../interfaces/js_src.protobufs.IdRegistryEvent.md)
- [Message](../interfaces/js_src.protobufs.Message.md)
- [MessageData](../interfaces/js_src.protobufs.MessageData.md)
- [MessagesResponse](../interfaces/js_src.protobufs.MessagesResponse.md)
- [NameRegistryEvent](../interfaces/js_src.protobufs.NameRegistryEvent.md)
- [NameRegistryEventRequest](../interfaces/js_src.protobufs.NameRegistryEventRequest.md)
- [ReactionBody](../interfaces/js_src.protobufs.ReactionBody.md)
- [ReactionRequest](../interfaces/js_src.protobufs.ReactionRequest.md)
- [ReactionsByCastRequest](../interfaces/js_src.protobufs.ReactionsByCastRequest.md)
- [ReactionsByFidRequest](../interfaces/js_src.protobufs.ReactionsByFidRequest.md)
- [RevokeSignerJobPayload](../interfaces/js_src.protobufs.RevokeSignerJobPayload.md)
- [SignerBody](../interfaces/js_src.protobufs.SignerBody.md)
- [SignerRequest](../interfaces/js_src.protobufs.SignerRequest.md)
- [SubscribeRequest](../interfaces/js_src.protobufs.SubscribeRequest.md)
- [SyncIds](../interfaces/js_src.protobufs.SyncIds.md)
- [TrieNodeMetadataResponse](../interfaces/js_src.protobufs.TrieNodeMetadataResponse.md)
- [TrieNodePrefix](../interfaces/js_src.protobufs.TrieNodePrefix.md)
- [TrieNodeSnapshotResponse](../interfaces/js_src.protobufs.TrieNodeSnapshotResponse.md)
- [UpdateNameRegistryEventExpiryJobPayload](../interfaces/js_src.protobufs.UpdateNameRegistryEventExpiryJobPayload.md)
- [UserDataBody](../interfaces/js_src.protobufs.UserDataBody.md)
- [UserDataRequest](../interfaces/js_src.protobufs.UserDataRequest.md)
- [VerificationAddEthAddressBody](../interfaces/js_src.protobufs.VerificationAddEthAddressBody.md)
- [VerificationRemoveBody](../interfaces/js_src.protobufs.VerificationRemoveBody.md)
- [VerificationRequest](../interfaces/js_src.protobufs.VerificationRequest.md)

### Type Aliases

- [AmpAddData](js_src.protobufs.md#ampadddata)
- [AmpAddMessage](js_src.protobufs.md#ampaddmessage)
- [AmpRemoveData](js_src.protobufs.md#ampremovedata)
- [AmpRemoveMessage](js_src.protobufs.md#ampremovemessage)
- [CastAddData](js_src.protobufs.md#castadddata)
- [CastAddMessage](js_src.protobufs.md#castaddmessage)
- [CastRemoveData](js_src.protobufs.md#castremovedata)
- [CastRemoveMessage](js_src.protobufs.md#castremovemessage)
- [HubServiceService](js_src.protobufs.md#hubserviceservice)
- [ReactionAddData](js_src.protobufs.md#reactionadddata)
- [ReactionAddMessage](js_src.protobufs.md#reactionaddmessage)
- [ReactionRemoveData](js_src.protobufs.md#reactionremovedata)
- [ReactionRemoveMessage](js_src.protobufs.md#reactionremovemessage)
- [SignerAddData](js_src.protobufs.md#signeradddata)
- [SignerAddMessage](js_src.protobufs.md#signeraddmessage)
- [SignerRemoveData](js_src.protobufs.md#signerremovedata)
- [SignerRemoveMessage](js_src.protobufs.md#signerremovemessage)
- [UserDataAddData](js_src.protobufs.md#userdataadddata)
- [UserDataAddMessage](js_src.protobufs.md#userdataaddmessage)
- [VerificationAddEthAddressData](js_src.protobufs.md#verificationaddethaddressdata)
- [VerificationAddEthAddressMessage](js_src.protobufs.md#verificationaddethaddressmessage)
- [VerificationRemoveData](js_src.protobufs.md#verificationremovedata)
- [VerificationRemoveMessage](js_src.protobufs.md#verificationremovemessage)

### Variables

- [AmpBody](js_src.protobufs.md#ampbody)
- [AmpRequest](js_src.protobufs.md#amprequest)
- [CastAddBody](js_src.protobufs.md#castaddbody)
- [CastId](js_src.protobufs.md#castid)
- [CastRemoveBody](js_src.protobufs.md#castremovebody)
- [ContactInfoContent](js_src.protobufs.md#contactinfocontent)
- [DbTrieNode](js_src.protobufs.md#dbtrienode)
- [Empty](js_src.protobufs.md#empty)
- [EventResponse](js_src.protobufs.md#eventresponse)
- [FidRequest](js_src.protobufs.md#fidrequest)
- [FidsResponse](js_src.protobufs.md#fidsresponse)
- [GossipAddressInfo](js_src.protobufs.md#gossipaddressinfo)
- [GossipMessage](js_src.protobufs.md#gossipmessage)
- [HubInfoResponse](js_src.protobufs.md#hubinforesponse)
- [HubServiceClient](js_src.protobufs.md#hubserviceclient)
- [HubServiceService](js_src.protobufs.md#hubserviceservice-1)
- [HubState](js_src.protobufs.md#hubstate)
- [IdRegistryEvent](js_src.protobufs.md#idregistryevent)
- [Message](js_src.protobufs.md#message)
- [MessageData](js_src.protobufs.md#messagedata)
- [MessagesResponse](js_src.protobufs.md#messagesresponse)
- [NameRegistryEvent](js_src.protobufs.md#nameregistryevent)
- [NameRegistryEventRequest](js_src.protobufs.md#nameregistryeventrequest)
- [ReactionBody](js_src.protobufs.md#reactionbody)
- [ReactionRequest](js_src.protobufs.md#reactionrequest)
- [ReactionsByCastRequest](js_src.protobufs.md#reactionsbycastrequest)
- [ReactionsByFidRequest](js_src.protobufs.md#reactionsbyfidrequest)
- [RevokeSignerJobPayload](js_src.protobufs.md#revokesignerjobpayload)
- [SignerBody](js_src.protobufs.md#signerbody)
- [SignerRequest](js_src.protobufs.md#signerrequest)
- [SubscribeRequest](js_src.protobufs.md#subscriberequest)
- [SyncIds](js_src.protobufs.md#syncids)
- [TrieNodeMetadataResponse](js_src.protobufs.md#trienodemetadataresponse)
- [TrieNodePrefix](js_src.protobufs.md#trienodeprefix)
- [TrieNodeSnapshotResponse](js_src.protobufs.md#trienodesnapshotresponse)
- [UpdateNameRegistryEventExpiryJobPayload](js_src.protobufs.md#updatenameregistryeventexpiryjobpayload)
- [UserDataBody](js_src.protobufs.md#userdatabody)
- [UserDataRequest](js_src.protobufs.md#userdatarequest)
- [VerificationAddEthAddressBody](js_src.protobufs.md#verificationaddethaddressbody)
- [VerificationRemoveBody](js_src.protobufs.md#verificationremovebody)
- [VerificationRequest](js_src.protobufs.md#verificationrequest)

### Functions

- [eventTypeFromJSON](js_src.protobufs.md#eventtypefromjson)
- [eventTypeToJSON](js_src.protobufs.md#eventtypetojson)
- [farcasterNetworkFromJSON](js_src.protobufs.md#farcasternetworkfromjson)
- [farcasterNetworkToJSON](js_src.protobufs.md#farcasternetworktojson)
- [getClient](js_src.protobufs.md#getclient)
- [getServer](js_src.protobufs.md#getserver)
- [gossipVersionFromJSON](js_src.protobufs.md#gossipversionfromjson)
- [gossipVersionToJSON](js_src.protobufs.md#gossipversiontojson)
- [hashSchemeFromJSON](js_src.protobufs.md#hashschemefromjson)
- [hashSchemeToJSON](js_src.protobufs.md#hashschemetojson)
- [idRegistryEventTypeFromJSON](js_src.protobufs.md#idregistryeventtypefromjson)
- [idRegistryEventTypeToJSON](js_src.protobufs.md#idregistryeventtypetojson)
- [isAmpAddData](js_src.protobufs.md#isampadddata)
- [isAmpAddMessage](js_src.protobufs.md#isampaddmessage)
- [isAmpRemoveData](js_src.protobufs.md#isampremovedata)
- [isAmpRemoveMessage](js_src.protobufs.md#isampremovemessage)
- [isCastAddData](js_src.protobufs.md#iscastadddata)
- [isCastAddMessage](js_src.protobufs.md#iscastaddmessage)
- [isCastRemoveData](js_src.protobufs.md#iscastremovedata)
- [isCastRemoveMessage](js_src.protobufs.md#iscastremovemessage)
- [isReactionAddData](js_src.protobufs.md#isreactionadddata)
- [isReactionAddMessage](js_src.protobufs.md#isreactionaddmessage)
- [isReactionRemoveData](js_src.protobufs.md#isreactionremovedata)
- [isReactionRemoveMessage](js_src.protobufs.md#isreactionremovemessage)
- [isSignerAddData](js_src.protobufs.md#issigneradddata)
- [isSignerAddMessage](js_src.protobufs.md#issigneraddmessage)
- [isSignerRemoveData](js_src.protobufs.md#issignerremovedata)
- [isSignerRemoveMessage](js_src.protobufs.md#issignerremovemessage)
- [isUserDataAddData](js_src.protobufs.md#isuserdataadddata)
- [isUserDataAddMessage](js_src.protobufs.md#isuserdataaddmessage)
- [isVerificationAddEthAddressData](js_src.protobufs.md#isverificationaddethaddressdata)
- [isVerificationAddEthAddressMessage](js_src.protobufs.md#isverificationaddethaddressmessage)
- [isVerificationRemoveData](js_src.protobufs.md#isverificationremovedata)
- [isVerificationRemoveMessage](js_src.protobufs.md#isverificationremovemessage)
- [messageTypeFromJSON](js_src.protobufs.md#messagetypefromjson)
- [messageTypeToJSON](js_src.protobufs.md#messagetypetojson)
- [nameRegistryEventTypeFromJSON](js_src.protobufs.md#nameregistryeventtypefromjson)
- [nameRegistryEventTypeToJSON](js_src.protobufs.md#nameregistryeventtypetojson)
- [reactionTypeFromJSON](js_src.protobufs.md#reactiontypefromjson)
- [reactionTypeToJSON](js_src.protobufs.md#reactiontypetojson)
- [signatureSchemeFromJSON](js_src.protobufs.md#signatureschemefromjson)
- [signatureSchemeToJSON](js_src.protobufs.md#signatureschemetojson)
- [userDataTypeFromJSON](js_src.protobufs.md#userdatatypefromjson)
- [userDataTypeToJSON](js_src.protobufs.md#userdatatypetojson)

## Type Aliases

### AmpAddData

Ƭ **AmpAddData**: [`MessageData`](js_src.protobufs.md#messagedata) & { `ampBody`: [`AmpBody`](js_src.protobufs.md#ampbody) ; `type`: [`MESSAGE_TYPE_AMP_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_amp_add)  }

#### Defined in

protobufs/dist/index.d.ts:5076

___

### AmpAddMessage

Ƭ **AmpAddMessage**: [`Message`](js_src.protobufs.md#message) & { `data`: [`AmpAddData`](js_src.protobufs.md#ampadddata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/js_src.protobufs.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

protobufs/dist/index.d.ts:5080

___

### AmpRemoveData

Ƭ **AmpRemoveData**: [`MessageData`](js_src.protobufs.md#messagedata) & { `ampBody`: [`AmpBody`](js_src.protobufs.md#ampbody) ; `type`: [`MESSAGE_TYPE_AMP_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_amp_remove)  }

#### Defined in

protobufs/dist/index.d.ts:5084

___

### AmpRemoveMessage

Ƭ **AmpRemoveMessage**: [`Message`](js_src.protobufs.md#message) & { `data`: [`AmpRemoveData`](js_src.protobufs.md#ampremovedata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/js_src.protobufs.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

protobufs/dist/index.d.ts:5088

___

### CastAddData

Ƭ **CastAddData**: [`MessageData`](js_src.protobufs.md#messagedata) & { `castAddBody`: [`CastAddBody`](js_src.protobufs.md#castaddbody) ; `type`: [`MESSAGE_TYPE_CAST_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_cast_add)  }

#### Defined in

protobufs/dist/index.d.ts:5044

___

### CastAddMessage

Ƭ **CastAddMessage**: [`Message`](js_src.protobufs.md#message) & { `data`: [`CastAddData`](js_src.protobufs.md#castadddata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/js_src.protobufs.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

protobufs/dist/index.d.ts:5048

___

### CastRemoveData

Ƭ **CastRemoveData**: [`MessageData`](js_src.protobufs.md#messagedata) & { `castRemoveBody`: [`CastRemoveBody`](js_src.protobufs.md#castremovebody) ; `type`: [`MESSAGE_TYPE_CAST_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_cast_remove)  }

#### Defined in

protobufs/dist/index.d.ts:5052

___

### CastRemoveMessage

Ƭ **CastRemoveMessage**: [`Message`](js_src.protobufs.md#message) & { `data`: [`CastRemoveData`](js_src.protobufs.md#castremovedata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/js_src.protobufs.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

protobufs/dist/index.d.ts:5056

___

### HubServiceService

Ƭ **HubServiceService**: typeof [`HubServiceService`](js_src.protobufs.md#hubserviceservice-1)

#### Defined in

protobufs/dist/index.d.ts:3694

protobufs/dist/index.d.ts:3695

___

### ReactionAddData

Ƭ **ReactionAddData**: [`MessageData`](js_src.protobufs.md#messagedata) & { `reactionBody`: [`ReactionBody`](js_src.protobufs.md#reactionbody) ; `type`: [`MESSAGE_TYPE_REACTION_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_reaction_add)  }

#### Defined in

protobufs/dist/index.d.ts:5060

___

### ReactionAddMessage

Ƭ **ReactionAddMessage**: [`Message`](js_src.protobufs.md#message) & { `data`: [`ReactionAddData`](js_src.protobufs.md#reactionadddata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/js_src.protobufs.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

protobufs/dist/index.d.ts:5064

___

### ReactionRemoveData

Ƭ **ReactionRemoveData**: [`MessageData`](js_src.protobufs.md#messagedata) & { `reactionBody`: [`ReactionBody`](js_src.protobufs.md#reactionbody) ; `type`: [`MESSAGE_TYPE_REACTION_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_reaction_remove)  }

#### Defined in

protobufs/dist/index.d.ts:5068

___

### ReactionRemoveMessage

Ƭ **ReactionRemoveMessage**: [`Message`](js_src.protobufs.md#message) & { `data`: [`ReactionRemoveData`](js_src.protobufs.md#reactionremovedata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/js_src.protobufs.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

protobufs/dist/index.d.ts:5072

___

### SignerAddData

Ƭ **SignerAddData**: [`MessageData`](js_src.protobufs.md#messagedata) & { `signerBody`: [`SignerBody`](js_src.protobufs.md#signerbody) ; `type`: [`MESSAGE_TYPE_SIGNER_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_signer_add)  }

#### Defined in

protobufs/dist/index.d.ts:5108

___

### SignerAddMessage

Ƭ **SignerAddMessage**: [`Message`](js_src.protobufs.md#message) & { `data`: [`SignerAddData`](js_src.protobufs.md#signeradddata) ; `signatureScheme`: [`SIGNATURE_SCHEME_EIP712`](../enums/js_src.protobufs.SignatureScheme.md#signature_scheme_eip712)  }

#### Defined in

protobufs/dist/index.d.ts:5112

___

### SignerRemoveData

Ƭ **SignerRemoveData**: [`MessageData`](js_src.protobufs.md#messagedata) & { `signerBody`: [`SignerBody`](js_src.protobufs.md#signerbody) ; `type`: [`MESSAGE_TYPE_SIGNER_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_signer_remove)  }

#### Defined in

protobufs/dist/index.d.ts:5116

___

### SignerRemoveMessage

Ƭ **SignerRemoveMessage**: [`Message`](js_src.protobufs.md#message) & { `data`: [`SignerRemoveData`](js_src.protobufs.md#signerremovedata) ; `signatureScheme`: [`SIGNATURE_SCHEME_EIP712`](../enums/js_src.protobufs.SignatureScheme.md#signature_scheme_eip712)  }

#### Defined in

protobufs/dist/index.d.ts:5120

___

### UserDataAddData

Ƭ **UserDataAddData**: [`MessageData`](js_src.protobufs.md#messagedata) & { `type`: [`MESSAGE_TYPE_USER_DATA_ADD`](../enums/js_src.protobufs.MessageType.md#message_type_user_data_add) ; `userDataBody`: [`UserDataBody`](js_src.protobufs.md#userdatabody)  }

#### Defined in

protobufs/dist/index.d.ts:5124

___

### UserDataAddMessage

Ƭ **UserDataAddMessage**: [`Message`](js_src.protobufs.md#message) & { `data`: [`UserDataAddData`](js_src.protobufs.md#userdataadddata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/js_src.protobufs.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

protobufs/dist/index.d.ts:5128

___

### VerificationAddEthAddressData

Ƭ **VerificationAddEthAddressData**: [`MessageData`](js_src.protobufs.md#messagedata) & { `type`: [`MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS`](../enums/js_src.protobufs.MessageType.md#message_type_verification_add_eth_address) ; `verificationAddEthAddressBody`: [`VerificationAddEthAddressBody`](js_src.protobufs.md#verificationaddethaddressbody)  }

#### Defined in

protobufs/dist/index.d.ts:5092

___

### VerificationAddEthAddressMessage

Ƭ **VerificationAddEthAddressMessage**: [`Message`](js_src.protobufs.md#message) & { `data`: [`VerificationAddEthAddressData`](js_src.protobufs.md#verificationaddethaddressdata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/js_src.protobufs.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

protobufs/dist/index.d.ts:5096

___

### VerificationRemoveData

Ƭ **VerificationRemoveData**: [`MessageData`](js_src.protobufs.md#messagedata) & { `type`: [`MESSAGE_TYPE_VERIFICATION_REMOVE`](../enums/js_src.protobufs.MessageType.md#message_type_verification_remove) ; `verificationRemoveBody`: [`VerificationRemoveBody`](js_src.protobufs.md#verificationremovebody)  }

#### Defined in

protobufs/dist/index.d.ts:5100

___

### VerificationRemoveMessage

Ƭ **VerificationRemoveMessage**: [`Message`](js_src.protobufs.md#message) & { `data`: [`VerificationRemoveData`](js_src.protobufs.md#verificationremovedata) ; `signatureScheme`: [`SIGNATURE_SCHEME_ED25519`](../enums/js_src.protobufs.SignatureScheme.md#signature_scheme_ed25519)  }

#### Defined in

protobufs/dist/index.d.ts:5104

## Variables

### AmpBody

• **AmpBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`AmpBody`](js_src.protobufs.md#ampbody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`AmpBody`](js_src.protobufs.md#ampbody) |
| `encode` | (`message`: [`AmpBody`](js_src.protobufs.md#ampbody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`AmpBody`](js_src.protobufs.md#ampbody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`AmpBody`](js_src.protobufs.md#ampbody) |
| `toJSON` | (`message`: [`AmpBody`](js_src.protobufs.md#ampbody)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:340

protobufs/dist/index.d.ts:343

___

### AmpRequest

• **AmpRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`AmpRequest`](js_src.protobufs.md#amprequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`AmpRequest`](js_src.protobufs.md#amprequest) |
| `encode` | (`message`: [`AmpRequest`](js_src.protobufs.md#amprequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`AmpRequest`](js_src.protobufs.md#amprequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`AmpRequest`](js_src.protobufs.md#amprequest) |
| `toJSON` | (`message`: [`AmpRequest`](js_src.protobufs.md#amprequest)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:3579

protobufs/dist/index.d.ts:3583

___

### CastAddBody

• **CastAddBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`CastAddBody`](js_src.protobufs.md#castaddbody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`CastAddBody`](js_src.protobufs.md#castaddbody) |
| `encode` | (`message`: [`CastAddBody`](js_src.protobufs.md#castaddbody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`CastAddBody`](js_src.protobufs.md#castaddbody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`CastAddBody`](js_src.protobufs.md#castaddbody) |
| `toJSON` | (`message`: [`CastAddBody`](js_src.protobufs.md#castaddbody)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:222

protobufs/dist/index.d.ts:229

___

### CastId

• **CastId**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`CastId`](js_src.protobufs.md#castid) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`CastId`](js_src.protobufs.md#castid) |
| `encode` | (`message`: [`CastId`](js_src.protobufs.md#castid), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`CastId`](js_src.protobufs.md#castid) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`CastId`](js_src.protobufs.md#castid) |
| `toJSON` | (`message`: [`CastId`](js_src.protobufs.md#castid)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:198

protobufs/dist/index.d.ts:202

___

### CastRemoveBody

• **CastRemoveBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`CastRemoveBody`](js_src.protobufs.md#castremovebody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`CastRemoveBody`](js_src.protobufs.md#castremovebody) |
| `encode` | (`message`: [`CastRemoveBody`](js_src.protobufs.md#castremovebody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`CastRemoveBody`](js_src.protobufs.md#castremovebody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`CastRemoveBody`](js_src.protobufs.md#castremovebody) |
| `toJSON` | (`message`: [`CastRemoveBody`](js_src.protobufs.md#castremovebody)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:279

protobufs/dist/index.d.ts:282

___

### ContactInfoContent

• **ContactInfoContent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`ContactInfoContent`](js_src.protobufs.md#contactinfocontent) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`ContactInfoContent`](js_src.protobufs.md#contactinfocontent) |
| `encode` | (`message`: [`ContactInfoContent`](js_src.protobufs.md#contactinfocontent), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`ContactInfoContent`](js_src.protobufs.md#contactinfocontent) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`ContactInfoContent`](js_src.protobufs.md#contactinfocontent) |
| `toJSON` | (`message`: [`ContactInfoContent`](js_src.protobufs.md#contactinfocontent)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:4212

protobufs/dist/index.d.ts:4218

___

### DbTrieNode

• **DbTrieNode**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`DbTrieNode`](js_src.protobufs.md#dbtrienode) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`DbTrieNode`](js_src.protobufs.md#dbtrienode) |
| `encode` | (`message`: [`DbTrieNode`](js_src.protobufs.md#dbtrienode), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`DbTrieNode`](js_src.protobufs.md#dbtrienode) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`DbTrieNode`](js_src.protobufs.md#dbtrienode) |
| `toJSON` | (`message`: [`DbTrieNode`](js_src.protobufs.md#dbtrienode)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:5009

protobufs/dist/index.d.ts:5015

___

### Empty

• **Empty**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`Empty`](js_src.protobufs.md#empty) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`Empty`](js_src.protobufs.md#empty) |
| `encode` | (`_`: [`Empty`](js_src.protobufs.md#empty), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`_`: `any`) => [`Empty`](js_src.protobufs.md#empty) |
| `fromPartial` | <I_1\>(`_`: `I_1`) => [`Empty`](js_src.protobufs.md#empty) |
| `toJSON` | (`_`: [`Empty`](js_src.protobufs.md#empty)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:1102

protobufs/dist/index.d.ts:1104

___

### EventResponse

• **EventResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`EventResponse`](js_src.protobufs.md#eventresponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`EventResponse`](js_src.protobufs.md#eventresponse) |
| `encode` | (`message`: [`EventResponse`](js_src.protobufs.md#eventresponse), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`EventResponse`](js_src.protobufs.md#eventresponse) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`EventResponse`](js_src.protobufs.md#eventresponse) |
| `toJSON` | (`message`: [`EventResponse`](js_src.protobufs.md#eventresponse)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:1112

protobufs/dist/index.d.ts:1119

___

### FidRequest

• **FidRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `encode` | (`message`: [`FidRequest`](js_src.protobufs.md#fidrequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `toJSON` | (`message`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:2751

protobufs/dist/index.d.ts:2754

___

### FidsResponse

• **FidsResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`FidsResponse`](js_src.protobufs.md#fidsresponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`FidsResponse`](js_src.protobufs.md#fidsresponse) |
| `encode` | (`message`: [`FidsResponse`](js_src.protobufs.md#fidsresponse), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`FidsResponse`](js_src.protobufs.md#fidsresponse) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`FidsResponse`](js_src.protobufs.md#fidsresponse) |
| `toJSON` | (`message`: [`FidsResponse`](js_src.protobufs.md#fidsresponse)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:2770

protobufs/dist/index.d.ts:2773

___

### GossipAddressInfo

• **GossipAddressInfo**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`GossipAddressInfo`](js_src.protobufs.md#gossipaddressinfo) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`GossipAddressInfo`](js_src.protobufs.md#gossipaddressinfo) |
| `encode` | (`message`: [`GossipAddressInfo`](js_src.protobufs.md#gossipaddressinfo), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`GossipAddressInfo`](js_src.protobufs.md#gossipaddressinfo) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`GossipAddressInfo`](js_src.protobufs.md#gossipaddressinfo) |
| `toJSON` | (`message`: [`GossipAddressInfo`](js_src.protobufs.md#gossipaddressinfo)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:4183

protobufs/dist/index.d.ts:4188

___

### GossipMessage

• **GossipMessage**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`GossipMessage`](js_src.protobufs.md#gossipmessage) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`GossipMessage`](js_src.protobufs.md#gossipmessage) |
| `encode` | (`message`: [`GossipMessage`](js_src.protobufs.md#gossipmessage), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`GossipMessage`](js_src.protobufs.md#gossipmessage) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`GossipMessage`](js_src.protobufs.md#gossipmessage) |
| `toJSON` | (`message`: [`GossipMessage`](js_src.protobufs.md#gossipmessage)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:4294

protobufs/dist/index.d.ts:4302

___

### HubInfoResponse

• **HubInfoResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`HubInfoResponse`](js_src.protobufs.md#hubinforesponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`HubInfoResponse`](js_src.protobufs.md#hubinforesponse) |
| `encode` | (`message`: [`HubInfoResponse`](js_src.protobufs.md#hubinforesponse), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`HubInfoResponse`](js_src.protobufs.md#hubinforesponse) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`HubInfoResponse`](js_src.protobufs.md#hubinforesponse) |
| `toJSON` | (`message`: [`HubInfoResponse`](js_src.protobufs.md#hubinforesponse)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:2401

protobufs/dist/index.d.ts:2407

___

### HubServiceClient

• **HubServiceClient**: `Object`

#### Call signature

• **new HubServiceClient**(`address`, `credentials`, `options?`): [`HubServiceClient`](js_src.protobufs.md#hubserviceclient)

##### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `credentials` | `ChannelCredentials` |
| `options?` | `Partial`<`ClientOptions`\> |

##### Returns

[`HubServiceClient`](js_src.protobufs.md#hubserviceclient)

#### Type declaration

| Name | Type |
| :------ | :------ |
| `service` | { `getAllAmpMessagesByFid`: { `path`: ``"/HubService/GetAllAmpMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getAllCastMessagesByFid`: { `path`: ``"/HubService/GetAllCastMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getAllMessagesBySyncIds`: { `path`: ``"/HubService/GetAllMessagesBySyncIds"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SyncIds`](js_src.protobufs.md#syncids) ; `requestSerialize`: (`value`: [`SyncIds`](js_src.protobufs.md#syncids)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getAllReactionMessagesByFid`: { `path`: ``"/HubService/GetAllReactionMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getAllSignerMessagesByFid`: { `path`: ``"/HubService/GetAllSignerMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getAllSyncIdsByPrefix`: { `path`: ``"/HubService/GetAllSyncIdsByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`SyncIds`](js_src.protobufs.md#syncids) ; `responseSerialize`: (`value`: [`SyncIds`](js_src.protobufs.md#syncids)) => `Buffer` ; `responseStream`: ``false``  } ; `getAllUserDataMessagesByFid`: { `path`: ``"/HubService/GetAllUserDataMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getAllVerificationMessagesByFid`: { `path`: ``"/HubService/GetAllVerificationMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getAmp`: { `path`: ``"/HubService/GetAmp"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`AmpRequest`](js_src.protobufs.md#amprequest) ; `requestSerialize`: (`value`: [`AmpRequest`](js_src.protobufs.md#amprequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } ; `getAmpsByFid`: { `path`: ``"/HubService/GetAmpsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getAmpsByUser`: { `path`: ``"/HubService/GetAmpsByUser"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getCast`: { `path`: ``"/HubService/GetCast"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](js_src.protobufs.md#castid) ; `requestSerialize`: (`value`: [`CastId`](js_src.protobufs.md#castid)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } ; `getCastsByFid`: { `path`: ``"/HubService/GetCastsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getCastsByMention`: { `path`: ``"/HubService/GetCastsByMention"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getCastsByParent`: { `path`: ``"/HubService/GetCastsByParent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](js_src.protobufs.md#castid) ; `requestSerialize`: (`value`: [`CastId`](js_src.protobufs.md#castid)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getFids`: { `path`: ``"/HubService/GetFids"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](js_src.protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](js_src.protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`FidsResponse`](js_src.protobufs.md#fidsresponse) ; `responseSerialize`: (`value`: [`FidsResponse`](js_src.protobufs.md#fidsresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getIdRegistryEvent`: { `path`: ``"/HubService/GetIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false``  } ; `getInfo`: { `path`: ``"/HubService/GetInfo"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](js_src.protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](js_src.protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`HubInfoResponse`](js_src.protobufs.md#hubinforesponse) ; `responseSerialize`: (`value`: [`HubInfoResponse`](js_src.protobufs.md#hubinforesponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getNameRegistryEvent`: { `path`: ``"/HubService/GetNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEventRequest`](js_src.protobufs.md#nameregistryeventrequest) ; `requestSerialize`: (`value`: [`NameRegistryEventRequest`](js_src.protobufs.md#nameregistryeventrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false``  } ; `getReaction`: { `path`: ``"/HubService/GetReaction"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionRequest`](js_src.protobufs.md#reactionrequest) ; `requestSerialize`: (`value`: [`ReactionRequest`](js_src.protobufs.md#reactionrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } ; `getReactionsByCast`: { `path`: ``"/HubService/GetReactionsByCast"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByCastRequest`](js_src.protobufs.md#reactionsbycastrequest) ; `requestSerialize`: (`value`: [`ReactionsByCastRequest`](js_src.protobufs.md#reactionsbycastrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getReactionsByFid`: { `path`: ``"/HubService/GetReactionsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByFidRequest`](js_src.protobufs.md#reactionsbyfidrequest) ; `requestSerialize`: (`value`: [`ReactionsByFidRequest`](js_src.protobufs.md#reactionsbyfidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getSigner`: { `path`: ``"/HubService/GetSigner"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SignerRequest`](js_src.protobufs.md#signerrequest) ; `requestSerialize`: (`value`: [`SignerRequest`](js_src.protobufs.md#signerrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } ; `getSignersByFid`: { `path`: ``"/HubService/GetSignersByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getSyncMetadataByPrefix`: { `path`: ``"/HubService/GetSyncMetadataByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeMetadataResponse`](js_src.protobufs.md#trienodemetadataresponse) ; `responseSerialize`: (`value`: [`TrieNodeMetadataResponse`](js_src.protobufs.md#trienodemetadataresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getSyncSnapshotByPrefix`: { `path`: ``"/HubService/GetSyncSnapshotByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeSnapshotResponse`](js_src.protobufs.md#trienodesnapshotresponse) ; `responseSerialize`: (`value`: [`TrieNodeSnapshotResponse`](js_src.protobufs.md#trienodesnapshotresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getUserData`: { `path`: ``"/HubService/GetUserData"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`UserDataRequest`](js_src.protobufs.md#userdatarequest) ; `requestSerialize`: (`value`: [`UserDataRequest`](js_src.protobufs.md#userdatarequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } ; `getUserDataByFid`: { `path`: ``"/HubService/GetUserDataByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `getVerification`: { `path`: ``"/HubService/GetVerification"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`VerificationRequest`](js_src.protobufs.md#verificationrequest) ; `requestSerialize`: (`value`: [`VerificationRequest`](js_src.protobufs.md#verificationrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } ; `getVerificationsByFid`: { `path`: ``"/HubService/GetVerificationsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } ; `submitIdRegistryEvent`: { `path`: ``"/HubService/SubmitIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) ; `requestSerialize`: (`value`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false``  } ; `submitMessage`: { `path`: ``"/HubService/SubmitMessage"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `requestSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } ; `submitNameRegistryEvent`: { `path`: ``"/HubService/SubmitNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) ; `requestSerialize`: (`value`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false``  } ; `subscribe`: { `path`: ``"/HubService/Subscribe"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SubscribeRequest`](js_src.protobufs.md#subscriberequest) ; `requestSerialize`: (`value`: [`SubscribeRequest`](js_src.protobufs.md#subscriberequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`EventResponse`](js_src.protobufs.md#eventresponse) ; `responseSerialize`: (`value`: [`EventResponse`](js_src.protobufs.md#eventresponse)) => `Buffer` ; `responseStream`: ``true``  }  } |
| `service.getAllAmpMessagesByFid` | { `path`: ``"/HubService/GetAllAmpMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAllAmpMessagesByFid.path` | ``"/HubService/GetAllAmpMessagesByFid"`` |
| `service.getAllAmpMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `service.getAllAmpMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` |
| `service.getAllAmpMessagesByFid.requestStream` | ``false`` |
| `service.getAllAmpMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getAllAmpMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getAllAmpMessagesByFid.responseStream` | ``false`` |
| `service.getAllCastMessagesByFid` | { `path`: ``"/HubService/GetAllCastMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAllCastMessagesByFid.path` | ``"/HubService/GetAllCastMessagesByFid"`` |
| `service.getAllCastMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `service.getAllCastMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` |
| `service.getAllCastMessagesByFid.requestStream` | ``false`` |
| `service.getAllCastMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getAllCastMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getAllCastMessagesByFid.responseStream` | ``false`` |
| `service.getAllMessagesBySyncIds` | { `path`: ``"/HubService/GetAllMessagesBySyncIds"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SyncIds`](js_src.protobufs.md#syncids) ; `requestSerialize`: (`value`: [`SyncIds`](js_src.protobufs.md#syncids)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAllMessagesBySyncIds.path` | ``"/HubService/GetAllMessagesBySyncIds"`` |
| `service.getAllMessagesBySyncIds.requestDeserialize` | (`value`: `Buffer`) => [`SyncIds`](js_src.protobufs.md#syncids) |
| `service.getAllMessagesBySyncIds.requestSerialize` | (`value`: [`SyncIds`](js_src.protobufs.md#syncids)) => `Buffer` |
| `service.getAllMessagesBySyncIds.requestStream` | ``false`` |
| `service.getAllMessagesBySyncIds.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getAllMessagesBySyncIds.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getAllMessagesBySyncIds.responseStream` | ``false`` |
| `service.getAllReactionMessagesByFid` | { `path`: ``"/HubService/GetAllReactionMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAllReactionMessagesByFid.path` | ``"/HubService/GetAllReactionMessagesByFid"`` |
| `service.getAllReactionMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `service.getAllReactionMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` |
| `service.getAllReactionMessagesByFid.requestStream` | ``false`` |
| `service.getAllReactionMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getAllReactionMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getAllReactionMessagesByFid.responseStream` | ``false`` |
| `service.getAllSignerMessagesByFid` | { `path`: ``"/HubService/GetAllSignerMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAllSignerMessagesByFid.path` | ``"/HubService/GetAllSignerMessagesByFid"`` |
| `service.getAllSignerMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `service.getAllSignerMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` |
| `service.getAllSignerMessagesByFid.requestStream` | ``false`` |
| `service.getAllSignerMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getAllSignerMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getAllSignerMessagesByFid.responseStream` | ``false`` |
| `service.getAllSyncIdsByPrefix` | { `path`: ``"/HubService/GetAllSyncIdsByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`SyncIds`](js_src.protobufs.md#syncids) ; `responseSerialize`: (`value`: [`SyncIds`](js_src.protobufs.md#syncids)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAllSyncIdsByPrefix.path` | ``"/HubService/GetAllSyncIdsByPrefix"`` |
| `service.getAllSyncIdsByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) |
| `service.getAllSyncIdsByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix)) => `Buffer` |
| `service.getAllSyncIdsByPrefix.requestStream` | ``false`` |
| `service.getAllSyncIdsByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`SyncIds`](js_src.protobufs.md#syncids) |
| `service.getAllSyncIdsByPrefix.responseSerialize` | (`value`: [`SyncIds`](js_src.protobufs.md#syncids)) => `Buffer` |
| `service.getAllSyncIdsByPrefix.responseStream` | ``false`` |
| `service.getAllUserDataMessagesByFid` | { `path`: ``"/HubService/GetAllUserDataMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAllUserDataMessagesByFid.path` | ``"/HubService/GetAllUserDataMessagesByFid"`` |
| `service.getAllUserDataMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `service.getAllUserDataMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` |
| `service.getAllUserDataMessagesByFid.requestStream` | ``false`` |
| `service.getAllUserDataMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getAllUserDataMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getAllUserDataMessagesByFid.responseStream` | ``false`` |
| `service.getAllVerificationMessagesByFid` | { `path`: ``"/HubService/GetAllVerificationMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAllVerificationMessagesByFid.path` | ``"/HubService/GetAllVerificationMessagesByFid"`` |
| `service.getAllVerificationMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `service.getAllVerificationMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` |
| `service.getAllVerificationMessagesByFid.requestStream` | ``false`` |
| `service.getAllVerificationMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getAllVerificationMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getAllVerificationMessagesByFid.responseStream` | ``false`` |
| `service.getAmp` | { `path`: ``"/HubService/GetAmp"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`AmpRequest`](js_src.protobufs.md#amprequest) ; `requestSerialize`: (`value`: [`AmpRequest`](js_src.protobufs.md#amprequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAmp.path` | ``"/HubService/GetAmp"`` |
| `service.getAmp.requestDeserialize` | (`value`: `Buffer`) => [`AmpRequest`](js_src.protobufs.md#amprequest) |
| `service.getAmp.requestSerialize` | (`value`: [`AmpRequest`](js_src.protobufs.md#amprequest)) => `Buffer` |
| `service.getAmp.requestStream` | ``false`` |
| `service.getAmp.responseDeserialize` | (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) |
| `service.getAmp.responseSerialize` | (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` |
| `service.getAmp.responseStream` | ``false`` |
| `service.getAmpsByFid` | { `path`: ``"/HubService/GetAmpsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAmpsByFid.path` | ``"/HubService/GetAmpsByFid"`` |
| `service.getAmpsByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `service.getAmpsByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` |
| `service.getAmpsByFid.requestStream` | ``false`` |
| `service.getAmpsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getAmpsByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getAmpsByFid.responseStream` | ``false`` |
| `service.getAmpsByUser` | { `path`: ``"/HubService/GetAmpsByUser"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getAmpsByUser.path` | ``"/HubService/GetAmpsByUser"`` |
| `service.getAmpsByUser.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `service.getAmpsByUser.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` |
| `service.getAmpsByUser.requestStream` | ``false`` |
| `service.getAmpsByUser.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getAmpsByUser.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getAmpsByUser.responseStream` | ``false`` |
| `service.getCast` | { `path`: ``"/HubService/GetCast"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](js_src.protobufs.md#castid) ; `requestSerialize`: (`value`: [`CastId`](js_src.protobufs.md#castid)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getCast.path` | ``"/HubService/GetCast"`` |
| `service.getCast.requestDeserialize` | (`value`: `Buffer`) => [`CastId`](js_src.protobufs.md#castid) |
| `service.getCast.requestSerialize` | (`value`: [`CastId`](js_src.protobufs.md#castid)) => `Buffer` |
| `service.getCast.requestStream` | ``false`` |
| `service.getCast.responseDeserialize` | (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) |
| `service.getCast.responseSerialize` | (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` |
| `service.getCast.responseStream` | ``false`` |
| `service.getCastsByFid` | { `path`: ``"/HubService/GetCastsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getCastsByFid.path` | ``"/HubService/GetCastsByFid"`` |
| `service.getCastsByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `service.getCastsByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` |
| `service.getCastsByFid.requestStream` | ``false`` |
| `service.getCastsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getCastsByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getCastsByFid.responseStream` | ``false`` |
| `service.getCastsByMention` | { `path`: ``"/HubService/GetCastsByMention"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getCastsByMention.path` | ``"/HubService/GetCastsByMention"`` |
| `service.getCastsByMention.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `service.getCastsByMention.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` |
| `service.getCastsByMention.requestStream` | ``false`` |
| `service.getCastsByMention.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getCastsByMention.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getCastsByMention.responseStream` | ``false`` |
| `service.getCastsByParent` | { `path`: ``"/HubService/GetCastsByParent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](js_src.protobufs.md#castid) ; `requestSerialize`: (`value`: [`CastId`](js_src.protobufs.md#castid)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getCastsByParent.path` | ``"/HubService/GetCastsByParent"`` |
| `service.getCastsByParent.requestDeserialize` | (`value`: `Buffer`) => [`CastId`](js_src.protobufs.md#castid) |
| `service.getCastsByParent.requestSerialize` | (`value`: [`CastId`](js_src.protobufs.md#castid)) => `Buffer` |
| `service.getCastsByParent.requestStream` | ``false`` |
| `service.getCastsByParent.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getCastsByParent.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getCastsByParent.responseStream` | ``false`` |
| `service.getFids` | { `path`: ``"/HubService/GetFids"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](js_src.protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](js_src.protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`FidsResponse`](js_src.protobufs.md#fidsresponse) ; `responseSerialize`: (`value`: [`FidsResponse`](js_src.protobufs.md#fidsresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getFids.path` | ``"/HubService/GetFids"`` |
| `service.getFids.requestDeserialize` | (`value`: `Buffer`) => [`Empty`](js_src.protobufs.md#empty) |
| `service.getFids.requestSerialize` | (`value`: [`Empty`](js_src.protobufs.md#empty)) => `Buffer` |
| `service.getFids.requestStream` | ``false`` |
| `service.getFids.responseDeserialize` | (`value`: `Buffer`) => [`FidsResponse`](js_src.protobufs.md#fidsresponse) |
| `service.getFids.responseSerialize` | (`value`: [`FidsResponse`](js_src.protobufs.md#fidsresponse)) => `Buffer` |
| `service.getFids.responseStream` | ``false`` |
| `service.getIdRegistryEvent` | { `path`: ``"/HubService/GetIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getIdRegistryEvent.path` | ``"/HubService/GetIdRegistryEvent"`` |
| `service.getIdRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `service.getIdRegistryEvent.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` |
| `service.getIdRegistryEvent.requestStream` | ``false`` |
| `service.getIdRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) |
| `service.getIdRegistryEvent.responseSerialize` | (`value`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)) => `Buffer` |
| `service.getIdRegistryEvent.responseStream` | ``false`` |
| `service.getInfo` | { `path`: ``"/HubService/GetInfo"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](js_src.protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](js_src.protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`HubInfoResponse`](js_src.protobufs.md#hubinforesponse) ; `responseSerialize`: (`value`: [`HubInfoResponse`](js_src.protobufs.md#hubinforesponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getInfo.path` | ``"/HubService/GetInfo"`` |
| `service.getInfo.requestDeserialize` | (`value`: `Buffer`) => [`Empty`](js_src.protobufs.md#empty) |
| `service.getInfo.requestSerialize` | (`value`: [`Empty`](js_src.protobufs.md#empty)) => `Buffer` |
| `service.getInfo.requestStream` | ``false`` |
| `service.getInfo.responseDeserialize` | (`value`: `Buffer`) => [`HubInfoResponse`](js_src.protobufs.md#hubinforesponse) |
| `service.getInfo.responseSerialize` | (`value`: [`HubInfoResponse`](js_src.protobufs.md#hubinforesponse)) => `Buffer` |
| `service.getInfo.responseStream` | ``false`` |
| `service.getNameRegistryEvent` | { `path`: ``"/HubService/GetNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEventRequest`](js_src.protobufs.md#nameregistryeventrequest) ; `requestSerialize`: (`value`: [`NameRegistryEventRequest`](js_src.protobufs.md#nameregistryeventrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getNameRegistryEvent.path` | ``"/HubService/GetNameRegistryEvent"`` |
| `service.getNameRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`NameRegistryEventRequest`](js_src.protobufs.md#nameregistryeventrequest) |
| `service.getNameRegistryEvent.requestSerialize` | (`value`: [`NameRegistryEventRequest`](js_src.protobufs.md#nameregistryeventrequest)) => `Buffer` |
| `service.getNameRegistryEvent.requestStream` | ``false`` |
| `service.getNameRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) |
| `service.getNameRegistryEvent.responseSerialize` | (`value`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)) => `Buffer` |
| `service.getNameRegistryEvent.responseStream` | ``false`` |
| `service.getReaction` | { `path`: ``"/HubService/GetReaction"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionRequest`](js_src.protobufs.md#reactionrequest) ; `requestSerialize`: (`value`: [`ReactionRequest`](js_src.protobufs.md#reactionrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getReaction.path` | ``"/HubService/GetReaction"`` |
| `service.getReaction.requestDeserialize` | (`value`: `Buffer`) => [`ReactionRequest`](js_src.protobufs.md#reactionrequest) |
| `service.getReaction.requestSerialize` | (`value`: [`ReactionRequest`](js_src.protobufs.md#reactionrequest)) => `Buffer` |
| `service.getReaction.requestStream` | ``false`` |
| `service.getReaction.responseDeserialize` | (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) |
| `service.getReaction.responseSerialize` | (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` |
| `service.getReaction.responseStream` | ``false`` |
| `service.getReactionsByCast` | { `path`: ``"/HubService/GetReactionsByCast"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByCastRequest`](js_src.protobufs.md#reactionsbycastrequest) ; `requestSerialize`: (`value`: [`ReactionsByCastRequest`](js_src.protobufs.md#reactionsbycastrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getReactionsByCast.path` | ``"/HubService/GetReactionsByCast"`` |
| `service.getReactionsByCast.requestDeserialize` | (`value`: `Buffer`) => [`ReactionsByCastRequest`](js_src.protobufs.md#reactionsbycastrequest) |
| `service.getReactionsByCast.requestSerialize` | (`value`: [`ReactionsByCastRequest`](js_src.protobufs.md#reactionsbycastrequest)) => `Buffer` |
| `service.getReactionsByCast.requestStream` | ``false`` |
| `service.getReactionsByCast.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getReactionsByCast.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getReactionsByCast.responseStream` | ``false`` |
| `service.getReactionsByFid` | { `path`: ``"/HubService/GetReactionsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByFidRequest`](js_src.protobufs.md#reactionsbyfidrequest) ; `requestSerialize`: (`value`: [`ReactionsByFidRequest`](js_src.protobufs.md#reactionsbyfidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getReactionsByFid.path` | ``"/HubService/GetReactionsByFid"`` |
| `service.getReactionsByFid.requestDeserialize` | (`value`: `Buffer`) => [`ReactionsByFidRequest`](js_src.protobufs.md#reactionsbyfidrequest) |
| `service.getReactionsByFid.requestSerialize` | (`value`: [`ReactionsByFidRequest`](js_src.protobufs.md#reactionsbyfidrequest)) => `Buffer` |
| `service.getReactionsByFid.requestStream` | ``false`` |
| `service.getReactionsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getReactionsByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getReactionsByFid.responseStream` | ``false`` |
| `service.getSigner` | { `path`: ``"/HubService/GetSigner"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SignerRequest`](js_src.protobufs.md#signerrequest) ; `requestSerialize`: (`value`: [`SignerRequest`](js_src.protobufs.md#signerrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getSigner.path` | ``"/HubService/GetSigner"`` |
| `service.getSigner.requestDeserialize` | (`value`: `Buffer`) => [`SignerRequest`](js_src.protobufs.md#signerrequest) |
| `service.getSigner.requestSerialize` | (`value`: [`SignerRequest`](js_src.protobufs.md#signerrequest)) => `Buffer` |
| `service.getSigner.requestStream` | ``false`` |
| `service.getSigner.responseDeserialize` | (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) |
| `service.getSigner.responseSerialize` | (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` |
| `service.getSigner.responseStream` | ``false`` |
| `service.getSignersByFid` | { `path`: ``"/HubService/GetSignersByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getSignersByFid.path` | ``"/HubService/GetSignersByFid"`` |
| `service.getSignersByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `service.getSignersByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` |
| `service.getSignersByFid.requestStream` | ``false`` |
| `service.getSignersByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getSignersByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getSignersByFid.responseStream` | ``false`` |
| `service.getSyncMetadataByPrefix` | { `path`: ``"/HubService/GetSyncMetadataByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeMetadataResponse`](js_src.protobufs.md#trienodemetadataresponse) ; `responseSerialize`: (`value`: [`TrieNodeMetadataResponse`](js_src.protobufs.md#trienodemetadataresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getSyncMetadataByPrefix.path` | ``"/HubService/GetSyncMetadataByPrefix"`` |
| `service.getSyncMetadataByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) |
| `service.getSyncMetadataByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix)) => `Buffer` |
| `service.getSyncMetadataByPrefix.requestStream` | ``false`` |
| `service.getSyncMetadataByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`TrieNodeMetadataResponse`](js_src.protobufs.md#trienodemetadataresponse) |
| `service.getSyncMetadataByPrefix.responseSerialize` | (`value`: [`TrieNodeMetadataResponse`](js_src.protobufs.md#trienodemetadataresponse)) => `Buffer` |
| `service.getSyncMetadataByPrefix.responseStream` | ``false`` |
| `service.getSyncSnapshotByPrefix` | { `path`: ``"/HubService/GetSyncSnapshotByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeSnapshotResponse`](js_src.protobufs.md#trienodesnapshotresponse) ; `responseSerialize`: (`value`: [`TrieNodeSnapshotResponse`](js_src.protobufs.md#trienodesnapshotresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getSyncSnapshotByPrefix.path` | ``"/HubService/GetSyncSnapshotByPrefix"`` |
| `service.getSyncSnapshotByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) |
| `service.getSyncSnapshotByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix)) => `Buffer` |
| `service.getSyncSnapshotByPrefix.requestStream` | ``false`` |
| `service.getSyncSnapshotByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`TrieNodeSnapshotResponse`](js_src.protobufs.md#trienodesnapshotresponse) |
| `service.getSyncSnapshotByPrefix.responseSerialize` | (`value`: [`TrieNodeSnapshotResponse`](js_src.protobufs.md#trienodesnapshotresponse)) => `Buffer` |
| `service.getSyncSnapshotByPrefix.responseStream` | ``false`` |
| `service.getUserData` | { `path`: ``"/HubService/GetUserData"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`UserDataRequest`](js_src.protobufs.md#userdatarequest) ; `requestSerialize`: (`value`: [`UserDataRequest`](js_src.protobufs.md#userdatarequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getUserData.path` | ``"/HubService/GetUserData"`` |
| `service.getUserData.requestDeserialize` | (`value`: `Buffer`) => [`UserDataRequest`](js_src.protobufs.md#userdatarequest) |
| `service.getUserData.requestSerialize` | (`value`: [`UserDataRequest`](js_src.protobufs.md#userdatarequest)) => `Buffer` |
| `service.getUserData.requestStream` | ``false`` |
| `service.getUserData.responseDeserialize` | (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) |
| `service.getUserData.responseSerialize` | (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` |
| `service.getUserData.responseStream` | ``false`` |
| `service.getUserDataByFid` | { `path`: ``"/HubService/GetUserDataByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getUserDataByFid.path` | ``"/HubService/GetUserDataByFid"`` |
| `service.getUserDataByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `service.getUserDataByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` |
| `service.getUserDataByFid.requestStream` | ``false`` |
| `service.getUserDataByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getUserDataByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getUserDataByFid.responseStream` | ``false`` |
| `service.getVerification` | { `path`: ``"/HubService/GetVerification"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`VerificationRequest`](js_src.protobufs.md#verificationrequest) ; `requestSerialize`: (`value`: [`VerificationRequest`](js_src.protobufs.md#verificationrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getVerification.path` | ``"/HubService/GetVerification"`` |
| `service.getVerification.requestDeserialize` | (`value`: `Buffer`) => [`VerificationRequest`](js_src.protobufs.md#verificationrequest) |
| `service.getVerification.requestSerialize` | (`value`: [`VerificationRequest`](js_src.protobufs.md#verificationrequest)) => `Buffer` |
| `service.getVerification.requestStream` | ``false`` |
| `service.getVerification.responseDeserialize` | (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) |
| `service.getVerification.responseSerialize` | (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` |
| `service.getVerification.responseStream` | ``false`` |
| `service.getVerificationsByFid` | { `path`: ``"/HubService/GetVerificationsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.getVerificationsByFid.path` | ``"/HubService/GetVerificationsByFid"`` |
| `service.getVerificationsByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) |
| `service.getVerificationsByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` |
| `service.getVerificationsByFid.requestStream` | ``false`` |
| `service.getVerificationsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `service.getVerificationsByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` |
| `service.getVerificationsByFid.responseStream` | ``false`` |
| `service.submitIdRegistryEvent` | { `path`: ``"/HubService/SubmitIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) ; `requestSerialize`: (`value`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.submitIdRegistryEvent.path` | ``"/HubService/SubmitIdRegistryEvent"`` |
| `service.submitIdRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) |
| `service.submitIdRegistryEvent.requestSerialize` | (`value`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)) => `Buffer` |
| `service.submitIdRegistryEvent.requestStream` | ``false`` |
| `service.submitIdRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) |
| `service.submitIdRegistryEvent.responseSerialize` | (`value`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)) => `Buffer` |
| `service.submitIdRegistryEvent.responseStream` | ``false`` |
| `service.submitMessage` | { `path`: ``"/HubService/SubmitMessage"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `requestSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.submitMessage.path` | ``"/HubService/SubmitMessage"`` |
| `service.submitMessage.requestDeserialize` | (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) |
| `service.submitMessage.requestSerialize` | (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` |
| `service.submitMessage.requestStream` | ``false`` |
| `service.submitMessage.responseDeserialize` | (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) |
| `service.submitMessage.responseSerialize` | (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` |
| `service.submitMessage.responseStream` | ``false`` |
| `service.submitNameRegistryEvent` | { `path`: ``"/HubService/SubmitNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) ; `requestSerialize`: (`value`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false``  } |
| `service.submitNameRegistryEvent.path` | ``"/HubService/SubmitNameRegistryEvent"`` |
| `service.submitNameRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) |
| `service.submitNameRegistryEvent.requestSerialize` | (`value`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)) => `Buffer` |
| `service.submitNameRegistryEvent.requestStream` | ``false`` |
| `service.submitNameRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) |
| `service.submitNameRegistryEvent.responseSerialize` | (`value`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)) => `Buffer` |
| `service.submitNameRegistryEvent.responseStream` | ``false`` |
| `service.subscribe` | { `path`: ``"/HubService/Subscribe"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SubscribeRequest`](js_src.protobufs.md#subscriberequest) ; `requestSerialize`: (`value`: [`SubscribeRequest`](js_src.protobufs.md#subscriberequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`EventResponse`](js_src.protobufs.md#eventresponse) ; `responseSerialize`: (`value`: [`EventResponse`](js_src.protobufs.md#eventresponse)) => `Buffer` ; `responseStream`: ``true``  } |
| `service.subscribe.path` | ``"/HubService/Subscribe"`` |
| `service.subscribe.requestDeserialize` | (`value`: `Buffer`) => [`SubscribeRequest`](js_src.protobufs.md#subscriberequest) |
| `service.subscribe.requestSerialize` | (`value`: [`SubscribeRequest`](js_src.protobufs.md#subscriberequest)) => `Buffer` |
| `service.subscribe.requestStream` | ``false`` |
| `service.subscribe.responseDeserialize` | (`value`: `Buffer`) => [`EventResponse`](js_src.protobufs.md#eventresponse) |
| `service.subscribe.responseSerialize` | (`value`: [`EventResponse`](js_src.protobufs.md#eventresponse)) => `Buffer` |
| `service.subscribe.responseStream` | ``true`` |

#### Defined in

protobufs/dist/index.d.ts:4059

protobufs/dist/index.d.ts:4172

___

### HubServiceService

• **HubServiceService**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `getAllAmpMessagesByFid` | { `path`: ``"/HubService/GetAllAmpMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getAllAmpMessagesByFid.path` | ``"/HubService/GetAllAmpMessagesByFid"`` | - |
| `getAllAmpMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) | - |
| `getAllAmpMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` | - |
| `getAllAmpMessagesByFid.requestStream` | ``false`` | - |
| `getAllAmpMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getAllAmpMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getAllAmpMessagesByFid.responseStream` | ``false`` | - |
| `getAllCastMessagesByFid` | { `path`: ``"/HubService/GetAllCastMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | Bulk Methods |
| `getAllCastMessagesByFid.path` | ``"/HubService/GetAllCastMessagesByFid"`` | - |
| `getAllCastMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) | - |
| `getAllCastMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` | - |
| `getAllCastMessagesByFid.requestStream` | ``false`` | - |
| `getAllCastMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getAllCastMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getAllCastMessagesByFid.responseStream` | ``false`` | - |
| `getAllMessagesBySyncIds` | { `path`: ``"/HubService/GetAllMessagesBySyncIds"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SyncIds`](js_src.protobufs.md#syncids) ; `requestSerialize`: (`value`: [`SyncIds`](js_src.protobufs.md#syncids)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getAllMessagesBySyncIds.path` | ``"/HubService/GetAllMessagesBySyncIds"`` | - |
| `getAllMessagesBySyncIds.requestDeserialize` | (`value`: `Buffer`) => [`SyncIds`](js_src.protobufs.md#syncids) | - |
| `getAllMessagesBySyncIds.requestSerialize` | (`value`: [`SyncIds`](js_src.protobufs.md#syncids)) => `Buffer` | - |
| `getAllMessagesBySyncIds.requestStream` | ``false`` | - |
| `getAllMessagesBySyncIds.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getAllMessagesBySyncIds.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getAllMessagesBySyncIds.responseStream` | ``false`` | - |
| `getAllReactionMessagesByFid` | { `path`: ``"/HubService/GetAllReactionMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getAllReactionMessagesByFid.path` | ``"/HubService/GetAllReactionMessagesByFid"`` | - |
| `getAllReactionMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) | - |
| `getAllReactionMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` | - |
| `getAllReactionMessagesByFid.requestStream` | ``false`` | - |
| `getAllReactionMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getAllReactionMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getAllReactionMessagesByFid.responseStream` | ``false`` | - |
| `getAllSignerMessagesByFid` | { `path`: ``"/HubService/GetAllSignerMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getAllSignerMessagesByFid.path` | ``"/HubService/GetAllSignerMessagesByFid"`` | - |
| `getAllSignerMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) | - |
| `getAllSignerMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` | - |
| `getAllSignerMessagesByFid.requestStream` | ``false`` | - |
| `getAllSignerMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getAllSignerMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getAllSignerMessagesByFid.responseStream` | ``false`` | - |
| `getAllSyncIdsByPrefix` | { `path`: ``"/HubService/GetAllSyncIdsByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`SyncIds`](js_src.protobufs.md#syncids) ; `responseSerialize`: (`value`: [`SyncIds`](js_src.protobufs.md#syncids)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getAllSyncIdsByPrefix.path` | ``"/HubService/GetAllSyncIdsByPrefix"`` | - |
| `getAllSyncIdsByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) | - |
| `getAllSyncIdsByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix)) => `Buffer` | - |
| `getAllSyncIdsByPrefix.requestStream` | ``false`` | - |
| `getAllSyncIdsByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`SyncIds`](js_src.protobufs.md#syncids) | - |
| `getAllSyncIdsByPrefix.responseSerialize` | (`value`: [`SyncIds`](js_src.protobufs.md#syncids)) => `Buffer` | - |
| `getAllSyncIdsByPrefix.responseStream` | ``false`` | - |
| `getAllUserDataMessagesByFid` | { `path`: ``"/HubService/GetAllUserDataMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getAllUserDataMessagesByFid.path` | ``"/HubService/GetAllUserDataMessagesByFid"`` | - |
| `getAllUserDataMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) | - |
| `getAllUserDataMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` | - |
| `getAllUserDataMessagesByFid.requestStream` | ``false`` | - |
| `getAllUserDataMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getAllUserDataMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getAllUserDataMessagesByFid.responseStream` | ``false`` | - |
| `getAllVerificationMessagesByFid` | { `path`: ``"/HubService/GetAllVerificationMessagesByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getAllVerificationMessagesByFid.path` | ``"/HubService/GetAllVerificationMessagesByFid"`` | - |
| `getAllVerificationMessagesByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) | - |
| `getAllVerificationMessagesByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` | - |
| `getAllVerificationMessagesByFid.requestStream` | ``false`` | - |
| `getAllVerificationMessagesByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getAllVerificationMessagesByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getAllVerificationMessagesByFid.responseStream` | ``false`` | - |
| `getAmp` | { `path`: ``"/HubService/GetAmp"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`AmpRequest`](js_src.protobufs.md#amprequest) ; `requestSerialize`: (`value`: [`AmpRequest`](js_src.protobufs.md#amprequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } | Amps |
| `getAmp.path` | ``"/HubService/GetAmp"`` | - |
| `getAmp.requestDeserialize` | (`value`: `Buffer`) => [`AmpRequest`](js_src.protobufs.md#amprequest) | - |
| `getAmp.requestSerialize` | (`value`: [`AmpRequest`](js_src.protobufs.md#amprequest)) => `Buffer` | - |
| `getAmp.requestStream` | ``false`` | - |
| `getAmp.responseDeserialize` | (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) | - |
| `getAmp.responseSerialize` | (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` | - |
| `getAmp.responseStream` | ``false`` | - |
| `getAmpsByFid` | { `path`: ``"/HubService/GetAmpsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getAmpsByFid.path` | ``"/HubService/GetAmpsByFid"`` | - |
| `getAmpsByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) | - |
| `getAmpsByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` | - |
| `getAmpsByFid.requestStream` | ``false`` | - |
| `getAmpsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getAmpsByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getAmpsByFid.responseStream` | ``false`` | - |
| `getAmpsByUser` | { `path`: ``"/HubService/GetAmpsByUser"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getAmpsByUser.path` | ``"/HubService/GetAmpsByUser"`` | - |
| `getAmpsByUser.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) | - |
| `getAmpsByUser.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` | - |
| `getAmpsByUser.requestStream` | ``false`` | - |
| `getAmpsByUser.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getAmpsByUser.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getAmpsByUser.responseStream` | ``false`` | - |
| `getCast` | { `path`: ``"/HubService/GetCast"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](js_src.protobufs.md#castid) ; `requestSerialize`: (`value`: [`CastId`](js_src.protobufs.md#castid)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } | Casts |
| `getCast.path` | ``"/HubService/GetCast"`` | - |
| `getCast.requestDeserialize` | (`value`: `Buffer`) => [`CastId`](js_src.protobufs.md#castid) | - |
| `getCast.requestSerialize` | (`value`: [`CastId`](js_src.protobufs.md#castid)) => `Buffer` | - |
| `getCast.requestStream` | ``false`` | - |
| `getCast.responseDeserialize` | (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) | - |
| `getCast.responseSerialize` | (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` | - |
| `getCast.responseStream` | ``false`` | - |
| `getCastsByFid` | { `path`: ``"/HubService/GetCastsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getCastsByFid.path` | ``"/HubService/GetCastsByFid"`` | - |
| `getCastsByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) | - |
| `getCastsByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` | - |
| `getCastsByFid.requestStream` | ``false`` | - |
| `getCastsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getCastsByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getCastsByFid.responseStream` | ``false`` | - |
| `getCastsByMention` | { `path`: ``"/HubService/GetCastsByMention"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getCastsByMention.path` | ``"/HubService/GetCastsByMention"`` | - |
| `getCastsByMention.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) | - |
| `getCastsByMention.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` | - |
| `getCastsByMention.requestStream` | ``false`` | - |
| `getCastsByMention.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getCastsByMention.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getCastsByMention.responseStream` | ``false`` | - |
| `getCastsByParent` | { `path`: ``"/HubService/GetCastsByParent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`CastId`](js_src.protobufs.md#castid) ; `requestSerialize`: (`value`: [`CastId`](js_src.protobufs.md#castid)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getCastsByParent.path` | ``"/HubService/GetCastsByParent"`` | - |
| `getCastsByParent.requestDeserialize` | (`value`: `Buffer`) => [`CastId`](js_src.protobufs.md#castid) | - |
| `getCastsByParent.requestSerialize` | (`value`: [`CastId`](js_src.protobufs.md#castid)) => `Buffer` | - |
| `getCastsByParent.requestStream` | ``false`` | - |
| `getCastsByParent.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getCastsByParent.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getCastsByParent.responseStream` | ``false`` | - |
| `getFids` | { `path`: ``"/HubService/GetFids"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](js_src.protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](js_src.protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`FidsResponse`](js_src.protobufs.md#fidsresponse) ; `responseSerialize`: (`value`: [`FidsResponse`](js_src.protobufs.md#fidsresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getFids.path` | ``"/HubService/GetFids"`` | - |
| `getFids.requestDeserialize` | (`value`: `Buffer`) => [`Empty`](js_src.protobufs.md#empty) | - |
| `getFids.requestSerialize` | (`value`: [`Empty`](js_src.protobufs.md#empty)) => `Buffer` | - |
| `getFids.requestStream` | ``false`` | - |
| `getFids.responseDeserialize` | (`value`: `Buffer`) => [`FidsResponse`](js_src.protobufs.md#fidsresponse) | - |
| `getFids.responseSerialize` | (`value`: [`FidsResponse`](js_src.protobufs.md#fidsresponse)) => `Buffer` | - |
| `getFids.responseStream` | ``false`` | - |
| `getIdRegistryEvent` | { `path`: ``"/HubService/GetIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getIdRegistryEvent.path` | ``"/HubService/GetIdRegistryEvent"`` | - |
| `getIdRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) | - |
| `getIdRegistryEvent.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` | - |
| `getIdRegistryEvent.requestStream` | ``false`` | - |
| `getIdRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) | - |
| `getIdRegistryEvent.responseSerialize` | (`value`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)) => `Buffer` | - |
| `getIdRegistryEvent.responseStream` | ``false`` | - |
| `getInfo` | { `path`: ``"/HubService/GetInfo"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Empty`](js_src.protobufs.md#empty) ; `requestSerialize`: (`value`: [`Empty`](js_src.protobufs.md#empty)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`HubInfoResponse`](js_src.protobufs.md#hubinforesponse) ; `responseSerialize`: (`value`: [`HubInfoResponse`](js_src.protobufs.md#hubinforesponse)) => `Buffer` ; `responseStream`: ``false``  } | Sync Methods |
| `getInfo.path` | ``"/HubService/GetInfo"`` | - |
| `getInfo.requestDeserialize` | (`value`: `Buffer`) => [`Empty`](js_src.protobufs.md#empty) | - |
| `getInfo.requestSerialize` | (`value`: [`Empty`](js_src.protobufs.md#empty)) => `Buffer` | - |
| `getInfo.requestStream` | ``false`` | - |
| `getInfo.responseDeserialize` | (`value`: `Buffer`) => [`HubInfoResponse`](js_src.protobufs.md#hubinforesponse) | - |
| `getInfo.responseSerialize` | (`value`: [`HubInfoResponse`](js_src.protobufs.md#hubinforesponse)) => `Buffer` | - |
| `getInfo.responseStream` | ``false`` | - |
| `getNameRegistryEvent` | { `path`: ``"/HubService/GetNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEventRequest`](js_src.protobufs.md#nameregistryeventrequest) ; `requestSerialize`: (`value`: [`NameRegistryEventRequest`](js_src.protobufs.md#nameregistryeventrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getNameRegistryEvent.path` | ``"/HubService/GetNameRegistryEvent"`` | - |
| `getNameRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`NameRegistryEventRequest`](js_src.protobufs.md#nameregistryeventrequest) | - |
| `getNameRegistryEvent.requestSerialize` | (`value`: [`NameRegistryEventRequest`](js_src.protobufs.md#nameregistryeventrequest)) => `Buffer` | - |
| `getNameRegistryEvent.requestStream` | ``false`` | - |
| `getNameRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) | - |
| `getNameRegistryEvent.responseSerialize` | (`value`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)) => `Buffer` | - |
| `getNameRegistryEvent.responseStream` | ``false`` | - |
| `getReaction` | { `path`: ``"/HubService/GetReaction"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionRequest`](js_src.protobufs.md#reactionrequest) ; `requestSerialize`: (`value`: [`ReactionRequest`](js_src.protobufs.md#reactionrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } | Reactions |
| `getReaction.path` | ``"/HubService/GetReaction"`` | - |
| `getReaction.requestDeserialize` | (`value`: `Buffer`) => [`ReactionRequest`](js_src.protobufs.md#reactionrequest) | - |
| `getReaction.requestSerialize` | (`value`: [`ReactionRequest`](js_src.protobufs.md#reactionrequest)) => `Buffer` | - |
| `getReaction.requestStream` | ``false`` | - |
| `getReaction.responseDeserialize` | (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) | - |
| `getReaction.responseSerialize` | (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` | - |
| `getReaction.responseStream` | ``false`` | - |
| `getReactionsByCast` | { `path`: ``"/HubService/GetReactionsByCast"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByCastRequest`](js_src.protobufs.md#reactionsbycastrequest) ; `requestSerialize`: (`value`: [`ReactionsByCastRequest`](js_src.protobufs.md#reactionsbycastrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getReactionsByCast.path` | ``"/HubService/GetReactionsByCast"`` | - |
| `getReactionsByCast.requestDeserialize` | (`value`: `Buffer`) => [`ReactionsByCastRequest`](js_src.protobufs.md#reactionsbycastrequest) | - |
| `getReactionsByCast.requestSerialize` | (`value`: [`ReactionsByCastRequest`](js_src.protobufs.md#reactionsbycastrequest)) => `Buffer` | - |
| `getReactionsByCast.requestStream` | ``false`` | - |
| `getReactionsByCast.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getReactionsByCast.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getReactionsByCast.responseStream` | ``false`` | - |
| `getReactionsByFid` | { `path`: ``"/HubService/GetReactionsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`ReactionsByFidRequest`](js_src.protobufs.md#reactionsbyfidrequest) ; `requestSerialize`: (`value`: [`ReactionsByFidRequest`](js_src.protobufs.md#reactionsbyfidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getReactionsByFid.path` | ``"/HubService/GetReactionsByFid"`` | - |
| `getReactionsByFid.requestDeserialize` | (`value`: `Buffer`) => [`ReactionsByFidRequest`](js_src.protobufs.md#reactionsbyfidrequest) | - |
| `getReactionsByFid.requestSerialize` | (`value`: [`ReactionsByFidRequest`](js_src.protobufs.md#reactionsbyfidrequest)) => `Buffer` | - |
| `getReactionsByFid.requestStream` | ``false`` | - |
| `getReactionsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getReactionsByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getReactionsByFid.responseStream` | ``false`` | - |
| `getSigner` | { `path`: ``"/HubService/GetSigner"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SignerRequest`](js_src.protobufs.md#signerrequest) ; `requestSerialize`: (`value`: [`SignerRequest`](js_src.protobufs.md#signerrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } | Signer |
| `getSigner.path` | ``"/HubService/GetSigner"`` | - |
| `getSigner.requestDeserialize` | (`value`: `Buffer`) => [`SignerRequest`](js_src.protobufs.md#signerrequest) | - |
| `getSigner.requestSerialize` | (`value`: [`SignerRequest`](js_src.protobufs.md#signerrequest)) => `Buffer` | - |
| `getSigner.requestStream` | ``false`` | - |
| `getSigner.responseDeserialize` | (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) | - |
| `getSigner.responseSerialize` | (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` | - |
| `getSigner.responseStream` | ``false`` | - |
| `getSignersByFid` | { `path`: ``"/HubService/GetSignersByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getSignersByFid.path` | ``"/HubService/GetSignersByFid"`` | - |
| `getSignersByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) | - |
| `getSignersByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` | - |
| `getSignersByFid.requestStream` | ``false`` | - |
| `getSignersByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getSignersByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getSignersByFid.responseStream` | ``false`` | - |
| `getSyncMetadataByPrefix` | { `path`: ``"/HubService/GetSyncMetadataByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeMetadataResponse`](js_src.protobufs.md#trienodemetadataresponse) ; `responseSerialize`: (`value`: [`TrieNodeMetadataResponse`](js_src.protobufs.md#trienodemetadataresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getSyncMetadataByPrefix.path` | ``"/HubService/GetSyncMetadataByPrefix"`` | - |
| `getSyncMetadataByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) | - |
| `getSyncMetadataByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix)) => `Buffer` | - |
| `getSyncMetadataByPrefix.requestStream` | ``false`` | - |
| `getSyncMetadataByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`TrieNodeMetadataResponse`](js_src.protobufs.md#trienodemetadataresponse) | - |
| `getSyncMetadataByPrefix.responseSerialize` | (`value`: [`TrieNodeMetadataResponse`](js_src.protobufs.md#trienodemetadataresponse)) => `Buffer` | - |
| `getSyncMetadataByPrefix.responseStream` | ``false`` | - |
| `getSyncSnapshotByPrefix` | { `path`: ``"/HubService/GetSyncSnapshotByPrefix"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) ; `requestSerialize`: (`value`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`TrieNodeSnapshotResponse`](js_src.protobufs.md#trienodesnapshotresponse) ; `responseSerialize`: (`value`: [`TrieNodeSnapshotResponse`](js_src.protobufs.md#trienodesnapshotresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getSyncSnapshotByPrefix.path` | ``"/HubService/GetSyncSnapshotByPrefix"`` | - |
| `getSyncSnapshotByPrefix.requestDeserialize` | (`value`: `Buffer`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) | - |
| `getSyncSnapshotByPrefix.requestSerialize` | (`value`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix)) => `Buffer` | - |
| `getSyncSnapshotByPrefix.requestStream` | ``false`` | - |
| `getSyncSnapshotByPrefix.responseDeserialize` | (`value`: `Buffer`) => [`TrieNodeSnapshotResponse`](js_src.protobufs.md#trienodesnapshotresponse) | - |
| `getSyncSnapshotByPrefix.responseSerialize` | (`value`: [`TrieNodeSnapshotResponse`](js_src.protobufs.md#trienodesnapshotresponse)) => `Buffer` | - |
| `getSyncSnapshotByPrefix.responseStream` | ``false`` | - |
| `getUserData` | { `path`: ``"/HubService/GetUserData"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`UserDataRequest`](js_src.protobufs.md#userdatarequest) ; `requestSerialize`: (`value`: [`UserDataRequest`](js_src.protobufs.md#userdatarequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } | User Data |
| `getUserData.path` | ``"/HubService/GetUserData"`` | - |
| `getUserData.requestDeserialize` | (`value`: `Buffer`) => [`UserDataRequest`](js_src.protobufs.md#userdatarequest) | - |
| `getUserData.requestSerialize` | (`value`: [`UserDataRequest`](js_src.protobufs.md#userdatarequest)) => `Buffer` | - |
| `getUserData.requestStream` | ``false`` | - |
| `getUserData.responseDeserialize` | (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) | - |
| `getUserData.responseSerialize` | (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` | - |
| `getUserData.responseStream` | ``false`` | - |
| `getUserDataByFid` | { `path`: ``"/HubService/GetUserDataByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getUserDataByFid.path` | ``"/HubService/GetUserDataByFid"`` | - |
| `getUserDataByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) | - |
| `getUserDataByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` | - |
| `getUserDataByFid.requestStream` | ``false`` | - |
| `getUserDataByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getUserDataByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getUserDataByFid.responseStream` | ``false`` | - |
| `getVerification` | { `path`: ``"/HubService/GetVerification"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`VerificationRequest`](js_src.protobufs.md#verificationrequest) ; `requestSerialize`: (`value`: [`VerificationRequest`](js_src.protobufs.md#verificationrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } | Verifications |
| `getVerification.path` | ``"/HubService/GetVerification"`` | - |
| `getVerification.requestDeserialize` | (`value`: `Buffer`) => [`VerificationRequest`](js_src.protobufs.md#verificationrequest) | - |
| `getVerification.requestSerialize` | (`value`: [`VerificationRequest`](js_src.protobufs.md#verificationrequest)) => `Buffer` | - |
| `getVerification.requestStream` | ``false`` | - |
| `getVerification.responseDeserialize` | (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) | - |
| `getVerification.responseSerialize` | (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` | - |
| `getVerification.responseStream` | ``false`` | - |
| `getVerificationsByFid` | { `path`: ``"/HubService/GetVerificationsByFid"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) ; `requestSerialize`: (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) ; `responseSerialize`: (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `getVerificationsByFid.path` | ``"/HubService/GetVerificationsByFid"`` | - |
| `getVerificationsByFid.requestDeserialize` | (`value`: `Buffer`) => [`FidRequest`](js_src.protobufs.md#fidrequest) | - |
| `getVerificationsByFid.requestSerialize` | (`value`: [`FidRequest`](js_src.protobufs.md#fidrequest)) => `Buffer` | - |
| `getVerificationsByFid.requestStream` | ``false`` | - |
| `getVerificationsByFid.responseDeserialize` | (`value`: `Buffer`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) | - |
| `getVerificationsByFid.responseSerialize` | (`value`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `Buffer` | - |
| `getVerificationsByFid.responseStream` | ``false`` | - |
| `submitIdRegistryEvent` | { `path`: ``"/HubService/SubmitIdRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) ; `requestSerialize`: (`value`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) ; `responseSerialize`: (`value`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `submitIdRegistryEvent.path` | ``"/HubService/SubmitIdRegistryEvent"`` | - |
| `submitIdRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) | - |
| `submitIdRegistryEvent.requestSerialize` | (`value`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)) => `Buffer` | - |
| `submitIdRegistryEvent.requestStream` | ``false`` | - |
| `submitIdRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) | - |
| `submitIdRegistryEvent.responseSerialize` | (`value`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)) => `Buffer` | - |
| `submitIdRegistryEvent.responseStream` | ``false`` | - |
| `submitMessage` | { `path`: ``"/HubService/SubmitMessage"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `requestSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) ; `responseSerialize`: (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` ; `responseStream`: ``false``  } | Submit Methods |
| `submitMessage.path` | ``"/HubService/SubmitMessage"`` | - |
| `submitMessage.requestDeserialize` | (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) | - |
| `submitMessage.requestSerialize` | (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` | - |
| `submitMessage.requestStream` | ``false`` | - |
| `submitMessage.responseDeserialize` | (`value`: `Buffer`) => [`Message`](js_src.protobufs.md#message) | - |
| `submitMessage.responseSerialize` | (`value`: [`Message`](js_src.protobufs.md#message)) => `Buffer` | - |
| `submitMessage.responseStream` | ``false`` | - |
| `submitNameRegistryEvent` | { `path`: ``"/HubService/SubmitNameRegistryEvent"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) ; `requestSerialize`: (`value`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) ; `responseSerialize`: (`value`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)) => `Buffer` ; `responseStream`: ``false``  } | - |
| `submitNameRegistryEvent.path` | ``"/HubService/SubmitNameRegistryEvent"`` | - |
| `submitNameRegistryEvent.requestDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) | - |
| `submitNameRegistryEvent.requestSerialize` | (`value`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)) => `Buffer` | - |
| `submitNameRegistryEvent.requestStream` | ``false`` | - |
| `submitNameRegistryEvent.responseDeserialize` | (`value`: `Buffer`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) | - |
| `submitNameRegistryEvent.responseSerialize` | (`value`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)) => `Buffer` | - |
| `submitNameRegistryEvent.responseStream` | ``false`` | - |
| `subscribe` | { `path`: ``"/HubService/Subscribe"`` ; `requestDeserialize`: (`value`: `Buffer`) => [`SubscribeRequest`](js_src.protobufs.md#subscriberequest) ; `requestSerialize`: (`value`: [`SubscribeRequest`](js_src.protobufs.md#subscriberequest)) => `Buffer` ; `requestStream`: ``false`` ; `responseDeserialize`: (`value`: `Buffer`) => [`EventResponse`](js_src.protobufs.md#eventresponse) ; `responseSerialize`: (`value`: [`EventResponse`](js_src.protobufs.md#eventresponse)) => `Buffer` ; `responseStream`: ``true``  } | Event Methods |
| `subscribe.path` | ``"/HubService/Subscribe"`` | - |
| `subscribe.requestDeserialize` | (`value`: `Buffer`) => [`SubscribeRequest`](js_src.protobufs.md#subscriberequest) | - |
| `subscribe.requestSerialize` | (`value`: [`SubscribeRequest`](js_src.protobufs.md#subscriberequest)) => `Buffer` | - |
| `subscribe.requestStream` | ``false`` | - |
| `subscribe.responseDeserialize` | (`value`: `Buffer`) => [`EventResponse`](js_src.protobufs.md#eventresponse) | - |
| `subscribe.responseSerialize` | (`value`: [`EventResponse`](js_src.protobufs.md#eventresponse)) => `Buffer` | - |
| `subscribe.responseStream` | ``true`` | - |

#### Defined in

protobufs/dist/index.d.ts:3694

protobufs/dist/index.d.ts:3695

___

### HubState

• **HubState**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`HubState`](js_src.protobufs.md#hubstate) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`HubState`](js_src.protobufs.md#hubstate) |
| `encode` | (`message`: [`HubState`](js_src.protobufs.md#hubstate), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`HubState`](js_src.protobufs.md#hubstate) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`HubState`](js_src.protobufs.md#hubstate) |
| `toJSON` | (`message`: [`HubState`](js_src.protobufs.md#hubstate)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:4945

protobufs/dist/index.d.ts:4948

___

### IdRegistryEvent

• **IdRegistryEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) |
| `encode` | (`message`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent) |
| `toJSON` | (`message`: [`IdRegistryEvent`](js_src.protobufs.md#idregistryevent)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:82

protobufs/dist/index.d.ts:92

___

### Message

• **Message**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`Message`](js_src.protobufs.md#message) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`Message`](js_src.protobufs.md#message) |
| `encode` | (`message`: [`Message`](js_src.protobufs.md#message), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`Message`](js_src.protobufs.md#message) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`Message`](js_src.protobufs.md#message) |
| `toJSON` | (`message`: [`Message`](js_src.protobufs.md#message)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:716

protobufs/dist/index.d.ts:724

___

### MessageData

• **MessageData**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`MessageData`](js_src.protobufs.md#messagedata) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`MessageData`](js_src.protobufs.md#messagedata) |
| `encode` | (`message`: [`MessageData`](js_src.protobufs.md#messagedata), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`MessageData`](js_src.protobufs.md#messagedata) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`MessageData`](js_src.protobufs.md#messagedata) |
| `toJSON` | (`message`: [`MessageData`](js_src.protobufs.md#messagedata)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:450

protobufs/dist/index.d.ts:464

___

### MessagesResponse

• **MessagesResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `encode` | (`message`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`MessagesResponse`](js_src.protobufs.md#messagesresponse) |
| `toJSON` | (`message`: [`MessagesResponse`](js_src.protobufs.md#messagesresponse)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:2789

protobufs/dist/index.d.ts:2792

___

### NameRegistryEvent

• **NameRegistryEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) |
| `encode` | (`message`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent) |
| `toJSON` | (`message`: [`NameRegistryEvent`](js_src.protobufs.md#nameregistryevent)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:14

protobufs/dist/index.d.ts:25

___

### NameRegistryEventRequest

• **NameRegistryEventRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`NameRegistryEventRequest`](js_src.protobufs.md#nameregistryeventrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`NameRegistryEventRequest`](js_src.protobufs.md#nameregistryeventrequest) |
| `encode` | (`message`: [`NameRegistryEventRequest`](js_src.protobufs.md#nameregistryeventrequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`NameRegistryEventRequest`](js_src.protobufs.md#nameregistryeventrequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`NameRegistryEventRequest`](js_src.protobufs.md#nameregistryeventrequest) |
| `toJSON` | (`message`: [`NameRegistryEventRequest`](js_src.protobufs.md#nameregistryeventrequest)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:3627

protobufs/dist/index.d.ts:3630

___

### ReactionBody

• **ReactionBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`ReactionBody`](js_src.protobufs.md#reactionbody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`ReactionBody`](js_src.protobufs.md#reactionbody) |
| `encode` | (`message`: [`ReactionBody`](js_src.protobufs.md#reactionbody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`ReactionBody`](js_src.protobufs.md#reactionbody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`ReactionBody`](js_src.protobufs.md#reactionbody) |
| `toJSON` | (`message`: [`ReactionBody`](js_src.protobufs.md#reactionbody)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:298

protobufs/dist/index.d.ts:302

___

### ReactionRequest

• **ReactionRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`ReactionRequest`](js_src.protobufs.md#reactionrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`ReactionRequest`](js_src.protobufs.md#reactionrequest) |
| `encode` | (`message`: [`ReactionRequest`](js_src.protobufs.md#reactionrequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`ReactionRequest`](js_src.protobufs.md#reactionrequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`ReactionRequest`](js_src.protobufs.md#reactionrequest) |
| `toJSON` | (`message`: [`ReactionRequest`](js_src.protobufs.md#reactionrequest)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:3466

protobufs/dist/index.d.ts:3471

___

### ReactionsByCastRequest

• **ReactionsByCastRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`ReactionsByCastRequest`](js_src.protobufs.md#reactionsbycastrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`ReactionsByCastRequest`](js_src.protobufs.md#reactionsbycastrequest) |
| `encode` | (`message`: [`ReactionsByCastRequest`](js_src.protobufs.md#reactionsbycastrequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`ReactionsByCastRequest`](js_src.protobufs.md#reactionsbycastrequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`ReactionsByCastRequest`](js_src.protobufs.md#reactionsbycastrequest) |
| `toJSON` | (`message`: [`ReactionsByCastRequest`](js_src.protobufs.md#reactionsbycastrequest)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:3537

protobufs/dist/index.d.ts:3541

___

### ReactionsByFidRequest

• **ReactionsByFidRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`ReactionsByFidRequest`](js_src.protobufs.md#reactionsbyfidrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`ReactionsByFidRequest`](js_src.protobufs.md#reactionsbyfidrequest) |
| `encode` | (`message`: [`ReactionsByFidRequest`](js_src.protobufs.md#reactionsbyfidrequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`ReactionsByFidRequest`](js_src.protobufs.md#reactionsbyfidrequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`ReactionsByFidRequest`](js_src.protobufs.md#reactionsbyfidrequest) |
| `toJSON` | (`message`: [`ReactionsByFidRequest`](js_src.protobufs.md#reactionsbyfidrequest)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:3513

protobufs/dist/index.d.ts:3517

___

### RevokeSignerJobPayload

• **RevokeSignerJobPayload**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`RevokeSignerJobPayload`](js_src.protobufs.md#revokesignerjobpayload) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`RevokeSignerJobPayload`](js_src.protobufs.md#revokesignerjobpayload) |
| `encode` | (`message`: [`RevokeSignerJobPayload`](js_src.protobufs.md#revokesignerjobpayload), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`RevokeSignerJobPayload`](js_src.protobufs.md#revokesignerjobpayload) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`RevokeSignerJobPayload`](js_src.protobufs.md#revokesignerjobpayload) |
| `toJSON` | (`message`: [`RevokeSignerJobPayload`](js_src.protobufs.md#revokesignerjobpayload)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:4965

protobufs/dist/index.d.ts:4969

___

### SignerBody

• **SignerBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`SignerBody`](js_src.protobufs.md#signerbody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`SignerBody`](js_src.protobufs.md#signerbody) |
| `encode` | (`message`: [`SignerBody`](js_src.protobufs.md#signerbody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`SignerBody`](js_src.protobufs.md#signerbody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`SignerBody`](js_src.protobufs.md#signerbody) |
| `toJSON` | (`message`: [`SignerBody`](js_src.protobufs.md#signerbody)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:407

protobufs/dist/index.d.ts:410

___

### SignerRequest

• **SignerRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`SignerRequest`](js_src.protobufs.md#signerrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`SignerRequest`](js_src.protobufs.md#signerrequest) |
| `encode` | (`message`: [`SignerRequest`](js_src.protobufs.md#signerrequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`SignerRequest`](js_src.protobufs.md#signerrequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`SignerRequest`](js_src.protobufs.md#signerrequest) |
| `toJSON` | (`message`: [`SignerRequest`](js_src.protobufs.md#signerrequest)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:3670

protobufs/dist/index.d.ts:3674

___

### SubscribeRequest

• **SubscribeRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`SubscribeRequest`](js_src.protobufs.md#subscriberequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`SubscribeRequest`](js_src.protobufs.md#subscriberequest) |
| `encode` | (`message`: [`SubscribeRequest`](js_src.protobufs.md#subscriberequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`SubscribeRequest`](js_src.protobufs.md#subscriberequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`SubscribeRequest`](js_src.protobufs.md#subscriberequest) |
| `toJSON` | (`message`: [`SubscribeRequest`](js_src.protobufs.md#subscriberequest)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:2381

protobufs/dist/index.d.ts:2384

___

### SyncIds

• **SyncIds**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`SyncIds`](js_src.protobufs.md#syncids) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`SyncIds`](js_src.protobufs.md#syncids) |
| `encode` | (`message`: [`SyncIds`](js_src.protobufs.md#syncids), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`SyncIds`](js_src.protobufs.md#syncids) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`SyncIds`](js_src.protobufs.md#syncids) |
| `toJSON` | (`message`: [`SyncIds`](js_src.protobufs.md#syncids)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:2732

protobufs/dist/index.d.ts:2735

___

### TrieNodeMetadataResponse

• **TrieNodeMetadataResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`TrieNodeMetadataResponse`](js_src.protobufs.md#trienodemetadataresponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`TrieNodeMetadataResponse`](js_src.protobufs.md#trienodemetadataresponse) |
| `encode` | (`message`: [`TrieNodeMetadataResponse`](js_src.protobufs.md#trienodemetadataresponse), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`TrieNodeMetadataResponse`](js_src.protobufs.md#trienodemetadataresponse) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`TrieNodeMetadataResponse`](js_src.protobufs.md#trienodemetadataresponse) |
| `toJSON` | (`message`: [`TrieNodeMetadataResponse`](js_src.protobufs.md#trienodemetadataresponse)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:2435

protobufs/dist/index.d.ts:2441

___

### TrieNodePrefix

• **TrieNodePrefix**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) |
| `encode` | (`message`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix) |
| `toJSON` | (`message`: [`TrieNodePrefix`](js_src.protobufs.md#trienodeprefix)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:2713

protobufs/dist/index.d.ts:2716

___

### TrieNodeSnapshotResponse

• **TrieNodeSnapshotResponse**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`TrieNodeSnapshotResponse`](js_src.protobufs.md#trienodesnapshotresponse) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`TrieNodeSnapshotResponse`](js_src.protobufs.md#trienodesnapshotresponse) |
| `encode` | (`message`: [`TrieNodeSnapshotResponse`](js_src.protobufs.md#trienodesnapshotresponse), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`TrieNodeSnapshotResponse`](js_src.protobufs.md#trienodesnapshotresponse) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`TrieNodeSnapshotResponse`](js_src.protobufs.md#trienodesnapshotresponse) |
| `toJSON` | (`message`: [`TrieNodeSnapshotResponse`](js_src.protobufs.md#trienodesnapshotresponse)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:2679

protobufs/dist/index.d.ts:2685

___

### UpdateNameRegistryEventExpiryJobPayload

• **UpdateNameRegistryEventExpiryJobPayload**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`UpdateNameRegistryEventExpiryJobPayload`](js_src.protobufs.md#updatenameregistryeventexpiryjobpayload) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`UpdateNameRegistryEventExpiryJobPayload`](js_src.protobufs.md#updatenameregistryeventexpiryjobpayload) |
| `encode` | (`message`: [`UpdateNameRegistryEventExpiryJobPayload`](js_src.protobufs.md#updatenameregistryeventexpiryjobpayload), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`UpdateNameRegistryEventExpiryJobPayload`](js_src.protobufs.md#updatenameregistryeventexpiryjobpayload) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`UpdateNameRegistryEventExpiryJobPayload`](js_src.protobufs.md#updatenameregistryeventexpiryjobpayload) |
| `toJSON` | (`message`: [`UpdateNameRegistryEventExpiryJobPayload`](js_src.protobufs.md#updatenameregistryeventexpiryjobpayload)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:4989

protobufs/dist/index.d.ts:4992

___

### UserDataBody

• **UserDataBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`UserDataBody`](js_src.protobufs.md#userdatabody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`UserDataBody`](js_src.protobufs.md#userdatabody) |
| `encode` | (`message`: [`UserDataBody`](js_src.protobufs.md#userdatabody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`UserDataBody`](js_src.protobufs.md#userdatabody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`UserDataBody`](js_src.protobufs.md#userdatabody) |
| `toJSON` | (`message`: [`UserDataBody`](js_src.protobufs.md#userdatabody)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:426

protobufs/dist/index.d.ts:430

___

### UserDataRequest

• **UserDataRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`UserDataRequest`](js_src.protobufs.md#userdatarequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`UserDataRequest`](js_src.protobufs.md#userdatarequest) |
| `encode` | (`message`: [`UserDataRequest`](js_src.protobufs.md#userdatarequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`UserDataRequest`](js_src.protobufs.md#userdatarequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`UserDataRequest`](js_src.protobufs.md#userdatarequest) |
| `toJSON` | (`message`: [`UserDataRequest`](js_src.protobufs.md#userdatarequest)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:3603

protobufs/dist/index.d.ts:3607

___

### VerificationAddEthAddressBody

• **VerificationAddEthAddressBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`VerificationAddEthAddressBody`](js_src.protobufs.md#verificationaddethaddressbody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`VerificationAddEthAddressBody`](js_src.protobufs.md#verificationaddethaddressbody) |
| `encode` | (`message`: [`VerificationAddEthAddressBody`](js_src.protobufs.md#verificationaddethaddressbody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`VerificationAddEthAddressBody`](js_src.protobufs.md#verificationaddethaddressbody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`VerificationAddEthAddressBody`](js_src.protobufs.md#verificationaddethaddressbody) |
| `toJSON` | (`message`: [`VerificationAddEthAddressBody`](js_src.protobufs.md#verificationaddethaddressbody)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:359

protobufs/dist/index.d.ts:364

___

### VerificationRemoveBody

• **VerificationRemoveBody**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`VerificationRemoveBody`](js_src.protobufs.md#verificationremovebody) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`VerificationRemoveBody`](js_src.protobufs.md#verificationremovebody) |
| `encode` | (`message`: [`VerificationRemoveBody`](js_src.protobufs.md#verificationremovebody), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`VerificationRemoveBody`](js_src.protobufs.md#verificationremovebody) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`VerificationRemoveBody`](js_src.protobufs.md#verificationremovebody) |
| `toJSON` | (`message`: [`VerificationRemoveBody`](js_src.protobufs.md#verificationremovebody)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:388

protobufs/dist/index.d.ts:391

___

### VerificationRequest

• **VerificationRequest**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `create` | <I\>(`base?`: `I`) => [`VerificationRequest`](js_src.protobufs.md#verificationrequest) |
| `decode` | (`input`: `Reader` \| `Uint8Array`, `length?`: `number`) => [`VerificationRequest`](js_src.protobufs.md#verificationrequest) |
| `encode` | (`message`: [`VerificationRequest`](js_src.protobufs.md#verificationrequest), `writer?`: `Writer`) => `Writer` |
| `fromJSON` | (`object`: `any`) => [`VerificationRequest`](js_src.protobufs.md#verificationrequest) |
| `fromPartial` | <I_1\>(`object`: `I_1`) => [`VerificationRequest`](js_src.protobufs.md#verificationrequest) |
| `toJSON` | (`message`: [`VerificationRequest`](js_src.protobufs.md#verificationrequest)) => `unknown` |

#### Defined in

protobufs/dist/index.d.ts:3646

protobufs/dist/index.d.ts:3650

## Functions

### eventTypeFromJSON

▸ **eventTypeFromJSON**(`object`): [`EventType`](../enums/js_src.protobufs.EventType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`EventType`](../enums/js_src.protobufs.EventType.md)

#### Defined in

protobufs/dist/index.d.ts:1100

___

### eventTypeToJSON

▸ **eventTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`EventType`](../enums/js_src.protobufs.EventType.md) |

#### Returns

`string`

#### Defined in

protobufs/dist/index.d.ts:1101

___

### farcasterNetworkFromJSON

▸ **farcasterNetworkFromJSON**(`object`): [`FarcasterNetwork`](../enums/js_src.protobufs.FarcasterNetwork.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`FarcasterNetwork`](../enums/js_src.protobufs.FarcasterNetwork.md)

#### Defined in

protobufs/dist/index.d.ts:176

___

### farcasterNetworkToJSON

▸ **farcasterNetworkToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`FarcasterNetwork`](../enums/js_src.protobufs.FarcasterNetwork.md) |

#### Returns

`string`

#### Defined in

protobufs/dist/index.d.ts:177

___

### getClient

▸ **getClient**(`address`): [`HubServiceClient`](js_src.protobufs.md#hubserviceclient)

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Returns

[`HubServiceClient`](js_src.protobufs.md#hubserviceclient)

#### Defined in

protobufs/dist/index.d.ts:5157

___

### getServer

▸ **getServer**(): `Server`

#### Returns

`Server`

#### Defined in

protobufs/dist/index.d.ts:5156

___

### gossipVersionFromJSON

▸ **gossipVersionFromJSON**(`object`): [`GossipVersion`](../enums/js_src.protobufs.GossipVersion.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`GossipVersion`](../enums/js_src.protobufs.GossipVersion.md)

#### Defined in

protobufs/dist/index.d.ts:4181

___

### gossipVersionToJSON

▸ **gossipVersionToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`GossipVersion`](../enums/js_src.protobufs.GossipVersion.md) |

#### Returns

`string`

#### Defined in

protobufs/dist/index.d.ts:4182

___

### hashSchemeFromJSON

▸ **hashSchemeFromJSON**(`object`): [`HashScheme`](../enums/js_src.protobufs.HashScheme.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`HashScheme`](../enums/js_src.protobufs.HashScheme.md)

#### Defined in

protobufs/dist/index.d.ts:167

___

### hashSchemeToJSON

▸ **hashSchemeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`HashScheme`](../enums/js_src.protobufs.HashScheme.md) |

#### Returns

`string`

#### Defined in

protobufs/dist/index.d.ts:168

___

### idRegistryEventTypeFromJSON

▸ **idRegistryEventTypeFromJSON**(`object`): [`IdRegistryEventType`](../enums/js_src.protobufs.IdRegistryEventType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`IdRegistryEventType`](../enums/js_src.protobufs.IdRegistryEventType.md)

#### Defined in

protobufs/dist/index.d.ts:80

___

### idRegistryEventTypeToJSON

▸ **idRegistryEventTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`IdRegistryEventType`](../enums/js_src.protobufs.IdRegistryEventType.md) |

#### Returns

`string`

#### Defined in

protobufs/dist/index.d.ts:81

___

### isAmpAddData

▸ **isAmpAddData**(`data`): data is AmpAddData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](js_src.protobufs.md#messagedata) |

#### Returns

data is AmpAddData

#### Defined in

protobufs/dist/index.d.ts:5137

___

### isAmpAddMessage

▸ **isAmpAddMessage**(`message`): message is AmpAddMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](js_src.protobufs.md#message) |

#### Returns

message is AmpAddMessage

#### Defined in

protobufs/dist/index.d.ts:5138

___

### isAmpRemoveData

▸ **isAmpRemoveData**(`data`): data is AmpRemoveData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](js_src.protobufs.md#messagedata) |

#### Returns

data is AmpRemoveData

#### Defined in

protobufs/dist/index.d.ts:5139

___

### isAmpRemoveMessage

▸ **isAmpRemoveMessage**(`message`): message is AmpRemoveMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](js_src.protobufs.md#message) |

#### Returns

message is AmpRemoveMessage

#### Defined in

protobufs/dist/index.d.ts:5140

___

### isCastAddData

▸ **isCastAddData**(`data`): data is CastAddData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](js_src.protobufs.md#messagedata) |

#### Returns

data is CastAddData

#### Defined in

protobufs/dist/index.d.ts:5133

___

### isCastAddMessage

▸ **isCastAddMessage**(`message`): message is CastAddMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](js_src.protobufs.md#message) |

#### Returns

message is CastAddMessage

#### Defined in

protobufs/dist/index.d.ts:5134

___

### isCastRemoveData

▸ **isCastRemoveData**(`data`): data is CastRemoveData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](js_src.protobufs.md#messagedata) |

#### Returns

data is CastRemoveData

#### Defined in

protobufs/dist/index.d.ts:5135

___

### isCastRemoveMessage

▸ **isCastRemoveMessage**(`message`): message is CastRemoveMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](js_src.protobufs.md#message) |

#### Returns

message is CastRemoveMessage

#### Defined in

protobufs/dist/index.d.ts:5136

___

### isReactionAddData

▸ **isReactionAddData**(`data`): data is ReactionAddData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](js_src.protobufs.md#messagedata) |

#### Returns

data is ReactionAddData

#### Defined in

protobufs/dist/index.d.ts:5141

___

### isReactionAddMessage

▸ **isReactionAddMessage**(`message`): message is ReactionAddMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](js_src.protobufs.md#message) |

#### Returns

message is ReactionAddMessage

#### Defined in

protobufs/dist/index.d.ts:5142

___

### isReactionRemoveData

▸ **isReactionRemoveData**(`data`): data is ReactionRemoveData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](js_src.protobufs.md#messagedata) |

#### Returns

data is ReactionRemoveData

#### Defined in

protobufs/dist/index.d.ts:5143

___

### isReactionRemoveMessage

▸ **isReactionRemoveMessage**(`message`): message is ReactionRemoveMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](js_src.protobufs.md#message) |

#### Returns

message is ReactionRemoveMessage

#### Defined in

protobufs/dist/index.d.ts:5144

___

### isSignerAddData

▸ **isSignerAddData**(`data`): data is SignerAddData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](js_src.protobufs.md#messagedata) |

#### Returns

data is SignerAddData

#### Defined in

protobufs/dist/index.d.ts:5149

___

### isSignerAddMessage

▸ **isSignerAddMessage**(`message`): message is SignerAddMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](js_src.protobufs.md#message) |

#### Returns

message is SignerAddMessage

#### Defined in

protobufs/dist/index.d.ts:5150

___

### isSignerRemoveData

▸ **isSignerRemoveData**(`data`): data is SignerRemoveData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](js_src.protobufs.md#messagedata) |

#### Returns

data is SignerRemoveData

#### Defined in

protobufs/dist/index.d.ts:5151

___

### isSignerRemoveMessage

▸ **isSignerRemoveMessage**(`message`): message is SignerRemoveMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](js_src.protobufs.md#message) |

#### Returns

message is SignerRemoveMessage

#### Defined in

protobufs/dist/index.d.ts:5152

___

### isUserDataAddData

▸ **isUserDataAddData**(`data`): data is UserDataAddData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](js_src.protobufs.md#messagedata) |

#### Returns

data is UserDataAddData

#### Defined in

protobufs/dist/index.d.ts:5153

___

### isUserDataAddMessage

▸ **isUserDataAddMessage**(`message`): message is UserDataAddMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](js_src.protobufs.md#message) |

#### Returns

message is UserDataAddMessage

#### Defined in

protobufs/dist/index.d.ts:5154

___

### isVerificationAddEthAddressData

▸ **isVerificationAddEthAddressData**(`data`): data is VerificationAddEthAddressData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](js_src.protobufs.md#messagedata) |

#### Returns

data is VerificationAddEthAddressData

#### Defined in

protobufs/dist/index.d.ts:5145

___

### isVerificationAddEthAddressMessage

▸ **isVerificationAddEthAddressMessage**(`message`): message is VerificationAddEthAddressMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](js_src.protobufs.md#message) |

#### Returns

message is VerificationAddEthAddressMessage

#### Defined in

protobufs/dist/index.d.ts:5146

___

### isVerificationRemoveData

▸ **isVerificationRemoveData**(`data`): data is VerificationRemoveData

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | [`MessageData`](js_src.protobufs.md#messagedata) |

#### Returns

data is VerificationRemoveData

#### Defined in

protobufs/dist/index.d.ts:5147

___

### isVerificationRemoveMessage

▸ **isVerificationRemoveMessage**(`message`): message is VerificationRemoveMessage

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | [`Message`](js_src.protobufs.md#message) |

#### Returns

message is VerificationRemoveMessage

#### Defined in

protobufs/dist/index.d.ts:5148

___

### messageTypeFromJSON

▸ **messageTypeFromJSON**(`object`): [`MessageType`](../enums/js_src.protobufs.MessageType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`MessageType`](../enums/js_src.protobufs.MessageType.md)

#### Defined in

protobufs/dist/index.d.ts:152

___

### messageTypeToJSON

▸ **messageTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`MessageType`](../enums/js_src.protobufs.MessageType.md) |

#### Returns

`string`

#### Defined in

protobufs/dist/index.d.ts:153

___

### nameRegistryEventTypeFromJSON

▸ **nameRegistryEventTypeFromJSON**(`object`): [`NameRegistryEventType`](../enums/js_src.protobufs.NameRegistryEventType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`NameRegistryEventType`](../enums/js_src.protobufs.NameRegistryEventType.md)

#### Defined in

protobufs/dist/index.d.ts:12

___

### nameRegistryEventTypeToJSON

▸ **nameRegistryEventTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`NameRegistryEventType`](../enums/js_src.protobufs.NameRegistryEventType.md) |

#### Returns

`string`

#### Defined in

protobufs/dist/index.d.ts:13

___

### reactionTypeFromJSON

▸ **reactionTypeFromJSON**(`object`): [`ReactionType`](../enums/js_src.protobufs.ReactionType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`ReactionType`](../enums/js_src.protobufs.ReactionType.md)

#### Defined in

protobufs/dist/index.d.ts:184

___

### reactionTypeToJSON

▸ **reactionTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`ReactionType`](../enums/js_src.protobufs.ReactionType.md) |

#### Returns

`string`

#### Defined in

protobufs/dist/index.d.ts:185

___

### signatureSchemeFromJSON

▸ **signatureSchemeFromJSON**(`object`): [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md)

#### Defined in

protobufs/dist/index.d.ts:160

___

### signatureSchemeToJSON

▸ **signatureSchemeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`SignatureScheme`](../enums/js_src.protobufs.SignatureScheme.md) |

#### Returns

`string`

#### Defined in

protobufs/dist/index.d.ts:161

___

### userDataTypeFromJSON

▸ **userDataTypeFromJSON**(`object`): [`UserDataType`](../enums/js_src.protobufs.UserDataType.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | `any` |

#### Returns

[`UserDataType`](../enums/js_src.protobufs.UserDataType.md)

#### Defined in

protobufs/dist/index.d.ts:196

___

### userDataTypeToJSON

▸ **userDataTypeToJSON**(`object`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `object` | [`UserDataType`](../enums/js_src.protobufs.UserDataType.md) |

#### Returns

`string`

#### Defined in

protobufs/dist/index.d.ts:197
