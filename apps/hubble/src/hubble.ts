import {
  ContactInfoContent,
  ContactInfoContentBody,
  FarcasterNetwork,
  GossipAddressInfo,
  GossipMessage,
  HubState,
  Message,
  HubAsyncResult,
  HubError,
  bytesToHexString,
  bytesToUtf8String,
  HubRpcClient,
  getSSLHubRpcClient,
  getInsecureHubRpcClient,
  UserNameProof,
  OnChainEvent,
  onChainEventTypeToJSON,
  ClientOptions,
  validations,
  HashScheme,
} from "@farcaster/hub-nodejs";
import { PeerId } from "@libp2p/interface-peer-id";
import { peerIdFromBytes, peerIdFromString } from "@libp2p/peer-id";
import { publicAddressesFirst } from "@libp2p/utils/address-sort";
import { unmarshalPrivateKey, unmarshalPublicKey } from "@libp2p/crypto/keys";
import { Multiaddr, multiaddr } from "@multiformats/multiaddr";
import { Result, ResultAsync, err, ok } from "neverthrow";
import { GossipNode, MAX_MESSAGE_QUEUE_SIZE, GOSSIP_SEEN_TTL } from "./network/p2p/gossipNode.js";
import { PeriodicSyncJobScheduler } from "./network/sync/periodicSyncJob.js";
import SyncEngine, { FIRST_SYNC_DELAY } from "./network/sync/syncEngine.js";
import AdminServer from "./rpc/adminServer.js";
import Server from "./rpc/server.js";
import { getHubState, putHubState } from "./storage/db/hubState.js";
import RocksDB, { DB_DIRECTORY } from "./storage/db/rocksdb.js";
import { RootPrefix } from "./storage/db/types.js";
import Engine from "./storage/engine/index.js";
import { PruneEventsJobScheduler } from "./storage/jobs/pruneEventsJob.js";
import { PruneMessagesJobScheduler } from "./storage/jobs/pruneMessagesJob.js";
import { sleep } from "./utils/crypto.js";
import { rsDbDestroy, rsValidationMethods } from "./rustfunctions.js";
import * as tar from "tar";
import * as zlib from "zlib";
import {
  SubmitMessageSuccessLogCache,
  logger,
  messageToLog,
  messageTypeToName,
  onChainEventToLog,
  usernameProofToLog,
} from "./utils/logger.js";
import {
  addressInfoFromGossip,
  addressInfoToString,
  getPublicIp,
  ipFamilyToString,
  p2pMultiAddrStr,
} from "./utils/p2p.js";
import { fetchSnapshotMetadata, SnapshotMetadata, snapshotURL, uploadToS3 } from "./utils/snapshot.js";
import { PeriodicTestDataJobScheduler, TestUser } from "./utils/periodicTestDataJob.js";
import { ensureAboveMinFarcasterVersion, getMinFarcasterVersion, VersionSchedule } from "./utils/versions.js";
import { CheckFarcasterVersionJobScheduler } from "./storage/jobs/checkFarcasterVersionJob.js";
import { ValidateOrRevokeMessagesJobScheduler } from "./storage/jobs/validateOrRevokeMessagesJob.js";
import { GossipContactInfoJobScheduler } from "./storage/jobs/gossipContactInfoJob.js";
import StoreEventHandler from "./storage/stores/storeEventHandler.js";
import { FNameRegistryClient, FNameRegistryEventsProvider } from "./eth/fnameRegistryEventsProvider.js";
import { L2EventsProvider, OptimismConstants } from "./eth/l2EventsProvider.js";
import { prettyPrintTable } from "./profile/profile.js";
import packageJson from "./package.json" assert { type: "json" };
import { createPublicClient, fallback, http } from "viem";
import { mainnet, optimism } from "viem/chains";
import { AddrInfo } from "@chainsafe/libp2p-gossipsub/types";
import { CheckIncomingPortsJobScheduler } from "./storage/jobs/checkIncomingPortsJob.js";
import { NetworkConfig, applyNetworkConfig, fetchNetworkConfig } from "./network/utils/networkConfig.js";
import { UpdateNetworkConfigJobScheduler } from "./storage/jobs/updateNetworkConfigJob.js";
import { DbSnapshotBackupJobScheduler } from "./storage/jobs/dbSnapshotBackupJob.js";
import { statsd, StatsDInitParams } from "./utils/statsd.js";
import {
  getDbSchemaVersion,
  LATEST_DB_SCHEMA_VERSION,
  performDbMigrations,
} from "./storage/db/migrations/migrations.js";
import path from "path";
import { addProgressBar } from "./utils/progressBars.js";
import * as fs from "fs";
import axios from "axios";
import { HttpAPIServer } from "./rpc/httpServer.js";
import { SingleBar } from "cli-progress";
import { exportToProtobuf } from "@libp2p/peer-id-factory";
import OnChainEventStore from "./storage/stores/onChainEventStore.js";
import { ensureMessageData, isMessageInDB } from "./storage/db/message.js";
import { HubResult, MessageBundle, getFarcasterTime } from "@farcaster/core";
import { MerkleTrie } from "./network/sync/merkleTrie.js";
import { DEFAULT_CATCHUP_SYNC_SNAPSHOT_MESSAGE_LIMIT } from "./defaultConfig.js";
import { diagnosticReporter } from "./utils/diagnosticReport.js";
import v8 from "v8";

export type HubSubmitSource = "gossip" | "rpc" | "eth-provider" | "l2-provider" | "sync" | "fname-registry";

export const APP_VERSION = packageJson.version;
export const APP_NICKNAME = process.env["HUBBLE_NAME"] ?? "Farcaster Hub";

export const SNAPSHOT_S3_DEFAULT_BUCKET = "download.farcaster.xyz";
export const S3_REGION = "us-east-1";

export const FARCASTER_VERSION = "2024.3.20";
export const FARCASTER_VERSIONS_SCHEDULE: VersionSchedule[] = [
  { version: "2023.3.1", expiresAt: 1682553600000 }, // expires at 4/27/23 00:00 UTC
  { version: "2023.4.19", expiresAt: 1686700800000 }, // expires at 6/14/23 00:00 UTC
  { version: "2023.5.31", expiresAt: 1690329600000 }, // expires at 7/26/23 00:00 UTC
  { version: "2023.7.12", expiresAt: 1693958400000 }, // expires at 9/6/23 00:00 UTC
  { version: "2023.8.23", expiresAt: 1697587200000 }, // expires at 10/18/23 00:00 UTC
  { version: "2023.10.4", expiresAt: 1701216000000 }, // expires at 11/28/23 00:00 UTC
  { version: "2023.11.15", expiresAt: 1704844800000 }, // expires at 1/10/24 00:00 UTC
  { version: "2023.12.27", expiresAt: 1708473600000 }, // expires at 2/21/24 00:00 UTC
  { version: "2024.2.7", expiresAt: 1712102400000 }, // expires at 4/3/24 00:00 UTC
  { version: "2024.3.20", expiresAt: 1715731200000 }, // expires at 5/15/24 00:00 UTC
];

const MAX_CONTACT_INFO_AGE_MS = GOSSIP_SEEN_TTL;

