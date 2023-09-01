import {
  FarcasterNetwork,
  getInsecureHubRpcClient,
  getSSLHubRpcClient,
  HubInfoRequest,
  SyncStatusRequest,
} from "@farcaster/hub-nodejs";
import { peerIdFromString } from "@libp2p/peer-id";
import { PeerId } from "@libp2p/interface-peer-id";
import { createEd25519PeerId, createFromProtobuf, exportToProtobuf } from "@libp2p/peer-id-factory";
import { AddrInfo } from "@chainsafe/libp2p-gossipsub/types";
import { Command } from "commander";
import fs, { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { Result, ResultAsync } from "neverthrow";
import { dirname, resolve } from "path";
import { exit } from "process";
import { APP_VERSION, FARCASTER_VERSION, Hub, HubOptions } from "./hubble.js";
import { logger } from "./utils/logger.js";
import { addressInfoFromParts, hostPortFromString, ipMultiAddrStrFromAddressInfo, parseAddress } from "./utils/p2p.js";
import { DEFAULT_RPC_CONSOLE, startConsole } from "./console/console.js";
import RocksDB, { DB_DIRECTORY } from "./storage/db/rocksdb.js";
import { parseNetwork } from "./utils/command.js";
import { sleep } from "./utils/crypto.js";
import { Config as DefaultConfig } from "./defaultConfig.js";
import { profileStorageUsed } from "./profile/profile.js";
import { profileRPCServer } from "./profile/rpcProfile.js";
import { profileGossipServer } from "./profile/gossipProfile.js";
import { initializeStatsd } from "./utils/statsd.js";
import OnChainEventStore from "./storage/stores/onChainEventStore.js";
import { startupCheck, StartupCheckStatus } from "./utils/startupCheck.js";
import { goerli, mainnet, optimism } from "viem/chains";
import { finishAllProgressBars } from "./utils/progressBars.js";
import { MAINNET_BOOTSTRAP_PEERS } from "./bootstrapPeers.mainnet.js";

/** A CLI to accept options from the user and start the Hub */

const PEER_ID_FILENAME = "id.protobuf";
const DEFAULT_PEER_ID_DIR = "./.hub";
const DEFAULT_PEER_ID_FILENAME = `default_${PEER_ID_FILENAME}`;
const DEFAULT_PEER_ID_LOCATION = `${DEFAULT_PEER_ID_DIR}/${DEFAULT_PEER_ID_FILENAME}`;
const DEFAULT_CHUNK_SIZE = 10000;
const DEFAULT_FNAME_SERVER_URL = "https://fnames.farcaster.xyz";

const DEFAULT_GOSSIP_PORT = 2282;
const DEFAULT_RPC_PORT = 2283;

// Grace period before exiting the process after receiving a SIGINT or SIGTERM
const PROCESS_SHUTDOWN_FILE_CHECK_INTERVAL_MS = 10_000;
const SHUTDOWN_GRACE_PERIOD_MS = 30_000;
let isExiting = false;

const parseNumber = (string: string) => {
  const number = Number(string);
  if (isNaN(number)) throw new Error("Not a number.");
  return number;
};

const app = new Command();
app.name("hub").description("Farcaster Hub").version(APP_VERSION);

/*//////////////////////////////////////////////////////////////
                          START COMMAND
//////////////////////////////////////////////////////////////*/

app
  .command("start")
  .description("Start a Hub")

  // Hubble Options
  .option("-n --network <network>", "ID of the Farcaster Network (default: 3 (devnet))", parseNetwork)
  .option("-i, --id <filepath>", "Path to the PeerId file.")
  .option("-c, --config <filepath>", "Path to the config file.")
  .option("--db-name <name>", "The name of the RocksDB instance. (default: rocks.hub._default)")
  .option("--admin-server-enabled", "Enable the admin server. (default: disabled)")
  .option("--admin-server-host <host>", "The host the admin server should listen on. (default: '127.0.0.1')")
  .option("--process-file-prefix <prefix>", 'Prefix for file to which hub process number is written. (default: "")')

  // Ethereum Options
  .option("-m, --eth-mainnet-rpc-url <url>", "RPC URL of a Mainnet ETH Node (or comma separated list of URLs)")
  .option("--rank-rpcs", "Rank the RPCs by latency/stability and use the fastest one (default: disabled)")
  .option("--fname-server-url <url>", `The URL for the FName registry server (default: ${DEFAULT_FNAME_SERVER_URL}`)
  .option("--fir-address <address>", "The address of the Farcaster ID Registry contract")
  .option("--first-block <number>", "The block number to begin syncing events from Farcaster contracts", parseNumber)

  // L2 Options
  .option("-l, --l2-rpc-url <url>", "RPC URL of a mainnet Optimism Node (or comma separated list of URLs)")
  .option("--l2-id-registry-address <address>", "The address of the L2 Farcaster ID Registry contract")
  .option("--l2-key-registry-address <address>", "The address of the L2 Farcaster Key Registry contract")
  .option("--l2-storage-registry-address <address>", "The address of the L2 Farcaster Storage Registry contract")
  .option("--l2-resync-events", "Resync events from the L2 Farcaster contracts before starting (default: disabled)")
  .option(
    "--l2-first-block <number>",
    "The block number to begin syncing events from L2 Farcaster contracts",
    parseNumber,
  )
  .option(
    "--l2-chunk-size <number>",
    "The number of events to fetch from L2 Farcaster contracts at a time",
    parseNumber,
  )
  .option("--l2-chain-id <number>", "The chain ID of the L2 Farcaster contracts are deployed to", parseNumber)
  .option(
    "--l2-rent-expiry-override <number>",
    "The storage rent expiry in seconds to use instead of the default 1 year (ONLY FOR TESTS)",
    parseNumber,
  )

  // Networking Options
  .option("-a, --allowed-peers <peerIds...>", "Only peer with specific peer ids. (default: all peers allowed)")
  .option("--denied-peers <peerIds...>", "Do not peer with specific peer ids. (default: no peers denied)")
  .option("-b, --bootstrap <peer-multiaddrs...>", "Peers to bootstrap gossip and sync from. (default: none)")
  .option("-g, --gossip-port <port>", `Port to use for gossip (default: ${DEFAULT_GOSSIP_PORT})`)
  .option("-r, --rpc-port <port>", `Port to use for gRPC  (default: ${DEFAULT_RPC_PORT})`)
  .option("--ip <ip-address>", 'IP address to listen on (default: "127.0.0.1")')
  .option("--announce-ip <ip-address>", "Public IP address announced to peers (default: fetched with external service)")
  .option(
    "--announce-server-name <name>",
    'Server name announced to peers, useful if SSL/TLS enabled. (default: "none")',
  )
  .option("--direct-peers <peer-multiaddrs...>", "A list of peers for libp2p to directly peer with (default: [])")
  .option(
    "--rpc-rate-limit <number>",
    "RPC rate limit for peers specified in rpm. Set to -1 for none. (default: 20k/min)",
  )

  // Metrics
  .option(
    "--statsd-metrics-server <host>",
    'The host to send statsd metrics to, eg "127.0.0.1:8125". (default: disabled)',
  )
  .option("--gossip-metrics-enabled", "Generate tracing and metrics for the gossip network. (default: disabled)")

  // Debugging options
  .option(
    "--disable-console-status",
    "Immediately log to STDOUT, and disable console status and progressbars. (default: disabled)",
  )
  .option("--profile-sync", "Profile a full hub sync and exit. (default: disabled)")
  .option("--rebuild-sync-trie", "Rebuild the sync trie before starting (default: disabled)")
  .option("--resync-eth-events", "Resync events from the Farcaster contracts before starting (default: disabled)")
  .option("--resync-name-events", "Resync events from the Fname server before starting (default: disabled)")
  .option(
    "--chunk-size <number>",
    `The number of blocks to batch when syncing historical events from Farcaster contracts. (default: ${DEFAULT_CHUNK_SIZE})`,
    parseNumber,
  )
  .option("--commit-lock-timeout <number>", "Rocks DB commit lock timeout in milliseconds (default: 500)", parseNumber)
  .option("--commit-lock-max-pending <number>", "Rocks DB commit lock max pending jobs (default: 1000)", parseNumber)
  .option("--rpc-auth <username:password,...>", "Require username-password auth for RPC submit. (default: disabled)")

  // To be deprecated
  .option("--fnr-address <address>", "The address of the Farcaster Name Registry contract")

  .action(async (cliOptions) => {
    const handleShutdownSignal = (signalName: string) => {
      logger.flush();

      logger.warn(`${signalName} received`);
      if (!isExiting) {
        isExiting = true;
        hub
          .teardown()
          .then(() => {
            logger.info("Hub stopped gracefully");
            process.exit(0);
          })
          .catch((err) => {
            logger.error({ reason: `Error stopping hub: ${err}` });
            process.exit(1);
          });

        setTimeout(() => {
          logger.fatal("Forcing exit after grace period");
          process.exit(1);
        }, SHUTDOWN_GRACE_PERIOD_MS);
      }
    };

    // Start the logger off in buffered mode
    logger.$.startBuffering();

    console.log("\n Hubble Startup Checks");
    console.log("------------------------");

    startupCheck.printStartupCheckStatus(
      StartupCheckStatus.OK,
      `Farcaster: ${FARCASTER_VERSION} Hubble: ${APP_VERSION}`,
    );

    // We'll write our process number to a file so that we can detect if another hub process has taken over.
    const processFileDir = `${DB_DIRECTORY}/process/`;
    const processFilePrefix = cliOptions.processFilePrefix?.concat("_") ?? "";
    const processFileName = `${processFilePrefix}process_number.txt`;

    startupCheck.directoryWritable(DB_DIRECTORY);

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

      fs.readFile(`${processFileDir}${processFileName}`, "utf8", async (err, data) => {
        if (err) {
          logger.error(`Error reading processnum file: ${err}`);
          return;
        }

        const readProcessNum = parseInt(data.trim());
        if (!isNaN(readProcessNum) && readProcessNum !== processNum) {
          logger.error(`Another hub process is running with processNum ${readProcessNum}, exiting`);
          handleShutdownSignal("SIGTERM");
        }
      });
    };

    setTimeout(function checkLoop() {
      checkForProcessNumChange();
      setTimeout(checkLoop, PROCESS_SHUTDOWN_FILE_CHECK_INTERVAL_MS);
    }, PROCESS_SHUTDOWN_FILE_CHECK_INTERVAL_MS);

    // try to load the config file
    // rome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
    let hubConfig: any = DefaultConfig;
    if (cliOptions.config) {
      if (!cliOptions.config.endsWith(".js")) {
        startupCheck.printStartupCheckStatus(StartupCheckStatus.ERROR, "Config file must be a .js file");
        throw new Error(`Config file ${cliOptions.config} must be a .js file`);
      }

      if (!fs.existsSync(resolve(cliOptions.config))) {
        startupCheck.printStartupCheckStatus(
          StartupCheckStatus.ERROR,
          `Config file ${cliOptions.config} does not exist`,
        );
        throw new Error(`Config file ${cliOptions.config} does not exist`);
      }

      startupCheck.printStartupCheckStatus(StartupCheckStatus.OK, `Loading config file ${cliOptions.config}`);
      hubConfig = (await import(resolve(cliOptions.config))).Config;
    }

    const disableConsoleStatus = cliOptions.disableConsoleStatus ?? hubConfig.disableConsoleStatus ?? false;
    if (disableConsoleStatus) {
      logger.info("Interactive Progress Bars disabled");
      logger.flush();
      finishAllProgressBars();
    }

    // Read PeerID from 1. CLI option, 2. Environment variable, 3. Config file
    let peerId;
    if (cliOptions.id) {
      const peerIdR = await ResultAsync.fromPromise(readPeerId(resolve(cliOptions.id)), (e) => e);
      if (peerIdR.isErr()) {
        startupCheck.printStartupCheckStatus(
          StartupCheckStatus.ERROR,
          `Failed to read identity from ${cliOptions.id}. Please run "yarn identity create".`,
          "https://www.thehubble.xyz/intro/install.html#installing-hubble\n",
        );
        process.exit(1);
      } else {
        peerId = peerIdR.value;
      }
    } else if (process.env["IDENTITY_B64"]) {
      // Read from the environment variable
      const identityProtoBytes = Buffer.from(process.env["IDENTITY_B64"], "base64");
      const peerIdResult = await ResultAsync.fromPromise(createFromProtobuf(identityProtoBytes), (e) => {
        throw new Error("Failed to read identity from environment");
      });

      if (peerIdResult.isErr()) {
        throw peerIdResult.error;
      }

      peerId = peerIdResult.value;
      logger.info({ identity: peerId.toString() }, "Read identity from environment");
    } else {
      const idFile = resolve(hubConfig.id ?? DEFAULT_PEER_ID_LOCATION);
      startupCheck.directoryWritable(dirname(idFile));

      const peerIdR = await ResultAsync.fromPromise(readPeerId(idFile), (e) => e);
      if (peerIdR.isErr()) {
        startupCheck.printStartupCheckStatus(
          StartupCheckStatus.ERROR,
          `Failed to read identity from ${idFile}. Please run "yarn identity create".`,
          "https://www.thehubble.xyz/intro/install.html#installing-hubble\n",
        );

        process.exit(1);
      } else {
        peerId = peerIdR.value;
      }
    }

    startupCheck.printStartupCheckStatus(StartupCheckStatus.OK, `Found PeerId ${peerId.toString()}`);

    // Read RPC Auth from 1. CLI option, 2. Environment variable, 3. Config file
    let rpcAuth;
    if (cliOptions.rpcAuth) {
      rpcAuth = cliOptions.rpcAuth;
    } else if (process.env["RPC_AUTH"]) {
      rpcAuth = process.env["RPC_AUTH"];
    } else {
      rpcAuth = hubConfig.rpcAuth;
    }

    // Read the rpcRateLimit
    let rpcRateLimit;
    if (cliOptions.rpcRateLimit) {
      rpcRateLimit = cliOptions.rpcRateLimit;
    } else {
      rpcRateLimit = hubConfig.rpcRateLimit;
    }

    // Check if the DB_RESET_TOKEN env variable is set. If it is, we might need to reset the DB.
    let resetDB = false;
    const dbResetToken = process.env["DB_RESET_TOKEN"];
    if (dbResetToken) {
      // Read the contents of the "db_reset_token.txt" file, and if the number is
      // different from the DB_RESET_TOKEN env variable, then we should reset the DB
      const dbResetTokenFile = `${processFileDir}/db_reset_token.txt`;
      let dbResetTokenFileContents = "";
      try {
        dbResetTokenFileContents = fs.readFileSync(dbResetTokenFile, "utf8").trim();
      } catch (err) {
        // Ignore error
      }

      if (dbResetTokenFileContents !== dbResetToken) {
        // Write the new token to the file
        fs.mkdirSync(processFileDir, { recursive: true });
        fs.writeFileSync(dbResetTokenFile, dbResetToken);

        // Reset the DB
        logger.warn({ dbResetTokenFileContents, dbResetToken }, "Resetting DB since DB_RESET_TOKEN was set");
        resetDB = true;
      }
    }

    // Metrics
    const statsDServer = cliOptions.statsdMetricsServer ?? hubConfig.statsdMetricsServer;
    if (statsDServer) {
      const server = hostPortFromString(statsDServer);
      if (server.isErr()) {
        logger.error({ err: server.error }, "Failed to parse statsd server. Statsd disabled");
      } else {
        logger.info({ server: server.value }, "Statsd server specified. Statsd enabled");
        initializeStatsd(server.value.address, server.value.port);
        startupCheck.printStartupCheckStatus(StartupCheckStatus.OK, "Hubble Monitoring enabled");
      }
    } else {
      startupCheck.printStartupCheckStatus(
        StartupCheckStatus.WARNING,
        "Hubble Monitoring is disabled",
        "https://www.thehubble.xyz/intro/install.html#monitoring-hubble",
      );
      logger.info({}, "No statsd server specified. Statsd disabled");
    }

    const network = cliOptions.network ?? hubConfig.network;
    startupCheck.printStartupCheckStatus(
      StartupCheckStatus.OK,
      `Network is ${FarcasterNetwork[network]?.toString()}(${network})`,
    );

    let testUsers;
    if (process.env["TEST_USERS"]) {
      if (network === FarcasterNetwork.DEVNET || network === FarcasterNetwork.TESTNET) {
        try {
          const testUsersResult = JSON.parse(process.env["TEST_USERS"].replaceAll("'", '"') ?? "");

          if (testUsersResult && testUsersResult.length > 0) {
            logger.info("TEST_USERS is set, will periodically add data to test users");
            testUsers = testUsersResult;
          }
        } catch (err) {
          logger.warn({ err }, "Failed to parse TEST_USERS");
        }
      } else {
        logger.warn({ network }, "TEST_USERS is set, but network is not DEVNET or TESTNET, ignoring");
      }
    }

    const hubAddressInfo = addressInfoFromParts(
      cliOptions.ip ?? hubConfig.ip,
      cliOptions.gossipPort ?? hubConfig.gossipPort ?? DEFAULT_GOSSIP_PORT,
    );

    if (hubAddressInfo.isErr()) {
      throw hubAddressInfo.error;
    }

    const ipMultiAddrResult = ipMultiAddrStrFromAddressInfo(hubAddressInfo.value);
    if (ipMultiAddrResult.isErr()) {
      throw ipMultiAddrResult.error;
    }

    const bootstrapAddrs = (
      (cliOptions.bootstrap ??
        hubConfig.bootstrap ??
        (network === FarcasterNetwork.MAINNET ? MAINNET_BOOTSTRAP_PEERS : [])) as string[]
    )
      .map((a) => parseAddress(a))
      .map((a) => {
        if (a.isErr()) {
          logger.warn(
            { errorCode: a.error.errCode, message: a.error.message },
            "Couldn't parse bootstrap address, ignoring",
          );
        }
        return a;
      })
      .filter((a) => a.isOk())
      .map((a) => a._unsafeUnwrap());
    if (bootstrapAddrs.length > 0) {
      startupCheck.printStartupCheckStatus(StartupCheckStatus.OK, `Bootstrapping from ${bootstrapAddrs.length} peers`);
    } else {
      startupCheck.printStartupCheckStatus(
        StartupCheckStatus.WARNING,
        "No bootstrap peers specified. Hubble will not be able to sync without them.",
        "https://www.thehubble.xyz/intro/networks.html",
      );
    }

    const directPeers = ((cliOptions.directPeers ?? hubConfig.directPeers ?? []) as string[])
      .map((a) => parseAddress(a))
      .map((a) => {
        if (a.isErr()) {
          logger.warn(
            { errorCode: a.error.errCode, message: a.error.message },
            "Couldn't parse direct peer address, ignoring",
          );
        } else if (a.value.getPeerId()) {
          logger.warn(
            { errorCode: "unavailable", message: "peer id missing from direct peer" },
            "Direct peer missing peer id, ignoring",
          );
        }

        return a;
      })
      .filter((a) => a.isOk() && a.value.getPeerId())
      .map((a) => a._unsafeUnwrap())
      .map((a) => {
        return {
          id: peerIdFromString(a.getPeerId() ?? ""),
          addrs: [a],
        } as AddrInfo;
      });

    const rebuildSyncTrie = cliOptions.rebuildSyncTrie ?? hubConfig.rebuildSyncTrie ?? false;
    const profileSync = cliOptions.profileSync ?? hubConfig.profileSync ?? false;

    const options: HubOptions = {
      peerId,
      ipMultiAddr: ipMultiAddrResult.value,
      rpcServerHost: hubAddressInfo.value.address,
      announceIp: cliOptions.announceIp ?? hubConfig.announceIp,
      announceServerName: cliOptions.announceServerName ?? hubConfig.announceServerName,
      gossipPort: hubAddressInfo.value.port,
      network,
      ethMainnetRpcUrl: cliOptions.ethMainnetRpcUrl ?? hubConfig.ethMainnetRpcUrl,
      fnameServerUrl: cliOptions.fnameServerUrl ?? hubConfig.fnameServerUrl ?? DEFAULT_FNAME_SERVER_URL,
      rankRpcs: cliOptions.rankRpcs ?? hubConfig.rankRpcs ?? false,
      idRegistryAddress: cliOptions.firAddress ?? hubConfig.firAddress,
      nameRegistryAddress: cliOptions.fnrAddress ?? hubConfig.fnrAddress,
      firstBlock: cliOptions.firstBlock ?? hubConfig.firstBlock,
      chunkSize: cliOptions.chunkSize ?? hubConfig.chunkSize ?? DEFAULT_CHUNK_SIZE,
      l2RpcUrl: cliOptions.l2RpcUrl ?? hubConfig.l2RpcUrl,
      l2IdRegistryAddress: cliOptions.l2IdRegistryAddress ?? hubConfig.l2IdRegistryAddress,
      l2KeyRegistryAddress: cliOptions.l2KeyRegistryAddress ?? hubConfig.l2KeyRegistryAddress,
      l2StorageRegistryAddress: cliOptions.l2StorageRegistryAddress ?? hubConfig.l2StorageRegistryAddress,
      l2FirstBlock: cliOptions.l2FirstBlock ?? hubConfig.l2FirstBlock,
      l2ChunkSize: cliOptions.l2ChunkSize ?? hubConfig.l2ChunkSize,
      l2ChainId: cliOptions.l2ChainId ?? hubConfig.l2ChainId,
      l2ResyncEvents: cliOptions.l2ResyncEvents ?? hubConfig.l2ResyncEvents ?? false,
      l2RentExpiryOverride: cliOptions.l2RentExpiryOverride ?? hubConfig.l2RentExpiryOverride,
      bootstrapAddrs,
      allowedPeers: cliOptions.allowedPeers ?? hubConfig.allowedPeers,
      deniedPeers: cliOptions.deniedPeers ?? hubConfig.deniedPeers,
      rpcPort: cliOptions.rpcPort ?? hubConfig.rpcPort ?? DEFAULT_RPC_PORT,
      rpcAuth,
      rpcRateLimit,
      rocksDBName: cliOptions.dbName ?? hubConfig.dbName,
      resetDB,
      rebuildSyncTrie,
      profileSync,
      resyncEthEvents: cliOptions.resyncEthEvents ?? hubConfig.resyncEthEvents ?? false,
      resyncNameEvents: cliOptions.resyncNameEvents ?? hubConfig.resyncNameEvents ?? false,
      commitLockTimeout: cliOptions.commitLockTimeout ?? hubConfig.commitLockTimeout,
      commitLockMaxPending: cliOptions.commitLockMaxPending ?? hubConfig.commitLockMaxPending,
      adminServerEnabled: cliOptions.adminServerEnabled ?? hubConfig.adminServerEnabled,
      adminServerHost: cliOptions.adminServerHost ?? hubConfig.adminServerHost,
      testUsers: testUsers,
      gossipMetricsEnabled: cliOptions.gossipMetricsEnabled ?? false,
      directPeers,
    };

    await startupCheck.rpcCheck(options.ethMainnetRpcUrl, mainnet, "L1");
    await startupCheck.rpcCheck(options.l2RpcUrl, optimism, "L2", options.l2ChainId);

    if (startupCheck.anyFailedChecks()) {
      logger.fatal({ reason: "Startup checks failed" }, "shutting down hub");
      logger.flush();
      process.exit(1);
    }

    const hubResult = Result.fromThrowable(
      () => new Hub(options),
      (e) => new Error(`Failed to create hub: ${e}`),
    )();
    if (hubResult.isErr()) {
      if (!startupCheck.anyFailedChecks()) {
        logger.fatal(hubResult.error);
        logger.fatal({ reason: "Hub Creation failed" }, "shutting down hub");

        logger.flush();
      }
      process.exit(1);
    }

    if (statsDServer && !disableConsoleStatus) {
      console.log("\nMonitor Your Node");
      console.log("----------------");
      console.log("🔗 | Grafana at http://localhost:3000");
    }

    if (!disableConsoleStatus) {
      console.log("\n Starting Hubble");
      console.log("------------------");
      console.log("Please wait... This may take several minutes");
    }

    const hub = hubResult.value;
    const startResult = await ResultAsync.fromPromise(
      hub.start(),
      (e) => new Error("Failed to start hub", { cause: e }),
    );
    if (startResult.isErr()) {
      logger.fatal(startResult.error);
      logger.fatal({ reason: "Hub Startup failed" }, "shutting down hub");
      try {
        await hub.teardown();
      } finally {
        logger.flush();
        process.exit(1);
      }
    }

    process.stdin.resume();

    process.on("SIGINT", () => {
      handleShutdownSignal("SIGINT");
    });

    process.on("SIGTERM", () => {
      handleShutdownSignal("SIGTERM");
    });

    process.on("SIGQUIT", () => {
      handleShutdownSignal("SIGQUIT");
    });

    process.on("uncaughtException", (err) => {
      logger.error({ reason: "Uncaught exception" }, "shutting down hub");
      logger.fatal(err);

      handleShutdownSignal("uncaughtException");
    });

    process.on("unhandledRejection", (err) => {
      logger.error({ reason: "Unhandled Rejection" }, "shutting down hub");
      logger.fatal(err);

      handleShutdownSignal("unhandledRejection");
    });
  });

