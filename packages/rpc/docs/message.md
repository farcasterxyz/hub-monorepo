## Table of Contents

1. [Message](#1-message)
2. [Signer](#2-signer)
3. [User Data](#3-userdata)
4. [Cast](#4-cast)
5. [Reaction](#5-reaction)
6. [Verification](#6-verification)

## 1. Message

A Message is a delta operation on the Farcaster network. The message protobuf is an envelope that wraps a MessageData object and contains a hash and signature which can verify its authenticity.

| Field            | Type                                | Label | Description                                                       |
| ---------------- | ----------------------------------- | ----- | ----------------------------------------------------------------- |
| data             | [MessageData](#MessageData)         |       | Contents of the message                                           |
| hash             | bytes                               |       | Hash digest of data                                               |
| hash_scheme      | [HashScheme](#HashScheme)           |       | Hash scheme that produced the hash digest                         |
| signature        | bytes                               |       | Signature of the hash digest                                      |
| signature_scheme | [SignatureScheme](#SignatureScheme) |       | Signature scheme that produced the signature                      |
| signer           | bytes                               |       | Public key or address of the key pair that produced the signature |

### 1.1 MessageData

A MessageData object contains properties common to all MessagesTypes and wraps a body object which contains properties specific to the MessageType.

| Field     | Type                                                                                                                                                                                                                                                                                                                                                   | Label | Description                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ---------------------------------------------- |
| type      | [MessageType](#MessageType)                                                                                                                                                                                                                                                                                                                            |       | Type of Message contained in the body          |
| fid       | uint64                                                                                                                                                                                                                                                                                                                                                 |       | Farcaster ID of the user producing the message |
| timestamp | uint32                                                                                                                                                                                                                                                                                                                                                 |       | Farcaster epoch timestamp in seconds           |
| network   | [FarcasterNetwork](#FarcasterNetwork)                                                                                                                                                                                                                                                                                                                  |       | Farcaster network the message is intended for  |
| body      | [CastAddBody](#CastAddBody), <br> [CastRemoveBody](#CastRemoveBody), <br> [ReactionBody](#ReactionBody), <br>[VerificationAddEthAddressBody](#VerificationAddEthAddressBody), <br>[VerificationRemoveBody](#VerificationRemoveBody), <br>[SignerAddBody](#SignerAddBody), <br>[SignerRemoveBody](#SignerRemoveBody),<br> [UserDataBody](#UserDataBody) | oneOf | Properties specific to the MessageType         |

### 1.2 HashScheme

Type of hashing scheme used to produce a digest of MessageData

| Name               | Number | Description                            |
| ------------------ | ------ | -------------------------------------- |
| HASH_SCHEME_NONE   | 0      |                                        |
| HASH_SCHEME_BLAKE3 | 1      | Default scheme for hashing MessageData |

### 1.3 Signature Scheme

Type of signature scheme used to sign the Message hash

| Name                     | Number | Description                          |
| ------------------------ | ------ | ------------------------------------ |
| SIGNATURE_SCHEME_NONE    | 0      |                                      |
| SIGNATURE_SCHEME_ED25519 | 1      | Ed25519 signature (default)          |
| SIGNATURE_SCHEME_EIP712  | 2      | ECDSA signature using EIP-712 scheme |

### 1.4 Message Type

Type of the MessageBody

| Name                                      | Number | Description                                               |
| ----------------------------------------- | ------ | --------------------------------------------------------- |
| MESSAGE_TYPE_NONE                         | 0      | Invalid default value                                     |
| MESSAGE_TYPE_CAST_ADD                     | 1      | Add a new Cast                                            |
| MESSAGE_TYPE_CAST_REMOVE                  | 2      | Remove an existing Cast                                   |
| MESSAGE_TYPE_REACTION_ADD                 | 3      | Add a Reaction to a Cast                                  |
| MESSAGE_TYPE_REACTION_REMOVE              | 4      | Remove a Reaction from a Cast                             |
| MESSAGE_TYPE_VERIFICATION_ADD_ETH_ADDRESS | 7      | Add a Verification of an Ethereum Address                 |
| MESSAGE_TYPE_VERIFICATION_REMOVE          | 8      | Remove a Verification                                     |
| MESSAGE_TYPE_SIGNER_ADD                   | 9      | Add a new Ed25519 key pair that signs messages for a user |
| MESSAGE_TYPE_SIGNER_REMOVE                | 10     | Remove an Ed25519 key pair that signs messages for a user |
| MESSAGE_TYPE_USER_DATA_ADD                | 11     | Add metadata about a user                                 |

### 1.5 Farcaster Network

Farcaster network the message is intended for

| Name                      | Number | Description            |
| ------------------------- | ------ | ---------------------- |
| FARCASTER_NETWORK_NONE    | 0      |                        |
| FARCASTER_NETWORK_MAINNET | 1      | Public primary network |
| FARCASTER_NETWORK_TESTNET | 2      | Public test network    |
| FARCASTER_NETWORK_DEVNET  | 3      | Private test network   |

## 2. Signer

A signer is a delta that authorizes a new key pair to sign Messages on behalf of the user.

### 2.1 SignerAddBody

Adds or removes an Ed25519 key pair that signs messages for a user

| Field  | Type   | Label | Description                                    |
| ------ | ------ | ----- | ---------------------------------------------- |
| signer | bytes  |       | Public key of the Ed25519 key pair             |
| name?  | string |       | (optional) Human-readable label for the signer |

### 2.1 SignerRemoveBody

Adds or removes an Ed25519 key pair that signs messages for a user

| Field  | Type  | Label | Description                        |
| ------ | ----- | ----- | ---------------------------------- |
| signer | bytes |       | Public key of the Ed25519 key pair |

## 3. UserData

A UserData is a delta that contains metadata information about the user.

### 3.1 UserDataBody

Adds metadata about a user

| Field | Type                          | Label | Description           |
| ----- | ----------------------------- | ----- | --------------------- |
| type  | [UserDataType](#UserDataType) |       | Type of metadata      |
| value | string                        |       | Value of the metadata |

### 3.2 UserDataType

Type of UserData

| Name                   | Number | Description                           |
| ---------------------- | ------ | ------------------------------------- |
| USER_DATA_TYPE_NONE    | 0      | Invalid default value                 |
| USER_DATA_TYPE_PFP     | 1      | Profile Picture for the user          |
| USER_DATA_TYPE_DISPLAY | 2      | Display Name for the user             |
| USER_DATA_TYPE_BIO     | 3      | Bio for the user                      |
| USER_DATA_TYPE_URL     | 5      | URL of the user                       |
| USER_DATA_TYPE_FNAME   | 6      | Preferred Farcaster Name for the user |

## 4. Cast

A Cast is a delta that represents a new public update from a user. Casts can be added and removed at any time by the user.

### 4.1 CastAddBody

Adds a new Cast

| Field              | Type              | Label    | Description                           |
| ------------------ | ----------------- | -------- | ------------------------------------- |
| embeds             | string            | repeated | URLs to be embedded in the cast       |
| mentions           | uint64            | repeated | Fids mentioned in the cast            |
| parent_cast_id     | [CastId](#CastId) |          | Parent cast of the cast               |
| text               | string            |          | Text of the cast                      |
| mentions_positions | uint32            | repeated | Positions of the mentions in the text |

### 4.2 CastRemoveBody

Removes an existing Cast

| Field       | Type  | Label | Description                |
| ----------- | ----- | ----- | -------------------------- |
| target_hash | bytes |       | Hash of the cast to remove |

### 4.3 CastId

Identifier used to look up a Cast

| Field | Type   | Label | Description                          |
| ----- | ------ | ----- | ------------------------------------ |
| fid   | uint64 |       | Fid of the user who created the cast |
| hash  | bytes  |       | Hash of the cast                     |

## 5. Reaction

A Reaction is a delta that is applied by a user to a specific Cast.

### 5.1 ReactionBody

Adds or removes a Reaction from a Cast

| Field          | Type                          | Label | Description                    |
| -------------- | ----------------------------- | ----- | ------------------------------ |
| type           | [ReactionType](#ReactionType) |       | Type of reaction               |
| target_cast_id | [CastId](#CastId)             |       | CastId of the Cast to react to |

### 5.2 ReactionType

Type of Reaction

| Name                 | Number | Description                                  |
| -------------------- | ------ | -------------------------------------------- |
| REACTION_TYPE_NONE   | 0      | Invalid default value                        |
| REACTION_TYPE_LIKE   | 1      | Like the target cast                         |
| REACTION_TYPE_RECAST | 2      | Share target cast to the user&#39;s audience |

## 6. Verification

A Verification is a delta that contains a bi-directional signature proving that an fid has control over an Ethereum address.

### 6.1 VerificationAddEthAddressBody

Adds a Verification of ownership of an Ethereum Address

| Field         | Type  | Label | Description                                                   |
| ------------- | ----- | ----- | ------------------------------------------------------------- |
| address       | bytes |       | Ethereum address being verified                               |
| block_hash    | bytes |       | Hash of the latest Ethereum block when the claim was produced |
| eth_signature | bytes |       | Signature produced by the user&#39;s Ethereum address         |

### 6.2 VerificationRemoveBody

Removes a Verification of any type

| Field   | Type  | Label | Description                           |
| ------- | ----- | ----- | ------------------------------------- |
| address | bytes |       | Address of the Verification to remove |

### 6.3 VerificationClaim
