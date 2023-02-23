[hubble](../README.md) / [Modules](../modules.md) / [protobufs/src](../modules/protobufs_src.md) / HubServiceClient

# Interface: HubServiceClient

[protobufs/src](../modules/protobufs_src.md).HubServiceClient

## Hierarchy

- `Client`

  ↳ **`HubServiceClient`**

## Table of contents

### Methods

- [getAllAmpMessagesByFid](protobufs_src.HubServiceClient.md#getallampmessagesbyfid)
- [getAllCastMessagesByFid](protobufs_src.HubServiceClient.md#getallcastmessagesbyfid)
- [getAllMessagesBySyncIds](protobufs_src.HubServiceClient.md#getallmessagesbysyncids)
- [getAllReactionMessagesByFid](protobufs_src.HubServiceClient.md#getallreactionmessagesbyfid)
- [getAllSignerMessagesByFid](protobufs_src.HubServiceClient.md#getallsignermessagesbyfid)
- [getAllSyncIdsByPrefix](protobufs_src.HubServiceClient.md#getallsyncidsbyprefix)
- [getAllUserDataMessagesByFid](protobufs_src.HubServiceClient.md#getalluserdatamessagesbyfid)
- [getAllVerificationMessagesByFid](protobufs_src.HubServiceClient.md#getallverificationmessagesbyfid)
- [getAmp](protobufs_src.HubServiceClient.md#getamp)
- [getAmpsByFid](protobufs_src.HubServiceClient.md#getampsbyfid)
- [getAmpsByUser](protobufs_src.HubServiceClient.md#getampsbyuser)
- [getCast](protobufs_src.HubServiceClient.md#getcast)
- [getCastsByFid](protobufs_src.HubServiceClient.md#getcastsbyfid)
- [getCastsByMention](protobufs_src.HubServiceClient.md#getcastsbymention)
- [getCastsByParent](protobufs_src.HubServiceClient.md#getcastsbyparent)
- [getFids](protobufs_src.HubServiceClient.md#getfids)
- [getIdRegistryEvent](protobufs_src.HubServiceClient.md#getidregistryevent)
- [getInfo](protobufs_src.HubServiceClient.md#getinfo)
- [getNameRegistryEvent](protobufs_src.HubServiceClient.md#getnameregistryevent)
- [getReaction](protobufs_src.HubServiceClient.md#getreaction)
- [getReactionsByCast](protobufs_src.HubServiceClient.md#getreactionsbycast)
- [getReactionsByFid](protobufs_src.HubServiceClient.md#getreactionsbyfid)
- [getSigner](protobufs_src.HubServiceClient.md#getsigner)
- [getSignersByFid](protobufs_src.HubServiceClient.md#getsignersbyfid)
- [getSyncMetadataByPrefix](protobufs_src.HubServiceClient.md#getsyncmetadatabyprefix)
- [getSyncSnapshotByPrefix](protobufs_src.HubServiceClient.md#getsyncsnapshotbyprefix)
- [getUserData](protobufs_src.HubServiceClient.md#getuserdata)
- [getUserDataByFid](protobufs_src.HubServiceClient.md#getuserdatabyfid)
- [getVerification](protobufs_src.HubServiceClient.md#getverification)
- [getVerificationsByFid](protobufs_src.HubServiceClient.md#getverificationsbyfid)
- [submitIdRegistryEvent](protobufs_src.HubServiceClient.md#submitidregistryevent)
- [submitMessage](protobufs_src.HubServiceClient.md#submitmessage)
- [submitNameRegistryEvent](protobufs_src.HubServiceClient.md#submitnameregistryevent)
- [subscribe](protobufs_src.HubServiceClient.md#subscribe)

## Methods

### getAllAmpMessagesByFid

▸ **getAllAmpMessagesByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2160](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2160)

▸ **getAllAmpMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2164](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2164)

▸ **getAllAmpMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2169](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2169)

___

### getAllCastMessagesByFid

▸ **getAllCastMessagesByFid**(`request`, `callback`): `SurfaceCall`

Bulk Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2130](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2130)

▸ **getAllCastMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2134](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2134)

▸ **getAllCastMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2139](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2139)

___

### getAllMessagesBySyncIds

▸ **getAllMessagesBySyncIds**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SyncIds`](../modules/protobufs_src.md#syncids) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2248](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2248)

▸ **getAllMessagesBySyncIds**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SyncIds`](../modules/protobufs_src.md#syncids) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2252](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2252)

▸ **getAllMessagesBySyncIds**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SyncIds`](../modules/protobufs_src.md#syncids) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2257](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2257)

___

### getAllReactionMessagesByFid

▸ **getAllReactionMessagesByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2145](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2145)

▸ **getAllReactionMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2149](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2149)

▸ **getAllReactionMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2154](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2154)

___

### getAllSignerMessagesByFid

▸ **getAllSignerMessagesByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2190](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2190)

▸ **getAllSignerMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2194](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2194)

▸ **getAllSignerMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2199](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2199)

___

### getAllSyncIdsByPrefix

▸ **getAllSyncIdsByPrefix**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs_src.md#trienodeprefix) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`SyncIds`](../modules/protobufs_src.md#syncids)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2233](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2233)

▸ **getAllSyncIdsByPrefix**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs_src.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`SyncIds`](../modules/protobufs_src.md#syncids)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2237](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2237)

▸ **getAllSyncIdsByPrefix**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs_src.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`SyncIds`](../modules/protobufs_src.md#syncids)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2242](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2242)

___

### getAllUserDataMessagesByFid

▸ **getAllUserDataMessagesByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2205](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2205)

▸ **getAllUserDataMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2209](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2209)

▸ **getAllUserDataMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2214](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2214)

___

### getAllVerificationMessagesByFid

▸ **getAllVerificationMessagesByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2175](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2175)

▸ **getAllVerificationMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2179](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2179)

▸ **getAllVerificationMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2184](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2184)

___

### getAmp

▸ **getAmp**(`request`, `callback`): `SurfaceCall`

Amps

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`AmpRequest`](../modules/protobufs_src.md#amprequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1955](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1955)

▸ **getAmp**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`AmpRequest`](../modules/protobufs_src.md#amprequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1956](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1956)

▸ **getAmp**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`AmpRequest`](../modules/protobufs_src.md#amprequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1961](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1961)

___

### getAmpsByFid

▸ **getAmpsByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1967](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1967)

▸ **getAmpsByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1971](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1971)

▸ **getAmpsByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1976](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1976)

___

### getAmpsByUser

▸ **getAmpsByUser**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1982](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1982)

▸ **getAmpsByUser**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1986](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1986)

▸ **getAmpsByUser**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1991](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1991)

___

### getCast

▸ **getCast**(`request`, `callback`): `SurfaceCall`

Casts

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs_src.md#castid) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1851](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1851)

▸ **getCast**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs_src.md#castid) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1852](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1852)

▸ **getCast**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs_src.md#castid) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1857](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1857)

___

### getCastsByFid

▸ **getCastsByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1863](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1863)

▸ **getCastsByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1867](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1867)

▸ **getCastsByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1872](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1872)

___

### getCastsByMention

▸ **getCastsByMention**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1893](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1893)

▸ **getCastsByMention**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1897](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1897)

▸ **getCastsByMention**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1902](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1902)

___

### getCastsByParent

▸ **getCastsByParent**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs_src.md#castid) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1878](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1878)

▸ **getCastsByParent**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs_src.md#castid) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1882](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1882)

▸ **getCastsByParent**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/protobufs_src.md#castid) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1887](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1887)

___

### getFids

▸ **getFids**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs_src.md#empty) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`FidsResponse`](../modules/protobufs_src.md#fidsresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2117](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2117)

▸ **getFids**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs_src.md#empty) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`FidsResponse`](../modules/protobufs_src.md#fidsresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2118](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2118)

▸ **getFids**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs_src.md#empty) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`FidsResponse`](../modules/protobufs_src.md#fidsresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2123](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2123)

___

### getIdRegistryEvent

▸ **getIdRegistryEvent**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs_src.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2102](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2102)

▸ **getIdRegistryEvent**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs_src.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2106](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2106)

▸ **getIdRegistryEvent**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs_src.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2111](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2111)

___

### getInfo

▸ **getInfo**(`request`, `callback`): `SurfaceCall`

Sync Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs_src.md#empty) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubInfoResponse`](../modules/protobufs_src.md#hubinforesponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2221](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2221)

▸ **getInfo**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs_src.md#empty) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubInfoResponse`](../modules/protobufs_src.md#hubinforesponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2222](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2222)

▸ **getInfo**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs_src.md#empty) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubInfoResponse`](../modules/protobufs_src.md#hubinforesponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2227](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2227)

___

### getNameRegistryEvent

▸ **getNameRegistryEvent**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEventRequest`](../modules/protobufs_src.md#nameregistryeventrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs_src.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2028](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2028)

▸ **getNameRegistryEvent**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEventRequest`](../modules/protobufs_src.md#nameregistryeventrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs_src.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2032](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2032)

▸ **getNameRegistryEvent**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEventRequest`](../modules/protobufs_src.md#nameregistryeventrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs_src.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2037](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2037)

___

### getReaction

▸ **getReaction**(`request`, `callback`): `SurfaceCall`

Reactions

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionRequest`](../modules/protobufs_src.md#reactionrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1909](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1909)

▸ **getReaction**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionRequest`](../modules/protobufs_src.md#reactionrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1913](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1913)

▸ **getReaction**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionRequest`](../modules/protobufs_src.md#reactionrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1918](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1918)

___

### getReactionsByCast

▸ **getReactionsByCast**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByCastRequest`](../modules/protobufs_src.md#reactionsbycastrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1939](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1939)

▸ **getReactionsByCast**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByCastRequest`](../modules/protobufs_src.md#reactionsbycastrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1943](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1943)

▸ **getReactionsByCast**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByCastRequest`](../modules/protobufs_src.md#reactionsbycastrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1948](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1948)

___

### getReactionsByFid

▸ **getReactionsByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByFidRequest`](../modules/protobufs_src.md#reactionsbyfidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1924](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1924)

▸ **getReactionsByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByFidRequest`](../modules/protobufs_src.md#reactionsbyfidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1928](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1928)

▸ **getReactionsByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByFidRequest`](../modules/protobufs_src.md#reactionsbyfidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1933](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1933)

___

### getSigner

▸ **getSigner**(`request`, `callback`): `SurfaceCall`

Signer

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SignerRequest`](../modules/protobufs_src.md#signerrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2075](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2075)

▸ **getSigner**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SignerRequest`](../modules/protobufs_src.md#signerrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2076](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2076)

▸ **getSigner**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SignerRequest`](../modules/protobufs_src.md#signerrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2081](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2081)

___

### getSignersByFid

▸ **getSignersByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2087](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2087)

▸ **getSignersByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2091](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2091)

▸ **getSignersByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2096](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2096)

___

### getSyncMetadataByPrefix

▸ **getSyncMetadataByPrefix**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs_src.md#trienodeprefix) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeMetadataResponse`](../modules/protobufs_src.md#trienodemetadataresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2263](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2263)

▸ **getSyncMetadataByPrefix**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs_src.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeMetadataResponse`](../modules/protobufs_src.md#trienodemetadataresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2267](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2267)

▸ **getSyncMetadataByPrefix**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs_src.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeMetadataResponse`](../modules/protobufs_src.md#trienodemetadataresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2272](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2272)

___

### getSyncSnapshotByPrefix

▸ **getSyncSnapshotByPrefix**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs_src.md#trienodeprefix) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeSnapshotResponse`](../modules/protobufs_src.md#trienodesnapshotresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2278](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2278)

▸ **getSyncSnapshotByPrefix**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs_src.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeSnapshotResponse`](../modules/protobufs_src.md#trienodesnapshotresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2282](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2282)

▸ **getSyncSnapshotByPrefix**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/protobufs_src.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeSnapshotResponse`](../modules/protobufs_src.md#trienodesnapshotresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2287](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2287)

___

### getUserData

▸ **getUserData**(`request`, `callback`): `SurfaceCall`

User Data

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`UserDataRequest`](../modules/protobufs_src.md#userdatarequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1998](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1998)

▸ **getUserData**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`UserDataRequest`](../modules/protobufs_src.md#userdatarequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2002](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2002)

▸ **getUserData**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`UserDataRequest`](../modules/protobufs_src.md#userdatarequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2007](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2007)

___

### getUserDataByFid

▸ **getUserDataByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2013](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2013)

▸ **getUserDataByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2017](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2017)

▸ **getUserDataByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2022](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2022)

___

### getVerification

▸ **getVerification**(`request`, `callback`): `SurfaceCall`

Verifications

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`VerificationRequest`](../modules/protobufs_src.md#verificationrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2044](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2044)

▸ **getVerification**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`VerificationRequest`](../modules/protobufs_src.md#verificationrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2048](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2048)

▸ **getVerification**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`VerificationRequest`](../modules/protobufs_src.md#verificationrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2053](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2053)

___

### getVerificationsByFid

▸ **getVerificationsByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2059](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2059)

▸ **getVerificationsByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2063](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2063)

▸ **getVerificationsByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/protobufs_src.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/protobufs_src.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:2068](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L2068)

___

### submitIdRegistryEvent

▸ **submitIdRegistryEvent**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`IdRegistryEvent`](../modules/protobufs_src.md#idregistryevent) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs_src.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1813](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1813)

▸ **submitIdRegistryEvent**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`IdRegistryEvent`](../modules/protobufs_src.md#idregistryevent) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs_src.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1817](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1817)

▸ **submitIdRegistryEvent**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`IdRegistryEvent`](../modules/protobufs_src.md#idregistryevent) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/protobufs_src.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1822](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1822)

___

### submitMessage

▸ **submitMessage**(`request`, `callback`): `SurfaceCall`

Submit Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Message`](../modules/protobufs_src.md#message) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1801](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1801)

▸ **submitMessage**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Message`](../modules/protobufs_src.md#message) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1802](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1802)

▸ **submitMessage**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Message`](../modules/protobufs_src.md#message) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/protobufs_src.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1807](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1807)

___

### submitNameRegistryEvent

▸ **submitNameRegistryEvent**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEvent`](../modules/protobufs_src.md#nameregistryevent) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs_src.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1828](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1828)

▸ **submitNameRegistryEvent**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEvent`](../modules/protobufs_src.md#nameregistryevent) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs_src.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1832](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1832)

▸ **submitNameRegistryEvent**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEvent`](../modules/protobufs_src.md#nameregistryevent) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/protobufs_src.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

[protobufs/src/generated/rpc.ts:1837](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1837)

___

### subscribe

▸ **subscribe**(`request`, `options?`): `ClientReadableStream`<[`EventResponse`](../modules/protobufs_src.md#eventresponse)\>

Event Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SubscribeRequest`](../modules/protobufs_src.md#subscriberequest) |
| `options?` | `Partial`<`CallOptions`\> |

#### Returns

`ClientReadableStream`<[`EventResponse`](../modules/protobufs_src.md#eventresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1844](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1844)

▸ **subscribe**(`request`, `metadata?`, `options?`): `ClientReadableStream`<[`EventResponse`](../modules/protobufs_src.md#eventresponse)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SubscribeRequest`](../modules/protobufs_src.md#subscriberequest) |
| `metadata?` | `Metadata` |
| `options?` | `Partial`<`CallOptions`\> |

#### Returns

`ClientReadableStream`<[`EventResponse`](../modules/protobufs_src.md#eventresponse)\>

#### Defined in

[protobufs/src/generated/rpc.ts:1845](https://github.com/vinliao/hubble/blob/f898740/packages/protobufs/src/generated/rpc.ts#L1845)
