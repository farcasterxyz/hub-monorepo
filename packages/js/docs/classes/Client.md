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

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<CastAddMessage[]>` | [`CastAddMessage`](modules/types.md#castaddmessage)[] | A `HubAsyncResult` that contains the valid `CastAddMessage` array. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fid` | `number` | The fid from which the cast originates from. |

___

### getAllReactionMessagesByFid

▸ **getAllReactionMessagesByFid**(`fid`)

TODO DOCS: description

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<ReactionAddMessage[]>` | [`ReactionAddMessage`](modules/types.md#reactionaddmessage)[] | A `HubAsyncResult` that contains the valid `ReactionAddMessage` array. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fid` | `number` | The fid from which the cast originates from. |

___

### getAllSignerMessagesByFid

▸ **getAllSignerMessagesByFid**(`fid`)

TODO DOCS: description

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<(SignerAddMessage | SignerRemoveMessage)[]>` | [`SignerAddMessage`](modules/types.md#signeraddmessage)[] | A `HubAsyncResult` that contains the valid `SignerAddMessage` array. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fid` | `number` | The fid to get all signers for. |

___

### getAllUserDataMessagesByFid

▸ **getAllUserDataMessagesByFid**(`fid`)

TODO DOCS: description

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<(UserDataAddMessage | UserDataRemoveMessage)[]>` | [`UserDataAddMessage`](modules/types.md#userdataaddmessage)[] | A `HubAsyncResult` that contains the valid `UserDataAddMessage` array. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fid` | `number` | The fid to get all user data for. |

___

### getAllVerificationMessagesByFid

▸ **getAllVerificationMessagesByFid**(`fid`)

Get all verifications for a specific address.

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<(VerificationAddEthAddressMessage | VerificationRemoveMessage)[]>` | [`VerificationAddEthAddressMessage`](modules/types.md#verificationaddethaddressmessage)[] | A `HubAsyncResult` that contains the valid `VerificationAddEthAddressMessage` array. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fid` | `number` | The fid to get all verifications for. |

___

### getCast

▸ **getCast**(`fid`, `hash`)

Get a cast.

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<CastAddMessage>` | [`CastAddMessage`](modules/types.md#castaddmessage) | A `HubAsyncResult` that contains the valid `CastAddMessage`. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fid` | `number` | The fid from which the cast originates from. |
| `hash` | `string` | The hash of the cast. |

___

### getCastsByFid

▸ **getCastsByFid**(`fid`)

Get casts by fid.

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<CastAddMessage[]>` | [`CastAddMessage`](modules/types.md#castaddmessage)[] | A `HubAsyncResult` that contains the valid `CastAddMessage` array. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fid` | `number` | The fid from which the cast originates from. |

___

### getCastsByMention

▸ **getCastsByMention**(`mentionFid`)

