# EthersV5Eip712Signer

An Eip712Signer that is initialized with an [Ethers v5](https://github.com/ethers-io/ethers.js/tree/v5) Ethereum wallet and can be used with [Builders](../builders/builders.md) to sign Farcaster Messages.

## Properties

| Name     | Type         | Description                                 |
| :------- | :----------- | :------------------------------------------ |
| `scheme` | `Uint8Array` | Signature scheme used when signing messages |

## Constructors

### `static` new EthersV5Eip712Signer

### Usage

```typescript
import { EthersV5Eip712Signer } from '@farcaster/hub-nodejs';
import { Wallet } from 'ethers'; // ethers v5

const mnemonic = 'ordinary long coach bounce thank quit become youth belt pretty diet caught attract melt bargain';
const wallet = Wallet.fromPhrase(mnemonic);
const eip712Signer = new EthersV5Eip712Signer(wallet);
```

#### Parameters

| Name     | Type     | Description       |
| :------- | :------- | ----------------- |
| `signer` | `Signer` | A wallet instance |

---

## Instance Methods

### getSignerKey

Returns the 160-bit address in bytes.

#### Usage

```typescript
const ethereumAddressResult = await eip712Signer.getSignerKey();
if (ethereumAddressResult.isOk()) {
  console.log(ethereumAddressResult.value);
}
```

#### Returns

| Value                        | Description                                                      |
| :--------------------------- | :--------------------------------------------------------------- |
| `HubAsyncResult<Uint8Array>` | A HubAsyncResult containing the 160-bit address as a Uint8Array. |

### signMessageHash

Generates a 256-bit signature for a string input and returns the bytes.

#### Usage

```typescript
import { blake3 } from '@noble/hashes/blake3';
import { randomBytes } from 'ethers';

const bytes = randomBytes(32);
const hash = blake3(bytes, { dkLen: 20 });
const signatureResult = await eip712Signer.signMessageHash(hash);
if (signatureResult.isOk()) {
  console.log(signatureResult.value);
}
```

#### Returns

| Value                        | Description                            |
| :--------------------------- | :------------------------------------- |
| `HubAsyncResult<Uint8Array>` | The 256-bit signature as a Uint8Array. |

#### Parameters

| Name   | Type         | Description                                   |
| :----- | :----------- | :-------------------------------------------- |
| `hash` | `Uint8Array` | The 256-bit hash of the message to be signed. |

---

### signVerificationEthAddressClaim

Generates a 256-bit signature for a VerificationClaim and returns the bytes.

#### Usage

```typescript
import { FarcasterNetwork, hexStringToBytes, makeVerificationEthAddressClaim } from '@farcaster/hub-nodejs';

const blockHashHex = '0x1d3b0456c920eb503450c7efdcf9b5cf1f5184bf04e5d8ecbcead188a0d02018';
const blockHashBytes = hexStringToBytes(blockHashHex)._unsafeUnwrap(); // Safety: blockHashHex is known and can't erro

const ethereumAddressResult = await eip712Signer.getSignerKey();

if (ethereumAddressResult.isOk()) {
  const claimResult = makeVerificationEthAddressClaim(
    1,
    ethereumAddressResult.value,
    FarcasterNetwork.DEVNET,
    blockHashBytes
  );

  if (claimResult.isOk()) {
    const verificationResult = await eip712Signer.signVerificationEthAddressClaim(claimResult.value);
    if (verificationResult.isOk()) {
      console.log(verificationResult.value);
    }
  }
}
```

#### Returns

| Value                        | Description                            |
| :--------------------------- | :------------------------------------- |
| `HubAsyncResult<Uint8Array>` | The 256-bit signature as a Uint8Array. |

#### Parameters

| Name    | Type                                                                             | Description                         |
| :------ | :------------------------------------------------------------------------------- | :---------------------------------- |
| `claim` | [`VerificationEthAddressClaim`](../modules/types.md#verificationethaddressclaim) | The body of the claim to be signed. |

---
