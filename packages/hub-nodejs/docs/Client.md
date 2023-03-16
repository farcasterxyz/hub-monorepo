# Client

A Client established a connection with a Farcaster Hub and can be used to send and receive messages. It is initialized with the IP address and gRPC port of the Hub. Once connected, a Client instance can:

- Query for messages by user or type.
- Query for on-chain Farcaster Contracts state.
- Subscribe to changes by type.
- Upload new messages.

### Authentication

Some Hubs require authentication to submit messages which is done with basic auth over SSL. Clients will automatically negotiate an SSL connection if possible, and you'll need to provide the username and password when calling `submitMessage`.

### getHubRpcClient

Returns a Hub RPC Client, defaulting to an SSL connection if supported.

#### Usage

```typescript
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  // To manually choose the authentication method, use these methods instead.
  // const sslClient = await getSSLHubRpcClient('127.0.0.1:8080');
  // const insecureClient = await getInsecureClient('127.0.0.1:8080');
})();
```

#### Returns

| Type     | Description            |
| :------- | :--------------------- |
| `Client` | A new Client instance. |

#### Parameters

| Name      | Type     | Description                                         |
| :-------- | :------- | :-------------------------------------------------- |
| `address` | `string` | Address and RPC port string (e.g. `127.0.0.1:8080`) |

## Methods

Client methods are logically grouped into services corresponding to data types or actions. These services map to the gRPC services exposed by Hubs. For example, the Casts Service providers four different helpers to get Cast Messages.

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
(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  const signerPubKeyHex = '5feb9e21f3df044197e634e3602a594a3423c71c6f208876074dc5a3e0d7b9ce';
  const signer = Uint8Array.from(Buffer.from(signerPubKeyHex, 'hex'));

  const signerResult = await client.getSigner({
    fid: 2,
    signer,
  });

  signerResult.map((signerAdd) => console.log(signerAdd));
})();
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
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  const signersResult = await client.getAllSignerMessagesByFid({ fid: 2 });

  signersResult.map((signers) => console.log(signers.messages));
})();
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
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  const signersResult = await client.getAllSignerMessagesByFid({ fid: 2 });

  signersResult.map((signers) => console.log(signers.messages));
})();
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
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  const castHashHex = '460a87ace7014adefe4a2944fb62833b1bf2a6be';
  const castHashBytes = Buffer.from(castHashHex, 'hex');

  const castResult = await client.getCast({ fid: 2, hash: castHashBytes });

  castResult.map((cast) => console.log(cast));
})();
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
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  const castsResult = await client.getCastsByFid({ fid: 2 });

  castsResult.map((casts) => console.log(casts.messages));
})();
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
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  const castsResult = await client.getCastsByMention({ fid: 2 });

  castsResult.map((casts) => console.log(casts.messages));
})();
```

#### Returns

| Value                              | Description                                             |
| :--------------------------------- | :------------------------------------------------------ |
| `HubAsyncResult<CastAddMessage[]>` | A Result that contains zero or more `CastAdd` messages. |

#### Parameters

| Name  | Type     | Description                             |
| :---- | :------- | :-------------------------------------- |
| `fid` | `number` | The fid that is mentioned in the casts. |

---

### getCastsByParent

Returns all active casts that are replies to a specific cast in reverse chronological order.

#### Usage

```typescript
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  const castHashHex = 'ee04762bea3060ce3cca154bced5947de04aa253';
  const castHashBytes = Buffer.from(castHashHex, 'hex');

  const castsResult = await client.getCastsByParent({ fid: 2, hash: castHashBytes });

  castsResult.map((casts) => console.log(casts.messages));
})();
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
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  const castsResult = await client.getAllCastMessagesByFid({ fid: 2 });
  castsResult.map((casts) => console.log(casts.messages));
})();
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
import { getHubRpcClient, ReactionType } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  const castHashHex = 'ee04762bea3060ce3cca154bced5947de04aa253'; // Cast to fetch reactions for
  const castHashBytes = Buffer.from(castHashHex, 'hex');

  const reactionsResult = await client.getReaction({
    fid: 8150,
    reactionType: ReactionType.LIKE,
    castId: {
      fid: 2,
      hash: castHashBytes,
    },
  });

  reactionsResult.map((reaction) => console.log(reaction));
})();
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
import { getHubRpcClient, ReactionType } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  const castHashHex = 'ee04762bea3060ce3cca154bced5947de04aa253'; // Cast to fetch reactions for
  const castHashBytes = Buffer.from(castHashHex, 'hex');

  const reactionsResult = await client.getReactionsByCast({
    reactionType: ReactionType.LIKE,
    castId: {
      fid: 2,
      hash: castHashBytes,
    },
  });

  reactionsResult.map((reaction) => console.log(reaction.messages));
})();
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
import { getHubRpcClient, ReactionType } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  const reactionsResult = await client.getReactionsByFid({ fid: 2, reactionType: ReactionType.LIKE });

  reactionsResult.map((reaction) => console.log(reaction.messages));
})();
```

#### Returns

| Type                                   | Description                                                 |
| :------------------------------------- | :---------------------------------------------------------- |
| `HubAsyncResult<ReactionAddMessage[]>` | A Result that contains zero or more `ReactionAdd` messages. |

#### Parameters

| Name            | Type                                         | Description              |
| :-------------- | :------------------------------------------- | :----------------------- |
| `fid`           | `number`                                     | The fid of the user      |
| `reactionType?` | [`ReactionType`](./Messages.md#reactiontype) | The type of the reaction |

---

### getAllReactionMessagesByFid

Returns all active and inactive reactions made by a user in reverse chronological order.

#### Usage

```typescript
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  const reactionsResult = await client.getAllReactionMessagesByFid({ fid: 2 });

  reactionsResult.map((reaction) => console.log(reaction.messages));
})();
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
import { ... } from '@farcaster/hub-nodejs';

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
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  const message; // Any valid message constructed with a Builder

  const submitResult = await client.submitMessage(message);
  console.log(submitResult);
})();
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
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  const idrResult = await client.getIdRegistryEvent({ fid: 2 });

  idrResult.map((event) => console.log(event));
})();
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
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  const fnameBytes = new TextEncoder().encode('v');
  const nrResult = await client.getNameRegistryEvent({ name: fnameBytes });

  nrResult.map((event) => console.log(event));
})();
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
