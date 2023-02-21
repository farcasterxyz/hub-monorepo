# @farcaster/js

A collection of Typescript classes and methods for easily creating Farcaster messages and interacting with Farcaster hubs over gRPC.

TODO: explain what protobufs are, and what this package does under the hood

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

// developers should safely store this signing key on behalf of users
const privateKey = ed.utils.randomPrivateKey();

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
 * and the hub will now accept messages signed by this key
 *
 * to read more about the signer key:
 * https://github.com/farcasterxyz/protocol#92-signers
 */

/* -------------------------------------------------------------- */
/*                       Interacting with hub                     */
/* -------------------------------------------------------------- */

// make a cast
const cast = await makeCastAdd({ text: 'hello world' }, dataOptions, ed25519Signer);

// And submit the new reaction to the hub
await client.submitMessage(like._unsafeUnwrap());

/**
 * the flow of interacting with hub:
 * 1. create a message with signer key (cast message, reactions message, verification message, etc)
 * 2. submit the message to the hub
 * 3. to see all the available function, see the "Functions" part below
 *    (the ones that starts with "makeAmpAdd", "makeAmpAddData", etc)
 */
```

## Classes

| Class         | Description                                       | Docs                            |
| ------------- | ------------------------------------------------- | ------------------------------- |
| Client        | Class for interacting with the Farcaster protocol | [docs](./docs/Client.md)        |
| Ed25519Signer | Class for signing messages with Ed25519           | [docs](./docs/Ed25519Signer.md) |
| Eip712Signer  | Class for signing message in the EIP712 format    | [docs](./docs/Eip712Signer.md)  |

## Functions

| Function                          | Description                                                       | Docs                                                          |
| --------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| makeAmpAdd                        | TODO                                                              | [docs](./docs/functions.md#makeampadd)                        |
| makeAmpAddData                    | TODO                                                              | [docs](./docs/functions.md#makeampadddata)                    |
| makeAmpRemove                     | TODO                                                              | [docs](./docs/functions.md#makeampremove)                     |
| makeAmpRemoveData                 | TODO                                                              | [docs](./docs/functions.md#makeampremovedata)                 |
| makeCastAdd                       | TODO                                                              | [docs](./docs/functions.md#makecastadd)                       |
| makeCastAddData                   | TODO                                                              | [docs](./docs/functions.md#makecastadddata)                   |
| makeCastRemove                    | TODO                                                              | [docs](./docs/functions.md#makecastremove)                    |
| makeCastRemoveData                | TODO                                                              | [docs](./docs/functions.md#makecastremovedata)                |
| makeMessageHash                   | Creates a hash of a message.                                      | [docs](./docs/functions.md#makemessagehash)                   |
| makeMessageWithSignature          | Adds a signature to a message.                                    | [docs](./docs/functions.md#makemessagewithsignature)          |
| makeReactionAdd                   | Creates a message for adding a reaction.                          | [docs](./docs/functions.md#makereactionadd)                   |
| makeReactionAddData               | Creates data for adding a reaction.                               | [docs](./docs/functions.md#makereactionadddata)               |
| makeReactionRemove                | Creates a message for removing a reaction.                        | [docs](./docs/functions.md#makereactionremove)                |
| makeReactionRemoveData            | Creates data for removing a reaction.                             | [docs](./docs/functions.md#makereactionremovedata)            |
| makeSignerAdd                     | Creates a message for adding a signer.                            | [docs](./docs/functions.md#makesigneradd)                     |
| makeSignerAddData                 | Creates data for adding a signer.                                 | [docs](./docs/functions.md#makesigneradddata)                 |
| makeSignerRemove                  | Creates a message for removing a signer.                          | [docs](./docs/functions.md#makesignerremove)                  |
| makeSignerRemoveData              | Creates data for removing a signer.                               | [docs](./docs/functions.md#makesignerremovedata)              |
| makeUserDataAdd                   | Creates a message for adding user data.                           | [docs](./docs/functions.md#makeuserdataadd)                   |
| makeUserDataAddData               | Creates data for adding user data.                                | [docs](./docs/functions.md#makeuserdataadddata)               |
| makeVerificationAddEthAddress     | Creates a message for adding an Ethereum address to verification. | [docs](./docs/functions.md#makeverificationaddethaddress)     |
| makeVerificationAddEthAddressData | Creates data for adding an Ethereum address to verification.      | [docs](./docs/functions.md#makeverificationaddethaddressdata) |
| makeVerificationRemove            | Creates a message for removing a verification.                    | [docs](./docs/functions.md#makeverificationremove)            |
| makeVerificationRemoveData        | Creates data for removing a verification.                         | [docs](./functions.md#makeverificationremovedata)             |

## Namespaces

| Namespace | Description | Docs                        |
| --------- | ----------- | --------------------------- |
| protobufs | TODO        | [docs](./docs/protobufs.md) |
| types     | TOOD        | [docs](./docs/types.md)     |
| utils     | TODO        | [docs](./docs/utils.md)     |

## Type Aliases

| Alias        | Description | Docs                                 |
| ------------ | ----------- | ------------------------------------ |
| EventFilters | TODO        | [docs](./docs/types.md#eventfilters) |
