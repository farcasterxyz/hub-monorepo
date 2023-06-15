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
import { bytesToHexString } from '@farcaster/hub-nodejs';

// Safety: byteArray is known and can't error
const byteArray = new Uint8Array([1, 2, 3]); // can be bytes signature, address, etc
const hexString = bytesToHexString(byteArray)._unsafeUnwrap();
console.log(hexString); // "0x010203"
```

#### Returns

| Value               | Description                                          |
| :------------------ | :--------------------------------------------------- |
| `HubResult<string>` | A hex string representation of the input byte array. |

#### Parameters

| Name    | Type         | Description                                        |
| :------ | :----------- | :------------------------------------------------- |
| `bytes` | `Uint8Array` | The input byte array to convert into a hex string. |

---

### hexStringToBytes

Returns a bytes array from a hex string.

#### Usage

```typescript
import { hexStringToBytes } from '@farcaster/hub-nodejs';

// Safety: hexString is known and can't error
const hexString = '0x010203'; // can be signature, address, etc
const byteArray = hexStringToBytes(hexString)._unsafeUnwrap();
console.log(byteArray); // Uint8Array [1, 2, 3]
```

#### Returns

|          Value          | Description                                                  |
| :---------------------: | ------------------------------------------------------------ |
| `HubResult<Uint8Array>` | A byte array representation of the input hexadecimal string. |

#### Parameters

| Name  | Type     | Description                                                  |
| :---- | :------- | :----------------------------------------------------------- |
| `hex` | `string` | The hexadecimal string to convert into an output byte array. |

---

### bytesToUTF8String

Returns a UTF-8 string from a bytes array.

```typescript
import { bytesToUtf8String } from './utils';

// Safety: byteArray is known and can't error
const byteArray = new Uint8Array([72, 101, 108, 108, 111]); // "Hello" in ASCII encoding.
const utfEncodedStr = bytesToUtf8String(byteArray)._unsafeUnwrap();
console.log(utfEncodedStr); //"Hello"
```

#### Returns

|        Value        | Description                                            |
| :-----------------: | ------------------------------------------------------ |
| `HubResult<string>` | A UTF-8 string representation of the input byte array. |

#### Parameters

| Name    | Type         | Description                                        |
| :------ | :----------- | :------------------------------------------------- |
| `bytes` | `Uint8Array` | The input byte array to convert into a hex string. |

## Errors

Error handling in @farcaster/hub-nodejs is monadic and functions do not throw exceptions. Each function call returns a Result object which contains a success value or error value. Read the [neverthrow](https://github.com/supermacro/neverthrow/blob/master/README.md) documentation to learn about handling Result types.

### Hub Error

HubErrorCode defines all the types of errors that can be raised in the Hub.

### Hub Error Codes

| Name                           | Description                                                                 |
| :----------------------------- | :-------------------------------------------------------------------------- |
| unauthenticated                | The request lacks valid authentication credentials. Retry with credentials. |
| unauthorized                   | The authenticated request lacks the authority to perform this action.       |
| bad_request                    | The request cannot be completed as constructed. Do not retry.               |
| bad_request.parse_failure      | The request failed to parse. Do not retry.                                  |
| bad_request.invalid_param      | The request contains an invalid parameter. Do not retry.                    |
| bad_request.validation_failure | The request failed validation. Do not retry.                                |
| bad_request.duplicate          | The request contains a duplicate entry. Do not retry.                       |
| bad_request.conflict           | The request conflicts with an existing resource. Do not retry.              |
| not_found                      | The requested resource could not be found.                                  |
| not_implemented                | The request cannot be completed because the operation is not executable.    |
| not_implemented.deprecated     | The requested operation is deprecated.                                      |
| unavailable                    | The request cannot be completed, and it may or may not be safe to retry.    |
| unavailable.network_failure    | The request failed due to a network failure, and it may be safe to retry.   |
| unavailable.storage_failure    | The request failed due to a storage failure, and it may be safe to retry.   |
| unknown                        | An unknown error was encountered.                                           |

## Time

Farcaster timestamps are counted as milliseconds since the Farcaster epoch, which began on Jan 1, 2021 00:00:00 UTC.

Using a more recent epoch lets Farcaster use shorter 32-bit values to hold times which reduces the size of messages. Timestamps are usually measured as milliseconds since the Unix epoch and can be converted to Farcaster time by subtracting 1609459200000.

### getFarcasterTime

Returns the current time in milliseconds as a Farcaster timestamp.

#### Usage

```typescript
import { getFarcasterTime } from '@farcaster/hub-nodejs';

