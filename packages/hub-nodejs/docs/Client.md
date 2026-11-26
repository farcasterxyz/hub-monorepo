# Client

A Client established a connection with a Farcaster Hub which can be used to send and receive messages. It is initialized
with the IP address and gRPC port of the Hub. Once connected, a Client instance can:

- Query for messages by user or type.
- Query for onchain Farcaster Contracts state.
- Subscribe to changes by type.
- Upload new messages.

### Constructor

getInsecureHubRpcClient returns a Hub RPC Client. Use getSSLHubRpcClient if the server you're using supports SSL.

Snapchain nodes serve gRPC on port 3383. A self-hosted node does not use TLS by default, so connect to it with
getInsecureHubRpcClient. The examples below use `your-node.example.com:3383` as a placeholder address.

#### Usage

```typescript
import { getSSLHubRpcClient } from '@farcaster/hub-nodejs';

// Instantiate the gRPC client for a secure connection
const client = getSSLHubRpcClient('your-node.example.com:3383');

// If the node does not use SSL, call the getInsecureHubRpcClient method instead
// const insecureClient = getInsecureHubRpcClient('your-node.example.com:3383');

// Wait for the gRPC client to be ready before making any requests
client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to the gRPC server:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to the gRPC server`);

    // Add any gRPC calls you want to make here, for example:
    // const castsResult = await client.getCastsByFid({ fid: 8928 });

    // After everything, close the RPC connection
    client.close();
  }
});
```

#### Returns

| Type     | Description            |
| :------- | :--------------------- |
| `Client` | A new Client instance. |

#### Parameters

| Name      | Type     | Description                                                     |
| :-------- | :------- | :-------------------------------------------------------------- |
| `address` | `string` | Address and RPC port string (e.g. `your-node.example.com:3383`) |

### Authentication

Some Hubs require authentication to submit messages which is done with basic auth over SSL. Clients will automatically
negotiate an SSL connection if possible, and you'll need to provide the username and password when calling `submitMessage`.

### Methods

Clients expose methods grouped into logical services. Each method returns an async [Result](#results)
object and may support [pagination](#pagination).

- **Signers**
  - [getSigner](#getsigner)
  - [getSignersByFid](#getsignersbyfid)
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
  - [getIdRegistryOnChainEvent](#getidregistryonchainevent)
  - [getUsernameProof](#getusernameproof)

### Results

Methods are async and return a `HubAsyncResult<T>`, a wrapper around neverthrow's `Result`, which contains either a
successful response of type `<T>` or an error value. There are three types of return values across all our methods:

- [MessageResult<T>](#messageresult)
- [MessagesResult<T>](#messagesresult)
- [FidsResult<T>](#fidsresult)

Results always return an object of type `Message` instead of a more specific type like `CastAddMessage` due to a quirk of the protobuf-generated types. This can be easily remedied by passing responses through a typeguard:

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
import { getSSLHubRpcClient, type HubResult, type MessagesResponse } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

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

    client.close();
  }
});
```

## Method Request Documentation

### getSigner

Returns an active signer given a fid and the public key of the signer.

#### Usage

```typescript
import { getSSLHubRpcClient, hexStringToBytes } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const signerPubKeyHex = '78ff9a768cf1fbb13caaf5159a9623dd2499b01592a0ee672eca647b6d62558c';
    const signer = hexStringToBytes(signerPubKeyHex)._unsafeUnwrap(); // Safety: signerPubKeyHex is known and can't error

    const signerResult = await client.getSigner({
      fid: 2,
      signer,
    });

    signerResult.map((signerResponse) => console.log(signerResponse.signer));
    client.close();
  }
});
```

#### Returns

| Type                             | Description                                                                  |
| :------------------------------- | :--------------------------------------------------------------------------- |
| `HubAsyncResult<SignerResponse>` | A `SignerResponse` whose `signer` field holds the signer record for the key. |

#### Parameters

| Name     | Type         | Description                   |
| :------- | :----------- | :---------------------------- |
| `fid`    | `number`     | The fid of the user.          |
| `signer` | `Uint8Array` | The public key of the signer. |

---

### getSignersByFid

Returns all active signers for a fid. Each signer record includes its `source` (onchain or offchain), `key`, `addedAt`
and, where the source carries them, fields such as `requestFid`, `scopes`, `ttl` and `expiresAt`. The response also
includes `currentUserNonce` and, for each fid passed in `requesterFids`, an entry in `requesterFidNonces`.

#### Usage

