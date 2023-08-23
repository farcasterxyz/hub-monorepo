import {
  ContactInfoContent,
  FarcasterNetwork,
  GossipAddressInfo,
  GossipMessage,
  HubState,
  IdRegistryEvent,
  Message,
  NameRegistryEvent,
  HubAsyncResult,
  HubError,
  bytesToHexString,
  bytesToUtf8String,
  HubRpcClient,
  getSSLHubRpcClient,
  getInsecureHubRpcClient,
  UserNameProof,
  AckMessageBody,
  NetworkLatencyMessage,
  OnChainEvent,
  onChainEventTypeToJSON,
  ClientOptions,
} from "@farcaster/hub-nodejs";
import { PeerId } from "@libp2p/interface-peer-id";
import { peerIdFromBytes } from "@libp2p/peer-id";
import { publicAddressesFirst } from "@libp2p/utils/address-sort";
import { Multiaddr, multiaddr } from "@multiformats/multiaddr";
import { Result, ResultAsync, err, ok } from "neverthrow";
import { EthEventsProvider, GoerliEthConstants } from "./eth/ethEventsProvider.js";
import { GossipNode, MAX_MESSAGE_QUEUE_SIZE } from "./network/p2p/gossipNode.js";
import { PeriodicSyncJobScheduler } from "./network/sync/periodicSyncJob.js";
import SyncEngine from "./network/sync/syncEngine.js";
import AdminServer from "./rpc/adminServer.js";
import Server from "./rpc/server.js";
import { getHubState, putHubState } from "./storage/db/hubState.js";
import RocksDB from "./storage/db/rocksdb.js";
import { RootPrefix } from "./storage/db/types.js";
import Engine from "./storage/engine/index.js";
import { PruneEventsJobScheduler } from "./storage/jobs/pruneEventsJob.js";
import { PruneMessagesJobScheduler } from "./storage/jobs/pruneMessagesJob.js";
import { sleep } from "./utils/crypto.js";
import {
  idRegistryEventToLog,
  logger,
  messageToLog,
  messageTypeToName,
  nameRegistryEventToLog,
  onChainEventToLog,
  usernameProofToLog,
} from "./utils/logger.js";
import {
  addressInfoFromGossip,
  addressInfoToString,
  getPublicIp,
  ipFamilyToString,
  p2pMultiAddrStr,
  parseAddress,
} from "./utils/p2p.js";
import { PeriodicTestDataJobScheduler, TestUser } from "./utils/periodicTestDataJob.js";
import { ensureAboveMinFarcasterVersion, VersionSchedule } from "./utils/versions.js";
import { CheckFarcasterVersionJobScheduler } from "./storage/jobs/checkFarcasterVersionJob.js";
import { ValidateOrRevokeMessagesJobScheduler } from "./storage/jobs/validateOrRevokeMessagesJob.js";
import { GossipContactInfoJobScheduler } from "./storage/jobs/gossipContactInfoJob.js";
import { MAINNET_BOOTSTRAP_PEERS } from "./bootstrapPeers.mainnet.js";
import StoreEventHandler from "./storage/stores/storeEventHandler.js";
import { FNameRegistryClient, FNameRegistryEventsProvider } from "./eth/fnameRegistryEventsProvider.js";
import { L2EventsProvider, OptimismConstants } from "./eth/l2EventsProvider.js";
import { GOSSIP_PROTOCOL_VERSION } from "./network/p2p/protocol.js";
import { prettyPrintTable } from "./profile/profile.js";
import packageJson from "./package.json" assert { type: "json" };
import { createPublicClient, fallback, http } from "viem";
import { mainnet } from "viem/chains";
import { AddrInfo } from "@chainsafe/libp2p-gossipsub/types";
import { CheckIncomingPortsJobScheduler } from "./storage/jobs/checkIncomingPortsJob.js";
import { NetworkConfig, applyNetworkConfig, fetchNetworkConfig } from "./network/utils/networkConfig.js";
import { UpdateNetworkConfigJobScheduler } from "./storage/jobs/updateNetworkConfigJob.js";
import { statsd } from "./utils/statsd.js";
import { LATEST_DB_SCHEMA_VERSION, performDbMigrations } from "./storage/db/migrations/migrations.js";
import { addProgressBar, finishAllProgressBars } from "./utils/progressBars.js";

export type HubSubmitSource = "gossip" | "rpc" | "eth-provider" | "l2-provider" | "sync" | "fname-registry";

export const APP_VERSION = packageJson.version;
export const APP_NICKNAME = process.env["HUBBLE_NAME"] ?? "Farcaster Hub";

export const FARCASTER_VERSION = "2023.8.23";
export const FARCASTER_VERSIONS_SCHEDULE: VersionSchedule[] = [
  { version: "2023.3.1", expiresAt: 1682553600000 }, // expires at 4/27/23 00:00 UTC
  { version: "2023.4.19", expiresAt: 1686700800000 }, // expires at 6/14/23 00:00 UTC
  { version: "2023.5.31", expiresAt: 1690329600000 }, // expires at 7/26/23 00:00 UTC
  { version: "2023.7.12", expiresAt: 1693958400000 }, // expires at 9/6/23 00:00 UTC
  { version: "2023.8.23", expiresAt: 1697587200000 }, // expires at 10/18/23 00:00 UTC
];

export interface HubInterface {
  engine: Engine;
  submitMessage(message: Message, source?: HubSubmitSource): HubAsyncResult<number>;
  submitIdRegistryEvent(event: IdRegistryEvent, source?: HubSubmitSource): HubAsyncResult<number>;
  submitNameRegistryEvent(event: NameRegistryEvent, source?: HubSubmitSource): HubAsyncResult<number>;
  submitUserNameProof(usernameProof: UserNameProof, source?: HubSubmitSource): HubAsyncResult<number>;
  submitOnChainEvent(event: OnChainEvent, source?: HubSubmitSource): HubAsyncResult<number>;
  getHubState(): HubAsyncResult<HubState>;
  putHubState(hubState: HubState): HubAsyncResult<void>;
  gossipContactInfo(): HubAsyncResult<void>;
  getRPCClientForPeer(
    peerId: PeerId,
    peer: ContactInfoContent,
    options?: Partial<ClientOptions>,
  ): Promise<HubRpcClient | undefined>;
}

