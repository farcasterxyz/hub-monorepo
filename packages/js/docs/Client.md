# Client

A Client can be used to connect to a Farcaster Hub.
Clients are initialized with the IP address and gRPC port of the Hub. Once connected, you can use a Client instance to:

- Query for messages by user or type.
- Query for on-chain Farcaster Contracts state
- Subscribe to changes by type.
- Upload new messages.

Some Hubs require authentication to submit messages which is done with basic auth over SSL. Clients will automatically negotiate an SSL connection if possible, and you'll need to provide the username and password when calling `submitMessage`.

## Constructor

### `static` new Client

#### Usage

```typescript
// TODO
```

#### Returns

| Type     | Description            |
| :------- | :--------------------- |
| `Client` | A new Client instance. |

#### Parameters

| Name      | Type      | Description                                                 |
| :-------- | :-------- | :---------------------------------------------------------- |
| `address` | `string`  | Address and RPC port string (e.g. `127.0.0.1:8080`)         |
| `ssl?`    | `boolean` | (optional) Flag to connect to the Hub over SSL if supported |

## Methods

Client methods are logically grouped into services that correspond to particular data types or actions. These services logically map to the gRPC services exposed by Hubs. For example, the Casts Service providers four different helpers to get Cast Messages.

- **Signers Service**
  - [getSigner](#getsigner)
  - [getSignersByFid](#getsignersbyfid)
  - [getAllSignerMessagesByFid](#getallsignermessagesbyfid)
- **UserData Service**
  - [getUserData](#getuserdata)
  - [getUserDataByFid](#getuserdatabyfid)
  - [getAllUserDataMessagesByFid](#getalluserdatamessagesbyfid)
- **Casts Service**
  - [getCast](#getcast)
  - [getCastsByFid](#getcastsbyfid)
  - [getCastsByMention](#getcastsbymention)
  - [getCastsByParent](#getcastsbyparent)
  - [getAllCastMessagesByFid](#getallcastmessagesbyfid)
- **Reactions Service**
  - [getReaction](#getreaction)
  - [getReactionsByCast](#getreactionsbycast)
  - [getReactionsByFid](#getreactionsbyfid)
  - [getAllReactionMessagesByFid](#getallreactionmessagesbyfid)
- **Verifications Service**
  - [getVerification](#getverification)
  - [getVerificationsByFid](#getverificationsbyfid)
  - [getAllVerificationMessagesByFid](#getallverificationmessagesbyfid)
- **Events Service**
  - [subscribe](#subscribe)
- **Submit Service**
  - [submitMessage](#submitmessage)
- **Contracts Service**
  - [getIdRegistryEvent](#getidregistryevent)
  - [getNameRegistryEvent](#getnameregistryevent)

---

### getSigner

Returns an active signer message given an fid and the public key of the signer.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Type                               | Description                                |
| :--------------------------------- | :----------------------------------------- |
| `HubAsyncResult<SignerAddMessage>` | A Result containing the SignerAdd message. |

#### Parameters

| Name     | Type     | Description                   |
| :------- | :------- | :---------------------------- |
| `fid`    | `number` | The fid of the user.          |
| `signer` | `string` | The public key of the signer. |

---

### getSignersByFid

Returns all active signers created by an fid in reverse chronological order.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Type                                 | Description                                           |
| :----------------------------------- | :---------------------------------------------------- |
| `HubAsyncResult<SignerAddMessage[]>` | A Result containing one or more `SignerAdd` messages. |

#### Parameters

| Name  | Type     | Description          |
| :---- | :------- | :------------------- |
| `fid` | `number` | The fid of the user. |

---

### getAllSignerMessagesByFid

Returns all active and inactive signers created by an fid in reverse chronological order.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Type                                                          | Description                                                        |
| :------------------------------------------------------------ | :----------------------------------------------------------------- |
| `HubAsyncResult<(SignerAddMessage \| SignerRemoveMessage)[]>` | A Result containing one or more SignerAdd or SignerRemove messages |

#### Parameters

| Name  | Type     | Description          |
| :---- | :------- | :------------------- |
| `fid` | `number` | The fid of the user. |

---

### getUserData

Returns a specific piece of metadata about the user.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Type                                 | Description                                       |
| :----------------------------------- | :------------------------------------------------ |
| `HubAsyncResult<UserDataAddMessage>` | A Result that contains the `UserDataAdd` message. |

#### Parameters

| Name   | Type                                         | Description                |
| :----- | :------------------------------------------- | :------------------------- |
| `fid`  | `number`                                     | The fid of the user.       |
| `type` | [`UserDataType`](./Messages.md#userdatatype) | The type of user metadata. |

---

### getUserDataByFid

Returns all metadata about the user.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Type                                   | Description                                                 |
| :------------------------------------- | :---------------------------------------------------------- |
| `HubAsyncResult<UserDataAddMessage[]>` | A Result that contains zero or more `UserDataAdd` messages. |

#### Parameters

| Name  | Type     | Description          |
| :---- | :------- | :------------------- |
| `fid` | `number` | The fid of the user. |

---

### getAllUserDataMessagesByFid

An alias for `getUserDataByFid`

---

### getCast

Returns an active cast for a user.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Type                             | Description                                  |
| :------------------------------- | :------------------------------------------- |
| `HubAsyncResult<CastAddMessage>` | A Result that contains the `CastAdd` message |

#### Parameters

| Name   | Type     | Description           |
| :----- | :------- | :-------------------- |
| `fid`  | `number` | The fid of the user.  |
| `hash` | `string` | The hash of the cast. |

---

### getCastsByFid

Returns active casts for a user in reverse chronological order.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Value                              | Description                                            |
| :--------------------------------- | :----------------------------------------------------- |
| `HubAsyncResult<CastAddMessage[]>` | A Result that contains one or more `CastAdd` messages. |

#### Parameters

| Name  | Type     | Description          |
| :---- | :------- | :------------------- |
| `fid` | `number` | The fid of the user. |

---

### getCastsByMention

Returns all active casts that mention an fid in reverse chronological order.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Value                              | Description                                             |
| :--------------------------------- | :------------------------------------------------------ |
| `HubAsyncResult<CastAddMessage[]>` | A Result that contains zero or more `CastAdd` messages. |

#### Parameters

| Name         | Type     | Description                             |
| :----------- | :------- | :-------------------------------------- |
| `mentionFid` | `number` | The fid that is mentioned in the casts. |

---

### getCastsByParent

Returns all active casts that are replies to a specific cast in reverse chronological order.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Value                              | Description                                                 |
| :--------------------------------- | :---------------------------------------------------------- |
| `HubAsyncResult<CastAddMessage[]>` | A Result that contains the zero or more `CastAdd` messages. |

#### Parameters

| Name     | Type                             | Description                    |
| :------- | :------------------------------- | :----------------------------- |
| `parent` | [`CastId`](./Messages.md#castid) | The CastId of the parent cast. |

---

### getAllCastMessagesByFid

Returns all active and inactive casts for a user in reverse chronological order.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Value                                                   | Description                                                             |
| :------------------------------------------------------ | :---------------------------------------------------------------------- |
| `HubAsyncResult<(CastAddMessage\|CastRemoveMessage)[]>` | A Result that contains zero or more `CastAdd` or `CastRemove` messages. |

#### Parameters

| Name  | Type     | Description          |
| :---- | :------- | :------------------- |
| `fid` | `number` | The fid of the user. |

---

### getReaction

Returns an active reaction of a particular type made by a user to a cast.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Type                                 | Description                                         |
| :----------------------------------- | :-------------------------------------------------- |
| `HubAsyncResult<ReactionAddMessage>` | A Result that contains the a `ReactionAdd` message. |

#### Parameters

| Name   | Type                                         | Description               |
| :----- | :------------------------------------------- | :------------------------ |
| `fid`  | `number`                                     | The fid of the user.      |
| `type` | [`ReactionType`](./Messages.md#reactiontype) | The type of the reaction. |
| `cast` | [`CastId`](./Messages.md#castid)             | The cast id.              |

---

### getReactionsByCast

Returns all active reactions made by users to a cast.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Value                                  | Description                                                |
| :------------------------------------- | :--------------------------------------------------------- |
| `HubAsyncResult<ReactionAddMessage[]>` | A Result that contains one or more `ReactionAdd` messages. |

#### Parameters

| Name    | Type                                         | Description                          |
| :------ | :------------------------------------------- | :----------------------------------- |
| `cast`  | [`CastId`](./Messages.md#castid)             | The cast id.                         |
| `type?` | [`ReactionType`](./Messages.md#reactiontype) | (optional) The type of the reaction. |

---

### getReactionsByFid

Returns all active reactions made by a user in reverse chronological order.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Type                                   | Description                                                 |
| :------------------------------------- | :---------------------------------------------------------- |
| `HubAsyncResult<ReactionAddMessage[]>` | A Result that contains zero or more `ReactionAdd` messages. |

#### Parameters

| Name    | Type                                         | Description              |
| :------ | :------------------------------------------- | :----------------------- |
| `fid`   | `number`                                     | The fid of the user      |
| `type?` | [`ReactionType`](./Messages.md#reactiontype) | The type of the reaction |

---

### getAllReactionMessagesByFid

Returns all active and inactive reactions made by a user in reverse chronological order.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Type                                                          | Description                                                                     |
| :------------------------------------------------------------ | :------------------------------------------------------------------------------ |
| `HubAsyncResult<ReactionAddMessage\|ReactionRemoveMessage[]>` | A Result that contains zero or more `ReactionAdd` or `ReactionRemove` messages. |

#### Parameters

| Name  | Type     | Description          |
| :---- | :------- | :------------------- |
| `fid` | `number` | The fid of the user. |

---

### getVerification

Returns an active verification for a specific Ethereum address made by a user.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Type                                               | Description                                                   |
| :------------------------------------------------- | :------------------------------------------------------------ |
| `HubAsyncResult<VerificationAddEthAddressMessage>` | A Result that contains a `VerificationAddEthAddress` message. |

#### Parameters

| Name      | Type     | Description                          |
| :-------- | :------- | :----------------------------------- |
| `fid`     | `number` | The fid of the user.                 |
| `address` | `string` | The Ethereum address being verified. |

---

### getVerificationsByFid

Returns all active verifications for Ethereum addresses made by a user in reverse chronological order.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Value                                                | Description                                                               |
| :--------------------------------------------------- | :------------------------------------------------------------------------ |
| `HubAsyncResult<VerificationAddEthAddressMessage[]>` | A Result that contains zero or more `VerificationAddEthAddress` messages. |

#### Parameters

| Name  | Type     | Description          |
| :---- | :------- | :------------------- |
| `fid` | `number` | The fid of the user. |

---

### getAllVerificationMessagesByFid

Returns all active and inactive verifications for Ethereum addresses made by a user in reverse chronological order.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Type                                                                            | Description                                                                                           |
| :------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------- |
| `HubAsyncResult<VerificationAddEthAddressMessage\|VerificationRemoveMessage[]>` | A Result that contains the zero or more `VerificationAddEthAddress` or `VerificationRemove` messages. |

#### Parameters

| Name  | Type     | Description          |
| :---- | :------- | :------------------- |
| `fid` | `number` | The fid of the user. |

---

### subscribe

Subscribe to a stream of HubEvents from the Hub which are returned as protobufs. Messages can be parsed with `deserializeHubEvent` helper in utils.

#### Usage

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
```

#### Returns

| Value                                                           | Description                                                    |
| :-------------------------------------------------------------- | :------------------------------------------------------------- |
| `HubResult<protobufs.ClientReadableStream<protobufs.HubEvent>>` | A Result that contains a readable stream that emits HubEvents. |

#### Parameters

| Name      | Type                                         | Description                                |
| :-------- | :------------------------------------------- | :----------------------------------------- |
| `filters` | [`EventFilters`](../modules.md#eventfilters) | Filters that specify events to listen for. |

---

### submitMessage

Submits a new message to the Hub. Basic authentication may be required by the Hub.

#### Usage

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)
const result = await client.get...
```

#### Returns

| Value                        | Description                                            |
| :--------------------------- | :----------------------------------------------------- |
| `HubAsyncResult<Message<T>>` | A Result that contains the message that was submitted. |

#### Parameters

| Name        | Type      | Description                        |
| :---------- | :-------- | :--------------------------------- |
| `message`   | `Message` | The message being submitted        |
| `username?` | `string`  | (optional) Username for basic auth |
| `password?` | `string`  | (optional) Password for basic auth |

---

### getIdRegistryEvent

Returns the on-chain event most recently associated with changing an fid's ownership.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Value                             | Description                                  |
| :-------------------------------- | :------------------------------------------- |
| `HubAsyncResult<IdRegistryEvent>` | A Result that contains an `IdRegistryEvent`. |

#### Parameters

| Name  | Type     | Description          |
| :---- | :------- | :------------------- |
| `fid` | `number` | The fid of the user. |

---

### getNameRegistryEvent

Returns the on-chain event most recently associated with changing an fname's ownership.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Value                               | Description                                       |
| :---------------------------------- | :------------------------------------------------ |
| `HubAsyncResult<NameRegistryEvent>` | A Result that contains the a `NameRegistryEvent`. |

#### Parameters

| Name    | Type     | Description            |
| :------ | :------- | :--------------------- |
| `fname` | `string` | The fname of the user. |

---
