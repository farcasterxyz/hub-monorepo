import { Kysely, sql } from 'kysely';

export const up = async (db: Kysely<any>) => {
  await db.schema
    .alterTable('links')
    .addColumn('hash', sql`bytea`, (col) => col.notNull())
    .execute();
};

export const down = async (db: Kysely<any>) => {
  await db.schema.alterTable('links').dropColumn('hash').execute();
};