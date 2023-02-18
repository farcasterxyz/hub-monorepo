#!/usr/bin/env node
import { PeerId } from '@libp2p/interface-peer-id';
import { createEd25519PeerId, createFromProtobuf, exportToProtobuf } from '@libp2p/peer-id-factory';
import { Command } from 'commander';
import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { exit } from 'process';
import { APP_VERSION, Hub, HubOptions } from '~/hubble';
import { logger } from '~/utils/logger';
import { addressInfoFromParts, ipMultiAddrStrFromAddressInfo, parseAddress } from '~/utils/p2p';
import { DEFAULT_RPC_CONSOLE, startConsole } from './console/console';
import { parseNetwork } from './utils/command';

/** A CLI to accept options from the user and start the Hub */

const DEFAULT_CONFIG_FILE = './.config/hub.config.ts';
const PEER_ID_FILENAME = 'id.protobuf';
const DEFAULT_PEER_ID_DIR = './.hub';
const DEFAULT_PEER_ID_FILENAME = `default_${PEER_ID_FILENAME}`;
const DEFAULT_PEER_ID_LOCATION = `${DEFAULT_PEER_ID_DIR}/${DEFAULT_PEER_ID_FILENAME}`;

const app = new Command();
app.name('hub').description('Farcaster Hub').version(APP_VERSION);

app
  .command('start')
  .description('Start a Hub')
  .option('-e, --eth-rpc-url <url>', 'RPC URL of a Goerli Ethereum Node')
  .option('-c, --config <filepath>', 'Path to a config file with options', DEFAULT_CONFIG_FILE)
  .option('-f, --fir-address <address>', 'The address of the FIR contract')
  .option('-b, --bootstrap <peer-multiaddrs...>', 'A list of peer multiaddrs to bootstrap libp2p')
  .option('-a, --allowed-peers <peerIds...>', 'An allow-list of peer ids permitted to connect to the hub')
  .option('--ip <ip-address>', 'The IP address libp2p should listen on. (default: "127.0.0.1")')
  .option(
    '--announce-ip <ip-address>',
    'The IP address libp2p should announce to other peers. If not provided, the IP address will be fetched from an external service'
  )
  .option('-g, --gossip-port <port>', 'The tcp port libp2p should gossip over. (default: 13111)')
  .option('-r, --rpc-port <port>', 'The tcp port that the rpc server should listen on.  (default: 13112)')
  .option('--db-name <name>', 'The name of the RocksDB instance')
  .option('--db-reset', 'Clears the database before starting')
  .option('--rebuild-sync-trie', 'Rebuilds the sync trie before starting')
  .option('-i, --id <filepath>', 'Path to the PeerId file')
  .option('-n --network <network>', 'Farcaster network ID', parseNetwork)
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

    const bootstrapAddrs = ((cliOptions.bootstrap ?? hubConfig.bootstrap ?? []) as string[])
      .map((a) => parseAddress(a))
      .map((a) => {
        if (a.isErr()) {
          logger.warn(
            { errorCode: a.error.errCode, message: a.error.message },
            "Couldn't parse bootstrap address, ignoring"
          );
        }
        return a;
      })
      .filter((a) => a.isOk())
      .map((a) => a._unsafeUnwrap());

    const rebuildSyncTrie = cliOptions.rebuildSyncTrie ?? hubConfig.rebuildSyncTrie ?? false;

    const options: HubOptions = {
      peerId,
      ipMultiAddr: ipMultiAddrResult.value,
      announceIp: cliOptions.announceIp ?? hubConfig.announceIp,
      gossipPort: hubAddressInfo.value.port,
      network: cliOptions.network ?? hubConfig.network,
      ethRpcUrl: cliOptions.ethRpcUrl ?? hubConfig.ethRpcUrl,
      IdRegistryAddress: cliOptions.firAddress ?? hubConfig.firAddress,
      bootstrapAddrs,
      allowedPeers: cliOptions.allowedPeers ?? hubConfig.allowedPeers,
      rpcPort: cliOptions.rpcPort ?? hubConfig.rpcPort,
      rocksDBName: cliOptions.dbName ?? hubConfig.dbName,
      resetDB: cliOptions.dbReset ?? hubConfig.dbReset,
      rebuildSyncTrie,
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
  // Handling: using try-catch is more ergonomic than capturing and handling throwable, since we
  // want a fast failure back to the CLI
  try {
    // Safety: directory, writefile are provided from the command line, and safe to trust
    /* eslint-disable security/detect-non-literal-fs-filename */
    if (!existsSync(directory)) {
      await mkdir(directory, { recursive: true });
    }
    await writeFile(filepath, proto, 'binary');
    /* eslint-enable security/detect-non-literal-fs-filename */
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

app
  .command('console')
  .description('Start a REPL console')
  .option(
    '-s, --server <url>',
    'Farcaster RPC server address:port to connect to (eg. 127.0.0.1:13112)',
    DEFAULT_RPC_CONSOLE
  )
  .action(async (cliOptions) => {
    startConsole(cliOptions.server);
  });

const readPeerId = async (filePath: string) => {
  /* eslint-disable security/detect-non-literal-fs-filename */

  const proto = await readFile(filePath);
  return createFromProtobuf(proto);
};

app.parse(process.argv);
