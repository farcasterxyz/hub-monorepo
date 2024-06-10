import {
  Kysely,
  PostgresDialect,
  CamelCasePlugin,
  Generated,
  GeneratedAlways,
  Migrator,
  FileMigrationProvider,
  Transaction,
  SelectQueryBuilder,
  DeleteQueryBuilder,
  UpdateQueryBuilder,
  InsertQueryBuilder,
  NoResultErrorConstructor,
  QueryNode,
  ColumnType,
  MigrationInfo,
  sql,
} from "kysely";
import Cursor from "pg-cursor";
import { Pool, types } from "pg";
import {
  MessageType,
  ReactionType,
  UserDataType,
  HashScheme,
  SignatureScheme,
  UserNameType,
  OnChainEventType,
  SignerEventType,
  IdRegisterEventType,
  Protocol,
} from "@farcaster/hub-nodejs";
import * as path from "path";
import { promises as fs } from "fs";
import { err, ok, Result } from "neverthrow";
import { Logger } from "./log.js";
import { extendStackTrace } from "./util.js";
import { DrainOuterGeneric, SimplifySingleResult } from "kysely/dist/cjs/util/type-utils.js";

// BigInts will not exceed Number.MAX_SAFE_INTEGER for our use case.
// Return as JavaScript's `number` type so it's easier to work with.
types.setTypeParser(20, (val) => Number(val));

export type Fid = number;
export type Hex = `0x${string}`;

type CastIdJson = {
  fid: Fid;
  hash: Hex;
};

// CHAIN EVENTS -----------------------------------------------------------------------------------
declare const $chainEventDbId: unique symbol;
type ChainEventDbId = string & { [$chainEventDbId]: true };

export type SignerEventBodyJson = {
  key: Hex;
  keyType: number;
  eventType: SignerEventType;
  metadata: Hex;
  metadataType: number;
};

export type SignerMigratedEventBodyJson = {
  migratedAt: number;
};

export type IdRegisterEventBodyJson = {
  to: Hex;
  eventType: IdRegisterEventType;
  from: Hex;
  recoveryAddress: Hex;
};

export type StorageRentEventBodyJson = {
  payer: Hex;
  units: number;
  expiry: number;
};

export type ChainEventBodyJson =
  | SignerEventBodyJson
  | SignerMigratedEventBodyJson
  | IdRegisterEventBodyJson
  | StorageRentEventBodyJson;

export type ChainEventRow = {
  id: GeneratedAlways<ChainEventDbId>;
  createdAt: Generated<Date>;
  blockTimestamp: Date;
  fid: Fid;
  chainId: number;
  blockNumber: number;
  transactionIndex: number;
  logIndex: number;
  type: OnChainEventType;
  blockHash: Uint8Array;
  transactionHash: Uint8Array;
  body: ColumnType<ChainEventBodyJson, string, string>;
  raw: Uint8Array;
};

// FIDS -------------------------------------------------------------------------------------------
export type FidRow = {
  fid: Fid;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  registeredAt: Date;
  chainEventId: ChainEventDbId;
  custodyAddress: Uint8Array;
  recoveryAddress: Uint8Array;
};

// SIGNERS -----------------------------------------------------------------------------------------
declare const $signerDbId: unique symbol;
type SignerDbId = string & { [$signerDbId]: true };

export type SignerAddMetadataJson = {
  requestFid: number;
  requestSigner: Hex;
  signature: Hex;
  deadline: number;
};

export type SignerRow = {
  id: GeneratedAlways<SignerDbId>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  addedAt: Date;
  removedAt: Date | null;
  fid: Fid;
  requesterFid: Fid;
  addChainEventId: ChainEventDbId;
  removeChainEventId: ChainEventDbId | null;
  key: Uint8Array;
  keyType: number;
  metadata: ColumnType<SignerAddMetadataJson, string, string>;
  metadataType: number;
};

// USERNAME PROOFS ---------------------------------------------------------------------------------
declare const $usernameProofDbId: unique symbol;
type UsernameProofDbId = string & { [$usernameProofDbId]: true };

