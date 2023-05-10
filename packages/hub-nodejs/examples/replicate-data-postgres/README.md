## Replicate hub data into Postgres

This example shows you how you can quickly start ingesting data from a Farcaster hub into a traditional database like Postgres.

* [Caveats](#caveats)
* [Running the example](#running-the-example)
    * [Run locally](#run-locally-recommended-for-quick-experimentation)
    * [Run on Render](#run-on-render)
* [What does the example do?](#what-does-the-example-do)
* [Examples of SQL queries](#examples-of-sql-queries)
* [Database tables](#database-tables)

## Caveats

There are some important points to consider when using this example:

* **This is not intended to be used in production!**
  It makes some simplifying assumptions (e.g. inserting messages one at a time instead of batching together, etc.) in order to be easily understandable.

* If you are running the Node.js application and Postgres DB on different servers, the time it takes to sync will be heavily dependent on the latency between those servers, making a process that normally takes a few hours take days instead. It is strongly recommended that you connect them using a private network, rather than connecting them via public internet. Many platforms like Supabase, Vercel, etc. (at time of writing) don't give you a low-latency connection due to their architecture.

* While the created tables have some indexes for query performance, they are not built to consider all possible query patterns.

## Running the example

Below are instructions for two different ways to run the example. If you want to get started quickly with as few commands as possible, we recommend you run the example locally.

* [Run locally](#run-locally-recommended-for-quick-experimentation)
* [Run on Render](#run-on-render)

These two options are recommended because they are relatively quick and also allow you to run the application and Postgres database with low latency between each other, which makes downloading data from the hubs much faster. However, you can get the example running with any platform you choose.

### Run locally (recommended for quick experimentation)

#### Requirements

* 1GB of memory
* 4GB of free disk space
* Docker. If you're running macOS, run `brew bundle && open -a Docker` from this example's directory. Otherwise instructions can be found [here](https://docs.docker.com/get-docker/).

#### Instructions

1. Clone the repo locally: `git clone git@github.com:farcasterxyz/hub-monorepo.git`
2. Navigate to this directory with `cd packages/hub-nodejs/examples/replicate-data-postgres`
3. Run `docker compose up`

Once the Docker images have finished downloading, you should start to see messages like:

```
replicate-data-postgres-app-1   | [01:06:37.823] INFO (86): [Backfill] Starting FID 1/12830
replicate-data-postgres-app-1   | [01:06:38.478] INFO (86): [Backfill] Completed FID 1/12830
replicate-data-postgres-app-1   | [01:06:38.478] INFO (86): [Backfill] Starting FID 2/12830
...
replicate-data-postgres-app-1   | [01:06:50.142] INFO (86): [Sync] Processing merge event 304011714592768 from stream
replicate-data-postgres-app-1   | [01:06:50.142] INFO (86): [Sync] Processing merge event 304011726786560 from stream
...
```

If messages like these are appearing, replication is working as expected. Any other messages can usually be ignored.

#### Connecting to Postgres

While it will take a few hours to fully sync all data from the hub, you can start to query data right away.

Run:

```sh
docker compose exec postgres psql -U app hub
```

See [Examples of SQL queries](#examples-of-sql-queries) below.

#### Cleanup

If you're done with the example and no longer need the data locally:

* Go to the example's directory (`cd packages/hub-nodejs/examples/replicate-data-postgres`)
* Run `docker compose down --rmi all -v`.

This will remove the Docker images, NPM packages, and Postgres data.

### Run on Render

[Render](https://render.com/) allows you to run a Node.js application and a Postgres server in the same network.

#### Requirements

* Register an account at Render and create a project.
* You'll need a subscription to pay for the **Standard** instance type for Postgres ($20/mth at time of writing).

#### Instructions

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

#### Connecting to Postgres

While it will take a few hours to fully sync all data from the hub, you can start to query data right away.

1. Go to the Postgres instance you created and select the **Shell** tab.
2. Within the shell, run `psql $POSTGRES_URL` to open a DB console session.

See [Examples of SQL queries](#examples-of-sql-queries) below.

#### Cleanup

If you're done with the example and no longer need the data, you can delete the Background Worker and Postgres instances.

## What does the example do?

This example application does two things:

1. Backfills all historical data from a hub, one user (FID) at a time.
2. Syncs live events from the hub.

If left running, the backfill will eventually complete and the subscription will continue processing live events in real-time. You can therefore start the application and it will remain up to date with the hub you connected to.

When stopping/restarting the application the backfill process will start over again, but the existing data already downloaded will be preserved. It is therefore safe to start/stop the application as you please.

## Examples of SQL queries

Note that you'll need to wait until a full backfill has completed before some queries will return correct data. But you could start querying data for specific users (especially those with lower FIDs) after a few minutes and start to get data.

Get the 10 most recent casts for a user:
```sql
select timestamp, text, mentions, mentions_positions, embeds from casts where fid = 2 order by timestamp desc limit 10
```

Get the number of likes for a user's last 20 casts:
```sql
select timestamp, (select count(*) from reactions where reaction_type = 1 and target_hash = casts.hash and target_fid = casts.fid) from casts where fid = 3 order by timestamp desc limit 20
```

Get the top-20 most recasted casts:
```sql
select c.hash, count(*) as recast_count from casts as c join reactions as r on r.target_hash = c.hash and r.target_fid = c.fid where r.reaction_type = 2 group by c.hash order by recast_count desc limit 20
```

See the list of tables below for the schema.

## Database tables

The following tables are automatically created in the Postgres DB:

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