/*//////////////////////////////////////////////////////////////
                        IDENTITY COMMAND
//////////////////////////////////////////////////////////////*/

/** Write a given PeerId to a file */
const writePeerId = async (peerId: PeerId, filepath: string) => {
  const directory = dirname(filepath);
  const proto = exportToProtobuf(peerId);
  // Handling: using try-catch is more ergonomic than capturing and handling throwable, since we
  // want a fast failure back to the CLI
  try {
    // Safety: directory, writefile are provided from the command line, and safe to trust
    if (!existsSync(directory)) {
      await mkdir(directory, { recursive: true });
    }
    await writeFile(filepath, proto, "binary");
    // rome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
  } catch (err: any) {
    throw new Error(err);
  }
  logger.info(`Wrote peerId: ${peerId.toString()} to ${filepath}`);
};

const createIdCommand = new Command("create")
  .description(
    "Create a new peerId and write it to a file.\n\nNote: This command will always overwrite the default PeerId file.",
  )
  .option("-O, --output <directory>", "Path to where the generated PeerIds should be stored", DEFAULT_PEER_ID_DIR)
  .option("-N, --count <number>", "Number of PeerIds to generate", parseNumber, 1)
  .action(async (options) => {
    for (let i = 0; i < options.count; i++) {
      const peerId = await createEd25519PeerId();

      if (i === 0) {
        // Create a copy of the first peerId as the default one to use
        await writePeerId(peerId, resolve(`${options.output}/${DEFAULT_PEER_ID_FILENAME}`));
      }

      const path = `${options.output}/${peerId.toString()}_${PEER_ID_FILENAME}`;
      await writePeerId(peerId, resolve(path));
    }

    exit(0);
  });

