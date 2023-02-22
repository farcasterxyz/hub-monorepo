# @farcaster/js/EIP712Signer

A Typescript class for signing messages with EIP712.

```ts
import { Eip712Signer, types } from '@farcaster/js';
import { ethers, utils } from 'ethers';

const custodyWallet = ethers.Wallet.fromMnemonic('your mnemonic here apple orange banana');
const eip712Signer = Eip712Signer.fromSigner(custodyWallet, custodyWallet.address)._unsafeUnwrap();

/**
 * Eip712Signer properties:
 *
 * - scheme: the scheme used to sign the message, as defined in protobufs
 * - signerKey: the 20-byte Ethereum address of the signer
 * - signerKeyHex: the 20-byte Ethereum address of the signer, as a hex string
 */
console.log(eip712Signer.scheme); // 2
console.log(eip712Signer.signerKey); // Uint8Array(20) [134, 221, 126, ...]
console.log(eip712Signer.signerKeyHex); // 0x86dd7e4af49829b895d24ea2ab581c7c32e87332

/* -------------------------------------------------------------------------- */
/*                         eip712Signer.signMessageHash()                     */
/* -------------------------------------------------------------------------- */
/**
 *
 * Generates a 256-bit signature from an Ethereum address
 *
 * @param messageHashBytes - The 256-bit hash of the message to be signed.
 * @returns A HubAsyncResult containing the 256-bit signature as a Uint8Array.
 */
const message = 'Hello World';
const messageHash = ethers.utils.keccak256(utils.toUtf8Bytes(message));
const messageHashBytes = ethers.utils.arrayify(messageHash);
const messageHashResult = await eip712Signer.signMessageHash(messageHashBytes);

console.log(messageHashResult._unsafeUnwrap());
/**
 * Will output:
 *
 * value: Uint8Array(65) [
 *   166, 32, 71, 26, 36, 205, ...
 * ]
 */

/* -------------------------------------------------------------------------- */
/*                    eip712Signer.signMessageHashHex()                       */
/* -------------------------------------------------------------------------- */
/**
 * Generates a 256-bit hex signature from an Ethereum address
 *
 * @param messageHash - The 256-bit hash of the message to be signed.
 * @returns A HubAsyncResult containing the 256-bit signature as a hex string.
 */
const message = 'Hello World';
const messageHash = ethers.utils.keccak256(utils.toUtf8Bytes(message));
const messageHashResultHex = await eip712Signer.signMessageHashHex(messageHash);

console.log(messageHashResultHex._unsafeUnwrap());
/**
 * Will output:
 *
 * 0xa620471a24cd101b99b7f69efcd9fe2437715924b...
 */

/* -------------------------------------------------------------------------- */
/*              eip712Signer.signVerificationEthAddressClaim()                */
/* -------------------------------------------------------------------------- */
/**
 * TODO description
 *
 * @param claim - The body of the claim to be signed as an object
 * interface claim {
 *     fid: number,
 *     address: string,
 *     network: types.FarcasterNetwork,
 *     blockHash: string,
 *   }
 *
 * @returns A HubAsyncResult containing the 256-bit signature as a Uint8Array.
 */
const claimBody = {
  fid: -1,
  address: eip712Signer.signerKeyHex,
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
  blockHash: '2c87468704d6b0f4c46f480dc54251de50753af02e5d63702f85bde3da4f7a3d',
};
const verificationResult = await eip712Signer.signVerificationEthAddressClaim(claimBody);
console.log(verificationResult._unsafeUnwrap());
/**
 * Will output:
 *
 * Uint8Array(65) [ 166, 32, 71, 26, 36, 205, ... ]
 */

/* -------------------------------------------------------------------------- */
/*               eip712Signer.signVerificationEthAddressClaimHex()            */
/* -------------------------------------------------------------------------- */
/**
 * TODO description
 *
 * @param claim - The body of the claim to be signed as an object
 * interface claim {
 *     fid: number,
 *     address: string,
 *     network: types.FarcasterNetwork,
 *     blockHash: string,
 *   }
 *
 * @returns A HubAsyncResult containing the 256-bit signature as a hex string.
 */
const claimBody = {
  fid: -1,
  address: eip712Signer.signerKeyHex,
  network: types.FarcasterNetwork.FARCASTER_NETWORK_DEVNET,
  blockHash: '2c87468704d6b0f4c46f480dc54251de50753af02e5d63702f85bde3da4f7a3d',
};
const verificationResultHex = await eip712Signer.signVerificationEthAddressClaimHex(claimBody);
console.log(verificationResultHex._unsafeUnwrap());
/**
 * Will output:
 *
 * 0xa620471a24cd101b99b7f69efcd9fe2437715924b...
 */
```

**`Example`**

```ts
import { Eip712Signer } from '@farcaster/js';
import { ethers } from 'ethers';

const custodyWallet = ethers.Wallet.fromMnemonic('<custody address mnemonic>');
const eip712Signer = Eip712Signer.fromSigner(custodyWallet, custodyWallet.address)._unsafeUnwrap();

console.
```

## Constructors

