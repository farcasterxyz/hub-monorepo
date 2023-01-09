# @farcaster/js

A collection of Typescript classes and methods for easily creating Farcaster messages and interacting with Farcaster hubs.

Here's an example for demonstration purposes:

```typescript
import { Client, Ed25519Signer, Eip712Signer, makeCastAdd, makeReactionAdd, makeSignerAdd, types } from '@hub/js';
import { ethers } from 'ethers';

const client = new Client('<insert hub address and port>');

const dataOptions = { fid: 15, network: types.FarcasterNetwork.Testnet };

const custodyWallet = ethers.Wallet.fromMnemonic('<custody address mnemonic>');
const eip712Signer = new Eip712Signer(custodyWallet, custodyWallet.address);

const ed25519Signer = new Ed25519Signer('<ed25519 private key>');

const signerAdd = await makeSignerAdd({ signer: ed25519Signer.signerKeyHex }, dataOptions, eip712Signer);

await client.submitMessage(signerAdd._unsafeUnwrap());

const checkSigner = await client.getSigner(15, ed25519Signer.signerKeyHex);

const cast = await makeCastAdd({ text: 'hello world' }, dataOptions, ed25519Signer);
await client.submitMessage(cast._unsafeUnwrap());

const like = await makeReactionAdd(
  {
    type: types.ReactionType.Like,
    target: { fid: 15, tsHash: cast._unsafeUnwrap().tsHash },
  },
  dataOptions,
  ed25519Signer
);
await client.submitMessage(like._unsafeUnwrap());
```
