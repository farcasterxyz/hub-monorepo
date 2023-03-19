# EthersEip712Signer

An Eip712Signer that is initialized with an [ethers](https://github.com/ethers-io/ethers.js/) Ethereum wallet and can be used with [Builders](../builders/builders.md) to sign Farcaster Messages.

## Properties

| Name     | Type         | Description                                 |
| :------- | :----------- | :------------------------------------------ |
| `scheme` | `Uint8Array` | Signature scheme used when signing messages |

## Constructors

### `static` new EthersEip712Signer

### Usage

```typescript
import { EthersEip712Signer } from '@farcaster/hub-nodejs';
import { Wallet } from 'ethers';

const custodyWallet = Wallet.fromPhrase('your mnemonic here apple orange banana');
const eip712Signer = new EthersEip712Signer(custodyWallet);
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
const signerKey = await eip712Signer.getSignerKey();
```

#### Returns

| Value                        | Description                                                      |
| :--------------------------- | :--------------------------------------------------------------- |
| `HubAsyncResult<Uint8Array>` | A HubAsyncResult containing the 160-bit address as a Uint8Array. |

### signMessageHash

Generates a 256-bit signature for a string input and returns the bytes.

#### Usage

```typescript
import { randomBytes } from 'ethers';
import { blake3 } from '@noble/hashes/blake3';

const bytes = randomBytes(32);
const hash = blake3(bytes, { dkLen: 20 });
const signature = await eip712Signer.signMessageHash(hash);
```

#### Returns

| Value                        | Description                                                        |
| :--------------------------- | :----------------------------------------------------------------- |
| `HubAsyncResult<Uint8Array>` | A HubAsyncResult containing the 256-bit signature as a Uint8Array. |

#### Parameters

| Name   | Type         | Description                                   |
| :----- | :----------- | :-------------------------------------------- |
| `hash` | `Uint8Array` | The 256-bit hash of the message to be signed. |

---

### signMessageHashHex

Generates a 256-bit signature for a string input and returns the hex string value.

#### Usage

```typescript
import { ethers, utils } from 'ethers';

const message = 'Hello World';
const messageHash = ethers.utils.keccak256(utils.toUtf8Bytes(message));
const messageHashResultHex = await eip712Signer.signMessageHashHex(messageHash);
```

#### Returns

| Value                    | Description                                                        |
| :----------------------- | :----------------------------------------------------------------- |
| `HubAsyncResult<string>` | A HubAsyncResult containing the 256-bit signature as a hex string. |

#### Parameters

| Name   | Type     | Description                                   |
| :----- | :------- | :-------------------------------------------- |
| `hash` | `string` | The 256-bit hash of the message to be signed. |

---

### signVerificationEthAddressClaim

Generates a 256-bit signature for a VerificationClaim and returns the bytes.

#### Usage

```typescript
const claimBody = {
  fid: -1,
  address: eip712Signer.signerKeyHex,
  network: types.FarcasterNetwork.DEVNET,
  blockHash: '2c87468704d6b0f4c46f480dc54251de50753af02e5d63702f85bde3da4f7a3d',
};
const verificationResult = await eip712Signer.signVerificationEthAddressClaim(claimBody);
```

#### Returns

| Value                        | Description                                                        |
| :--------------------------- | :----------------------------------------------------------------- |
| `HubAsyncResult<Uint8Array>` | A HubAsyncResult containing the 256-bit signature as a Uint8Array. |

#### Parameters

| Name    | Type                                                                             | Description                         |
| :------ | :------------------------------------------------------------------------------- | :---------------------------------- |
| `claim` | [`VerificationEthAddressClaim`](../modules/types.md#verificationethaddressclaim) | The body of the claim to be signed. |

---

### signVerificationEthAddressClaimHex

Generates a 256-bit signature for a VerificationClaim and returns the hex string value.

#### Usage

```typescript
import { types } from '@farcaster/hub-nodejs';

const claimBody = {
  fid: -1,
  address: eip712Signer.signerKeyHex,
  network: types.FarcasterNetwork.DEVNET,
  blockHash: '2c87468704d6b0f4c46f480dc54251de50753af02e5d63702f85bde3da4f7a3d',
};

const verificationResult = await eip712Signer.signVerificationEthAddressClaimHex(claimBody);
```

#### Returns

| Value                    | Description                                                        |
| :----------------------- | :----------------------------------------------------------------- |
| `HubAsyncResult<string>` | A HubAsyncResult containing the 256-bit signature as a hex string. |

#### Parameters

| Name    | Type                                                                             | Description                                     |
| :------ | :------------------------------------------------------------------------------- | :---------------------------------------------- |
| `claim` | [`VerificationEthAddressClaim`](../modules/types.md#verificationethaddressclaim) | The body of the claim to be signed as an object |
