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

▸ **getAllCastMessagesByFid**(`request`, `callback`): `SurfaceCall`

Bulk Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getAllCastMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getAllCastMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getAllMessagesBySyncIds

▸ **getAllMessagesBySyncIds**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SyncIds`](../modules/protobufs.md#syncids) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getAllMessagesBySyncIds**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SyncIds`](../modules/protobufs.md#syncids) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getAllMessagesBySyncIds**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SyncIds`](../modules/protobufs.md#syncids) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getAllReactionMessagesByFid

▸ **getAllReactionMessagesByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getAllReactionMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getAllReactionMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getAllSignerMessagesByFid

▸ **getAllSignerMessagesByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getAllSignerMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getAllSignerMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getAllSyncIdsByPrefix

▸ **getAllSyncIdsByPrefix**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`SyncIds`](../modules/protobufs.md#syncids)) => `void` |

#### Returns

`SurfaceCall`

▸ **getAllSyncIdsByPrefix**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`SyncIds`](../modules/protobufs.md#syncids)) => `void` |

#### Returns

`SurfaceCall`

▸ **getAllSyncIdsByPrefix**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`SyncIds`](../modules/protobufs.md#syncids)) => `void` |

#### Returns

`SurfaceCall`

___

### getAllUserDataMessagesByFid

▸ **getAllUserDataMessagesByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getAllUserDataMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getAllUserDataMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getAllVerificationMessagesByFid

▸ **getAllVerificationMessagesByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getAllVerificationMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getAllVerificationMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getCast

▸ **getCast**(`request`, `callback`): `SurfaceCall`

Casts

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs.md#castid) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

▸ **getCast**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs.md#castid) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

▸ **getCast**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs.md#castid) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

___

### getCastsByFid

▸ **getCastsByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getCastsByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getCastsByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getCastsByMention

▸ **getCastsByMention**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getCastsByMention**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getCastsByMention**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getCastsByParent

▸ **getCastsByParent**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs.md#castid) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getCastsByParent**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs.md#castid) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getCastsByParent**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs.md#castid) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getEvent

▸ **getEvent**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`EventRequest`](../modules/protobufs.md#eventrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubEvent`](../modules/protobufs.md#hubevent)) => `void` |

#### Returns

`SurfaceCall`

▸ **getEvent**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`EventRequest`](../modules/protobufs.md#eventrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubEvent`](../modules/protobufs.md#hubevent)) => `void` |

#### Returns

`SurfaceCall`

▸ **getEvent**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`EventRequest`](../modules/protobufs.md#eventrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubEvent`](../modules/protobufs.md#hubevent)) => `void` |

#### Returns

`SurfaceCall`

___

### getFids

▸ **getFids**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`FidsResponse`](../modules/protobufs.md#fidsresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getFids**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`FidsResponse`](../modules/protobufs.md#fidsresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getFids**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`FidsResponse`](../modules/protobufs.md#fidsresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getIdRegistryEvent

▸ **getIdRegistryEvent**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

▸ **getIdRegistryEvent**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

▸ **getIdRegistryEvent**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

___

### getInfo

▸ **getInfo**(`request`, `callback`): `SurfaceCall`

Sync Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubInfoResponse`](../modules/protobufs.md#hubinforesponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getInfo**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubInfoResponse`](../modules/protobufs.md#hubinforesponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getInfo**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubInfoResponse`](../modules/protobufs.md#hubinforesponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getNameRegistryEvent

▸ **getNameRegistryEvent**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEventRequest`](../modules/protobufs.md#nameregistryeventrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

▸ **getNameRegistryEvent**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEventRequest`](../modules/protobufs.md#nameregistryeventrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

▸ **getNameRegistryEvent**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEventRequest`](../modules/protobufs.md#nameregistryeventrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

___

### getReaction

▸ **getReaction**(`request`, `callback`): `SurfaceCall`

Reactions

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionRequest`](../modules/protobufs.md#reactionrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

▸ **getReaction**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionRequest`](../modules/protobufs.md#reactionrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

▸ **getReaction**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionRequest`](../modules/protobufs.md#reactionrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

___

### getReactionsByCast

▸ **getReactionsByCast**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByCastRequest`](../modules/protobufs.md#reactionsbycastrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getReactionsByCast**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByCastRequest`](../modules/protobufs.md#reactionsbycastrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getReactionsByCast**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByCastRequest`](../modules/protobufs.md#reactionsbycastrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getReactionsByFid

▸ **getReactionsByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByFidRequest`](../modules/protobufs.md#reactionsbyfidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getReactionsByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByFidRequest`](../modules/protobufs.md#reactionsbyfidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getReactionsByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByFidRequest`](../modules/protobufs.md#reactionsbyfidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getSigner

▸ **getSigner**(`request`, `callback`): `SurfaceCall`

Signer

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SignerRequest`](../modules/protobufs.md#signerrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

▸ **getSigner**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SignerRequest`](../modules/protobufs.md#signerrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

▸ **getSigner**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SignerRequest`](../modules/protobufs.md#signerrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

___

### getSignersByFid

▸ **getSignersByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getSignersByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getSignersByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getSyncMetadataByPrefix

▸ **getSyncMetadataByPrefix**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeMetadataResponse`](../modules/protobufs.md#trienodemetadataresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getSyncMetadataByPrefix**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeMetadataResponse`](../modules/protobufs.md#trienodemetadataresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getSyncMetadataByPrefix**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeMetadataResponse`](../modules/protobufs.md#trienodemetadataresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getSyncSnapshotByPrefix

▸ **getSyncSnapshotByPrefix**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeSnapshotResponse`](../modules/protobufs.md#trienodesnapshotresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getSyncSnapshotByPrefix**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeSnapshotResponse`](../modules/protobufs.md#trienodesnapshotresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getSyncSnapshotByPrefix**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeSnapshotResponse`](../modules/protobufs.md#trienodesnapshotresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getUserData

▸ **getUserData**(`request`, `callback`): `SurfaceCall`

User Data

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`UserDataRequest`](../modules/protobufs.md#userdatarequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

▸ **getUserData**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`UserDataRequest`](../modules/protobufs.md#userdatarequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

▸ **getUserData**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`UserDataRequest`](../modules/protobufs.md#userdatarequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

___

### getUserDataByFid

▸ **getUserDataByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getUserDataByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getUserDataByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### getVerification

▸ **getVerification**(`request`, `callback`): `SurfaceCall`

Verifications

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`VerificationRequest`](../modules/protobufs.md#verificationrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

▸ **getVerification**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`VerificationRequest`](../modules/protobufs.md#verificationrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

▸ **getVerification**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`VerificationRequest`](../modules/protobufs.md#verificationrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

___

### getVerificationsByFid

▸ **getVerificationsByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getVerificationsByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

▸ **getVerificationsByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

___

### submitIdRegistryEvent

▸ **submitIdRegistryEvent**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

▸ **submitIdRegistryEvent**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

▸ **submitIdRegistryEvent**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

___

### submitMessage

▸ **submitMessage**(`request`, `callback`): `SurfaceCall`

Submit Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Message`](../modules/protobufs.md#message) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

▸ **submitMessage**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Message`](../modules/protobufs.md#message) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

▸ **submitMessage**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Message`](../modules/protobufs.md#message) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

___

### submitNameRegistryEvent

▸ **submitNameRegistryEvent**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

▸ **submitNameRegistryEvent**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

▸ **submitNameRegistryEvent**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

___

### subscribe

▸ **subscribe**(`request`, `options?`): `ClientReadableStream`<[`HubEvent`](../modules/protobufs.md#hubevent)\>

Event Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SubscribeRequest`](../modules/protobufs.md#subscriberequest) |
| `options?` | `Partial`<`CallOptions`\> |

#### Returns

`ClientReadableStream`<[`HubEvent`](../modules/protobufs.md#hubevent)\>

▸ **subscribe**(`request`, `metadata?`, `options?`): `ClientReadableStream`<[`HubEvent`](../modules/protobufs.md#hubevent)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SubscribeRequest`](../modules/protobufs.md#subscriberequest) |
| `metadata?` | `Metadata` |
| `options?` | `Partial`<`CallOptions`\> |

#### Returns

`ClientReadableStream`<[`HubEvent`](../modules/protobufs.md#hubevent)\>
