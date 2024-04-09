import { FileMigrationProvider, Kysely, MigrationInfo, Migrator } from "kysely";
import { Logger } from "../log";
import { err, ok, Result } from "neverthrow";
import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "node:url";
import { HubTables } from "../shuttle/db";

const createMigrator = async (db: Kysely<HubTables>, log: Logger) => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(currentDir, "migrations"),
    }),
  });

  return migrator;
};

export const migrationStatus = async (
  db: Kysely<HubTables>,
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

export const migrateToLatest = async (db: Kysely<HubTables>, log: Logger): Promise<Result<void, unknown>> => {
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

export const migrateOneUp = async (db: Kysely<HubTables>, log: Logger): Promise<Result<void, unknown>> => {
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
