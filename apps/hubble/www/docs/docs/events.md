# Events


### HubEvent

| Field | Type                                                                                                                                                                                                                                        | Label | Description |
|-------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------|-------------|
| type  | [HubEventType](#HubEventType)                                                                                                                                                                                                               |       |             |
| id    | [uint64](#uint64)                                                                                                                                                                                                                           |       |             |
| body  | [MergeMessageBody](#mergemessagebody), <br> [PruneMessageBody](#prunemessagebody), <br> [RevokeMessageBody](#revokemessagebody), <br>[MergeUserNameProofBody](#mergeusernameproofbody), <br>[MergeOnChainEventBody](#mergeonchaineventbody) | oneOf |             |

### HubEventType

| Name | Number | Description |
| ---- |--------| ----------- |
| HUB_EVENT_TYPE_NONE | 0      |  |
| HUB_EVENT_TYPE_MERGE_MESSAGE | 1      |  |
| HUB_EVENT_TYPE_PRUNE_MESSAGE | 2      |  |
| HUB_EVENT_TYPE_REVOKE_MESSAGE | 3      |  |
| HUB_EVENT_TYPE_MERGE_USERNAME_PROOF | 6      |  |
| HUB_EVENT_TYPE_MERGE_ON_CHAIN_EVENT | 9      |  |


<a name="-MergeMessageBody"></a>

### MergeMessageBody

| Field | Type | Label | Description |
| ----- | ---- | ----- | ----------- |
| message | [Message](#Message) |  |  |
| deleted_messages | [Message](#Message) | repeated |  |

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

<a name="-MergeOnChainEventBody"></a>

### MergeOnChainEventBody


| Field          | Type                          | Label | Description |
|----------------|-------------------------------| ----- | ----------- |
| on_chain_event | [OnChainEvent](#OnChainEvent) |  |  |


<a name="-HubEventType"></a>



 

 
