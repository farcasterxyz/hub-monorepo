# Utils

Helpers to manage Farcaster Messages.

- **Bytes**
  - [bytesToHexString](#bytesToHexString)
  - [hexStringToBytes](#hexStringToBytes)
  - [bytesToUTF8String](#bytesToUTF8String)
- **Errors**
  - [HubError](#hub-error)
  - [HubErrorCodes](#hub-error-codes)
- **Time**
  - [getFarcasterTime](#getFarcasterTime)
  - [toFarcasterTime](#toFarcasterTime)
  - [fromFarcasterTime](#fromFarcasterTime)
- **Verifications**
  - [makeVerificationEthAddressClaim](#makeVerificationEthAddressClaim)

## Bytes

Farcaster stores addresses, keys and signatures as binary data held in Uint8Arrays. Converting such values to hex strings or utf-8 strings is useful when calling other libraries or displaying strings to users.

### bytesToHexString

Returns a hex string from a bytes array.

#### Usage

```typescript
// TODO
```

#### Returns

| Value | Description |
| :---- | :---------- |
| `TBD` | TBD         |

#### Parameters

| Name  | Type  | Description |
| :---- | :---- | :---------- |
| `TBD` | `TBD` | TBD         |

---

### hexStringToBytes

Returns a bytes array from a hex string.

#### Usage

```typescript
// TODO
```

#### Returns

| Value | Description |
| :---- | :---------- |
| `TBD` | TBD         |

#### Parameters

| Name  | Type  | Description |
| :---- | :---- | :---------- |
| `TBD` | `TBD` | TBD         |

---

### bytesToUTF8String

Returns a UTF-8 string from a bytes array.

## Errors

Error handling in @farcaster/hub-nodejs is monadic and functions do not throw exceptions. Each function call returns a Result object which contains a success value or error value. Read the [neverthrow](https://github.com/supermacro/neverthrow/blob/master/README.md) documentation to learn about handling Result types.

### Hub Error

TODO

### Hub Error Codes

| Name                           | Description |
| ------------------------------ | ----------- |
| unauthenticated                | TODO        |
| unauthorized                   | TODO        |
| bad_request                    | TODO        |
| bad_request.parse_failure      | TODO        |
| bad_request.invalid_param      | TODO        |
| bad_request.validation_failure | TODO        |
| bad_request.duplicate          | TODO        |
| bad_request.conflict           | TODO        |
| not_found                      | TODO        |
| not_implemented                | TODO        |
| not_implemented.deprecated     | TODO        |
| unavailable                    | TODO        |
| unavailable.network_failure    | TODO        |
| unavailable.storage_failure    | TODO        |
| unknown                        | TODO        |

## Time

Farcaster timestamps are counted as milliseconds since the Farcaster epoch, which began on Jan 1, 2021 00:00:00 UTC.

Using a more recent epoch lets Farcaster use shorter 32-bit values to hold times which reduces the size of messages. Timestamps are usually measured as milliseconds since the Unix epoch and can be converted to Farcaster time by subtracting 1609459200000.

### getFarcasterTime

Returns the current time in milliseconds as a Farcaster timestamp.

#### Usage

```typescript
// TODO
```

#### Returns

| Value | Description |
| :---- | :---------- |
| `TBD` | TBD         |

#### Parameters

| Name  | Type  | Description |
| :---- | :---- | :---------- |
| `TBD` | `TBD` | TBD         |

---

### toFarcasterTime

Converts a Unix milliseconds timestamp to a Farcaster milliseconds timestamp.

#### Usage

```typescript
// TODO
```

#### Returns

| Value | Description |
| :---- | :---------- |
| `TBD` | TBD         |

#### Parameters

| Name  | Type  | Description |
| :---- | :---- | :---------- |
| `TBD` | `TBD` | TBD         |

---

### fromFarcasterTime

Converts a Farcaster milliseconds timestamp to a Unix milliseconds timestamp.

#### Usage

```typescript
// TODO
```

#### Returns

| Value | Description |
| :---- | :---------- |
| `TBD` | TBD         |

#### Parameters

| Name  | Type  | Description |
| :---- | :---- | :---------- |
| `TBD` | `TBD` | TBD         |

## Verifications

### makeVerificationEthAddressClaim

#### Usage

```typescript
import {
  Eip712Signer,
  FarcasterNetwork,
  hexStringToBytes,
  makeVerificationEthAddressClaim,
} from '@farcaster/hub-nodejs';
import { ethers } from 'ethers';

// Create a valid Eip712Signer from the Etherum Address making the claim
const mnemonic = 'ordinary long coach bounce thank quit become youth belt pretty diet caught attract melt bargain';
const wallet = ethers.Wallet.fromMnemonic(mnemonic);
const eip712Signer = Eip712Signer.fromSigner(wallet, wallet.address)._unsafeUnwrap();

// Construct the claim object with the block number of a recent block
const blockHashHex = '0x1d3b0456c920eb503450c7efdcf9b5cf1f5184bf04e5d8ecbcead188a0d02018';
const blockHashBytes = hexStringToBytes(blockHashHex)._unsafeUnwrap();

const claimResult = makeVerificationEthAddressClaim(1, eip712Signer.signerKey, FarcasterNetwork.DEVNET, blockHashBytes);

claimResult.map((c) => console.log(c));
```

#### Returns

| Value | Description |
| :---- | :---------- |
| `TBD` | TBD         |

#### Parameters

| Name  | Type  | Description |
| :---- | :---- | :---------- |
| `TBD` | `TBD` | TBD         |
