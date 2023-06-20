import { Kysely, sql } from 'kysely';

export const up = async (db: Kysely<any>) => {
  await db.schema
    .createTable('hubSubscriptions')
    .addColumn('host', 'text', (col) => col.notNull().primaryKey())
    .addColumn('last_event_id', 'bigint')
    .execute();

  await db.schema
    .createTable('messages')
    .addColumn('id', 'bigint', (col) => col.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('deletedAt', 'timestamp')
    .addColumn('prunedAt', 'timestamp')
    .addColumn('revokedAt', 'timestamp')
    .addColumn('timestamp', 'timestamp', (col) => col.notNull())
    .addColumn('messageType', sql`smallint`, (col) => col.notNull())
    .addColumn('fid', 'bigint', (col) => col.notNull())
    .addColumn('hash', sql`bytea`, (col) => col.notNull())
    .addColumn('hashScheme', sql`smallint`, (col) => col.notNull())
    .addColumn('signature', sql`bytea`, (col) => col.notNull())
    .addColumn('signatureScheme', sql`smallint`, (col) => col.notNull())
    .addColumn('signer', sql`bytea`, (col) => col.notNull())
    .addColumn('raw', sql`bytea`, (col) => col.notNull())
    .addUniqueConstraint('messages_hash_unique', ['hash'])
    .execute();

  await db.schema.createIndex('messages_timestamp_index').on('messages').columns(['timestamp']).execute();

  await db.schema
    .createTable('casts')
    .addColumn('id', 'bigint', (col) => col.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('deletedAt', 'timestamp')
    .addColumn('timestamp', 'timestamp', (col) => col.notNull())
    .addColumn('fid', 'bigint', (col) => col.notNull())
    .addColumn('hash', sql`bytea`, (col) => col.notNull())
    .addColumn('parentHash', sql`bytea`)
    .addColumn('parentFid', 'bigint')
    .addColumn('parentUrl', 'text')
    .addColumn('text', 'text', (col) => col.notNull())
    .addColumn('embeds', sql`text[]`, (col) => col.notNull().defaultTo(sql`'{}'`))
    .addColumn('mentions', sql`bigint[]`, (col) => col.notNull().defaultTo(sql`'{}'`))
    .addColumn('mentionsPositions', sql`smallint[]`, (col) => col.notNull().defaultTo(sql`'{}'`))
    .addUniqueConstraint('casts_hash_unique', ['hash'])
    .addForeignKeyConstraint('casts_hash_foreign', ['hash'], 'messages', ['hash'])
    .execute();

  await db.schema.createIndex('casts_fid_timestamp_index').on('casts').columns(['fid', 'timestamp']).execute();
  await db.schema.createIndex('casts_timestamp_index').on('casts').columns(['timestamp']).execute();
  await db.schema
    .createIndex('casts_parent_hash_parent_fid_index')
    .on('casts')
    .columns(['parentHash', 'parentFid'])
    .where('parentHash', 'is not', null)
    .where('parentFid', 'is not', null)
    .execute();
  await db.schema
    .createIndex('casts_parent_url_index')
    .on('casts')
    .columns(['parentUrl'])
    .where('parentUrl', 'is not', null)
    .execute();

  await db.schema
    .createTable('reactions')
    .addColumn('id', 'bigint', (col) => col.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('deletedAt', 'timestamp')
    .addColumn('timestamp', 'timestamp', (col) => col.notNull())
    .addColumn('reactionType', sql`smallint`, (col) => col.notNull())
    .addColumn('fid', 'bigint', (col) => col.notNull())
    .addColumn('hash', sql`bytea`, (col) => col.notNull())
    .addColumn('targetHash', sql`bytea`)
    .addColumn('targetFid', 'bigint')
    .addColumn('targetUrl', 'text')
    .addUniqueConstraint('reactions_hash_unique', ['hash'])
    .addForeignKeyConstraint('reactions_hash_foreign', ['hash'], 'messages', ['hash'])
    .execute();

  await db.schema.createIndex('reactions_fid_timestamp_index').on('reactions').columns(['fid', 'timestamp']).execute();
  await db.schema
    .createIndex('reactions_target_hash_target_fid_index')
    .on('reactions')
    .columns(['targetHash', 'targetFid'])
    .where('targetHash', 'is not', null)
    .where('targetFid', 'is not', null)
    .execute();
  await db.schema
    .createIndex('reactions_target_url_index')
    .on('reactions')
    .columns(['targetUrl'])
    .where('targetUrl', 'is not', null)
    .execute();

  await db.schema
    .createTable('signers')
    .addColumn('id', 'bigint', (col) => col.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('deletedAt', 'timestamp')
    .addColumn('timestamp', 'timestamp', (col) => col.notNull())
    .addColumn('fid', 'bigint', (col) => col.notNull())
    .addColumn('hash', sql`bytea`, (col) => col.notNull())
    .addColumn('custodyAddress', sql`bytea`, (col) => col.notNull())
    .addColumn('signer', sql`bytea`, (col) => col.notNull())
    .addColumn('name', 'text')
    .addUniqueConstraint('signers_hash_unique', ['hash'])
    .addForeignKeyConstraint('signers_hash_foreign', ['hash'], 'messages', ['hash'])
    .execute();

  await db.schema.createIndex('signers_fid_timestamp_index').on('signers').columns(['fid', 'timestamp']).execute();

  await db.schema
    .createTable('verifications')
    .addColumn('id', 'bigint', (col) => col.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('deletedAt', 'timestamp')
    .addColumn('timestamp', 'timestamp', (col) => col.notNull())
    .addColumn('fid', 'bigint', (col) => col.notNull())
    .addColumn('hash', sql`bytea`, (col) => col.notNull())
    .addColumn('claim', 'jsonb', (col) => col.notNull())
    .addUniqueConstraint('verifications_hash_unique', ['hash'])
    .addForeignKeyConstraint('verifications_hash_foreign', ['hash'], 'messages', ['hash'])
    .execute();

  await db.schema
    .createIndex('verifications_claim_address_index')
    .on('verifications')
    .expression(sql`(claim ->> 'address'::text)`)
    .execute();

  await db.schema
    .createIndex('verifications_fid_timestamp_index')
    .on('verifications')
    .columns(['fid', 'timestamp'])
    .execute();

  await db.schema
    .createTable('userData')
    .addColumn('id', 'bigint', (col) => col.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('deletedAt', 'timestamp')
    .addColumn('timestamp', 'timestamp', (col) => col.notNull())
    .addColumn('fid', 'bigint', (col) => col.notNull())
    .addColumn('hash', sql`bytea`, (col) => col.notNull())
    .addColumn('type', sql`smallint`, (col) => col.notNull())
    .addColumn('value', 'text', (col) => col.notNull())
    .addUniqueConstraint('user_data_hash_unique', ['hash'])
    .addUniqueConstraint('user_data_fid_type_unique', ['fid', 'type'])
    .addForeignKeyConstraint('user_data_hash_foreign', ['hash'], 'messages', ['hash'])
    .execute();

  await db.schema.createIndex('user_data_fid_index').on('user_data').columns(['fid']).execute();

  await db.schema
    .createTable('fids')
    .addColumn('fid', 'bigint', (col) => col.primaryKey())
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('custodyAddress', sql`bytea`, (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('fnames')
    .addColumn('fname', 'text', (col) => col.primaryKey())
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('custodyAddress', sql`bytea`, (col) => col.notNull())
    .addColumn('expiresAt', 'timestamp', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('links')
    .addColumn('id', 'bigint', (col) => col.generatedAlwaysAsIdentity().primaryKey())
    .addColumn('fid', 'bigint')
    .addColumn('targetFid', 'bigint')
    .addColumn('timestamp', 'timestamp', (col) => col.notNull())
    .addColumn('createdAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('updatedAt', 'timestamp', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('deletedAt', 'timestamp')
    .addColumn('type', 'text')
    .addColumn('displayTimestamp', 'timestamp')
    .execute();
};

export const down = async (db: Kysely<any>) => {
  await db.schema.dropTable('links').ifExists().execute();
  await db.schema.dropTable('fnames').ifExists().execute();
  await db.schema.dropTable('fids').ifExists().execute();
  await db.schema.dropTable('casts').ifExists().execute();
  await db.schema.dropTable('reactions').ifExists().execute();
  await db.schema.dropTable('signers').ifExists().execute();
  await db.schema.dropTable('verifications').ifExists().execute();
  await db.schema.dropTable('userData').ifExists().execute();
  await db.schema.dropTable('messages').ifExists().execute();
};
