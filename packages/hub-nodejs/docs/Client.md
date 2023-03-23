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
  const client = await getHubRpcClient('127.0.0.1:2283');

  // To manually choose the authentication method, use these methods instead.
  // const sslClient = await getSSLHubRpcClient('127.0.0.1:2283');
  // const insecureClient = await getInsecureClient('127.0.0.1:2283');
})();
```

#### Returns

| Type     | Description            |
| :------- | :--------------------- |
| `Client` | A new Client instance. |

#### Parameters

| Name      | Type     | Description                                         |
| :-------- | :------- | :-------------------------------------------------- |
| `address` | `string` | Address and RPC port string (e.g. `127.0.0.1:2283`) |

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

Results always return an object of type `Message` instead of a more specific type like `CastAddMessage` due to a quick of the protobuf-generated types. This can be easily remedied by passing responses through a typeguard:

```typescript
import { isCastAddMessage } from '@farcaster/hub-nodejs';

// See getCast documentation below for more details on this
const castResult = await client.getCast({ fid: 2, hash: castHashBytes });

if (castResult.isOk()) {
  const cast = castResult.value; // cast is of type Message

  if (isCastAddMessage(cast)) {
    console.log(cast); // cast is now a CastAddMessage
  }
}
```

### Pagination

Methods that return multiple values support pagination in requests with a `pageSize` and `pageToken` property.

```typescript
import { getHubRpcClient, HubResult, MessagesResponse } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:2283');

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
  const client = await getHubRpcClient('127.0.0.1:2283');

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
  const client = await getHubRpcClient('127.0.0.1:2283');

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
| `reverse?`   | `boolean`    | Reverses the chronological ordering.             |

---

### getAllSignerMessagesByFid

Returns all active and inactive signers created by an fid in reverse chronological order.

#### Usage

```typescript
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:2283');

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
| `reverse?`   | `boolean`    | Reverses the chronological ordering.             |

---

### getUserData

Returns a specific piece of metadata about the user.

#### Usage

```typescript
import { getHubRpcClient, UserDataType } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:2283');

  const userDataResult = await client.getUserData({ fid: 2, userDataType: UserDataType.DISPLAY });

  userDataResult.map((userData) => console.log(userData));
})();
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
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:2283');

  const userDataResult = await client.getAllUserDataMessagesByFid({ fid: 2 });

  userDataResult.map((userData) => userData.messages.map((message) => console.log(message)));
})();
```

#### Returns

| Type                                 | Description                          |
| :----------------------------------- | :----------------------------------- |
| `MessagesResult<UserDataAddMessage>` | Zero or more `UserDataAdd` messages. |

#### Parameters

| Name       | Type      | Description                          |
| :--------- | :-------- | :----------------------------------- |
| `fid`      | `number`  | The fid of the user.                 |
| `reverse?` | `boolean` | Reverses the chronological ordering. |

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
  const client = await getHubRpcClient('127.0.0.1:2283');

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
  const client = await getHubRpcClient('127.0.0.1:2283');

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
| `reverse?`   | `boolean`    | Reverses the chronological ordering.             |

---

### getCastsByMention

Returns all active casts that mention an fid in reverse chronological order.

#### Usage

```typescript
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:2283');

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
| `reverse?`   | `boolean`    | Reverses the chronological ordering.             |

---

### getCastsByParent

Returns all active casts that are replies to a specific cast in reverse chronological order.

#### Usage

```typescript
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:2283');

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
| `reverse?`   | `boolean`                        | Reverses the chronological ordering.             |

---

### getAllCastMessagesByFid

Returns all active and inactive casts for a user in reverse chronological order.

#### Usage

```typescript
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:2283');

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
| `reverse?`   | `boolean`    | Reverses the chronological ordering.             |

---

### getReaction

Returns an active reaction of a particular type made by a user to a cast.

#### Usage

```typescript
import { getHubRpcClient, ReactionType } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:2283');

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
  const client = await getHubRpcClient('127.0.0.1:2283');

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
| `reverse?`   | `boolean`                                    | Reverses the chronological ordering.             |

---

### getReactionsByFid

Returns all active reactions made by a user in reverse chronological order.

#### Usage

```typescript
import { getHubRpcClient, ReactionType } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:2283');

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
| `reverse?`      | `boolean`                                    | Reverses the chronological ordering.             |

---

### getAllReactionMessagesByFid

Returns all active and inactive reactions made by a user in reverse chronological order.

#### Usage

```typescript
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:2283');

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
| `reverse?`   | `boolean`    | Reverses the chronological ordering.             |

---

### getVerification

Returns an active verification for a specific Ethereum address made by a user.

#### Usage

```typescript
import { getHubRpcClient, hexStringToBytes } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:2283');

  const addressHex = '0x2D596314b27dcf1d6a4296e95D9a4897810cE4b5';
  const addressBytes = hexStringToBytes(addressHex)._unsafeUnwrap(); // Safety: we know the address is valid

  const verificationResult = await client.getVerification({ fid: 2, address: addressBytes });

  verificationResult.map((verification) => console.log(verification));
})();
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
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:2283');

  const verificationsResult = await client.getVerificationsByFid({ fid: 2 });

  verificationsResult.map((verificationsResponse) =>
    verificationsResponse.messages.map((v) => {
      console.log(v);
    })
  );
})();
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
| `reverse?`   | `boolean`    | Reverses the chronological ordering.             |

---

### getAllVerificationMessagesByFid

Returns all active and inactive verifications for Ethereum addresses made by a user in reverse chronological order.

#### Usage

```typescript
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:2283');

  const verificationsResult = await client.getAllVerificationMessagesByFid({ fid: 2 });

  verificationsResult.map((verificationsResponse) =>
    verificationsResponse.messages.map((v) => {
      console.log(v);
    })
  );
})();
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
| `reverse?`   | `boolean`    | Reverses the chronological ordering.             |

---

### subscribe

Returns a gRPC Stream object which emits HubEvents in real-time.

Streams emit events from the current timestamp onwards and gRPC guarantees ordered delivery. If a Client is
disconnected, it can request the stream to begin from a specific Event Id. Hubs maintain a short cache of events
which helps with recovery when clients get disconnected temporarily.

#### Usage

```typescript
import { getHubRpcClient, HubEventType } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:2283');

  const subscribeResult = await client.subscribe({
    eventTypes: [HubEventType.MERGE_MESSAGE],
  });

  if (subscribeResult.isOk()) {
    const stream = subscribeResult.value;

    for await (const event of stream) {
      console.log(event);
    }
  }
})();
```

#### Returns

| Value                                       | Description                    |
| :------------------------------------------ | :----------------------------- |
| `HubResult<ClientReadableStream<HubEvent>>` | A stream that emits HubEvents. |

#### Parameters

| Name         | Type                                       | Description                      |
| :----------- | :----------------------------------------- | :------------------------------- |
| `eventTypes` | [`HubEventType`](./Events.md#hubeventtype) | Events to listen for.            |
| `fromId?`    | `number`                                   | EventId to start streaming from. |

---

### submitMessage

Submits a new message to the Hub. A Hub can choose to require basic authentication or enforce IP-based rate limits for messages accepted over this endpoint from clients.

#### Usage

```typescript
import { getHubRpcClient } from '@farcaster/hub-nodejs';

(async () => {
  const client = await getHubRpcClient('127.0.0.1:2283');

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
  const client = await getHubRpcClient('127.0.0.1:2283');

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
  const client = await getHubRpcClient('127.0.0.1:2283');

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