export interface HubOptions {
  /** Farcaster network */
  network: FarcasterNetwork;

  /** The PeerId of this Hub */
  peerId?: PeerId;

  /** Addresses to bootstrap the gossip network */
  bootstrapAddrs?: Multiaddr[];

  /** A list of PeerId strings to allow connections with */
  allowedPeers?: string[];

  /** A list of PeerId strings to disallow connections with */
  deniedPeers?: string[];

  /** IP address string in MultiAddr format to bind the gossip node to */
  ipMultiAddr?: string;

  /** IP address string to bind the RPC server to */
  rpcServerHost?: string;

  /** External IP address to announce to peers. If not provided, it'll fetch the IP from an external service */
  announceIp?: string;

  /** External Server name to announce to peers. If provided, the RPC connection is made to this server name. Useful for SSL/TLS */
  announceServerName?: string;

  /** Port for libp2p to listen for gossip */
  gossipPort?: number;

  /** Port for the RPC Client */
  rpcPort?: number;

  /** Username and Password to use for RPC submit methods */
  rpcAuth?: string;

  /** Enable IP Rate limiting */
  rpcRateLimit?: number;

  /** Rank RPCs and use the ones with best stability and latency */
  rankRpcs?: boolean;

  /** Network URL(s) of the IdRegistry Contract */
  ethRpcUrl?: string;

  /** ETH mainnet RPC URL(s) */
  ethMainnetRpcUrl?: string;

  /** FName Registry Server URL */
  fnameServerUrl?: string;

  /** Network URL(s) of the StorageRegistry Contract */
  l2RpcUrl?: string;

  /** Address of the IdRegistry contract  */
  idRegistryAddress?: `0x${string}`;

  /** Address of the NameRegistryAddress contract  */
  nameRegistryAddress?: `0x${string}`;

  /** Address of the Id Registry contract  */
  l2IdRegistryAddress?: `0x${string}`;

  /** Address of the Key Registry contract  */
  l2KeyRegistryAddress?: `0x${string}`;

  /** Address of the StorageRegistry contract  */
  l2StorageRegistryAddress?: `0x${string}`;

  /** Block number to begin syncing events from  */
  firstBlock?: number;

  /** Number of blocks to batch when syncing historical events  */
  chunkSize?: number;

  /** Block number to begin syncing events from for L2  */
  l2FirstBlock?: number;

  /** Number of blocks to batch when syncing historical events for L2 */
  l2ChunkSize?: number;

  /** Chain Id for L2 */
  l2ChainId?: number;

  /** Storage rent expiry override for tests */
  l2RentExpiryOverride?: number;

  /** Resync l2 events */
  l2ResyncEvents?: boolean;

  /** Resync events */
  resyncEthEvents?: boolean;

  /** Resync fname events */
  resyncNameEvents?: boolean;

  /** Name of the RocksDB instance */
  rocksDBName?: string;

  /** Resets the DB on start, if true */
  resetDB?: boolean;

  /** Profile the sync and exit after done */
  profileSync?: boolean;

  /** Rebuild the sync trie from messages in the DB on startup */
  rebuildSyncTrie?: boolean;

  /** Commit lock timeout in ms */
  commitLockTimeout: number;

  /** Commit lock queue size */
  commitLockMaxPending: number;

  /** Enables the Admin Server */
  adminServerEnabled?: boolean;

  /** Host for the Admin Server to bind to */
  adminServerHost?: string;

  /** Periodically add casts & reactions for the following test users */
  testUsers?: TestUser[];

  /**
   * Only allows the Hub to connect to and advertise local IP addresses
   *
   * Only used by tests
   */
  localIpAddrsOnly?: boolean;

  /** Cron schedule for prune messages job */
  pruneMessagesJobCron?: string;

  /** Cron schedule for prune events job */
  pruneEventsJobCron?: string;

  /** Periodically send network latency ping messages to the gossip network and log metrics */
  gossipMetricsEnabled?: boolean;

  /** A list of addresses the node directly peers with, provided in MultiAddr format */
  directPeers?: AddrInfo[];
}

/** @returns A randomized string of the format `rocksdb.tmp.*` used for the DB Name */
const randomDbName = () => {
  return `rocksdb.tmp.${(new Date().getUTCDate() * Math.random()).toString(36).substring(2)}`;
};

const log = logger.child({
  component: "Hub",
});

export class Hub implements HubInterface {
  private options: HubOptions;
  private gossipNode: GossipNode;
  private rpcServer: Server;
  private adminServer: AdminServer;
  private contactTimer?: NodeJS.Timer;
  private rocksDB: RocksDB;
  private syncEngine: SyncEngine;
  private allowedPeerIds: string[] | undefined;
  private deniedPeerIds: string[];

  private pruneMessagesJobScheduler: PruneMessagesJobScheduler;
  private periodSyncJobScheduler: PeriodicSyncJobScheduler;
  private pruneEventsJobScheduler: PruneEventsJobScheduler;
  private testDataJobScheduler?: PeriodicTestDataJobScheduler;
  private checkFarcasterVersionJobScheduler: CheckFarcasterVersionJobScheduler;
  private validateOrRevokeMessagesJobScheduler: ValidateOrRevokeMessagesJobScheduler;
  private gossipContactInfoJobScheduler: GossipContactInfoJobScheduler;
  private checkIncomingPortsJobScheduler: CheckIncomingPortsJobScheduler;
  private updateNetworkConfigJobScheduler: UpdateNetworkConfigJobScheduler;

  engine: Engine;
  ethRegistryProvider?: EthEventsProvider;
  fNameRegistryEventsProvider?: FNameRegistryEventsProvider;
  l2RegistryProvider?: L2EventsProvider;

