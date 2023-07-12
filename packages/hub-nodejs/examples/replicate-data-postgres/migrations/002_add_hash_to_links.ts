import { Kysely, sql } from "kysely";
import { Database } from "../db";

export const up = async (db: Kysely<Database>) => {
  await db.schema
    .alterTable("links")
    .addColumn("hash", sql`bytea`, (col) => col.notNull())
    .execute();
};

export const down = async (db: Kysely<Database>) => {
  await db.schema.alterTable("links").dropColumn("hash").execute();
};
