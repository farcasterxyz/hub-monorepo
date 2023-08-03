# API

Documentation for gRPC endpoints exposed by Hubble.

We recommend using a library like [hub-nodejs](https://github.com/farcasterxyz/hub-monorepo/tree/main/packages/hub-nodejs) to interact with Hubble's gRPC APIs.

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
| page_size     | uint32            |       | (optional) Type of the Link being requested         |
| page_token    | bytes             |       | (optional)Type of the Link being requested          |
| reverse       | boolean           |       | (optional) Ordering of the response                 |

#### Messages Response

| Field           | Type            | Label    | Description       |
| --------------- | --------------- | -------- | ----------------- |
| messages        | [Message](#)    | repeated | Farcaster Message |
| next_page_token | [bytes](#bytes) | optional |                   |

## 2. UserData Service

Users to retrieve the current metadata associated with a user

| Method Name                  | Request Type    | Response Type         | Description                             |
|------------------------------|-----------------|-----------------------|-----------------------------------------|
| GetUserData                  | UserDataRequest | Message               | Returns a specific UserData for an Fid  |
| GetUserDataByFid             | FidRequest      | MessagesResponse      | Returns all UserData for an Fid         |
| GetAllUserDataMessagesByFid  | FidRequest      | MessagesResponse      | Returns all UserData for an Fid         |
| GetCurrentStorageLimitsByFid | FidRequest      | StorageLimitsResponse | Returns StorageLimits for an Fid        |

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

#### CastsByParentRequest

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| parent_cast_id | [CastId](#CastId) |  |  |
| parent_url | [string](#string) |  |  |
| page_size | [uint32](#uint32) | optional |  |
| page_token | [bytes](#bytes) | optional |  |
| reverse | [bool](#bool) | optional |  |


## 4. Reaction Service

| Method Name                 | Request Type             | Response Type    | Description                                                  |
| --------------------------- | ------------------------ | ---------------- | ------------------------------------------------------------ |
| GetReaction                 | ReactionRequest          | Message          | Returns a specific Reaction                                  |
| GetReactionsByFid           | ReactionsByFidRequest    | MessagesResponse | Returns Reactions made by an Fid in reverse chron order      |
| GetReactionsByCast          | ReactionsByCastRequest   | MessagesResponse | Returns ReactionAdds for a given Cast in reverse chron order |
| GetReactionsByTarget        | ReactionsByTargetRequest | MessagesResponse | Returns ReactionAdds for a given Cast in reverse chron order |
| GetAllReactionMessagesByFid | FidRequest               | MessagesResponse | Returns Reactions made by an Fid in reverse chron order      |

#### Reaction Request

Users to retrieve valid or revoked reactions

| Field          | Type              | Label | Description                                                           |
| -------------- | ----------------- | ----- | --------------------------------------------------------------------- |
| fid            | [uint64](#)       |       | Farcaster ID of the user who generated the Reaction                   |
| reaction_type  | [ReactionType](#) |       | Type of the Reaction being requested                                  |
| target_cast_id | [CastId](#)       |       | (optional) Identifier of the Cast whose reactions are being requested |
| target_url     | [string](#)       |       | (optional) Identifier of the Url whose reactions are being requested  |

#### ReactionsByFid Request

| Field         | Type              | Label | Description                                         |
| ------------- | ----------------- | ----- | --------------------------------------------------- |
| fid           | [uint64](#)       |       | Farcaster ID of the user who generated the Reaction |
| reaction_type | [ReactionType](#) |       | Type of the Reaction being requested                |
| page_size     | uint32            |       | (optional) Type of the Link being requested         |
| page_token    | bytes             |       | (optional)Type of the Link being requested          |
| reverse       | boolean           |       | (optional) Ordering of the response                 |

#### ReactionsByCast Request

| Field         | Type              | Label | Description                                                |
| ------------- | ----------------- | ----- | ---------------------------------------------------------- |
| cast_id       | [CastId](#)       |       | Identifier of the Cast whose reactions are being requested |
| reaction_type | [ReactionType](#) |       | Type of the Reaction being requested                       |
| page_size     | uint32            |       | (optional) Type of the Link being requested                |
| page_token    | bytes             |       | (optional)Type of the Link being requested                 |
| reverse       | boolean           |       | (optional) Ordering of the response                        |

### ReactionsByTargetRequest

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| target_cast_id | [CastId](#CastId) |  |  |
| target_url | [string](#string) |  |  |
| reaction_type | [ReactionType](#ReactionType) | optional |  |
| page_size | [uint32](#uint32) | optional |  |
| page_token | [bytes](#bytes) | optional |  |
| reverse | [bool](#bool) | optional |  |


## 5. Link Service

| Method Name             | Request Type         | Response Type    | Description                                                  |
| ----------------------- | -------------------- | ---------------- | ------------------------------------------------------------ |
| GetLink                 | LinkRequest          | Message          | Returns a specific Link                                  |
| GetLinksByFid           | LinksByFidRequest    | MessagesResponse | Returns Links made by an fid in reverse chron order      |
| GetLinksByTarget        | LinksByTargetRequest | MessagesResponse | Returns LinkAdds for a given target in reverse chron order |
| GetAllLinkMessagesByFid | FidRequest           | MessagesResponse | Returns Links made by an fid in reverse chron order      |

#### Link Request

| Field         | Type              | Label | Description                                      |
| ------------- | ----------------- | ----- | ------------------------------------------------ |
| fid           | [uint64](#)       |       | Farcaster ID of the user who generated the Link  |
| link_type     | [string](#)       |       | Type of the Link being requested                 |
| target_fid    | [uint64](#)       |       | Fid of the target                                |

#### LinksByFid Request

| Field         | Type              | Label | Description                                         |
| ------------- | ----------------- | ----- | --------------------------------------------------- |
| fid           | [uint64](#)       |       | Farcaster ID of the user who generated the Link |
| link_type     | string            |       | Type of the Link being requested                |
| page_size     | uint32            |       | (optional) Type of the Link being requested     |
| page_token    | bytes             |       | (optional)Type of the Link being requested      |
| reverse       | boolean           |       | (optional) Ordering of the response             |

#### LinksByTarget Request

| Field         | Type         | Label | Description                                     |
| ------------- | ------------ | ----- | ----------------------------------------------- |
| target_fid    | [uint64](#)  |       | Farcaster ID of the user who generated the Link |
| link_type     | string       |       | (optional) Type of the Link being requested     |
| page_size     | uint32       |       | (optional) Type of the Link being requested     |
| page_token    | bytes        |       | (optional)Type of the Link being requested      |
| reverse       | boolean      |       | (optional) Ordering of the response             |



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
|  | [uint64](#uint64) |  |  |
| link_type | [string](#string) |  |  |
| page_size | [uint32](#uint32) | optional |  |
| page_token | [bytes](#bytes) | optional |  |
| reverse | [bool](#bool) | optional |  |

## 6. Verification Service

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

## 7. Event Service

Used to subscribe to real-time event updates from the Farcaster Hub

| Method Name | Request Type     | Response Type        | Description                      |
| ----------- | ---------------- | -------------------- | -------------------------------- |
| Subscribe   | SubscribeRequest | stream HubEvent      | Streams new Events as they occur |
| GetEvent    | EventRequest     | HubEvent             | Streams new Events as they occur |

#### SubscribeRequest

| Field       | Type           | Label    | Description                      |
| ----------- | -------------- | -------- | -------------------------------- |
| event_types | [EventType](#) | repeated | Types of events to subscribe to  |
| from_id     | uint64         | optional | Event ID to start streaming from |

### EventRequest

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| id | [uint64](#uint64) |  |  |

## 8. Submit Service

| Method Name   | Request Type | Response Type | Description                  |
| ------------- | ------------ | ------------- | ---------------------------- |
| SubmitMessage | Message      | Message       | Submits a Message to the Hub |

## 9. Contract Service

Used to query the Hubs for the state of the Farcaster Id Registry and Farcaster Name Registry contracts on Ethereum.

| Method Name          | Request Type             | Response Type     | Description                                            |
| -------------------- | ------------------------ | ----------------- | ------------------------------------------------------ |
| GetFids              | FidsRequest                    | FidsResponse      | Returns the most recent Fids that were registered      |
| GetIdRegistryEvent   | IdRegistryEventRequest | IdRegistryEvent   | Returns the most recent IdRegistryEvent for an Fid     |
| GetIdRegistryEventByAddress | IdRegistryEventByAddressRequest| IdRegistryEvent |  |
| GetNameRegistryEvent | NameRegistryEventRequest | NameRegistryEvent | Returns the most recent NameRegistryEvent for an Fname |

### FidsRequest

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| page_size | [uint32](#uint32) | optional |  |
| page_token | [bytes](#bytes) | optional |  |
| reverse | [bool](#bool) | optional |  |

#### Fids Response

| Field           | Type            | Label    | Description     |
| --------------- | --------------- | -------- | --------------- |
| fids            | [uint64](#)     | repeated | Fid of the user |
| next_page_token | [bytes](#bytes) | optional |                 |

### IdRegistryEventRequest

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| fid | [uint64](#uint64) |  |  |


### IdRegistryEventByAddressRequest

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| address | [bytes](#bytes) |  |  |


#### NameRegistryEvent Request

| Field | Type       | Label | Description                                                   |
| ----- | ---------- | ----- | ------------------------------------------------------------- |
| name  | [bytes](#) |       | Fname of the user whose NameRegistry event is being requested |


## 10. Username Proofs Service

| Method Name | Request Type | Response Type | Description |
| ----------- | ------------ | ------------- | ------------|
| GetUsernameProof | [UsernameProofRequest](#UsernameProofRequest) | [UserNameProof](#UserNameProof) | Username Proof |
| GetUserNameProofsByFid | [FidRequest](#FidRequest) | [UsernameProofsResponse](#UsernameProofsResponse) |  |

### UsernameProofRequest

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| name | [bytes](#bytes) |  |  |

### UsernameProofsResponse

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| proofs | [UserNameProof](#UserNameProof) | repeated |  |

### UserNameProof

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| timestamp | [uint64](#uint64) |  |  |
| name | [bytes](#bytes) |  |  |
| owner | [bytes](#bytes) |  |  |
| signature | [bytes](#bytes) |  |  |
| fid | [uint64](#uint64) |  |  |
| type | [UserNameType](#UserNameType) |  |  |


### UserNameProof

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| timestamp | [uint64](#uint64) |  |  |
| name | [bytes](#bytes) |  |  |
| owner | [bytes](#bytes) |  |  |
| signature | [bytes](#bytes) |  |  |
| fid | [uint64](#uint64) |  |  |
| type | [UserNameType](#UserNameType) |  |  |


## 11. Sync Service

| Method Name             | Request Type      | Response Type            | Description                                            |
| ----------------------- | ----------------- | ------------------------ | ------------------------------------------------------ |
| GetInfo                 | HubInfoRequest    | HubInfoResponse          | Returns metadata about the hub's state.                |
| GetSyncStatus           | SyncStatusRequest | SyncStatusResponse       | Returns the hub's sync status.  |
| GetAllSyncIdsByPrefix   | TrieNodePrefix    | SyncIds                  | TBD |
| GetAllMessagesBySyncIds | SyncIds           | MessagesResponse         | TBD |
| GetSyncMetadataByPrefix | TrieNodePrefix    | TrieNodeMetadataResponse | TBD |
| GetSyncSnapshotByPrefix | TrieNodePrefix    | TrieNodeSnapshotResponse | TBD |

### HubInfoRequest

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| db_stats | [bool](#bool) |  |  |

### HubInfoResponse
Response Types for the Sync RPC Methods

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| version | [string](#string) |  |  |
| is_syncing | [bool](#bool) |  |  |
| nickname | [string](#string) |  |  |
| root_hash | [string](#string) |  |  |
| db_stats | [DbStats](#DbStats) |  |  |

### SyncStatusRequest

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| peerId | [string](#string) | optional |  |

### SyncStatusResponse

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| is_syncing | [bool](#bool) |  |  |
| sync_status | [SyncStatus](#SyncStatus) | repeated |  |

#### SyncStatus

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| peerId | [string](#string) |  |  |
| inSync | [string](#string) |  |  |
| shouldSync | [bool](#bool) |  |  |
| divergencePrefix | [string](#string) |  |  |
| divergenceSecondsAgo | [int32](#int32) |  |  |
| theirMessages | [uint64](#uint64) |  |  |
| ourMessages | [uint64](#uint64) |  |  |
| lastBadSync | [int64](#int64) |  |  |

### TrieNodePrefix

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| prefix | [bytes](#bytes) |  |  |

### SyncIds

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| sync_ids | [bytes](#bytes) | repeated |  |

### TrieNodeMetadataResponse

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| prefix | [bytes](#bytes) |  |  |
| num_messages | [uint64](#uint64) |  |  |
| hash | [string](#string) |  |  |
| children | [TrieNodeMetadataResponse](#TrieNodeMetadataResponse) | repeated |  |

### TrieNodeSnapshotResponse

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| prefix | [bytes](#bytes) |  |  |
| excluded_hashes | [string](#string) | repeated |  |
| num_messages | [uint64](#uint64) |  |  |
| root_hash | [string](#string) |  |  |

### DbStats

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| num_messages | [uint64](#uint64) |  |  |
| num_fid_events | [uint64](#uint64) |  |  |
| num_fname_events | [uint64](#uint64) |  |  |

## 12. Storage Service

| Method Name | Request Type | Response Type | Description |
| ----------- | ------------ | ------------- | ------------|
| GetRentRegistryEvents | [.RentRegistryEventsRequest](#RentRegistryEventsRequest) | [.RentRegistryEventsResponse](#RentRegistryEventsResponse) |  |


### RentRegistryEvent

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| block_number | [uint32](#uint32) |  |  |
| block_hash | [bytes](#bytes) |  |  |
| transaction_hash | [bytes](#bytes) |  |  |
| log_index | [uint32](#uint32) |  |  |
| payer | [bytes](#bytes) |  |  |
| fid | [uint64](#uint64) |  |  |
| type | [StorageRegistryEventType](#StorageRegistryEventType) |  |  |
| units | [uint32](#uint32) |  |  |
| expiry | [uint32](#uint32) |  |  |

### StorageRegistryEventType


| Name | Number | Description |
| ---- | ------ | ----------- |
| STORAGE_REGISTRY_EVENT_TYPE_NONE | 0 |  |
| STORAGE_REGISTRY_EVENT_TYPE_RENT | 1 |  |
| STORAGE_REGISTRY_EVENT_TYPE_SET_PRICE | 2 |  |
| STORAGE_REGISTRY_EVENT_TYPE_SET_MAX_UNITS | 3 |  |
| STORAGE_REGISTRY_EVENT_TYPE_SET_DEPRECATION_TIMESTAMP | 4 |  |
| STORAGE_REGISTRY_EVENT_TYPE_SET_GRACE_PERIOD | 5 |  |

### RentRegistryEventsRequest


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| fid | [uint64](#uint64) |  |  |



### RentRegistryEventsResponse



| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| events | [RentRegistryEvent](#RentRegistryEvent) | repeated |  |


## 13. Admin Service

| Method Name | Request Type | Response Type | Description |
| ----------- | ------------ | ------------- | ------------|
| RebuildSyncTrie | [.Empty](#Empty) | [.Empty](#Empty) |  |
| DeleteAllMessagesFromDb | [.Empty](#Empty) | [.Empty](#Empty) |  |
| SubmitIdRegistryEvent | [.IdRegistryEvent](#IdRegistryEvent) | [.IdRegistryEvent](#IdRegistryEvent) |  |
| SubmitNameRegistryEvent | [.NameRegistryEvent](#NameRegistryEvent) | [.NameRegistryEvent](#NameRegistryEvent) |  |
| SubmitRentRegistryEvent | [.RentRegistryEvent](#RentRegistryEvent) | [.RentRegistryEvent](#RentRegistryEvent) |  |
| SubmitStorageAdminRegistryEvent | [.StorageAdminRegistryEvent](#StorageAdminRegistryEvent) | [.StorageAdminRegistryEvent](#StorageAdminRegistryEvent) |  |

### StorageAdminRegistryEventRequest


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| transaction_hash | [bytes](#bytes) |  |  |


### StorageAdminRegistryEvent

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| block_number | [uint32](#uint32) |  |  |
| block_hash | [bytes](#bytes) |  |  |
| transaction_hash | [bytes](#bytes) |  |  |
| log_index | [uint32](#uint32) |  |  |
| timestamp | [uint64](#uint64) |  |  |
| from | [bytes](#bytes) |  |  |
| type | [StorageRegistryEventType](#StorageRegistryEventType) |  |  |
| value | [bytes](#bytes) |  |  |