const timestamp = getFarcasterTime()._unsafeUnwrap();
console.log(timestamp); // 70117755
```

#### Returns

| Value               | Description                                                |
| :------------------ | :--------------------------------------------------------- |
| `HubResult<number>` | The current time in milliseconds as a Farcaster timestamp. |

---

### toFarcasterTime

Converts a Unix milliseconds timestamp to a Farcaster milliseconds timestamp.

#### Usage

```typescript
import { toFarcasterTime } from '@farcaster/hub-nodejs';

const msTimestamp = Date.now(); // can be anything, e.g., ethereum transaction timestamp
const timestamp = toFarcasterTime(msTimestamp)._unsafeUnwrap();
console.log(timestamp); // 70117500
```

#### Returns

| Value               | Description                                                  |
| :------------------ | :----------------------------------------------------------- |
| `HubResult<number>` | The converted time in milliseconds as a Farcaster timestamp. |

#### Parameters

| Name   | Type     | Description                                                             |
| :----- | :------- | :---------------------------------------------------------------------- |
| `time` | `number` | The Unix timestamp in milliseconds to convert to a Farcaster timestamp. |

---

### fromFarcasterTime

Converts a Farcaster milliseconds timestamp to a Unix milliseconds timestamp.

#### Usage

```typescript
import { fromFarcasterTime } from '@farcaster/hub-nodejs';

const timestamp = 70160902; // Farcaster timestamp in milliseconds
const msTimestamp = fromFarcasterTime(timestamp)._unsafeUnwrap();
console.log(msTimestamp); // 1679620102000
```

#### Returns

| Value               | Description                                             |
| :------------------ | :------------------------------------------------------ |
| `HubResult<number>` | The converted time in milliseconds as a Unix timestamp. |

#### Parameters

| Name   | Type     | Description                                                             |
| :----- | :------- | :---------------------------------------------------------------------- |
| `time` | `number` | The Farcaster timestamp in milliseconds to convert to a Unix timestamp. |

## Verifications

### makeVerificationEthAddressClaim

#### Usage

```typescript
import {
  EthersEip712Signer,
  FarcasterNetwork,
  hexStringToBytes,
  makeVerificationEthAddressClaim,
} from '@farcaster/hub-nodejs';
import { Wallet } from 'ethers';

// Create a valid Eip712Signer from the Ethereum Address making the claim
const mnemonic = 'ordinary long coach bounce thank quit become youth belt pretty diet caught attract melt bargain';
const wallet = Wallet.fromPhrase(mnemonic);
const eip712Signer = new EthersEip712Signer(wallet);

// Construct the claim object with the block number of a recent block
const blockHashHex = '0x1d3b0456c920eb503450c7efdcf9b5cf1f5184bf04e5d8ecbcead188a0d02018';
const blockHashBytes = hexStringToBytes(blockHashHex)._unsafeUnwrap(); // Safety: blockHashHex is known and can't error

const addressBytes = (await eip712Signer.getSignerKey())._unsafeUnwrap(); // Safety: eip712Signer is known and can't error
const claimResult = makeVerificationEthAddressClaim(1, addressBytes, FarcasterNetwork.DEVNET, blockHashBytes);
```

#### Returns

| Value                                    | Description                                                         |
| :--------------------------------------- | :------------------------------------------------------------------ |
| `HubResult<VerificationEthAddressClaim>` | `VerificationEthAddressClaim object that can be submitted to Hubs.` |

#### Parameters

| Name         | Type               | Description                                         |
| :----------- | :----------------- | :-------------------------------------------------- |
| `fidNumber`  | `number`           | The Farcaster ID to verify.                         |
| `ethAddress` | `Uint8Array`       | The Ethereum address to verify.                     |
| `network`    | `FarcasterNetwork` | The Farcaster network value as defined in protobuf. |
| `blockHash`  | `Uint8Array`       | The hash of a recent Ethereum block.                |
