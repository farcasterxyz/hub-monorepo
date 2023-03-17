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
} from '@farcaster/hub-nodejs';
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
  fid: 1, // Set to the fid of the user
  network: types.FarcasterNetwork.DEVNET,
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
  type: types.ReactionType.LIKE,
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
  type: types.UserDataType.PFP,
  value: 'https://i.imgur.com/yed5Zfk.gif',
};
const userDataPfpAdd = await makeUserDataAdd(userDataPfpBody, dataOptions, ed25519Signer);
await client.submitMessage(userDataPfpAdd._unsafeUnwrap());
```

If you want to write messages on behalf of another user, you will not have access to their custody address. In such cases, generate a signer and share the public key with the user who can use their wallet to create the SignerAdd and submit it to the Hub. Once that completes, you can use the Signer to write messages on behalf of the user.