export interface HubInterface {
  engine: Engine;
  identity: string;
  hubOperatorFid?: number;
  submitMessage(message: Message, source?: HubSubmitSource): HubAsyncResult<number>;
  submitMessageBundle(messageBundle: MessageBundle, source?: HubSubmitSource): Promise<HubResult<number>[]>;
  validateMessage(message: Message): HubAsyncResult<Message>;
  submitUserNameProof(usernameProof: UserNameProof, source?: HubSubmitSource): HubAsyncResult<number>;
  submitOnChainEvent(event: OnChainEvent, source?: HubSubmitSource): HubAsyncResult<number>;
  getHubState(): HubAsyncResult<HubState>;
  putHubState(hubState: HubState): HubAsyncResult<void>;
  gossipContactInfo(): HubAsyncResult<void>;
  getRPCClientForPeer(
    peerId: PeerId,
    peer: ContactInfoContentBody,
    options?: Partial<ClientOptions>,
  ): Promise<HubRpcClient | undefined>;
  updateApplicationPeerScore(peerId: String, score: number): HubAsyncResult<void>;
}

export interface HubOptions {
  /** Farcaster network */
  network: FarcasterNetwork;

  /** Wether to log individual submitMessage status */
  logIndividualMessages?: boolean;

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

  /** Port for the HTTP API Server */
  httpApiPort?: number;

  /** Username and Password to use for RPC submit methods */
  rpcAuth?: string;

  /** Enable IP Rate limiting */
  rpcRateLimit?: number;

  /** Overrides the maximum limit for RPC subscribers per IP address. Default is set to 4 */
  rpcSubscribePerIpLimit?: number;

  /** Rank RPCs and use the ones with best stability and latency */
  rankRpcs?: boolean;

  /** StatsD parameters */
  statsdParams?: StatsDInitParams | undefined;

  /** ETH mainnet RPC URL(s) */
  ethMainnetRpcUrl?: string;

  /** FName Registry Server URL */
  fnameServerUrl?: string;

  /** Network URL(s) of the StorageRegistry Contract */
  l2RpcUrl?: string;

  /** Address of the Id Registry contract  */
  l2IdRegistryAddress?: `0x${string}`;

  /** Address of the Key Registry contract  */
  l2KeyRegistryAddress?: `0x${string}`;

  /** Address of the StorageRegistry contract  */
  l2StorageRegistryAddress?: `0x${string}`;

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

  /** Clears all l2 events */
  l2ClearEvents?: boolean;

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
  commitLockTimeout?: number;

  /** Commit lock queue size */
  commitLockMaxPending?: number;

  /** Http cors origin */
  httpCorsOrigin?: string;

  /** Http server disabled? */
  httpServerDisabled?: boolean;

  /** Enables the Admin Server */
  adminServerEnabled?: boolean;

  /** Host for the Admin Server to bind to */
  adminServerHost?: string;

  /** Periodically add casts & reactions for the following test users */
  testUsers?: TestUser[];

  /** Only allows the Hub to connect to and advertise local IP addresses (Only used by tests) */
  localIpAddrsOnly?: boolean;

  /** Cron schedule for prune messages job */
  pruneMessagesJobCron?: string;

  /** Cron schedule for prune events job */
  pruneEventsJobCron?: string;

  /** A list of addresses the node directly peers with, provided in MultiAddr format */
  directPeers?: AddrInfo[];

  /** If set, snapshot sync is disabled */
  disableSnapshotSync?: boolean;

  /** Enable daily backups to S3 */
  enableSnapshotToS3?: boolean;

  /** If set, check catchupSyncSnapshotMessageLimit and if message difference
   * exceeds that limit, clear existing db and replace with downloaded snapshot
   * */
  catchupSyncWithSnapshot?: boolean;

  /**
   * Message limit - when exceeded, trigger catchup sync using snapshot
   * NOTE: Catchup sync using snapshot WILL RESET THE DATABASE
   */
  catchupSyncSnapshotMessageLimit?: number;

  /** S3 bucket to upload snapshots to */
  s3SnapshotBucket?: string;

  /** Hub Operator's FID */
  hubOperatorFid?: number;

  /** If set, defines a list of PeerIds who will have a constantly high internal peer score. */
  allowlistedImmunePeers?: string[];

  /** If set, overrides the default application-specific score cap */
  applicationScoreCap?: number;

  /** If set, requires contact info messages to be signed */
  strictContactInfoValidation?: boolean;

  /** If set, requires gossip messages to utilize StrictNoSign */
  strictNoSign?: boolean;

  /** Should we connect to DB peers on startup */
  connectToDbPeers?: boolean;
}

/** @returns A randomized string of the format `rocksdb.tmp.*` used for the DB Name */
export const randomDbName = () => {
  return `rocksdb.tmp.${(new Date().getUTCDate() * Math.random()).toString(36).substring(2)}`;
};

export enum HubShutdownReason {
  SELF_TERMINATED = 0,
  SIG_TERM = 1,
  EXCEPTION = 2,
  UNKNOWN = 3,
}

const log = logger.child({
  component: "Hub",
});

export class Hub implements HubInterface {
  private options: HubOptions;
  private gossipNode: GossipNode;
  private rpcServer: Server;
  private adminServer: AdminServer;
  private httpApiServer: HttpAPIServer;

  private contactTimer?: NodeJS.Timer;
  private rocksDB: RocksDB;
  private syncEngine: SyncEngine;
  private allowedPeerIds: string[] | undefined;
  private deniedPeerIds: string[];
  private allowlistedImmunePeers: string[] | undefined;
  private strictContactInfoValidation: boolean;
  private strictNoSign: boolean;
  private performedFirstSync = false;

  private pruneMessagesJobScheduler: PruneMessagesJobScheduler;
  private periodSyncJobScheduler: PeriodicSyncJobScheduler;
  private pruneEventsJobScheduler: PruneEventsJobScheduler;
  private testDataJobScheduler?: PeriodicTestDataJobScheduler;
  private checkFarcasterVersionJobScheduler: CheckFarcasterVersionJobScheduler;
  private validateOrRevokeMessagesJobScheduler: ValidateOrRevokeMessagesJobScheduler;
  private gossipContactInfoJobScheduler: GossipContactInfoJobScheduler;
  private checkIncomingPortsJobScheduler: CheckIncomingPortsJobScheduler;
  private updateNetworkConfigJobScheduler: UpdateNetworkConfigJobScheduler;
  private dbSnapshotBackupJobScheduler: DbSnapshotBackupJobScheduler;

  private submitMessageLogger = new SubmitMessageSuccessLogCache(log);

  engine: Engine;
  fNameRegistryEventsProvider: FNameRegistryEventsProvider;
  l2RegistryProvider: L2EventsProvider;

