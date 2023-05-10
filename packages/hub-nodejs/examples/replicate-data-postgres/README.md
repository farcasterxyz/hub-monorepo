# Replicate Hub data to Postgres

An example Node.js application that keeps a PostgresDB in sync with a Farcaster Hub. Sync is performed using a two-phase process:

1. A streaming process that will receive new messages from the Hub
2. A backfill process that will receive older messages from the Hub

When the app is run, both processes are kicked off to bring the database in sync. The streaming ensures that new messages are pushed to the DB. The backfill downloads older messages and can take 1 or more hours depending on your configuration. It is stateful and can be resumed safely without re-ingesting all the data. 

## Run locally

Sets up the Node.js application and Postgres DB locally using docker containers. We recommend using this for quick experimentation. 

### Requirements

* 1GB of memory
* 4GB of free disk space
* Docker. If you're running macOS, run `brew bundle && open -a Docker` from this directory, otherwise go [here](https://docs.docker.com/get-docker/).

### Instructions

1. Clone the repo locally: `git clone git@github.com:farcasterxyz/hub-monorepo.git`
2. Navigate to this directory with `cd packages/hub-nodejs/examples/replicate-data-postgres`
3. Run `docker compose up`

Once the Docker images have finished downloading, you should start to see messages like:

```
replicate-data-postgres-app-1   | [04:46:13.051] INFO (61): [Backfill] Completed FID 1/12837. Estimated time remaining: 2h 6m 22.5s
replicate-data-postgres-app-1   | [04:46:13.053] INFO (61): [Backfill] Completed FID 5/12837. Estimated time remaining: 2h 33m 36.9s
replicate-data-postgres-app-1   | [04:46:13.767] INFO (61): [Backfill] Completed FID 6/12837. Estimated time remaining: 2h 33m 19.8s
replicate-data-postgres-app-1   | [04:46:14.636] INFO (61): [Backfill] Completed FID 7/12837. Estimated time remaining: 2h 41m 25.5s
...
replicate-data-postgres-app-1   | [04:56:50.142] INFO (86): [Sync] Processing merge event 304011714592768 from stream
replicate-data-postgres-app-1   | [04:56:50.142] INFO (86): [Sync] Processing merge event 304011726786560 from stream
...
```

You may see messages out of order—this is fine. If messages like above are appearing, replication is working as expected.

### Connecting to Postgres

While it will take a few hours to fully sync all data from the hub, you can start to query data right away.

Run:

```sh
docker compose exec postgres psql -U app hub
```

