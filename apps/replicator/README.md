# Replicator

A Node.js application that synchronizes a Farcaster Hub with a Postgres DB.

When the app is run, the replicator fetches historical data from the hub, which can take a few hours. Once backfilled, the replicator will then stream new events and messages into the database. The replicator will run fastest if the hub it communicates with is on the same private network (or same machine) as the replicator itself. If running the replicator and hub on the same machine, total sync time can be under 20 minutes with a modern laptop.

## Run locally

Sets up the Node.js application and Postgres DB locally using Docker containers. We recommend using this for quick experimentation.

### Requirements

Note: these are the bare minimum and are likely to increase as the network increases in size and activity.

* 2GB of memory
* 4GB of free disk space

### Instructions

1. Run: `curl -sSL https://download.farcaster.xyz/bootstrap-replicator.sh | bash`
2. Answer the prompts.

Once the Docker images have finished downloading, you should start to see messages like:

```
[13:24:18.141] INFO (73940): Backfill 13.42% complete. Estimated time remaining: 46 minutes, 41 seconds
[13:24:23.228] INFO (73940): Backfill 13.52% complete. Estimated time remaining: 46 minutes, 50 seconds
[13:24:28.389] INFO (73940): Backfill 13.60% complete. Estimated time remaining: 47 minutes, 3 seconds
[13:24:33.502] INFO (73940): Backfill 13.71% complete. Estimated time remaining: 47 minutes, 10 seconds
...
```

If you are connected to a hub over the internet (rather than on the same machine or private network) the increased latency will make this take longer, and you will likely need to wait some time before an estimation of the time remaining will appear. This is expected.

You may see messages out of order—this is fine. If messages like above are appearing, replication is working as expected.

Note that the number of messages in the Postgres table will **not** match the number in the hub, because the replicator doesn't backfill "Remove" messages (like `CastRemove` and `ReactionRemove`) since these technically indicate an absence of content, not the presence.

### Connecting to Postgres

While it will take a few hours to fully sync all data from the hub, you can start to query data right away.

Run:

```sh
cd ~/replicator
docker compose exec postgres psql -U replicator replicator
```