  constructor(options: HubOptions) {
    this.options = options;

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
        options.l2KeyRegistryAddress ?? OptimismConstants.KeyRegistryV2Address,
        options.l2IdRegistryAddress ?? OptimismConstants.IdRegistryV2Address,
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

    if (getMinFarcasterVersion().isErr()) {
      throw new HubError("unavailable", `Farcaster version ${FARCASTER_VERSION} expired, please upgrade hub`);
    }

    this.rocksDB = new RocksDB(options.rocksDBName ? options.rocksDBName : randomDbName());
    this.gossipNode = new GossipNode(this.rocksDB, this.options.network);

    const eventHandler = new StoreEventHandler(this.rocksDB, {
      lockMaxPending: options.commitLockMaxPending,
      lockExecutionTimeout: options.commitLockTimeout,
    });

    const opMainnetRpcUrls = options.l2RpcUrl.split(",");
    const opTransports = opMainnetRpcUrls.map((url) => http(url, { retryCount: 3, retryDelay: 500 }));
    const opClient = createPublicClient({
      chain: optimism,
      transport: fallback(opTransports, { rank: options.rankRpcs ?? false }),
    });

    const ethMainnetRpcUrls = options.ethMainnetRpcUrl.split(",");
    const transports = ethMainnetRpcUrls.map((url) => http(url, { retryCount: 3, retryDelay: 500 }));
    const mainnetClient = createPublicClient({
      chain: mainnet,
      transport: fallback(transports, { rank: options.rankRpcs ?? false }),
    });
    this.engine = new Engine(this.rocksDB, options.network, eventHandler, mainnetClient, opClient);

    const profileSync = options.profileSync ?? false;
    this.syncEngine = new SyncEngine(
      this,
      this.rocksDB,
      this.l2RegistryProvider,
      this.fNameRegistryEventsProvider,
      profileSync,
    );

    this.strictContactInfoValidation = options.strictContactInfoValidation || false;
    this.strictNoSign = options.strictNoSign || false;

    // On syncComplete, we update the denied peer ids list with the bad peers.
    // This is not active yet.
    // this.syncEngine.on("syncComplete", async (success) => {
    //   this.gossipNode.updateDeniedPeerIds(this.syncEngine.getBadPeerIds());
    // });

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

            // Close the file stream
            profile.writeOutNodeProfiles();

            // Also write to console for easy copy/paste
            console.log("\nTotal Time\n");
            console.log(prettyPrintTable(profile.durationToPrettyPrintObject()));

            console.log("\nLatencies (ms)\n");
            console.log(prettyPrintTable(profile.latenciesToPrettyPrintObject()));

            console.log("\nData Fetched (bytes)\n");
            console.log(prettyPrintTable(profile.resultBytesToPrettyPrintObject()));
          }

