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

▸ **getAllCastMessagesByFid**(`fid`)

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

___

### getAllReactionMessagesByFid

▸ **getAllReactionMessagesByFid**(`fid`)

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

___

### getAllSignerMessagesByFid

▸ **getAllSignerMessagesByFid**(`fid`)

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

___

### getAllUserDataMessagesByFid

▸ **getAllUserDataMessagesByFid**(`fid`)

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

___

### getAllVerificationMessagesByFid

▸ **getAllVerificationMessagesByFid**(`fid`)

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

___

### getCast

▸ **getCast**(`fid`, `hash`)

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

___

### getCastsByFid

▸ **getCastsByFid**(`fid`)

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

___

### getCastsByMention

▸ **getCastsByMention**(`mentionFid`)

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

___

### getCastsByParent

▸ **getCastsByParent**(`parent`)

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

___

### getIdRegistryEvent

▸ **getIdRegistryEvent**(`fid`)

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

___

### getNameRegistryEvent

▸ **getNameRegistryEvent**(`fname`)

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

___

### getReaction

▸ **getReaction**(`fid`, `type`, `cast`)

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

___

### getReactionsByCast

▸ **getReactionsByCast**(`cast`, `type?`)

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

___

### getReactionsByFid

▸ **getReactionsByFid**(`fid`, `type?`)

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

___

### getSigner

▸ **getSigner**(`fid`, `signer`)

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

___

### getSignersByFid

▸ **getSignersByFid**(`fid`)

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

___

### getUserData

▸ **getUserData**(`fid`, `type`)

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

___

### getUserDataByFid

▸ **getUserDataByFid**(`fid`)

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

___

### getVerification

▸ **getVerification**(`fid`, `address`)

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

___

### getVerificationsByFid

▸ **getVerificationsByFid**(`fid`)

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

___

### submitMessage

▸ **submitMessage**(`message`)

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

___

### subscribe

▸ **subscribe**(`filters?`)

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
