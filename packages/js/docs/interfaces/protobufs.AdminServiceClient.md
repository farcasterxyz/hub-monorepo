[@farcaster/js](../README.md) / [Exports](../modules.md) / [protobufs](../modules/protobufs.md) / AdminServiceClient

# Interface: AdminServiceClient

[protobufs](../modules/protobufs.md).AdminServiceClient

## Hierarchy

- `Client`

  ↳ **`AdminServiceClient`**

## Table of contents

### Methods

- [deleteAllMessagesFromDb](protobufs.AdminServiceClient.md#deleteallmessagesfromdb)
- [rebuildSyncTrie](protobufs.AdminServiceClient.md#rebuildsynctrie)

## Methods

### deleteAllMessagesFromDb

▸ **deleteAllMessagesFromDb**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Empty`](../modules/protobufs.md#empty)) => `void` |

#### Returns

`SurfaceCall`

▸ **deleteAllMessagesFromDb**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Empty`](../modules/protobufs.md#empty)) => `void` |

#### Returns

`SurfaceCall`

▸ **deleteAllMessagesFromDb**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Empty`](../modules/protobufs.md#empty)) => `void` |

#### Returns

`SurfaceCall`

___

### rebuildSyncTrie

▸ **rebuildSyncTrie**(`request`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Empty`](../modules/protobufs.md#empty)) => `void` |

#### Returns

`SurfaceCall`

▸ **rebuildSyncTrie**(`request`, `metadata`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Empty`](../modules/protobufs.md#empty)) => `void` |

#### Returns

`SurfaceCall`

▸ **rebuildSyncTrie**(`request`, `metadata`, `options`, `callback`): `SurfaceCall`

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Empty`](../modules/protobufs.md#empty)) => `void` |

#### Returns

`SurfaceCall`
