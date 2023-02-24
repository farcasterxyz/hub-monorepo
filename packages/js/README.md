# @farcaster/js

A collection of Typescript classes and methods for easily creating Farcaster messages and interacting with Farcaster hubs over gRPC.

TODO DOCS: explain what protobufs are, and what this package does under the hood

## Quickstart

```bash
npm install @farcaster/js ethers@5.7.2 @noble/ed25519
```

```typescript
/* -------------------------------------------------------------------------- */
/*                          Signer key registration                           */
/* -------------------------------------------------------------------------- */

/**
 * this package uses `neverthrow` to handle errors, that's why
 * there are things like isOk() and _unsafeUnwrap() in the code
 *
 * read more: https://github.com/supermacro/neverthrow
 */

import { Client, Ed25519Signer, Eip712Signer, makeSignerAdd, types } from '@farcaster/js';
import { ethers } from 'ethers';
import * as ed from '@noble/ed25519';

const rpcUrl = '<rpc-url>';
const client = new Client(rpcUrl);

const privateKey = ed.utils.randomPrivateKey();
const privateKeyHex = ed.utils.bytesToHex(privateKey);
console.log(privateKeyHex); // 86be7f6f8dcf18...
// developers should safely store this EdDSA private key on behalf of users

// _unsafeUnwrap() is used here for simplicity, but should be avoided in production
const ed25519Signer = Ed25519Signer.fromPrivateKey(privateKey)._unsafeUnwrap();

const mnemonic = 'your mnemonic apple orange banana ...';
const wallet = ethers.Wallet.fromMnemonic(mnemonic);

// _unsafeUnwrap() is used here for simplicity, but should be avoided in production
const eip712Signer = Eip712Signer.fromSigner(wallet, wallet.address)._unsafeUnwrap();

// todo: could the fid value be fetched from smart contract?
const dataOptions = {
  fid: -9999, // must be changed to fid of the custody address, or else it will fail
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
};

const signerAdd = await makeSignerAdd({ signer: ed25519Signer.signerKeyHex }, dataOptions, eip712Signer);

if (signerAdd.isErr()) {
  // handle error
}

const result = await client.submitMessage(signerAdd.value);

console.log(result);

/**
 * if everything goes well, it should return something like this:
 *
 *  {
 *  _protobuf: { // raw bytes },
 *  data: {
 *    _protobuf: { // raw bytes },
 *     body: {
 *    signer: '0xa1ae695cc61bedcf4787ddfe1de63640f3e3ccd2e2734f80ceb4dee27baa8aaa'
 *    },
 *    type: 9,
 *    timestamp: 1676960015000,
 *    fid: 4640,
 *    network: 3
 *  },
 *  hash: '0x7ff7a6c7a3bc86a1b03b535cefaa7c855c917f8a',
 *  hashScheme: 1,
 *  signature: '0xd5e186bee6b560af60bcb9...',
 *  signatureScheme: 2,
 *  signer: '0x86dd7e4af49829b895d24ea2ab581c7c32e87332'
 *  }
 *
 *
 * this means is the signer key was successfully added to the hub
 * and the hub will now accept messages signed by ed25519Signer above
 *
 * to read more about the signer key:
 * https://github.com/farcasterxyz/protocol#92-signers
 */
```

