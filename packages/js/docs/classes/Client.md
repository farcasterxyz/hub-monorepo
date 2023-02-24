[@farcaster/js](../README.md) / [Exports](../modules.md) / Client

# Class: Client

## Table of contents

### Constructors

- [constructor](Client.md#constructor)

### Properties

- [\_grpcClient](Client.md#_grpcclient)

### Methods

- [getAllCastMessagesByFid](Client.md#getallcastmessagesbyfid)
- [getAllReactionMessagesByFid](Client.md#getallreactionmessagesbyfid)
- [getAllSignerMessagesByFid](Client.md#getallsignermessagesbyfid)
- [getAllUserDataMessagesByFid](Client.md#getalluserdatamessagesbyfid)
- [getAllVerificationMessagesByFid](Client.md#getallverificationmessagesbyfid)
- [getCast](Client.md#getcast)
- [getCastsByFid](Client.md#getcastsbyfid)
- [getCastsByMention](Client.md#getcastsbymention)
- [getCastsByParent](Client.md#getcastsbyparent)
- [getIdRegistryEvent](Client.md#getidregistryevent)
- [getNameRegistryEvent](Client.md#getnameregistryevent)
- [getReaction](Client.md#getreaction)
- [getReactionsByCast](Client.md#getreactionsbycast)
- [getReactionsByFid](Client.md#getreactionsbyfid)
- [getSigner](Client.md#getsigner)
- [getSignersByFid](Client.md#getsignersbyfid)
- [getUserData](Client.md#getuserdata)
- [getUserDataByFid](Client.md#getuserdatabyfid)
- [getVerification](Client.md#getverification)
- [getVerificationsByFid](Client.md#getverificationsbyfid)
- [submitMessage](Client.md#submitmessage)
- [subscribe](Client.md#subscribe)

## Constructors

### constructor

• **new Client**(`address`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

## Properties

### \_grpcClient

• **\_grpcClient**: `HubRpcClient`

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

...
```

**`Param`**

## Methods

### getAllCastMessagesByFid

▸ **getAllCastMessagesByFid**(`fid`): `HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`CastAddData`](../modules/types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`CastRemoveData`](../modules/types.md#castremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`CastAddData`](../modules/types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`CastRemoveData`](../modules/types.md#castremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

...

___

### getAllReactionMessagesByFid

▸ **getAllReactionMessagesByFid**(`fid`): `HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`ReactionAddData`](../modules/types.md#reactionadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`ReactionRemoveData`](../modules/types.md#reactionremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`ReactionAddData`](../modules/types.md#reactionadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`ReactionRemoveData`](../modules/types.md#reactionremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

...

___

### getAllSignerMessagesByFid

▸ **getAllSignerMessagesByFid**(`fid`): `HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`SignerAddData`](../modules/types.md#signeradddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`SignerRemoveData`](../modules/types.md#signerremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`SignerAddData`](../modules/types.md#signeradddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`SignerRemoveData`](../modules/types.md#signerremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

...

___

### getAllUserDataMessagesByFid

▸ **getAllUserDataMessagesByFid**(`fid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`UserDataAddData`](../modules/types.md#userdataadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`UserDataAddData`](../modules/types.md#userdataadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

...

___

### getAllVerificationMessagesByFid

▸ **getAllVerificationMessagesByFid**(`fid`): `HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`VerificationAddEthAddressData`](../modules/types.md#verificationaddethaddressdata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`VerificationRemoveData`](../modules/types.md#verificationremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<(`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`VerificationAddEthAddressData`](../modules/types.md#verificationaddethaddressdata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\> \| `Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`VerificationRemoveData`](../modules/types.md#verificationremovedata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>)[]\>

...

___

### getCast

▸ **getCast**(`fid`, `hash`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`CastAddData`](../modules/types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `hash` | `string` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`CastAddData`](../modules/types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

...

___

### getCastsByFid

▸ **getCastsByFid**(`fid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`CastAddData`](../modules/types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`CastAddData`](../modules/types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

...

___

### getCastsByMention

▸ **getCastsByMention**(`mentionFid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`CastAddData`](../modules/types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `mentionFid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`CastAddData`](../modules/types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

...

___

### getCastsByParent

▸ **getCastsByParent**(`parent`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`CastAddData`](../modules/types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `parent` | [`CastId`](../modules/types.md#castid) |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`CastAddData`](../modules/types.md#castadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

...

___

### getIdRegistryEvent

▸ **getIdRegistryEvent**(`fid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `fid`: `number` ; `from`: `undefined` \| `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`IdRegistryEventType`](../enums/protobufs.IdRegistryEventType.md)  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`IdRegistryEvent`](../modules/protobufs.md#idregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `fid`: `number` ; `from`: `undefined` \| `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`IdRegistryEventType`](../enums/protobufs.IdRegistryEventType.md)  }\>\>

...

___

### getNameRegistryEvent

▸ **getNameRegistryEvent**(`fname`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `expiry`: `undefined` \| `number` ; `fname`: `string` ; `from`: `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`NameRegistryEventType`](../enums/protobufs.NameRegistryEventType.md)  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fname` | `string` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`NameRegistryEvent`](../modules/protobufs.md#nameregistryevent) ; `blockHash`: `string` ; `blockNumber`: `number` ; `expiry`: `undefined` \| `number` ; `fname`: `string` ; `from`: `string` ; `logIndex`: `number` ; `to`: `string` ; `transactionHash`: `string` ; `type`: [`NameRegistryEventType`](../enums/protobufs.NameRegistryEventType.md)  }\>\>

...

___

### getReaction

▸ **getReaction**(`fid`, `type`, `cast`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`ReactionAddData`](../modules/types.md#reactionadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `type` | [`ReactionType`](../enums/protobufs.ReactionType.md) |
| `cast` | [`CastId`](../modules/types.md#castid) |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`ReactionAddData`](../modules/types.md#reactionadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

...

___

### getReactionsByCast

▸ **getReactionsByCast**(`cast`, `type?`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`ReactionAddData`](../modules/types.md#reactionadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `cast` | [`CastId`](../modules/types.md#castid) |
| `type?` | [`ReactionType`](../enums/protobufs.ReactionType.md) |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`ReactionAddData`](../modules/types.md#reactionadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

...

___

### getReactionsByFid

▸ **getReactionsByFid**(`fid`, `type?`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`ReactionAddData`](../modules/types.md#reactionadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `type?` | [`ReactionType`](../enums/protobufs.ReactionType.md) |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`ReactionAddData`](../modules/types.md#reactionadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

...

___

### getSigner

▸ **getSigner**(`fid`, `signer`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`SignerAddData`](../modules/types.md#signeradddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `signer` | `string` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`SignerAddData`](../modules/types.md#signeradddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

...

___

### getSignersByFid

▸ **getSignersByFid**(`fid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`SignerAddData`](../modules/types.md#signeradddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`SignerAddData`](../modules/types.md#signeradddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

...

___

### getUserData

▸ **getUserData**(`fid`, `type`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`UserDataAddData`](../modules/types.md#userdataadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `type` | [`UserDataType`](../enums/protobufs.UserDataType.md) |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`UserDataAddData`](../modules/types.md#userdataadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

...

___

### getUserDataByFid

▸ **getUserDataByFid**(`fid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`UserDataAddData`](../modules/types.md#userdataadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`UserDataAddData`](../modules/types.md#userdataadddata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

...

___

### getVerification

▸ **getVerification**(`fid`, `address`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`VerificationAddEthAddressData`](../modules/types.md#verificationaddethaddressdata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `address` | `string` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`VerificationAddEthAddressData`](../modules/types.md#verificationaddethaddressdata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

...

___

### getVerificationsByFid

▸ **getVerificationsByFid**(`fid`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`VerificationAddEthAddressData`](../modules/types.md#verificationaddethaddressdata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`VerificationAddEthAddressData`](../modules/types.md#verificationaddethaddressdata) ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>[]\>

...

___

### submitMessage

▸ **submitMessage**(`message`): `HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`MessageData`](../modules/types.md#messagedata)<[`MessageBody`](../modules/types.md#messagebody), [`MessageType`](../enums/protobufs.MessageType.md)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`MessageData`](../modules/types.md#messagedata)<[`MessageBody`](../modules/types.md#messagebody), [`MessageType`](../enums/protobufs.MessageType.md)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\> |

#### Returns

`HubAsyncResult`<`Readonly`<{ `_protobuf`: [`Message`](../modules/protobufs.md#message) ; `data`: [`MessageData`](../modules/types.md#messagedata)<[`MessageBody`](../modules/types.md#messagebody), [`MessageType`](../enums/protobufs.MessageType.md)\> ; `hash`: `string` ; `hashScheme`: [`HashScheme`](../enums/protobufs.HashScheme.md) ; `signature`: `string` ; `signatureScheme`: [`SignatureScheme`](../enums/protobufs.SignatureScheme.md) ; `signer`: `string`  }\>\>

...

___

### subscribe

▸ **subscribe**(`filters?`): `Promise`<`HubResult`<`ClientReadableStream`<[`HubEvent`](../modules/protobufs.md#hubevent)\>\>\>

TODO DOCS: description

Note: Data from this stream can be parsed using `deserializeHubEvent`.

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
console.log(result)

// Output: ...
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `filters` | [`EventFilters`](../modules.md#eventfilters) |

#### Returns

`Promise`<`HubResult`<`ClientReadableStream`<[`HubEvent`](../modules/protobufs.md#hubevent)\>\>\>

...
