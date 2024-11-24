# ViemLocalEip712Signer

A Eip712Signer that is initialized with a [Viem](https://viem.sh/docs/getting-started) LocalAсcount and can be used with [Builders](../builders/builders.md) to sign Farcaster Messages.

## Properties

| Name     | Type         | Description                                 |
| :------- | :----------- | :------------------------------------------ |
| `scheme` | `Uint8Array` | Signature scheme used when signing messages |

## Constructors

### `static` new ViemLocalEip712Signer

### Usage

```typescript
import { ViemLocalEip712Signer } from '@farcaster/hub-nodejs';
import { mnemonicToAccount } from 'viem/accounts';

const mnemonic = 'ordinary long coach bounce thank quit become youth belt pretty diet caught attract melt bargain';
const account = mnemonicToAccount(mnemonic);
const eip712Signer = new ViemLocalEip712Signer(account);
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
import { randomBytes } from '@noble/hashes/utils';

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
const blockHashBytes = hexStringToBytes(blockHashHex)._unsafeUnwrap(); // Safety: blockHashHex is known and can't error

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

### signUserNameProofClaim

Generates a 256-bit signature for a UserNameProofClaim and returns the bytes.

#### Usage

```typescript
import { makeUserNameProofClaim } from '@farcaster/hub-nodejs';

const claim = makeUserNameProofClaim({
  owner: '0x8773442740c17c9d0f0b87022c722f9a136206ed',
  name: 'farcaster',
  timestamp: Date.now(),
});

const signatureResult = await eip712Signer.signUserNameProofClaim(claim);
if (signatureResult.isOk()) {
  console.log(signatureResult.value);
}
```

#### Returns

| Value                        | Description                            |
| :--------------------------- | :------------------------------------- |
| `HubAsyncResult<Uint8Array>` | The 256-bit signature as a Uint8Array. |

#### Parameters

| Name    | Type                 | Description                         |
| :------ | :------------------- | :---------------------------------- |
| `claim` | `UserNameProofClaim` | The body of the claim to be signed. |

---
