import { ColumnType, FileMigrationProvider, Generated, GeneratedAlways, Kysely, MigrationInfo, Migrator } from "kysely";
import { Logger } from "./log";
import { err, ok, Result } from "neverthrow";
import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "node:url";
import { HubTables } from "@farcaster/hub-shuttle";
import { Fid, VerificationAddEthAddressBodyJson } from "../shuttle";
import { UserDataType } from "@farcaster/hub-nodejs";

const createMigrator = async (db: Kysely<HubTables>, dbSchema: string, log: Logger) => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const migrator = new Migrator({
    db,
    migrationTableSchema: dbSchema,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(currentDir, "migrations"),
    }),
  });

  return migrator;
};

export const migrateToLatest = async (
  db: Kysely<HubTables>,
  dbSchema: string,
  log: Logger,
): Promise<Result<void, unknown>> => {
  const migrator = await createMigrator(db, dbSchema, log);

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

export type CastRow = {
  id: Generated<string>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  deletedAt: Date | null;
  timestamp: Date;
  fid: Fid;
  hash: Uint8Array;
  text: string;
};

export type LinkRow = {
  id: Generated<string>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  deletedAt: Date | null;
  timestamp: Date;
  fid: Fid;
  target_fid: Fid | null;
  hash: Uint8Array;
  type: string;
};

export type VerificationRow = {
  id: Generated<string>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  deletedAt: Date | null;
  timestamp: Date;
  fid: Fid;
  hash: Uint8Array;
  claim: VerificationAddEthAddressBodyJson | {};
};

export type UserDataRow = {
  id: Generated<string>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  deletedAt: Date | null;
  timestamp: Date;
  fid: Fid;
  hash: Uint8Array;
  type: UserDataType | null;
};

export type OnChainEventRow = {
  id: Generated<string>;
  createdAt: Generated<Date>;
  updatedAt: Generated<Date>;
  timestamp: Date;
  fid: Fid;
  blockNumber: number;
  logIndex: number;
  type: number;
  txHash: Uint8Array;
  body: Record<string, string | number>;
};

export interface Tables extends HubTables {
  casts: CastRow;
  onchain_events: OnChainEventRow;
  links: LinkRow;
  verifications: VerificationRow;
  user_data: UserDataRow;
}

export type AppDb = Kysely<Tables>;