  constructor(options: HubOptions) {
    this.options = options;
    this.rocksDB = new RocksDB(options.rocksDBName ? options.rocksDBName : randomDbName());
    this.gossipNode = new GossipNode(this.rocksDB, this.options.network, this.options.gossipMetricsEnabled);

    // Create the ETH registry provider, which will fetch ETH events and push them into the engine.
    // Defaults to Goerli testnet, which is currently used for Production Farcaster Hubs.
    if (options.ethRpcUrl) {
      this.ethRegistryProvider = EthEventsProvider.build(
        this,
        options.ethRpcUrl,
        options.rankRpcs ?? false,
        options.idRegistryAddress ?? GoerliEthConstants.IdRegistryAddress,
        options.nameRegistryAddress ?? GoerliEthConstants.NameRegistryAddress,
        options.firstBlock ?? GoerliEthConstants.FirstBlock,
        options.chunkSize ?? GoerliEthConstants.ChunkSize,
        options.resyncEthEvents ?? false,
      );
    } else {
      log.warn("No ETH RPC URL provided, unable to sync ETH contract events");
      throw new HubError("bad_request.invalid_param", "Invalid eth testnet rpc url");
    }

    if (!options.ethMainnetRpcUrl) {
      log.warn("No ETH mainnet RPC URL provided, unable to validate ens names");
      throw new HubError("bad_request.invalid_param", "Invalid eth mainnet rpc url");
    }

    // Create the L2 registry provider, which will fetch L2 events and push them into the engine.
    // Defaults to OP Goerli testnet, which is currently used for Production Farcaster Hubs.
    if (options.l2RpcUrl) {
      this.l2RegistryProvider = L2EventsProvider.build(
        this,
        options.l2RpcUrl,
        options.rankRpcs ?? false,
        options.l2StorageRegistryAddress ?? OptimismConstants.StorageRegistryAddress,
        options.l2KeyRegistryAddress ?? OptimismConstants.KeyRegistryAddress,
        options.l2IdRegistryAddress ?? OptimismConstants.IdRegistryAddress,
        options.l2FirstBlock ?? OptimismConstants.FirstBlock,
        options.l2ChunkSize ?? OptimismConstants.ChunkSize,
        options.l2ChainId ?? OptimismConstants.ChainId,
        options.l2ResyncEvents ?? false,
        options.l2RentExpiryOverride,
      );
    } else {
      log.warn("No L2 RPC URL provided, unable to sync L2 contract events");
      throw new HubError("bad_request.invalid_param", "Invalid l2 rpc url");
    }

    if (options.fnameServerUrl && options.fnameServerUrl !== "") {
      this.fNameRegistryEventsProvider = new FNameRegistryEventsProvider(
        new FNameRegistryClient(options.fnameServerUrl),
        this,
        options.resyncNameEvents ?? false,
      );
    } else {
      log.warn("No FName Registry URL provided, unable to sync fname events");
      throw new HubError("bad_request.invalid_param", "Invalid fname server url");
    }

    const eventHandler = new StoreEventHandler(this.rocksDB, {
      lockMaxPending: options.commitLockMaxPending,
      lockTimeout: options.commitLockTimeout,
    });

    const ethMainnetRpcUrls = options.ethMainnetRpcUrl.split(",");
    const transports = ethMainnetRpcUrls.map((url) => http(url, { retryCount: 2 }));
    const mainnetClient = createPublicClient({
      chain: mainnet,
      transport: fallback(transports, { rank: options.rankRpcs ?? false }),
    });
    this.engine = new Engine(this.rocksDB, options.network, eventHandler, mainnetClient);

    const profileSync = options.profileSync ?? false;
    this.syncEngine = new SyncEngine(
      this,
      this.rocksDB,
      this.ethRegistryProvider,
      this.l2RegistryProvider,
      profileSync,
    );

    // If profileSync is true, exit after sync is complete
    if (profileSync) {
      this.syncEngine.on("syncComplete", async (success) => {
        if (success) {
          log.info("Sync complete, exiting (profileSync=true)");

          const profileLog = logger.child({ component: "SyncProfile" });

          const profile = this.syncEngine.getSyncProfile();
          if (profile) {
            profileLog.info({ wallTimeMs: profile.getSyncDuration() });

            for (const [method, p] of profile.getAllMethodProfiles()) {
              profileLog.info({ method, p });
            }

            // Also write to console for easy copy/paste
            console.log("\nTotal Time\n");
            console.log(prettyPrintTable(profile.durationToPrettyPrintObject()));

            console.log("\nLatencies (ms)\n");
            console.log(prettyPrintTable(profile.latenciesToPrettyPrintObject()));

            console.log("\nData Fetched (bytes)\n");
            console.log(prettyPrintTable(profile.resultBytesToPrettyPrintObject()));
          }

          await this.stop();
          process.exit(0);
        }
      });
    }

    this.rpcServer = new Server(
      this,
      this.engine,
      this.syncEngine,
      this.gossipNode,
      options.rpcAuth,
      options.rpcRateLimit,
    );
    this.adminServer = new AdminServer(this, this.rocksDB, this.engine, this.syncEngine, options.rpcAuth);

    // Setup job schedulers/workers
    this.pruneMessagesJobScheduler = new PruneMessagesJobScheduler(this.engine);
    this.periodSyncJobScheduler = new PeriodicSyncJobScheduler(this, this.syncEngine);
    this.pruneEventsJobScheduler = new PruneEventsJobScheduler(this.engine);
    this.checkFarcasterVersionJobScheduler = new CheckFarcasterVersionJobScheduler(this);
    this.validateOrRevokeMessagesJobScheduler = new ValidateOrRevokeMessagesJobScheduler(this.rocksDB, this.engine);
    this.gossipContactInfoJobScheduler = new GossipContactInfoJobScheduler(this);
    this.checkIncomingPortsJobScheduler = new CheckIncomingPortsJobScheduler(this.rpcServer, this.gossipNode);
    this.updateNetworkConfigJobScheduler = new UpdateNetworkConfigJobScheduler(this);

    if (options.testUsers) {
      this.testDataJobScheduler = new PeriodicTestDataJobScheduler(this.rpcServer, options.testUsers as TestUser[]);
    }

    // Allowed peers can be undefined, which means permissionless connections
    this.allowedPeerIds = this.options.allowedPeers;
    // Denied peers by default is an empty list
    this.deniedPeerIds = this.options.deniedPeers ?? [];
  }

