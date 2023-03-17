# Builders

Builders are factory methods that construct and sign Farcaster Messages which can be broadcast to Hubs.

## Prerequisites

Before you can build messages, you'll need construct the following objects:

- An `ed25519Signer`, used to sign most messages.
- A `eip712Signer`, used to sign some messages.
- A `dataOptions`, which contains message metadata.

### Ed25519Signer

A [Ed25519Signer](./signers/Ed25519Signer.md) is an EdDSA key pair which is necessary for signing most messages on behalf of an fid. This example below shows how to construct a new `Ed25519Signer` using the [@noble](https://paulmillr.com/noble/) library :

```typescript
import { Ed25519Signer } from '@farcaster/hub-nodejs';
import * as ed from '@noble/ed25519';

const privateKey = ed.utils.randomPrivateKey(); // Applications must store this key securely.

const ed25519Signer = Ed25519Signer.fromPrivateKey(privateKey)._unsafeUnwrap();
```

### Eip712Signer

An Eip712Signer is an ECDSA key pair which is necessary signing for some messages like `SignerAdds` and `Verifications`. This example shows how to construct an `Eip712Signer` from a wallet's recovery phrase:

```typescript
import { Eip712Signer } from '@farcaster/hub-nodejs';
import { ethers } from 'ethers';

const mnemonic = 'ordinary long coach bounce thank quit become youth belt pretty diet caught attract melt bargain';
const wallet = ethers.Wallet.fromMnemonic(mnemonic);

const eip712Signer = Eip712Signer.fromSigner(wallet, wallet.address)._unsafeUnwrap();
```

### Data Options

A DataOptions object tells the factory some metadata about the message. This example shows how to create the `dataOptions` object to pass to the Factory:

```typescript
import { FarcasterNetwork } from '@farcaster/hub-nodejs';

const dataOptions = {
  fid: 1, // Set to the fid of the user creating the message
  network: FarcasterNetwork.DEVNET, // Set to the network that the message is broadcast to.
};
```

## Builder Methods

- [makeSignerAdd](#makesigneradd)
- [makeSignerRemove](#makesignerremove)
- [makeCastAdd](#makecastadd)
- [makeCastRemove](#makecastremove)
- [makeReactionAdd](#makereactionadd)
- [makeReactionRemove](#makereactionremove)
- [makeUserDataAdd](#makeuserdataadd)
- [makeVerificationAddEthAddress](#makeverificationaddethaddress)
- [makeVerificationRemove](#makeverificationremove)

---

### makeSignerAdd

Returns a message which authorizes a new Ed25519 Signer to create messages on behalf of a user.

#### Usage

```typescript
import { makeSignerAdd } from '@farcaster/hub-nodejs';

const signerAdd = await makeSignerAdd({ signer: ed25519Signer.signerKey, name: 'foo' }, dataOptions, eip712Signer);
```

#### Returns

| Type                               | Description                                                    |
| :--------------------------------- | :------------------------------------------------------------- |
| `HubAsyncResult<SignerAddMessage>` | A `HubAsyncResult` that contains the valid `SignerAddMessage`. |

#### Parameters

| Name          | Type                                           | Description                                                                |
| :------------ | :--------------------------------------------- | :------------------------------------------------------------------------- |
| `body`        | [`SignerAddBody`](./Messages.md#signeraddbody) | A valid VerificationAddEd25519 body object containing the data to be sent. |
| `dataOptions` | `MessageDataOptions`                           | Optional arguments to construct the message.                               |
| `signer`      | `Eip712Signer`                                 | An Eip712Signer generated from the user's custody address.                 |

---

### makeSignerRemove

Returns a message which revokes a previously authorized Ed25519 Signer.

#### Usage

```typescript
import { makeSignerRemove } from '@farcaster/hub-nodejs';

const signerRemove = await makeSignerRemove({ signer: ed25519Signer.signerKey }, dataOptions, eip712Signer);
```

#### Returns

| Type                                  | Description                                                       |
| :------------------------------------ | :---------------------------------------------------------------- |
| `HubAsyncResult<SignerRemoveMessage>` | A `HubAsyncResult` that contains the valid `SignerRemoveMessage`. |

#### Parameters

| Name          | Type                                                 | Description                                                      |
| :------------ | :--------------------------------------------------- | :--------------------------------------------------------------- |
| `body`        | [`SignerRemoveBody`](./Messages.md#signerremovebody) | A valid SignerRemove body object containing the data to be sent. |
| `dataOptions` | `MessageDataOptions`                                 | Optional metadata to construct the message.                      |
| `signer`      | `Eip712Signer`                                       | An Eip712Signer generated from the user's custody address.       |

---

### makeCastAdd

Returns a message that adds a new Cast.

#### Usage

```typescript
import { makeCastAdd, types } from '@farcaster/hub-nodejs';

const cast = await makeCastAdd(
  { text: 'hello world', embeds: ['http://www.farcaster.xyz'], mentions: [], mentionsPositions: [] },
  dataOptions,
  ed25519Signer
);
```

#### Returns

| Type                             | Description                                     |
| :------------------------------- | :---------------------------------------------- |
| `HubAsyncResult<CastAddMessage>` | A Result that contains the valid CastAddMessage |

#### Parameters

| Name          | Type                                          | Description                                                 |
| :------------ | :-------------------------------------------- | :---------------------------------------------------------- |
| `body`        | [`CastAddBody`](./Messages.md#castaddbody)    | A valid CastAdd body object containing the data to be sent. |
| `dataOptions` | `MessageDataOptions`                          | Optional metadata to construct the message.                 |
| `signer`      | [`Ed25519Signer`](./signers/Ed25519Signer.md) | A currently valid Signer for the fid.                       |

---

### makeCastRemove

Returns a message that removes an existing Cast.

#### Usage

```typescript
import { makeCastRemove } from '@farcaster/hub-nodejs';

const targetHashHex = '006f082f70dfb2de81e7852f3b79f1cdf2aa6b86'; // Hash of the Cast being deleted as a hex string
const targetHashBytes = new Uint8Array(Buffer.from(targetHashHex, 'hex')); //  Hash of the Cast being deleted as bytes

const castRemove = await makeCastRemove(
  {
    targetHash: targetHashBytes,
  },
  dataOptions,
  ed25519Signer
);
```

#### Returns

| Type                                | Description                                                     |
| :---------------------------------- | :-------------------------------------------------------------- |
| `HubAsyncResult<CastRemoveMessage>` | A `HubAsyncResult` that contains the valid `CastRemoveMessage`. |

#### Parameters

| Name          | Type                                             | Description                                                    |
| :------------ | :----------------------------------------------- | :------------------------------------------------------------- |
| `body`        | [`CastRemoveBody`](./Messages.md#castremovebody) | A valid CastRemove body object containing the data to be sent. |
| `dataOptions` | `MessageDataOptions`                             | Optional metadata to construct the message.                    |
| `signer`      | [`Ed25519Signer`](./signers/Ed25519Signer.md)    | A currently valid Signer for the fid.                          |

---

### makeReactionAdd

Returns a message that adds a Reaction to an existing Cast.

#### Usage

```typescript
import { makeReactionAdd, ReactionType } from '@farcaster/hub-nodejs';

const targetHashHex = '006f082f70dfb2de81e7852f3b79f1cdf2aa6b86'; // Hash of the Cast being deleted as a hex string
const targetHashBytes = new Uint8Array(Buffer.from(targetHashHex, 'hex')); //  Hash of the Cast being deleted as bytes

const reactionLikeBody = {
  type: ReactionType.LIKE,
  targetCastId: {
    fid: 1, // Fid of the Cast's author, which is being reacted to.
    hash: targetHashBytes, // Hash of the CastAdd message being reacted to
  },
};

const like = await makeReactionAdd(reactionLikeBody, dataOptions, ed25519Signer);
```

#### Returns

| Type                                 | Description                                                      |
| :----------------------------------- | :--------------------------------------------------------------- |
| `HubAsyncResult<ReactionAddMessage>` | A `HubAsyncResult` that contains the valid `ReactionAddMessage`. |

#### Parameters

| Name          | Type                                          | Description                                                     |
| :------------ | :-------------------------------------------- | :-------------------------------------------------------------- |
| `body`        | [`ReactionBody`](./Messages.md#reactionbody)  | A valid ReactionAdd body object containing the data to be sent. |
| `dataOptions` | `MessageDataOptions`                          | Optional metadata to construct the message.                     |
| `signer`      | [`Ed25519Signer`](./signers/Ed25519Signer.md) | A currently valid Signer for the fid.                           |

---

### makeReactionRemove

Returns a message that removes an existing Reaction to an existing Cast.

#### Usage

```typescript
import { makeReactionRemove, ReactionType } from '@farcaster/hub-nodejs';

const targetHashHex = '006f082f70dfb2de81e7852f3b79f1cdf2aa6b86'; // Hash of the Cast being deleted as a hex string
const targetHashBytes = new Uint8Array(Buffer.from(targetHashHex, 'hex')); //  Hash of the Cast being deleted as bytes

const reactionLikeBody = {
  type: ReactionType.LIKE,
  targetCastId: {
    fid: 1, // Fid of the Cast's author, which is being reacted to.
    hash: targetHashBytes, // Hash of the CastAdd message being reacted to
  },
};

const like = await makeReactionRemove(reactionLikeBody, dataOptions, ed25519Signer);
```

#### Returns

| Type                                    | Description                                                         |
| :-------------------------------------- | ------------------------------------------------------------------- |
| `HubAsyncResult<ReactionRemoveMessage>` | A `HubAsyncResult` that contains the valid `ReactionRemoveMessage`. |

#### Parameters

| Name          | Type                                          | Description                                                        |
| :------------ | :-------------------------------------------- | :----------------------------------------------------------------- |
| `body`        | [`ReactionBody`](./Messages.md#reactionbody)  | A valid ReactionRemove body object containing the data to be sent. |
| `dataOptions` | `MessageDataOptions`                          | Optional metadata to construct the message.                        |
| `signer`      | [`Ed25519Signer`](./signers/Ed25519Signer.md) | A currently valid Signer for the fid.                              |

---

### makeUserDataAdd

Returns a message that updates metadata about the user.

#### Usage

```typescript
import { makeUserDataAdd, UserDataType } from '@farcaster/hub-nodejs';

const userDataPfpBody = {
  type: UserDataType.PFP,
  value: 'https://i.imgur.com/yed5Zfk.gif',
};

const userDataPfpAdd = await makeUserDataAdd(userDataPfpBody, dataOptions, ed25519Signer);
console.log(userDataPfpAdd);
```

#### Returns

| Value                                | Description                                                  |
| :----------------------------------- | :----------------------------------------------------------- |
| `HubAsyncResult<UserDataAddMessage>` | A `HubAsyncResult` that contains a signed `UserDataMessage`. |

#### Parameters

| Name          | Type                                          | Description                                                  |
| :------------ | :-------------------------------------------- | :----------------------------------------------------------- |
| `body`        | [`UserDataBody`](./Messages.md#userdatabody)  | A valid UserData body object containing the data to be sent. |
| `dataOptions` | `MessageDataOptions`                          | Optional metadata to construct the message.                  |
| `signer`      | [`Ed25519Signer`](./signers/Ed25519Signer.md) | A currently valid Signer for the fid.                        |

---

### makeVerificationAddEthAddress

Returns a message that proves that a user owns an Ethereum address.

#### Usage

```typescript
import {
  FarcasterNetwork,
  hexStringToBytes,
  makeVerificationAddEthAddress,
  makeVerificationEthAddressClaim,
} from '@farcaster/hub-nodejs';

const addressBytes = eip712Signer.signerKey;
const blockHashHex = '0x1d3b0456c920eb503450c7efdcf9b5cf1f5184bf04e5d8ecbcead188a0d02018';
const blockHashBytes = hexStringToBytes(blockHashHex)._unsafeUnwrap();

const claimResult = makeVerificationEthAddressClaim(1, addressBytes, FarcasterNetwork.DEVNET, blockHashBytes);

if (claimResult.isOk()) {
  const claim = claimResult.value;

  // Sign the claim
  const ethSignResult = await eip712Signer.signVerificationEthAddressClaim(claim);
  const ethSignature = ethSignResult._unsafeUnwrap();

  // Construct a Verification Add Message with the claim signature
  const verificationBody = {
    address: addressBytes,
    ethSignature,
    blockHash: blockHashBytes,
  };

  const verificationMessage = await makeVerificationAddEthAddress(verificationBody, dataOptions, ed25519Signer);
  console.log(verificationMessage);
}
```

#### Returns

| Type                                               | Description                                                                   |
| :------------------------------------------------- | :---------------------------------------------------------------------------- |
| `HubAsyncResult<VerificationAddEthAddressMessage>` | A `HubAsyncResult` that contains a signed `VerificationAddEthAddressMessage`. |

#### Parameters

| Name          | Type                                          | Description                                                                            |
| :------------ | :-------------------------------------------- | :------------------------------------------------------------------------------------- |
| `body`        | [`VerificationAddEthAddressBody`](#)          | An object which contains an Eip712 Signature from the Ethereum Address being verified. |
| `dataOptions` | `MessageDataOptions`                          | Optional metadata to construct the message.                                            |
| `signer`      | [`Ed25519Signer`](./signers/Ed25519Signer.md) | A currently valid Signer for the fid.                                                  |

---

### makeVerificationRemove

Returns a message that removes a previously added Verification.

#### Usage

```typescript
import { makeVerificationRemove } from '@farcaster/hub-nodejs';

const verificationRemoveBody = {
  address: '0x1234', // Ethereum Address of Verification to remove
};

const verificationRemoveMessage = await makeVerificationRemove(verificationRemoveBody, dataOptions, ed25519Signer);
```

#### Returns

| Type                                        | Description                                                            |
| :------------------------------------------ | :--------------------------------------------------------------------- |
| `HubAsyncResult<VerificationRemoveMessage>` | A `HubAsyncResult` that contains a signed `VerificationRemoveMessage`. |

#### Parameters

| Name          | Type                                                             | Description                                                          |
| :------------ | :--------------------------------------------------------------- | :------------------------------------------------------------------- |
| `body`        | [`VerificationRemoveBody`](./Messages.md#verificationremovebody) | An object which contains data about the Verification being removed . |
| `dataOptions` | `MessageDataOptions`                                             | Optional metadata to construct the message.                          |
| `signer`      | [`Ed25519Signer`](./signers/Ed25519Signer.md)                    | A currently valid Signer for the fid.                                |
