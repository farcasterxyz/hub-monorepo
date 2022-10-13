#!/usr/bin/env node

import { Command } from 'commander';
import { Hub, HubOpts } from '~/hub';
import { createEd25519PeerId, createFromProtobuf, exportToProtobuf } from '@libp2p/peer-id-factory';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { exit } from 'process';
import { readFile } from 'fs/promises';
import { logger } from '~/utils/logger';
import { dirname, resolve } from 'path';
import { PeerId } from '@libp2p/interface-peer-id';

/** A CLI to accept options from the user and start the Hub */

const PEER_ID_FILENAME = 'id.protobuf';
const DEFAULT_PEER_ID_DIR = './.hub';
const DEFAULT_PEER_ID_FILENAME = `default_${PEER_ID_FILENAME}`;
const DEFAULT_PEER_ID_LOCATION = `${DEFAULT_PEER_ID_DIR}/${DEFAULT_PEER_ID_FILENAME}`;

const app = new Command();
app
  .name('hub')
  .description('Farcaster Hub')
  .version(process.env.npm_package_version ?? '1.0.0');

app
  .command('start')
  .description('Start a Hub')
  .option('-N, --network-url <url>', 'ID Registry network URL')
  .option('-A, --id-registry-address <address>', 'ID Registry address')
  .option('-B, --bootstrap-addresses <addresses...>', 'A list of MultiAddrs to use for bootstrapping')
  .option('--allowed-peers <peerIds...>', 'An "allow list" of Peer Ids. Blocks all other connections')
  .option('--port <port>', 'The port libp2p should listen on. (default: selects one at random')
  .option('--rpc-port <port>', 'The RPC port to use. (default: selects one at random')
  .option('--simple-sync <enabled>', 'Enable/Disable simple sync', true)
  .option('--db-reset', 'Clear the database before starting', false)
  .option('--db-name <name>', 'The name of the RocksDB instance', 'rocks.hub._default')
  .option('-I, --id <filepath>', 'Path to the PeerId file', DEFAULT_PEER_ID_LOCATION)
  .action(async (cliOptions) => {
    const teardown = async (hub: Hub) => {
      await hub.stop();
      process.exit();
    };

    const options: HubOpts = {
      peerId: await readPeerId(cliOptions.id),
      networkUrl: cliOptions.networkUrl,
      IDRegistryAddress: cliOptions.idRegistryAddress,
      bootstrapAddrs: cliOptions.bootstrapAddresses,
      allowedPeers: cliOptions.allowedPeers,
      port: cliOptions.port,
      rpcPort: cliOptions.rpcPort,
      simpleSync: cliOptions.simpleSync,
      rocksDBName: cliOptions.dbName,
      resetDB: cliOptions.dbReset,
    };

    const hub = new Hub(options);
    hub.start();

    process.stdin.resume();

    process.on('SIGINT', async () => {
      logger.fatal('SIGINT received');
      await teardown(hub);
    });

    process.on('SIGTERM', async () => {
      logger.fatal('SIGTERM received');
      await teardown(hub);
    });

    process.on('SIGQUIT', async () => {
      logger.fatal('SIGQUIT received');
      await teardown(hub);
    });

    process.on('uncaughtException', (err) => {
      logger.fatal(err);
      process.exit(1);
    });

    process.on('unhandledRejection', (err) => {
      logger.fatal(err);
      process.exit(1);
    });
  });

const parseNumber = (string: string) => {
  const number = Number(string);
  if (isNaN(number)) throw new Error('Not a number.');
  return number;
};

/** Write a given PeerId to a file */
const writePeerId = async (peerId: PeerId, filepath: string) => {
  const directory = dirname(filepath);
  const proto = exportToProtobuf(peerId);
  try {
    if (!existsSync(directory)) {
      await mkdir(directory, { recursive: true });
    }
    await writeFile(filepath, proto, 'binary');
  } catch (err: any) {
    throw new Error(err);
  }
  logger.info(`Wrote peerId: ${peerId.toString()} to ${filepath}`);
};

const createIdCommand = new Command('create')
  .description(
    'Create a new peerId and write it to a file.\n\nNote: This command will always overwrite the default PeerId file.'
  )
  .option('-O, --output <directory>', 'Path to where the generated PeerId/s should be stored', DEFAULT_PEER_ID_DIR)
  .option('-N, --count <number>', 'Number of PeerIds to generate', parseNumber, 1)
  .action(async (options) => {
    for (let i = 0; i < options.count; i++) {
      const peerId = await createEd25519PeerId();

      if (i == 0) {
        // Create a copy of the first peerId as the default one to use
        await writePeerId(peerId, resolve(`${options.output}/${DEFAULT_PEER_ID_FILENAME}`));
      }

      const path = `${options.output}/${peerId.toString()}_${PEER_ID_FILENAME}`;
      await writePeerId(peerId, resolve(path));
    }

    exit(0);
  });

const verifyIdCommand = new Command('verify')
  .description('Verify a peerId file')
  .option('-I, --id <filepath>', 'Path to the PeerId file', DEFAULT_PEER_ID_LOCATION)
  .action(async (options) => {
    const peerId = await readPeerId(options.id);
    logger.info(`Successfully Read peerId: ${peerId.toString()} from ${options.id}`);
    exit(0);
  });

app
  .command('identity')
  .description('Create or verify a peerID')
  .addCommand(createIdCommand)
  .addCommand(verifyIdCommand);

const readPeerId = async (filePath: string) => {
  try {
    const proto = await readFile(filePath);
    return createFromProtobuf(proto);
  } catch (err: any) {
    throw new Error(err);
  }
};

app.parse(process.argv);