```typescript
import { getSSLHubRpcClient } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const signersResult = await client.getSignersByFid({ fid: 2, requesterFids: [] });
    signersResult.map((response) => console.log(response.signers));

    client.close();
  }
});
```

#### Returns

| Type                                   | Description                                           |
| :------------------------------------- | :---------------------------------------------------- |
| `HubAsyncResult<SignersByFidResponse>` | A `SignersByFidResponse` with zero or more `signers`. |

#### Parameters

| Name            | Type         | Description                                                          |
| :-------------- | :----------- | :------------------------------------------------------------------- |
| `fid`           | `number`     | The fid of the user.                                                 |
| `requesterFids` | `number[]`   | Fids whose current app nonce should be returned. Pass `[]` for none. |
| `pageSize?`     | `number`     | Number of results per page.                                          |
| `pageToken?`    | `Uint8Array` | Token used to fetch the next page, if it exists.                     |
| `reverse?`      | `boolean`    | Reverses the chronological ordering.                                 |

---

### getUserData

Returns a specific piece of metadata about the user.

#### Usage

```typescript
import { getSSLHubRpcClient, UserDataType } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const userDataResult = await client.getUserData({ fid: 2, userDataType: UserDataType.DISPLAY });
    userDataResult.map((userData) => console.log(userData));

    client.close();
  }
});
```

#### Returns

| Type                                | Description                |
| :---------------------------------- | :------------------------- |
| `MessageResult<UserDataAddMessage>` | The `UserDataAdd` message. |

#### Parameters

