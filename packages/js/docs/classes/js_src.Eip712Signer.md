[hubble](../README.md) / [Modules](../modules.md) / [js/src](../modules/js_src.md) / Eip712Signer

# Class: Eip712Signer

[js/src](../modules/js_src.md).Eip712Signer

## Hierarchy

- `Eip712Signer`

  ↳ **`Eip712Signer`**

## Table of contents

### Constructors

- [constructor](js_src.Eip712Signer.md#constructor)

### Properties

- [scheme](js_src.Eip712Signer.md#scheme)
- [signerKey](js_src.Eip712Signer.md#signerkey)
- [signerKeyHex](js_src.Eip712Signer.md#signerkeyhex)

### Methods

- [signMessageHash](js_src.Eip712Signer.md#signmessagehash)
- [signMessageHashHex](js_src.Eip712Signer.md#signmessagehashhex)
- [signVerificationEthAddressClaim](js_src.Eip712Signer.md#signverificationethaddressclaim)
- [signVerificationEthAddressClaimHex](js_src.Eip712Signer.md#signverificationethaddressclaimhex)
- [fromSigner](js_src.Eip712Signer.md#fromsigner)

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

#### Defined in

utils/dist/index.d.ts:179

## Properties

### scheme

• `Readonly` **scheme**: [`SIGNATURE_SCHEME_EIP712`](../enums/js_src.protobufs.SignatureScheme.md#signature_scheme_eip712) = `SignatureScheme.SIGNATURE_SCHEME_EIP712`

#### Inherited from

BaseEip712Signer.scheme

#### Defined in

utils/dist/index.d.ts:173

___

### signerKey

• `Readonly` **signerKey**: `Uint8Array`

20-byte wallet address

#### Inherited from

BaseEip712Signer.signerKey

#### Defined in

utils/dist/index.d.ts:175

___

### signerKeyHex

• `Readonly` **signerKeyHex**: `string`

#### Inherited from

BaseEip712Signer.signerKeyHex

#### Defined in

utils/dist/index.d.ts:176

## Methods

### signMessageHash

▸ **signMessageHash**(`hash`): `HubAsyncResult`<`Uint8Array`\>

Generates a 256-bit signature from an Ethereum address.

**`Function`**

**`Name`**

eip712Signer.signMessageHash

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

#### Returns

`HubAsyncResult`<`Uint8Array`\>

A HubAsyncResult containing the 256-bit signature as a Uint8Array.

#### Inherited from

BaseEip712Signer.signMessageHash

#### Defined in

utils/dist/index.d.ts:209

___

### signMessageHashHex

▸ **signMessageHashHex**(`hash`): `HubAsyncResult`<`string`\>

Generates a 256-bit hex signature from an Ethereum address.

**`Function`**

**`Name`**

eip712Signer.signMessageHashHex

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

#### Returns

`HubAsyncResult`<`string`\>

A HubAsyncResult containing the 256-bit signature as a hex string.

#### Defined in

[js/src/signers.ts:69](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/signers.ts#L69)

___

### signVerificationEthAddressClaim

▸ **signVerificationEthAddressClaim**(`claim`): `HubAsyncResult`<`Uint8Array`\>

Signs a verification claim for an Ethereum address.

**`Function`**

**`Name`**

Eip712Signer#signVerificationEthAddressClaim

**`Example`**

```
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
| `claim` | [`VerificationEthAddressClaim`](../modules/js_src.types.md#verificationethaddressclaim) | The body of the claim to be signed. |

#### Returns

`HubAsyncResult`<`Uint8Array`\>

A HubAsyncResult containing the 256-bit signature as a Uint8Array.

#### Inherited from

BaseEip712Signer.signVerificationEthAddressClaim

#### Defined in

utils/dist/index.d.ts:238

___

### signVerificationEthAddressClaimHex

▸ **signVerificationEthAddressClaimHex**(`claim`): `HubAsyncResult`<`string`\>

TODO descriptionmessageHash

**`Function`**

**`Name`**

eip712Signer.signVerificationEthAddressClaim

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

const verificationResult = await eip712Signer.signVerificationEthAddressClaim(claimBody);
console.log(verificationResult._unsafeUnwrap());

// Output: Uint8Array(65) [ 166, 32, 71, 26, 36, 205, ... ]
```

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `claim` | [`VerificationEthAddressClaim`](../modules/js_src.types.md#verificationethaddressclaim) | The body of the claim to be signed as an object |

#### Returns

`HubAsyncResult`<`string`\>

A HubAsyncResult containing the 256-bit signature as a Uint8Array.

#### Defined in

[js/src/signers.ts:115](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/signers.ts#L115)

___

### fromSigner

▸ `Static` **fromSigner**(`typedDataSigner`, `address`): `HubResult`<[`Eip712Signer`](js_src.Eip712Signer.md)\>

Creates an instance of Eip712Signer from a TypedDataSigner and an Ethereum address.

**`Static`**

**`Function`**

**`Name`**

Eip712Signer.fromSigner

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

#### Returns

`HubResult`<[`Eip712Signer`](js_src.Eip712Signer.md)\>

A HubResult that resolves to an Eip712Signer instance on success, or
a failure with an error message on error.

#### Overrides

BaseEip712Signer.fromSigner

#### Defined in

[js/src/signers.ts:37](https://github.com/vinliao/hubble/blob/f898740/packages/js/src/signers.ts#L37)