const verifyIdCommand = new Command("verify")
  .description("Verify a peerId file")
  .option("-I, --id <filepath>", "Path to the PeerId file", DEFAULT_PEER_ID_LOCATION)
  .action(async (options) => {
    const peerId = await readPeerId(options.id);
    logger.info(`Successfully Read peerId: ${peerId.toString()} from ${options.id}`);
    exit(0);
  });

app
  .command("identity")
  .description("Create or verify a peerID")
  .addCommand(createIdCommand)
  .addCommand(verifyIdCommand);

/*//////////////////////////////////////////////////////////////
                          STATUS COMMAND
//////////////////////////////////////////////////////////////*/
// Deprecated. Please use grafana monitoring instead.
app
  .command("status")
  .description("Reports the db and sync status of the hub")
  .option(
    "-s, --server <url>",
    "Farcaster RPC server address:port to connect to (eg. 127.0.0.1:2283)",
    DEFAULT_RPC_CONSOLE,
  )
  .option("--insecure", "Allow insecure connections to the RPC server", false)
  .option("--watch", "Keep running and periodically report status", false)
  .option("-p, --peerId <peerId>", "Peer id of the hub to compare with (defaults to bootstrap peers)")
  .action(async (cliOptions) => {
    let rpcClient;
    if (cliOptions.insecure) {
      rpcClient = getInsecureHubRpcClient(cliOptions.server);
    } else {
      rpcClient = getSSLHubRpcClient(cliOptions.server);
    }
    const infoResult = await rpcClient.getInfo(HubInfoRequest.create({ dbStats: true }));
    if (infoResult.isErr()) {
      logger.error(
        { errCode: infoResult.error.errCode, errMsg: infoResult.error.message },
        "Failed to get hub status. Do you need to pass in --insecure?",
      );
      exit(1);
    }
    const dbStats = infoResult.value.dbStats;
    logger.info(
      `Hub Version: ${infoResult.value.version} Messages: ${dbStats?.numMessages} FIDs: ${dbStats?.numFidEvents} FNames: ${dbStats?.numFnameEvents}}`,
    );
    for (;;) {
      logger.warn(
        "DEPRECATION WARNING:" +
          "The 'status' command has been deprecated, and will be removed in a future release." +
          "Please use Grafana monitoring. See https://www.thehubble.xyz/intro/monitoring.html",
      );
      const syncResult = await rpcClient.getSyncStatus(SyncStatusRequest.create({ peerId: cliOptions.peerId }));
      if (syncResult.isErr()) {
        logger.error(
          { errCode: syncResult.error.errCode, errMsg: syncResult.error.message },
          "Failed to get sync status",
        );
        exit(1);
      }

      let isSyncing = false;
      const syncEngingStarted = syncResult.value.engineStarted;
      const msgPercents: number[] = [];
      for (const peerStatus of syncResult.value.syncStatus) {
        if (peerStatus.theirMessages === 0) {
          continue;
        }
        const messagePercent = (peerStatus.ourMessages / peerStatus.theirMessages) * 100;
        msgPercents.push(messagePercent);
        if (syncResult.value.isSyncing) {
          isSyncing = true;
        }
      }

      const numPeers = msgPercents.length;
      if (syncEngingStarted === false && numPeers === 0) {
        logger.info("Sync Status: Getting blockchain events (Sync not started yet)");
      } else if (numPeers === 0) {
        logger.info("Sync Status: No peers");
      } else {
        const avgMsgPercent = msgPercents.reduce((a, b) => a + b, 0) / numPeers;
        if (isSyncing) {
          logger.info(
            `Sync Status: Sync in progress. Hub has ${avgMsgPercent.toFixed(2)}% of messages of ${numPeers} peers`,
          );
        } else {
          logger.info(`Sync Status: Hub has ${avgMsgPercent.toFixed(2)}% of messages of ${numPeers} peers`);
        }
      }

      if (!cliOptions.watch) {
        break;
      }

      await sleep(60 * 1000);
    }
    exit(0);
  });