export type UsernameProofRow = {
  id: GeneratedAlways<UsernameProofDbId>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  timestamp: Date;
  deletedAt: Date | null;
  fid: Fid;
  type: UserNameType;
  username: string;
  signature: Uint8Array;
  owner: Uint8Array;
};

// FNAMES ------------------------------------------------------------------------------------------
declare const $fnameDbId: unique symbol;
type FnameDbId = string & { [$fnameDbId]: true };

export type FnameRow = {
  id: GeneratedAlways<FnameDbId>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  registeredAt: Date;
  deletedAt: Date | null;
  fid: Fid;
  type: UserNameType;
  username: string;
};

// MESSAGES ---------------------------------------------------------------------------------------
declare const $messageDbId: unique symbol;
type MessageDbId = string & { [$messageDbId]: true };

export type CastEmbedJson = { url: string } | { castId: CastIdJson };

export type CastAddBodyJson =
  | {
      text: string;
      embeds?: CastEmbedJson[];
      mentions?: Fid[];
      mentionsPositions?: number[];
    }
  | { parentUrl: string }
  | { parentCastId: CastIdJson };

export type CastRemoveBodyJson = {
  targetHash: Hex;
};

type ReactionBodyCastJson = {
  type: ReactionType;
  targetCastId: CastIdJson;
};

type ReactionBodyUrlJson = {
  type: ReactionType;
  targetUrl: string;
};

export type ReactionBodyJson = ReactionBodyCastJson | ReactionBodyUrlJson;

export type VerificationAddEthAddressBodyJson = {
  address: Hex;
  claimSignature: Hex;
  blockHash: Hex;
  protocol: Protocol;
};

export type VerificationAddSolAddressBodyJson = {
  address: string;
  claimSignature: string;
  blockHash: string;
  protocol: Protocol;
};

export type VerificationRemoveBodyJson = {
  address: Hex;
  protocol: Protocol;
};

export type UserDataBodyJson = {
  type: UserDataType;
  value: string;
};

export type LinkCompactStateBodyJson = {
  type: string;
  targetFids?: Fid[];
};

export type LinkBodyJson = {
  type: string;
  /** original timestamp in Unix ms */
  displayTimestamp?: number;
  targetFid?: Fid;
};

export type UsernameProofBodyJson = {
  timestamp: number;
  name: string;
  owner: string;
  signature: Hex;
  fid: Fid;
  type: UserNameType;
};

export type MessageBodyJson =
  | CastAddBodyJson
  | CastRemoveBodyJson
  | ReactionBodyJson
  | LinkBodyJson
  | VerificationAddEthAddressBodyJson
  | VerificationAddSolAddressBodyJson
  | VerificationRemoveBodyJson
  | UserDataBodyJson
  | UsernameProofBodyJson;

type MessageRow = {
  id: GeneratedAlways<MessageDbId>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  deletedAt: Date | null;
  revokedAt: Date | null;
  prunedAt: Date | null;
  fid: Fid;
  type: MessageType;
  timestamp: Date;
  hash: Uint8Array;
  hashScheme: HashScheme;
  signature: Uint8Array;
  signatureScheme: SignatureScheme;
  signer: Uint8Array;
  raw: Uint8Array;
  body: ColumnType<MessageBodyJson, string, string>;
};

// CASTS -------------------------------------------------------------------------------------------
declare const $castDbId: unique symbol;
type CastDbId = string & { [$castDbId]: true };

export type CastRow = {
  id: GeneratedAlways<CastDbId>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  timestamp: Date;
  deletedAt: Date | null;
  fid: Fid;
  parentFid: Fid | null;
  hash: Uint8Array;
  rootParentHash: Uint8Array | null;
  parentHash: Uint8Array | null;
  rootParentUrl: string | null;
  parentUrl: string | null;
  text: string;
  embeds: ColumnType<CastEmbedJson[], string, string>;
  mentions: ColumnType<Fid[], string, string>;
  mentionsPositions: ColumnType<number[], string, string>;
};

