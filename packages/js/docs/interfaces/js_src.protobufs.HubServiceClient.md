[hubble](../README.md) / [Modules](../modules.md) / [js/src](../modules/js_src.md) / [protobufs](../modules/js_src.protobufs.md) / HubServiceClient

# Interface: HubServiceClient

[js/src](../modules/js_src.md).[protobufs](../modules/js_src.protobufs.md).HubServiceClient

## Hierarchy

- `Client`

  ↳ **`HubServiceClient`**

## Table of contents

### Methods

- [getAllAmpMessagesByFid](js_src.protobufs.HubServiceClient.md#getallampmessagesbyfid)
- [getAllCastMessagesByFid](js_src.protobufs.HubServiceClient.md#getallcastmessagesbyfid)
- [getAllMessagesBySyncIds](js_src.protobufs.HubServiceClient.md#getallmessagesbysyncids)
- [getAllReactionMessagesByFid](js_src.protobufs.HubServiceClient.md#getallreactionmessagesbyfid)
- [getAllSignerMessagesByFid](js_src.protobufs.HubServiceClient.md#getallsignermessagesbyfid)
- [getAllSyncIdsByPrefix](js_src.protobufs.HubServiceClient.md#getallsyncidsbyprefix)
- [getAllUserDataMessagesByFid](js_src.protobufs.HubServiceClient.md#getalluserdatamessagesbyfid)
- [getAllVerificationMessagesByFid](js_src.protobufs.HubServiceClient.md#getallverificationmessagesbyfid)
- [getAmp](js_src.protobufs.HubServiceClient.md#getamp)
- [getAmpsByFid](js_src.protobufs.HubServiceClient.md#getampsbyfid)
- [getAmpsByUser](js_src.protobufs.HubServiceClient.md#getampsbyuser)
- [getCast](js_src.protobufs.HubServiceClient.md#getcast)
- [getCastsByFid](js_src.protobufs.HubServiceClient.md#getcastsbyfid)
- [getCastsByMention](js_src.protobufs.HubServiceClient.md#getcastsbymention)
- [getCastsByParent](js_src.protobufs.HubServiceClient.md#getcastsbyparent)
- [getFids](js_src.protobufs.HubServiceClient.md#getfids)
- [getIdRegistryEvent](js_src.protobufs.HubServiceClient.md#getidregistryevent)
- [getInfo](js_src.protobufs.HubServiceClient.md#getinfo)
- [getNameRegistryEvent](js_src.protobufs.HubServiceClient.md#getnameregistryevent)
- [getReaction](js_src.protobufs.HubServiceClient.md#getreaction)
- [getReactionsByCast](js_src.protobufs.HubServiceClient.md#getreactionsbycast)
- [getReactionsByFid](js_src.protobufs.HubServiceClient.md#getreactionsbyfid)
- [getSigner](js_src.protobufs.HubServiceClient.md#getsigner)
- [getSignersByFid](js_src.protobufs.HubServiceClient.md#getsignersbyfid)
- [getSyncMetadataByPrefix](js_src.protobufs.HubServiceClient.md#getsyncmetadatabyprefix)
- [getSyncSnapshotByPrefix](js_src.protobufs.HubServiceClient.md#getsyncsnapshotbyprefix)
- [getUserData](js_src.protobufs.HubServiceClient.md#getuserdata)
- [getUserDataByFid](js_src.protobufs.HubServiceClient.md#getuserdatabyfid)
- [getVerification](js_src.protobufs.HubServiceClient.md#getverification)
- [getVerificationsByFid](js_src.protobufs.HubServiceClient.md#getverificationsbyfid)
- [submitIdRegistryEvent](js_src.protobufs.HubServiceClient.md#submitidregistryevent)
- [submitMessage](js_src.protobufs.HubServiceClient.md#submitmessage)
- [submitNameRegistryEvent](js_src.protobufs.HubServiceClient.md#submitnameregistryevent)
- [subscribe](js_src.protobufs.HubServiceClient.md#subscribe)

## Methods

### getAllAmpMessagesByFid

▸ **getAllAmpMessagesByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4143

▸ **getAllAmpMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4144

▸ **getAllAmpMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4145

___

### getAllCastMessagesByFid

▸ **getAllCastMessagesByFid**(`request`, `callback`): `SurfaceCall`

Bulk Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4137

▸ **getAllCastMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4138

▸ **getAllCastMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4139

___

### getAllMessagesBySyncIds

▸ **getAllMessagesBySyncIds**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SyncIds`](../modules/js_src.protobufs.md#syncids) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4162

▸ **getAllMessagesBySyncIds**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SyncIds`](../modules/js_src.protobufs.md#syncids) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4163

▸ **getAllMessagesBySyncIds**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SyncIds`](../modules/js_src.protobufs.md#syncids) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4164

___

### getAllReactionMessagesByFid

▸ **getAllReactionMessagesByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4140

▸ **getAllReactionMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4141

▸ **getAllReactionMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4142

___

### getAllSignerMessagesByFid

▸ **getAllSignerMessagesByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4149

▸ **getAllSignerMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4150

▸ **getAllSignerMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4151

___

### getAllSyncIdsByPrefix

▸ **getAllSyncIdsByPrefix**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/js_src.protobufs.md#trienodeprefix) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`SyncIds`](../modules/js_src.protobufs.md#syncids)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4159

▸ **getAllSyncIdsByPrefix**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/js_src.protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`SyncIds`](../modules/js_src.protobufs.md#syncids)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4160

▸ **getAllSyncIdsByPrefix**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/js_src.protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`SyncIds`](../modules/js_src.protobufs.md#syncids)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4161

___

### getAllUserDataMessagesByFid

▸ **getAllUserDataMessagesByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4152

▸ **getAllUserDataMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4153

▸ **getAllUserDataMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4154

___

### getAllVerificationMessagesByFid

▸ **getAllVerificationMessagesByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4146

▸ **getAllVerificationMessagesByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4147

▸ **getAllVerificationMessagesByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4148

___

### getAmp

▸ **getAmp**(`request`, `callback`): `SurfaceCall`

Amps

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`AmpRequest`](../modules/js_src.protobufs.md#amprequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4097

▸ **getAmp**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`AmpRequest`](../modules/js_src.protobufs.md#amprequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4098

▸ **getAmp**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`AmpRequest`](../modules/js_src.protobufs.md#amprequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4099

___

### getAmpsByFid

▸ **getAmpsByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4100

▸ **getAmpsByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4101

▸ **getAmpsByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4102

___

### getAmpsByUser

▸ **getAmpsByUser**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4103

▸ **getAmpsByUser**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4104

▸ **getAmpsByUser**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4105

___

### getCast

▸ **getCast**(`request`, `callback`): `SurfaceCall`

Casts

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/js_src.protobufs.md#castid) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4074

▸ **getCast**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/js_src.protobufs.md#castid) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4075

▸ **getCast**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/js_src.protobufs.md#castid) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4076

___

### getCastsByFid

▸ **getCastsByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4077

▸ **getCastsByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4078

▸ **getCastsByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4079

___

### getCastsByMention

▸ **getCastsByMention**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4083

▸ **getCastsByMention**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4084

▸ **getCastsByMention**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4085

___

### getCastsByParent

▸ **getCastsByParent**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/js_src.protobufs.md#castid) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4080

▸ **getCastsByParent**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/js_src.protobufs.md#castid) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4081

▸ **getCastsByParent**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`CastId`](../modules/js_src.protobufs.md#castid) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4082

___

### getFids

▸ **getFids**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/js_src.protobufs.md#empty) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`FidsResponse`](../modules/js_src.protobufs.md#fidsresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4133

▸ **getFids**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/js_src.protobufs.md#empty) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`FidsResponse`](../modules/js_src.protobufs.md#fidsresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4134

▸ **getFids**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/js_src.protobufs.md#empty) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`FidsResponse`](../modules/js_src.protobufs.md#fidsresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4135

___

### getIdRegistryEvent

▸ **getIdRegistryEvent**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/js_src.protobufs.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4130

▸ **getIdRegistryEvent**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/js_src.protobufs.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4131

▸ **getIdRegistryEvent**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/js_src.protobufs.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4132

___

### getInfo

▸ **getInfo**(`request`, `callback`): `SurfaceCall`

Sync Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/js_src.protobufs.md#empty) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubInfoResponse`](../modules/js_src.protobufs.md#hubinforesponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4156

▸ **getInfo**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/js_src.protobufs.md#empty) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubInfoResponse`](../modules/js_src.protobufs.md#hubinforesponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4157

▸ **getInfo**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/js_src.protobufs.md#empty) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`HubInfoResponse`](../modules/js_src.protobufs.md#hubinforesponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4158

___

### getNameRegistryEvent

▸ **getNameRegistryEvent**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEventRequest`](../modules/js_src.protobufs.md#nameregistryeventrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/js_src.protobufs.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4113

▸ **getNameRegistryEvent**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEventRequest`](../modules/js_src.protobufs.md#nameregistryeventrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/js_src.protobufs.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4114

▸ **getNameRegistryEvent**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEventRequest`](../modules/js_src.protobufs.md#nameregistryeventrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/js_src.protobufs.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4115

___

### getReaction

▸ **getReaction**(`request`, `callback`): `SurfaceCall`

Reactions

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionRequest`](../modules/js_src.protobufs.md#reactionrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4087

▸ **getReaction**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionRequest`](../modules/js_src.protobufs.md#reactionrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4088

▸ **getReaction**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionRequest`](../modules/js_src.protobufs.md#reactionrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4089

___

### getReactionsByCast

▸ **getReactionsByCast**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByCastRequest`](../modules/js_src.protobufs.md#reactionsbycastrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4093

▸ **getReactionsByCast**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByCastRequest`](../modules/js_src.protobufs.md#reactionsbycastrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4094

▸ **getReactionsByCast**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByCastRequest`](../modules/js_src.protobufs.md#reactionsbycastrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4095

___

### getReactionsByFid

▸ **getReactionsByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByFidRequest`](../modules/js_src.protobufs.md#reactionsbyfidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4090

▸ **getReactionsByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByFidRequest`](../modules/js_src.protobufs.md#reactionsbyfidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4091

▸ **getReactionsByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`ReactionsByFidRequest`](../modules/js_src.protobufs.md#reactionsbyfidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4092

___

### getSigner

▸ **getSigner**(`request`, `callback`): `SurfaceCall`

Signer

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SignerRequest`](../modules/js_src.protobufs.md#signerrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4124

▸ **getSigner**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SignerRequest`](../modules/js_src.protobufs.md#signerrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4125

▸ **getSigner**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SignerRequest`](../modules/js_src.protobufs.md#signerrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4126

___

### getSignersByFid

▸ **getSignersByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4127

▸ **getSignersByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4128

▸ **getSignersByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4129

___

### getSyncMetadataByPrefix

▸ **getSyncMetadataByPrefix**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/js_src.protobufs.md#trienodeprefix) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeMetadataResponse`](../modules/js_src.protobufs.md#trienodemetadataresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4165

▸ **getSyncMetadataByPrefix**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/js_src.protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeMetadataResponse`](../modules/js_src.protobufs.md#trienodemetadataresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4166

▸ **getSyncMetadataByPrefix**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/js_src.protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeMetadataResponse`](../modules/js_src.protobufs.md#trienodemetadataresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4167

___

### getSyncSnapshotByPrefix

▸ **getSyncSnapshotByPrefix**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/js_src.protobufs.md#trienodeprefix) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeSnapshotResponse`](../modules/js_src.protobufs.md#trienodesnapshotresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4168

▸ **getSyncSnapshotByPrefix**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/js_src.protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeSnapshotResponse`](../modules/js_src.protobufs.md#trienodesnapshotresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4169

▸ **getSyncSnapshotByPrefix**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`TrieNodePrefix`](../modules/js_src.protobufs.md#trienodeprefix) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`TrieNodeSnapshotResponse`](../modules/js_src.protobufs.md#trienodesnapshotresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4170

___

### getUserData

▸ **getUserData**(`request`, `callback`): `SurfaceCall`

User Data

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`UserDataRequest`](../modules/js_src.protobufs.md#userdatarequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4107

▸ **getUserData**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`UserDataRequest`](../modules/js_src.protobufs.md#userdatarequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4108

▸ **getUserData**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`UserDataRequest`](../modules/js_src.protobufs.md#userdatarequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4109

___

### getUserDataByFid

▸ **getUserDataByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4110

▸ **getUserDataByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4111

▸ **getUserDataByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4112

___

### getVerification

▸ **getVerification**(`request`, `callback`): `SurfaceCall`

Verifications

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`VerificationRequest`](../modules/js_src.protobufs.md#verificationrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4117

▸ **getVerification**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`VerificationRequest`](../modules/js_src.protobufs.md#verificationrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4118

▸ **getVerification**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`VerificationRequest`](../modules/js_src.protobufs.md#verificationrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4119

___

### getVerificationsByFid

▸ **getVerificationsByFid**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4120

▸ **getVerificationsByFid**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4121

▸ **getVerificationsByFid**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`FidRequest`](../modules/js_src.protobufs.md#fidrequest) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`MessagesResponse`](../modules/js_src.protobufs.md#messagesresponse)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4122

___

### submitIdRegistryEvent

▸ **submitIdRegistryEvent**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`IdRegistryEvent`](../modules/js_src.protobufs.md#idregistryevent) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/js_src.protobufs.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4064

▸ **submitIdRegistryEvent**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`IdRegistryEvent`](../modules/js_src.protobufs.md#idregistryevent) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/js_src.protobufs.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4065

▸ **submitIdRegistryEvent**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`IdRegistryEvent`](../modules/js_src.protobufs.md#idregistryevent) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`IdRegistryEvent`](../modules/js_src.protobufs.md#idregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4066

___

### submitMessage

▸ **submitMessage**(`request`, `callback`): `SurfaceCall`

Submit Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Message`](../modules/js_src.protobufs.md#message) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4061

▸ **submitMessage**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Message`](../modules/js_src.protobufs.md#message) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4062

▸ **submitMessage**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Message`](../modules/js_src.protobufs.md#message) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Message`](../modules/js_src.protobufs.md#message)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4063

___

### submitNameRegistryEvent

▸ **submitNameRegistryEvent**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEvent`](../modules/js_src.protobufs.md#nameregistryevent) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/js_src.protobufs.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4067

▸ **submitNameRegistryEvent**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEvent`](../modules/js_src.protobufs.md#nameregistryevent) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/js_src.protobufs.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4068

▸ **submitNameRegistryEvent**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`NameRegistryEvent`](../modules/js_src.protobufs.md#nameregistryevent) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`NameRegistryEvent`](../modules/js_src.protobufs.md#nameregistryevent)) => `void` |

#### Returns

`SurfaceCall`

#### Defined in

protobufs/dist/index.d.ts:4069

___

### subscribe

▸ **subscribe**(`request`, `options?`): `ClientReadableStream`<[`EventResponse`](../modules/js_src.protobufs.md#eventresponse)\>

Event Methods

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SubscribeRequest`](../modules/js_src.protobufs.md#subscriberequest) |
| `options?` | `Partial`<`CallOptions`\> |

#### Returns

`ClientReadableStream`<[`EventResponse`](../modules/js_src.protobufs.md#eventresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4071

▸ **subscribe**(`request`, `metadata?`, `options?`): `ClientReadableStream`<[`EventResponse`](../modules/js_src.protobufs.md#eventresponse)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`SubscribeRequest`](../modules/js_src.protobufs.md#subscriberequest) |
| `metadata?` | `Metadata` |
| `options?` | `Partial`<`CallOptions`\> |

#### Returns

`ClientReadableStream`<[`EventResponse`](../modules/js_src.protobufs.md#eventresponse)\>

#### Defined in

protobufs/dist/index.d.ts:4072