  get rpcAddress() {
    return this.rpcServer.address;
  }

  get gossipAddresses() {
    return this.gossipNode.multiaddrs ?? [];
  }

  /** Returns the Gossip peerId string of this Hub */
  get identity(): string {
    if (!this.gossipNode.isStarted() || !this.gossipNode.peerId) {
      throw new HubError("unavailable", "cannot start gossip node without identity");
    }
    return this.gossipNode.peerId.toString();
  }

  /* Start the GossipNode and RPC server  */
  async start() {
    // See if we have to fetch the IP address
    if (!this.options.announceIp || this.options.announceIp.trim().length === 0) {
      const ipResult = await getPublicIp();
      if (ipResult.isErr()) {
        log.error(`failed to fetch public IP address, using ${this.options.ipMultiAddr}`, { error: ipResult.error });
      } else {
        this.options.announceIp = ipResult.value;
      }
    }

    let dbResult: Result<void, Error>;
    let retryCount = 0;

    // It is possible that we can't get a lock on the DB in prod, so we retry a few times.
    // This happens if the EFS volume is not mounted yet or is still attached to another instance.
    do {
      dbResult = await ResultAsync.fromPromise(this.rocksDB.open(), (e) => e as Error);
      if (dbResult.isErr()) {
        retryCount++;
        logger.error(
          { retryCount, error: dbResult.error, errorMessage: dbResult.error.message },
          "failed to open rocksdb. Retry in 15s",
        );

        // Sleep for 15s
        await sleep(15 * 1000);
      } else {
        break;
      }
    } while (dbResult.isErr() && retryCount < 5);

    // If the DB is still not open, we throw an error
    if (dbResult.isErr()) {
      throw dbResult.error;
    } else {
      log.info("rocksdb opened");
    }

    if (this.options.resetDB === true) {
      log.info("clearing rocksdb");
      await this.rocksDB.clear();
    } else {
      // Read if the Hub was cleanly shutdown last time
      const cleanShutdownR = await this.wasHubCleanShutdown();
      if (cleanShutdownR.isOk() && !cleanShutdownR.value) {
        log.warn(
          "Hub was NOT shutdown cleanly. Sync might re-fetch messages. Please re-run with --rebuild-sync-trie to rebuild the trie if needed.",
        );
      }
    }

    // Get the Network ID from the DB
    const dbNetworkResult = await this.getDbNetwork();
    if (dbNetworkResult.isOk() && dbNetworkResult.value && dbNetworkResult.value !== this.options.network) {
      throw new HubError(
        "unavailable",
        `network mismatch: DB is ${dbNetworkResult.value}, but Hub is started with ${this.options.network}. Please reset the DB with the 'yarn dbreset' if this is intentional.`,
      );
    }

    // Set the network in the DB
    await this.setDbNetwork(this.options.network);
    log.info(
      `starting hub with Farcaster version ${FARCASTER_VERSION}, app version ${APP_VERSION} and network ${this.options.network}`,
    );

    // Get the DB Schema version
    const dbSchemaVersion = await this.getDbSchemaVersion();
    if (dbSchemaVersion > LATEST_DB_SCHEMA_VERSION) {
      throw new HubError(
        "unavailable.storage_failure",
        `DB schema version is unknown. Do you have the right version of Hubble? DB schema version: ${dbSchemaVersion}, latest supported version: ${LATEST_DB_SCHEMA_VERSION}`,
      );
    }
    if (dbSchemaVersion < LATEST_DB_SCHEMA_VERSION) {
      // We need a migration
      log.info({ dbSchemaVersion, latestDbSchemaVersion: LATEST_DB_SCHEMA_VERSION }, "DB needs migrations");
      const success = await performDbMigrations(this.rocksDB, dbSchemaVersion);
      if (success) {
        log.info({}, "All DB migrations successful");
        await this.setDbSchemaVersion(LATEST_DB_SCHEMA_VERSION);
      } else {
        throw new HubError("unavailable.storage_failure", "DB migrations failed");
      }
    } else {
      log.info({ dbSchemaVersion, latestDbSchemaVersion: LATEST_DB_SCHEMA_VERSION }, "DB schema is up-to-date");
    }

    // Fetch network config
    if (this.options.network === FarcasterNetwork.MAINNET) {
      const networkConfig = await fetchNetworkConfig();
      if (networkConfig.isErr()) {
        log.error("failed to fetch network config", { error: networkConfig.error });
      } else {
        const shouldExit = this.applyNetworkConfig(networkConfig.value);
        if (shouldExit) {
          throw new HubError("unavailable", "Quitting due to network config");
        }
      }
    }
    await this.engine.start();

    // Start the RPC server
    await this.rpcServer.start(this.options.rpcServerHost, this.options.rpcPort ? this.options.rpcPort : 0);
    if (this.options.adminServerEnabled) {
      await this.adminServer.start(this.options.adminServerHost ?? "127.0.0.1");
    }

    // Start the ETH registry provider first
    if (this.ethRegistryProvider) {
      await this.ethRegistryProvider.start();
    }

    // Start the L2 registry provider second
    if (this.l2RegistryProvider) {
      await this.l2RegistryProvider.start();
    }

    await this.fNameRegistryEventsProvider?.start();

    // Start the sync engine
    await this.syncEngine.start(this.options.rebuildSyncTrie ?? false);

    const bootstrapAddrs = this.options.bootstrapAddrs ?? [];

    // Start the Gossip node
    await this.gossipNode.start(bootstrapAddrs, {
      peerId: this.options.peerId,
      ipMultiAddr: this.options.ipMultiAddr,
      announceIp: this.options.announceIp,
      gossipPort: this.options.gossipPort,
      allowedPeerIdStrs: this.allowedPeerIds,
      deniedPeerIdStrs: this.deniedPeerIds,
      directPeers: this.options.directPeers,
    });

    this.registerEventHandlers();

    // Start cron tasks
    this.pruneMessagesJobScheduler.start(this.options.pruneMessagesJobCron);
    this.periodSyncJobScheduler.start();
    this.pruneEventsJobScheduler.start(this.options.pruneEventsJobCron);
    this.checkFarcasterVersionJobScheduler.start();
    this.validateOrRevokeMessagesJobScheduler.start();
    this.gossipContactInfoJobScheduler.start();
    this.checkIncomingPortsJobScheduler.start();

    // Mainnet only jobs
    if (this.options.network === FarcasterNetwork.MAINNET) {
      this.updateNetworkConfigJobScheduler.start();
    }

    // Testnet/Devnet only jobs
    if (this.options.network !== FarcasterNetwork.MAINNET) {
      // Start the test data generator
      this.testDataJobScheduler?.start();
    }

    // When we startup, we write into the DB that we have not yet cleanly shutdown. And when we do
    // shutdown, we'll write "true" to this key, indicating that we've cleanly shutdown.
    // This way, when starting up, we'll know if the previous shutdown was clean or not.
    await this.writeHubCleanShutdown(false);
  }

