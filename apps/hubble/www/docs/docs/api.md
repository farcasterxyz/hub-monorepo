# API

Documentation for gRPC endpoints exposed by Hubble.

We recommend using a library like [hub-nodejs](https://github.com/farcasterxyz/hub-monorepo/tree/main/packages/hub-nodejs) to interact with Hubble's gRPC APIs.

## 1. OnChainEvents Service

Used to retrieve on chain events (id registry, signers, storage rent)

| Method Name                        | Request Type                    | Response Type         | Description                                                                                                 |
|------------------------------------|---------------------------------|-----------------------|-------------------------------------------------------------------------------------------------------------|
| GetOnChainSigner                   | SignerRequest                   | OnChainEvent          | Returns the onchain event for an active signer for an Fid                                                   |
| GetOnChainSignersByFid             | FidRequest                      | OnChainEventResponse  | Returns all active signers add events for a Fid                                                            |
| GetIdRegistryOnChainEvent          | FidRequest                      | OnChainEvent          | Returns the most recent register/transfer on chain event for a fid                                         |
| GetIdRegistryOnChainEventByAddress | IdRegistryEventByAddressRequest | OnChainEvent          | Returns the registration/transfer event by address if it exists (allows looking up fid by address)          |
| GetCurrentStorageLimitsByFid       | FidRequest                      | StorageLimitsResponse | Returns current storage limits for all stores for a Fid                                                    |
| GetOnChainEvents                   | OnChainEventRequest             | OnChainEventResponse  | Returns all on chain events filtered by type for an Fid (includes inactive signers and expired rent events) |
| GetFids                            | FidsRequest                     | FidsResponse          | Returns the most recent Fids that were registered                                                           |


#### Signer Request

| Field  | Type        | Label | Description                                       |
|--------|-------------|-------|---------------------------------------------------|
| fid    | [uint64](#) |       | Farcaster ID of the user who generated the Signer |
| signer | [bytes](#)  |       | Public Key of the Signer                          |

#### Fid Request

| Field      | Type        | Label | Description                                 |
|------------|-------------|-------|---------------------------------------------|
| fid        | [uint64](#) |       | Farcaster ID of the user                    |
| page_size  | uint32      |       | (optional) Type of the Link being requested |
| page_token | bytes       |       | (optional)Type of the Link being requested  |
| reverse    | boolean     |       | (optional) Ordering of the response         |

#### FidsRequest

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

#### IdRegistryEventByAddressRequest

| Field   | Type            | Label | Description |
|---------|-----------------|-------|-------------|
| address | [bytes](#bytes) |       |             |


#### StorageLimitsResponse

| Field  | Type              | Label    | Description                   |
|--------|-------------------|----------|-------------------------------|
| limits | [StorageLimit](#) | repeated | Storage limits per store type |

#### StorageLimit

| Field      | Type           | Label | Description                                            |
|------------|----------------|-------|--------------------------------------------------------|
| store_type | [StoreType](#) |       | The specific type being managed by the store           |
| limit      | [uint64](#)    |       | The limit of the store type, scaled by the user's rent |


#### OnChainEventResponse

| Field  | Type                          | Label    | Description |
|--------|-------------------------------|----------|-------------|
| events | [OnChainEvent](#onchainevent) | repeated |             |
| next_page_token | [bytes](#bytes) | optional |                 |

## 2. UserData Service

Users to retrieve the current metadata associated with a user

| Method Name                  | Request Type    | Response Type         | Description                             |
|------------------------------|-----------------|-----------------------|-----------------------------------------|
| GetUserData                  | UserDataRequest | Message               | Returns a specific UserData for an Fid  |
| GetUserDataByFid             | FidRequest      | MessagesResponse      | Returns all UserData for an Fid         |
| GetAllUserDataMessagesByFid  | FidRequest      | MessagesResponse      | Returns all UserData for an Fid         |

#### UserData Request

| Field          | Type              | Label | Description                                         |
| -------------- | ----------------- | ----- | --------------------------------------------------- |
| fid            | [uint64](#)       |       | Farcaster ID of the user who generated the UserData |
| user_data_type | [UserDataType](#) |       | Type of UserData being requested                    |

#### Messages Response

| Field           | Type            | Label    | Description       |
| --------------- | --------------- | -------- | ----------------- |
| messages        | [Message](#)    | repeated | Farcaster Message |
| next_page_token | [bytes](#bytes) | optional |                   |

## 3. Cast Service

Used to retrieve valid casts or tombstones for deleted casts

| Method Name             | Request Type | Response Type    | Description                                                    |
| ----------------------- | ------------ | ---------------- | -------------------------------------------------------------- |
| GetCast                 | CastId       | Message          | Returns a specific Cast                                        |
| GetCastsByFid           | FidRequest   | MessagesResponse | Returns CastAdds for an Fid in reverse chron order             |
| GetCastsByParent        | CastId       | MessagesResponse | Returns CastAdd replies to a given Cast in reverse chron order |
| GetCastsByMention       | FidRequest   | MessagesResponse | Returns CastAdds that mention an Fid in reverse chron order    |
| GetAllCastMessagesByFid | FidRequest   | MessagesResponse | Returns Casts for a Fid in reverse chron order                |

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
| GetAllReactionMessagesByFid | FidRequest               | MessagesResponse | Returns Reactions made by a Fid in reverse chron order      |

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

| Method Name                     | Request Type         | Response Type    | Description                                                  |
| ------------------------------- | -------------------- | ---------------- | ------------------------------------------------------------ |
| GetLink                         | LinkRequest          | Message          | Returns a specific Link                                  |
| GetLinksByFid                   | LinksByFidRequest    | MessagesResponse | Returns Links made by an fid in reverse chron order      |
| GetLinksByTarget                | LinksByTargetRequest | MessagesResponse | Returns LinkAdds for a given target in reverse chron order |
| GetAllLinkMessagesByFid         | FidRequest           | MessagesResponse | Returns Links made by an fid in reverse chron order      |
| GetLinkCompactStateMessageByFid | FidRequest           | MessagesResponse | Returns the LinkCompactState message made by a fid       |

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

## 13. Admin Service

| Method Name                     | Request Type                      | Response Type | Description |
|---------------------------------|-----------------------------------| ------------- | ------------|
| RebuildSyncTrie                 | [.Empty](#Empty)                  | [.Empty](#Empty) |  |
| DeleteAllMessagesFromDb         | [.Empty](#Empty)                  | [.Empty](#Empty) |  |
| SubmitOnChainEvent              | [.OnChainEvent](#IdRegistryEvent) | [.IdRegistryEvent](#IdRegistryEvent) |  |

