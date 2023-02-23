[hubble](../README.md) / [Modules](../modules.md) / [utils/src](../modules/utils_src.md) / Eip712Signer

# Class: Eip712Signer

[utils/src](../modules/utils_src.md).Eip712Signer

## Implements

- [`Signer`](../interfaces/utils_src.Signer.md)

## Table of contents

### Constructors

- [constructor](utils_src.Eip712Signer.md#constructor)

### Properties

- [\_typedDataSigner](utils_src.Eip712Signer.md#_typeddatasigner)
- [scheme](utils_src.Eip712Signer.md#scheme)
- [signerKey](utils_src.Eip712Signer.md#signerkey)
- [signerKeyHex](utils_src.Eip712Signer.md#signerkeyhex)

### Methods

- [signMessageHash](utils_src.Eip712Signer.md#signmessagehash)
- [signVerificationEthAddressClaim](utils_src.Eip712Signer.md#signverificationethaddressclaim)
- [fromSigner](utils_src.Eip712Signer.md#fromsigner)

## Constructors

### constructor

• **new Eip712Signer**(`typedDataSigner`, `address`, `signerKey`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `typedDataSigner` | [`TypedDataSigner`](../modules/utils_src.md#typeddatasigner) |
| `address` | `string` |
| `signerKey` | `Uint8Array` |

#### Defined in

[utils/src/signers/eip712Signer.ts:28](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/signers/eip712Signer.ts#L28)

## Properties

### \_typedDataSigner

• `Private` `Readonly` **\_typedDataSigner**: [`TypedDataSigner`](../modules/utils_src.md#typeddatasigner)

#### Defined in

[utils/src/signers/eip712Signer.ts:21](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/signers/eip712Signer.ts#L21)

___

### scheme

• `Readonly` **scheme**: [`SIGNATURE_SCHEME_EIP712`](../enums/js_src.protobufs.SignatureScheme.md#signature_scheme_eip712) = `SignatureScheme.SIGNATURE_SCHEME_EIP712`

#### Implementation of

[Signer](../interfaces/utils_src.Signer.md).[scheme](../interfaces/utils_src.Signer.md#scheme)

#### Defined in

[utils/src/signers/eip712Signer.ts:15](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/signers/eip712Signer.ts#L15)

___

### signerKey

• `Readonly` **signerKey**: `Uint8Array`

20-byte wallet address

#### Implementation of

[Signer](../interfaces/utils_src.Signer.md).[signerKey](../interfaces/utils_src.Signer.md#signerkey)

#### Defined in

[utils/src/signers/eip712Signer.ts:18](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/signers/eip712Signer.ts#L18)

___

### signerKeyHex

• `Readonly` **signerKeyHex**: `string`

#### Implementation of

[Signer](../interfaces/utils_src.Signer.md).[signerKeyHex](../interfaces/utils_src.Signer.md#signerkeyhex)

#### Defined in

[utils/src/signers/eip712Signer.ts:19](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/signers/eip712Signer.ts#L19)

## Methods

### signMessageHash

▸ **signMessageHash**(`hash`): [`HubAsyncResult`](../modules/utils_src.md#hubasyncresult)<`Uint8Array`\>

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

[`HubAsyncResult`](../modules/utils_src.md#hubasyncresult)<`Uint8Array`\>

A HubAsyncResult containing the 256-bit signature as a Uint8Array.

#### Implementation of

[Signer](../interfaces/utils_src.Signer.md).[signMessageHash](../interfaces/utils_src.Signer.md#signmessagehash)

#### Defined in

[utils/src/signers/eip712Signer.ts:63](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/signers/eip712Signer.ts#L63)

___

### signVerificationEthAddressClaim

▸ **signVerificationEthAddressClaim**(`claim`): [`HubAsyncResult`](../modules/utils_src.md#hubasyncresult)<`Uint8Array`\>

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
| `claim` | [`VerificationEthAddressClaim`](../modules/utils_src.md#verificationethaddressclaim) | The body of the claim to be signed. |

#### Returns

[`HubAsyncResult`](../modules/utils_src.md#hubasyncresult)<`Uint8Array`\>

A HubAsyncResult containing the 256-bit signature as a Uint8Array.

#### Defined in

[utils/src/signers/eip712Signer.ts:96](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/signers/eip712Signer.ts#L96)

___

### fromSigner

▸ `Static` **fromSigner**(`typedDataSigner`, `address`): [`HubResult`](../modules/utils_src.md#hubresult)<[`Eip712Signer`](utils_src.Eip712Signer.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `typedDataSigner` | [`TypedDataSigner`](../modules/utils_src.md#typeddatasigner) |
| `address` | `string` |

#### Returns

[`HubResult`](../modules/utils_src.md#hubresult)<[`Eip712Signer`](utils_src.Eip712Signer.md)\>

#### Defined in

[utils/src/signers/eip712Signer.ts:23](https://github.com/vinliao/hubble/blob/f898740/packages/utils/src/signers/eip712Signer.ts#L23)