  /** Apply the new the network config. Will return true if the Hub should exit */
  public applyNetworkConfig(networkConfig: NetworkConfig): boolean {
    const { allowedPeerIds, deniedPeerIds, shouldExit } = applyNetworkConfig(
      networkConfig,
      this.allowedPeerIds,
      this.deniedPeerIds,
      this.options.network,
    );

    if (shouldExit) {
      return true;
    } else {
      this.gossipNode.updateAllowedPeerIds(allowedPeerIds);
      this.allowedPeerIds = allowedPeerIds;

      this.gossipNode.updateDeniedPeerIds(deniedPeerIds);
      this.deniedPeerIds = deniedPeerIds;

      if (!this.l2RegistryProvider?.ready) {
        if (
          networkConfig.storageRegistryAddress &&
          networkConfig.keyRegistryAddress &&
          networkConfig.idRegistryAddress
        ) {
          this.l2RegistryProvider?.setAddresses(
            networkConfig.storageRegistryAddress,
            networkConfig.keyRegistryAddress,
            networkConfig.idRegistryAddress,
          );
          this.l2RegistryProvider?.start();
        }
      }

      log.info({ allowedPeerIds, deniedPeerIds }, "Network config applied");

      return false;
    }
  }

  async getContactInfoContent(): HubAsyncResult<ContactInfoContent> {
    const nodeMultiAddr = this.gossipAddresses[0] as Multiaddr;
    const family = nodeMultiAddr?.nodeAddress().family;
    const announceIp = this.options.announceIp ?? nodeMultiAddr?.nodeAddress().address;
    const gossipPort = nodeMultiAddr?.nodeAddress().port;
    const rpcPort = this.rpcServer.address?.map((addr) => addr.port).unwrapOr(0);

    const gossipAddressContactInfo = GossipAddressInfo.create({ address: announceIp, family, port: gossipPort });
    const rpcAddressContactInfo = GossipAddressInfo.create({
      address: announceIp,
      family,
      port: rpcPort,
      dnsName: this.options.announceServerName ?? "",
    });

    const snapshot = await this.syncEngine.getSnapshot();
    return snapshot.map((snapshot) => {
      return ContactInfoContent.create({
        gossipAddress: gossipAddressContactInfo,
        rpcAddress: rpcAddressContactInfo,
        excludedHashes: snapshot.excludedHashes,
        count: snapshot.numMessages,
        hubVersion: FARCASTER_VERSION,
        network: this.options.network,
        appVersion: APP_VERSION,
      });
    });
  }

  async teardown() {
    await this.stop();
  }

  /** Stop the GossipNode and RPC Server */
  async stop() {
    log.info("Stopping Hubble...");
    clearInterval(this.contactTimer);

    // First, stop the RPC/Gossip server so we don't get any more messages
    await this.rpcServer.stop(true); // Force shutdown until we have a graceful way of ending active streams

    // Stop admin, gossip and sync engine
    await Promise.all([this.adminServer.stop(), this.gossipNode.stop(), this.syncEngine.stop()]);

    // Stop cron tasks
    this.pruneMessagesJobScheduler.stop();
    this.periodSyncJobScheduler.stop();
    this.pruneEventsJobScheduler.stop();
    this.checkFarcasterVersionJobScheduler.stop();
    this.testDataJobScheduler?.stop();
    this.validateOrRevokeMessagesJobScheduler.stop();
    this.gossipContactInfoJobScheduler.stop();
    this.checkIncomingPortsJobScheduler.stop();
    this.updateNetworkConfigJobScheduler.stop();

    // Stop the ETH registry provider
    if (this.ethRegistryProvider) {
      await this.ethRegistryProvider.stop();
    }

    // Stop the L2 registry provider
    if (this.l2RegistryProvider) {
      await this.l2RegistryProvider.stop();
    }

    await this.fNameRegistryEventsProvider?.stop();

    // Stop the engine
    await this.engine.stop();

    // Close the DB, which will flush all data to disk. Just before we close, though, write that
    // we've cleanly shutdown.
    await this.writeHubCleanShutdown(true);
    await this.rocksDB.close();

    log.info("Hubble stopped, exiting normally");
  }

  async getHubState(): HubAsyncResult<HubState> {
    const result = await ResultAsync.fromPromise(getHubState(this.rocksDB), (e) => e as HubError);
    if (result.isErr() && result.error.errCode === "not_found") {
      log.info("hub state not found, resetting state");
      const hubState = HubState.create({ lastEthBlock: 0, lastFnameProof: 0 });
      await putHubState(this.rocksDB, hubState);
      return ok(hubState);
    }
    return result;
  }

  async putHubState(hubState: HubState): HubAsyncResult<void> {
    return await ResultAsync.fromPromise(putHubState(this.rocksDB, hubState), (e) => e as HubError);
  }

  async connectAddress(address: Multiaddr): HubAsyncResult<void> {
    return this.gossipNode.connectAddress(address);
  }