// REACTIONS ---------------------------------------------------------------------------------------
declare const $reactionDbId: unique symbol;
type ReactionDbId = string & { [$reactionDbId]: true };

export type ReactionRow = {
  id: GeneratedAlways<ReactionDbId>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  timestamp: Date;
  deletedAt: Date | null;
  fid: Fid;
  targetCastFid: Fid | null;
  type: ReactionType;
  hash: Uint8Array;
  targetCastHash: Uint8Array | null;
  targetUrl: string | null;
};

// LINKS -------------------------------------------------------------------------------------------
declare const $linkDbId: unique symbol;
type LinkDbId = string & { [$linkDbId]: true };

export type LinkRow = {
  id: GeneratedAlways<LinkDbId>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  timestamp: Date;
  deletedAt: Date | null;
  fid: Fid;
  targetFid: Fid | null;
  displayTimestamp: Date | null;
  type: string;
  hash: Uint8Array;
};

// VERIFICATIONS -----------------------------------------------------------------------------------
declare const $verificationDbId: unique symbol;
type VerificationDbId = string & { [$verificationDbId]: true };

export type VerificationRow = {
  id: GeneratedAlways<VerificationDbId>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  timestamp: Date;
  deletedAt: Date | null;
  fid: Fid;
  hash: Uint8Array;
  signerAddress: Uint8Array;
  blockHash: Uint8Array;
  signature: Uint8Array;
};

// USER DATA --------------------------------------------------------------------------------------
declare const $userDataDbId: unique symbol;
type UserDataDbId = string & { [$userDataDbId]: true };

export type UserDataRow = {
  id: GeneratedAlways<UserDataDbId>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  timestamp: Date;
  deletedAt: Date | null;
  fid: Fid;
  type: UserDataType;
  hash: Uint8Array;
  value: string;
};

// STORAGE ALLOCATIONS -----------------------------------------------------------------------------
declare const $storageAllocationDbId: unique symbol;
type StorageAllocationDbId = string & { [$storageAllocationDbId]: true };

export type StorageAllocationRow = {
  id: GeneratedAlways<StorageAllocationDbId>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  rentedAt: Date;
  expiresAt: Date;
  chainEventId: ChainEventDbId;
  fid: Fid;
  units: number;
  payer: Uint8Array;
};

// ALL TABLES -------------------------------------------------------------------------------------
export interface Tables {
  usernameProofs: UsernameProofRow;
  fnames: FnameRow;
  messages: MessageRow;
  chainEvents: ChainEventRow;
  fids: FidRow;
  signers: SignerRow;
  casts: CastRow;
  reactions: ReactionRow;
  links: LinkRow;
  verifications: VerificationRow;
  userData: UserDataRow;
  storageAllocations: StorageAllocationRow;
}

export const getDbClient = (connectionString?: string) => {
  return new Kysely<Tables>({
    dialect: new PostgresDialect({
      pool: new Pool({
        max: 10,
        connectionString,
      }),
      cursor: Cursor,
    }),
    plugins: [new CamelCasePlugin()],
  });
};

// biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
const createMigrator = async (db: Kysely<any>, log: Logger) => {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, "migrations"),
    }),
  });

  return migrator;
};

export const migrationStatus = async (
  // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
  db: Kysely<any>,
  log: Logger,
): Promise<{ executed: MigrationInfo[]; pending: MigrationInfo[] }> => {
  const migrator = await createMigrator(db, log);

  const migrations = await migrator.getMigrations();
  const executed = [];
  const pending = [];
  for (const migration of migrations) {
    if (migration.executedAt) {
      executed.push(migration);
    } else {
      pending.push(migration);
    }
  }

  return { executed, pending };
};

// biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
export const migrateToLatest = async (db: Kysely<any>, log: Logger): Promise<Result<void, unknown>> => {
  const migrator = await createMigrator(db, log);

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === "Success") {
      log.info(`Migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      log.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    log.error("Failed to apply all database migrations");
    log.error(error);
    return err(error);
  }

  log.info("Migrations up to date");
  return ok(undefined);
};

// biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
export const migrateOneUp = async (db: Kysely<any>, log: Logger): Promise<Result<void, unknown>> => {
  const migrator = await createMigrator(db, log);

  const { error, results } = await migrator.migrateUp();

  results?.forEach((it) => {
    if (it.status === "Success") {
      log.info(`migration "${it.migrationName}" was executed successfully`);
    } else if (it.status === "Error") {
      log.error(`failed to execute migration "${it.migrationName}"`);
    }
  });

  if (error) {
    log.error("failed to migrate");
    log.error(error);
    return err(error);
  }

  return ok(undefined);
};

export async function execute<DB, UT extends keyof DB, TB extends keyof DB, O>(
  query:
    | SelectQueryBuilder<DB, TB, O>
    | InsertQueryBuilder<DB, TB, O>
    | UpdateQueryBuilder<DB, UT, TB, O>
    | DeleteQueryBuilder<DB, TB, O>,
): Promise<DrainOuterGeneric<{ [K in keyof O]: O[K] }>[]> {
  try {
    return await query.execute();
  } catch (e) {
    throw extendStackTrace(e, new Error(), query);
  }
}

export async function executeTakeFirst<DB, UT extends keyof DB, TB extends keyof DB, O>(
  query:
    | SelectQueryBuilder<DB, TB, O>
    | InsertQueryBuilder<DB, TB, O>
    | UpdateQueryBuilder<DB, UT, TB, O>
    | DeleteQueryBuilder<DB, TB, O>,
): Promise<SimplifySingleResult<O>> {
  try {
    return await query.executeTakeFirst();
  } catch (e) {
    // Include additional stack context when an error occurs
    throw extendStackTrace(e, new Error(), query);
  }
}

export async function executeTakeFirstOrThrow<DB, UT extends keyof DB, TB extends keyof DB, O>(
  query:
    | SelectQueryBuilder<DB, TB, O>
    | InsertQueryBuilder<DB, TB, O>
    | UpdateQueryBuilder<DB, UT, TB, O>
    | DeleteQueryBuilder<DB, TB, O>,
  errorConstructor?: NoResultErrorConstructor | ((node: QueryNode) => Error) | undefined,
): Promise<DrainOuterGeneric<{ [K in keyof O]: O[K] }>> {
  try {
    return await query.executeTakeFirstOrThrow(errorConstructor);
  } catch (e) {
    // Include additional stack context when an error occurs
    throw extendStackTrace(e, new Error(), query);
  }
}

export async function executeTx<T>(db: DB, callback: (trx: DBTransaction) => Promise<T>): Promise<T> {
  try {
    return await db.transaction().execute(async (trx) => {
      return await callback(trx);
    });
  } catch (e) {
    // Include additional stack context when an error occurs
    throw extendStackTrace(e, new Error());
  }
}

export async function stream<DB, UT extends keyof DB, TB extends keyof DB, O>(
  query:
    | SelectQueryBuilder<DB, TB, O>
    | InsertQueryBuilder<DB, TB, O>
    | UpdateQueryBuilder<DB, UT, TB, O>
    | DeleteQueryBuilder<DB, TB, O>,
  fn: (row: O) => Promise<void> | void,
) {
  try {
    for await (const row of query.stream()) {
      await fn(row);
    }
  } catch (e) {
    throw extendStackTrace(e, new Error(), query);
  }
}

export function getEstimateOfTablesRowCount(db: DB, tablesToMonitor: Array<keyof Tables>) {
  try {
    return sql<{ tableName: string; estimate: number }>`SELECT relname AS table_name, reltuples AS estimate
               FROM pg_class
               WHERE relname IN (${sql.join(tablesToMonitor)})`.execute(db);
  } catch (e) {
    throw extendStackTrace(e, new Error());
  }
}

export type DBTransaction = Transaction<Tables>;
export type DB = Kysely<Tables>;