See [Examples of SQL queries](#examples-of-sql-queries) below.

### Cleanup

If you're done with the example and no longer need the data locally:

* Go to the example's directory (`cd packages/hub-nodejs/examples/replicate-data-postgres`)
* Run `docker compose down --rmi all -v`.

This will remove the Docker images, NPM packages, and Postgres data.

## Run on Render

Set up the Node.js application and Postgres DB in the cloud using [Render](https://render.com/). This will be slower than running locally.

### Requirements

* Register an account at Render and create a project.
* You'll need a subscription to pay for the **Standard** instance type for Postgres ($20/mth at time of writing).

### Instructions

1. Create a new **PostgreSQL** instance in your project. Select the **Standard** instance type (for the storage).
2. Create a new **Background Worker**, and connect a **Public Git repository** using the following URL: `https://github.com/farcasterxyz/hub-monorepo`
   * Select the `main` branch
   * Use the directory of this README for the **Root Directory** (`packages/hub-nodejs/examples/replicate-data-postgres`
   * Set `Node` as the **Runtime**
   * Set `yarn install` as the **Build Command**
   * Set `yarn start` as the **Start Command**
   * Select **Starter** for the instance type
   * Under the **Advanced** section:
      * Add a `POSTGRES_URL` environment variable, setting it to the **Internal Database URL** of the Postgres instance you created earlier.
      * Disable **Auto-Deploy**
   * Click **Create Background Worker**.

Go to the **Logs** tab and confirm the application is running.

```
[01:06:37.823] INFO (86): [Backfill] Starting FID 1/12830
[01:06:38.478] INFO (86): [Backfill] Completed FID 1/12830
[01:06:38.478] INFO (86): [Backfill] Starting FID 2/12830

[01:06:50.142] INFO (86): [Sync] Processing merge event 304011714592768 from stream
[01:06:50.142] INFO (86): [Sync] Processing merge event 304011726786560 from stream
...
```

If you see messages like the above, everything is working as expected.

### Connecting to Postgres

While it will take a few hours to fully sync all data from the hub, you can start to query data right away.

1. Go to the Postgres instance you created and select the **Shell** tab.
2. Within the shell, run `psql $POSTGRES_URL` to open a DB console session.

See [Examples of SQL queries](#examples-of-sql-queries) below.

### Cleanup

If you're done with the example and no longer need the data, you can delete the Background Worker and Postgres instances.

## Examples of SQL queries

Once some data is populated, you can start to query it using SQL. Here are some examples: 

Get the 10 most recent casts for a user:
```sql
select timestamp, text, mentions, mentions_positions, embeds from casts where fid = 2 order by timestamp desc limit 10;
```

Get the number of likes for a user's last 20 casts:
```sql
select timestamp, (select count(*) from reactions where reaction_type = 1 and target_hash = casts.hash and target_fid = casts.fid) from casts where fid = 3 order by timestamp desc limit 20;
```

Get the top-20 most recasted casts:
```sql
select c.hash, count(*) as recast_count from casts as c join reactions as r on r.target_hash = c.hash and r.target_fid = c.fid where r.reaction_type = 2 group by c.hash order by recast_count desc limit 20;
```

See the list of tables below for the schema.

## Database Schema

The example initializes the following tables in Postgres DB where data from the Hubs are stored:

### `messages`

All Farcaster messages retrieved from the hub are stored in this table. Messages are never deleted, only soft-deleted (i.e. marked as deleted but not actually removed from the DB).

Column Name | Data Type | Description
-- | -- | --
id | `bigint` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp without time zone` | When the row was first created in this DB (not the same as the message timestamp!)
updated_at | `timestamp without time zone` | When the row was last updated.
deleted_at | `timestamp without time zone` | When the message was deleted by the hub (e.g. in response to a `CastRemove` message, etc.)
pruned_at | `timestamp without time zone` | When the message was pruned by the hub.
revoked_at | `timestamp without time zone` | When the message was revoked by the hub due to revocation of the signer that signed the message.
timestamp | `timestamp without time zone` | Message timestamp in UTC.
fid | `bigint` | FID of the user that signed the message.
message_type | `smallint` | Message type.
hash | `bytea` | Message hash.
hash_scheme | `smallint` | Message hash scheme.
signature | `bytea` | Message signature.
signature_scheme | `smallint` | Message hash scheme.
signer | `bytea` | Signer used to sign this message.
raw | `bytea` | Raw bytes representing the serialized message [protobuf](https://protobuf.dev/).

### `casts`

Represents a cast authored by a user.

Column Name | Data Type | Description
-- | -- | --
id | `bigint` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp without time zone` | When the row was first created in this DB (not the same as the message timestamp!)
updated_at | `timestamp without time zone` | When the row was last updated.
deleted_at | `timestamp without time zone` | When the cast was considered deleted by the hub (e.g. in response to a `CastRemove` message, etc.)
timestamp | `timestamp without time zone` | Message timestamp in UTC.
fid | `bigint` | FID of the user that signed the message.
hash | `bytea` | Message hash.
parent_hash | `bytea` | If this cast was a reply, the hash of the parent cast. `null` otherwise.
parent_fid | `bigint` | If this cast was a reply, the FID of the author of the parent cast. `null` otherwise.
parent_url | `text` | If this cast was a reply to a URL (e.g. an NFT, a web URL, etc.), the URL. `null` otherwise.
text | `text` | The raw text of the cast with mentions removed.
embeds | `text[]` | Array of URLs that were embedded with this cast.
mentions | `bigint[]` | Array of FIDs mentioned in the cast.
mentions_positions | `smallint[]` | UTF8 byte offsets of the mentioned FIDs in the cast.

### `reactions`

Represents a user reacting (liking or recasting) content.

Column Name | Data Type | Description
-- | -- | --
id | `bigint` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp without time zone` | When the row was first created in this DB (not the same as the message timestamp!)
updated_at | `timestamp without time zone` | When the row was last updated.
deleted_at | `timestamp without time zone` | When the cast was considered deleted by the hub (e.g. in response to a `CastRemove` message, etc.)
timestamp | `timestamp without time zone` | Message timestamp in UTC.
fid | `bigint` | FID of the user that signed the message.
reaction_type | `smallint` | Type of reaction.
hash | `bytea` | Message hash.
target_hash | `bytea` | If target was a cast, the hash of the cast. `null` otherwise.
target_fid | `bigint` | If target was a cast, the FID of the author of the cast. `null` otherwise.
target_url | `text` | If target was a URL (e.g. NFT, a web URL, etc.), the URL. `null` otherwise.

### `verifications`

Represents a user verifying something on the network. Currently, the only verification is proving ownership of an Ethereum wallet address.

Column Name | Data Type | Description
-- | -- | --
id | `bigint` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp without time zone` | When the row was first created in this DB (not the same as the message timestamp!)
updated_at | `timestamp without time zone` | When the row was last updated.
deleted_at | `timestamp without time zone` | When the cast was considered deleted by the hub (e.g. in response to a `CastRemove` message, etc.)
timestamp | `timestamp without time zone` | Message timestamp in UTC.
fid | `bigint` | FID of the user that signed the message.
hash | `bytea` | Message hash.
claim | `jsonb` | JSON object in the form `{"address": "0x...", "blockHash": "0x...", "ethSignature": "0x..."}`. See [specification](https://github.com/farcasterxyz/protocol/blob/main/docs/SPECIFICATION.md#15-verifications) for details.

### `signers`

Represents signers that users have registered as authorized to sign Farcaster messages on the user's behalf.

Column Name | Data Type | Description
-- | -- | --
id | `bigint` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp without time zone` | When the row was first created in this DB (not the same as the message timestamp!)
updated_at | `timestamp without time zone` | When the row was last updated.
deleted_at | `timestamp without time zone` | When the cast was considered deleted by the hub (e.g. in response to a `CastRemove` message, etc.)
timestamp | `timestamp without time zone` | Message timestamp in UTC.
fid | `bigint` | FID of the user that signed the message.
hash | `bytea` | Message hash.
custody_address | `bytea` | The address of the FID that signed the `SignerAdd` message.
signer | `bytea` | The public key of the signer that was added.
name | `text` | User-specified human-readable name for the signer (e.g. the application it is used for).

### `user_data`

Represents data associated with a user (e.g. profile photo, bio, username, etc.)

Column Name | Data Type | Description
-- | -- | --
id | `bigint` | Generic identifier specific to this DB (a.k.a. [surrogate key](https://en.wikipedia.org/wiki/Surrogate_key))
created_at | `timestamp without time zone` | When the row was first created in this DB (not the same as the message timestamp!)
updated_at | `timestamp without time zone` | When the row was last updated.
deleted_at | `timestamp without time zone` | When the cast was considered deleted by the hub (e.g. in response to a `CastRemove` message, etc.)
timestamp | `timestamp without time zone` | Message timestamp in UTC.
fid | `bigint` | FID of the user that signed the message.
hash | `bytea` | Message hash.
type | `smallint` | The type of user data (PFP, bio, username, etc.)
value | `text` | The string value of the field.

### `fids`

Stores the custody address that owns a given FID (i.e. a Farcaster user).

Column Name | Data Type | Description
-- | -- | --
fid | `bigint` | Farcaster ID (the user ID)
created_at | `timestamp without time zone` | When the row was first created in this DB (not the same as when the user was created!)
updated_at | `timestamp without time zone` | When the row was last updated.
custody_address | `bytea` | ETH address of the wallet that owns the FID.