  async gossipContactInfo(): HubAsyncResult<void> {
    const contactInfoResult = await this.getContactInfoContent();
    if (contactInfoResult.isErr()) {
      log.warn(contactInfoResult.error, "failed get contact info content");
      return Promise.resolve(err(contactInfoResult.error));
    } else {
      const contactInfo = contactInfoResult.value;
      log.info(
        { rpcAddress: contactInfo.rpcAddress?.address, rpcPort: contactInfo.rpcAddress?.port },
        "gossiping contact info",
      );

      await this.gossipNode.gossipContactInfo(contactInfo);
      return Promise.resolve(ok(undefined));
    }
  }

  /** ------------------------------------------------------------------------- */
  /*                                  Private Methods                           */
  /* -------------------------------------------------------------------------- */

  private async handleGossipMessage(gossipMessage: GossipMessage): HubAsyncResult<void> {
    const peerIdResult = Result.fromThrowable(
      () => peerIdFromBytes(gossipMessage.peerId ?? new Uint8Array([])),
      (error) => new HubError("bad_request.parse_failure", error as Error),
    )();
    if (peerIdResult.isErr()) {
      return Promise.resolve(err(peerIdResult.error));
    }

    this.gossipNode.recordMessageReceipt(gossipMessage);

    if (gossipMessage.message) {
      const message = gossipMessage.message;

      if (this.syncEngine.syncMergeQSize + this.syncEngine.syncTrieQSize > MAX_MESSAGE_QUEUE_SIZE) {
        // If there are too many messages in the queue, drop this message. This is a gossip message, so the sync
        // will eventually re-fetch and merge this message in anyway.
        log.warn(
          { syncTrieQ: this.syncEngine.syncTrieQSize, syncMergeQ: this.syncEngine.syncMergeQSize },
          "Sync queue is full, dropping gossip message",
        );
        return err(new HubError("unavailable", "Sync queue is full"));
      }

      // Merge the message
      const submitStartTimestamp = Date.now();
      const result = await this.submitMessage(message, "gossip");
      if (result.isOk()) {
        const submitEndTimestamp = Date.now();
        this.gossipNode.recordMessageMerge(submitEndTimestamp - submitStartTimestamp);
      }
      return result.map(() => undefined);
    } else if (gossipMessage.contactInfoContent) {
      await this.handleContactInfo(peerIdResult.value, gossipMessage.contactInfoContent);
      return ok(undefined);
    } else if (gossipMessage.networkLatencyMessage) {
      await this.handleNetworkLatencyMessage(gossipMessage.networkLatencyMessage);
      return ok(undefined);
    } else {
      return err(new HubError("bad_request.invalid_param", "invalid message type"));
    }
  }

  private async handleContactInfo(peerId: PeerId, message: ContactInfoContent): Promise<void> {
    // Updates the address book for this peer
    const gossipAddress = message.gossipAddress;
    if (gossipAddress) {
      const addressInfo = addressInfoFromGossip(gossipAddress);
      if (addressInfo.isErr()) {
        log.error(addressInfo.error, "unable to parse gossip address for peer");
        return;
      }

      const p2pMultiAddrResult = p2pMultiAddrStr(addressInfo.value, peerId.toString()).map((addr: string) =>
        Result.fromThrowable(
          () => multiaddr(addr),
          (error) => new HubError("bad_request.parse_failure", error as Error),
        )(),
      );

      if (p2pMultiAddrResult.isErr()) {
        log.error(
          { error: p2pMultiAddrResult.error, message, address: addressInfo.value },
          "failed to create multiaddr",
        );
        return;
      }

      if (p2pMultiAddrResult.value.isErr()) {
        log.error(
          { error: p2pMultiAddrResult.value.error, message, address: addressInfo.value },
          "failed to parse multiaddr",
        );
        return;
      }

      if (!(await this.isValidPeer(peerId, message))) {
        await this.gossipNode.removePeerFromAddressBook(peerId);
        this.syncEngine.removeContactInfoForPeerId(peerId.toString());
        return;
      }

      const multiaddrValue = p2pMultiAddrResult.value.value;
      await this.gossipNode.addPeerToAddressBook(peerId, multiaddrValue);
    }

    log.debug({ identity: this.identity, peer: peerId, message }, "received peer ContactInfo");

    // Check if we already have this client
    const peerInfo = this.syncEngine.getContactInfoForPeerId(peerId.toString());
    if (peerInfo) {
      log.debug({ peerInfo }, "Already have this peer, skipping sync");
      return;
    } else {
      // If it is a new client, we do a sync against it
      log.info({ peerInfo, connectedPeers: this.syncEngine.getPeerCount() }, "New Peer ContactInfo");
      this.syncEngine.addContactInfoForPeerId(peerId, message);
      const syncResult = await ResultAsync.fromPromise(
        this.syncEngine.diffSyncIfRequired(this, peerId.toString()),
        (e) => e,
      );
      if (syncResult.isErr()) {
        log.error({ error: syncResult.error, peerId }, "Failed to sync with new peer");
      }
    }
  }

  private async handleNetworkLatencyMessage(message: NetworkLatencyMessage) {
    if (!this.gossipNode.peerId) {
      log.error("gossipNode has no peerId");
      return;
    }
    // Respond to ping message with an ack message
    if (message.ackMessage) {
      this.gossipNode.recordLatencyAckMessageReceipt(message.ackMessage);
    } else if (message.pingMessage) {
      const pingMessage = message.pingMessage;
      const ackMessage = AckMessageBody.create({
        pingOriginPeerId: pingMessage.pingOriginPeerId,
        ackOriginPeerId: this.gossipNode.peerId.toBytes(),
        pingTimestamp: pingMessage.pingTimestamp,
        ackTimestamp: Date.now(),
      });
      const networkLatencyMessage = NetworkLatencyMessage.create({
        ackMessage,
      });
      const ackGossipMessage = GossipMessage.create({
        networkLatencyMessage,
        topics: [this.gossipNode.primaryTopic()],
        peerId: this.gossipNode.peerId.toBytes(),
        version: GOSSIP_PROTOCOL_VERSION,
      });
      await this.gossipNode.publish(ackGossipMessage);
    }
  }

