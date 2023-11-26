import { Kysely, sql } from "kysely";
import { PARTITIONS } from "../env.js"; // This was experimental. Don't actually use it.

/**************************************************************************************************
  Notes about the patterns in this file:

  * Uses features introduced in Postgres 15, so this will not work on older versions.
   
  * Uses ULIDs as the surrogate key for most tables so that we don't rely on sequences, allowing
    tables to be partitioned in the future if needed. ULIDs still have temporal ordering unlike 
    most UUIDs.

  * Uses created_at/updated_at columns to refer to database row create/update time, NOT 
    the creation time of the entity on the Farcaster network itself. 
    Separate columns (e.g. "timestamp") represent when the content was created on Farcaster.

  * Declares columns in a particular order to minimize storage on disk. If the declaration order 
    looks odd, remember it's to reduce disk space. 
    See https://www.2ndquadrant.com/en/blog/on-rocks-and-sand/ for more info.

  * Uses bytea columns to store raw bytes instead of text columns with `0x` prefixed strings, since
    raw bytes reduce storage space, reduce index size, are faster to query (especially with joins), 
    and avoid case sensitivity issues when dealing with string comparison.

  * Uses B-tree indexes (the default) for most columns representing a hash digest, since you can 
    perform lookups on those hashes matching by prefix, whereas you can't do this with hash indexes.
  
  * Declares some indexes that we think might be useful for data analysis and general querying, 
    but which aren't actually required by the replicator itself.

  * Declares partial indexes (via a WHERE predicate) to reduce the size of the index and ensure
    only relevant rows are returned (e.g. ignoring soft-deleted rows, etc.)

  * Uses JSON columns instead of native Postgres array columns to significantly reduce on-disk 
    storage (JSON is treated like TEXT) at the cost of slightly slower querying time. JSON columns
    can also be more easily modified over time without requiring a schema migration.

  * Declares foreign keys to ensure correctness. This means that the replicator will not process 
    a message if it refers to content that has not yet been seen, since that would violate the FK 
    constraint. Instead, it will put the message into an unprocessed message queue and try again 
    once the content it references has been processed. If you want to remove data that was 
    pruned/revoked/deleted, you can hard delete the corresponding row in the messages table, and 
    the downstream tables referencing that message will also be deleted.
**************************************************************************************************/

// biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
const createPartitions = async (db: Kysely<any>, tableName: string, partitions: number) => {
  for (let i = 0; i < partitions; i++) {
    await sql
      .raw(`CREATE TABLE ${tableName}_${String(i).padStart(String(partitions).length, "0")} 
      PARTITION OF ${tableName} FOR VALUES WITH (MODULUS ${partitions}, REMAINDER ${i})`)
      .execute(db);
  }
};

// biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
export const up = async (db: Kysely<any>) => {
  // Used for generating random bytes in ULID creation
  await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`.execute(db);

  // ULID generation function for creating unique IDs without centralized coordination.
  // Avoids limitations of a monotonic (auto-incrementing) ID.
  await sql`CREATE FUNCTION generate_ulid() RETURNS uuid
    LANGUAGE sql STRICT PARALLEL SAFE
    RETURN ((lpad(to_hex((floor((EXTRACT(epoch FROM clock_timestamp()) * (1000)::numeric)))::bigint), 12, '0'::text) || encode(public.gen_random_bytes(10), 'hex'::text)))::uuid;
  `.execute(db);

  // CHAIN EVENTS --------------------------------------------------------------------------------
  await db.schema
    .createTable("chainEvents")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`generate_ulid()`))
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("blockTimestamp", "timestamptz", (col) => col.notNull())
    .addColumn("fid", "bigint", (col) => col.notNull())
    .addColumn("chainId", "bigint", (col) => col.notNull())
    .addColumn("blockNumber", "bigint", (col) => col.notNull())
    .addColumn("transactionIndex", sql`smallint`, (col) => col.notNull())
    .addColumn("logIndex", sql`smallint`, (col) => col.notNull())
    .addColumn("type", sql`smallint`, (col) => col.notNull())
    .addColumn("blockHash", "bytea", (col) => col.notNull())
    .addColumn("transactionHash", "bytea", (col) => col.notNull())
    .addColumn("body", "json", (col) => col.notNull())
    .addColumn("raw", "bytea", (col) => col.notNull())
    .$call((qb) =>
      PARTITIONS
        ? qb
            .addPrimaryKeyConstraint("chain_events_pkey", ["id", "fid"])
            .addUniqueConstraint("chain_events_block_number_log_index_fid_unique", ["blockNumber", "logIndex", "fid"])
            .modifyEnd(sql`PARTITION BY HASH (fid)`)
        : qb
            .addPrimaryKeyConstraint("chain_events_pkey", ["id"])
            .addUniqueConstraint("chain_events_block_number_log_index_unique", ["blockNumber", "logIndex"]),
    )
    .execute();

  await createPartitions(db, "chain_events", PARTITIONS);

  await db.schema.createIndex("chain_events_fid_index").on("chainEvents").column("fid").execute();

  await db.schema
    .createIndex("chain_events_block_hash_index")
    .on("chainEvents")
    .column("blockHash")
    .using("hash") // Smaller index size and faster lookup (equality comparisons only)
    .execute();

  await db.schema
    .createIndex("chain_events_block_timestamp_index")
    .on("chainEvents")
    .column("blockTimestamp")
    .execute();

  await db.schema
    .createIndex("chain_events_transaction_hash_index")
    .on("chainEvents")
    .column("transactionHash")
    .using("hash") // Smaller index size and faster lookup (equality comparisons only)
    .execute();

  // FIDS -----------------------------------------------------------------------------------------
  await db.schema
    .createTable("fids")
    .addColumn("fid", "bigint", (col) => col.notNull())
    .addPrimaryKeyConstraint("fids_pkey", ["fid"])
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("registeredAt", "timestamptz", (col) => col.notNull())
    .addColumn("chainEventId", "uuid", (col) => col.notNull())
    .addColumn("custodyAddress", "bytea", (col) => col.notNull())
    .addColumn("recoveryAddress", "bytea", (col) => col.notNull())
    .$call((qb) =>
      PARTITIONS
        ? qb
            .addForeignKeyConstraint(
              "fids_chain_event_id_fid_foreign",
              ["chainEventId", "fid"],
              "chainEvents",
              ["id", "fid"],
              (cb) => cb.onDelete("cascade"),
            )
            .modifyEnd(sql`PARTITION BY HASH (fid)`)
        : qb.addForeignKeyConstraint("fids_chain_event_id_foreign", ["chainEventId"], "chainEvents", ["id"], (cb) =>
            cb.onDelete("cascade"),
          ),
    )
    .execute();

  await createPartitions(db, "fids", PARTITIONS);

  // SIGNERS --------------------------------------------------------------------------------------
  await db.schema
    .createTable("signers")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`generate_ulid()`))
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("addedAt", "timestamptz", (col) => col.notNull())
    .addColumn("removedAt", "timestamptz")
    .addColumn("fid", "bigint", (col) => col.notNull())
    .addColumn("requesterFid", "bigint", (col) => col.notNull())
    .addColumn("addChainEventId", "uuid", (col) => col.notNull())
    .addColumn("removeChainEventId", "uuid")
    .addColumn("keyType", sql`smallint`, (col) => col.notNull())
    .addColumn("metadataType", sql`smallint`, (col) => col.notNull())
    .addColumn("key", "bytea", (col) => col.notNull())
    .addColumn("metadata", "json", (col) => col.notNull())
    .addUniqueConstraint("signers_fid_key_unique", ["fid", "key"])
    .addForeignKeyConstraint("signers_fid_foreign", ["fid"], "fids", ["fid"], (cb) => cb.onDelete("cascade"))
    .addForeignKeyConstraint("signers_requester_fid_foreign", ["requesterFid"], "fids", ["fid"], (cb) =>
      cb.onDelete("cascade"),
    )
    .$call((qb) =>
      PARTITIONS
        ? qb
            .addPrimaryKeyConstraint("signers_pkey", ["fid", "id"])
            .addForeignKeyConstraint(
              "signers_add_chain_event_id_foreign",
              ["addChainEventId", "fid"],
              "chainEvents",
              ["id", "fid"],
              (cb) => cb.onDelete("cascade"),
            )
            .addForeignKeyConstraint(
              "signers_remove_chain_event_id_foreign",
              ["removeChainEventId", "fid"],
              "chainEvents",
              ["id", "fid"],
              (cb) => cb.onDelete("cascade"),
            )
            .modifyEnd(sql`PARTITION BY HASH (fid)`)
        : qb
            .addPrimaryKeyConstraint("signers_pkey", ["id"])
            .addForeignKeyConstraint(
              "signers_add_chain_event_id_foreign",
              ["addChainEventId"],
              "chainEvents",
              ["id"],
              (cb) => cb.onDelete("cascade"),
            )
            .addForeignKeyConstraint(
              "signers_remove_chain_event_id_foreign",
              ["removeChainEventId"],
              "chainEvents",
              ["id"],
              (cb) => cb.onDelete("cascade"),
            ),
    )
    .execute();

  await createPartitions(db, "signers", PARTITIONS);

  await db.schema.createIndex("signers_fid_index").on("signers").column("fid").execute();

  await db.schema.createIndex("signers_requester_fid_index").on("signers").column("requesterFid").execute();

  // USERNAME PROOFS -------------------------------------------------------------------------------
  await db.schema
    .createTable("usernameProofs")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`generate_ulid()`).primaryKey())
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("timestamp", "timestamptz", (col) => col.notNull())
    .addColumn("deletedAt", "timestamptz")
    .addColumn("fid", "bigint", (col) => col.notNull())
    .addColumn("type", sql`smallint`, (col) => col.notNull())
    .addColumn("username", "text", (col) => col.notNull())
    .addColumn("signature", "bytea", (col) => col.notNull())
    .addColumn("owner", "bytea", (col) => col.notNull())
    .addUniqueConstraint("username_proofs_username_timestamp_unique", ["username", "timestamp"])
    .addForeignKeyConstraint("username_proofs_fid_foreign", ["fid"], "fids", ["fid"], (cb) => cb.onDelete("cascade"))
    .execute();

  // FNAMES ----------------------------------------------------------------------------------------
  await db.schema
    .createTable("fnames")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`generate_ulid()`).primaryKey())
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("registeredAt", "timestamptz", (col) => col.notNull())
    .addColumn("deletedAt", "timestamptz")
    .addColumn("fid", "bigint", (col) => col.notNull())
    .addColumn("type", sql`smallint`, (col) => col.notNull())
    .addColumn("username", "text", (col) => col.notNull())
    .addUniqueConstraint("fnames_fid_unique", ["fid"])
    .addUniqueConstraint("fnames_username_unique", ["username"])
    .addForeignKeyConstraint("fnames_fid_foreign", ["fid"], "fids", ["fid"], (cb) => cb.onDelete("cascade"))
    .execute();

  // MESSAGES -------------------------------------------------------------------------------------
  await db.schema
    .createTable("messages")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`generate_ulid()`))
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("timestamp", "timestamptz", (col) => col.notNull())
    .addColumn("deletedAt", "timestamptz")
    .addColumn("prunedAt", "timestamptz")
    .addColumn("revokedAt", "timestamptz")
    .addColumn("fid", "bigint", (col) => col.notNull())
    .addColumn("type", sql`smallint`, (col) => col.notNull())
    .addColumn("hashScheme", sql`smallint`, (col) => col.notNull())
    .addColumn("signatureScheme", sql`smallint`, (col) => col.notNull())
    .addColumn("hash", "bytea", (col) => col.notNull())
    .addColumn("signature", "bytea", (col) => col.notNull())
    .addColumn("signer", "bytea", (col) => col.notNull())
    .addColumn("body", "json", (col) => col.notNull())
    .addColumn("raw", "bytea", (col) => col.notNull())
    .addForeignKeyConstraint("messages_fid_foreign", ["fid"], "fids", ["fid"], (cb) => cb.onDelete("cascade"))
    .addForeignKeyConstraint("messages_signer_fid_foreign", ["fid", "signer"], "signers", ["fid", "key"], (cb) =>
      cb.onDelete("cascade"),
    )
    .$call((qb) =>
      PARTITIONS
        ? qb
            .addPrimaryKeyConstraint("messages_pkey", ["fid", "id"])
            .addUniqueConstraint("messages_hash_unique", ["fid", "hash"])
            .modifyEnd(sql`PARTITION BY HASH (fid)`)
        : qb.addPrimaryKeyConstraint("messages_pkey", ["id"]).addUniqueConstraint("messages_hash_unique", ["hash"]),
    )
    .execute();

  await createPartitions(db, "messages", PARTITIONS);

  await db.schema.createIndex("messages_timestamp_index").on("messages").columns(["timestamp"]).execute();

  await db.schema.createIndex("messages_fid_index").on("messages").columns(["fid"]).execute();

  await db.schema.createIndex("messages_signer_index").on("messages").columns(["signer"]).execute();

  // CASTS ----------------------------------------------------------------------------------------
  await db.schema
    .createTable("casts")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`generate_ulid()`))
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("timestamp", "timestamptz", (col) => col.notNull())
    .addColumn("deletedAt", "timestamptz")
    .addColumn("fid", "bigint", (col) => col.notNull())
    .addColumn("parentFid", "bigint")
    .addColumn("hash", "bytea", (col) => col.notNull())
    .addColumn("rootParentHash", "bytea")
    .addColumn("parentHash", "bytea")
    .addColumn("rootParentUrl", "text")
    .addColumn("parentUrl", "text")
    .addColumn("text", "text", (col) => col.notNull())
    .addColumn("embeds", "json", (col) => col.notNull().defaultTo(sql`'[]'`))
    .addColumn("mentions", "json", (col) => col.notNull().defaultTo(sql`'[]'`))
    .addColumn("mentionsPositions", "json", (col) => col.notNull().defaultTo(sql`'[]'`))
    .addForeignKeyConstraint("casts_fid_foreign", ["fid"], "fids", ["fid"], (cb) => cb.onDelete("cascade"))
    .$call((qb) =>
      PARTITIONS
        ? qb
            .addPrimaryKeyConstraint("casts_pkey", ["id", "fid"])
            .addUniqueConstraint("casts_hash_fid_unique", ["hash", "fid"])
            .addForeignKeyConstraint("casts_hash_foreign", ["hash", "fid"], "messages", ["hash", "fid"], (cb) =>
              cb.onDelete("cascade"),
            )
            .modifyEnd(sql`PARTITION BY HASH (fid)`)
        : qb
            .addPrimaryKeyConstraint("casts_pkey", ["id"])
            .addUniqueConstraint("casts_hash_unique", ["hash"])
            .addForeignKeyConstraint("casts_hash_foreign", ["hash"], "messages", ["hash"], (cb) =>
              cb.onDelete("cascade"),
            ),
    )
    .execute();

  await createPartitions(db, "casts", PARTITIONS);

  await db.schema
    .createIndex("casts_active_fid_timestamp_index")
    .on("casts")
    .columns(["fid", "timestamp"])
    .where(sql.ref("deleted_at"), "is", null) // Only index active (non-deleted) casts
    .execute();

  await db.schema.createIndex("casts_timestamp_index").on("casts").columns(["timestamp"]).execute();

  await db.schema
    .createIndex("casts_parent_hash_index")
    .on("casts")
    .column("parentHash")
    .where("parentHash", "is not", null)
    .execute();

  await db.schema
    .createIndex("casts_root_parent_hash_index")
    .on("casts")
    .columns(["rootParentHash"])
    .where("rootParentHash", "is not", null)
    .execute();

  await db.schema
    .createIndex("casts_parent_url_index")
    .on("casts")
    .columns(["parentUrl"])
    .where("parentUrl", "is not", null)
    .execute();

  await db.schema
    .createIndex("casts_root_parent_url_index")
    .on("casts")
    .columns(["rootParentUrl"])
    .where("rootParentUrl", "is not", null)
    .execute();

  // REACTIONS -------------------------------------------------------------------------------------
  await db.schema
    .createTable("reactions")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`generate_ulid()`))
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("timestamp", "timestamptz", (col) => col.notNull())
    .addColumn("deletedAt", "timestamptz")
    .addColumn("fid", "bigint", (col) => col.notNull())
    .addColumn("targetCastFid", "bigint")
    .addColumn("type", sql`smallint`, (col) => col.notNull())
    .addColumn("hash", "bytea", (col) => col.notNull())
    .addColumn("targetCastHash", "bytea")
    .addColumn("targetUrl", "text")
    .addForeignKeyConstraint("reactions_fid_foreign", ["fid"], "fids", ["fid"], (cb) => cb.onDelete("cascade"))
    .$call((qb) =>
      PARTITIONS
        ? qb
            .addPrimaryKeyConstraint("reactions_pkey", ["id", "fid"])
            .addUniqueConstraint("reactions_hash_fid_unique", ["hash", "fid"])
            .addForeignKeyConstraint("reactions_hash_foreign", ["hash", "fid"], "messages", ["hash", "fid"], (cb) =>
              cb.onDelete("cascade"),
            )
            .addForeignKeyConstraint(
              "reactions_target_hash_fid_foreign",
              ["targetCastHash", "targetCastFid"],
              "casts",
              ["hash", "fid"],
              (cb) => cb.onDelete("cascade"),
            )
            .modifyEnd(sql`PARTITION BY HASH (fid)`)
        : qb
            .addPrimaryKeyConstraint("reactions_pkey", ["id"])
            .addUniqueConstraint("reactions_hash_unique", ["hash"])
            .addForeignKeyConstraint("reactions_hash_foreign", ["hash"], "messages", ["hash"], (cb) =>
              cb.onDelete("cascade"),
            )
            .addForeignKeyConstraint("reactions_target_hash_foreign", ["targetCastHash"], "casts", ["hash"], (cb) =>
              cb.onDelete("cascade"),
            ),
    )
    .execute();

  await createPartitions(db, "reactions", PARTITIONS);

  // Since a reaction is for a CastId or a URL, we need a separate uniqueness constraint for each case.
  // Since you can't use partial indexes with unique constraints, we need to use a single constraint
  // that includes both targetCastHash and targetUrl together, where one or the other is null.
  // We need `nulls not distinct` so that null is treated like a normal value (requires PG 15+)
  await sql`ALTER TABLE reactions ADD CONSTRAINT reactions_fid_type_target_cast_hash_target_url_unique UNIQUE NULLS NOT DISTINCT (fid, type, target_cast_hash, target_url)`.execute(
    db,
  );

  await db.schema
    .createIndex("reactions_active_fid_timestamp_index")
    .on("reactions")
    .columns(["fid", "timestamp"])
    .where(sql.ref("deleted_at"), "is", null) // Only index active (non-deleted) reactions
    .execute();

  await db.schema
    .createIndex("reactions_target_cast_hash_index")
    .on("reactions")
    .column("targetCastHash")
    .where("targetCastHash", "is not", null)
    .execute();

  await db.schema
    .createIndex("reactions_target_url_index")
    .on("reactions")
    .columns(["targetUrl"])
    .where("targetUrl", "is not", null)
    .execute();

  // LINKS ----------------------------------------------------------------------------------------
  await db.schema
    .createTable("links")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`generate_ulid()`))
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("timestamp", "timestamptz", (col) => col.notNull())
    .addColumn("deletedAt", "timestamptz")
    .addColumn("fid", "bigint", (col) => col.notNull())
    .addColumn("targetFid", "bigint", (col) => col.notNull())
    .addColumn("displayTimestamp", "timestamptz")
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("hash", "bytea", (col) => col.notNull())
    .addForeignKeyConstraint("links_fid_foreign", ["fid"], "fids", ["fid"], (cb) => cb.onDelete("cascade"))
    .addForeignKeyConstraint("links_target_fid_foreign", ["targetFid"], "fids", ["fid"], (cb) => cb.onDelete("cascade"))
    .$call((qb) =>
      PARTITIONS
        ? qb
            .addPrimaryKeyConstraint("links_pkey", ["id", "fid"])
            .addUniqueConstraint("links_fid_hash_unique", ["hash", "fid"])
            .modifyEnd(sql`PARTITION BY HASH (fid)`)
        : qb.addPrimaryKeyConstraint("links_pkey", ["id"]).addUniqueConstraint("links_hash_unique", ["hash"]),
    )
    .execute();

  await createPartitions(db, "links", PARTITIONS);

  // While as of time of writing (Sept 2023) targetFid is always not null, there is a potential
  // future where it could be null, depending on the link type.
  // We therefore need `nulls not distinct` so that null is treated like a normal value (requires PG 15+)
  // Requires raw SQL until https://github.com/kysely-org/kysely/issues/711 is implemented.
  await sql`CREATE UNIQUE INDEX links_fid_target_fid_type_unique ON links (fid, target_fid, type) NULLS NOT DISTINCT`.execute(
    db,
  );

  // VERIFICATIONS ---------------------------------------------------------------------------------
  await db.schema
    .createTable("verifications")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`generate_ulid()`))
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("timestamp", "timestamptz", (col) => col.notNull())
    .addColumn("deletedAt", "timestamptz")
    .addColumn("fid", "bigint", (col) => col.notNull())
    .addColumn("hash", "bytea", (col) => col.notNull())
    .addColumn("signerAddress", "bytea", (col) => col.notNull())
    .addColumn("blockHash", "bytea", (col) => col.notNull())
    .addColumn("signature", "bytea", (col) => col.notNull())
    .addUniqueConstraint("verifications_signer_address_fid_unique", ["signerAddress", "fid"])
    .addForeignKeyConstraint("verifications_fid_foreign", ["fid"], "fids", ["fid"], (cb) => cb.onDelete("cascade"))
    .$call((qb) =>
      PARTITIONS
        ? qb
            .addPrimaryKeyConstraint("verifications_pkey", ["id", "fid"])
            .addForeignKeyConstraint(
              "verifications_hash_foreign",
              ["hash", "fid"],
              "messages",
              ["hash", "fid"],
              (cb) => cb.onDelete("cascade"),
            )
            .modifyEnd(sql`PARTITION BY HASH (fid)`)
        : qb
            .addPrimaryKeyConstraint("verifications_pkey", ["id"])
            .addForeignKeyConstraint("verifications_hash_foreign", ["hash"], "messages", ["hash"], (cb) =>
              cb.onDelete("cascade"),
            ),
    )
    .execute();

  await createPartitions(db, "verifications", PARTITIONS);

  await db.schema
    .createIndex("verifications_fid_timestamp_index")
    .on("verifications")
    .columns(["fid", "timestamp"])
    .execute();

  // USER DATA ------------------------------------------------------------------------------------
  await db.schema
    .createTable("userData")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`generate_ulid()`))
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("timestamp", "timestamptz", (col) => col.notNull())
    .addColumn("deletedAt", "timestamptz")
    .addColumn("fid", "bigint", (col) => col.notNull())
    .addColumn("type", sql`smallint`, (col) => col.notNull())
    .addColumn("hash", "bytea", (col) => col.notNull())
    .addColumn("value", "text", (col) => col.notNull())
    .addUniqueConstraint("user_data_fid_type_unique", ["fid", "type"])
    .addForeignKeyConstraint("user_data_fid_foreign", ["fid"], "fids", ["fid"], (cb) => cb.onDelete("cascade"))
    .$call((qb) =>
      PARTITIONS
        ? qb
            .addPrimaryKeyConstraint("user_data_pkey", ["id", "fid"])
            .addUniqueConstraint("user_data_fid_hash_unique", ["fid", "hash"])
            .addForeignKeyConstraint(
              "user_data_hash_fid_foreign",
              ["hash", "fid"],
              "messages",
              ["hash", "fid"],
              (cb) => cb.onDelete("cascade"),
            )
            .modifyEnd(sql`PARTITION BY HASH (fid)`)
        : qb
            .addPrimaryKeyConstraint("user_data_pkey", ["id"])
            .addUniqueConstraint("user_data_hash_unique", ["hash"])
            .addForeignKeyConstraint("user_data_hash_foreign", ["hash"], "messages", ["hash"], (cb) =>
              cb.onDelete("cascade"),
            ),
    )
    .execute();

  await createPartitions(db, "user_data", PARTITIONS);

  // STORAGE ALLOCATIONS ---------------------------------------------------------------------------
  await db.schema
    .createTable("storageAllocations")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`generate_ulid()`))
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("rentedAt", "timestamptz", (col) => col.notNull())
    .addColumn("expiresAt", "timestamptz", (col) => col.notNull())
    .addColumn("chainEventId", "uuid", (col) => col.notNull())
    .addColumn("fid", "bigint", (col) => col.notNull())
    .addColumn("units", sql`smallint`, (col) => col.notNull())
    .addColumn("payer", "bytea", (col) => col.notNull())
    .addUniqueConstraint("storage_chain_event_id_fid_unique", ["chainEventId", "fid"])
    .$call((qb) =>
      PARTITIONS
        ? qb
            .addPrimaryKeyConstraint("storage_allocations_pkey", ["id", "fid"])
            .modifyEnd(sql`PARTITION BY HASH (fid)`)
            .addForeignKeyConstraint(
              "fids_chain_event_id_fid_foreign",
              ["chainEventId", "fid"],
              "chainEvents",
              ["id", "fid"],
              (cb) => cb.onDelete("cascade"),
            )
        : qb
            .addPrimaryKeyConstraint("storage_allocations_pkey", ["id"])
            .addForeignKeyConstraint("fids_chain_event_id_foreign", ["chainEventId"], "chainEvents", ["id"], (cb) =>
              cb.onDelete("cascade"),
            ),
    )
    .execute();

  await createPartitions(db, "storage_allocations", PARTITIONS);

  await db.schema
    .createIndex("storage_allocations_fid_expires_at_index")
    .on("storageAllocations")
    .columns(["fid", "expiresAt"])
    .execute();
};

// biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
export const down = async (db: Kysely<any>) => {
  // Delete in reverse order of above so that foreign keys are not violated.
  await db.schema.dropTable("storageAllocations").ifExists().execute();
  await db.schema.dropTable("userData").ifExists().execute();
  await db.schema.dropTable("verifications").ifExists().execute();
  await db.schema.dropTable("links").ifExists().execute();
  await db.schema.dropTable("reactions").ifExists().execute();
  await db.schema.dropTable("casts").ifExists().execute();
  await db.schema.dropTable("messages").ifExists().execute();
  await db.schema.dropTable("fnames").ifExists().execute();
  await db.schema.dropTable("usernameProofs").ifExists().execute();
  await db.schema.dropTable("signers").ifExists().execute();
  await db.schema.dropTable("fids").ifExists().execute();
  await db.schema.dropTable("chainEvents").ifExists().execute();
};
