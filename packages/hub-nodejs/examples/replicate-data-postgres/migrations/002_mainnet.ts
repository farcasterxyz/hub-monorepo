import { Kysely, sql } from "kysely";

// rome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
export const up = async (db: Kysely<any>) => {
  await db.schema.alterTable("fnames").addColumn("fid", "bigint").execute();

  await db.schema.alterTable("signers").dropConstraint("signers_hash_unique").execute();

  await db.schema.alterTable("signers").dropConstraint("signers_hash_foreign").execute();

  // await db.schema.alterTable("signers").addUniqueConstraint("signers_fid_signer_unique", ["fid", "signer"]).execute();

  await db.schema
    .alterTable("signers")
    .alterColumn("hash", (c) => c.dropNotNull())
    .alterColumn("custodyAddress", (c) => c.dropNotNull())
    .execute();

  await db.schema
    .alterTable("fnames")
    .alterColumn("expiresAt", (c) => c.dropNotNull())
    .alterColumn("custodyAddress", (c) => c.dropNotNull())
    .addColumn("deletedAt", "timestamp")
    .execute();

  await db.schema
    .createTable("storage")
    .addColumn("id", "bigint", (col) => col.generatedAlwaysAsIdentity().primaryKey())
    .addColumn("createdAt", "timestamp", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("updatedAt", "timestamp", (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn("deletedAt", "timestamp")
    .addColumn("timestamp", "timestamp", (col) => col.notNull())
    .addColumn("fid", "bigint", (col) => col.notNull())
    .addColumn("units", "bigint", (col) => col.notNull())
    .addColumn("expiry", "timestamp", (col) => col.notNull())
    .execute();
};

// rome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
export const down = async (db: Kysely<any>) => {
  await db.schema.alterTable("fnames").dropColumn("fid").execute();

  await db.schema
    .alterTable("signers")
    .alterColumn("hash", (c) => c.setNotNull())
    .alterColumn("custodyAddress", (c) => c.setNotNull())
    .execute();
  await db.schema.alterTable("signers").addUniqueConstraint("signers_hash_unique", ["hash"]).execute();
  // await db.schema.alterTable("signers").dropConstraint("signers_fid_signer_unique").execute();
  await db.schema
    .alterTable("signers")
    .addForeignKeyConstraint("signers_hash_foreign", ["hash"], "messages", ["hash"])
    .execute();

  await db.schema
    .alterTable("fnames")
    .alterColumn("expiresAt", (c) => c.setNotNull())
    .alterColumn("custodyAddress", (c) => c.setNotNull())
    .dropColumn("deletedAt")
    .execute();

  await db.schema.dropTable("storage").execute();
};
