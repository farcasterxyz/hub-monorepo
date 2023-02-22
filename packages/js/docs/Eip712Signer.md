# @farcaster/js/EIP712Signer

A Typescript class for signing messages with EIP712.

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
