@farcaster/js / [Exports](modules.md)

# @farcaster/js

A simple library for Farcaster that makes it easy to create new messages and interact with hubs. Designed to work with [Hubble](https://github.com/farcasterxyz/hubble/) and any other Hub that implements the [Farcaster protocol](https://github.com/farcasterxyz/protocol).

**Features**

- Create and sign Farcaster messages using simple methods.
- Use all Hub endpoints natively in Javascript, including subscriptions.
- Converts protobufs to and from native Javascript types automatically.
- Written entirely in TypeScript, with strict types for safety.

## Installation

Install @farcaster/js with the package manager of your choice

```bash
npm install @farcaster/js
yarn add @farcaster/js
pnpm install @farcaster/js
```

Read the [documentation](./docs/) or get started with an simple example below.

## Quickstart

### Fetching Data from Hubs

```typescript
import { Client } from '@farcaster/js';

(async () => {
  // Connect to a known hub using its address of the form <ip_address>:<rpc_port>
  const client = new Client('127.0.0.1:8080');

  // Set the user whose casts we will be fetching
  const fid = 2;

  const castsResult = await client.getCastsByFid(fid);

  if (castsResult.isErr()) {
    console.log('Failed: ', castsResult.error);
  }

  castsResult.map((casts) => casts.map((c) => console.log(`${c.data.body.text}\n`)));
})();
```

Note that functions do not throw exceptions and instead return a Result. Each Result contains a success or error value which should be handled with conditional logic. Read the [neverthrow](https://github.com/supermacro/neverthrow/blob/master/README.md) documentation to learn more about Result types.

### Writing Data to Hubs

If you own a Farcaster account you can also write messages and submit them to a Hubb. You'll need the mnemonic of the custody address that owns the account on the Ethereum blockchain to get started.

```bash
npm install noble ethers
yarn add noble ethers
pnpm install noble ethers
```

Create a new [Signer](https://github.com/farcasterxyz/protocol#92-signers) key pair and authorize it by signing it with the custody address.

```typescript
import {
  Client,
  Ed25519Signer,
  Eip712Signer,
  makeCastAdd,
  makeCastRemove,
  makeReactionAdd,
  makeReactionRemove,
  makeSignerAdd,
  makeUserDataAdd,
  types,
} from '@farcaster/js';
import * as ed from '@noble/ed25519';
import { ethers } from 'ethers';
import * as ed from '@noble/ed25519';
import { ethers } from 'ethers';

// Safety: we use unsafeUnwrap() and crash on failure in a few places, since it can't be handled
//  any other way

// Create an EIP712 Signer with the wallet that holds the custody address of the user
const mnemonic = 'your mnemonic apple orange banana ...'; // mnemonic for the custody address' wallet
const wallet = ethers.Wallet.fromMnemonic(mnemonic);
const eip712Signer = Eip712Signer.fromSigner(wallet, wallet.address)._unsafeUnwrap();

// Generate a new Ed25519 key pair which will become the Signer and store the private key securely
const signerPrivateKey = ed.utils.randomPrivateKey();
const signerPrivateKeyHex = ed.utils.bytesToHex(signerPrivateKey);

// Create a SignerAdd message that contains the public key of the signer
const dataOptions = {
  fid: -9999, // Set to the fid of the user
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
};
const signerAddResult = await makeSignerAdd({ signer: signerPrivateKeyHex }, dataOptions, eip712Signer);
const signerAdd = signerAddResult._unsafeUnwrap();

// Submit the SignerAdd message to the Hub
const client = new Client('127 .0.0.1:8080');
const result = await client.submitMessage(signerAdd);
result.isOk() ? console.log('SignerAdd was published successfully!') : console.log(result.error);
```

Once a SignerAdd is accepted the Signer can be used publish other types of Farcaster messages to a Hub, as shown below.

```typescript
const ed25519Signer = Ed25519Signer.fromPrivateKey(signerPrivateKey)._unsafeUnwrap();

// Make a new cast
const cast = await makeCastAdd({ text: 'hello world' }, dataOptions, ed25519Signer);
await client.submitMessage(cast._unsafeUnwrap());

// Like an existing cast
const reactionLikeBody = {
  type: types.ReactionType.REACTION_TYPE_LIKE,
  target: { fid: -9998, hash: '0x455a6caad5dfd4d...' },
};
const like = await makeReactionAdd(reactionLikeBody, dataOptions, ed25519Signer);
await client.submitMessage(like._unsafeUnwrap());

// Undo the previous like
const unlike = await makeReactionRemove(reactionLikeBody, dataOptions, ed25519Signer);
await client.submitMessage(unlike._unsafeUnwrap());

// Delete a cast
const removeBody = { targetHash: '0xf88d738eb7145f4cea40fbe8f3bdf...' };
const castRemove = await makeCastRemove(removeBody, dataOptions, ed25519Signer);
await client.submitMessage(castRemove._unsafeUnwrap());

// Set a profile picture
const userDataPfpBody = {
  type: types.UserDataType.USER_DATA_TYPE_PFP,
  value: 'https://i.imgur.com/yed5Zfk.gif',
};
const userDataPfpAdd = await makeUserDataAdd(userDataPfpBody, dataOptions, ed25519Signer);
await client.submitMessage(userDataPfpAdd._unsafeUnwrap());
```

If you want to write messages on behalf of another user, you will not have access to their custody address. In such cases, generate a signer and share the public key with the user who can use their wallet to create the SignerAdd and submit it to the Hub. Once that completes, you can use the Signer to write messages on behalf of the user.

## `Client`

Class to interact with hubble. See the [docs](./docs/classes/Client.md) for more details.

| Function                            | Description                                                       |
| ----------------------------------- | ----------------------------------------------------------------- |
| `Client()`                          | Creates an instance of the client                                 |
| `_grpcClient`                       | Property: contains the gRPC client used to connect to the service |
| `getAllCastMessagesByFid()`         | Gets all cast messages by a given fid                             |
| `getAllReactionMessagesByFid()`     | Gets all reaction messages by a given fid                         |
| `getAllSignerMessagesByFid()`       | Gets all signer messages by a given fid                           |
| `getAllUserDataMessagesByFid()`     | Gets all user data messages by a given fid                        |
| `getAllVerificationMessagesByFid()` | Gets all verification messages by a given fid                     |
| `getCast()`                         | Gets the cast with a given ID                                     |
| `getCastsByFid()`                   | Gets all casts by a given fid                                     |
| `getCastsByMention()`               | Gets all casts by a given mention                                 |
| `getCastsByParent()`                | Gets all casts with a given parent cast hash                      |
| `getIdRegistryEvent()`              | TODO DOCS                                                         |
| `getNameRegistryEvent()`            | TODO DOCS                                                         |
| `getReaction()`                     | TODO DOCS                                                         |
| `getReactionsByCast()`              | Gets all reactions for a given cast hash                          |
| `getReactionsByFid()`               | Gets all reactions by a given fid                                 |
| `getSigner()`                       | TODO DOCS                                                         |
| `getSignersByFid()`                 | Gets all signers by a given fid                                   |
| `getUserData()`                     | Gets user data (pfp, display name, bio, etc)                      |
| `getUserDataByFid()`                | Gets all user data by a given fid                                 |
| `getVerification()`                 | TODO DOCS                                                         |
| `getVerificationsByFid()`           | TODO DOCS                                                         |
| `submitMessage()`                   | Submits a message to hubble                                       |
| `subscribe()`                       | Subscribes to updates from hubble                                 |

## `Ed25519Signer`

Class to sign messages with ed25519. See the [docs](./docs/classes/Ed25519Signer.md) for more details.

| Name                   | Description                                                                   |
| :--------------------- | :---------------------------------------------------------------------------- |
| `Ed25519Signer()`      | Creates a new instance of the `Ed25519Signer` class.                          |
| `scheme`               | Property: scheme used by the signer as defined in protobufs.                  |
| `signerKey`            | Property: EdDSA public key in bytes.                                          |
| `signerKeyHex`         | Property: EdDSA public key in hex.                                            |
| `signMessageHash()`    | Signs a given hash.                                                           |
| `signMessageHashHex()` | Signs a given hash, returns result in hex format.                             |
| `fromPrivateKey()`     | Creates a new instance of the `Ed25519Signer` class from a EdDSA private key. |

## `Eip712Signer`

Class to sign messages in the EIP712 format. See the [docs](./docs/classes/Eip712Signer.md) for more details.

| Name                                   | Description                                                                            |
| :------------------------------------- | :------------------------------------------------------------------------------------- |
| `EIP712Signer()`                       | Creates a new instance of the EIP712Signer class.                                      |
| `scheme`                               | Property: scheme used by the signer.                                                   |
| `signerKey`                            | Property: signer's ECDSA public key in bytes.                                          |
| `signerKeyHex`                         | Property: signer's ECDSA public key in hex.                                            |
| `signMessageHash()`                    | Signs a message hash with the signer's Ethereum address.                               |
| `signMessageHashHex()`                 | Signs a message hash with the signer's Ethereum address, returns result in hex format. |
| `signVerificationEthAddressClaim()`    | TODO DOCS                                                                              |
| `signVerificationEthAddressClaimHex()` | TODO DOCS                                                                              |
| `fromSigner()`                         | Instantiate a new EIP712Signer from an ECDSA private key (Ethereum).                   |

## `Functions`

Functions to make messages. See the [docs](./docs/modules.md#functions) for more details. Note: these functions only make messages, they do not submit them to the hub. To submit, use `client.submitMessage(message)`.

| Name                              | Description                                                         |
| --------------------------------- | ------------------------------------------------------------------- |
| `makeCastAdd()`                   | Creates a message to add cast                                       |
| `makeCastRemove()`                | Creates a message to delete cast                                    |
| `makeMessageHash()`               | TODO DOCS                                                           |
| `makeReactionAdd()`               | Creates a message to react to cast (like or recast)                 |
| `makeReactionRemove()`            | Creates a message to remove reaction from cast (unlike or unrecast) |
| `makeSignerAdd()`                 | Creates a message to add a ed25519 signer key                       |
| `makeSignerRemove()`              | Creates a message to remove a ed25519 signer key                    |
| `makeUserDataAdd()`               | Creates a message to set user data (pfp, link, display name, etc)   |
| `makeVerificationAddEthAddress()` | TODO DOCS                                                           |
| `makeVerificationRemove()`        | TODO DOCS                                                           |
