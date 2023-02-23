[hubble](../README.md) / [Modules](../modules.md) / [js/src](../modules/js_src.md) / [protobufs](../modules/js_src.protobufs.md) / HubServiceServer

# Interface: HubServiceServer

[js/src](../modules/js_src.md).[protobufs](../modules/js_src.protobufs.md).HubServiceServer

## Hierarchy

- `UntypedServiceImplementation`

  ↳ **`HubServiceServer`**

## Table of contents

### Properties

- [getAllAmpMessagesByFid](js_src.protobufs.HubServiceServer.md#getallampmessagesbyfid)
- [getAllCastMessagesByFid](js_src.protobufs.HubServiceServer.md#getallcastmessagesbyfid)
- [getAllMessagesBySyncIds](js_src.protobufs.HubServiceServer.md#getallmessagesbysyncids)
- [getAllReactionMessagesByFid](js_src.protobufs.HubServiceServer.md#getallreactionmessagesbyfid)
- [getAllSignerMessagesByFid](js_src.protobufs.HubServiceServer.md#getallsignermessagesbyfid)
- [getAllSyncIdsByPrefix](js_src.protobufs.HubServiceServer.md#getallsyncidsbyprefix)
- [getAllUserDataMessagesByFid](js_src.protobufs.HubServiceServer.md#getalluserdatamessagesbyfid)
- [getAllVerificationMessagesByFid](js_src.protobufs.HubServiceServer.md#getallverificationmessagesbyfid)
- [getAmp](js_src.protobufs.HubServiceServer.md#getamp)
- [getAmpsByFid](js_src.protobufs.HubServiceServer.md#getampsbyfid)
- [getAmpsByUser](js_src.protobufs.HubServiceServer.md#getampsbyuser)
- [getCast](js_src.protobufs.HubServiceServer.md#getcast)
- [getCastsByFid](js_src.protobufs.HubServiceServer.md#getcastsbyfid)
- [getCastsByMention](js_src.protobufs.HubServiceServer.md#getcastsbymention)
- [getCastsByParent](js_src.protobufs.HubServiceServer.md#getcastsbyparent)
- [getFids](js_src.protobufs.HubServiceServer.md#getfids)
- [getIdRegistryEvent](js_src.protobufs.HubServiceServer.md#getidregistryevent)
- [getInfo](js_src.protobufs.HubServiceServer.md#getinfo)
- [getNameRegistryEvent](js_src.protobufs.HubServiceServer.md#getnameregistryevent)
- [getReaction](js_src.protobufs.HubServiceServer.md#getreaction)
- [getReactionsByCast](js_src.protobufs.HubServiceServer.md#getreactionsbycast)
- [getReactionsByFid](js_src.protobufs.HubServiceServer.md#getreactionsbyfid)
- [getSigner](js_src.protobufs.HubServiceServer.md#getsigner)
- [getSignersByFid](js_src.protobufs.HubServiceServer.md#getsignersbyfid)
- [getSyncMetadataByPrefix](js_src.protobufs.HubServiceServer.md#getsyncmetadatabyprefix)
- [getSyncSnapshotByPrefix](js_src.protobufs.HubServiceServer.md#getsyncsnapshotbyprefix)
- [getUserData](js_src.protobufs.HubServiceServer.md#getuserdata)
- [getUserDataByFid](js_src.protobufs.HubServiceServer.md#getuserdatabyfid)
- [getVerification](js_src.protobufs.HubServiceServer.md#getverification)
- [getVerificationsByFid](js_src.protobufs.HubServiceServer.md#getverificationsbyfid)
- [submitIdRegistryEvent](js_src.protobufs.HubServiceServer.md#submitidregistryevent)
- [submitMessage](js_src.protobufs.HubServiceServer.md#submitmessage)
- [submitNameRegistryEvent](js_src.protobufs.HubServiceServer.md#submitnameregistryevent)
- [subscribe](js_src.protobufs.HubServiceServer.md#subscribe)

## Properties

### getAllAmpMessagesByFid

• **getAllAmpMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/js_src.protobufs.md#fidrequest), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4048

___

### getAllCastMessagesByFid

• **getAllCastMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/js_src.protobufs.md#fidrequest), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

Bulk Methods

#### Defined in

protobufs/dist/index.d.ts:4046

___

### getAllMessagesBySyncIds

• **getAllMessagesBySyncIds**: `handleUnaryCall`<[`SyncIds`](../modules/js_src.protobufs.md#syncids), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4055

___

### getAllReactionMessagesByFid

• **getAllReactionMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/js_src.protobufs.md#fidrequest), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4047

___

### getAllSignerMessagesByFid

• **getAllSignerMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/js_src.protobufs.md#fidrequest), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4050

___

### getAllSyncIdsByPrefix

• **getAllSyncIdsByPrefix**: `handleUnaryCall`<[`TrieNodePrefix`](../modules/js_src.protobufs.md#trienodeprefix), [`SyncIds`](../modules/js_src.protobufs.md#syncids)\>

#### Defined in

protobufs/dist/index.d.ts:4054

___

### getAllUserDataMessagesByFid

• **getAllUserDataMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/js_src.protobufs.md#fidrequest), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4051

___

### getAllVerificationMessagesByFid

• **getAllVerificationMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/js_src.protobufs.md#fidrequest), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4049

___

### getAmp

• **getAmp**: `handleUnaryCall`<[`AmpRequest`](../modules/js_src.protobufs.md#amprequest), [`Message`](../modules/js_src.protobufs.md#message)\>

Amps

#### Defined in

protobufs/dist/index.d.ts:4030

___

### getAmpsByFid

• **getAmpsByFid**: `handleUnaryCall`<[`FidRequest`](../modules/js_src.protobufs.md#fidrequest), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4031

___

### getAmpsByUser

• **getAmpsByUser**: `handleUnaryCall`<[`FidRequest`](../modules/js_src.protobufs.md#fidrequest), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4032

___

### getCast

• **getCast**: `handleUnaryCall`<[`CastId`](../modules/js_src.protobufs.md#castid), [`Message`](../modules/js_src.protobufs.md#message)\>

Casts

#### Defined in

protobufs/dist/index.d.ts:4021

___

### getCastsByFid

• **getCastsByFid**: `handleUnaryCall`<[`FidRequest`](../modules/js_src.protobufs.md#fidrequest), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4022

___

### getCastsByMention

• **getCastsByMention**: `handleUnaryCall`<[`FidRequest`](../modules/js_src.protobufs.md#fidrequest), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4024

___

### getCastsByParent

• **getCastsByParent**: `handleUnaryCall`<[`CastId`](../modules/js_src.protobufs.md#castid), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4023

___

### getFids

• **getFids**: `handleUnaryCall`<[`Empty`](../modules/js_src.protobufs.md#empty), [`FidsResponse`](../modules/js_src.protobufs.md#fidsresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4044

___

### getIdRegistryEvent

• **getIdRegistryEvent**: `handleUnaryCall`<[`FidRequest`](../modules/js_src.protobufs.md#fidrequest), [`IdRegistryEvent`](../modules/js_src.protobufs.md#idregistryevent)\>

#### Defined in

protobufs/dist/index.d.ts:4043

___

### getInfo

• **getInfo**: `handleUnaryCall`<[`Empty`](../modules/js_src.protobufs.md#empty), [`HubInfoResponse`](../modules/js_src.protobufs.md#hubinforesponse)\>

Sync Methods

#### Defined in

protobufs/dist/index.d.ts:4053

___

### getNameRegistryEvent

• **getNameRegistryEvent**: `handleUnaryCall`<[`NameRegistryEventRequest`](../modules/js_src.protobufs.md#nameregistryeventrequest), [`NameRegistryEvent`](../modules/js_src.protobufs.md#nameregistryevent)\>

#### Defined in

protobufs/dist/index.d.ts:4036

___

### getReaction

• **getReaction**: `handleUnaryCall`<[`ReactionRequest`](../modules/js_src.protobufs.md#reactionrequest), [`Message`](../modules/js_src.protobufs.md#message)\>

Reactions

#### Defined in

protobufs/dist/index.d.ts:4026

___

### getReactionsByCast

• **getReactionsByCast**: `handleUnaryCall`<[`ReactionsByCastRequest`](../modules/js_src.protobufs.md#reactionsbycastrequest), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4028

___

### getReactionsByFid

• **getReactionsByFid**: `handleUnaryCall`<[`ReactionsByFidRequest`](../modules/js_src.protobufs.md#reactionsbyfidrequest), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4027

___

### getSigner

• **getSigner**: `handleUnaryCall`<[`SignerRequest`](../modules/js_src.protobufs.md#signerrequest), [`Message`](../modules/js_src.protobufs.md#message)\>

Signer

#### Defined in

protobufs/dist/index.d.ts:4041

___

### getSignersByFid

• **getSignersByFid**: `handleUnaryCall`<[`FidRequest`](../modules/js_src.protobufs.md#fidrequest), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4042

___

### getSyncMetadataByPrefix

• **getSyncMetadataByPrefix**: `handleUnaryCall`<[`TrieNodePrefix`](../modules/js_src.protobufs.md#trienodeprefix), [`TrieNodeMetadataResponse`](../modules/js_src.protobufs.md#trienodemetadataresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4056

___

### getSyncSnapshotByPrefix

• **getSyncSnapshotByPrefix**: `handleUnaryCall`<[`TrieNodePrefix`](../modules/js_src.protobufs.md#trienodeprefix), [`TrieNodeSnapshotResponse`](../modules/js_src.protobufs.md#trienodesnapshotresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4057

___

### getUserData

• **getUserData**: `handleUnaryCall`<[`UserDataRequest`](../modules/js_src.protobufs.md#userdatarequest), [`Message`](../modules/js_src.protobufs.md#message)\>

User Data

#### Defined in

protobufs/dist/index.d.ts:4034

___

### getUserDataByFid

• **getUserDataByFid**: `handleUnaryCall`<[`FidRequest`](../modules/js_src.protobufs.md#fidrequest), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4035

___

### getVerification

• **getVerification**: `handleUnaryCall`<[`VerificationRequest`](../modules/js_src.protobufs.md#verificationrequest), [`Message`](../modules/js_src.protobufs.md#message)\>

Verifications

#### Defined in

protobufs/dist/index.d.ts:4038

___

### getVerificationsByFid

• **getVerificationsByFid**: `handleUnaryCall`<[`FidRequest`](../modules/js_src.protobufs.md#fidrequest), [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4039

___

### submitIdRegistryEvent

• **submitIdRegistryEvent**: `handleUnaryCall`<[`IdRegistryEvent`](../modules/js_src.protobufs.md#idregistryevent), [`IdRegistryEvent`](../modules/js_src.protobufs.md#idregistryevent)\>

#### Defined in

protobufs/dist/index.d.ts:4016

___

### submitMessage

• **submitMessage**: `handleUnaryCall`<[`Message`](../modules/js_src.protobufs.md#message), [`Message`](../modules/js_src.protobufs.md#message)\>

Submit Methods

#### Defined in

protobufs/dist/index.d.ts:4015

___

### submitNameRegistryEvent

• **submitNameRegistryEvent**: `handleUnaryCall`<[`NameRegistryEvent`](../modules/js_src.protobufs.md#nameregistryevent), [`NameRegistryEvent`](../modules/js_src.protobufs.md#nameregistryevent)\>

#### Defined in

protobufs/dist/index.d.ts:4017

___

### subscribe

• **subscribe**: `handleServerStreamingCall`<[`SubscribeRequest`](../modules/js_src.protobufs.md#subscriberequest), [`EventResponse`](../modules/js_src.protobufs.md#eventresponse)\>

Event Methods

#### Defined in

protobufs/dist/index.d.ts:4019
