# Events


### HubEvent

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| type | [HubEventType](#HubEventType) |  |  |
| id | [uint64](#uint64) |  |  |
| body | [MergeMessageBody](#mergemessagebody), <br> [PruneMessageBody](#prunemessagebody), <br> [RevokeMessageBody](#revokemessagebody), <br>[MergeNameRegistryEventBody](#mergenameregistryeventbody), <br>[MergeUserNameProofBody](#mergeusernameproofbody), <br>[MergeRentRegistryEventBody](#mergerentregistryeventbody), <br>[MergeStorageAdminRegistryEventBody](#mergestorageadminregistryeventbody) | oneOf |  |

### HubEventType

| Name | Number | Description |
| ---- | ------ | ----------- |
| HUB_EVENT_TYPE_NONE | 0 |  |
| HUB_EVENT_TYPE_MERGE_MESSAGE | 1 |  |
| HUB_EVENT_TYPE_PRUNE_MESSAGE | 2 |  |
| HUB_EVENT_TYPE_REVOKE_MESSAGE | 3 |  |
| HUB_EVENT_TYPE_MERGE_ID_REGISTRY_EVENT | 4 |  |
| HUB_EVENT_TYPE_MERGE_NAME_REGISTRY_EVENT | 5 |  |
| HUB_EVENT_TYPE_MERGE_USERNAME_PROOF | 6 |  |
| HUB_EVENT_TYPE_MERGE_RENT_REGISTRY_EVENT | 7 |  |
| HUB_EVENT_TYPE_MERGE_STORAGE_ADMIN_REGISTRY_EVENT | 8 |  |


<a name="-MergeIdRegistryEventBody"></a>

### MergeIdRegistryEventBody

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| id_registry_event | [IdRegistryEvent](#idregistryevent) |  |  |

<a name="-IdRegistryEvent"></a>

### IdRegistryEvent

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| block_number | [uint32](#uint32) |  |  |
| block_hash | [bytes](#bytes) |  |  |
| transaction_hash | [bytes](#bytes) |  |  |
| log_index | [uint32](#uint32) |  |  |
| fid | [uint64](#uint64) |  |  |
| to | [bytes](#bytes) |  |  |
| type | [IdRegistryEventType](#IdRegistryEventType) |  |  |
| from | [bytes](#bytes) |  |  |

<a name="-IdRegistryEventType"></a>

### IdRegistryEventType


| Name | Number | Description |
| ---- | ------ | ----------- |
| ID_REGISTRY_EVENT_TYPE_NONE | 0 |  |
| ID_REGISTRY_EVENT_TYPE_REGISTER | 1 |  |
| ID_REGISTRY_EVENT_TYPE_TRANSFER | 2 |  |


<a name="-MergeMessageBody"></a>

### MergeMessageBody

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| message | [Message](#Message) |  |  |
| deleted_messages | [Message](#Message) | repeated |  |

<a name="-MergeNameRegistryEventBody"></a>

### MergeNameRegistryEventBody

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| name_registry_event | [NameRegistryEvent](#NameRegistryEvent) |  |  |

<a name="-NameRegistryEvent"></a>

### NameRegistryEvent

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| block_number | [uint32](#uint32) |  |  |
| block_hash | [bytes](#bytes) |  |  |
| transaction_hash | [bytes](#bytes) |  |  |
| log_index | [uint32](#uint32) |  |  |
| fname | [bytes](#bytes) |  |  |
| from | [bytes](#bytes) |  |  |
| to | [bytes](#bytes) |  |  |
| type | [NameRegistryEventType](#NameRegistryEventType) |  |  |
| expiry | [uint32](#uint32) |  |  |


<a name="-NameRegistryEventType"></a>

### NameRegistryEventType


| Name | Number | Description |
| ---- | ------ | ----------- |
| NAME_REGISTRY_EVENT_TYPE_NONE | 0 |  |
| NAME_REGISTRY_EVENT_TYPE_TRANSFER | 1 |  |
| NAME_REGISTRY_EVENT_TYPE_RENEW | 2 |  |


 

<a name="-MergeRentRegistryEventBody"></a>

### MergeRentRegistryEventBody


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| rent_registry_event | [RentRegistryEvent](#RentRegistryEvent) |  |  |


<a name="-MergeStorageAdminRegistryEventBody"></a>

### MergeStorageAdminRegistryEventBody

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| storage_admin_registry_event | [StorageAdminRegistryEvent](#StorageAdminRegistryEvent) |  |  |


<a name="-MergeUserNameProofBody"></a>

### MergeUserNameProofBody

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| username_proof | [UserNameProof](#UserNameProof) |  |  |
| deleted_username_proof | [UserNameProof](#UserNameProof) |  |  |
| username_proof_message | [Message](#Message) |  |  |
| deleted_username_proof_message | [Message](#Message) |  |  |

<a name="-PruneMessageBody"></a>

### PruneMessageBody

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| message | [Message](#Message) |  |  |


<a name="-RevokeMessageBody"></a>

### RevokeMessageBody


| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| message | [Message](#Message) |  |  |


<a name="-HubEventType"></a>



 

 