/*//////////////////////////////////////////////////////////////
                          PROFILE COMMAND
//////////////////////////////////////////////////////////////*/

const storageProfileCommand = new Command("storage")
  .description("Profile the storage layout of the hub, accounting for all the storage")
  .option("--db-name <name>", "The name of the RocksDB instance")
  .option("-c, --config <filepath>", "Path to a config file with options")
  .option("-o, --output <filepath>", "Path to a file to write the profile to")
  .action(async (cliOptions) => {
    const hubConfig = cliOptions.config ? (await import(resolve(cliOptions.config))).Config : DefaultConfig;
    const rocksDBName = cliOptions.dbName ?? hubConfig.dbName ?? "";
    const rocksDB = new RocksDB(rocksDBName);

    if (!rocksDBName) throw new Error("No RocksDB name provided.");
    const dbResult = await ResultAsync.fromPromise(rocksDB.open(), (e) => e as Error);
    if (dbResult.isErr()) {
      logger.warn({ rocksDBName }, "Failed to open RocksDB. The Hub needs to be stopped to run this command.");
    } else {
      await profileStorageUsed(rocksDB, cliOptions.output);
    }

    await rocksDB.close();
    exit(0);
  });

const rpcProfileCommand = new Command("rpc")
  .description("Profile the RPC server's performance")
  .option(
    "-s, --server <url>",
    "Farcaster RPC server address:port to connect to (eg. 127.0.0.1:2283)",
    DEFAULT_RPC_CONSOLE,
  )
  .option("--insecure", "Allow insecure connections to the RPC server", false)
  .action(async (cliOptions) => {
    profileRPCServer(cliOptions.server, cliOptions.insecure);
  });