See [Examples of SQL queries](#examples-of-sql-queries) below.

### Cleanup

If you're done with and no longer need the data locally:

* Go to the install directory `~/replicator`
* Run `./replicator.sh down`

## Examples of SQL queries

Once some data is populated, you can start to query it using SQL. Here are some examples:

Get the 10 most recent casts for a user:
```sql
select timestamp, text, mentions, mentions_positions, embeds from casts where fid = 2 order by timestamp desc limit 10;
```

Get the number of likes for a user's last 20 casts:
```sql
select timestamp, (select count(*) from reactions where type = 1 and target_cast_hash = casts.hash and target_cast_fid = casts.fid) from casts where fid = 3 order by timestamp desc limit 20;
```

Get the top-20 most recasted casts:
```sql
select c.hash, count(*) as recast_count from casts as c join reactions as r on r.target_cast_hash = c.hash and r.target_cast_fid = c.fid where r.type = 2 group by c.hash order by recast_count desc limit 20;
```

See the list of tables below for the schema.

## Database Schema

The following tables are created in Postgres DB where data from the Hubs are stored:

### `chain_events`

All on-chain events received from the hub event stream are stored in this table. These events represent any on-chain action including registrations, transfers, signer additions/removals, storage rents, etc. Events are never deleted (i.e. this table is append-only).

Column Name | Data Type | Description
-- | -- | --
id | `uuid` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp with time zone` | When the row was first created in this DB (not the same as the message timestamp!)
block_timestamp | `timestamp with time zone` | Timestamp of the block this event was emitted in UTC.
fid | `bigint` | FID of the user that signed the message.
chain_id | `bigint` | Chain ID.
block_number | `bigint` | Block number of the block this event was emitted.
transaction_index | `smallint` | Index of the transaction in the block.
log_index | `smallint` | Index of the log event in the block.
type | `smallint` | Type of chain event.
block_hash | `bytea` | Hash of the block where this event was emitted.
transaction_hash | `bytea` | Hash of the transaction triggering this event.
body | `json` | JSON representation of the chain event body (changes shape based on `type`).
raw | `bytea` | Raw bytes representing the serialized `OnChainEvent` [protobuf](https://protobuf.dev/).

### `fids`

Stores all registered FIDs on the Farcaster network.

Column Name | Data Type | Description
-- | -- | --
fid | `bigint` | FID of the user (primary key)
created_at | `timestamp with time zone` | When the row was first created in this DB (not the same as registration date!)
updated_at | `timestamp with time zone` | When the row was last updated.
registered_at | `timestamp with time zone` | Timestamp of the block in which the user was registered.
chain_event_id | `uuid` | ID of the row in the `chain_events` table corresponding to this FID's initial registration.
custody_address | `bytea` | Address that owns the FID.
recovery_address | `bytea` | Address that can initiate a recovery for this FID.

### `signers`

Stores all registered signers.

Column Name | Data Type | Description
-- | -- | --
id | `uuid` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp with time zone` | When the row was first created in this DB (not the same as when the key was created on the network!)
updated_at | `timestamp with time zone` | When the row was last updated.
added_at | `timestamp with time zone` | Timestamp of the block where this signer was added.
removed_at | `timestamp with time zone` | Timestamp of the block where this signer was removed.
fid | `bigint` | FID of the user that authorized this signer.
requester_fid | `bigint` | FID of the user/app that requested this signer.
add_chain_event_id | `uuid` | ID of the row in the `chain_events` table corresponding to the addition of this signer.
remove_chain_event_id | `uuid` | ID of the row in the `chain_events` table corresponding to the removal of this signer.
key_type | `smallint` | Type of key.
metadata_type | `smallint` | Type of metadata.
key | `bytea` | Public key bytes.
metadata | `bytea` | Metadata bytes as stored on the blockchain.

### `username_proofs`

Stores all username proofs that have been seen. This includes proofs that are no longer valid, which are soft-deleted
via the `deleted_at` column. When querying usernames, you probably want to query the `fnames` table directly, rather
than this table.

Column Name | Data Type | Description
-- | -- | --
id | `uuid` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp with time zone` | When the row was first created in this DB (not the same as when the key was created on the network!)
updated_at | `timestamp with time zone` | When the row was last updated.
timestamp | `timestamp with time zone` | Timestamp of the proof message.
deleted_at | `timestamp with time zone` | When this proof was revoked or otherwise invalidated.
fid | `bigint` | FID that the username in the proof belongs to.
type | `smallint` | Type of proof (either fname or ENS).
username | `text` | Username, e.g. `dwr` if an fname, or `dwr.eth` if an ENS name.
signature | `bytea` | Proof signature.
owner | `bytea` | Address of the wallet that owns the ENS name, or the wallet that provided the proof signature.

### `fnames`

Stores all usernames that are currently registered. Note that in the case a username is deregistered, the row is soft-deleted
via the `deleted_at` column until a new username is registered for the given FID.

Column Name | Data Type | Description
-- | -- | --
id | `uuid` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp with time zone` | When the row was first created in this DB (not the same as when the key was created on the network!)
updated_at | `timestamp with time zone` | When the row was last updated.
registered_at | `timestamp with time zone` | Timestamp of the username proof message.
deleted_at | `timestamp with time zone` | When the proof was revoked or the fname was otherwise deregistered from this user.
fid | `bigint` | FID the username belongs to.
type | `smallint` | Type of username (either fname or ENS).
username | `text` | Username, e.g. `dwr` if an fname, or `dwr.eth` if an ENS name.

### `messages`

All Farcaster messages retrieved from the hub are stored in this table. Messages are never deleted, only soft-deleted (i.e. marked as deleted but not actually removed from the DB).

Column Name | Data Type | Description
-- | -- | --
id | `uuid` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp with time zone` | When the row was first created in this DB (not the same as the message timestamp!)
updated_at | `timestamp with time zone` | When the row was last updated.
timestamp | `timestamp with time zone` | Message timestamp in UTC.
deleted_at | `timestamp with time zone` | When the message was deleted by the hub (e.g. in response to a `CastRemove` message, etc.)
pruned_at | `timestamp with time zone` | When the message was pruned by the hub.
revoked_at | `timestamp with time zone` | When the message was revoked by the hub due to revocation of the signer that signed the message.
fid | `bigint` | FID of the user that signed the message.
type | `smallint` | Message type.
hash_scheme | `smallint` | Message hash scheme.
signature_scheme | `smallint` | Message hash scheme.
hash | `bytea` | Message hash.
signature | `bytea` | Message signature.
signer | `bytea` | Signer used to sign this message.
body | `json` | JSON representation of the body of the message.
raw | `bytea` | Raw bytes representing the serialized message [protobuf](https://protobuf.dev/).

### `casts`

Represents a cast authored by a user.

Column Name | Data Type | Description
-- | -- | --
id | `uuid` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp with time zone` | When the row was first created in this DB (not the same as the message timestamp!)
updated_at | `timestamp with time zone` | When the row was last updated.
timestamp | `timestamp with time zone` | Message timestamp in UTC.
deleted_at | `timestamp with time zone` | When the cast was considered deleted/revoked/pruned by the hub (e.g. in response to a `CastRemove` message, etc.)
fid | `bigint` | FID of the user that signed the message.
parent_fid | `bigint` | If this cast was a reply, the FID of the author of the parent cast. `null` otherwise.
hash | `bytea` | Message hash.
root_parent_hash | `bytea` | If this cast was a reply, the hash of the original cast in the reply chain. `null` otherwise.
parent_hash | `bytea` | If this cast was a reply, the hash of the parent cast. `null` otherwise.
root_parent_url | `text` | If this cast was a reply, then the URL that the original cast in the reply chain was replying to.
parent_url | `text` | If this cast was a reply to a URL (e.g. an NFT, a web URL, etc.), the URL. `null` otherwise.
text | `text` | The raw text of the cast with mentions removed.
embeds | `json` | Array of URLs or cast IDs that were embedded with this cast.
mentions | `json` | Array of FIDs mentioned in the cast.
mentions_positions | `json` | UTF8 byte offsets of the mentioned FIDs in the cast.

### `reactions`

Represents a user reacting (liking or recasting) content.

Column Name | Data Type | Description
-- | -- | --
id | `uuid` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp with time zone` | When the row was first created in this DB (not the same as the message timestamp!)
updated_at | `timestamp with time zone` | When the row was last updated.
timestamp | `timestamp with time zone` | Message timestamp in UTC.
deleted_at | `timestamp with time zone` | When the reaction was considered deleted by the hub (e.g. in response to a `ReactionRemove` message, etc.)
fid | `bigint` | FID of the user that signed the message.
target_cast_fid | `bigint` | If target was a cast, the FID of the author of the cast. `null` otherwise.
type | `smallint` | Type of reaction.
hash | `bytea` | Message hash.
target_cast_hash | `bytea` | If target was a cast, the hash of the cast. `null` otherwise.
target_url | `text` | If target was a URL (e.g. NFT, a web URL, etc.), the URL. `null` otherwise.

### `links`

Represents a link between two FIDs (e.g. a follow, subscription, etc.)

Column Name | Data Type | Description
-- | -- | --
id | `uuid` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp with time zone` | When the row was first created in this DB (not when the link itself was created on the network!)
updated_at | `timestamp with time zone` | When the row was last updated
timestamp | `timestamp with time zone` | Message timestamp in UTC.
deleted_at | `timestamp with time zone` | When the link was considered deleted by the hub (e.g. in response to a `LinkRemoveMessage` message, etc.)
fid | `bigint` | Farcaster ID (the user ID).
target_fid | `bigint` | Farcaster ID of the target user.
display_timestamp | `timestamp with time zone` | When the row was last updated.
type | `string` | Type of connection between users, e.g. `follow`.
hash | `bytea` | Message hash.

### `verifications`

Represents a user verifying something on the network. Currently, the only verification is proving ownership of an Ethereum wallet address.

Column Name | Data Type | Description
-- | -- | --
id | `uuid` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp with time zone` | When the row was first created in this DB (not the same as the message timestamp!)
updated_at | `timestamp with time zone` | When the row was last updated.
timestamp | `timestamp with time zone` | Message timestamp in UTC.
deleted_at | `timestamp with time zone` | When the verification was considered deleted by the hub (e.g. in response to a `VerificationRemove` message, etc.)
fid | `bigint` | FID of the user that signed the message.
hash | `bytea` | Message hash.
signer_address | `bytea` | Address of the wallet being verified.
block_hash | `bytea` | Block hash of the latest block at the time the ownership was verified.
signature | `bytea` | Ownership proof signature.

### `user_data`

Represents data associated with a user (e.g. profile photo, bio, username, etc.)

Column Name | Data Type | Description
-- | -- | --
id | `uuid` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp with time zone` | When the row was first created in this DB (not the same as the message timestamp!)
updated_at | `timestamp with time zone` | When the row was last updated.
timestamp | `timestamp with time zone` | Message timestamp in UTC.
deleted_at | `timestamp with time zone` | When the data was considered deleted by the hub
fid | `bigint` | FID of the user that signed the message.
type | `smallint` | The type of user data (PFP, bio, username, etc.)
hash | `bytea` | Message hash.
value | `text` | The string value of the field.

### `storage_allocations`

Stores how many units of storage each FID has purchased, and when it expires.

Column Name | Data Type | Description
-- | -- | --
id | `uuid` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp with time zone` | When the row was first created in this DB
updated_at | `timestamp with time zone` | When the row was last updated.
rented_at | `timestamp with time zone` | Message timestamp in UTC.
expires_at | `timestamp with time zone` | When this storage allocation will expire.
chain_event_id | `uuid` | ID of the row in the `chain_events` table representing the on-chain event where storage was allocated.
fid | `bigint` | FID that owns the storage.
units | `smallint` | Number of storage units allocated.
payer | `bytea` | Wallet address that paid for the storage.
