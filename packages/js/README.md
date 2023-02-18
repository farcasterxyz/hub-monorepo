# @farcaster/js

A collection of Typescript classes and methods for easily creating Farcaster messages and interacting with Farcaster hubs over gRPC.

## Classes

| Class         | Description                                        | Docs                            |
| ------------- | -------------------------------------------------- | ------------------------------- |
| Client        | Class for interacting with the Farcaster protocol. | [docs](./docs/Client.md)        |
| Ed25519Signer | Class for signing messages with Ed25519.           | [docs](./docs/Ed25519Signer.md) |
| Eip712Signer  | Class for signing messages with EIP-712.           | [docs](./docs/Eip712Signer.md)  |

## Functions

| Function                          | Description                                                       | Docs                                                          |
| --------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------- |
| makeAmpAdd                        | Creates a message for adding AMP liquidity.                       | [docs](./docs/functions.md#makeampadd)                        |
| makeAmpAddData                    | Creates data for adding AMP liquidity.                            | [docs](./docs/functions.md#makeampadddata)                    |
| makeAmpRemove                     | Creates a message for removing AMP liquidity.                     | [docs](./docs/functions.md#makeampremove)                     |
| makeAmpRemoveData                 | Creates data for removing AMP liquidity.                          | [docs](./docs/functions.md#makeampremovedata)                 |
| makeCastAdd                       | Creates a message for adding CAST liquidity.                      | [docs](./docs/functions.md#makecastadd)                       |
| makeCastAddData                   | Creates data for adding CAST liquidity.                           | [docs](./docs/functions.md#makecastadddata)                   |
| makeCastRemove                    | Creates a message for removing CAST liquidity.                    | [docs](./docs/functions.md#makecastremove)                    |
| makeCastRemoveData                | Creates data for removing CAST liquidity.                         | [docs](./docs/functions.md#makecastremovedata)                |
| makeMessageHash                   | Creates a hash of a message.                                      | [docs](./docs/functions.md#makemessagehash)                   |
| makeMessageWithSignature          | Adds a signature to a message.                                    | [docs](./docs/functions.md#makemessagewithsignature)          |
| makeReactionAdd                   | Creates a message for adding a reaction.                          | [docs](./docs/functions.md#makereactionadd)                   |
| makeReactionAddData               | Creates data for adding a reaction.                               | [docs](./docs/functions.md#makereactionadddata)               |
| makeReactionRemove                | Creates a message for removing a reaction.                        | [docs](./docs/functions.md#makereactionremove)                |
| makeReactionRemoveData            | Creates data for removing a reaction.                             | [docs](./docs/functions.md#makereactionremovedata)            |
| makeSignerAdd                     | Creates a message for adding a signer.                            | [docs](./docs/functions.md#makesigneradd)                     |
| makeSignerAddData                 | Creates data for adding a signer.                                 | [docs](./docs/functions.md#makesigneradddata)                 |
| makeSignerRemove                  | Creates a message for removing a signer.                          | [docs](./docs/functions.md#makesignerremove)                  |
| makeSignerRemoveData              | Creates data for removing a signer from an account.               | [docs](./docs/functions.md#makesignerremovedata)              |
| makeUserDataAdd                   | Creates a message for adding user data.                           | [docs](./docs/functions.md#makeuserdataadd)                   |
| makeUserDataAddData               | Creates data for adding user data.                                | [docs](./docs/functions.md#makeuserdataadddata)               |
| makeVerificationAddEthAddress     | Creates a message for adding an Ethereum address to verification. | [docs](./docs/functions.md#makeverificationaddethaddress)     |
| makeVerificationAddEthAddressData | Creates data for adding an Ethereum address to verification.      | [docs](./docs/functions.md#makeverificationaddethaddressdata) |
| makeVerificationRemove            | Creates a message for removing a verification.                    | [docs](./docs/functions.md#makeverificationremove)            |
| makeVerificationRemoveData        | Creates data for removing a verification.                         | [docs](./functions.md#makeverificationremovedata)             |

## Namespaces

| Namespace | Description                      | Docs                        |
| --------- | -------------------------------- | --------------------------- |
| protobufs | Protobuf types used in Hubble    | [docs](./docs/protobufs.md) |
| types     | Types defined in Hubble          | [docs](./docs/types.md)     |
| utils     | Utility functions used in Hubble | [docs](./docs/utils.md)     |

## Type Aliases

| Alias        | Description                                                  | Docs                                 |
| ------------ | ------------------------------------------------------------ | ------------------------------------ |
| EventFilters | Type alias for event filters used in the Farcaster protocol. | [docs](./docs/types.md#eventfilters) |

## Example

To use the @farcaster/js library, you'll need to install it from npm:

```bash
npm install @farcaster/js
```

Then, you can use it in your JavaScript/TypeScript project like so:

```typescript
import { Client, Ed25519Signer, Eip712Signer, makeCastAdd, makeReactionAdd, makeSignerAdd, types } from '@farcaster/js';
import { ethers } from 'ethers';

// Create client for interacting with hub over gRPC
const client = new Client('<insert hub address and port>');

// Define default fid and network for created messages
const dataOptions = { fid: 15, network: types.FarcasterNetwork.Testnet };

// Create EIP-712 signer from ethers wallet (can be ethers.Wallet or ethers.JsonRpcSigner) (avoid _unsafeWrap in production)
const custodyWallet = ethers.Wallet.fromMnemonic('<custody address mnemonic>');
const eip712Signer = Eip712Signer.fromSigner(custodyWallet, custodyWallet.address)._unsafeUnwrap();

// Create Ed25519 signer (i.e. a delegate signer) (avoid _unsafeWrap in production)
const ed25519Signer = Ed25519Signer.fromPrivateKey('<ed25519 private key>')._unsafeUnwrap();

// Make SignerAdd message, signed by the EIP-712 signer
const signerAdd = await makeSignerAdd({ signer: ed25519Signer.signerKeyHex }, dataOptions, eip712Signer);

// Submit the newly created SignerAdd message to the hub. Builder methods return neverthrow
// results, so we have to access the successful result via value or _unsafeUnwrap()
await client.submitMessage(signerAdd._unsafeUnwrap());

// Query the hub to confirm the SignerAdd was merged successfully
const checkSigner = await client.getSigner(15, ed25519Signer.signerKeyHex);

// Make CastAdd message, signed by the Ed25519 signer
const cast = await makeCastAdd({ text: 'hello world' }, dataOptions, ed25519Signer);

// Submit the new cast to the hub
await client.submitMessage(cast._unsafeUnwrap());

// Make a ReactionAdd message (i.e. a like) for the cast we just created
const like = await makeReactionAdd(
  {
    type: types.ReactionType.Like,
    target: { fid: 15, tsHash: cast._unsafeUnwrap().tsHash },
  },
  dataOptions,
  ed25519Signer
);

// And submit the new reaction to the hub
await client.submitMessage(like._unsafeUnwrap());
```
