#!/usr/bin/env node

import { Command } from 'commander';
import { Hub, HubOptions } from '~/hub';
import { createEd25519PeerId, createFromProtobuf, exportToProtobuf } from '@libp2p/peer-id-factory';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { exit } from 'process';
import { readFile } from 'fs/promises';
import { logger } from '~/utils/logger';
import { dirname, resolve } from 'path';
import { PeerId } from '@libp2p/interface-peer-id';
import { addressInfoFromParts, ipMultiAddrStrFromAddressInfo } from '~/utils/p2p';

/** A CLI to accept options from the user and start the Hub */

const DEFAULT_CONFIG_FILE = './.config/hub.config.ts';
const PEER_ID_FILENAME = 'id.protobuf';
const DEFAULT_PEER_ID_DIR = './.hub';
const DEFAULT_PEER_ID_FILENAME = `default_${PEER_ID_FILENAME}`;
const DEFAULT_PEER_ID_LOCATION = `${DEFAULT_PEER_ID_DIR}/${DEFAULT_PEER_ID_FILENAME}`;

const app = new Command();
app
  .name('hub')
  .description('Farcaster Hub')
  .version(process.env['npm_package_version'] ?? '1.0.0');

app
  .command('start')
  .description('Start a Hub')
  .option('-c, --config <filepath>', 'Path to a config file with options', DEFAULT_CONFIG_FILE)
  .option('-n --network-url <url>', 'ID Registry network URL')
  .option('-f, --fir-address <address>', 'The address of the FIR contract')
  .option('-b, --bootstrap <peer-multiaddrs...>', 'A list of peer multiaddrs to bootstrap libp2p')
  .option('-a, --allowed-peers <peerIds...>', 'An allow-list of peer ids permitted to connect to the hub')
  .option('--ip <ip-address>', 'The IP address libp2p should listen on. (default: "127.0.0.1")')
  .option('-g, --gossip-port <port>', 'The tcp port libp2p should gossip over. (default: random port)')
  .option('-r, --rpc-port <port>', 'The tcp port that the rpc server should listen on.  (default: random port)')
  .option('--db-name <name>', 'The name of the RocksDB instance')
  .option('--db-reset', 'Clears the database before starting')
  .option('-i, --id <filepath>', 'Path to the PeerId file')
  .action(async (cliOptions) => {
    const teardown = async (hub: Hub) => {
      await hub.stop();
      process.exit();
    };

    // try to load the config file
    const hubConfig = (await import(resolve(cliOptions.config))).Config;

    let peerId;
    if (cliOptions.id) {
      peerId = await readPeerId(resolve(cliOptions.id));
    } else {
      peerId = await readPeerId(resolve(hubConfig.id));
    }

    const hubAddressInfo = addressInfoFromParts(
      cliOptions.ip ?? hubConfig.ip,
      cliOptions.gossipPort ?? hubConfig.gossipPort
    );

    if (hubAddressInfo.isErr()) {
      throw hubAddressInfo.error;
    }

    const ipMultiAddrResult = ipMultiAddrStrFromAddressInfo(hubAddressInfo.value);
    if (ipMultiAddrResult.isErr()) {
      throw ipMultiAddrResult.error;
    }

    const options: HubOptions = {
      peerId,
      ipMultiAddr: ipMultiAddrResult.value,
      gossipPort: hubAddressInfo.value.port,
      networkUrl: cliOptions.networkUrl ?? hubConfig.networkUrl,
      IdRegistryAddress: cliOptions.firAddress ?? hubConfig.firAddress,
      bootstrapAddrs: cliOptions.bootstrap ?? hubConfig.bootstrap,
      allowedPeers: cliOptions.allowedPeers ?? hubConfig.allowedPeers,
      rpcPort: cliOptions.rpcPort ?? hubConfig.rpcPort,
      rocksDBName: cliOptions.dbName ?? hubConfig.dbName,
      resetDB: cliOptions.dbReset ?? hubConfig.dbReset,
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
  const proto = await readFile(filePath);
  return createFromProtobuf(proto);
};

app.parse(process.argv);
