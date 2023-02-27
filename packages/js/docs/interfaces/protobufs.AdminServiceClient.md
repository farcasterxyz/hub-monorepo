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

▸ **deleteAllMessagesFromDb**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Empty`](../modules/protobufs.md#empty)) =>  |

▸ **deleteAllMessagesFromDb**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Empty`](../modules/protobufs.md#empty)) =>  |

▸ **deleteAllMessagesFromDb**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Empty`](../modules/protobufs.md#empty)) =>  |

___

### rebuildSyncTrie

▸ **rebuildSyncTrie**(`request`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Empty`](../modules/protobufs.md#empty)) =>  |

▸ **rebuildSyncTrie**(`request`, `metadata`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `metadata` | `Metadata` |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Empty`](../modules/protobufs.md#empty)) =>  |

▸ **rebuildSyncTrie**(`request`, `metadata`, `options`, `callback`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `request` | [`Empty`](../modules/protobufs.md#empty) |
| `metadata` | `Metadata` |
| `options` | `Partial`<`CallOptions`\> |
| `callback` | (`error`: ``null`` \| `ServiceError`, `response`: [`Empty`](../modules/protobufs.md#empty)) =>  |
