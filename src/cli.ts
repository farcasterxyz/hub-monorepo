#!/usr/bin/env node

import { Command } from 'commander';
import { Hub, HubOpts } from '~/hub';
import { createEd25519PeerId, createFromProtobuf, exportToProtobuf } from '@libp2p/peer-id-factory';
import { dirname } from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { exit } from 'process';
import { readFile } from 'fs/promises';
import { logger } from '~/utils/logger';

/** A CLI to accept options from the user and start the Hub */

const DEFAULT_PEER_ID_LOCATION = './.hub/id.protobuf';

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

const createIdCommand = new Command('create')
  .description('Create a new peerId and write it to a file')
  .option('-I, --id <filepath>', 'Path to the PeerId file', DEFAULT_PEER_ID_LOCATION)
  .action(async (options) => {
    // create a new peerId and output it to a file
    const peerId = await createEd25519PeerId();
    const filePath = options.id;
    const proto = exportToProtobuf(peerId);
    try {
      const directory = dirname(filePath);
      if (!existsSync(directory)) {
        await mkdir(directory, { recursive: true });
      }
      await writeFile(filePath, proto, 'binary');
    } catch (err: any) {
      throw new Error(err);
    }
    logger.info(`Successfully Wrote peerId: ${peerId.toString()} to ${filePath}`);
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
