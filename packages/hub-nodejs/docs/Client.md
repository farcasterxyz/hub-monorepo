# Client

A Client established a connection with a Farcaster Hub and can be used to send and receive messages. It is initialized
with the IP address and gRPC port of the Hub. Once connected, a Client instance can:

- Query for messages by user or type.
- Query for on-chain Farcaster Contracts state.
- Subscribe to changes by type.
- Upload new messages.

### Constructor

getHubRpcClient returns a Hub RPC Client, defaulting to an SSL connection if supported.

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

### Authentication

Some Hubs require authentication to submit messages which is done with basic auth over SSL. Clients will automatically
negotiate an SSL connection if possible, and you'll need to provide the username and password when calling `submitMessage`.

### Methods

Clients expose methods grouped into logical services. Each method returns an async [Result](#results)
object and may support [pagination](#pagination).

- **Signers**
  - [getSigner](#getsigner)
  - [getSignersByFid](#getsignersbyfid)
  - [getAllSignerMessagesByFid](#getallsignermessagesbyfid)
- **UserData**
  - [getUserData](#getuserdata)
  - [getUserDataByFid](#getuserdatabyfid)
  - [getAllUserDataMessagesByFid](#getalluserdatamessagesbyfid)
- **Casts**
  - [getCast](#getcast)
  - [getCastsByFid](#getcastsbyfid)
  - [getCastsByMention](#getcastsbymention)
  - [getCastsByParent](#getcastsbyparent)
  - [getAllCastMessagesByFid](#getallcastmessagesbyfid)
- **Reactions**
  - [getReaction](#getreaction)
  - [getReactionsByCast](#getreactionsbycast)
  - [getReactionsByFid](#getreactionsbyfid)
  - [getAllReactionMessagesByFid](#getallreactionmessagesbyfid)
- **Verifications**
  - [getVerification](#getverification)
  - [getVerificationsByFid](#getverificationsbyfid)
  - [getAllVerificationMessagesByFid](#getallverificationmessagesbyfid)
- **Events**
  - [subscribe](#subscribe)
- **Submit**
  - [submitMessage](#submitmessage)
- **Contracts**
  - [getIdRegistryEvent](#getidregistryevent)
  - [getNameRegistryEvent](#getnameregistryevent)

### Results

Methods are async and return a `HubAsyncResult<T>`, a wrapper around neverthrow's `Result`, which contains either a
successful response of type `<T>` or an error value. There are three types of return values across all our methods:

- [MessageResult<T>](#messageresult)
- [MessagesResult<T>](#messagesresult)
- [FidsResult<T>](#fidsresult)

### Pagination

Methods that return multiple values support pagination in requests with a `pageSize` and `pageToken` property.

```typescript
import { getHubRpcClient, HubResult, MessagesResponse } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:8080');

  let nextPageToken: Uint8Array | undefined = undefined;
  let isNextPage = true;

  while (isNextPage) {
    const castsResult: HubResult<MessagesResponse> = await client.getCastsByFid({
      fid: 2,
      pageSize: 10,
      pageToken: nextPageToken,
    });

    if (castsResult.isErr()) {
      break;
    }

    const castsResponse: MessagesResponse = castsResult.value;
    castsResponse.messages.map((cast) => console.log(cast?.data?.castAddBody?.text));

    nextPageToken = castsResponse.nextPageToken;
    isNextPage = !!nextPageToken && nextPageToken.length > 0;
  }
})();
```

## Method Request Documentation

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

| Type                              | Description          |
| :-------------------------------- | :------------------- |
| `MessageResult<SignerAddMessage>` | A SignerAdd message. |

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

| Type                               | Description                       |
| :--------------------------------- | :-------------------------------- |
| `MessagesResult<SignerAddMessage>` | One or more `SignerAdd` messages. |

#### Parameters

| Name         | Type         | Description                                      |
| :----------- | :----------- | :----------------------------------------------- |
| `fid`        | `number`     | The fid of the user.                             |
| `pageSize?`  | `number`     | Number of results per page.                      |
| `pageToken?` | `Uint8Array` | Token used to fetch the next page, if it exists. |

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

| Type                                                        | Description                                     |
| :---------------------------------------------------------- | :---------------------------------------------- |
| `MessagesResult<(SignerAddMessage \| SignerRemoveMessage)>` | Zero or more SignerAdd or SignerRemove messages |

#### Parameters

| Name         | Type         | Description                                      |
| :----------- | :----------- | :----------------------------------------------- |
| `fid`        | `number`     | The fid of the user.                             |
| `pageSize?`  | `number`     | Number of results per page.                      |
| `pageToken?` | `Uint8Array` | Token used to fetch the next page, if it exists. |

---

### getUserData

Returns a specific piece of metadata about the user.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Type                                | Description                |
| :---------------------------------- | :------------------------- |
| `MessageResult<UserDataAddMessage>` | The `UserDataAdd` message. |

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

| Type                                 | Description                          |
| :----------------------------------- | :----------------------------------- |
| `MessagesResult<UserDataAddMessage>` | Zero or more `UserDataAdd` messages. |

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

| Type                            | Description           |
| :------------------------------ | :-------------------- |
| `MessageResult<CastAddMessage>` | The `CastAdd` message |

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

| Value                            | Description                      |
| :------------------------------- | :------------------------------- |
| `MessagesResult<CastAddMessage>` | Zero or more `CastAdd` messages. |

#### Parameters

| Name         | Type         | Description                                      |
| :----------- | :----------- | :----------------------------------------------- |
| `fid`        | `number`     | The fid of the user.                             |
| `pageSize?`  | `number`     | Number of results per page.                      |
| `pageToken?` | `Uint8Array` | Token used to fetch the next page, if it exists. |

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

| Value                            | Description                      |
| :------------------------------- | :------------------------------- |
| `MessagesResult<CastAddMessage>` | Zero or more `CastAdd` messages. |

#### Parameters

| Name         | Type         | Description                                      |
| :----------- | :----------- | :----------------------------------------------- |
| `fid`        | `number`     | The fid that is mentioned in the casts.          |
| `pageSize?`  | `number`     | Number of results per page.                      |
| `pageToken?` | `Uint8Array` | Token used to fetch the next page, if it exists. |

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

| Value                            | Description                      |
| :------------------------------- | :------------------------------- |
| `MessagesResult<CastAddMessage>` | Zero or more `CastAdd` messages. |

#### Parameters

| Name         | Type                             | Description                                      |
| :----------- | :------------------------------- | :----------------------------------------------- |
| `parent`     | [`CastId`](./Messages.md#castid) | The CastId of the parent cast.                   |
| `pageSize?`  | `number`                         | Number of results per page.                      |
| `pageToken?` | `Uint8Array`                     | Token used to fetch the next page, if it exists. |

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

| Value                                                 | Description                                      |
| :---------------------------------------------------- | :----------------------------------------------- |
| `MessagesResult<(CastAddMessage\|CastRemoveMessage)>` | Zero or more `CastAdd` or `CastRemove` messages. |

#### Parameters

| Name         | Type         | Description                                      |
| :----------- | :----------- | :----------------------------------------------- |
| `fid`        | `number`     | The fid of the user.                             |
| `pageSize?`  | `number`     | Number of results per page.                      |
| `pageToken?` | `Uint8Array` | Token used to fetch the next page, if it exists. |

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

| Type                                | Description              |
| :---------------------------------- | :----------------------- |
| `MessageResult<ReactionAddMessage>` | A `ReactionAdd` message. |

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

| Value                                | Description                          |
| :----------------------------------- | :----------------------------------- |
| `MessagesResult<ReactionAddMessage>` | Zero or more `ReactionAdd` messages. |

#### Parameters

| Name         | Type                                         | Description                                      |
| :----------- | :------------------------------------------- | :----------------------------------------------- |
| `cast`       | [`CastId`](./Messages.md#castid)             | The cast id.                                     |
| `type?`      | [`ReactionType`](./Messages.md#reactiontype) | (optional) The type of the reaction.             |
| `pageSize?`  | `number`                                     | Number of results per page.                      |
| `pageToken?` | `Uint8Array`                                 | Token used to fetch the next page, if it exists. |

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

| Type                                 | Description                          |
| :----------------------------------- | :----------------------------------- |
| `MessagesResult<ReactionAddMessage>` | Zero or more `ReactionAdd` messages. |

#### Parameters

| Name            | Type                                         | Description                                      |
| :-------------- | :------------------------------------------- | :----------------------------------------------- |
| `fid`           | `number`                                     | The fid of the user                              |
| `reactionType?` | [`ReactionType`](./Messages.md#reactiontype) | The type of the reaction                         |
| `pageSize?`     | `number`                                     | Number of results per page.                      |
| `pageToken?`    | `Uint8Array`                                 | Token used to fetch the next page, if it exists. |

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

| Type                                                        | Description                                              |
| :---------------------------------------------------------- | :------------------------------------------------------- |
| `MessagesResult<ReactionAddMessage\|ReactionRemoveMessage>` | Zero or more `ReactionAdd` or `ReactionRemove` messages. |

#### Parameters

| Name         | Type         | Description                                      |
| :----------- | :----------- | :----------------------------------------------- |
| `fid`        | `number`     | The fid of the user.                             |
| `pageSize?`  | `number`     | Number of results per page.                      |
| `pageToken?` | `Uint8Array` | Token used to fetch the next page, if it exists. |

---

### getVerification

Returns an active verification for a specific Ethereum address made by a user.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Type                                              | Description                            |
| :------------------------------------------------ | :------------------------------------- |
| `MessageResult<VerificationAddEthAddressMessage>` | A `VerificationAddEthAddress` message. |

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

| Value                                              | Description                                        |
| :------------------------------------------------- | :------------------------------------------------- |
| `MessagesResult<VerificationAddEthAddressMessage>` | Zero or more `VerificationAddEthAddress` messages. |

#### Parameters

| Name         | Type         | Description                                      |
| :----------- | :----------- | :----------------------------------------------- |
| `fid`        | `number`     | The fid of the user.                             |
| `pageSize?`  | `number`     | Number of results per page.                      |
| `pageToken?` | `Uint8Array` | Token used to fetch the next page, if it exists. |

---

### getAllVerificationMessagesByFid

Returns all active and inactive verifications for Ethereum addresses made by a user in reverse chronological order.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Type                                                                          | Description                                                                |
| :---------------------------------------------------------------------------- | :------------------------------------------------------------------------- |
| `MessagesResult<VerificationAddEthAddressMessage\|VerificationRemoveMessage>` | Zero or more `VerificationAddEthAddress` or `VerificationRemove` messages. |

#### Parameters

| Name         | Type         | Description                                      |
| :----------- | :----------- | :----------------------------------------------- |
| `fid`        | `number`     | The fid of the user.                             |
| `pageSize?`  | `number`     | Number of results per page.                      |
| `pageToken?` | `Uint8Array` | Token used to fetch the next page, if it exists. |

---

### subscribe

Subscribe to a stream of HubEvents from the Hub which are returned as protobufs. Messages can be parsed with `deserializeHubEvent` helper in utils.

#### Usage

```typescript
// TODO DOCS: usage example
```

#### Returns

| Value                                                           | Description                             |
| :-------------------------------------------------------------- | :-------------------------------------- |
| `HubResult<protobufs.ClientReadableStream<protobufs.HubEvent>>` | a readable stream that emits HubEvents. |

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

| Value              | Description                     |
| :----------------- | :------------------------------ |
| `MessageResult<T>` | The message that was submitted. |

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

| Value                             | Description           |
| :-------------------------------- | :-------------------- |
| `HubAsyncResult<IdRegistryEvent>` | An `IdRegistryEvent`. |

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

| Value                               | Description            |
| :---------------------------------- | :--------------------- |
| `HubAsyncResult<NameRegistryEvent>` | A `NameRegistryEvent`. |

#### Parameters

| Name    | Type     | Description            |
| :------ | :------- | :--------------------- |
| `fname` | `string` | The fname of the user. |

## Method Response Documentation

### MessageResult

A documentation alias for `HubAsyncResult<Message>` where the success value contains a single message.

Message are of the type <T> requested but this is an implicit guarantee since ts-proto does not generate bindings
correctly to reflect this in the returned types.

---

### MessagesResult

A documentation alias for `HubAsyncResult<MessagesResponse>` where the success value contains a MessagesResponse object.

Messages are of the type <T> requested but this is an implicit guarantee since ts-proto does not generate bindings
correctly to reflect this in the returned types.

| Name             | Type                      | Description                                      |
| :--------------- | :------------------------ | :----------------------------------------------- |
| `messages`       | `Message[]`               | Messages that were a response to the query.      |
| `nextPageToken?` | `Uint8Array \| undefined` | Token used to fetch the next page, if it exists. |

---