  /** Since we don't know if the peer is using SSL or not, we'll attempt to get the SSL version,
   *  and fall back to the non-SSL version
   */
  private async getHubRpcClient(address: string, options?: Partial<ClientOptions>): Promise<HubRpcClient> {
    return new Promise((resolve) => {
      try {
        const sslClientResult = getSSLHubRpcClient(address, options);

        sslClientResult.$.waitForReady(Date.now() + 2000, (err) => {
          if (!err) {
            resolve(sslClientResult);
          } else {
            Result.fromThrowable(
              () => sslClientResult.close(),
              (e) => e as Error,
            )();
            resolve(getInsecureHubRpcClient(address, options));
          }
        });
      } catch (e) {
        // Fall back to insecure client
        resolve(getInsecureHubRpcClient(address, options));
      }
    });
  }

  public async getRPCClientForPeer(
    peerId: PeerId,
    peer: ContactInfoContent,
    options?: Partial<ClientOptions>,
  ): Promise<HubRpcClient | undefined> {
    /*
     * Find the peer's addrs from our peer list because we cannot use the address
     * in the contact info directly
     */
    if (!peer.rpcAddress) {
      return;
    }

    // prefer the advertised address if it's available
    const rpcAddressInfo = addressInfoFromGossip(peer.rpcAddress as GossipAddressInfo);
    if (rpcAddressInfo.isErr()) {
      log.error(rpcAddressInfo.error, "unable to parse gossip address for peer");
      return;
    }

    if (rpcAddressInfo.value.address) {
      try {
        return await this.getHubRpcClient(`${rpcAddressInfo.value.address}:${rpcAddressInfo.value.port}`);
      } catch (e) {
        log.error({ error: e, peer, peerId }, "unable to connect to peer");
        return undefined;
      }
    }

    log.info({ peerId }, "falling back to addressbook lookup for peer");
    const peerInfo = await this.gossipNode.getPeerInfo(peerId);
    if (!peerInfo) {
      log.info({ function: "getRPCClientForPeer", peer }, `failed to find peer's address to request simple sync`);

      return;
    }

    // sorts addresses by Public IPs first
    const addr = peerInfo.addresses.sort((a, b) => publicAddressesFirst(a, b))[0];
    if (addr === undefined) {
      log.info({ function: "getRPCClientForPeer", peer }, "peer found but no address is available to request sync");

      return;
    }

    const nodeAddress = addr.multiaddr.nodeAddress();
    const ai = {
      address: nodeAddress.address,
      family: ipFamilyToString(nodeAddress.family),
      // Use the rpc port instead of the port used by libp2p
      port: rpcAddressInfo.value.port,
    };

    try {
      return await this.getHubRpcClient(addressInfoToString(ai), options);
    } catch (e) {
      log.error({ error: e, peer, peerId, addressInfo: ai }, "unable to connect to peer");
      // If the peer is unreachable (e.g. behind a firewall), remove it from our address book
      await this.gossipNode.removePeerFromAddressBook(peerId);
      return undefined;
    }
  }