const gossipProfileCommand = new Command("gossip")
  .description("Profile the gossip server's performance")
  .option("-n, --num-nodes <threads>:<nodes>", "Number of nodes to simulate. Total is threads * nodes", "3:10")
  .action(async (cliOptions) => {
    profileGossipServer(cliOptions.numNodes);
  });

app
  .command("profile")
  .description("Profile various resources used by the hub")
  .addCommand(gossipProfileCommand)
  .addCommand(rpcProfileCommand)
  .addCommand(storageProfileCommand);

/*//////////////////////////////////////////////////////////////
                          DBRESET COMMAND
//////////////////////////////////////////////////////////////*/

app
  .command("dbreset")
  .description("Completely remove the database")
  .option("--db-name <name>", "The name of the RocksDB instance")
  .option("-c, --config <filepath>", "Path to a config file with options")
  .action(async (cliOptions) => {
    const hubConfig = cliOptions.config ? (await import(resolve(cliOptions.config))).Config : DefaultConfig;
    const rocksDBName = cliOptions.dbName ?? hubConfig.dbName ?? "";

    if (!rocksDBName) throw new Error("No RocksDB name provided.");

    const rocksDB = new RocksDB(rocksDBName);
    const fallback = () => {
      fs.rmSync(rocksDB.location, { recursive: true, force: true });
    };

    const dbResult = await ResultAsync.fromPromise(rocksDB.open(), (e) => e as Error);
    if (dbResult.isErr()) {
      logger.warn({ rocksDBName }, "Failed to open RocksDB, falling back to rm");
      fallback();
    } else {
      const clearResult = await ResultAsync.fromPromise(rocksDB.clear(), (e) => e as Error);
      if (clearResult.isErr()) {
        logger.warn({ rocksDBName }, "Failed to open RocksDB, falling back to rm");
        fallback();
      }

      await rocksDB.close();
    }

    logger.info({ rocksDBName }, "Database cleared.");
    exit(0);
  });

