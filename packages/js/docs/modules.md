[@farcaster/js](README.md) / Exports

# @farcaster/js

## Table of contents

### Namespaces

- [protobufs](modules/protobufs.md)
- [types](modules/types.md)
- [utils](modules/utils.md)

### Classes

- [Client](classes/Client.md)
- [Ed25519Signer](classes/Ed25519Signer.md)
- [Eip712Signer](classes/Eip712Signer.md)

### Type Aliases

- [EventFilters](modules.md#eventfilters)

### Functions

- [makeCastAdd](modules.md#makecastadd)
- [makeCastRemove](modules.md#makecastremove)
- [makeMessageHash](modules.md#makemessagehash)
- [makeMessageWithSignature](modules.md#makemessagewithsignature)
- [makeReactionAdd](modules.md#makereactionadd)
- [makeReactionRemove](modules.md#makereactionremove)
- [makeSignerAdd](modules.md#makesigneradd)
- [makeSignerRemove](modules.md#makesignerremove)
- [makeUserDataAdd](modules.md#makeuserdataadd)
- [makeVerificationAddEthAddress](modules.md#makeverificationaddethaddress)
- [makeVerificationRemove](modules.md#makeverificationremove)

## Type Aliases

### EventFilters

Ƭ **EventFilters**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `eventTypes?` | [`HubEventType`](enums/protobufs.HubEventType.md)[] |
| `fromId?` | `number` |

## Functions

### makeCastAdd

▸ **makeCastAdd**(`bodyJson`, `dataOptions`, `signer`)

Make a message to add a cast

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<CastAddMessage>` | [`CastAddMessage`](modules/types.md#castaddmessage) | A Result that contains the valid CastAddMessage |

**`Example`**

```typescript
import {
  Client,
  Ed25519Signer,
  makeCastAdd,
  makeCastRemove,
  types,
} from '@farcaster/js';
import * as ed from '@noble/ed25519';

const rpcUrl = '<rpc-url>';
const client = new Client(rpcUrl);

const privateKeyHex = '86be7f6f8dcf18...'; // EdDSA hex private key
const privateKey = ed.utils.hexToBytes(privateKeyHex);

// _unsafeUnwrap() is used here for simplicity, but should be avoided in production
const ed25519Signer = Ed25519Signer.fromPrivateKey(privateKey)._unsafeUnwrap();

const dataOptions = {
  fid: -9999, // must be changed to fid of the custody address, or else it will fail
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
};

const cast = await makeCastAdd({ text: 'hello world' }, dataOptions, ed25519Signer);
await client.submitMessage(cast._unsafeUnwrap());
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `bodyJson` | [`CastAddBody`](modules/types.md#castaddbody) | A valid CastAdd body object containing the data to be sent. |
| `dataOptions` | `MessageDataOptions` | Optional arguments to construct the message. |
| `signer` | `Ed25519Signer` | A valid Ed25519Signer that will sign the message. |

___

### makeCastRemove

▸ **makeCastRemove**(`bodyJson`, `dataOptions`, `signer`)

Make a message to remove a cast

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<CastRemoveMessage>` | [`CastRemoveMessage`](modules/types.md#castremovemessage) | A `HubAsyncResult` that contains the valid `CastRemoveMessage`. |

**`Example`**

```typescript
import {
  Client,
  Ed25519Signer,
  makeCastAdd,
  makeCastRemove,
  types,
} from '@farcaster/js';
import * as ed from '@noble/ed25519';

const rpcUrl = '<rpc-url>';
const client = new Client(rpcUrl);

const privateKeyHex = '86be7f6f8dcf18...'; // EdDSA hex private key
const privateKey = ed.utils.hexToBytes(privateKeyHex);

// _unsafeUnwrap() is used here for simplicity, but should be avoided in production
const ed25519Signer = Ed25519Signer.fromPrivateKey(privateKey)._unsafeUnwrap();

const dataOptions = {
  fid: -9999, // must be changed to fid of the custody address, or else it will fail
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
};

const removeBody = { targetHash: '0xf88d738eb7145f4cea40fbe8f3bdf...' };
const castRemove = await makeCastRemove(removeBody, dataOptions, ed25519Signer);
await client.submitMessage(castRemove._unsafeUnwrap());
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `bodyJson` | [`CastRemoveBody`](modules/types.md#castremovebody) | A valid CastRemove body object containing the data to be sent. |
| `dataOptions` | `MessageDataOptions` | Optional arguments to construct the message. |
| `signer` | `Ed25519Signer` | A valid Ed25519Signer that will sign the message. |

___

### makeMessageHash

▸ **makeMessageHash**(`messageData`)

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageData` | [`MessageData`](modules/types.md#messagedata)<[`MessageBody`](modules/types.md#messagebody), [`MessageType`](enums/protobufs.MessageType.md)\> |

___

### makeMessageWithSignature

▸ **makeMessageWithSignature**(`messageData`, `signerOptions`, `signature`)

TODO DOCS: description

TODO DOCS: usage example, here's the structure:

**`Example`**

```typescript
import { ... } from '@farcaster/js';

const client = new Client(...)

const message = makeCastAdd(...)
await client.submitMessage(message)
```

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageData` | [`MessageData`](modules/types.md#messagedata)<[`MessageBody`](modules/types.md#messagebody), [`MessageType`](enums/protobufs.MessageType.md)\> |
| `signerOptions` | `MessageSignerOptions` |
| `signature` | `string` |

___

### makeReactionAdd

▸ **makeReactionAdd**(`bodyJson`, `dataOptions`, `signer`)

Make a message to react a cast (like or recast)

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<ReactionAddMessage>` | [`ReactionAddMessage`](modules/types.md#reactionaddmessage) | A `HubAsyncResult` that contains the valid `ReactionAddMessage`. |

**`Example`**

```typescript
import {
  Client,
  Ed25519Signer,
  makeCastAdd,
  makeCastRemove,
  types,
} from '@farcaster/js';
import * as ed from '@noble/ed25519';

const rpcUrl = '<rpc-url>';
const client = new Client(rpcUrl);

const privateKeyHex = '86be7f6f8dcf18...'; // EdDSA hex private key
const privateKey = ed.utils.hexToBytes(privateKeyHex);

// _unsafeUnwrap() is used here for simplicity, but should be avoided in production
const ed25519Signer = Ed25519Signer.fromPrivateKey(privateKey)._unsafeUnwrap();

const dataOptions = {
  fid: -9999, // must be changed to fid of the custody address, or else it will fail
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
};

// fid here is the fid of the author of the cast
const reactionLikeBody = {
  type: types.ReactionType.REACTION_TYPE_LIKE,
  target: { fid: -9998, tsHash: '0x455a6caad5dfd4d...' },
};

const like = await makeReactionAdd(reactionLikeBody, dataOptions, ed25519Signer);
await client.submitMessage(like._unsafeUnwrap());
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `bodyJson` | [`ReactionBody`](modules/types.md#reactionbody) | A valid ReactionAdd body object containing the data to be sent. |
| `dataOptions` | `MessageDataOptions` | Optional arguments to construct the message. |
| `signer` | `Ed25519Signer` | A valid Ed25519Signer that will sign the message. |

___

### makeReactionRemove

▸ **makeReactionRemove**(`bodyJson`, `dataOptions`, `signer`)

Make a message to undo a reaction to a cast (unlike or undo recast)

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<ReactionRemoveMessage>` | [`ReactionRemoveMessage`](modules/types.md#reactionremovemessage) | A `HubAsyncResult` that contains the valid `ReactionRemoveMessage`. |

**`Example`**

```typescript
import {
  Client,
  Ed25519Signer,
  makeCastAdd,
  makeCastRemove,
  types,
} from '@farcaster/js';
import * as ed from '@noble/ed25519';

const rpcUrl = '<rpc-url>';
const client = new Client(rpcUrl);

const privateKeyHex = '86be7f6f8dcf18...'; // EdDSA hex private key
const privateKey = ed.utils.hexToBytes(privateKeyHex);

// _unsafeUnwrap() is used here for simplicity, but should be avoided in production
const ed25519Signer = Ed25519Signer.fromPrivateKey(privateKey)._unsafeUnwrap();

const dataOptions = {
  fid: -9999, // must be changed to fid of the custody address, or else it will fail
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
};

// fid here is the fid of the author of the cast
const reactionLikeBody = {
  type: types.ReactionType.REACTION_TYPE_LIKE,
  target: { fid: -9998, tsHash: '0x455a6caad5dfd4d...' },
};

const unlike = await makeReactionRemove(reactionLikeBody, dataOptions, ed25519Signer);
await client.submitMessage(unlike._unsafeUnwrap());
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `bodyJson` | [`ReactionBody`](modules/types.md#reactionbody) | A valid ReactionRemove body object containing the data to be sent. |
| `dataOptions` | `MessageDataOptions` | Optional arguments to construct the message. |
| `signer` | `Ed25519Signer` | A valid Ed25519Signer that will sign the message. |

___

### makeSignerAdd

▸ **makeSignerAdd**(`bodyJson`, `dataOptions`, `signer`)

Make a message to add an EdDSA signer

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<VerificationAddEthAddressMessage>` | [`VerificationAddEthAddressMessage`](modules/types.md#verificationaddethaddressmessage) | A `HubAsyncResult` that contains the valid `VerificationAddEthAddressMessage`. |

**`Example`**

```typescript
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

const dataOptions = {
  fid: -9999, // must be changed to fid of the custody address, or else it will fail
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
};

const signerAdd = await makeSignerAdd({ signer: ed25519Signer.signerKeyHex }, dataOptions, eip712Signer);
await client.submitMessage(signerAdd._unsafeUnwrap());
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `bodyJson` | [`SignerBody`](modules/types.md#signerbody) | A valid VerificationAddEd25519 body object containing the data to be sent. |
| `dataOptions` | `MessageDataOptions` | Optional arguments to construct the message. |
| `signer` | `Eip712Signer` | A valid Eip712Signer that will sign the message. |

___

### makeSignerRemove

▸ **makeSignerRemove**(`bodyJson`, `dataOptions`, `signer`)

Make a message to remove an EdDSA signer

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<SignerRemoveMessage>` | [`SignerRemoveMessage`](modules/types.md#signerremovemessage) | A `HubAsyncResult` that contains the valid `SignerRemoveMessage`. |

**`Example`**

```typescript
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

const dataOptions = {
  fid: -9999, // must be changed to fid of the custody address, or else it will fail
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
};

const signerRemove = await makeSignerRemove({ signer: ed25519Signer.signerKeyHex }, dataOptions, eip712Signer);
await client.submitMessage(signerRemove._unsafeUnwrap());
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `bodyJson` | [`SignerBody`](modules/types.md#signerbody) | A valid SignerRemove body object containing the data to be sent. |
| `dataOptions` | `MessageDataOptions` | Optional arguments to construct the message. |
| `signer` | `Eip712Signer` | A valid Eip712Signer that will sign the message. |

___

### makeUserDataAdd

▸ **makeUserDataAdd**(`bodyJson`, `dataOptions`, `signer`)

Make a message to set user data (pfp, bio, display name, etc)

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<UserDataAddMessage>` | [`UserDataAddMessage`](modules/types.md#userdataaddmessage) | A `HubAsyncResult` that contains the valid `UserDataMessage`. |

**`Example`**

```typescript
import {
  Client,
  Ed25519Signer,
  makeCastAdd,
  makeCastRemove,
  types,
} from '@farcaster/js';
import * as ed from '@noble/ed25519';

const rpcUrl = '<rpc-url>';
const client = new Client(rpcUrl);

const privateKeyHex = '86be7f6f8dcf18...'; // EdDSA hex private key
const privateKey = ed.utils.hexToBytes(privateKeyHex);

// _unsafeUnwrap() is used here for simplicity, but should be avoided in production
const ed25519Signer = Ed25519Signer.fromPrivateKey(privateKey)._unsafeUnwrap();

const dataOptions = {
  fid: -9999, // must be changed to fid of the custody address, or else it will fail
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
};

const userDataPfpBody = {
  type: types.UserDataType.USER_DATA_TYPE_PFP,
  value: 'https://i.imgur.com/yed5Zfk.gif',
};
const userDataPfpAdd = await makeUserDataAdd(userDataPfpBody, dataOptions, ed25519Signer);
await client.submitMessage(userDataPfpAdd._unsafeUnwrap());
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `bodyJson` | [`UserDataBody`](modules/types.md#userdatabody) | A valid UserData body object containing the data to be sent. |
| `dataOptions` | `MessageDataOptions` | Optional arguments to construct the message. |
| `signer` | `Ed25519Signer` | A valid Eip712Signer that will sign the message. |

___

### makeVerificationAddEthAddress

▸ **makeVerificationAddEthAddress**(`bodyJson`, `dataOptions`, `signer`)

TODO DOCS

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<VerificationAddEthAddressMessage>` | [`VerificationAddEthAddressMessage`](modules/types.md#verificationaddethaddressmessage) | A `HubAsyncResult` that contains the valid `VerificationAddEthAddressMessage`. |

**`Example`**

```typescript
 import {
  Client,
  Ed25519Signer,
  Eip712Signer,
  makeVerificationAddEthAddress,
  types,
} from "@farcaster/js";
import { ethers } from "ethers";
import * as ed from "@noble/ed25519";

const rpcUrl = "<rpc-url>";
const client = new Client(rpcUrl);

const privateKey = ed.utils.randomPrivateKey();
const privateKeyHex = ed.utils.bytesToHex(privateKey);
console.log(privateKeyHex); // 86be7f6f8dcf18...
// developers should safely store this EdDSA private key on behalf of users

// _unsafeUnwrap() is used here for simplicity, but should be avoided in production
const ed25519Signer = Ed25519Signer.fromPrivateKey(privateKey)._unsafeUnwrap();

const mnemonic = "your mnemonic apple orange banana ...";
const wallet = ethers.Wallet.fromMnemonic(mnemonic);

// _unsafeUnwrap() is used here for simplicity, but should be avoided in production
const eip712Signer = Eip712Signer.fromSigner(
  wallet,
  wallet.address
)._unsafeUnwrap();

const dataOptions = {
  fid: -9999, // must be changed to fid of the custody address, or else it will fail
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
};

const claimBody = {
  fid: -1,
  address: eip712Signer.signerKeyHex,
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
  blockHash: "2c87468704d6b0f4c46f480dc54251de...",
};
const ethSig = await eip712Signer.signVerificationEthAddressClaimHex(claimBody);

const verificationBody = {
  address: eip712Signer.signerKeyHex,
  signature: ethSig._unsafeUnwrap(),
  blockHash: "2c87468704d6b0f4c46f480dc54251de...",
};

const verificationMessage = await makeVerificationAddEthAddress(
  verificationBody,
  dataOptions,
  ed25519Signer
);
await client.submitMessage(verificationMessage._unsafeUnwrap());
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `bodyJson` | [`VerificationAddEthAddressBody`](modules/types.md#verificationaddethaddressbody) | A valid VerificationAdd body object containing the data to be sent. |
| `dataOptions` | `MessageDataOptions` | Optional arguments to construct the message. |
| `signer` | `Ed25519Signer` | A valid Ed25519Signer that will sign the message. |

___

### makeVerificationRemove

▸ **makeVerificationRemove**(`bodyJson`, `dataOptions`, `signer`)

TODO DOCS: description

#### Returns

| Value | Type | Description |
| :---- | :--- | :---------- |
| `HubAsyncResult<VerificationRemoveMessage>` | [`VerificationRemoveMessage`](modules/types.md#verificationremovemessage) | A `HubAsyncResult` that contains the valid `VerificationRemoveMessage`. |

**`Example`**

```typescript
import {
  Client,
  Ed25519Signer,
  Eip712Signer,
  makeVerificationRemove,
  types,
} from "@farcaster/js";
import { ethers } from "ethers";
import * as ed from "@noble/ed25519";

const rpcUrl = "<rpc-url>";
const client = new Client(rpcUrl);

const privateKey = ed.utils.randomPrivateKey();
const privateKeyHex = ed.utils.bytesToHex(privateKey);
console.log(privateKeyHex); // 86be7f6f8dcf18...
// developers should safely store this EdDSA private key on behalf of users

// _unsafeUnwrap() is used here for simplicity, but should be avoided in production
const ed25519Signer = Ed25519Signer.fromPrivateKey(privateKey)._unsafeUnwrap();

const mnemonic = "your mnemonic apple orange banana ...";
const wallet = ethers.Wallet.fromMnemonic(mnemonic);

// _unsafeUnwrap() is used here for simplicity, but should be avoided in production
const eip712Signer = Eip712Signer.fromSigner(
  wallet,
  wallet.address
)._unsafeUnwrap();

const dataOptions = {
  fid: -9999, // must be changed to fid of the custody address, or else it will fail
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
};

const verificationRemoveBody = {
  address: eip712Signer.signerKeyHex,
};

const verificationRemoveMessage = await makeVerificationRemove(
  verificationRemoveBody,
  dataOptions,
  ed25519Signer
);

await client.submitMessage(verificationRemoveMessage._unsafeUnwrap());
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `bodyJson` | [`VerificationRemoveBody`](modules/types.md#verificationremovebody) | A valid VerificationRemove body object containing the data to be sent. |
| `dataOptions` | `MessageDataOptions` | Optional arguments to construct the message. |
| `signer` | `Ed25519Signer` | A valid Ed25519Signer that will sign the message. |
