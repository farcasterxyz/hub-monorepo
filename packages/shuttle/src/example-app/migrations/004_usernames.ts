import { type Kysely, sql } from "kysely";

// biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
export const up = async (db: Kysely<any>) => {
  await db.schema
    .createTable("usernames")
    .addColumn("id", "uuid", (col) => col.defaultTo(sql`generate_ulid()`))
    .addColumn("createdAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("updatedAt", "timestamptz", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("deletedAt", "timestamptz")
    .addColumn("fid", "bigint", (col) => col.notNull())
    .addColumn("username", "text", (col) => col.notNull())
    .addColumn("custodyAddress", "bytea")
    .addColumn("proofTimestamp", "timestamptz", (col) => col.notNull())
    .addColumn("type", "integer", (col) => col.notNull())
    .execute();

  // Partial unique index: for each (fid, type), only one live username row at a time.
  // Use sql.ref so the predicate column lookup is unconstrained by the columns() narrowing,
  // and goes through Kysely's identifier handling so the schema set by WithSchemaPlugin sticks.
  await db.schema
    .createIndex("usernames_fid_type_username_unique")
    .on("usernames")
    .columns(["fid", "type", "username"])
    .where(sql.ref("deletedAt"), "is", null)
    .unique()
    .execute();
};
