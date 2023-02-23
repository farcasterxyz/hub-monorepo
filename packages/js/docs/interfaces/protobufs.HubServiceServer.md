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

#### Defined in

protobufs/dist/index.d.ts:4048

___

### getAllCastMessagesByFid

• **getAllCastMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

Bulk Methods

#### Defined in

protobufs/dist/index.d.ts:4046

___

### getAllMessagesBySyncIds

• **getAllMessagesBySyncIds**: `handleUnaryCall`<[`SyncIds`](../modules/protobufs.md#syncids), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4055

___

### getAllReactionMessagesByFid

• **getAllReactionMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4047

___

### getAllSignerMessagesByFid

• **getAllSignerMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4050

___

### getAllSyncIdsByPrefix

• **getAllSyncIdsByPrefix**: `handleUnaryCall`<[`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix), [`SyncIds`](../modules/protobufs.md#syncids)\>

#### Defined in

protobufs/dist/index.d.ts:4054

___

### getAllUserDataMessagesByFid

• **getAllUserDataMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4051

___

### getAllVerificationMessagesByFid

• **getAllVerificationMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4049

___

### getAmp

• **getAmp**: `handleUnaryCall`<[`AmpRequest`](../modules/protobufs.md#amprequest), [`Message`](../modules/protobufs.md#message)\>

Amps

#### Defined in

protobufs/dist/index.d.ts:4030

___

### getAmpsByFid

• **getAmpsByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4031

___

### getAmpsByUser

• **getAmpsByUser**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4032

___

### getCast

• **getCast**: `handleUnaryCall`<[`CastId`](../modules/protobufs.md#castid), [`Message`](../modules/protobufs.md#message)\>

Casts

#### Defined in

protobufs/dist/index.d.ts:4021

___

### getCastsByFid

• **getCastsByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4022

___

### getCastsByMention

• **getCastsByMention**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4024

___

### getCastsByParent

• **getCastsByParent**: `handleUnaryCall`<[`CastId`](../modules/protobufs.md#castid), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4023

___

### getFids

• **getFids**: `handleUnaryCall`<[`Empty`](../modules/protobufs.md#empty), [`FidsResponse`](../modules/protobufs.md#fidsresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4044

___

### getIdRegistryEvent

• **getIdRegistryEvent**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent)\>

#### Defined in

protobufs/dist/index.d.ts:4043

___

### getInfo

• **getInfo**: `handleUnaryCall`<[`Empty`](../modules/protobufs.md#empty), [`HubInfoResponse`](../modules/protobufs.md#hubinforesponse)\>

Sync Methods

#### Defined in

protobufs/dist/index.d.ts:4053

___

### getNameRegistryEvent

• **getNameRegistryEvent**: `handleUnaryCall`<[`NameRegistryEventRequest`](../modules/protobufs.md#nameregistryeventrequest), [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent)\>

#### Defined in

protobufs/dist/index.d.ts:4036

___

### getReaction

• **getReaction**: `handleUnaryCall`<[`ReactionRequest`](../modules/protobufs.md#reactionrequest), [`Message`](../modules/protobufs.md#message)\>

Reactions

#### Defined in

protobufs/dist/index.d.ts:4026

___

### getReactionsByCast

• **getReactionsByCast**: `handleUnaryCall`<[`ReactionsByCastRequest`](../modules/protobufs.md#reactionsbycastrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4028

___

### getReactionsByFid

• **getReactionsByFid**: `handleUnaryCall`<[`ReactionsByFidRequest`](../modules/protobufs.md#reactionsbyfidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4027

___

### getSigner

• **getSigner**: `handleUnaryCall`<[`SignerRequest`](../modules/protobufs.md#signerrequest), [`Message`](../modules/protobufs.md#message)\>

Signer

#### Defined in

protobufs/dist/index.d.ts:4041

___

### getSignersByFid

• **getSignersByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4042

___

### getSyncMetadataByPrefix

• **getSyncMetadataByPrefix**: `handleUnaryCall`<[`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix), [`TrieNodeMetadataResponse`](../modules/protobufs.md#trienodemetadataresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4056

___

### getSyncSnapshotByPrefix

• **getSyncSnapshotByPrefix**: `handleUnaryCall`<[`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix), [`TrieNodeSnapshotResponse`](../modules/protobufs.md#trienodesnapshotresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4057

___

### getUserData

• **getUserData**: `handleUnaryCall`<[`UserDataRequest`](../modules/protobufs.md#userdatarequest), [`Message`](../modules/protobufs.md#message)\>

User Data

#### Defined in

protobufs/dist/index.d.ts:4034

___

### getUserDataByFid

• **getUserDataByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4035

___

### getVerification

• **getVerification**: `handleUnaryCall`<[`VerificationRequest`](../modules/protobufs.md#verificationrequest), [`Message`](../modules/protobufs.md#message)\>

Verifications

#### Defined in

protobufs/dist/index.d.ts:4038

___

### getVerificationsByFid

• **getVerificationsByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs.md#fidrequest), [`MessagesResponse`](../modules/protobufs.md#messagesresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4039

___

### submitIdRegistryEvent

• **submitIdRegistryEvent**: `handleUnaryCall`<[`IdRegistryEvent`](../modules/protobufs.md#idregistryevent), [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent)\>

#### Defined in

protobufs/dist/index.d.ts:4016

___

### submitMessage

• **submitMessage**: `handleUnaryCall`<[`Message`](../modules/protobufs.md#message), [`Message`](../modules/protobufs.md#message)\>

Submit Methods

#### Defined in

protobufs/dist/index.d.ts:4015

___

### submitNameRegistryEvent

• **submitNameRegistryEvent**: `handleUnaryCall`<[`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent), [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent)\>

#### Defined in

protobufs/dist/index.d.ts:4017

___

### subscribe

• **subscribe**: `handleServerStreamingCall`<[`SubscribeRequest`](../modules/protobufs.md#subscriberequest), [`EventResponse`](../modules/protobufs.md#eventresponse)\>

Event Methods

#### Defined in

protobufs/dist/index.d.ts:4019
