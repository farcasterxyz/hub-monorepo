# Events

- [Hub Events](#hub-events)
- [Onchain Events](#onchain-events)

## Hub Events

Emitted when the internal state of a hub changes. Applications can subscribe to these events which are useful for staying in sync with the state of the Hub.

### MergeMessage

Emit when a new Farcaster Message is merged into a Hub.

| Name             | Type                            | Description                                                 |
| ---------------- | ------------------------------- | ----------------------------------------------------------- |
| id               | `number`                        | A unique id for the message                                 |
| type             | [`HubEventType`](#hubeventtype) | Always set to `MERGE_MESSAGE`                               |
| message          | `Message`                       | The message that was merged                                 |
| deletedMessages? | `Message[]`                     | (optional) The messages that were deleted as a side-effect. |

### PruneMessage

Emit when a Farcaster message is pruned from a set due to exceeding size or duration limits.

| Name    | Type                            | Description                   |
| ------- | ------------------------------- | ----------------------------- |
| id      | `number`                        | A unique id for the message   |
| type    | [`HubEventType`](#hubeventtype) | Always set to `PRUNE_MESSAGE` |
| message | `Message`                       | The message that was pruned   |

### RevokeMessage

Emit when a Farcaster message is revoked by the user.

| Name    | Type                            | Description                    |
| ------- | ------------------------------- | ------------------------------ |
| id      | `number`                        | A unique id for the message    |
| type    | [`HubEventType`](#hubeventtype) | Always set to `REVOKE_MESSAGE` |
| message | `Message`                       | The message that was revoked   |

### MergeIdRegistry

Emit when an IdRegistryEvent is merged into the Hub.

| Name            | Type                            | Description                             |
| --------------- | ------------------------------- | --------------------------------------- |
| id              | `number`                        | A unique id for the message             |
| type            | [`HubEventType`](#hubeventtype) | Always set to `MERGE_ID_REGISTRY_EVENT` |
| idRegistryEvent | `IdRegistryEvent`               | The message that was merged             |

### MergeNameRegistry

Emit when an NameRegistryEvent is merged into the Hub.

| Name              | Type                            | Description                               |
| ----------------- | ------------------------------- | ----------------------------------------- |
| id                | `number`                        | A unique id for the message               |
| type              | [`HubEventType`](#hubeventtype) | Always set to `MERGE_NAME_REGISTRY_EVENT` |
| nameRegistryEvent | `NameRegistryEvent`             | The message that was merged               |

## Onchain Events

Emitted by contracts whenever the ownership of fids or fnames changes.

### IdRegistryEvent

Emit when an onchain event occurs in the IdRegistry which registers or transfers a fid.

| Name            | Type                        | Description                                              |
| --------------- | --------------------------- | -------------------------------------------------------- |
| blockHash       | `Uint8Array`                | The block hash at which the transaction occurred.        |
| blockNumber     | `number`                    | The block number at which the transaction occurred.      |
| fid             | `Uint8Array`                | The fid being registered or transferred.                 |
| from            | `Uint8Array`                | The address that initiated the transaction.              |
| logIndex        | `number`                    | The log index of the event in the transaction.           |
| to              | `Uint8Array`                | The address which now owns the fid.                      |
| transactionHash | `Uint8Array`                | The hash of the transaction in which the event occurred. |
| type            | [`NameRegistryEventType`]() | The type of event which occurred.                        |

### NameRegistryEvent

Emit when an onchain event occurs in the NameRegistry which registers, transfers or renews an fname.

| Name            | Type                                              | Description                                              |
| --------------- | ------------------------------------------------- | -------------------------------------------------------- |
| blockHash       | `Uint8Array`                                      | The block hash at which the transaction occurred.        |
| blockNumber     | `number`                                          | The block number at which the transaction occurred.      |
| expiry          | `number`                                          | The timestamp at which the fname should expire.          |
| fname           | `Uint8Array`                                      | The fname being registered or renewed.                   |
| from            | `Uint8Array`                                      | The address that initiated the transaction.              |
| logIndex        | `number`                                          | The log index of the event in the transaction.           |
| to              | `Uint8Array`                                      | The address which owns the fname.                        |
| transactionHash | `Uint8Array`                                      | The hash of the transaction in which the event occurred. |
| type            | [`NameRegistryEventType`](#nameregistryeventtype) | The type of event which occurred.                        |

## Enumerations

### HubEventType

The Farcaster network that will accept the message.

| Name                                     | Number | Description                                       |
| ---------------------------------------- | ------ | ------------------------------------------------- |
| HUB_EVENT_TYPE_NONE                      | 0      |                                                   |
| HUB_EVENT_TYPE_MERGE_MESSAGE             | 1      | A message was merged into the Hub                 |
| HUB_EVENT_TYPE_PRUNE_MESSAGE             | 2      | A message was pruned because a limit was exceeded |
| HUB_EVENT_TYPE_REVOKE_MESSAGE            | 3      | A message was revoked by a user                   |
| HUB_EVENT_TYPE_MERGE_ID_REGISTRY_EVENT   | 4      | An fid was issued or transferred.                 |
| HUB_EVENT_TYPE_MERGE_NAME_REGISTRY_EVENT | 5      | An fname was issued, transferred or renewed.      |

### IdRegistryEventType

| Name                            | Number | Description                      |
| ------------------------------- | ------ | -------------------------------- |
| ID_REGISTRY_EVENT_TYPE_NONE     | 0      |                                  |
| ID_REGISTRY_EVENT_TYPE_REGISTER | 1      | A new fid was registered.        |
| ID_REGISTRY_EVENT_TYPE_TRANSFER | 2      | An existing fid was transferred. |

### NameRegistryEventType

| Name                              | Number | Description                         |
| --------------------------------- | ------ | ----------------------------------- |
| NAME_REGISTRY_EVENT_TYPE_NONE     | 0      |                                     |
| NAME_REGISTRY_EVENT_TYPE_TRANSFER | 1      | An fname was minted or transferred. |
| NAME_REGISTRY_EVENT_TYPE_RENEW    | 1      | An fname was renewed.               |
