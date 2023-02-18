# @farcaster/js

A collection of Typescript classes and methods for easily creating Farcaster messages and interacting with Farcaster hubs over gRPC.

## Classes

| Class                                     | Description                                        | Docs                                  |
| ----------------------------------------- | -------------------------------------------------- | ------------------------------------- |
| [Client](classes/Client.md)               | Class for interacting with the Farcaster protocol. | [docs](docs/classes/Client.md)        |
| [Ed25519Signer](classes/Ed25519Signer.md) | Class for signing messages with Ed25519.           | [docs](docs/classes/Ed25519Signer.md) |
| [Eip712Signer](classes/Eip712Signer.md)   | Class for signing messages with EIP-712.           | [docs](docs/classes/Eip712Signer.md)  |

## Functions

| Function                                                                          | Description                                                       | Docs                                                      |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| [makeAmpAdd](modules.md#makeampadd)                                               | Creates a message for adding AMP liquidity.                       | [docs](docs/modules.md#makeampadd)                        |
| [makeAmpAddData](modules.md#makeampadddata)                                       | Creates data for adding AMP liquidity.                            | [docs](docs/modules.md#makeampadddata)                    |
| [makeAmpRemove](modules.md#makeampremove)                                         | Creates a message for removing AMP liquidity.                     | [docs](docs/modules.md#makeampremove)                     |
| [makeAmpRemoveData](modules.md#makeampremovedata)                                 | Creates data for removing AMP liquidity.                          | [docs](docs/modules.md#makeampremovedata)                 |
| [makeCastAdd](modules.md#makecastadd)                                             | Creates a message for adding CAST liquidity.                      | [docs](docs/modules.md#makecastadd)                       |
| [makeCastAddData](modules.md#makecastadddata)                                     | Creates data for adding CAST liquidity.                           | [docs](docs/modules.md#makecastadddata)                   |
| [makeCastRemove](modules.md#makecastremove)                                       | Creates a message for removing CAST liquidity.                    | [docs](docs/modules.md#makecastremove)                    |
| [makeCastRemoveData](modules.md#makecastremovedata)                               | Creates data for removing CAST liquidity.                         | [docs](docs/modules.md#makecastremovedata)                |
| [makeMessageHash](modules.md#makemessagehash)                                     | Creates a hash of a message.                                      | [docs](docs/modules.md#makemessagehash)                   |
| [makeMessageWithSignature](modules.md#makemessagewithsignature)                   | Adds a signature to a message.                                    | [docs](docs/modules.md#makemessagewithsignature)          |
| [makeReactionAdd](modules.md#makereactionadd)                                     | Creates a message for adding a reaction.                          | [docs](docs/modules.md#makereactionadd)                   |
| [makeReactionAddData](modules.md#makereactionadddata)                             | Creates data for adding a reaction.                               | [docs](docs/modules.md#makereactionadddata)               |
| [makeReactionRemove](modules.md#makereactionremove)                               | Creates a message for removing a reaction.                        | [docs](docs/modules.md#makereactionremove)                |
| [makeReactionRemoveData](modules.md#makereactionremovedata)                       | Creates data for removing a reaction.                             | [docs](docs/modules.md#makereactionremovedata)            |
| [makeSignerAdd](modules.md#makesigneradd)                                         | Creates a message for adding a signer.                            | [docs](docs/modules.md#makesigneradd)                     |
| [makeSignerAddData](modules.md#makesigneradddata)                                 | Creates data for adding a signer.                                 | [docs](docs/modules.md#makesigneradddata)                 |
| [makeSignerRemove](modules.md#makesignerremove)                                   | Creates a message for removing a signer.                          | [docs](docs/modules.md#makesignerremove)                  |
| [makeSignerRemoveData](modules.md#makesignerremovedata)                           | Creates data for removing a signer from an account.               | [docs](docs/modules.md#makesignerremovedata)              |
| [makeUserDataAdd](modules.md#makeuserdataadd)                                     | Creates a message for adding user data.                           | [docs](docs/modules.md#makeuserdataadd)                   |
| [makeUserDataAddData](modules.md#makeuserdataadddata)                             | Creates data for adding user data.                                | [docs](docs/modules.md#makeuserdataadddata)               |
| [makeVerificationAddEthAddress](modules.md#makeverificationaddethaddress)         | Creates a message for adding an Ethereum address to verification. | [docs](docs/modules.md#makeverificationaddethaddress)     |
| [makeVerificationAddEthAddressData](modules.md#makeverificationaddethaddressdata) | Creates data for adding an Ethereum address to verification.      | [docs](docs/modules.md#makeverificationaddethaddressdata) |
| [makeVerificationRemove](modules.md#makeverificationremove)                       | Creates a message for removing a verification.                    | [docs](docs/modules.md#makeverificationremove)            |
| [makeVerificationRemoveData](modules.md#makeverificationremovedata)               | Creates data for removing a verification.                         | [docs](docs/modules.md#makeverificationremovedata)        |

## Namespaces

### protobufs

Contains protobuf types used in Hubble.

| Schema                                                     | Type Description                         | Docs                      |
| ---------------------------------------------------------- | ---------------------------------------- | ------------------------- |
| [Message](src/schemas/message.proto)                       | Types for Farcaster deltas               | [docs](docs/message.md)   |
| [Gossip](src/schemas/gossip.proto)                         | Types for gossiping data between Hubs    | [docs](docs/gossip.md)    |
| [RPC](src/schemas/rpc.proto)                               | Types for gRPC APIs exposed by Hubs      | [docs](docs/rpc.md)       |
| [IdRegistryEvent](src/schemas/id_registry_event.proto)     | Types for representing on-chain activity | [docs](docs/events.md)    |
| [NameRegistryEvent](src/schemas/name_registry_event.proto) | Types for representing on-chain activity | [docs](docs/events.md)    |
| [HubState](src/schemas/hub_state.proto)                    | Types for for maintaining internal state | [docs](docs/hub_state.md) |

## Type Aliases

| Alias                                   | Description                                                  | Docs                                 |
| --------------------------------------- | ------------------------------------------------------------ | ------------------------------------ |
| [EventFilters](modules.md#eventfilters) | Type alias for event filters used in the Farcaster protocol. | [docs](docs/modules.md#eventfilters) |

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
