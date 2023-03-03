[@farcaster/js](../README.md) / [Exports](../modules.md) / [protobufs](../modules/protobufs.md) / HubServiceClient

# Interface: HubServiceClient

[protobufs](../modules/protobufs.md).HubServiceClient

## Hierarchy

- `Client`

  ↳ **`HubServiceClient`**

## Table of contents

### Methods

- [getAllCastMessagesByFid](protobufs.HubServiceClient.md#getallcastmessagesbyfid)
- [getAllMessagesBySyncIds](protobufs.HubServiceClient.md#getallmessagesbysyncids)
- [getAllReactionMessagesByFid](protobufs.HubServiceClient.md#getallreactionmessagesbyfid)
- [getAllSignerMessagesByFid](protobufs.HubServiceClient.md#getallsignermessagesbyfid)
- [getAllSyncIdsByPrefix](protobufs.HubServiceClient.md#getallsyncidsbyprefix)
- [getAllUserDataMessagesByFid](protobufs.HubServiceClient.md#getalluserdatamessagesbyfid)
- [getAllVerificationMessagesByFid](protobufs.HubServiceClient.md#getallverificationmessagesbyfid)
- [getCast](protobufs.HubServiceClient.md#getcast)
- [getCastsByFid](protobufs.HubServiceClient.md#getcastsbyfid)
- [getCastsByMention](protobufs.HubServiceClient.md#getcastsbymention)
- [getCastsByParent](protobufs.HubServiceClient.md#getcastsbyparent)
- [getEvent](protobufs.HubServiceClient.md#getevent)
- [getFids](protobufs.HubServiceClient.md#getfids)
- [getIdRegistryEvent](protobufs.HubServiceClient.md#getidregistryevent)
- [getInfo](protobufs.HubServiceClient.md#getinfo)
- [getNameRegistryEvent](protobufs.HubServiceClient.md#getnameregistryevent)
- [getReaction](protobufs.HubServiceClient.md#getreaction)
- [getReactionsByCast](protobufs.HubServiceClient.md#getreactionsbycast)
- [getReactionsByFid](protobufs.HubServiceClient.md#getreactionsbyfid)
- [getSigner](protobufs.HubServiceClient.md#getsigner)
- [getSignersByFid](protobufs.HubServiceClient.md#getsignersbyfid)
- [getSyncMetadataByPrefix](protobufs.HubServiceClient.md#getsyncmetadatabyprefix)
- [getSyncSnapshotByPrefix](protobufs.HubServiceClient.md#getsyncsnapshotbyprefix)
- [getUserData](protobufs.HubServiceClient.md#getuserdata)
- [getUserDataByFid](protobufs.HubServiceClient.md#getuserdatabyfid)
- [getVerification](protobufs.HubServiceClient.md#getverification)
- [getVerificationsByFid](protobufs.HubServiceClient.md#getverificationsbyfid)
- [submitIdRegistryEvent](protobufs.HubServiceClient.md#submitidregistryevent)
- [submitMessage](protobufs.HubServiceClient.md#submitmessage)
- [submitNameRegistryEvent](protobufs.HubServiceClient.md#submitnameregistryevent)
- [subscribe](protobufs.HubServiceClient.md#subscribe)

## Methods

### getAllCastMessagesByFid

▸ **getAllCastMessagesByFid**(`request`, `callback`)

Bulk Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getAllCastMessagesByFid**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getAllCastMessagesByFid**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

___

### getAllMessagesBySyncIds

▸ **getAllMessagesBySyncIds**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SyncIds`](../modules/protobufs.md#syncids) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getAllMessagesBySyncIds**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SyncIds`](../modules/protobufs.md#syncids) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getAllMessagesBySyncIds**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SyncIds`](../modules/protobufs.md#syncids) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

___

### getAllReactionMessagesByFid

▸ **getAllReactionMessagesByFid**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getAllReactionMessagesByFid**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getAllReactionMessagesByFid**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

___

### getAllSignerMessagesByFid

▸ **getAllSignerMessagesByFid**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getAllSignerMessagesByFid**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getAllSignerMessagesByFid**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

___

### getAllSyncIdsByPrefix

▸ **getAllSyncIdsByPrefix**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`SyncIds`](../modules/protobufs.md#syncids)) =>  |

▸ **getAllSyncIdsByPrefix**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`SyncIds`](../modules/protobufs.md#syncids)) =>  |

▸ **getAllSyncIdsByPrefix**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`SyncIds`](../modules/protobufs.md#syncids)) =>  |

___

### getAllUserDataMessagesByFid

▸ **getAllUserDataMessagesByFid**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getAllUserDataMessagesByFid**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getAllUserDataMessagesByFid**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

___

### getAllVerificationMessagesByFid

▸ **getAllVerificationMessagesByFid**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getAllVerificationMessagesByFid**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getAllVerificationMessagesByFid**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

___

### getCast

▸ **getCast**(`request`, `callback`)

Casts

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs.md#castid) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

▸ **getCast**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs.md#castid) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

▸ **getCast**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs.md#castid) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

___

### getCastsByFid

▸ **getCastsByFid**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getCastsByFid**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getCastsByFid**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

___

### getCastsByMention

▸ **getCastsByMention**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getCastsByMention**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getCastsByMention**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

___

### getCastsByParent

▸ **getCastsByParent**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs.md#castid) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getCastsByParent**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs.md#castid) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getCastsByParent**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs.md#castid) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

___

### getEvent

▸ **getEvent**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`EventRequest`](../modules/protobufs.md#eventrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubEvent`](../modules/protobufs.md#hubevent)) =>  |

▸ **getEvent**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`EventRequest`](../modules/protobufs.md#eventrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubEvent`](../modules/protobufs.md#hubevent)) =>  |

▸ **getEvent**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`EventRequest`](../modules/protobufs.md#eventrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubEvent`](../modules/protobufs.md#hubevent)) =>  |

___

### getFids

▸ **getFids**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`FidsResponse`](../modules/protobufs.md#fidsresponse)) =>  |

▸ **getFids**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`FidsResponse`](../modules/protobufs.md#fidsresponse)) =>  |

▸ **getFids**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`FidsResponse`](../modules/protobufs.md#fidsresponse)) =>  |

___

### getIdRegistryEvent

▸ **getIdRegistryEvent**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent)) =>  |

▸ **getIdRegistryEvent**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent)) =>  |

▸ **getIdRegistryEvent**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent)) =>  |

___

### getInfo

▸ **getInfo**(`request`, `callback`)

Sync Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubInfoResponse`](../modules/protobufs.md#hubinforesponse)) =>  |

▸ **getInfo**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubInfoResponse`](../modules/protobufs.md#hubinforesponse)) =>  |

▸ **getInfo**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubInfoResponse`](../modules/protobufs.md#hubinforesponse)) =>  |

___

### getNameRegistryEvent

▸ **getNameRegistryEvent**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEventRequest`](../modules/protobufs.md#nameregistryeventrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent)) =>  |

▸ **getNameRegistryEvent**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEventRequest`](../modules/protobufs.md#nameregistryeventrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent)) =>  |

▸ **getNameRegistryEvent**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEventRequest`](../modules/protobufs.md#nameregistryeventrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent)) =>  |

___

### getReaction

▸ **getReaction**(`request`, `callback`)

Reactions

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionRequest`](../modules/protobufs.md#reactionrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

▸ **getReaction**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionRequest`](../modules/protobufs.md#reactionrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

▸ **getReaction**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionRequest`](../modules/protobufs.md#reactionrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

___

### getReactionsByCast

▸ **getReactionsByCast**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByCastRequest`](../modules/protobufs.md#reactionsbycastrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getReactionsByCast**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByCastRequest`](../modules/protobufs.md#reactionsbycastrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getReactionsByCast**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByCastRequest`](../modules/protobufs.md#reactionsbycastrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

___

### getReactionsByFid

▸ **getReactionsByFid**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByFidRequest`](../modules/protobufs.md#reactionsbyfidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getReactionsByFid**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByFidRequest`](../modules/protobufs.md#reactionsbyfidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getReactionsByFid**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByFidRequest`](../modules/protobufs.md#reactionsbyfidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

___

### getSigner

▸ **getSigner**(`request`, `callback`)

Signer

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SignerRequest`](../modules/protobufs.md#signerrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

▸ **getSigner**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SignerRequest`](../modules/protobufs.md#signerrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

▸ **getSigner**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SignerRequest`](../modules/protobufs.md#signerrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

___

### getSignersByFid

▸ **getSignersByFid**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getSignersByFid**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getSignersByFid**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

___

### getSyncMetadataByPrefix

▸ **getSyncMetadataByPrefix**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeMetadataResponse`](../modules/protobufs.md#trienodemetadataresponse)) =>  |

▸ **getSyncMetadataByPrefix**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeMetadataResponse`](../modules/protobufs.md#trienodemetadataresponse)) =>  |

▸ **getSyncMetadataByPrefix**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeMetadataResponse`](../modules/protobufs.md#trienodemetadataresponse)) =>  |

___

### getSyncSnapshotByPrefix

▸ **getSyncSnapshotByPrefix**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeSnapshotResponse`](../modules/protobufs.md#trienodesnapshotresponse)) =>  |

▸ **getSyncSnapshotByPrefix**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeSnapshotResponse`](../modules/protobufs.md#trienodesnapshotresponse)) =>  |

▸ **getSyncSnapshotByPrefix**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeSnapshotResponse`](../modules/protobufs.md#trienodesnapshotresponse)) =>  |

___

### getUserData

▸ **getUserData**(`request`, `callback`)

User Data

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`UserDataRequest`](../modules/protobufs.md#userdatarequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

▸ **getUserData**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`UserDataRequest`](../modules/protobufs.md#userdatarequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

▸ **getUserData**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`UserDataRequest`](../modules/protobufs.md#userdatarequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

___

### getUserDataByFid

▸ **getUserDataByFid**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getUserDataByFid**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getUserDataByFid**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

___

### getVerification

▸ **getVerification**(`request`, `callback`)

Verifications

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`VerificationRequest`](../modules/protobufs.md#verificationrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

▸ **getVerification**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`VerificationRequest`](../modules/protobufs.md#verificationrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

▸ **getVerification**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`VerificationRequest`](../modules/protobufs.md#verificationrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

___

### getVerificationsByFid

▸ **getVerificationsByFid**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getVerificationsByFid**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

▸ **getVerificationsByFid**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) =>  |

___

### submitIdRegistryEvent

▸ **submitIdRegistryEvent**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent)) =>  |

▸ **submitIdRegistryEvent**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent)) =>  |

▸ **submitIdRegistryEvent**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent)) =>  |

___

### submitMessage

▸ **submitMessage**(`request`, `callback`)

Submit Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Message`](../modules/protobufs.md#message) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

▸ **submitMessage**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Message`](../modules/protobufs.md#message) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

▸ **submitMessage**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Message`](../modules/protobufs.md#message) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) =>  |

___

### submitNameRegistryEvent

▸ **submitNameRegistryEvent**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent)) =>  |

▸ **submitNameRegistryEvent**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent)) =>  |

▸ **submitNameRegistryEvent**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent)) =>  |

___

### subscribe

▸ **subscribe**(`request`, `options?`)

Event Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SubscribeRequest`](../modules/protobufs.md#subscriberequest) |
| `options?` | `Partial`<`CallOptions`\> |

▸ **subscribe**(`request`, `metadata?`, `options?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SubscribeRequest`](../modules/protobufs.md#subscriberequest) |
| `metadata?` | `Metadata` |
| `options?` | `Partial`<`CallOptions`\> |
