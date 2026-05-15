import pg from "pg";
import {
  CamelCasePlugin,
  WithSchemaPlugin,
  DeleteQueryBuilder,
  Generated,
  InsertQueryBuilder,
  Kysely,
  NoResultErrorConstructor,
  PostgresDialect,
  QueryNode,
  Selectable,
  Insertable,
  SelectQueryBuilder,
  sql,
  Transaction,
  UpdateQueryBuilder,
} from "kysely";
import {
  CastType,
  HashScheme,
  IdRegisterEventType,
  MessageType,
  OnChainEventType,
  ReactionType,
  SignatureScheme,
  SignerEventType,
  StorageUnitType,
  TierType,
  UserDataType,
  UserNameType,
} from "@farcaster/hub-nodejs";
import { DrainOuterGeneric, SimplifySingleResult } from "kysely/dist/cjs/util/type-utils.js";

import Cursor from "pg-cursor";
import { extendStackTrace } from "../utils";

// BigInts will not exceed Number.MAX_SAFE_INTEGER for our use case.
// Return as JavaScript's `number` type so it's easier to work with.
pg.types.setTypeParser(20, (val) => Number(val));

const { Pool } = pg;

export type Fid = number;
export type Hex = `0x${string}`;
export type VerificationProtocol = "ethereum" | "solana";

// MESSAGES ---------------------------------------------------------------------------------------
declare const $messageDbId: unique symbol;
type MessageDbId = string & { [$messageDbId]: true };

type CastIdJson = {
  fid: Fid;
  hash: Hex;
};

export type CastAddBodyJson = {
  text: string;
  embeds?: string[];
  mentions?: number[];
  mentionsPositions?: number[];
  parent?: CastIdJson | string;
  type: CastType;
};

export type CastRemoveBodyJson = {
  targetHash: string;
};

export type ReactionBodyJson = {
  type: ReactionType;
  target: CastIdJson | string;
};

export type VerificationAddEthAddressBodyJson = {
  address: string;
  claimSignature: string;
  blockHash: string;
  protocol: string;
};

export type VerificationRemoveBodyJson = {
  address: string;
};

export type SignerAddBodyJson = {
  signer: string;
  name: string;
};

export type SignerRemoveBodyJson = {
  signer: string;
};

export type UserDataBodyJson = {
  type: UserDataType;
  value: string;
};

export type LinkBodyJson = {
  type: string;
  /** original timestamp in Unix ms */
  displayTimestamp?: number;
  targetFid?: number;
  targetFids?: number[];
};

export type UsernameProofBodyJson = {
  timestamp: number;
  name: string;
  owner: string;
  signature: string;
  fid: number;
  type: UserNameType;
};

export type LendStorageBodyJson = {
  toFid: number;
  numUnits: number;
  unitType: StorageUnitType;
};

export type MessageBodyJson =
  | CastAddBodyJson
  | CastRemoveBodyJson
  | ReactionBodyJson
  | LinkBodyJson
  | VerificationAddEthAddressBodyJson
  | VerificationRemoveBodyJson
  | SignerAddBodyJson
  | SignerRemoveBodyJson
  | UserDataBodyJson
  | UsernameProofBodyJson
  | LendStorageBodyJson;

type MessagesTable = {
  id: Generated<string>;
  fid: number;
  type: MessageType;
  timestamp: Date;
  hashScheme: HashScheme;
  signatureScheme: SignatureScheme;
  hash: Uint8Array;
  signer: Uint8Array;
  raw: Uint8Array;
  body: MessageBodyJson;
  deletedAt: Date | null;
  revokedAt: Date | null;
  prunedAt: Date | null;
};

export type MessageRow = Selectable<MessagesTable>;
export type InsertableMessageRow = Insertable<MessagesTable>;

// ON-CHAIN EVENTS --------------------------------------------------------------------------------
// JSON-safe representations of each on-chain event body. Mirrors the convention used by
// `MessageBodyJson`: every `Uint8Array` field on the protobuf body is serialized as a
// hex-prefixed string ("0x...") so the value round-trips through a Postgres `json` /
// `jsonb` column. Using the protobuf types directly would let `Uint8Array`-typed fields
// like `IdRegisterEventBody.to` or `TierPurchaseBody.payer` be persisted as the
// node-default `{ "0": 0xab, "1": 0xcd, ... }` numeric-index object shape, which is both
// wasteful and a pain for downstream consumers to query.
export type IdRegisterEventBodyJson = {
  to: Hex;
  eventType: IdRegisterEventType;
  from: Hex;
  recoveryAddress: Hex;
};

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

export type StorageRentEventBodyJson = {
  payer: Hex;
  units: number;
  expiry: number;
};

export type TierPurchaseEventBodyJson = {
  tierType: TierType;
  forDays: number;
  payer: Hex;
};

export type OnChainEventBodyJson =
  | IdRegisterEventBodyJson
  | SignerEventBodyJson
  | SignerMigratedEventBodyJson
  | StorageRentEventBodyJson
  | TierPurchaseEventBodyJson;

export type OnChainEventsTable = {
  id: Generated<string>;
  // `chainId` and `blockNumber` are Postgres `bigint` (int8) columns, but the package
  // installs a global `pg.types.setTypeParser(20, ...)` that returns int8 values as JS
  // `number`. Typing them as `number` keeps the runtime shape and the declared shape in
  // sync (declaring `bigint` would silently mislead downstream consumers and break
  // arithmetic / serialization). Real-world chain IDs and block numbers are far below
  // `Number.MAX_SAFE_INTEGER`.
  chainId: number;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  blockTimestamp: Date;
  fid: Fid;
  blockNumber: number;
  logIndex: number;
  type: OnChainEventType;
  txHash: Uint8Array;
  body: OnChainEventBodyJson;
};

export type OnChainEventRow = Selectable<OnChainEventsTable>;
export type InsertableOnChainEventRow = Insertable<OnChainEventsTable>;

// USERNAMES --------------------------------------------------------------------------------------
export type UsernamesTable = {
  id: Generated<string>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  deletedAt: Date | null;
  fid: Fid;
  username: string;
  custodyAddress: Uint8Array | null;
  proofTimestamp: Date;
  type: UserNameType;
};

export type UsernameRow = Selectable<UsernamesTable>;
export type InsertableUsernameRow = Insertable<UsernamesTable>;

// ALL TABLES -------------------------------------------------------------------------------------
export interface HubTables {
  messages: MessagesTable;
  onchain_events: OnChainEventsTable;
  usernames: UsernamesTable;
}

export const getDbClient = (connectionString?: string, schema = "public") => {
  return new Kysely<HubTables>({
    dialect: new PostgresDialect({
      pool: new Pool({
        max: 10,
        connectionString,
      }),
      cursor: Cursor,
    }),
    plugins: [new CamelCasePlugin(), new WithSchemaPlugin(schema)],
  });
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

export function getEstimateOfTablesRowCount(db: DB, tablesToMonitor: Array<keyof HubTables>, schema = "public") {
  try {
    return sql<{ tableName: string; estimate: number }>`SELECT relname AS table_name, reltuples AS estimate
                FROM pg_class
                WHERE oid IN (
                  to_regclass('${sql.join(
                    tablesToMonitor.map((t) => sql.id(schema, t)),
                    sql`'), to_regclass('`,
                  )}')
                )`.execute(db);
  } catch (e) {
    throw extendStackTrace(e, new Error());
  }
}

export type DBTransaction = Transaction<HubTables>;
export type DB = Kysely<HubTables>;
export { sql } from "kysely";
