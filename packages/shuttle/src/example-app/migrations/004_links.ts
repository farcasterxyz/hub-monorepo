import { Kysely, sql } from "kysely";

// biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
export const up = async (db: Kysely<any>) => {
  // Casts -------------------------------------------------------------------------------------
  await db.schema
    .createTable("links")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`generate_ulid()`))
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("deletedAt", "timestamptz")
    .addColumn("timestamp", "timestamptz", (col) => col.notNull())
    .addColumn("fid", "bigint", (col) => col.notNull())
    .addColumn("target_fid", "bigint")
    .addColumn("hash", "bytea", (col) => col.notNull())
    .addColumn("type", "text", (col) => col.notNull())
    .execute();

  await db.schema
    .createIndex("links_fid_timestamp_index")
    .on("links")
    .columns(["fid", "timestamp"])
    .where(sql.ref("deleted_at"), "is", null) // Only index active (non-deleted) links
    .execute();
};
