import pg from "pg";
import {
  CamelCasePlugin,
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
  HashScheme,
  MessageType,
  ReactionType,
  SignatureScheme,
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
  | UsernameProofBodyJson;

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

// ALL TABLES -------------------------------------------------------------------------------------
export interface HubTables {
  messages: MessagesTable;
}

export const getDbClient = (connectionString?: string) => {
  return new Kysely<HubTables>({
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

export function getEstimateOfTablesRowCount(db: DB, tablesToMonitor: Array<keyof HubTables>) {
  try {
    return sql<{ tableName: string; estimate: number }>`SELECT relname AS table_name, reltuples AS estimate
               FROM pg_class
               WHERE relname IN (${sql.join(tablesToMonitor)})`.execute(db);
  } catch (e) {
    throw extendStackTrace(e, new Error());
  }
}

export type DBTransaction = Transaction<HubTables>;
export type DB = Kysely<HubTables>;
