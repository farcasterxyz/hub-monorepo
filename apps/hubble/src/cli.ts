#!/usr/bin/env node
import { FarcasterNetwork } from '@farcaster/hub-nodejs';
import { PeerId } from '@libp2p/interface-peer-id';
import { createEd25519PeerId, createFromProtobuf, exportToProtobuf } from '@libp2p/peer-id-factory';
import { Command } from 'commander';
import fs, { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { Result, ResultAsync } from 'neverthrow';
import { dirname, resolve } from 'path';
import { exit } from 'process';
import { APP_VERSION, Hub, HubOptions } from '~/hubble';
import { logger } from '~/utils/logger';
import { addressInfoFromParts, ipMultiAddrStrFromAddressInfo, parseAddress } from '~/utils/p2p';
import { DEFAULT_RPC_CONSOLE, startConsole } from './console/console';
import { DB_DIRECTORY } from './storage/db/rocksdb';
import { parseNetwork } from './utils/command';

/** A CLI to accept options from the user and start the Hub */

const DEFAULT_CONFIG_FILE = './.config/hub.config.ts';
const PEER_ID_FILENAME = 'id.protobuf';
const DEFAULT_PEER_ID_DIR = './.hub';
const DEFAULT_PEER_ID_FILENAME = `default_${PEER_ID_FILENAME}`;
const DEFAULT_PEER_ID_LOCATION = `${DEFAULT_PEER_ID_DIR}/${DEFAULT_PEER_ID_FILENAME}`;
const DEFAULT_CHUNK_SIZE = 10000;

const DEFAULT_GOSSIP_PORT = 2282;
const DEFAULT_RPC_PORT = 2283;

// Grace period before exiting the process after receiving a SIGINT or SIGTERM
const PROCESS_SHUTDOWN_FILE_CHECK_INTERVAL_MS = 10_000;
const SHUTDOWN_GRACE_PERIOD_MS = 30_000;
let isExiting = false;

const app = new Command();
app.name('hub').description('Farcaster Hub').version(APP_VERSION);

app
  .command('start')
  .description('Start a Hub')
  .option('-e, --eth-rpc-url <url>', 'RPC URL of a Goerli Ethereum Node')
  .option('-c, --config <filepath>', 'Path to a config file with options', DEFAULT_CONFIG_FILE)
  .option('--fir-address <address>', 'The address of the Farcaster ID Registry contract')
  .option('--fnr-address <address>', 'The address of the Farcaster Name Registry contract')
  .option('--first-block <number>', 'The block number to begin syncing events from Farcaster contracts')
  .option(
    '--chunk-size <number>',
    'The number of blocks to batch when syncing historical events from Farcaster contracts. (default: 10000)'
  )
  .option('-b, --bootstrap <peer-multiaddrs...>', 'A list of peer multiaddrs to bootstrap libp2p')
  .option('-a, --allowed-peers <peerIds...>', 'An allow-list of peer ids permitted to connect to the hub')
  .option('--ip <ip-address>', 'The IP address libp2p should listen on. (default: "127.0.0.1")')
  .option(
    '--announce-ip <ip-address>',
    'The IP address libp2p should announce to other peers. If not provided, the IP address will be fetched from an external service'
  )
  .option(
    '--announce-server-name <name>',
    'The name of the server to announce to peers. This is useful if you have SSL/TLS enabled. (default: "none")'
  )
  .option('-g, --gossip-port <port>', 'The tcp port libp2p should gossip over. (default: 2282)')
  .option('-r, --rpc-port <port>', 'The tcp port that the rpc server should listen on.  (default: 2283)')
  .option(
    '--rpc-auth <username:password,...>',
    'Enable Auth for RPC submit methods with the username and password. (default: disabled)'
  )
  .option(
    '--rpc-rate-limit <number>',
    'Impose a Per IP rate limit per minute. Set to -1 for no rate limits (default: 20k/min)'
  )
  .option('--admin-server-enabled', 'Enable the admin server. (default: disabled)')
  .option('--admin-server-host <host>', "The host the admin server should listen on. (default: '127.0.0.1')")
  .option('--db-name <name>', 'The name of the RocksDB instance')
  .option('--db-reset', 'Clears the database before starting')
  .option('--rebuild-sync-trie', 'Rebuilds the sync trie before starting')
  .option('-i, --id <filepath>', 'Path to the PeerId file')
  .option('-n --network <network>', 'Farcaster network ID', parseNetwork)
  .action(async (cliOptions) => {
    const teardown = async (hub: Hub) => {
      await hub.stop();
    };

    const handleShutdownSignal = (signalName: string) => {
      logger.warn(`${signalName} received`);
      if (!isExiting) {
        isExiting = true;
        teardown(hub)
          .then(() => {
            logger.info('Hub stopped gracefully');
            process.exit(0);
          })
          .catch((err) => {
            logger.error({ reason: `Error stopping hub: ${err}` });
            process.exit(1);
          });

        setTimeout(() => {
          logger.fatal('Forcing exit after grace period');
          process.exit(1);
        }, SHUTDOWN_GRACE_PERIOD_MS);
      }
    };

    // We'll write our process number to a file so that we can detect if another hub process has taken over.
    const processFileDir = `${DB_DIRECTORY}/process/`;
    const processFileName = `process_number.txt`;

    // Generate a random number to identify this hub instance
    // Note that we can't use the PID as the identifier, since the hub running in a docker container will
    // always have PID 1.
    const processNum = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

    // Write our processNum to the file
    fs.mkdirSync(processFileDir, { recursive: true });
    fs.writeFile(`${processFileDir}${processFileName}`, processNum.toString(), (err) => {
      if (err) {
        logger.error(`Error writing process file: ${err}`);
      }
    });

    // Watch for the processNum file. If it changes, and we are not the process number written in the file,
    // it means that another hub process has taken over and we should exit.
    const checkForProcessNumChange = () => {
      if (isExiting) return;

      fs.readFile(`${processFileDir}${processFileName}`, 'utf8', async (err, data) => {
        if (err) {
          logger.error(`Error reading processnum file: ${err}`);
          return;
        }

        const readProcessNum = parseInt(data.trim());
        if (!isNaN(readProcessNum) && readProcessNum !== processNum) {
          logger.error(`Another hub process is running with processNum ${readProcessNum}, exiting`);
          handleShutdownSignal('SIGTERM');
        }
      });
    };

    // eslint-disable-next-line prefer-arrow-functions/prefer-arrow-functions
    setTimeout(function checkLoop() {
      checkForProcessNumChange();
      setTimeout(checkLoop, PROCESS_SHUTDOWN_FILE_CHECK_INTERVAL_MS);
    }, PROCESS_SHUTDOWN_FILE_CHECK_INTERVAL_MS);

    // try to load the config file
    const hubConfig = (await import(resolve(cliOptions.config))).Config;

    // Read PeerID from 1. CLI option, 2. Environment variable, 3. Config file
    let peerId;
    if (cliOptions.id) {
      const peerIdR = await ResultAsync.fromPromise(readPeerId(resolve(cliOptions.id)), (e) => e);
      if (peerIdR.isErr()) {
        throw new Error(
          `Failed to read identity from ${cliOptions.id}: ${peerIdR.error}.\nPlease run "yarn identity create" to create a new identity.`
        );
      } else {
        peerId = peerIdR.value;
      }
    } else if (process.env['IDENTITY_B64']) {
      // Read from the environment variable
      const identityProtoBytes = Buffer.from(process.env['IDENTITY_B64'], 'base64');
      const peerIdResult = await ResultAsync.fromPromise(createFromProtobuf(identityProtoBytes), (e) => {
        return new Error(`Failed to read identity from environment: ${e}`);
      });

      if (peerIdResult.isErr()) {
        throw peerIdResult.error;
      }

      peerId = peerIdResult.value;
      logger.info({ identity: peerId.toString() }, 'Read identity from environment');
    } else {
      const peerIdR = await ResultAsync.fromPromise(readPeerId(resolve(hubConfig.id)), (e) => e);
      if (peerIdR.isErr()) {
        throw new Error(
          `Failed to read identity from ${cliOptions.id}: ${peerIdR.error}.\nPlease run "yarn identity create" to create a new identity.`
        );
      } else {
        peerId = peerIdR.value;
      }
    }

    // Read RPC Auth from 1. CLI option, 2. Environment variable, 3. Config file
    let rpcAuth;
    if (cliOptions.rpcAuth) {
      rpcAuth = cliOptions.rpcAuth;
    } else if (process.env['RPC_AUTH']) {
      rpcAuth = process.env['RPC_AUTH'];
    } else {
      rpcAuth = hubConfig.rpcAuth;
    }

    // Check if the DB_RESET_TOKEN env variable is set. If it is, we might need to reset the DB.
    const dbResetToken = process.env['DB_RESET_TOKEN'];
    if (dbResetToken) {
      // Read the contents of the "db_reset_token.txt" file, and if the number is
      // different from the DB_RESET_TOKEN env variable, then we should reset the DB
      const dbResetTokenFile = `${processFileDir}/db_reset_token.txt`;
      let dbResetTokenFileContents = '';
      try {
        dbResetTokenFileContents = fs.readFileSync(dbResetTokenFile, 'utf8').trim();
      } catch (err) {
        // Ignore error
      }

      if (dbResetTokenFileContents !== dbResetToken) {
        // Write the new token to the file
        fs.mkdirSync(processFileDir, { recursive: true });
        fs.writeFileSync(dbResetTokenFile, dbResetToken);

        // Reset the DB
        logger.warn({ dbResetTokenFileContents, dbResetToken }, 'Resetting DB since DB_RESET_TOKEN was set');
        cliOptions.dbReset = true;
      }
    }

    const network = cliOptions.network ?? hubConfig.network;

    let testUsers;
    if (process.env['TEST_USERS']) {
      if (network === FarcasterNetwork.DEVNET || network === FarcasterNetwork.TESTNET) {
        try {
          const testUsersResult = JSON.parse(process.env['TEST_USERS'].replaceAll("'", '"') ?? '');

          if (testUsersResult && testUsersResult.length > 0) {
            logger.info('TEST_USERS is set, will periodically add data to test users');
            testUsers = testUsersResult;
          }
        } catch (err) {
          logger.warn({ err }, 'Failed to parse TEST_USERS');
        }
      } else {
        logger.warn({ network }, 'TEST_USERS is set, but network is not DEVNET or TESTNET, ignoring');
      }
    }

    const hubAddressInfo = addressInfoFromParts(
      cliOptions.ip ?? hubConfig.ip,
      cliOptions.gossipPort ?? hubConfig.gossipPort ?? DEFAULT_GOSSIP_PORT
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
      rpcServerHost: hubAddressInfo.value.address,
      announceIp: cliOptions.announceIp ?? hubConfig.announceIp,
      announceServerName: cliOptions.announceServerName ?? hubConfig.announceServerName,
      gossipPort: hubAddressInfo.value.port,
      network,
      ethRpcUrl: cliOptions.ethRpcUrl ?? hubConfig.ethRpcUrl,
      idRegistryAddress: cliOptions.firAddress ?? hubConfig.firAddress,
      nameRegistryAddress: cliOptions.fnrAddress ?? hubConfig.fnrAddress,
      firstBlock: cliOptions.firstBlock ?? hubConfig.firstBlock,
      chunkSize: cliOptions.chunkSize ?? hubConfig.chunkSize ?? DEFAULT_CHUNK_SIZE,
      bootstrapAddrs,
      allowedPeers: cliOptions.allowedPeers ?? hubConfig.allowedPeers,
      rpcPort: cliOptions.rpcPort ?? hubConfig.rpcPort ?? DEFAULT_RPC_PORT,
      rpcAuth,
      rocksDBName: cliOptions.dbName ?? hubConfig.dbName,
      resetDB: cliOptions.dbReset ?? hubConfig.dbReset,
      rebuildSyncTrie,
      adminServerEnabled: cliOptions.adminServerEnabled ?? hubConfig.adminServerEnabled,
      adminServerHost: cliOptions.adminServerHost ?? hubConfig.adminServerHost,
      testUsers,
    };

    const hubResult = Result.fromThrowable(
      () => new Hub(options),
      (e) => new Error(`Failed to create hub: ${e}`)
    )();
    if (hubResult.isErr()) {
      logger.fatal(hubResult.error);
      logger.fatal({ reason: 'Hub Creation failed' }, 'shutting down hub');

      process.exit(1);
    }

    const hub = hubResult.value;
    const startResult = await ResultAsync.fromPromise(hub.start(), (e) => new Error(`Failed to start hub: ${e}`));
    if (startResult.isErr()) {
      logger.fatal(startResult.error);
      logger.fatal({ reason: 'Hub Startup failed' }, 'shutting down hub');
      try {
        await teardown(hub);
      } finally {
        process.exit(1);
      }
    }

    process.stdin.resume();

    process.on('SIGINT', () => {
      handleShutdownSignal('SIGINT');
    });

    process.on('SIGTERM', () => {
      handleShutdownSignal('SIGTERM');
    });

    process.on('SIGQUIT', () => {
      handleShutdownSignal('SIGQUIT');
    });

    process.on('uncaughtException', (err) => {
      logger.error({ reason: 'Uncaught exception' }, 'shutting down hub');
      logger.fatal(err);

      handleShutdownSignal('uncaughtException');
    });

    process.on('unhandledRejection', (err) => {
      logger.error({ reason: 'Unhandled Rejection' }, 'shutting down hub');
      logger.fatal(err);

      handleShutdownSignal('unhandledRejection');
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
    'Farcaster RPC server address:port to connect to (eg. 127.0.0.1:2283)',
    DEFAULT_RPC_CONSOLE
  )
  .option('--insecure', 'Allow insecure connections to the RPC server', false)
  .action(async (cliOptions) => {
    startConsole(cliOptions.server, cliOptions.insecure);
  });

const readPeerId = async (filePath: string) => {
  /* eslint-disable security/detect-non-literal-fs-filename */

  const proto = await readFile(filePath);
  return createFromProtobuf(proto);
};

app.parse(process.argv);
