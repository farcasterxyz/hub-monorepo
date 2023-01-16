# @farcaster/js

A collection of Typescript classes and methods for easily creating Farcaster messages and interacting with Farcaster hubs over gRPC.

Here's an example for demonstration purposes:

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