          await this.stop(HubShutdownReason.SELF_TERMINATED);
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
      options.rpcSubscribePerIpLimit,
    );
    this.httpApiServer = new HttpAPIServer(this.rpcServer.getImpl(), this.engine, this.options.httpCorsOrigin);
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
    this.dbSnapshotBackupJobScheduler = new DbSnapshotBackupJobScheduler(
      this.rocksDB,
      this.syncEngine.trie.getDb(),
      this.syncEngine,
      this.options,
    );

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

  get gossipAddresses(): Multiaddr[] {
    return this.gossipNode.multiaddrs() ?? [];
  }

  get hubOperatorFid() {
    return this.options.hubOperatorFid ?? 0;
  }

  /** Returns the Gossip peerId string of this Hub */
  get identity(): string {
    if (!this.gossipNode.isStarted() || !this.gossipNode.peerId()) {
      throw new HubError("unavailable", "cannot start gossip node without identity");
    }
    return this.gossipNode.peerId()?.toString() ?? "";
  }

  async syncWithPeerId(peerId: string): Promise<void> {
    await this.syncEngine.diffSyncIfRequired(this, peerId);
  }

  /* Start the GossipNode and RPC server  */
  async start() {
    // See if we have to fetch the IP address
    if (!this.options.announceIp || this.options.announceIp.trim().length === 0) {
      const ipResult = await getPublicIp();
      if (ipResult.isErr()) {
        log.error({ error: ipResult.error }, `failed to fetch public IP address, using ${this.options.ipMultiAddr}`);
      } else {
        this.options.announceIp = ipResult.value;
      }
    }

    // Snapshot Sync
    if (!this.options.disableSnapshotSync) {
      const snapshotResult = await this.snapshotSync();
      if (snapshotResult.isErr()) {
        log.error({ error: snapshotResult.error }, "failed to sync snapshot, falling back to regular sync");
      }
    }

    // Check if we need to catchup sync using snapshot
    let catchupSyncResult: Result<boolean, Error> = ok(false);
    // NOTE: catch up sync with snapshot is only supported on mainnet
    if (this.options.catchupSyncWithSnapshot && this.options.network === FarcasterNetwork.MAINNET) {
      log.info("attempting catchup sync with snapshot");
      catchupSyncResult = await this.attemptCatchupSyncWithSnapshot();
      if (catchupSyncResult.isErr()) {
        log.error("failed to catchup sync using snapshot", {
          error: catchupSyncResult.error,
        });
        // There is a risk that an error occurred after the database was cleared but before the snapshot
        // was downloaded. In this case, we should throw error and exit.
        throw catchupSyncResult.error;
      } else if (catchupSyncResult.value) {
        log.info("catchup sync using snapshot successful");
      } else {
        log.error("catchup sync skipped");
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
          {
            retryCount,
            error: dbResult.error,
            errorMessage: dbResult.error.message,
          },
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
      log.info({ path: this.rocksDB.location }, "rocksdb opened");
    }

    if (this.options.resetDB === true) {
      // Sync using catchup sync clears the database, so we don't need to do it again.
      if (this.options.catchupSyncWithSnapshot && catchupSyncResult.isOk() && catchupSyncResult.value) {
        log.info("skipping db reset as catchup sync with snapshot is enabled, which already cleared the db");
      } else {
        log.info("clearing rocksdb");
        this.rocksDB.clear();
      }
    } else {
      // Read if the Hub was cleanly shutdown last time
      const cleanShutdownR = await this.wasHubCleanShutdown();
      if (cleanShutdownR.isOk() && !cleanShutdownR.value) {
        log.warn(
          "Hub was NOT shutdown cleanly. Sync might re-fetch messages. Please re-run with --rebuild-sync-trie to rebuild the trie if needed.",
        );
      }
    }

    if (this.options.l2ClearEvents === true) {
      log.info("clearing l2 events");
      await OnChainEventStore.clearEvents(this.rocksDB);
      log.info("l2 events cleared");
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
    const dbSchemaVersion = await getDbSchemaVersion(this.rocksDB);
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
        log.error("failed to fetch network config", {
          error: networkConfig.error,
        });
      } else {
        const { shouldExit } = this.applyNetworkConfig(networkConfig.value);
        if (shouldExit) {
          throw new HubError("unavailable", "Quitting due to network config");
        }
      }
    }

    // Start the CRDT engine
    await this.engine.start();

    // Start the sync engine
    await this.syncEngine.start(this.options.rebuildSyncTrie ?? false);

    // Start the RPC server
    await this.rpcServer.start(this.options.rpcServerHost, this.options.rpcPort ?? 0);
    if (!this.options.httpServerDisabled) {
      await this.httpApiServer.start(this.options.rpcServerHost, this.options.httpApiPort ?? 0);
    } else {
      log.info("HTTP API server disabled");
    }
    if (this.options.adminServerEnabled) {
      await this.adminServer.start(this.options.adminServerHost ?? "127.0.0.1");
    }

    await this.l2RegistryProvider.start();
    await this.fNameRegistryEventsProvider.start();

    const bootstrapAddrs = this.options.bootstrapAddrs ?? [];

    const peerId = this.options.peerId ? exportToProtobuf(this.options.peerId) : undefined;

    // Start the Gossip node
    await this.gossipNode.start(bootstrapAddrs, {
      peerId,
      ipMultiAddr: this.options.ipMultiAddr,
      announceIp: this.options.announceIp,
      gossipPort: this.options.gossipPort,
      allowedPeerIdStrs: this.allowedPeerIds,
      deniedPeerIdStrs: this.deniedPeerIds,
      directPeers: this.options.directPeers,
      allowlistedImmunePeers: this.options.allowlistedImmunePeers,
      applicationScoreCap: this.options.applicationScoreCap,
      strictNoSign: this.strictNoSign,
      connectToDbPeers: this.options.connectToDbPeers,
      statsdParams: this.options.statsdParams,
    });

    await this.registerEventHandlers();

    // Start cron tasks
    this.pruneMessagesJobScheduler.start(this.options.pruneMessagesJobCron);
    this.periodSyncJobScheduler.start();
    this.pruneEventsJobScheduler.start(this.options.pruneEventsJobCron);
    this.checkFarcasterVersionJobScheduler.start();
    this.validateOrRevokeMessagesJobScheduler.start();
    this.gossipContactInfoJobScheduler.start("*/1 * * * *"); // Every minute
    this.checkIncomingPortsJobScheduler.start();

    // Mainnet only jobs
    if (this.options.network === FarcasterNetwork.MAINNET) {
      this.updateNetworkConfigJobScheduler.start();
      this.dbSnapshotBackupJobScheduler.start();
    }

    // Testnet/Devnet only jobs
    if (this.options.network !== FarcasterNetwork.MAINNET) {
      // Start the test data generator
      this.testDataJobScheduler?.start();
    }

    // When we startup, we write into the DB that we have not yet cleanly shutdown. And when we do
    // shutdown, we'll write "true" to this key, indicating that we've cleanly shutdown.
    // This way, when starting up, we'll know if the previous shutdown was clean or not.
    await this.writeHubCleanShutdown(false, HubShutdownReason.UNKNOWN);

    // Set up a timer to log the memory usage every minute
    setInterval(() => {
      const memoryData = process.memoryUsage();
      statsd().gauge("memory.rss", memoryData.rss);
      statsd().gauge("memory.heap_total", memoryData.heapTotal);
      statsd().gauge("memory.heap_used", memoryData.heapUsed);
      statsd().gauge("memory.external", memoryData.external);

      // Uncomment this code to enable heap dumps
      // if (memoryData.heapUsed > 3 * 1024 * 1024 * 1024 && Date.now() - lastHeapDumpTime > 10 * 60 * 1000) {
      //   const fileName = `${DB_DIRECTORY}/process/HeapDump-${Date.now()}.heapsnapshot`;

      //   const writtenFileName = v8.writeHeapSnapshot(fileName);
      //   log.info({ writtenFileName }, "Wrote heap snapshot");
      //   lastHeapDumpTime = Date.now();
      // }
    }, 60 * 1000);
  }

  /** Apply the new the network config. Will return true if the Hub should exit */
  public applyNetworkConfig(networkConfig: NetworkConfig): { shouldRestart: boolean; shouldExit: boolean } {
    const {
      allowedPeerIds,
      deniedPeerIds,
      allowlistedImmunePeers,
      strictContactInfoValidation,
      strictNoSign,
      shouldExit,
      solanaVerificationsEnabled,
    } = applyNetworkConfig(
      networkConfig,
      this.allowedPeerIds,
      this.deniedPeerIds,
      this.options.network,
      this.options.allowlistedImmunePeers,
      this.options.strictContactInfoValidation,
      this.options.strictNoSign,
      this.engine.solanaVerficationsEnabled,
    );

    if (shouldExit) {
      return { shouldExit: true, shouldRestart: false };
    } else {
      this.gossipNode.updateAllowedPeerIds(allowedPeerIds);
      this.allowedPeerIds = allowedPeerIds;

      this.gossipNode.updateDeniedPeerIds(deniedPeerIds);
      this.gossipNode.updateBundleGossipPercent(networkConfig.bundleGossipPercent ?? 0);
      this.deniedPeerIds = deniedPeerIds;

      this.allowlistedImmunePeers = allowlistedImmunePeers;
      this.strictContactInfoValidation = !!strictContactInfoValidation;
      const shouldRestart = this.strictNoSign !== !!strictNoSign;
      this.strictNoSign = !!strictNoSign;

      if (solanaVerificationsEnabled) {
        this.engine.setSolanaVerifications(true);
      }

      log.info({ allowedPeerIds, deniedPeerIds, allowlistedImmunePeers }, "Network config applied");

      return { shouldExit: false, shouldRestart };
    }
  }

  // Attempt to catchup sync using snapshot.
  // NOTE: This method will clear the existing DB and replace it with the downloaded snapshot.
  async attemptCatchupSyncWithSnapshot(): HubAsyncResult<boolean> {
    if (!this.syncEngine) {
      return err(new HubError("unavailable", "sync engine not available"));
    }
    const limit = this.options.catchupSyncSnapshotMessageLimit ?? DEFAULT_CATCHUP_SYNC_SNAPSHOT_MESSAGE_LIMIT;
    const snapURL = snapshotURL(this.options.network, 0);
    const metadata = await fetchSnapshotMetadata(snapURL);

    if (metadata.isErr()) {
      log.error("failed to fetch snapshot metadata", {
        error: metadata.error,
        snapshotURL: snapURL,
      });
      return err(new HubError("unavailable", `failed to fetch snapshot metadata - ${metadata.error.message}`));
    }

    const itemCount = await MerkleTrie.numItems(this.syncEngine.trie);
    if (itemCount.isErr()) {
      log.error("failed to get merkle trie item count", {
        error: itemCount.error,
      });
      return err(new HubError("unavailable", `failed to get merkle trie item count - ${itemCount.error.message}`));
    }

    const currentItemCount = itemCount.value;
    let shouldCatchupSync = false;
    // compare current db statistics with latest snapshot metadata
    const snapshotMetadata: SnapshotMetadata = metadata.value;
    let delta = -1;
    if (!snapshotMetadata.numMessages) {
      log.error("snapshot metadata does not contain message count");
      return err(new HubError("unavailable", "snapshot metadata does not contain message count"));
    }

    delta = snapshotMetadata.numMessages - currentItemCount;
    if (delta > limit) {
      log.info({ delta, limit, current_item_count: currentItemCount }, "catchup sync using snapshot");
      shouldCatchupSync = true;
    }

    if (shouldCatchupSync) {
      const SHUTDOWN_GRACE_PERIOD_MS = 30 * 1000; // 30 seconds
      log.info(`beginning snapshot sync in ${SHUTDOWN_GRACE_PERIOD_MS.toString()}ms - THIS WILL RESET THE DATABASE`);
      // Sleep for a bit to allow user some time to cancel the operation before we purge the DB
      await sleep(SHUTDOWN_GRACE_PERIOD_MS);

      // We use the item count in the trie RocksDB to determine if catchup sync is warranted.
      // However, the messages RocksDB will be cleared and replaced with the downloaded snapshot which contains both DBs.
      rsDbDestroy(this.syncEngine.trie.getDb().rustDb);
      rsDbDestroy(this.rocksDB.rustDb);

      const snapshotResult = await this.snapshotSync(true);
      if (snapshotResult.isErr()) {
        log.error({ error: snapshotResult.error }, "failed to sync snapshot, falling back to diff sync");
        return err(new HubError("unavailable", `failed to sync snapshot - ${snapshotResult.error.message}`));
      }
      log.info(
        {
          currentItemCount,
          snapshot_metadata: snapshotMetadata.numMessages ?? -1,
          delta,
          limit,
        },
        "catchup sync using snapshot complete",
      );
      return ok(true);
    } else {
      log.info(
        {
          currentItemCount,
          delta,
          limit,
        },
        "catchup sync using snapshot not required",
      );
      return ok(false);
    }
  }
  async snapshotSync(overwrite?: boolean): HubAsyncResult<boolean> {
    const s3Bucket = this.options.s3SnapshotBucket ?? SNAPSHOT_S3_DEFAULT_BUCKET;
    return new Promise((resolve) => {
      (async () => {
        let progressBar: SingleBar | undefined;

        try {
          const dbLocation = this.rocksDB.location;
          const dbFiles = Result.fromThrowable(
            () => fs.readdirSync(dbLocation),
            (e) => e,
          )();

          if (dbFiles.isErr() || dbFiles.value.length === 0 || overwrite) {
            log.info(
              {
                db_location: dbLocation,
                file_count: dbFiles.isErr() ? 0 : dbFiles.value.length,
                overwrite,
              },
              "DB is empty or overwrite is true, fetching snapshot from S3",
            );

            let prevVersion = 0;
            let latestSnapshotKey;
            do {
              const response = await axios.get(
                `https://${s3Bucket}/${this.getSnapshotFolder(prevVersion)}/latest.json`,
              );
              const { key } = response.data;

              if (!key) {
                log.error(
                  { data: response.data, folder: this.getSnapshotFolder(prevVersion) },
                  "No latest snapshot name found in latest.json",
                );
                prevVersion += 1;
              } else {
                latestSnapshotKey = key as string;
                break;
              }
            } while (prevVersion < LATEST_DB_SCHEMA_VERSION);

            if (!latestSnapshotKey) {
              resolve(err(new HubError("unavailable", "No latest snapshot name found in latest.json")));
              return;
            } else {
              log.info({ latestSnapshotKey }, "found latest S3 snapshot");
            }

            const snapshotUrl = `https://${s3Bucket}/${latestSnapshotKey}`;
            const response2 = await axios.get(snapshotUrl, {
              responseType: "stream",
            });
            const totalSize = parseInt(response2.headers["content-length"], 10);

            let downloadedSize = 0;
            log.info({ totalSize }, "Getting snapshot...");
            progressBar = addProgressBar("Getting snapshot", totalSize);

            const handleError = (e: Error) => {
              log.error({ error: e }, "Error extracting snapshot");
              progressBar?.stop();
              resolve(err(new HubError("unavailable", "Error extracting snapshot")));
            };

            const gunzip = zlib.createGunzip();
            const parseStream = new tar.Parse();

            // We parse the tar file and extract it into the DB location, which might be different
            // than the location it was originally created in. So, we transform the top-level
            // directory name to the DB location.
            parseStream.on("entry", (entry) => {
              const newPath = path.join(dbLocation, ...entry.path.split(path.sep).slice(1));
              const newDir = path.dirname(newPath);

              if (entry.type === "Directory") {
                fs.mkdirSync(newPath, { recursive: true });
                entry.resume();
              } else {
                fs.mkdirSync(newDir, { recursive: true });
                entry.pipe(fs.createWriteStream(newPath));
              }
            });

            parseStream.on("end", () => {
              log.info({ dbLocation }, "Snapshot extracted from S3");
              progressBar?.stop();
              resolve(ok(true));
            });

            let lastDownloadedSize = 0;
            response2.data
              .on("error", handleError)
              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
              .on("data", (chunk: any) => {
                const largeChunk = 1024 * 1024 * 1024;

                downloadedSize += chunk.length;
                progressBar?.update(downloadedSize);

                if (downloadedSize - lastDownloadedSize > largeChunk) {
                  log.info({ downloadedSize, totalSize }, "Downloading snapshot...");
                  lastDownloadedSize = downloadedSize;
                }
              })
              .pipe(gunzip)
              .on("error", handleError)
              .pipe(parseStream)
              .on("error", handleError);
          } else {
            resolve(ok(false));
          }
        } catch (error) {
          log.error({ error }, "An error occurred during snapshot synchronization");
          progressBar?.stop();
          resolve(err(new HubError("unavailable", "An error occurred during snapshot synchronization")));
        }
      })();
    });
  }

  async getContactInfoContent(): HubAsyncResult<ContactInfoContent> {
    const nodeMultiAddr = this.gossipAddresses[0] as Multiaddr;
    const family = nodeMultiAddr?.nodeAddress().family;
    const announceIp = this.options.announceIp ?? nodeMultiAddr?.nodeAddress().address;
    const gossipPort = nodeMultiAddr?.nodeAddress().port;
    const rpcPort = this.rpcServer.address?.map((addr) => addr.port).unwrapOr(0);

    const gossipAddressContactInfo = GossipAddressInfo.create({
      address: announceIp,
      family,
      port: gossipPort,
    });
    const rpcAddressContactInfo = GossipAddressInfo.create({
      address: announceIp,
      family,
      port: rpcPort,
      dnsName: this.options.announceServerName ?? "",
    });

    const snapshot = await this.syncEngine.getSnapshot();
    if (snapshot.isErr()) {
      return err(snapshot.error);
    }

    const body = ContactInfoContentBody.create({
      gossipAddress: gossipAddressContactInfo,
      rpcAddress: rpcAddressContactInfo,
      excludedHashes: [], // Hubs don't rely on this anymore,
      count: snapshot.value.numMessages,
      hubVersion: FARCASTER_VERSION,
      network: this.options.network,
      appVersion: APP_VERSION,
      timestamp: Date.now(),
    });
    const content = ContactInfoContent.create({
      gossipAddress: gossipAddressContactInfo,
      rpcAddress: rpcAddressContactInfo,
      excludedHashes: [], // Hubs don't rely on this anymore,
      count: snapshot.value.numMessages,
      hubVersion: FARCASTER_VERSION,
      network: this.options.network,
      appVersion: APP_VERSION,
      timestamp: Date.now(),
      // omit above in a subsequent version
      body: body,
    });
    const peerId = this.gossipNode.peerId();
    const privKey = peerId?.privateKey;
    if (privKey) {
      const rawPrivKey = await unmarshalPrivateKey(privKey);
      const hash = await validations.createMessageHash(
        ContactInfoContentBody.encode(body).finish(),
        HashScheme.BLAKE3,
        rsValidationMethods,
      );
      if (hash.isErr()) {
        return err(hash.error);
      }
      const signature = await validations.signMessageHash(hash.value, rawPrivKey.marshal(), rsValidationMethods);
      if (signature.isErr()) {
        return err(signature.error);
      }

      content.signature = signature.value;
      content.signer = rawPrivKey.public.marshal();
    }
    return ok(content);
  }

  async teardown(reason: HubShutdownReason) {
    await this.stop(reason);
  }

  /** Stop the GossipNode and RPC Server */
  async stop(reason: HubShutdownReason, terminateGossipWorker = true) {
    log.info("Stopping Hubble...");
    clearInterval(this.contactTimer);

    // First, stop the RPC/Gossip server so we don't get any more messages
    if (!this.options.httpServerDisabled) {
      await this.httpApiServer.stop();
    }
    await this.rpcServer.stop(true); // Force shutdown until we have a graceful way of ending active streams

    // Stop admin, gossip and sync engine
    await Promise.all([
      this.adminServer.stop(),
      this.gossipNode.stop(terminateGossipWorker),
      this.syncEngine.stop(),
      this.l2RegistryProvider.stop(),
      this.fNameRegistryEventsProvider.stop(),
    ]);

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
    this.dbSnapshotBackupJobScheduler.stop();

    // Stop the engine
    await this.engine.stop();

    // Close the DB, which will flush all data to disk. Just before we close, though, write that
    // we've cleanly shutdown.
    await this.writeHubCleanShutdown(true, reason);
    await this.rocksDB.close();

    log.info("Hubble stopped, exiting normally");
  }

  async getHubState(): HubAsyncResult<HubState> {
    const result = await ResultAsync.fromPromise(getHubState(this.rocksDB), (e) => e as HubError);
    if (result.isErr() && result.error.errCode === "not_found") {
      log.info("hub state not found, resetting state");
      const hubState = HubState.create({ lastL2Block: 0, lastFnameProof: 0 });
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
        {
          rpcAddress: contactInfo.rpcAddress?.address,
          rpcPort: contactInfo.rpcAddress?.port,
        },
        "gossiping contact info",
      );

      await this.gossipNode.gossipContactInfo(contactInfo);
      return Promise.resolve(ok(undefined));
    }
  }

  /** ------------------------------------------------------------------------- */
  /*                                  Private Methods                           */
  /* -------------------------------------------------------------------------- */

  private async handleGossipMessage(gossipMessage: GossipMessage, source: PeerId, msgId: string): HubAsyncResult<void> {
    let reportedAsInvalid = false;
    if (gossipMessage.timestamp) {
      // If message is older than seenTTL, we will try to merge it, but report it as invalid so it doesn't
      // propogate across the network
      const cutOffTime = getFarcasterTime().unwrapOr(0) - GOSSIP_SEEN_TTL / 1000;

      if (gossipMessage.timestamp < cutOffTime) {
        await this.gossipNode.reportValid(msgId, peerIdFromString(source.toString()).toBytes(), false);
        reportedAsInvalid = true;
      }
    }

    const peerIdResult = Result.fromThrowable(
      () => peerIdFromBytes(gossipMessage.peerId ?? new Uint8Array([])),
      (error) => new HubError("bad_request.parse_failure", error as Error),
    )();
    if (peerIdResult.isErr()) {
      return Promise.resolve(err(peerIdResult.error));
    }

    if (gossipMessage.message || gossipMessage.messageBundle) {
      if (this.syncEngine.syncMergeQSize + this.syncEngine.syncTrieQSize > MAX_MESSAGE_QUEUE_SIZE) {
        // If there are too many messages in the queue, drop this message. This is a gossip message, so the sync
        // will eventually re-fetch and merge this message in anyway.
        const msg = "Sync queue is full, dropping gossip message";
        log.warn(
          {
            syncTrieQ: this.syncEngine.syncTrieQSize,
            syncMergeQ: this.syncEngine.syncMergeQSize,
          },
          msg,
        );
        diagnosticReporter().reportUnavailable(this.handleGossipMessage.name, msg, {
          syncTrieQ: this.syncEngine.syncTrieQSize,
          syncMergeQ: this.syncEngine.syncMergeQSize,
        });
        return err(new HubError("unavailable", msg));
      }

      const currentTime = getFarcasterTime().unwrapOr(0);
      const messageFirstGossipedTime = gossipMessage.timestamp ?? 0;
      const gossipMessageDelay = currentTime - messageFirstGossipedTime;

      // Merge the message
      if (gossipMessage.message) {
        const message = gossipMessage.message;
        const result = await this.submitMessage(message, "gossip");
        if (result.isOk()) {
          if (!reportedAsInvalid) {
            await this.gossipNode.reportValid(msgId, peerIdFromString(source.toString()).toBytes(), true);
          }
        } else {
          const tags: { [key: string]: string } = {
            valid: reportedAsInvalid ? "false" : "true",
            error_code: result.error.errCode,
            message_type: messageTypeToName(message.data?.type),
          };

          statsd().increment("gossip.message_failure", 1, tags);
          log.info(
            {
              errCode: result.error.errCode,
              errMsg: result.error.message,
              peerId: source.toString(),
              origin: peerIdResult.value,
              hash: bytesToHexString(message.hash).unwrapOr(""),
              fid: message.data?.fid,
              type: message.data?.type,
              gossipDelay: gossipMessageDelay,
              valid: !reportedAsInvalid,
              msgId,
            },
            "Received bad gossip message from peer",
          );
          if (!reportedAsInvalid) {
            await this.gossipNode.reportValid(msgId, peerIdFromString(source.toString()).toBytes(), false);
          }
        }
        statsd().timing("gossip.message_delay", gossipMessageDelay);
        const mergeResult = result.isOk() ? "success" : "failure";
        statsd().timing(`gossip.message_delay.${mergeResult}`, gossipMessageDelay);

        return result.map(() => undefined);
      } else if (gossipMessage.messageBundle) {
        const bundle = gossipMessage.messageBundle;
        const results = await this.submitMessageBundle(bundle, "gossip");

        // If at least one is Ok, report as valid
        const atLeastOneOk = results.find((r) => r.isOk());
        if (atLeastOneOk) {
          if (!reportedAsInvalid) {
            await this.gossipNode.reportValid(msgId, peerIdFromString(source.toString()).toBytes(), true);
          }
        } else {
          const errCode = results[0]?._unsafeUnwrapErr()?.errCode as string;
          const errMsg = results[0]?._unsafeUnwrapErr()?.message;

          const tags: { [key: string]: string } = {
            valid: reportedAsInvalid ? "false" : "true",
            error_code: errCode,
          };

          statsd().increment("gossip.message_bundle_failure", 1, tags);
          log.info(
            {
              errCode,
              errMsg,
              peerId: source.toString(),
              origin: peerIdResult.value,
              gossipDelay: gossipMessageDelay,
              valid: !reportedAsInvalid,
              msgId,
            },
            "Received bad gossip message bundle from peer",
          );
          if (!reportedAsInvalid) {
            await this.gossipNode.reportValid(msgId, peerIdFromString(source.toString()).toBytes(), false);
          }
        }
        statsd().timing("gossip.message_bundle_delay", gossipMessageDelay);

        return ok(undefined);
      } else {
        // Return error, unknown type of message
        return err(new HubError("bad_request.invalid_param", "Unknown message type while handlgGossipMessage"));
      }
    } else if (gossipMessage.contactInfoContent) {
      const result = await this.handleContactInfo(peerIdResult.value, gossipMessage.contactInfoContent);
      await this.gossipNode.reportValid(msgId, peerIdFromString(source.toString()).toBytes(), result);
      return ok(undefined);
    } else {
      return err(new HubError("bad_request.invalid_param", "invalid message type"));
    }
  }

  private async handleContactInfo(peerId: PeerId, content: ContactInfoContent): Promise<boolean> {
    statsd().gauge("peer_store.count", await this.gossipNode.peerStoreCount());

    let message: ContactInfoContentBody = content.body
      ? content.body
      : ContactInfoContentBody.create({
          gossipAddress: content.gossipAddress,
          rpcAddress: content.rpcAddress,
          excludedHashes: content.excludedHashes,
          count: content.count,
          hubVersion: content.hubVersion,
          network: content.network,
          appVersion: content.appVersion,
          timestamp: content.timestamp,
        });

    // Don't process messages that are too old
    if (message.timestamp && message.timestamp < Date.now() - MAX_CONTACT_INFO_AGE_MS) {
      log.debug({ message }, "contact info message is too old");
      return false;
    }

    // Validate the signature if present
    if (content.signature && content.signer && peerId.publicKey && content.body) {
      let bytes: Uint8Array;
      if (content.dataBytes) {
        bytes = content.dataBytes;
      } else {
        bytes = ContactInfoContentBody.encode(content.body).finish();
      }

      const pubKey = unmarshalPublicKey(peerId.publicKey);
      if (Buffer.compare(pubKey.marshal(), content.signer) !== 0) {
        log.error({ message: content }, "signer mismatch for contact info");
        return false;
      }

      const hash = await validations.createMessageHash(bytes, HashScheme.BLAKE3, rsValidationMethods);
      if (hash.isErr()) {
        log.warn({ message: content }, "could not hash message");
        return false;
      }

      const result = await validations.verifySignedMessageHash(
        hash.value,
        content.signature,
        content.signer,
        rsValidationMethods,
      );
      if (result.isErr()) {
        log.warn({ message: content, error: result.error }, "signature verification failed for contact info");
        return false;
      }

      if (!result.value) {
        log.warn({ message: content }, "signature verification failed for contact info");
        return false;
      }

      if (content.dataBytes) {
        message = ContactInfoContentBody.decode(content.dataBytes);
      }
    } else if (this.strictContactInfoValidation) {
      log.warn({ message: content, peerId }, "provided contact info does not have a signature");
      return false;
    }

    // Updates the address book for this peer
    const gossipAddress = message.gossipAddress;
    if (gossipAddress) {
      const addressInfo = addressInfoFromGossip(gossipAddress);
      if (addressInfo.isErr()) {
        log.error({ error: addressInfo.error, gossipAddress }, "unable to parse gossip address for peer");
        return false;
      }

      const p2pMultiAddrResult = p2pMultiAddrStr(addressInfo.value, peerId.toString()).map((addr: string) =>
        Result.fromThrowable(
          () => multiaddr(addr),
          (error) => new HubError("bad_request.parse_failure", error as Error),
        )(),
      );

      if (p2pMultiAddrResult.isErr()) {
        log.error(
          {
            error: p2pMultiAddrResult.error,
            message,
            address: addressInfo.value,
          },
          "failed to create multiaddr",
        );
        return false;
      }

      if (p2pMultiAddrResult.value.isErr()) {
        log.error(
          {
            error: p2pMultiAddrResult.value.error,
            message,
            address: addressInfo.value,
          },
          "failed to parse multiaddr",
        );
        return false;
      }

      if (!(await this.isValidPeer(peerId, message))) {
        await this.gossipNode.removePeerFromAddressBook(peerId);
        this.syncEngine.removeContactInfoForPeerId(peerId.toString());
        return false;
      }

      const multiaddrValue = p2pMultiAddrResult.value.value;
      await this.gossipNode.addPeerToAddressBook(peerId, multiaddrValue);
    }

    log.debug({ identity: this.identity, peer: peerId, message }, "received peer ContactInfo");

    // Check if we already have this client
    const result = this.syncEngine.addContactInfoForPeerId(peerId, message);
    if (result.isOk() && !this.performedFirstSync) {
      // Sync with the first peer so we are upto date on startup.
      this.performedFirstSync = true;
      setTimeout(async () => {
        await ResultAsync.fromPromise(this.syncEngine.diffSyncIfRequired(this), (e) => e);
      }, FIRST_SYNC_DELAY);
    } else {
      log.debug({ peerInfo: message }, "Already have this peer, skipping sync");
    }

    // if the contact info doesn't include a timestamp, consider it invalid but allow the peer to stay in the address book
    // TODO remove this once all peers are updated past 1.6.4
    if (message.timestamp === 0) return false;

    // Return if peer contact was newer than existing contact (prevents old gossip messages from being forwarded)
    return result.isOk();
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
    peer: ContactInfoContentBody,
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
    const peerAddresses = await this.gossipNode.getPeerAddresses(peerId);
    if (!peerAddresses) {
      log.info({ function: "getRPCClientForPeer", peer }, `failed to find peer's address to request simple sync`);

      return;
    }

    // sorts addresses by Public IPs first
    const addr = peerAddresses.sort((a, b) =>
      publicAddressesFirst({ multiaddr: a, isCertified: false }, { multiaddr: b, isCertified: false }),
    )[0];
    if (addr === undefined) {
      log.info({ function: "getRPCClientForPeer", peer }, "peer found but no address is available to request sync");

      return;
    }

    const nodeAddress = addr.nodeAddress();
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

  private async registerEventHandlers() {
    // Subscribes to all relevant topics
    await this.gossipNode.subscribe(this.gossipNode.primaryTopic());
    await this.gossipNode.subscribe(this.gossipNode.contactInfoTopic());

    this.gossipNode.on("message", async (_topic, message, source, msgId) => {
      await message.match(
        async (gossipMessage: GossipMessage) => {
          await this.handleGossipMessage(gossipMessage, source, msgId);
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
      statsd().increment("peer_connect.count");
    });

    this.gossipNode.on("peerDisconnect", async (connection) => {
      // Remove this peer's connection
      this.syncEngine.removeContactInfoForPeerId(connection.remotePeer.toString());
      statsd().increment("peer_disconnect.count");
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                               RPC Handler API                              */
  /* -------------------------------------------------------------------------- */

  async submitMessageBundle(messageBundle: MessageBundle, source?: HubSubmitSource): Promise<HubResult<number>[]> {
    if (this.syncEngine.syncTrieQSize > MAX_MESSAGE_QUEUE_SIZE) {
      log.warn({ syncTrieQSize: this.syncEngine.syncTrieQSize }, "SubmitMessage rejected: Sync trie queue is full");
      // Since we're rejecting the full bundle, return an error for each message
      return messageBundle.messages.map(() =>
        err(new HubError("unavailable.storage_failure", "Sync trie queue is full")),
      );
    }

    const start = Date.now();
    const allResults: Map<number, HubResult<number>> = new Map();

    const dedupedMessages: { i: number; message: Message }[] = [];
    if (source === "gossip") {
      // Go over all the messages and see if they are in the DB. If they are, don't bother processing them
      await Promise.all(
        messageBundle.messages.map(async (message, i) => {
          if (await isMessageInDB(this.rocksDB, message)) {
            log.debug({ source }, "submitMessageBundle rejected: Message already exists");
            allResults.set(i, err(new HubError("bad_request.duplicate", "message has already been merged")));
          } else {
            dedupedMessages.push({ i, message: ensureMessageData(message) });
          }
        }),
      );
    } else {
      dedupedMessages.push(...messageBundle.messages.map((message, i) => ({ i, message: ensureMessageData(message) })));
    }

    // Merge the messages
    const mergeResults = await this.engine.mergeMessages(dedupedMessages.map((m) => m.message));

    for (const [j, result] of mergeResults.entries()) {
      const message = dedupedMessages[j]?.message as Message;
      const type = messageTypeToName(message.data?.type);

      allResults.set(dedupedMessages[j]?.i as number, result);

      result.match(
        (eventId) => {
          if (this.options.logIndividualMessages) {
            const logData = {
              eventId,
              fid: message.data?.fid,
              type: type,
              submittedMessage: messageToLog(message),
              source,
            };
            const msg = "submitMessage success";

            if (source === "sync") {
              log.debug(logData, msg);
            } else {
              log.info(logData, msg);
            }
          } else {
            this.submitMessageLogger.log(source ?? "unknown-source");
          }
        },
        (e) => {
          // message is a reserved key in some logging systems, so we use submittedMessage instead
          const logMessage = log.child({
            submittedMessage: messageToLog(message),
            source,
          });
          logMessage.warn({ errCode: e.errCode, source }, `submitMessage error: ${e.message}`);
          const tags: { [key: string]: string } = {
            error_code: e.errCode,
            message_type: type,
            source: source ?? "unknown-source",
          };
          statsd().increment("submit_message.error", 1, tags);
        },
      );
    }

    // Convert the merge results to an Array of HubResults with the key
    const finalResults: HubResult<number>[] = [];
    const finalFailures = new Map<string, number>();
    let success = 0;
    for (let i = 0; i < allResults.size; i++) {
      const result = allResults.get(i) as HubResult<number>;
      if (result.isOk()) {
        success += 1;
      } else {
        const errCode = result.error.errCode;
        const count = finalFailures.get(errCode) ?? 0;
        finalFailures.set(errCode, count + 1);
      }
      finalResults.push(result);
    }

    const totalTimeMilis = Date.now() - start;
    statsd().timing("hub.merge_message", totalTimeMilis / finalResults.length);

    // When submitting a messageBundle via RPC, we want to gossip it to other nodes
    if (success > 0 && source === "rpc") {
      void this.gossipNode.gossipBundle(messageBundle);
    }

    log.info(
      {
        hash: bytesToHexString(messageBundle.hash).unwrapOr(messageBundle.hash),
        success,
        finalFailures: [...finalFailures],
        total: finalResults.length,
        totalTimeMilis,
        timePerMergeMs: Math.round((10 ** 2 * totalTimeMilis) / finalResults.length) / 10 ** 2, // round to 2 places
      },
      "submitMessageBundle merged",
    );

    return finalResults;
  }

  async submitMessage(submittedMessage: Message, source?: HubSubmitSource): HubAsyncResult<number> {
    if (this.syncEngine.syncTrieQSize > MAX_MESSAGE_QUEUE_SIZE) {
      log.warn({ syncTrieQSize: this.syncEngine.syncTrieQSize }, "SubmitMessage rejected: Sync trie queue is full");
      return err(new HubError("unavailable.storage_failure", "Sync trie queue is full"));
    }

    // If this is a dup, don't bother processing it. Only do this for gossip messages since rpc messages
    // haven't been validated yet
    if (source === "gossip" && (await isMessageInDB(this.rocksDB, submittedMessage))) {
      log.debug({ source }, "submitMessage rejected: Message already exists");
      return err(new HubError("bad_request.duplicate", "message has already been merged"));
    }

    const start = Date.now();

    const message = ensureMessageData(submittedMessage);
    const type = messageTypeToName(message.data?.type);
    const mergeResult = await this.engine.mergeMessage(message);

    mergeResult.match(
      (eventId) => {
        if (this.options.logIndividualMessages) {
          const logData = {
            eventId,
            fid: message.data?.fid,
            type: type,
            submittedMessage: messageToLog(submittedMessage),
            source,
          };
          const msg = "submitMessage success";

          if (source === "sync") {
            log.debug(logData, msg);
          } else {
            log.info(logData, msg);
          }
        } else {
          this.submitMessageLogger.log(source ?? "unknown-source");
        }
      },
      (e) => {
        // message is a reserved key in some logging systems, so we use submittedMessage instead
        const logMessage = log.child({
          submittedMessage: messageToLog(submittedMessage),
          source,
        });
        logMessage.warn({ errCode: e.errCode, source }, `submitMessage error: ${e.message}`);
        const tags: { [key: string]: string } = {
          error_code: e.errCode,
          message_type: type,
          source: source ?? "unknown-source",
        };
        statsd().increment("submit_message.error", 1, tags);
      },
    );

    // When submitting a message via RPC, we want to gossip it to other nodes
    if (mergeResult.isOk() && source === "rpc") {
      void this.gossipNode.gossipMessage(message);
    }

    const now = Date.now();
    statsd().timing("hub.merge_message", now - start);

    return mergeResult;
  }

  async validateMessage(message: Message): HubAsyncResult<Message> {
    return this.engine.validateMessage(message);
  }

  async submitUserNameProof(usernameProof: UserNameProof, source?: HubSubmitSource): HubAsyncResult<number> {
    const logEvent = log.child({
      event: usernameProofToLog(usernameProof),
      source,
    });

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

  // Create an enum for hub shutdown reasons

  async writeHubCleanShutdown(clean: boolean, reason: HubShutdownReason): HubAsyncResult<void> {
    const txn = this.rocksDB.transaction();
    const value = clean ? Buffer.from([1, reason]) : Buffer.from([0, reason]);
    txn.put(Buffer.from([RootPrefix.HubCleanShutdown]), value);

    return ResultAsync.fromPromise(this.rocksDB.commit(txn), (e) => e as HubError);
  }

  async wasHubCleanShutdown(): HubAsyncResult<boolean> {
    const shutdownResult = await ResultAsync.fromPromise(
      this.rocksDB.get(Buffer.from([RootPrefix.HubCleanShutdown])),
      (e) => e as HubError,
    );
    if (shutdownResult.isErr()) {
      return err(shutdownResult.error);
    }
    const shutdownReason = shutdownResult.value[1] ?? -1;
    const cleanShutdown = shutdownResult.value[0] === 1;
    // Anything other than HubShutdownReason.SELF_TERMINATED or SIG_TERM is considered unexpected
    const unexpected = shutdownReason > 1;
    const tags: { [key: string]: string } = {
      reason: shutdownReason.toString(),
      clean: cleanShutdown.toString(),
      unexpected: unexpected.toString(),
    };
    statsd().increment("hub.restart", 1, tags);
    logger.info({ clean: cleanShutdown, reason: shutdownReason, unexpected }, "Hub restarted");

    return ok(cleanShutdown);
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

  async setDbNetwork(network: FarcasterNetwork): HubAsyncResult<void> {
    const txn = this.rocksDB.transaction();
    const value = Buffer.alloc(4);
    value.writeUInt32BE(network, 0);
    txn.put(Buffer.from([RootPrefix.Network]), value);

    return ResultAsync.fromPromise(this.rocksDB.commit(txn), (e) => e as HubError);
  }

  async isValidPeer(otherPeerId: PeerId, message: ContactInfoContentBody) {
    if (!this.gossipNode.isPeerAllowed(otherPeerId)) {
      log.warn(`Peer ${otherPeerId.toString()} is not in allowlist or is in the denylist`);
      return false;
    }

    const theirVersion = message.hubVersion;
    const theirNetwork = message.network;

    const versionCheckResult = ensureAboveMinFarcasterVersion(theirVersion);
    if (versionCheckResult.isErr()) {
      log.warn(
        {
          peerId: otherPeerId,
          theirVersion,
          ourVersion: FARCASTER_VERSION,
          errMsg: versionCheckResult.error.message,
        },
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

  async updateApplicationPeerScore(peerId: string, score: number): HubAsyncResult<void> {
    return ok(this.gossipNode?.updateApplicationPeerScore(peerId, score));
  }

  private getSnapshotFolder(prevVersionCounter?: number): string {
    const network = FarcasterNetwork[this.options.network].toString();
    return `snapshots/${network}/DB_SCHEMA_${LATEST_DB_SCHEMA_VERSION - (prevVersionCounter ?? 0)}`;
  }
}