/*//////////////////////////////////////////////////////////////
                          EVENTSRESET COMMAND
//////////////////////////////////////////////////////////////*/

app
  .command("events-reset")
  .description("Clear L2 contract events from the database")
  .option("--db-name <name>", "The name of the RocksDB instance")
  .option("-c, --config <filepath>", "Path to a config file with options")
  .action(async (cliOptions) => {
    const hubConfig = cliOptions.config ? (await import(resolve(cliOptions.config))).Config : DefaultConfig;
    const rocksDBName = cliOptions.dbName ?? hubConfig.dbName ?? "";

    if (!rocksDBName) throw new Error("No RocksDB name provided.");

    const rocksDB = new RocksDB(rocksDBName);

    const dbResult = await ResultAsync.fromPromise(rocksDB.open(), (e) => e as Error);
    if (dbResult.isErr()) {
      logger.warn({ rocksDBName }, "Failed to open RocksDB");
      exit(1);
    } else {
      const count = await OnChainEventStore.clearEvents(rocksDB);
      await rocksDB.close();
      logger.info({ rocksDBName, count }, "Events cleared");
      exit(0);
    }
  });

/*//////////////////////////////////////////////////////////////
                          CONSOLE COMMAND
//////////////////////////////////////////////////////////////*/

app
  .command("console")
  .description("Start a REPL console")
  .option(
    "-s, --server <url>",
    "Farcaster RPC server address:port to connect to (eg. 127.0.0.1:2283)",
    DEFAULT_RPC_CONSOLE,
  )
  .option("--insecure", "Allow insecure connections to the RPC server", false)
  .action(async (cliOptions) => {
    startConsole(cliOptions.server, cliOptions.insecure);
  });

const readPeerId = async (filePath: string) => {
  const proto = await readFile(filePath);
  return createFromProtobuf(proto);
};

app.parse(process.argv);
