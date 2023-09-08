## Table of Contents

1. [Hub Service](#1-hub-service)
   - [Submit Methods](#submit-methods)
   - [Event Methods](#event-methods)
   - [Cast Methods](#cast-methods)
   - [Reaction Methods](#reaction-methods)  
   - [User Data Methods](#user-data-methods)
   - [Name Registry Methods](#name-registry-methods)
   - [Username Proof Methods](#username-proof-methods)
   - [Verification Methods](#verification-methods)
   - [Signer Methods](#signer-methods)
   - [OnChain Methods](#onchain-methods)
   - [Link Methods](#link-methods)
   - [Bulk Methods](#bulk-methods)
   - [Sync Methods](#sync-methods)
2. [Admin Service](#2-admin-service)

## 1. Hub Service

### Submit Methods

| Method Name      | Request Type | Response Type | Description                  |
| ---------------- | ------------ | ------------- | ---------------------------- |
| SubmitMessage    | Message      | Message       | Submits a Message to the Hub |

### Event Methods  

| Method Name | Request Type     | Response Type        | Description                      |
| ----------- | ---------------- | -------------------- | -------------------------------- |
| Subscribe   | SubscribeRequest | stream HubEvent      | Streams new Events as they occur |
| GetEvent    | EventRequest     | HubEvent             | Get a specific event             |

### Cast Methods

| Method Name             | Request Type           | Response Type      | Description                                             |
| ----------------------- | ---------------------- | ------------------ | ------------------------------------------------------- |  
| GetCast                 | CastId                 | Message            | Get a specific Cast                                     |
| GetCastsByFid           | FidRequest             | MessagesResponse   | Get Casts for a user                                    | 
| GetCastsByParent        | CastsByParentRequest   | MessagesResponse   | Get replies to a Cast                                   |
| GetCastsByMention       | FidRequest             | MessagesResponse   | Get Casts mentioning a user                             |
| GetAllCastMessagesByFid | FidRequest             | MessagesResponse   | Get all Casts for a user                                |

### Reaction Methods

| Method Name                       | Request Type               | Response Type      | Description                                              |
| --------------------------------- | -------------------------- | ------------------ | -------------------------------------------------------- |
| GetReaction                       | ReactionRequest            | Message            | Get a specific Reaction                                  |  
| GetReactionsByFid                 | ReactionsByFidRequest      | MessagesResponse   | Get Reactions made by a user                             |
| GetReactionsByCast                | ReactionsByTargetRequest   | MessagesResponse   | Get Reactions for a Cast                                 |  
| GetReactionsByTarget              | ReactionsByTargetRequest   | MessagesResponse   | Get Reactions for any target                             |
| GetAllReactionMessagesByFid       | FidRequest                 | MessagesResponse   | Get all Reactions made by a user                         |

### User Data Methods

| Method Name                       | Request Type        | Response Type       | Description                                        |
| --------------------------------- | ------------------- | ------------------- | -------------------------------------------------- |
| GetUserData                       | UserDataRequest     | Message             | Get UserData for a user                            |
| GetUserDataByFid                  | FidRequest          | MessagesResponse    | Get UserData for a user                            |  
| GetAllUserDataMessagesByFid       | FidRequest          | MessagesResponse    | Get all UserData for a user                        |
| GetCurrentStorageLimitsByFid      | FidRequest          | StorageLimitsResponse | Get storage limits for a user                    |

### Name Registry Methods

| Method Name                  | Request Type             | Response Type       | Description                                         |
| ---------------------------- | ------------------------ | ------------------- | --------------------------------------------------- |
| GetNameRegistryEvent         | NameRegistryEventRequest | NameRegistryEvent   | Get NameRegistryEvent for a username                |

### Username Proof Methods

| Method Name                     | Request Type       | Response Type         | Description                                      |
| ------------------------------- | ------------------ | --------------------- | ------------------------------------------------ |
| GetUsernameProof                | UsernameProofRequest | UserNameProof        | Get UsernameProof                                 |
| GetUserNameProofsByFid          | FidRequest          | UsernameProofsResponse | Get UsernameProofs for a user                    |

### Verification Methods

| Method Name                     | Request Type      | Response Type      | Description                                       |
| ------------------------------- | ----------------- | ------------------ | ------------------------------------------------- |  
| GetVerification                 | VerificationRequest | Message           | Get a Verification                                |
| GetVerificationsByFid           | FidRequest        | MessagesResponse   | Get Verifications for a user                      |
| GetAllVerificationMessagesByFid | FidRequest        | MessagesResponse   | Get all Verifications for a user                  |

### Signer Methods

| Method Name                     | Request Type      | Response Type      | Description                                      |
| ------------------------------- | ----------------- | ------------------ | ------------------------------------------------ |
| GetSigner                       | SignerRequest     | Message            | Get a Signer                                     |
| GetSignersByFid                 | FidRequest        | MessagesResponse   | Get Signers for a user                           |
| GetAllSignerMessagesByFid       | FidRequest        | MessagesResponse   | Get all Signers for a user                       |

### OnChain Methods  

| Method Name                             | Request Type                | Response Type       | Description                                                |
| --------------------------------------- | --------------------------- | ------------------- | ---------------------------------------------------------- |
| GetOnChainSigner                        | SignerRequest               | OnChainEvent        | Get on-chain Signer event                                  |
| GetOnChainSignersByFid                  | FidRequest                  | OnChainEventResponse | Get on-chain Signer events for a user                      |
| GetOnChainEvents                        | OnChainEventRequest         | OnChainEventResponse | Get on-chain events                                        |
| GetIdRegistryOnChainEventByAddress      | IdRegistryEventByAddressRequest | OnChainEvent     | Get IdRegistry on-chain event by address                   |
| GetCurrentStorageLimitsByFid            | FidRequest                  | StorageLimitsResponse | Get on-chain storage limits by Fid                       |
| GetIdRegistryEvent                      | IdRegistryEventRequest      | IdRegistryEvent     | Get IdRegistryEvent                                       |
| GetIdRegistryEventByAddress             | IdRegistryEventByAddressRequest | IdRegistryEvent | Get IdRegistryEvent by address                            |

### Link Methods

| Method Name                  | Request Type       | Response Type      | Description                                      |
| ---------------------------- | ------------------ | ------------------ | ------------------------------------------------ |
| GetLink                      | LinkRequest        | Message            | Get a Link                                       |
| GetLinksByFid                | LinksByFidRequest  | MessagesResponse   | Get Links created by a user                      |
| GetLinksByTarget             | LinksByTargetRequest | MessagesResponse  | Get Links linking to a target                    |
| GetAllLinkMessagesByFid      | FidRequest         | MessagesResponse   | Get all Links created by a user                  |

### Bulk Methods

| Method Name                              | Request Type  | Response Type      | Description                                             |
| ---------------------------------------- | ------------- | ------------------ | ------------------------------------------------------- |
| GetAllCastMessagesByFid                  | FidRequest    | MessagesResponse   | Get all Casts for a user                                |
| GetAllReactionMessagesByFid              | FidRequest    | MessagesResponse   | Get all Reactions for a user                            |
| GetAllVerificationMessagesByFid          | FidRequest    | MessagesResponse   | Get all Verifications for a user                        |
| GetAllSignerMessagesByFid                | FidRequest    | MessagesResponse   | Get all Signers for a user                              |
| GetAllUserDataMessagesByFid              | FidRequest    | MessagesResponse   | Get all UserData for a user                             |
| GetAllLinkMessagesByFid                  | FidRequest    | MessagesResponse   | Get all Links for a user                                |

### Sync Methods

| Method Name                       | Request Type        | Response Type          | Description                                                 |
| --------------------------------- | ------------------- | ---------------------- | ----------------------------------------------------------- |
| GetInfo                           | HubInfoRequest      | HubInfoResponse        | Get hub info                                                |
| GetSyncStatus                     | SyncStatusRequest   | SyncStatusResponse     | Get sync status                                             |
| GetAllSyncIdsByPrefix             | TrieNodePrefix      | SyncIds                | Get sync IDs by prefix                                      |
| GetAllMessagesBySyncIds           | SyncIds             | MessagesResponse       | Get messages by sync IDs                                    |
| GetSyncMetadataByPrefix           | TrieNodePrefix      | TrieNodeMetadataResponse | Get sync metadata by prefix                              |
| GetSyncSnapshotByPrefix           | TrieNodePrefix      | TrieNodeSnapshotResponse | Get sync snapshot by prefix                               |

## 2. Admin Service

| Method Name                       | Request Type | Response Type | Description                                         |  
| --------------------------------- | ------------ | ------------- | --------------------------------------------------- |
| RebuildSyncTrie                   | Empty        | Empty         | Rebuild the sync trie                                |
| DeleteAllMessagesFromDb           | Empty        | Empty         | Delete all messages from the database                | 
| SubmitIdRegistryEvent             | IdRegistryEvent | IdRegistryEvent | Submit an IdRegistryEvent                       |
| SubmitNameRegistryEvent           | NameRegistryEvent | NameRegistryEvent | Submit a NameRegistryEvent                      |
| SubmitOnChainEvent                | OnChainEvent | OnChainEvent | Submit an OnChainEvent                         |