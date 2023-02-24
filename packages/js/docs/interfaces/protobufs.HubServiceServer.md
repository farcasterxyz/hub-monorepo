[@farcaster/js](../README.md) / [Exports](../modules.md) / [protobufs](../modules/protobufs.md) / HubServiceServer

# Interface: HubServiceServer

[protobufs](../modules/protobufs.md).HubServiceServer

## Hierarchy

- `UntypedServiceImplementation`

  ↳ **`HubServiceServer`**

## Table of contents

### Properties

- [getAllAmpMessagesByFid](protobufs.HubServiceServer.md#getallampmessagesbyfid)
- [getAllCastMessagesByFid](protobufs.HubServiceServer.md#getallcastmessagesbyfid)
- [getAllMessagesBySyncIds](protobufs.HubServiceServer.md#getallmessagesbysyncids)
- [getAllReactionMessagesByFid](protobufs.HubServiceServer.md#getallreactionmessagesbyfid)
- [getAllSignerMessagesByFid](protobufs.HubServiceServer.md#getallsignermessagesbyfid)
- [getAllSyncIdsByPrefix](protobufs.HubServiceServer.md#getallsyncidsbyprefix)
- [getAllUserDataMessagesByFid](protobufs.HubServiceServer.md#getalluserdatamessagesbyfid)
- [getAllVerificationMessagesByFid](protobufs.HubServiceServer.md#getallverificationmessagesbyfid)
- [getAmp](protobufs.HubServiceServer.md#getamp)
- [getAmpsByFid](protobufs.HubServiceServer.md#getampsbyfid)
- [getAmpsByUser](protobufs.HubServiceServer.md#getampsbyuser)
- [getCast](protobufs.HubServiceServer.md#getcast)
- [getCastsByFid](protobufs.HubServiceServer.md#getcastsbyfid)
- [getCastsByMention](protobufs.HubServiceServer.md#getcastsbymention)
- [getCastsByParent](protobufs.HubServiceServer.md#getcastsbyparent)
- [getFids](protobufs.HubServiceServer.md#getfids)
- [getIdRegistryEvent](protobufs.HubServiceServer.md#getidregistryevent)
- [getInfo](protobufs.HubServiceServer.md#getinfo)
- [getNameRegistryEvent](protobufs.HubServiceServer.md#getnameregistryevent)
- [getReaction](protobufs.HubServiceServer.md#getreaction)
- [getReactionsByCast](protobufs.HubServiceServer.md#getreactionsbycast)
- [getReactionsByFid](protobufs.HubServiceServer.md#getreactionsbyfid)
- [getSigner](protobufs.HubServiceServer.md#getsigner)
- [getSignersByFid](protobufs.HubServiceServer.md#getsignersbyfid)
- [getSyncMetadataByPrefix](protobufs.HubServiceServer.md#getsyncmetadatabyprefix)
- [getSyncSnapshotByPrefix](protobufs.HubServiceServer.md#getsyncsnapshotbyprefix)
- [getUserData](protobufs.HubServiceServer.md#getuserdata)
- [getUserDataByFid](protobufs.HubServiceServer.md#getuserdatabyfid)
- [getVerification](protobufs.HubServiceServer.md#getverification)
- [getVerificationsByFid](protobufs.HubServiceServer.md#getverificationsbyfid)
- [submitIdRegistryEvent](protobufs.HubServiceServer.md#submitidregistryevent)
- [submitMessage](protobufs.HubServiceServer.md#submitmessage)
- [submitNameRegistryEvent](protobufs.HubServiceServer.md#submitnameregistryevent)
- [subscribe](protobufs.HubServiceServer.md#subscribe)

## Properties

### getAllAmpMessagesByFid

• **getAllAmpMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

___

### getAllCastMessagesByFid

• **getAllCastMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

Bulk Methods

___

### getAllMessagesBySyncIds

• **getAllMessagesBySyncIds**: `handleUnaryCall`<[`SyncIds`](../modules/protobufs.md#syncids), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

___

### getAllReactionMessagesByFid

• **getAllReactionMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

___

### getAllSignerMessagesByFid

• **getAllSignerMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

___

### getAllSyncIdsByPrefix

• **getAllSyncIdsByPrefix**: `handleUnaryCall`<[`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix), [`SyncIds`](../modules/protobufs.md#syncids)\>

___

### getAllUserDataMessagesByFid

• **getAllUserDataMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

___

### getAllVerificationMessagesByFid

• **getAllVerificationMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

___

### getAmp

• **getAmp**: `handleUnaryCall`<[`AmpRequest`](../modules/protobufs.md#amprequest), [`Message`](../modules/protobufs.md#message)\>

Amps

___

### getAmpsByFid

• **getAmpsByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

___

### getAmpsByUser

• **getAmpsByUser**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

___

### getCast

• **getCast**: `handleUnaryCall`<[`CastId`](../modules/protobufs.md#castid), [`Message`](../modules/protobufs.md#message)\>

Casts

___

### getCastsByFid

• **getCastsByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

___

### getCastsByMention

• **getCastsByMention**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

___

### getCastsByParent

• **getCastsByParent**: `handleUnaryCall`<[`CastId`](../modules/protobufs.md#castid), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

___

### getFids

• **getFids**: `handleUnaryCall`<[`Empty`](../modules/protobufs.md#empty), [`FidsResponse`](../modules/protobufs.md#fidsresponse)\>

___

### getIdRegistryEvent

• **getIdRegistryEvent**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent)\>

___

### getInfo

• **getInfo**: `handleUnaryCall`<[`Empty`](../modules/protobufs.md#empty), [`HubInfoResponse`](../modules/protobufs.md#hubinforesponse)\>

Sync Methods

___

### getNameRegistryEvent

• **getNameRegistryEvent**: `handleUnaryCall`<[`NameRegistryEventRequest`](../modules/protobufs.md#nameregistryeventrequest), [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent)\>

___

### getReaction

• **getReaction**: `handleUnaryCall`<[`ReactionRequest`](../modules/protobufs.md#reactionrequest), [`Message`](../modules/protobufs.md#message)\>

Reactions

___

### getReactionsByCast

• **getReactionsByCast**: `handleUnaryCall`<[`ReactionsByCastRequest`](../modules/protobufs.md#reactionsbycastrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

___

### getReactionsByFid

• **getReactionsByFid**: `handleUnaryCall`<[`ReactionsByFidRequest`](../modules/protobufs.md#reactionsbyfidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

___

### getSigner

• **getSigner**: `handleUnaryCall`<[`SignerRequest`](../modules/protobufs.md#signerrequest), [`Message`](../modules/protobufs.md#message)\>

Signer

___

### getSignersByFid

• **getSignersByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

___

### getSyncMetadataByPrefix

• **getSyncMetadataByPrefix**: `handleUnaryCall`<[`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix), [`TrieNodeMetadataResponse`](../modules/protobufs.md#trienodemetadataresponse)\>

___

### getSyncSnapshotByPrefix

• **getSyncSnapshotByPrefix**: `handleUnaryCall`<[`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix), [`TrieNodeSnapshotResponse`](../modules/protobufs.md#trienodesnapshotresponse)\>

___

### getUserData

• **getUserData**: `handleUnaryCall`<[`UserDataRequest`](../modules/protobufs.md#userdatarequest), [`Message`](../modules/protobufs.md#message)\>

User Data

___

### getUserDataByFid

• **getUserDataByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

___

### getVerification

• **getVerification**: `handleUnaryCall`<[`VerificationRequest`](../modules/protobufs.md#verificationrequest), [`Message`](../modules/protobufs.md#message)\>

Verifications

___

### getVerificationsByFid

• **getVerificationsByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

___

### submitIdRegistryEvent

• **submitIdRegistryEvent**: `handleUnaryCall`<[`IdRegistryEvent`](../modules/protobufs.md#idregistryevent), [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent)\>

___

### submitMessage

• **submitMessage**: `handleUnaryCall`<[`Message`](../modules/protobufs.md#message), [`Message`](../modules/protobufs.md#message)\>

Submit Methods

___

### submitNameRegistryEvent

• **submitNameRegistryEvent**: `handleUnaryCall`<[`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent), [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent)\>

___

### subscribe

• **subscribe**: `handleServerStreamingCall`<[`SubscribeRequest`](../modules/protobufs.md#subscriberequest), [`EventResponse`](../modules/protobufs.md#eventresponse)\>

Event Methods
