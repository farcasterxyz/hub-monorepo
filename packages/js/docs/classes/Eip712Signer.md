[@farcaster/js](../README.md) / [Exports](../modules.md) / Eip712Signer

# Class: Eip712Signer

## Hierarchy

- `Eip712Signer`

  ↳ **`Eip712Signer`**

## Table of contents

### Constructors

- [constructor](Eip712Signer.md#constructor)

### Properties

- [scheme](Eip712Signer.md#scheme)
- [signerKey](Eip712Signer.md#signerkey)
- [signerKeyHex](Eip712Signer.md#signerkeyhex)

### Methods

- [signMessageHash](Eip712Signer.md#signmessagehash)
- [signMessageHashHex](Eip712Signer.md#signmessagehashhex)
- [signVerificationEthAddressClaim](Eip712Signer.md#signverificationethaddressclaim)
- [signVerificationEthAddressClaimHex](Eip712Signer.md#signverificationethaddressclaimhex)
- [fromSigner](Eip712Signer.md#fromsigner)

## Constructors

### constructor

• **new Eip712Signer**(`typedDataSigner`, `address`, `signerKey`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `typedDataSigner` | `TypedDataSigner` |
| `address` | `string` |
| `signerKey` | `Uint8Array` |

#### Inherited from

BaseEip712Signer.constructor

## Properties

### scheme

• `Readonly` **scheme**: [`SIGNATURE_SCHEME_EIP712`](../enums/protobufs.SignatureScheme.md#signature_scheme_eip712) = `SignatureScheme.SIGNATURE_SCHEME_EIP712`

Signature scheme as defined in protobufs

#### Inherited from

BaseEip712Signer.scheme

___

### signerKey

• `Readonly` **signerKey**: `Uint8Array`

20-byte wallet address

#### Inherited from

BaseEip712Signer.signerKey

___

### signerKeyHex

• `Readonly` **signerKeyHex**: `string`

20-byte wallet in hex format

#### Inherited from

BaseEip712Signer.signerKeyHex

## Methods

### signMessageHash

▸ **signMessageHash**(`hash`)

Generates a 256-bit signature from an Ethereum address.

**`Example`**

```typescript
import { Eip712Signer } from '@farcaster/js';
import { ethers } from 'ethers';
import { randomBytes } from 'ethers/lib/utils';
import { blake3 } from '@noble/hashes/blake3';

const custodyWallet = ethers.Wallet.fromMnemonic('your mnemonic here apple orange banana');
const eip712Signer = Eip712Signer.fromSigner(custodyWallet, custodyWallet.address)._unsafeUnwrap();

const bytes = randomBytes(32);
const hash = blake3(bytes, { dkLen: 20 });
const signature = await signer.signMessageHash(hash);

console.log(signature._unsafeUnwrap());

// Output: Uint8Array(65) [ 166, 32, 71, 26, 36, 205, ... ]
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `hash` | `Uint8Array` | The 256-bit hash of the message to be signed. |

#### Inherited from

BaseEip712Signer.signMessageHash

___

### signMessageHashHex

▸ **signMessageHashHex**(`hash`)

Generates a 256-bit hex signature from an Ethereum address.

**`Example`**

```typescript
import { Eip712Signer, types } from '@farcaster/js';
import { ethers, utils } from 'ethers';

const custodyWallet = ethers.Wallet.fromMnemonic('your mnemonic here apple orange banana');
const eip712Signer = Eip712Signer.fromSigner(custodyWallet, custodyWallet.address)._unsafeUnwrap();

const message = 'Hello World';
const messageHash = ethers.utils.keccak256(utils.toUtf8Bytes(message));
const messageHashResultHex = await eip712Signer.signMessageHashHex(messageHash);

console.log(messageHashResultHex._unsafeUnwrap());

// Output: "0xa620471a24cd101b99b7f69efcd9fe2437715924b..."
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `hash` | `string` | The 256-bit hash of the message to be signed. |

___

### signVerificationEthAddressClaim

▸ **signVerificationEthAddressClaim**(`claim`)

Signs a verification claim for an Ethereum address.

**`Example`**

```typescript
const claimBody = {
  fid: -1,
  address: eip712Signer.signerKeyHex,
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
  blockHash: '2c87468704d6b0f4c46f480dc54251de50753af02e5d63702f85bde3da4f7a3d',
};
const verificationResult = await eip712Signer.signVerificationEthAddressClaim(claimBody);
console.log(verificationResult._unsafeUnwrap());

// Will output: Uint8Array(65) [ 166, 32, 71, 26, 36, 205, ... ]
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `claim` | [`VerificationEthAddressClaim`](../modules/types.md#verificationethaddressclaim) | The body of the claim to be signed. |

#### Inherited from

BaseEip712Signer.signVerificationEthAddressClaim

___

### signVerificationEthAddressClaimHex

▸ **signVerificationEthAddressClaimHex**(`claim`)

Signs an Ethereum address verification claim, returns hex.

**`Example`**

```typescript
import { Eip712Signer, types } from '@farcaster/js';
import { ethers, utils } from 'ethers';

const custodyWallet = ethers.Wallet.fromMnemonic('your mnemonic here apple orange banana');
const eip712Signer = Eip712Signer.fromSigner(custodyWallet, custodyWallet.address)._unsafeUnwrap();

const claimBody = {
  fid: -1,
  address: eip712Signer.signerKeyHex,
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
  blockHash: '2c87468704d6b0f4c46f480dc54251de50753af02e5d63702f85bde3da4f7a3d',
};

const verificationResult = await eip712Signer.signVerificationEthAddressClaimHex(claimBody);
console.log(verificationResult._unsafeUnwrap());

// Output: "0xa620471a24cd101b99b7f69efcd9fe2437715924b..."
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `claim` | [`VerificationEthAddressClaim`](../modules/types.md#verificationethaddressclaim) | The body of the claim to be signed as an object |

___

### fromSigner

▸ `Static` **fromSigner**(`typedDataSigner`, `address`)

Creates an instance of Eip712Signer from a TypedDataSigner and an Ethereum address.

**`Example`**

```typescript
import { Eip712Signer } from '@farcaster/js';
import { ethers } from 'ethers';

const custodyWallet = ethers.Wallet.fromMnemonic('your mnemonic here apple orange banana');
const eip712Signer = Eip712Signer.fromSigner(custodyWallet, custodyWallet.address)._unsafeUnwrap();
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `typedDataSigner` | `TypedDataSigner` | The TypedDataSigner instance to use for signing. |
| `address` | `string` | The Ethereum address associated with the signer. |

#### Overrides

BaseEip712Signer.fromSigner
