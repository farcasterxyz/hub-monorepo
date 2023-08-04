## Table of Contents

1. [Signer Service](#1-signer-service)
2. [UserData Service](#2-userdata-service)
3. [Cast Service](#3-cast-service)
4. [Reaction Service](#4-reaction-service)
5. [Verification Service](#5-verification-service)
6. [Event Service](#6-event-service)
7. [Submit Service](#7-submit-service)
8. [Contract Service](#8-contract-service)

## 1. Signer Service

Used to retrieve valid and revoked Signers

| Method Name               | Request Type  | Response Type    | Description                                    |
| ------------------------- | ------------- | ---------------- | ---------------------------------------------- |
| GetSigner                 | SignerRequest | Messages         | Returns a specific SignerAddMessage for an Fid |
| GetSignersByFid           | FidRequest    | MessagesResponse | Returns all SignerAddMessages for an Fid       |
| GetAllSignerMessagesByFid | FidRequest    | MessagesResponse | Returns all SignerMessages for an Fid          |

#### Signer Request

| Field  | Type        | Label | Description                                       |
| ------ | ----------- | ----- | ------------------------------------------------- |
| fid    | [uint64](#) |       | Farcaster ID of the user who generated the Signer |
| signer | [bytes](#)  |       | Public Key of the Signer                          |

#### Fid Request

| Field | Type        | Label | Description              |
| ----- | ----------- | ----- | ------------------------ |
| fid   | [uint64](#) |       | Farcaster ID of the user |

#### Messages Response

| Field    | Type         | Label    | Description       |
| -------- | ------------ | -------- | ----------------- |
| messages | [Message](#) | repeated | Farcaster Message |

## 2. UserData Service

Users to retrieve the current metadata associated with a user

| Method Name                  | Request Type              | Response Type              | Description                               |
| ---------------------------- | ------------------------- | -------------------------- | ----------------------------------------- |
| GetUserData                  | UserDataRequest           | Message                    | Returns a specific UserData for an Fid    |
| GetUserDataByFid             | FidRequest                | MessagesResponse           | Returns all UserData for an Fid           |
| GetAllUserDataMessagesByFid  | FidRequest                | MessagesResponse           | Returns all UserData for an Fid           |
| GetRentRegistryEvents        | RentRegistryEventsRequest | RentRegistryEventsResponse | Returns all RentRegistryEvents for an Fid |
| GetCurrentStorageLimitsByFid | FidRequest                | StorageLimitsResponse      | Returns StorageLimits for an Fid          |

#### UserData Request

| Field          | Type              | Label | Description                                         |
| -------------- | ----------------- | ----- | --------------------------------------------------- |
| fid            | [uint64](#)       |       | Farcaster ID of the user who generated the UserData |
| user_data_type | [UserDataType](#) |       | Type of UserData being requested                    |


#### StorageLimitsResponse

| Field          | Type                         | Label    | Description                   |
| -------------- | ---------------------------- | -------- | ----------------------------- |
| limits         | [StorageLimit](#)            | repeated | Storage limits per store type |

#### StorageLimit

| Field      | Type           | Label | Description                                            |
| ---------- |----------------| ----- | ------------------------------------------------------ |
| store_type | [StoreType](#) |       | The specific type being managed by the store           |
| limit      | [uint64](#)    |       | The limit of the store type, scaled by the user's rent |

## 3. Cast Service

Used to retrieve valid casts or tombstones for deleted casts

| Method Name             | Request Type | Response Type    | Description                                                    |
| ----------------------- | ------------ | ---------------- | -------------------------------------------------------------- |
| GetCast                 | CastId       | Message          | Returns a specific Cast                                        |
| GetCastsByFid           | FidRequest   | MessagesResponse | Returns CastAdds for an Fid in reverse chron order             |
| GetCastsByParent        | CastId       | MessagesResponse | Returns CastAdd replies to a given Cast in reverse chron order |
| GetCastsByMention       | FidRequest   | MessagesResponse | Returns CastAdds that mention an Fid in reverse chron order    |
| GetAllCastMessagesByFid | FidRequest   | MessagesResponse | Returns Casts for an Fid in reverse chron order                |

## 4. Reaction Service

| Method Name                 | Request Type           | Response Type    | Description                                                  |
| --------------------------- | ---------------------- | ---------------- | ------------------------------------------------------------ |
| GetReaction                 | ReactionRequest        | Message          | Returns a specific Reaction                                  |
| GetReactionsByFid           | ReactionsByFidRequest  | MessagesResponse | Returns Reactions made by an Fid in reverse chron order      |
| GetReactionsByCast          | ReactionsByCastRequest | MessagesResponse | Returns ReactionAdds for a given Cast in reverse chron order |
| GetAllReactionMessagesByFid | FidRequest             | MessagesREsponse | Returns Reactions made by an Fid in reverse chron order      |

#### Reactions Request

Users to retrieve valid or revoked reactions

| Field         | Type              | Label | Description                                                |
| ------------- | ----------------- | ----- | ---------------------------------------------------------- |
| fid           | [uint64](#)       |       | Farcaster ID of the user who generated the Reaction        |
| reaction_type | [ReactionType](#) |       | Type of the Reaction being requested                       |
| cast_id       | [CastId](#)       |       | Identifier of the Cast whose reactions are being requested |

#### ReactionsByFid Request

| Field         | Type              | Label | Description                                         |
| ------------- | ----------------- | ----- | --------------------------------------------------- |
| fid           | [uint64](#)       |       | Farcaster ID of the user who generated the Reaction |
| reaction_type | [ReactionType](#) |       | Type of the Reaction being requested                |

#### ReactionsByCast Request

| Field         | Type              | Label | Description                                                |
| ------------- | ----------------- | ----- | ---------------------------------------------------------- |
| cast_id       | [CastId](#)       |       | Identifier of the Cast whose reactions are being requested |
| reaction_type | [ReactionType](#) |       | Type of the Reaction being requested                       |

## 5. Verification Service

Used to retrieve valid or revoked proof of ownership of an Ethereum Address.

| Method Name                     | Request Type        | Response Type    | Description                                       |
| ------------------------------- | ------------------- | ---------------- | ------------------------------------------------- |
| GetVerification                 | VerificationRequest | Message          | Returns a VerificationAdd for an Ethereum Address |
| GetVerificationsByFid           | FidRequest          | MessagesResponse | Returns all VerificationAdds made by an Fid       |
| GetAllVerificationMessagesByFid | FidRequest          | MessagesResponse | Returns all Verifications made by an Fid          |

#### Verification Request

| Field   | Type        | Label | Description                                             |
| ------- | ----------- | ----- | ------------------------------------------------------- |
| fid     | [uint64](#) |       | Farcaster ID of the user who generated the Verification |
| address | [bytes](#)  |       | Ethereum Address being verified                         |

## 6. Event Service

Used to subscribe to real-time event updates from the Farcaster Hub

| Method Name | Request Type     | Response Type        | Description                      |
| ----------- | ---------------- | -------------------- | -------------------------------- |
| Subscribe   | SubscribeRequest | stream EventResponse | Streams new Events as they occur |

#### SubscribeRequest

| Field       | Type           | Label    | Description                     |
| ----------- | -------------- | -------- | ------------------------------- |
| event_types | [EventType](#) | repeated | Types of events to subscribe to |

#### EventResponse

| Field               | Type                   | Label    | Description                                          |
| ------------------- | ---------------------- | -------- | ---------------------------------------------------- |
| type                | [EventType](#)         |          | Type of Event that occurred                          |
| message             | [Message](#)           |          | Message that was merged into the Hub                 |
| deleted_messages    | [Message](#)           | repeated | Messages that were removed as a result of the Merkle |
| id_registry_event   | [IdRegistryEvent](#)   |          | On-chain FIR event that corresponds to the event     |
| name_registry_event | [NameRegistryEvent](#) |          | On-chain FNR event that corresponds to the event     |

#### EventType

| Name                                 | Number | Description                                                      |
| ------------------------------------ | ------ | ---------------------------------------------------------------- |
| EVENT_TYPE_NONE                      | 0      | Invalid default value                                            |
| EVENT_TYPE_MERGE_MESSAGE             | 1      | Emitted when a Message was added to the Hub                      |
| EVENT_TYPE_PRUNE_MESSAGE             | 2      | Emitted when a Message was pruned from the Hub                   |
| EVENT_TYPE_REVOKE_MESSAGE            | 3      | Emitted when a Signer was revoked                                |
| EVENT_TYPE_MERGE_ID_REGISTRY_EVENT   | 4      | Emitted when an event is observed in the Farcaster Id Registry   |
| EVENT_TYPE_MERGE_NAME_REGISTRY_EVENT | 5      | Emitted when an event is observed in the Farcaster Name Registry |

## 7. Submit Service

| Method Name   | Request Type | Response Type | Description                  |
| ------------- | ------------ | ------------- | ---------------------------- |
| SubmitMessage | Message      | Message       | Submits a Message to the Hub |

## 8. Contract Service

Used to query the Hubs for the state of the Farcaster Id Registry and Farcaster Name Registry contracts on Ethereum.

| Method Name          | Request Type             | Response Type     | Description                                            |
| -------------------- | ------------------------ | ----------------- | ------------------------------------------------------ |
| GetFids              | Empty                    | FidsResponse      | Returns the most recent Fids that were registered      |
| GetIdRegistryEvent   | FidRequest               | IdRegistryEvent   | Returns the most recent IdRegistryEvent for an Fid     |
| GetNameRegistryEvent | NameRegistryEventRequest | NameRegistryEvent | Returns the most recent NameRegistryEvent for an Fname |

#### NameRegistryEvent Request

| Field | Type       | Label | Description                                                   |
| ----- | ---------- | ----- | ------------------------------------------------------------- |
| name  | [bytes](#) |       | Fname of the user whose NameRegistry event is being requested |

#### Fids Response

| Field | Type        | Label    | Description     |
| ----- | ----------- | -------- | --------------- |
| fids  | [uint64](#) | repeated | Fid of the user |
