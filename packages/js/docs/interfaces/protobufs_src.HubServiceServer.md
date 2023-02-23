[hubble](../README.md) / [Modules](../modules.md) / [protobufs/src](../modules/protobufs_src.md) / HubServiceServer

# Interface: HubServiceServer

[protobufs/src](../modules/protobufs_src.md).HubServiceServer

## Hierarchy

- `UntypedServiceImplementation`

  ↳ **`HubServiceServer`**

## Table of contents

### Properties

- [getAllAmpMessagesByFid](protobufs_src.HubServiceServer.md#getallampmessagesbyfid)
- [getAllCastMessagesByFid](protobufs_src.HubServiceServer.md#getallcastmessagesbyfid)
- [getAllMessagesBySyncIds](protobufs_src.HubServiceServer.md#getallmessagesbysyncids)
- [getAllReactionMessagesByFid](protobufs_src.HubServiceServer.md#getallreactionmessagesbyfid)
- [getAllSignerMessagesByFid](protobufs_src.HubServiceServer.md#getallsignermessagesbyfid)
- [getAllSyncIdsByPrefix](protobufs_src.HubServiceServer.md#getallsyncidsbyprefix)
- [getAllUserDataMessagesByFid](protobufs_src.HubServiceServer.md#getalluserdatamessagesbyfid)
- [getAllVerificationMessagesByFid](protobufs_src.HubServiceServer.md#getallverificationmessagesbyfid)
- [getAmp](protobufs_src.HubServiceServer.md#getamp)
- [getAmpsByFid](protobufs_src.HubServiceServer.md#getampsbyfid)
- [getAmpsByUser](protobufs_src.HubServiceServer.md#getampsbyuser)
- [getCast](protobufs_src.HubServiceServer.md#getcast)
- [getCastsByFid](protobufs_src.HubServiceServer.md#getcastsbyfid)
- [getCastsByMention](protobufs_src.HubServiceServer.md#getcastsbymention)
- [getCastsByParent](protobufs_src.HubServiceServer.md#getcastsbyparent)
- [getFids](protobufs_src.HubServiceServer.md#getfids)
- [getIdRegistryEvent](protobufs_src.HubServiceServer.md#getidregistryevent)
- [getInfo](protobufs_src.HubServiceServer.md#getinfo)
- [getNameRegistryEvent](protobufs_src.HubServiceServer.md#getnameregistryevent)
- [getReaction](protobufs_src.HubServiceServer.md#getreaction)
- [getReactionsByCast](protobufs_src.HubServiceServer.md#getreactionsbycast)
- [getReactionsByFid](protobufs_src.HubServiceServer.md#getreactionsbyfid)
- [getSigner](protobufs_src.HubServiceServer.md#getsigner)
- [getSignersByFid](protobufs_src.HubServiceServer.md#getsignersbyfid)
- [getSyncMetadataByPrefix](protobufs_src.HubServiceServer.md#getsyncmetadatabyprefix)
- [getSyncSnapshotByPrefix](protobufs_src.HubServiceServer.md#getsyncsnapshotbyprefix)
- [getUserData](protobufs_src.HubServiceServer.md#getuserdata)
- [getUserDataByFid](protobufs_src.HubServiceServer.md#getuserdatabyfid)
- [getVerification](protobufs_src.HubServiceServer.md#getverification)
- [getVerificationsByFid](protobufs_src.HubServiceServer.md#getverificationsbyfid)
- [submitIdRegistryEvent](protobufs_src.HubServiceServer.md#submitidregistryevent)
- [submitMessage](protobufs_src.HubServiceServer.md#submitmessage)
- [submitNameRegistryEvent](protobufs_src.HubServiceServer.md#submitnameregistryevent)
- [subscribe](protobufs_src.HubServiceServer.md#subscribe)

## Properties

### getAllAmpMessagesByFid

• **getAllAmpMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs_src.md#fidrequest), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1787](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1787)

___

### getAllCastMessagesByFid

• **getAllCastMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs_src.md#fidrequest), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

Bulk Methods

#### Defined in

[protobufs/src/generated/rpc.ts:1785](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1785)

___

### getAllMessagesBySyncIds

• **getAllMessagesBySyncIds**: `handleUnaryCall`<[`SyncIds`](../modules/protobufs_src.md#syncids), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1794](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1794)

___

### getAllReactionMessagesByFid

• **getAllReactionMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs_src.md#fidrequest), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1786](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1786)

___

### getAllSignerMessagesByFid

• **getAllSignerMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs_src.md#fidrequest), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1789](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1789)

___

### getAllSyncIdsByPrefix

• **getAllSyncIdsByPrefix**: `handleUnaryCall`<[`TrieNodePrefix`](../modules/protobufs_src.md#trienodeprefix), [`SyncIds`](../modules/protobufs_src.md#syncids)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1793](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1793)

___

### getAllUserDataMessagesByFid

• **getAllUserDataMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs_src.md#fidrequest), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1790](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1790)

___

### getAllVerificationMessagesByFid

• **getAllVerificationMessagesByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs_src.md#fidrequest), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1788](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1788)

___

### getAmp

• **getAmp**: `handleUnaryCall`<[`AmpRequest`](../modules/protobufs_src.md#amprequest), [`Message`](../modules/protobufs_src.md#message)\>

Amps

#### Defined in

[protobufs/src/generated/rpc.ts:1769](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1769)

___

### getAmpsByFid

• **getAmpsByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs_src.md#fidrequest), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1770](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1770)

___

### getAmpsByUser

• **getAmpsByUser**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs_src.md#fidrequest), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1771](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1771)

___

### getCast

• **getCast**: `handleUnaryCall`<[`CastId`](../modules/protobufs_src.md#castid), [`Message`](../modules/protobufs_src.md#message)\>

Casts

#### Defined in

[protobufs/src/generated/rpc.ts:1760](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1760)

___

### getCastsByFid

• **getCastsByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs_src.md#fidrequest), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1761](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1761)

___

### getCastsByMention

• **getCastsByMention**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs_src.md#fidrequest), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1763](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1763)

___

### getCastsByParent

• **getCastsByParent**: `handleUnaryCall`<[`CastId`](../modules/protobufs_src.md#castid), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1762](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1762)

___

### getFids

• **getFids**: `handleUnaryCall`<[`Empty`](../modules/protobufs_src.md#empty), [`FidsResponse`](../modules/protobufs_src.md#fidsresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1783](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1783)

___

### getIdRegistryEvent

• **getIdRegistryEvent**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs_src.md#fidrequest), [`IdRegistryEvent`](../modules/protobufs_src.md#idregistryevent)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1782](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1782)

___

### getInfo

• **getInfo**: `handleUnaryCall`<[`Empty`](../modules/protobufs_src.md#empty), [`HubInfoResponse`](../modules/protobufs_src.md#hubinforesponse)\>

Sync Methods

#### Defined in

[protobufs/src/generated/rpc.ts:1792](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1792)

___

### getNameRegistryEvent

• **getNameRegistryEvent**: `handleUnaryCall`<[`NameRegistryEventRequest`](../modules/protobufs_src.md#nameregistryeventrequest), [`NameRegistryEvent`](../modules/protobufs_src.md#nameregistryevent)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1775](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1775)

___

### getReaction

• **getReaction**: `handleUnaryCall`<[`ReactionRequest`](../modules/protobufs_src.md#reactionrequest), [`Message`](../modules/protobufs_src.md#message)\>

Reactions

#### Defined in

[protobufs/src/generated/rpc.ts:1765](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1765)

___

### getReactionsByCast

• **getReactionsByCast**: `handleUnaryCall`<[`ReactionsByCastRequest`](../modules/protobufs_src.md#reactionsbycastrequest), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1767](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1767)

___

### getReactionsByFid

• **getReactionsByFid**: `handleUnaryCall`<[`ReactionsByFidRequest`](../modules/protobufs_src.md#reactionsbyfidrequest), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1766](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1766)

___

### getSigner

• **getSigner**: `handleUnaryCall`<[`SignerRequest`](../modules/protobufs_src.md#signerrequest), [`Message`](../modules/protobufs_src.md#message)\>

Signer

#### Defined in

[protobufs/src/generated/rpc.ts:1780](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1780)

___

### getSignersByFid

• **getSignersByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs_src.md#fidrequest), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1781](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1781)

___

### getSyncMetadataByPrefix

• **getSyncMetadataByPrefix**: `handleUnaryCall`<[`TrieNodePrefix`](../modules/protobufs_src.md#trienodeprefix), [`TrieNodeMetadataResponse`](../modules/protobufs_src.md#trienodemetadataresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1795](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1795)

___

### getSyncSnapshotByPrefix

• **getSyncSnapshotByPrefix**: `handleUnaryCall`<[`TrieNodePrefix`](../modules/protobufs_src.md#trienodeprefix), [`TrieNodeSnapshotResponse`](../modules/protobufs_src.md#trienodesnapshotresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1796](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1796)

___

### getUserData

• **getUserData**: `handleUnaryCall`<[`UserDataRequest`](../modules/protobufs_src.md#userdatarequest), [`Message`](../modules/protobufs_src.md#message)\>

User Data

#### Defined in

[protobufs/src/generated/rpc.ts:1773](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1773)

___

### getUserDataByFid

• **getUserDataByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs_src.md#fidrequest), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1774](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1774)

___

### getVerification

• **getVerification**: `handleUnaryCall`<[`VerificationRequest`](../modules/protobufs_src.md#verificationrequest), [`Message`](../modules/protobufs_src.md#message)\>

Verifications

#### Defined in

[protobufs/src/generated/rpc.ts:1777](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1777)

___

### getVerificationsByFid

• **getVerificationsByFid**: `handleUnaryCall`<[`FidRequest`](../modules/protobufs_src.md#fidrequest), [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1778](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1778)

___

### submitIdRegistryEvent

• **submitIdRegistryEvent**: `handleUnaryCall`<[`IdRegistryEvent`](../modules/protobufs_src.md#idregistryevent), [`IdRegistryEvent`](../modules/protobufs_src.md#idregistryevent)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1755](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1755)

___

### submitMessage

• **submitMessage**: `handleUnaryCall`<[`Message`](../modules/protobufs_src.md#message), [`Message`](../modules/protobufs_src.md#message)\>

Submit Methods

#### Defined in

[protobufs/src/generated/rpc.ts:1754](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1754)

___

### submitNameRegistryEvent

• **submitNameRegistryEvent**: `handleUnaryCall`<[`NameRegistryEvent`](../modules/protobufs_src.md#nameregistryevent), [`NameRegistryEvent`](../modules/protobufs_src.md#nameregistryevent)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1756](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1756)

___

### subscribe

• **subscribe**: `handleServerStreamingCall`<[`SubscribeRequest`](../modules/protobufs_src.md#subscriberequest), [`EventResponse`](../modules/protobufs_src.md#eventresponse)\>

Event Methods

#### Defined in

[protobufs/src/generated/rpc.ts:1758](https://github.com/vinliao/hubble/blob/b933e0c/packages/protobufs/src/generated/rpc.ts#L1758)
