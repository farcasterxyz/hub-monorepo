import { Kysely, sql } from "kysely";

// biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
export const up = async (db: Kysely<any>) => {
  // Casts -------------------------------------------------------------------------------------
  await db.schema
    .createTable("onchain_events")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`generate_ulid()`))
    .addColumn("chainId", "bigint", (col) => col.notNull())
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("blockTimestamp", "timestamptz", (col) => col.notNull())
    .addColumn("fid", "bigint", (col) => col.notNull())
    .addColumn("blockNumber", "bigint", (col) => col.notNull())
    .addColumn("logIndex", "integer", (col) => col.notNull())
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("txHash", "bytea", (col) => col.notNull())
    .addColumn("body", "json", (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex("onchain_events_block_log_index")
    .on("onchain_events")
    .columns(["blockNumber", "logIndex"])
    .execute();

  await db.schema.createIndex("onchain_events_fid_type").on("onchain_events").columns(["fid", "type"]).execute();
};