| Constructor  | Description                                       | Docs                                  |
| ------------ | ------------------------------------------------- | ------------------------------------- |
| EIP712Signer | Creates a new instance of the EIP712Signer class. | [docs](./Eip712Signer.md#constructor) |

## Properties

| Property     | Description                         | Docs                                               |
| ------------ | ----------------------------------- | -------------------------------------------------- |
| scheme       | Gets the scheme used by the signer. | [docs](./Eip712Signer.md#eip712signerscheme)       |
| signerKey    | TODO.                               | [docs](./Eip712Signer.md#eip712signersignerkey)    |
| signerKeyHex | TODO.                               | [docs](./Eip712Signer.md#eip712signersignerkeyhex) |

## Methods

| Method                             | Description                                                                                                                   | Docs                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| signMessageHash                    | Signs a message hash with the signer's private key using the EIP-712 message format.                                          | [docs](./Eip712Signer.md#signmessagehash)                    |
| signMessageHashHex                 | Signs a message hash with the signer's private key, returning the signature as a hex string using the EIP-712 message format. | [docs](./Eip712Signer.md#signmessagehashhex)                 |
| signVerificationEthAddressClaim    | Signs an EthAddressClaim using the signer's private key.                                                                      | [docs](./Eip712Signer.md#signverificationethaddressclaim)    |
| signVerificationEthAddressClaimHex | Signs an EthAddressClaim using the signer's private key, returning the signature as a hex string.                             | [docs](./Eip712Signer.md#signverificationethaddressclaimhex) |

**`Example`**

```ts
import { Eip712Signer } from '@farcaster/js';
import { ethers } from 'ethers';

const custodyWallet = ethers.Wallet.fromMnemonic('<custody address mnemonic>');
const eip712Signer = Eip712Signer.fromSigner(custodyWallet, custodyWallet.address)._unsafeUnwrap();

// TODO: add example of making a signing key and using it to sign a message
// maybe have Ed25519Signer stuffs in the example here?
```

## `EIP712Signer`

### `new EIP712Signer(privateKey, signerKey, signerKeyHex)`

Creates a new instance of the EIP712Signer class.

**Parameters**

| Name           | Type         | Description           |
| :------------- | :----------- | :-------------------- |
| `privateKey`   | `Uint8Array` | The ECDSA private key |
| `signerKey`    | `Uint8Array` | TODO                  |
| `signerKeyHex` | `string`     | TODO                  |

## Properties

### `EIP712Signer.scheme`

Gets the scheme used by the signer.

**Returns**

// TODO: fact-check the description of this

| Name                                      | Value | Description                                  |
| :---------------------------------------- | :---- | :------------------------------------------- |
| `SignatureScheme.SIGNATURE_SCHEME_EIP712` | 2     | The signature scheme as defined in protobufs |

### `EIP712Signer.signerKey`

TODO explanation.

**Returns**

| Name        | Type             | Description |
| :---------- | :--------------- | :---------- |
| `signerKey` | `Uint8Array(32)` | TODO        |

### `EIP712Signer.signerKeyHex`

TODO explanation.

**Returns**

| Name           | Type    | Description |
| :------------- | :------ | :---------- |
| `signerKeyHex` | `string | TODO        |

## Methods

### `EIP712Signer.signMessageHash()`

Signs a message hash with the signer's private key using the EIP-712 message format.

**Parameters**

| Name   | Type         | Description               |
| :----- | :----------- | :------------------------ |
| `hash` | `Uint8Array` | The hash to sign in bytes |

### `EIP712Signer.signMessageHashHex()`

Signs a message hash with the signer's private key, returning the signature as a hex string using the EIP-712 message format.

**Parameters**

| Name   | Type     | Description      |
| :----- | :------- | :--------------- |
| `hash` | `string` | The hash to sign |

### `EIP712Signer.signVerificationEthAddressClaim()`

TODO explanation

**Parameters**

| Name    | Type                          | Description    |
| :------ | :---------------------------- | :------------- |
| `claim` | `VerificationEthAddressClaim` | The claim type |

Where the `VerificationEthAddressClaim` type is defined as:

```ts
type VerificationEthAddressClaim = {
  fid: BigNumber;
  address: string;
  network: FarcasterNetwork;
  blockHash: string;
};
```

### `EIP712Signer.signVerificationEthAddressClaimHex`

TODO explanation

**Parameters**

| Name    | Type                          | Description |
| :------ | :---------------------------- | :---------- |
| `claim` | `VerificationEthAddressClaim` | The claim   |

Where the `VerificationEthAddressClaim` type is defined as:

```ts
type VerificationEthAddressClaim = {
  fid: BigNumber;
  address: string;
  network: FarcasterNetwork;
  blockHash: string;
};
```

### `Eip712Signer.fromSigner()`

Instantiate a new EIP712Signer from an ECDSA private key (Ethereum)

**Parameters**

| Name              | Type              | Description                 |
| :---------------- | :---------------- | :-------------------------- |
| `typedDataSigner` | `TypedDataSigner` | an `ethers.Wallet` instance |
| `address`         | `string`          | address of wallet           |