| Name           | Type                                         | Description                |
| :------------- | :------------------------------------------- | :------------------------- |
| `fid`          | `number`                                     | The fid of the user.       |
| `userDataType` | [`UserDataType`](./Messages.md#userdatatype) | The type of user metadata. |

---

### getUserDataByFid

Returns all metadata about the user.

#### Usage

```typescript
import { getSSLHubRpcClient } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const userDataResult = await client.getUserDataByFid({ fid: 2 });
    userDataResult.map((userData) => userData.messages.map((message) => console.log(message)));

    client.close();
  }
});
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
import { getSSLHubRpcClient, hexStringToBytes } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);
    const castHashHex = '460a87ace7014adefe4a2944fb62833b1bf2a6be';
    const castHashBytes = hexStringToBytes(castHashHex)._unsafeUnwrap(); // Safety: castHashHex is known and can't error

    const castResult = await client.getCast({ fid: 2, hash: castHashBytes });

    castResult.map((cast) => console.log(cast));
    client.close();
  }
});
```

#### Returns

| Type                            | Description           |
| :------------------------------ | :-------------------- |
| `MessageResult<CastAddMessage>` | The `CastAdd` message |

#### Parameters

| Name   | Type         | Description           |
| :----- | :----------- | :-------------------- |
| `fid`  | `number`     | The fid of the user.  |
| `hash` | `Uint8Array` | The hash of the cast. |

---

### getCastsByFid

Returns active casts for a user in reverse chronological order.

#### Usage

```typescript
import { getSSLHubRpcClient } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    client.getCastsByFid({ fid: 2, pageSize: 10 }).then((castsResult) => {
      castsResult.map((casts) => console.log(casts.messages));
      client.close();
    });
  }
});
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
import { getSSLHubRpcClient } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const castsResult = await client.getCastsByMention({ fid: 2, pageSize: 10 });

    castsResult.map((casts) => console.log(casts.messages));
    client.close();
  }
});
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
import { getSSLHubRpcClient, hexStringToBytes } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const castHashHex = 'ee04762bea3060ce3cca154bced5947de04aa253';
    const castHashBytes = hexStringToBytes(castHashHex)._unsafeUnwrap(); // Safety: castHashHex is known

    const castsResult = await client.getCastsByParent({ parentCastId: { fid: 2, hash: castHashBytes } });

    castsResult.map((casts) => console.log(casts.messages));
    client.close();
  }
});
```

#### Returns

| Value                            | Description                      |
| :------------------------------- | :------------------------------- |
| `MessagesResult<CastAddMessage>` | Zero or more `CastAdd` messages. |

#### Parameters

| Name           | Type                             | Description                                      |
| :------------- | :------------------------------- | :----------------------------------------------- |
| `parentCastId` | [`CastId`](./Messages.md#castid) | The CastId of the parent cast.                   |
| `pageSize?`    | `number`                         | Number of results per page.                      |
| `pageToken?`   | `Uint8Array`                     | Token used to fetch the next page, if it exists. |
| `reverse?`     | `boolean`                        | Reverses the chronological ordering.             |

---

### getAllCastMessagesByFid

Returns all active and inactive casts for a user in reverse chronological order.

#### Usage

```typescript
import { getSSLHubRpcClient } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const castsResult = await client.getAllCastMessagesByFid({ fid: 2, pageSize: 10 });
    castsResult.map((casts) => console.log(casts.messages));

    client.close();
  }
});
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
import { getSSLHubRpcClient, hexStringToBytes, ReactionType } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const castHashHex = '87b54f68933c0e98bd4e18121c147d0475236d38'; // Cast to fetch reactions for
    const castHashBytes = hexStringToBytes(castHashHex)._unsafeUnwrap(); // Safety: castHashHex is known and can't error

    const reactionsResult = await client.getReaction({
      fid: 124,
      reactionType: ReactionType.LIKE,
      targetCastId: {
        fid: 2,
        hash: castHashBytes,
      },
    });

    reactionsResult.map((reaction) => console.log(reaction));
    client.close();
  }
});
```

#### Returns

| Type                                | Description              |
| :---------------------------------- | :----------------------- |
| `MessageResult<ReactionAddMessage>` | A `ReactionAdd` message. |

#### Parameters

| Name           | Type                                         | Description               |
| :------------- | :------------------------------------------- | :------------------------ |
| `fid`          | `number`                                     | The fid of the user.      |
| `reactionType` | [`ReactionType`](./Messages.md#reactiontype) | The type of the reaction. |
| `targetCastId` | [`CastId`](./Messages.md#castid)             | The cast id.              |

---

### getReactionsByCast

Returns all active reactions made by users to a cast.

#### Usage

```typescript
import { getSSLHubRpcClient, hexStringToBytes, ReactionType } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const castHashHex = '87b54f68933c0e98bd4e18121c147d0475236d38'; // Cast to fetch reactions for
    const castHashBytes = hexStringToBytes(castHashHex)._unsafeUnwrap(); // Safety: castHashHex is known and can't error

    const reactionsResult = await client.getReactionsByCast({
      reactionType: ReactionType.LIKE,
      targetCastId: {
        fid: 2,
        hash: castHashBytes,
      },
    });

    reactionsResult.map((reaction) => console.log(reaction.messages));
    client.close();
  }
});
```

#### Returns

| Value                                | Description                          |
| :----------------------------------- | :----------------------------------- |
| `MessagesResult<ReactionAddMessage>` | Zero or more `ReactionAdd` messages. |

#### Parameters

| Name            | Type                                         | Description                                      |
| :-------------- | :------------------------------------------- | :----------------------------------------------- |
| `targetCastId`  | [`CastId`](./Messages.md#castid)             | The cast id.                                     |
| `reactionType?` | [`ReactionType`](./Messages.md#reactiontype) | (optional) The type of the reaction.             |
| `pageSize?`     | `number`                                     | Number of results per page.                      |
| `pageToken?`    | `Uint8Array`                                 | Token used to fetch the next page, if it exists. |
| `reverse?`      | `boolean`                                    | Reverses the chronological ordering.             |

---

### getReactionsByFid

Returns all active reactions made by a user in reverse chronological order.

#### Usage

```typescript
import { getSSLHubRpcClient, ReactionType } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const reactionsResult = await client.getReactionsByFid({ fid: 2, reactionType: ReactionType.LIKE });
    reactionsResult.map((reaction) => console.log(reaction.messages));
    client.close();
  }
});
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
import { getSSLHubRpcClient } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const reactionsResult = await client.getAllReactionMessagesByFid({ fid: 2 });
    reactionsResult.map((reaction) => console.log(reaction.messages));

    client.close();
  }
});
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
import { getSSLHubRpcClient, hexStringToBytes } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const addressHex = '0x91031dcfdea024b4d51e775486111d2b2a715871';
    const addressBytes = hexStringToBytes(addressHex)._unsafeUnwrap(); // Safety: addressHex is known and can't error

    const verificationResult = await client.getVerification({ fid: 2, address: addressBytes });

    verificationResult.map((verification) => console.log(verification));
    client.close();
  }
});
```

#### Returns

| Type                                           | Description                         |
| :--------------------------------------------- | :---------------------------------- |
| `MessageResult<VerificationAddAddressMessage>` | A `VerificationAddAddress` message. |

#### Parameters

| Name      | Type         | Description                          |
| :-------- | :----------- | :----------------------------------- |
| `fid`     | `number`     | The fid of the user.                 |
| `address` | `Uint8Array` | The Ethereum address being verified. |

---

### getVerificationsByFid

Returns all active verifications for Ethereum addresses made by a user in reverse chronological order.

#### Usage

```typescript
import { getSSLHubRpcClient } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const verificationsResult = await client.getVerificationsByFid({ fid: 2 });

    verificationsResult.map((verificationsResponse) =>
      verificationsResponse.messages.map((v) => {
        console.log(v);
      })
    );
    client.close();
  }
});
```

#### Returns

| Value                                           | Description                                     |
| :---------------------------------------------- | :---------------------------------------------- |
| `MessagesResult<VerificationAddAddressMessage>` | Zero or more `VerificationAddAddress` messages. |

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
import { getSSLHubRpcClient } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const verificationsResult = await client.getAllVerificationMessagesByFid({ fid: 2 });
    verificationsResult.map((verificationsResponse) =>
      verificationsResponse.messages.map((v) => {
        console.log(v);
      })
    );

    client.close();
  }
});
```

#### Returns

| Type                                                                       | Description                                                             |
| :------------------------------------------------------------------------- | :---------------------------------------------------------------------- |
| `MessagesResult<VerificationAddAddressMessage\|VerificationRemoveMessage>` | Zero or more `VerificationAddAddress` or `VerificationRemove` messages. |

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
import { getSSLHubRpcClient, HubEventType } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const subscribeResult = await client.subscribe({
      eventTypes: [HubEventType.MERGE_MESSAGE],
    });

    if (subscribeResult.isOk()) {
      const stream = subscribeResult.value;

      for await (const event of stream) {
        console.log(event);
      }
    }

    client.close();
  }
});
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
import { getSSLHubRpcClient, getAuthMetadata } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const message; // Any valid message constructed with a Builder

    const submitResult = await client.submitMessage(message);
    console.log(submitResult);

    // If the node requires auth, pass the metadata as a second argument instead:
    // const authMetadata = getAuthMetadata('username', 'password');
    // const submitResult = await client.submitMessage(message, authMetadata);

    client.close();
  }
});
```

#### Returns

| Value              | Description                     |
| :----------------- | :------------------------------ |
| `MessageResult<T>` | The message that was submitted. |

#### Parameters

| Name        | Type      | Description                                                  |
| :---------- | :-------- | :----------------------------------------------------------- |
| `message`   | `Message` | The message being submitted                                  |
| `metadata?` | `string`  | (optional) Username and password metadata for authentication |

---

### getIdRegistryOnChainEvent

Returns the onchain IdRegistry event most recently associated with changing an fid's ownership.

#### Usage

```typescript
import { getSSLHubRpcClient } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const idrResult = await client.getIdRegistryOnChainEvent({ fid: 2 });
    idrResult.map((event) => console.log(event));

    client.close();
  }
});
```

#### Returns

| Value                          | Description                                      |
| :----------------------------- | :----------------------------------------------- |
| `HubAsyncResult<OnChainEvent>` | An `OnChainEvent` with an `idRegisterEventBody`. |

#### Parameters

| Name  | Type     | Description          |
| :---- | :------- | :------------------- |
| `fid` | `number` | The fid of the user. |

---

### getUsernameProof

Returns the proof of ownership for a username (an fname or an ENS name), including the fid and owner address it is
registered to.

#### Usage

```typescript
import { getSSLHubRpcClient } from '@farcaster/hub-nodejs';

const hubRpcEndpoint = 'your-node.example.com:3383';
const client = getSSLHubRpcClient(hubRpcEndpoint);

client.$.waitForReady(Date.now() + 5000, async (e) => {
  if (e) {
    console.error(`Failed to connect to ${hubRpcEndpoint}:`, e);
    process.exit(1);
  } else {
    console.log(`Connected to ${hubRpcEndpoint}`);

    const fnameBytes = new TextEncoder().encode('v');
    const proofResult = await client.getUsernameProof({ name: fnameBytes });

    proofResult.map((proof) => console.log(proof));
    client.close();
  }
});
```

#### Returns

| Value                           | Description        |
| :------------------------------ | :----------------- |
| `HubAsyncResult<UserNameProof>` | A `UserNameProof`. |

#### Parameters

| Name   | Type         | Description                   |
| :----- | :----------- | :---------------------------- |
| `name` | `Uint8Array` | The username, as UTF-8 bytes. |

## Method Response Documentation

### MessageResult

A documentation alias for `HubAsyncResult<Message>` where the success value contains a single message.

Messages are of the type <T> requested but this is an implicit guarantee since ts-proto does not generate bindings
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