TODO DOCS: description

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<CastAddMessage[]>` | [`CastAddMessage`](modules/types.md#castaddmessage)[] | A `HubAsyncResult` that contains the valid `CastAddMessage` array. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `mentionFid` | `number` | The fid from which the cast originates from. |

___

### getCastsByParent

▸ **getCastsByParent**(`parent`)

Get direct children of a cast.

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<CastAddMessage[]>` | [`CastAddMessage`](modules/types.md#castaddmessage)[] | A `HubAsyncResult` that contains the valid `CastAddMessage` array. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `parent` | [`CastId`](../modules/types.md#castid) | The parent cast id. |

___

### getIdRegistryEvent

▸ **getIdRegistryEvent**(`fid`)

Get fid registry event for a specific fid.

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<IdRegistryEvent>` | [`IdRegistryEvent`](modules/types.md#idregistryevent) | A `HubAsyncResult` that contains the valid `IdRegistryEvent`. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fid` | `number` | The fid to get registry event for. |

___

### getNameRegistryEvent

▸ **getNameRegistryEvent**(`fname`)

Get fname registry event for a specific fname.

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<NameRegistryEvent>` | [`NameRegistryEvent`](modules/types.md#nameregistryevent) | A `HubAsyncResult` that contains the valid `NameRegistryEvent`. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fname` | `string` | The fname to get registry event for. |

___

### getReaction

▸ **getReaction**(`fid`, `type`, `cast`)

Get reaction for a specific cast.

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<ReactionAddMessage>` | [`ReactionAddMessage`](modules/types.md#reactionaddmessage) | A `HubAsyncResult` that contains the valid `ReactionAddMessage`. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fid` | `number` | The fid from which the cast originates from. |
| `type` | [`ReactionType`](../enums/protobufs.ReactionType.md) | The type of the reaction (like or recast). |
| `cast` | [`CastId`](../modules/types.md#castid) | The cast id. |

___

### getReactionsByCast

▸ **getReactionsByCast**(`cast`, `type?`)

TODO DOCS: description

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<ReactionAddMessage[]>` | [`ReactionAddMessage`](modules/types.md#reactionaddmessage)[] | A `HubAsyncResult` that contains the valid `ReactionAddMessage` array. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cast` | [`CastId`](../modules/types.md#castid) | The cast id. |
| `type?` | [`ReactionType`](../enums/protobufs.ReactionType.md) | The type of the reaction (like or recast). |

___

### getReactionsByFid

▸ **getReactionsByFid**(`fid`, `type?`)

Get reactions from a specific fid.

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<ReactionAddMessage[]>` | [`ReactionAddMessage`](modules/types.md#reactionaddmessage)[] | A `HubAsyncResult` that contains the valid `ReactionAddMessage` array. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fid` | `number` | The fid from which the cast originates from. |
| `type?` | [`ReactionType`](../enums/protobufs.ReactionType.md) | The type of the reaction (like or recast). |

___

### getSigner

▸ **getSigner**(`fid`, `signer`)

TODO DOCS: description

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<SignerAddMessage>` | [`SignerAddMessage`](modules/types.md#signeraddmessage) | A `HubAsyncResult` that contains the valid `SignerAddMessage`. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `fid` | `number` |
| `signer` | `string` |

___

### getSignersByFid

▸ **getSignersByFid**(`fid`)

Get signers of a fid.

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<SignerAddMessage[]>` | [`SignerAddMessage`](modules/types.md#signeraddmessage)[] | A `HubAsyncResult` that contains the valid `SignerAddMessage` array. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fid` | `number` | The fid to get signers for. |

___

### getUserData

▸ **getUserData**(`fid`, `type`)

Get user data (pfp, username, fname, etc).

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<UserDataAddMessage>` | [`UserDataAddMessage`](modules/types.md#userdataaddmessage) | A `HubAsyncResult` that contains the valid `UserDataAddMessage`. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fid` | `number` | The fid to get user data for. |
| `type` | [`UserDataType`](../enums/protobufs.UserDataType.md) | The type of user data to get. |

___

### getUserDataByFid

▸ **getUserDataByFid**(`fid`)

Get user data (pfp, username, fname, etc) by fid.

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<UserDataAddMessage[]>` | [`UserDataAddMessage`](modules/types.md#userdataaddmessage)[] | A `HubAsyncResult` that contains the valid `UserDataAddMessage` array. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fid` | `number` | The fid to get user data for. |

___

### getVerification

▸ **getVerification**(`fid`, `address`)

Get verification for a specific address and fid.

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<VerificationAddEthAddressMessage>` | [`VerificationAddEthAddressMessage`](modules/types.md#verificationaddethaddressmessage) | A `HubAsyncResult` that contains the valid `VerificationAddEthAddressMessage`. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fid` | `number` | The fid to verify. |
| `address` | `string` | The custody address to verify. |

___

### getVerificationsByFid

▸ **getVerificationsByFid**(`fid`)

Get verifications for a specific fid.

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<VerificationAddEthAddressMessage[]>` | [`VerificationAddEthAddressMessage`](modules/types.md#verificationaddethaddressmessage)[] | A `HubAsyncResult` that contains the valid `VerificationAddEthAddressMessage` array. |

**`Example`**

```typescript
// TODO DOCS: usage example
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fid` | `number` | The fid to verify. |

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