  private registerEventHandlers() {
    // Subscribes to all relevant topics
    this.gossipNode.gossip?.subscribe(this.gossipNode.primaryTopic());
    this.gossipNode.gossip?.subscribe(this.gossipNode.contactInfoTopic());

    this.gossipNode.on("message", async (_topic, message) => {
      await message.match(
        async (gossipMessage: GossipMessage) => {
          await this.handleGossipMessage(gossipMessage);
        },
        async (error: HubError) => {
          log.error(error, "failed to decode message");
        },
      );
    });

    this.gossipNode.on("peerConnect", async () => {
      // When we connect to a new node, gossip out our contact info 1 second later.
      // The setTimeout is to ensure that we have a chance to receive the peer's info properly.
      setTimeout(async () => {
        await this.gossipContactInfo();
      }, 1 * 1000);
    });

    this.gossipNode.on("peerDisconnect", async (connection) => {
      // Remove this peer's connection
      this.syncEngine.removeContactInfoForPeerId(connection.remotePeer.toString());
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                               RPC Handler API                              */
  /* -------------------------------------------------------------------------- */

  async submitMessage(message: Message, source?: HubSubmitSource): HubAsyncResult<number> {
    // message is a reserved key in some logging systems, so we use submittedMessage instead
    const logMessage = log.child({ submittedMessage: messageToLog(message), source });

    if (this.syncEngine.syncTrieQSize > MAX_MESSAGE_QUEUE_SIZE) {
      log.warn({ syncTrieQSize: this.syncEngine.syncTrieQSize }, "SubmitMessage rejected: Sync trie queue is full");
      return err(new HubError("unavailable.storage_failure", "Sync trie queue is full"));
    }

    const start = Date.now();

    const mergeResult = await this.engine.mergeMessage(message);

    mergeResult.match(
      (eventId) => {
        const logData = {
          eventId,
          fid: message.data?.fid,
          type: messageTypeToName(message.data?.type),
          hash: bytesToHexString(message.hash)._unsafeUnwrap(),
          source,
        };
        const msg = "submitMessage success";

        if (source === "sync") {
          log.debug(logData, msg);
        } else {
          log.info(logData, msg);
        }
      },
      (e) => {
        logMessage.warn({ errCode: e.errCode, source }, `submitMessage error: ${e.message}`);
        statsd().increment(`submit_message.error.${source}.${e.errCode}`);
      },
    );

    // When submitting a message via RPC, we want to gossip it to other nodes
    if (mergeResult.isOk() && source === "rpc") {
      void this.gossipNode.gossipMessage(message);
    }

    statsd().timing("hub.merge_message", Date.now() - start);

    return mergeResult;
  }

  async submitIdRegistryEvent(event: IdRegistryEvent, source?: HubSubmitSource): HubAsyncResult<number> {
    const logEvent = log.child({ event: idRegistryEventToLog(event), source });

    const mergeResult = await this.engine.mergeIdRegistryEvent(event);

    mergeResult.match(
      (eventId) => {
        logEvent.debug(
          `submitIdRegistryEvent success ${eventId}: fid ${event.fid} assigned to ${bytesToHexString(
            event.to,
          )._unsafeUnwrap()} in block ${event.blockNumber}`,
        );
      },
      (e) => {
        logEvent.warn({ errCode: e.errCode }, `submitIdRegistryEvent error: ${e.message}`);
      },
    );

    return mergeResult;
  }

  async submitNameRegistryEvent(event: NameRegistryEvent, source?: HubSubmitSource): HubAsyncResult<number> {
    const logEvent = log.child({ event: nameRegistryEventToLog(event), source });

    const mergeResult = await this.engine.mergeNameRegistryEvent(event);

    mergeResult.match(
      (eventId) => {
        logEvent.debug(
          `submitNameRegistryEvent success ${eventId}: fname ${bytesToUtf8String(
            event.fname,
          )._unsafeUnwrap()} assigned to ${bytesToHexString(event.to)._unsafeUnwrap()} in block ${event.blockNumber}`,
        );
      },
      (e) => {
        logEvent.warn({ errCode: e.errCode }, `submitNameRegistryEvent error: ${e.message}`);
      },
    );

    return mergeResult;
  }

  async submitUserNameProof(usernameProof: UserNameProof, source?: HubSubmitSource): HubAsyncResult<number> {
    const logEvent = log.child({ event: usernameProofToLog(usernameProof), source });

    const mergeResult = await this.engine.mergeUserNameProof(usernameProof);

    mergeResult.match(
      (eventId) => {
        logEvent.debug(
          {
            eventId,
            name: bytesToUtf8String(usernameProof.name).unwrapOr(""),
            fid: usernameProof.fid,
            timestamp: usernameProof.timestamp,
          },
          "submitUserNameProof success",
        );
      },
      (e) => {
        logEvent.warn({ errCode: e.errCode }, `submitUserNameProof error: ${e.message}`);
      },
    );

    return mergeResult;
  }

  async submitOnChainEvent(event: OnChainEvent, source?: HubSubmitSource): HubAsyncResult<number> {
    const logEvent = log.child({ event: onChainEventToLog(event), source });

    const mergeResult = await this.engine.mergeOnChainEvent(event);

    mergeResult.match(
      (eventId) => {
        logEvent.info(
          `submitOnChainEvent success ${eventId}: event ${onChainEventTypeToJSON(event.type)} in block ${
            event.blockNumber
          }`,
        );
      },
      (e) => {
        logEvent.warn({ errCode: e.errCode }, `submitOnChainEvent error: ${e.message}`);
      },
    );

    return mergeResult;
  }

  async writeHubCleanShutdown(clean: boolean): HubAsyncResult<void> {
    const txn = this.rocksDB.transaction();
    const value = clean ? Buffer.from([1]) : Buffer.from([0]);
    txn.put(Buffer.from([RootPrefix.HubCleanShutdown]), value);

    return ResultAsync.fromPromise(this.rocksDB.commit(txn), (e) => e as HubError);
  }

  async wasHubCleanShutdown(): HubAsyncResult<boolean> {
    return ResultAsync.fromPromise(
      this.rocksDB.get(Buffer.from([RootPrefix.HubCleanShutdown])),
      (e) => e as HubError,
    ).map((value) => value?.[0] === 1);
  }

  async getDbNetwork(): HubAsyncResult<FarcasterNetwork | undefined> {
    const dbResult = await ResultAsync.fromPromise(
      this.rocksDB.get(Buffer.from([RootPrefix.Network])),
      (e) => e as HubError,
    );
    if (dbResult.isErr()) {
      return err(dbResult.error);
    }

    // parse the buffer as an int
    const networkNumber = Result.fromThrowable(
      () => dbResult.value.readUInt32BE(0),
      (e) => e as HubError,
    )();
    if (networkNumber.isErr()) {
      return err(networkNumber.error);
    }

    // get the enum value from the number
    return networkNumber.map((n) => n as FarcasterNetwork);
  }

  async getDbSchemaVersion(): Promise<number> {
    const dbResult = await ResultAsync.fromPromise(
      this.rocksDB.get(Buffer.from([RootPrefix.DBSchemaVersion])),
      (e) => e as HubError,
    );
    if (dbResult.isErr()) {
      return 0;
    }

    // parse the buffer as an int
    const schemaVersion = Result.fromThrowable(
      () => dbResult.value.readUInt32BE(0),
      (e) => e as HubError,
    )();

    return schemaVersion.unwrapOr(0);
  }

  async setDbSchemaVersion(version: number): HubAsyncResult<void> {
    const txn = this.rocksDB.transaction();
    const value = Buffer.alloc(4);
    value.writeUInt32BE(version, 0);
    txn.put(Buffer.from([RootPrefix.DBSchemaVersion]), value);

    return ResultAsync.fromPromise(this.rocksDB.commit(txn), (e) => e as HubError);
  }

  async setDbNetwork(network: FarcasterNetwork): HubAsyncResult<void> {
    const txn = this.rocksDB.transaction();
    const value = Buffer.alloc(4);
    value.writeUInt32BE(network, 0);
    txn.put(Buffer.from([RootPrefix.Network]), value);

    return ResultAsync.fromPromise(this.rocksDB.commit(txn), (e) => e as HubError);
  }

  async isValidPeer(otherPeerId: PeerId, message: ContactInfoContent) {
    if (!this.gossipNode.isPeerAllowed(otherPeerId)) {
      log.warn(`Peer ${otherPeerId.toString()} is not in allowlist or is in the denylist`);
      return false;
    }

    const theirVersion = message.hubVersion;
    const theirNetwork = message.network;

    const versionCheckResult = ensureAboveMinFarcasterVersion(theirVersion);
    if (versionCheckResult.isErr()) {
      log.warn(
        { peerId: otherPeerId, theirVersion, ourVersion: FARCASTER_VERSION, errMsg: versionCheckResult.error.message },
        "Peer is running an outdated version, ignoring",
      );
      return false;
    }

    if (theirNetwork !== this.options.network) {
      log.warn(
        { peerId: otherPeerId, theirNetwork, ourNetwork: this.options.network },
        "Peer is running a different network, ignoring",
      );
      return false;
    }

    return true;
  }
}
