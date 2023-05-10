import { HubReplicator } from './hubReplicator';
import { getDbClient, migrateToLatest } from './db';
import { log } from './log';

/**
 * Populate the following constants with your own values.
 *
 * If you're running this from the examples directory, make sure you follow the
 * README.
 */
const HUB_HOST = process.env['HUB_HOST'] || 'nemes.farcaster.xyz:2283';
const HUB_SSL = (process.env['HUB_SSL'] || 'true') === 'true';
const POSTGRES_URL = process.env['POSTGRES_URL'] || 'postgres://app:password@localhost:6541/hub';

const db = getDbClient(POSTGRES_URL);

let replicator: HubReplicator | undefined;

const shutdown = async () => {
  if (replicator) {
    await replicator.stop();
    await replicator.destroy();
  }

  if (db) {
    await db.destroy();
  }
};

process.on('exit', (code) => {
  log.info(`Exiting process with status code ${code}`);
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.once(signal, (signalName: string) => {
    log.info(`Process received ${signalName}`);
    process.exitCode =
      // eslint-disable-next-line security/detect-object-injection
      {
        SIGINT: 130,
        SIGTERM: 143,
      }[signalName] || 1;

    shutdown();
  });
}

(async () => {
  // Create DB tables
  const result = await migrateToLatest(db, log);
  if (result.isErr()) {
    process.exit(1);
  }

  replicator = new HubReplicator(HUB_HOST, HUB_SSL, db, log);
  replicator.start();
})();