```typescript
/* -------------------------------------------------------------- */
/*                       Interacting with hub                     */
/* -------------------------------------------------------------- */

/**
 * let us suppose we are in a brand-new file, here's how we can make
 * an ed25519Signer from a previously registered signer key
 */

import {
  Client,
  Ed25519Signer,
  Eip712Signer,
  makeCastRemove,
  makeReactionAdd,
  makeReactionRemove,
  makeSignerAdd,
  makeSignerRemove,
  makeUserDataAdd,
  types,
} from '@farcaster/js';

import * as ed from '@noble/ed25519';

const rpcUrl = '<rpc-url>';
const client = new Client(rpcUrl);

const privateKeyHex = '86be7f6f8dcf18...'; // EdDSA hex private key
const privateKey = ed.utils.hexToBytes(privateKeyHex);

// _unsafeUnwrap() is used here for simplicity, but should be avoided in production
const ed25519Signer = Ed25519Signer.fromPrivateKey(privateKey)._unsafeUnwrap();

const checkSigner = await client.getSigner(-9999, ed25519Signer.signerKeyHex);
console.log(checkSigner);

/**
 * valid signer key would return an object like makeSignerAdd() above
 *
 * now that we have a valid signer key object, we can use it to interact with hubs
 *
 * the flow of interacting with hub:
 * 1. create a message with signer key (cast message, reactions message, verification message, etc)
 * 2. submit the message to the hub
 * 3. to see all the available function, see the "Functions" part below
 */

const dataOptions = {
  fid: -9999, // must be changed to fid of the custody address, or else it will fail
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
};

/* ============= make a cast ============== */
const cast = await makeCastAdd({ text: 'hello world' }, dataOptions, ed25519Signer);
await client.submitMessage(cast._unsafeUnwrap());

/* ============= like a cast ============== */
const reactionLikeBody = {
  type: types.ReactionType.REACTION_TYPE_LIKE,
  target: { fid: -9998, tsHash: '0x455a6caad5dfd4d...' },
};
const like = await makeReactionAdd(reactionLikeBody, dataOptions, ed25519Signer);
await client.submitMessage(like._unsafeUnwrap());

/* ============= undo a like ============== */
const unlike = await makeReactionRemove(reactionLikeBody, dataOptions, ed25519Signer);
await client.submitMessage(unlike._unsafeUnwrap());

/* ============= recast a cast ============== */
const reactionRecastBody = {
  type: types.ReactionType.REACTION_TYPE_RECAST,
  target: { fid: -9998, tsHash: '0x455a6caad5dfd4d...' },
};
const recast = await makeReactionAdd(reactionRecastBody, dataOptions, ed25519Signer);
client.submitMessage(recast._unsafeUnwrap());

/* ============= undo a recast ============== */
const unrecast = await makeReactionRemove(reactionRecastBody, dataOptions, ed25519Signer);
client.submit(unrecast._unsafeUnwrap());

/* ============= delete a cast ============== */
const removeBody = { targetHash: '0xf88d738eb7145f4cea40fbe8f3bdf...' };
const castRemove = await makeCastRemove(removeBody, dataOptions, ed25519Signer);
await client.submitMessage(castRemove._unsafeUnwrap());

/* ============= make a signer key ============== */
const mnemonic = 'your mnemonic here apple orange banana';
const wallet = ethers.Wallet.fromMnemonic(mnemonic);
const eip712Signer = Eip712Signer.fromSigner(wallet, wallet.address)._unsafeUnwrap();

const newPrivateKey = ed.utils.randomPrivateKey();
const newEd25519Signer = Ed25519Signer.fromPrivateKey(newPrivateKey)._unsafeUnwrap();

const signerBody = { signer: newEd25519Signer.signerKeyHex };
const signerAdd = await makeSignerAdd(signerBody, dataOptions, eip712Signer);
await client.submitMessage(signerAdd._unsafeUnwrap());

/* ============= remove a signer key ============== */
const signerRemove = makeSignerRemove(signerBody, dataOptions, eip712Signer);
await client.submitMessage(signerRemove._unsafeUnwrap());

/* ============= set user pfp ============== */
const userDataPfpBody = {
  type: types.UserDataType.USER_DATA_TYPE_PFP,
  value: 'https://i.imgur.com/yed5Zfk.gif',
};
const userDataPfpAdd = await makeUserDataAdd(userDataPfpBody, dataOptions, ed25519Signer);
await client.submitMessage(userDataPfpAdd._unsafeUnwrap());
```

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
| `getIdRegistryEvent()`              | TODO DOCS                                                              |
| `getNameRegistryEvent()`            | TODO DOCS                                                              |
| `getReaction()`                     | TODO DOCS                                                              |
| `getReactionsByCast()`              | Gets all reactions for a given cast hash                          |
| `getReactionsByFid()`               | Gets all reactions by a given fid                                 |
| `getSigner()`                       | TODO DOCS                                                              |
| `getSignersByFid()`                 | Gets all signers by a given fid                                   |
| `getUserData()`                     | Gets user data (pfp, display name, bio, etc)                      |
| `getUserDataByFid()`                | Gets all user data by a given fid                                 |
| `getVerification()`                 | TODO DOCS                                                              |
| `getVerificationsByFid()`           | TODO DOCS                                                              |
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
| `signVerificationEthAddressClaim()`    | TODO DOCS                                                                                   |
| `signVerificationEthAddressClaimHex()` | TODO DOCS                                                                                   |
| `fromSigner()`                         | Instantiate a new EIP712Signer from an ECDSA private key (Ethereum).                   |

## `Functions`

Functions to make messages. See the [docs](./docs/modules.md#functions) for more details. Note: these functions only make messages, they do not submit them to the hub. To submit, use `client.submitMessage(message)`.

| Name                              | Description                                                         |
| --------------------------------- | ------------------------------------------------------------------- |
| `makeCastAdd()`                   | Creates a message to add cast                                       |
| `makeCastRemove()`                | Creates a message to delete cast                                    |
| `makeMessageHash()`               | TODO DOCS                                                                |
| `makeReactionAdd()`               | Creates a message to react to cast (like or recast)                 |
| `makeReactionRemove()`            | Creates a message to remove reaction from cast (unlike or unrecast) |
| `makeSignerAdd()`                 | Creates a message to add a ed25519 signer key                       |
| `makeSignerRemove()`              | Creates a message to remove a ed25519 signer key                    |
| `makeUserDataAdd()`               | Creates a message to set user data (pfp, link, display name, etc)   |
| `makeVerificationAddEthAddress()` | TODO DOCS                                                                |
| `makeVerificationRemove()`        | TODO DOCS                                                                |
