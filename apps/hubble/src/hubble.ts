import {
  ContactInfoContent,
  FarcasterNetwork,
  GossipAddressInfo,
  GossipMessage,
  HubState,
  IdRegistryEvent,
  Message,
  NameRegistryEvent,
  UpdateNameRegistryEventExpiryJobPayload,
  HubAsyncResult,
  HubError,
  bytesToHexString,
  bytesToUtf8String,
  HubRpcClient,
  getSSLHubRpcClient,
  getInsecureHubRpcClient,
  UserNameProof,
} from '@farcaster/hub-nodejs';
import { PeerId } from '@libp2p/interface-peer-id';
import { peerIdFromBytes } from '@libp2p/peer-id';
import { publicAddressesFirst } from '@libp2p/utils/address-sort';
import { Multiaddr, multiaddr } from '@multiformats/multiaddr';
import { Result, ResultAsync, err, ok } from 'neverthrow';
import { EthEventsProvider, GoerliEthConstants } from './eth/ethEventsProvider.js';
import { GossipNode, MAX_MESSAGE_QUEUE_SIZE } from './network/p2p/gossipNode.js';
import { PeriodicSyncJobScheduler } from './network/sync/periodicSyncJob.js';
import SyncEngine from './network/sync/syncEngine.js';
import AdminServer from './rpc/adminServer.js';
import Server from './rpc/server.js';
import { getHubState, putHubState } from './storage/db/hubState.js';
import RocksDB from './storage/db/rocksdb.js';
import { RootPrefix } from './storage/db/types.js';
import Engine from './storage/engine/index.js';
import { PruneEventsJobScheduler } from './storage/jobs/pruneEventsJob.js';
import { PruneMessagesJobScheduler } from './storage/jobs/pruneMessagesJob.js';
import {
  UpdateNameRegistryEventExpiryJobQueue,
  UpdateNameRegistryEventExpiryJobWorker,
} from './storage/jobs/updateNameRegistryEventExpiryJob.js';
import { sleep } from './utils/crypto.js';
import {
  idRegistryEventToLog,
  logger,
  messageToLog,
  messageTypeToName,
  nameRegistryEventToLog,
  usernameProofToLog,
} from './utils/logger.js';
import {
  addressInfoFromGossip,
  addressInfoToString,
  getPublicIp,
  ipFamilyToString,
  p2pMultiAddrStr,
} from './utils/p2p.js';
import { PeriodicTestDataJobScheduler, TestUser } from './utils/periodicTestDataJob.js';
import { ensureAboveMinFarcasterVersion, VersionSchedule } from './utils/versions.js';
import { CheckFarcasterVersionJobScheduler } from './storage/jobs/checkFarcasterVersionJob.js';
import { ValidateOrRevokeMessagesJobScheduler } from './storage/jobs/validateOrRevokeMessagesJob.js';
import { GossipContactInfoJobScheduler } from './storage/jobs/gossipContactInfoJob.js';
import { MAINNET_ALLOWED_PEERS } from './allowedPeers.mainnet.js';
import StoreEventHandler from './storage/stores/storeEventHandler.js';
import { FNameRegistryClient, FNameRegistryEventsProvider } from './eth/fnameRegistryEventsProvider.js';

export type HubSubmitSource = 'gossip' | 'rpc' | 'eth-provider' | 'sync' | 'fname-registry';

export const APP_VERSION = process.env['npm_package_version'] ?? '1.0.0';
export const APP_NICKNAME = process.env['HUBBLE_NAME'] ?? 'Farcaster Hub';

export const FARCASTER_VERSION = '2023.5.31';
export const FARCASTER_VERSIONS_SCHEDULE: VersionSchedule[] = [
  { version: '2023.3.1', expiresAt: 1682553600000 }, // expires at 4/27/23 00:00 UTC
  { version: '2023.4.19', expiresAt: 1686700800000 }, // expires at 6/14/23 00:00 UTC
  { version: '2023.5.31', expiresAt: 1690329600000 }, // expires at 7/26/23 00:00 UTC
];

export interface HubInterface {
  engine: Engine;
  submitMessage(message: Message, source?: HubSubmitSource): HubAsyncResult<number>;
  submitIdRegistryEvent(event: IdRegistryEvent, source?: HubSubmitSource): HubAsyncResult<number>;
  submitNameRegistryEvent(event: NameRegistryEvent, source?: HubSubmitSource): HubAsyncResult<number>;
  submitUserNameProof(usernameProof: UserNameProof, source?: HubSubmitSource): HubAsyncResult<number>;
  getHubState(): HubAsyncResult<HubState>;
  putHubState(hubState: HubState): HubAsyncResult<void>;
  gossipContactInfo(): HubAsyncResult<void>;
  getRPCClientForPeer(peerId: PeerId, peer: ContactInfoContent): Promise<HubRpcClient | undefined>;
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

  /** Network URL of the IdRegistry Contract */
  ethRpcUrl?: string;

  /** FName Registry Server URL */
  fnameServerUrl?: string;

  /** Address of the IdRegistry contract  */
  idRegistryAddress?: `0x${string}`;

  /** Address of the NameRegistryAddress contract  */
  nameRegistryAddress?: `0x${string}`;

  /** Block number to begin syncing events from  */
  firstBlock?: number;

  /** Number of blocks to batch when syncing historical events  */
  chunkSize?: number;

  /** Resync eth events */
  resyncEthEvents?: boolean;

  /** Resync fname events */
  resyncNameEvents?: boolean;

  /** Name of the RocksDB instance */
  rocksDBName?: string;

  /** Resets the DB on start, if true */
  resetDB?: boolean;

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
}

/** @returns A randomized string of the format `rocksdb.tmp.*` used for the DB Name */
const randomDbName = () => {
  return `rocksdb.tmp.${(new Date().getUTCDate() * Math.random()).toString(36).substring(2)}`;
};

const log = logger.child({
  component: 'Hub',
});

export class Hub implements HubInterface {
  private options: HubOptions;
  private gossipNode: GossipNode;
  private rpcServer: Server;
  private adminServer: AdminServer;
  private contactTimer?: NodeJS.Timer;
  private rocksDB: RocksDB;
  private syncEngine: SyncEngine;

  private pruneMessagesJobScheduler: PruneMessagesJobScheduler;
  private periodSyncJobScheduler: PeriodicSyncJobScheduler;
  private pruneEventsJobScheduler: PruneEventsJobScheduler;
  private testDataJobScheduler?: PeriodicTestDataJobScheduler;
  private checkFarcasterVersionJobScheduler: CheckFarcasterVersionJobScheduler;
  private validateOrRevokeMessagesJobScheduler: ValidateOrRevokeMessagesJobScheduler;
  private gossipContactInfoJobScheduler: GossipContactInfoJobScheduler;

  private updateNameRegistryEventExpiryJobQueue: UpdateNameRegistryEventExpiryJobQueue;
  private updateNameRegistryEventExpiryJobWorker?: UpdateNameRegistryEventExpiryJobWorker;

  engine: Engine;
  ethRegistryProvider?: EthEventsProvider;
  fNameRegistryEventsProvider?: FNameRegistryEventsProvider;

  constructor(options: HubOptions) {
    this.options = options;
    this.rocksDB = new RocksDB(options.rocksDBName ? options.rocksDBName : randomDbName());
    this.gossipNode = new GossipNode(this.options.network);

    // Create the ETH registry provider, which will fetch ETH events and push them into the engine.
    // Defaults to Goerli testnet, which is currently used for Production Farcaster Hubs.
    if (options.ethRpcUrl) {
      this.ethRegistryProvider = EthEventsProvider.build(
        this,
        options.ethRpcUrl,
        options.idRegistryAddress ?? GoerliEthConstants.IdRegistryAddress,
        options.nameRegistryAddress ?? GoerliEthConstants.NameRegistryAddress,
        options.firstBlock ?? GoerliEthConstants.FirstBlock,
        options.chunkSize ?? GoerliEthConstants.ChunkSize,
        options.resyncEthEvents ?? false
      );
    } else {
      log.warn('No ETH RPC URL provided, not syncing with ETH contract events');
    }

    if (options.fnameServerUrl && options.fnameServerUrl !== '') {
      this.fNameRegistryEventsProvider = new FNameRegistryEventsProvider(
        new FNameRegistryClient(options.fnameServerUrl),
        this,
        options.resyncNameEvents ?? false
      );
    } else {
      log.warn('No FName Registry URL provided, not syncing with fname events');
    }

    const eventHandler = new StoreEventHandler(this.rocksDB, {
      lockMaxPending: options.commitLockMaxPending,
      lockTimeout: options.commitLockTimeout,
    });
    this.engine = new Engine(this.rocksDB, options.network, eventHandler);
    this.syncEngine = new SyncEngine(this, this.rocksDB, this.ethRegistryProvider);

    this.rpcServer = new Server(
      this,
      this.engine,
      this.syncEngine,
      this.gossipNode,
      options.rpcAuth,
      options.rpcRateLimit
    );
    this.adminServer = new AdminServer(this, this.rocksDB, this.engine, this.syncEngine, options.rpcAuth);

    // Setup job queues
    this.updateNameRegistryEventExpiryJobQueue = new UpdateNameRegistryEventExpiryJobQueue(this.rocksDB);

    // Setup job schedulers/workers
    this.pruneMessagesJobScheduler = new PruneMessagesJobScheduler(this.engine);
    this.periodSyncJobScheduler = new PeriodicSyncJobScheduler(this, this.syncEngine);
    this.pruneEventsJobScheduler = new PruneEventsJobScheduler(this.engine);
    this.checkFarcasterVersionJobScheduler = new CheckFarcasterVersionJobScheduler(this);
    this.validateOrRevokeMessagesJobScheduler = new ValidateOrRevokeMessagesJobScheduler(this.rocksDB, this.engine);
    this.gossipContactInfoJobScheduler = new GossipContactInfoJobScheduler(this);

    if (options.testUsers) {
      this.testDataJobScheduler = new PeriodicTestDataJobScheduler(this.rpcServer, options.testUsers as TestUser[]);
    }

    if (this.ethRegistryProvider) {
      this.updateNameRegistryEventExpiryJobWorker = new UpdateNameRegistryEventExpiryJobWorker(
        this.updateNameRegistryEventExpiryJobQueue,
        this.rocksDB,
        this.ethRegistryProvider
      );
    }
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
      throw new HubError('unavailable', 'cannot start gossip node without identity');
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
          'failed to open rocksdb. Retry in 15s'
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
      log.info('rocksdb opened');
    }

    if (this.options.resetDB === true) {
      log.info('clearing rocksdb');
      await this.rocksDB.clear();
    } else {
      // Read if the Hub was cleanly shutdown last time
      const cleanShutdownR = await this.wasHubCleanShutdown();
      if (cleanShutdownR.isOk() && !cleanShutdownR.value) {
        log.warn(
          'Hub was NOT shutdown cleanly. Sync might re-fetch messages. Please re-run with --rebuild-sync-trie to rebuild the trie if needed.'
        );
      }
    }

    // Get the Network ID from the DB
    const dbNetworkResult = await this.getDbNetwork();
    if (dbNetworkResult.isOk() && dbNetworkResult.value && dbNetworkResult.value !== this.options.network) {
      throw new HubError(
        'unavailable',
        `network mismatch: DB is ${dbNetworkResult.value}, but Hub is started with ${this.options.network}. ` +
          `Please reset the DB with the "dbreset" command if this is intentional.`
      );
    }

    // Set the network in the DB
    await this.setDbNetwork(this.options.network);
    log.info(
      `starting hub with Farcaster version ${FARCASTER_VERSION}, app version ${APP_VERSION} and network ${this.options.network}`
    );

    await this.engine.start();

    // Start the RPC server
    await this.rpcServer.start(this.options.rpcServerHost, this.options.rpcPort ? this.options.rpcPort : 0);
    if (this.options.adminServerEnabled) {
      await this.adminServer.start(this.options.adminServerHost ?? '127.0.0.1');
    }

    // Start the ETH registry provider first
    if (this.ethRegistryProvider) {
      await this.ethRegistryProvider.start();
    }

    await this.fNameRegistryEventsProvider?.start();

    // Start the sync engine
    await this.syncEngine.initialize(this.options.rebuildSyncTrie ?? false);

    if (this.updateNameRegistryEventExpiryJobWorker) {
      this.updateNameRegistryEventExpiryJobWorker.start();
    }

    let allowedPeerIdStrs = this.options.allowedPeers;
    if (this.options.network === FarcasterNetwork.MAINNET) {
      // Mainnet is right now resitrcited to a few peers
      // Append and de-dup the allowed peers
      allowedPeerIdStrs = [...new Set([...(allowedPeerIdStrs ?? []), ...MAINNET_ALLOWED_PEERS])];
    }

    await this.gossipNode.start(this.options.bootstrapAddrs ?? [], {
      peerId: this.options.peerId,
      ipMultiAddr: this.options.ipMultiAddr,
      announceIp: this.options.announceIp,
      gossipPort: this.options.gossipPort,
      allowedPeerIdStrs,
    });

    this.registerEventHandlers();

    // Start cron tasks
    this.pruneMessagesJobScheduler.start(this.options.pruneMessagesJobCron);
    this.periodSyncJobScheduler.start();
    this.pruneEventsJobScheduler.start(this.options.pruneEventsJobCron);
    this.checkFarcasterVersionJobScheduler.start();
    this.validateOrRevokeMessagesJobScheduler.start();

    // Start the test data generator
    this.testDataJobScheduler?.start();

    // When we startup, we write into the DB that we have not yet cleanly shutdown. And when we do
    // shutdown, we'll write "true" to this key, indicating that we've cleanly shutdown.
    // This way, when starting up, we'll know if the previous shutdown was clean or not.
    await this.writeHubCleanShutdown(false);
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
      dnsName: this.options.announceServerName ?? '',
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

  /** Stop the GossipNode and RPC Server */
  async stop() {
    log.info('Stopping Hubble...');
    clearInterval(this.contactTimer);

    // First, stop the RPC/Gossip server so we don't get any more messages
    await this.rpcServer.stop(true); // Force shutdown until we have a graceful way of ending active streams

    // Stop admin, gossip and sync engine
    await Promise.all([this.adminServer.stop(), this.gossipNode.stop(), this.syncEngine.stop()]);

    if (this.updateNameRegistryEventExpiryJobWorker) {
      this.updateNameRegistryEventExpiryJobWorker.stop();
    }

    // Stop cron tasks
    this.pruneMessagesJobScheduler.stop();
    this.periodSyncJobScheduler.stop();
    this.pruneEventsJobScheduler.stop();
    this.checkFarcasterVersionJobScheduler.stop();
    this.testDataJobScheduler?.stop();
    this.updateNameRegistryEventExpiryJobWorker?.stop();
    this.validateOrRevokeMessagesJobScheduler.stop();

    // Stop the ETH registry provider
    if (this.ethRegistryProvider) {
      await this.ethRegistryProvider.stop();
    }

    await this.fNameRegistryEventsProvider?.stop();

    // Stop the engine
    await this.engine.stop();

    // Close the DB, which will flush all data to disk. Just before we close, though, write that
    // we've cleanly shutdown.
    await this.writeHubCleanShutdown(true);
    await this.rocksDB.close();

    log.info('Hubble stopped, exiting normally');
  }

  async getHubState(): HubAsyncResult<HubState> {
    const result = await ResultAsync.fromPromise(getHubState(this.rocksDB), (e) => e as HubError);
    if (result.isErr() && result.error.errCode === 'not_found') {
      log.info('hub state not found, resetting state');
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
      log.warn(contactInfoResult.error, 'failed get contact info content');
      return Promise.resolve(err(contactInfoResult.error));
    } else {
      const contactInfo = contactInfoResult.value;
      log.info(
        { rpcAddress: contactInfo.rpcAddress?.address, rpcPort: contactInfo.rpcAddress?.port },
        'gossiping contact info'
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
      (error) => new HubError('bad_request.parse_failure', error as Error)
    )();
    if (peerIdResult.isErr()) {
      return Promise.resolve(err(peerIdResult.error));
    }

    if (gossipMessage.message) {
      const message = gossipMessage.message;

      if (this.syncEngine.syncMergeQSize + this.syncEngine.syncTrieQSize > MAX_MESSAGE_QUEUE_SIZE) {
        // If there are too many messages in the queue, drop this message. This is a gossip message, so the sync
        // will eventually re-fetch and merge this message in anyway.
        log.warn(
          { syncTrieQ: this.syncEngine.syncTrieQSize, syncMergeQ: this.syncEngine.syncMergeQSize },
          `Sync queue is full, dropping gossip message`
        );
        return err(new HubError('unavailable', 'Sync queue is full'));
      }

      // Merge the message
      const result = await this.submitMessage(message, 'gossip');
      return result.map(() => undefined);
    } else if (gossipMessage.contactInfoContent) {
      if (peerIdResult.isOk()) {
        await this.handleContactInfo(peerIdResult.value, gossipMessage.contactInfoContent);
      }
      return ok(undefined);
    } else {
      return err(new HubError('bad_request.invalid_param', 'invalid message type'));
    }
  }

  private async handleContactInfo(peerId: PeerId, message: ContactInfoContent): Promise<void> {
    // Updates the address book for this peer
    const gossipAddress = message.gossipAddress;
    if (gossipAddress) {
      const addressInfo = addressInfoFromGossip(gossipAddress);
      if (addressInfo.isErr()) {
        log.error(addressInfo.error, 'unable to parse gossip address for peer');
        return;
      }

      const p2pMultiAddrResult = p2pMultiAddrStr(addressInfo.value, peerId.toString()).map((addr: string) =>
        Result.fromThrowable(
          () => multiaddr(addr),
          (error) => new HubError('bad_request.parse_failure', error as Error)
        )()
      );

      if (p2pMultiAddrResult.isErr()) {
        log.error(
          { error: p2pMultiAddrResult.error, message, address: addressInfo.value },
          'failed to create multiaddr'
        );
        return;
      }

      if (p2pMultiAddrResult.value.isErr()) {
        log.error(
          { error: p2pMultiAddrResult.value.error, message, address: addressInfo.value },
          'failed to parse multiaddr'
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

    log.info({ identity: this.identity, peer: peerId, message }, 'received a Contact Info for sync');

    // Check if we already have this client
    const peerInfo = this.syncEngine.getContactInfoForPeerId(peerId.toString());
    if (peerInfo) {
      log.info({ peerInfo }, 'Already have this peer, skipping sync');
      return;
    } else {
      // If it is a new client, we do a sync against it
      log.info({ peerInfo }, 'New Peer Contact Info, syncing');
      this.syncEngine.addContactInfoForPeerId(peerId, message);
      const syncResult = await ResultAsync.fromPromise(
        this.syncEngine.diffSyncIfRequired(this, peerId.toString()),
        (e) => e
      );
      if (syncResult.isErr()) {
        log.error({ error: syncResult.error, peerId }, 'failed to sync with new peer');
      }
    }
  }

  /** Since we don't know if the peer is using SSL or not, we'll attempt to get the SSL version,
   *  and fall back to the non-SSL version
   */
  private async getHubRpcClient(address: string): Promise<HubRpcClient> {
    return new Promise((resolve) => {
      try {
        const sslClientResult = getSSLHubRpcClient(address);

        sslClientResult.$.waitForReady(Date.now() + 2000, (err) => {
          if (!err) {
            resolve(sslClientResult);
          } else {
            resolve(getInsecureHubRpcClient(address));
          }
        });
      } catch (e) {
        // Fall back to insecure client
        resolve(getInsecureHubRpcClient(address));
      }
    });
  }

  public async getRPCClientForPeer(peerId: PeerId, peer: ContactInfoContent): Promise<HubRpcClient | undefined> {
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
      log.error(rpcAddressInfo.error, 'unable to parse gossip address for peer');
      return;
    }

    if (rpcAddressInfo.value.address) {
      try {
        return await this.getHubRpcClient(`${rpcAddressInfo.value.address}:${rpcAddressInfo.value.port}`);
      } catch (e) {
        log.error({ error: e, peer, peerId }, 'unable to connect to peer');
        return undefined;
      }
    }

    log.info({ peerId }, 'falling back to addressbook lookup for peer');
    const peerInfo = await this.gossipNode.getPeerInfo(peerId);
    if (!peerInfo) {
      log.info({ function: 'getRPCClientForPeer', peer }, `failed to find peer's address to request simple sync`);

      return;
    }

    // sorts addresses by Public IPs first
    const addr = peerInfo.addresses.sort((a, b) => publicAddressesFirst(a, b))[0];
    if (addr === undefined) {
      log.info({ function: 'getRPCClientForPeer', peer }, `peer found but no address is available to request sync`);

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
      return await this.getHubRpcClient(addressInfoToString(ai));
    } catch (e) {
      log.error({ error: e, peer, peerId, addressInfo: ai }, 'unable to connect to peer');
      // If the peer is unreachable (e.g. behind a firewall), remove it from our address book
      await this.gossipNode.removePeerFromAddressBook(peerId);
      return undefined;
    }
  }

  private registerEventHandlers() {
    // Subscribes to all relevant topics
    this.gossipNode.gossip?.subscribe(this.gossipNode.primaryTopic());
    this.gossipNode.gossip?.subscribe(this.gossipNode.contactInfoTopic());

    this.gossipNode.on('message', async (_topic, message) => {
      await message.match(
        async (gossipMessage: GossipMessage) => {
          await this.handleGossipMessage(gossipMessage);
        },
        async (error: HubError) => {
          log.error(error, 'failed to decode message');
        }
      );
    });

    this.gossipNode.on('peerConnect', async () => {
      // When we connect to a new node, gossip out our contact info 1 second later.
      // The setTimeout is to ensure that we have a chance to receive the peer's info properly.
      setTimeout(async () => {
        await this.gossipContactInfo();
      }, 1 * 1000);
    });

    this.gossipNode.on('peerDisconnect', async (connection) => {
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
      log.warn({ syncTrieQSize: this.syncEngine.syncTrieQSize }, 'SubmitMessage rejected: Sync trie queue is full');
      return err(new HubError('unavailable.storage_failure', 'Sync trie queue is full'));
    }

    const mergeResult = await this.engine.mergeMessage(message);

    mergeResult.match(
      (eventId) => {
        logMessage.info(
          `submitMessage success ${eventId}: fid ${message.data?.fid} merged ${messageTypeToName(
            message.data?.type
          )} ${bytesToHexString(message.hash)._unsafeUnwrap()}`
        );
      },
      (e) => {
        logMessage.warn({ errCode: e.errCode }, `submitMessage error: ${e.message}`);
      }
    );

    // When submitting a message via RPC, we want to gossip it to other nodes
    if (mergeResult.isOk() && source === 'rpc') {
      void this.gossipNode.gossipMessage(message);
    }

    return mergeResult;
  }

  async submitIdRegistryEvent(event: IdRegistryEvent, source?: HubSubmitSource): HubAsyncResult<number> {
    const logEvent = log.child({ event: idRegistryEventToLog(event), source });

    const mergeResult = await this.engine.mergeIdRegistryEvent(event);

    mergeResult.match(
      (eventId) => {
        logEvent.info(
          `submitIdRegistryEvent success ${eventId}: fid ${event.fid} assigned to ${bytesToHexString(
            event.to
          )._unsafeUnwrap()} in block ${event.blockNumber}`
        );
      },
      (e) => {
        logEvent.warn({ errCode: e.errCode }, `submitIdRegistryEvent error: ${e.message}`);
      }
    );

    return mergeResult;
  }

  async submitNameRegistryEvent(event: NameRegistryEvent, source?: HubSubmitSource): HubAsyncResult<number> {
    const logEvent = log.child({ event: nameRegistryEventToLog(event), source });

    const mergeResult = await this.engine.mergeNameRegistryEvent(event);

    mergeResult.match(
      (eventId) => {
        logEvent.info(
          `submitNameRegistryEvent success ${eventId}: fname ${bytesToUtf8String(
            event.fname
          )._unsafeUnwrap()} assigned to ${bytesToHexString(event.to)._unsafeUnwrap()} in block ${event.blockNumber}`
        );
      },
      (e) => {
        logEvent.warn({ errCode: e.errCode }, `submitNameRegistryEvent error: ${e.message}`);
      }
    );

    if (!event.expiry) {
      const payload = UpdateNameRegistryEventExpiryJobPayload.create({ fname: event.fname });
      await this.updateNameRegistryEventExpiryJobQueue.enqueueJob(payload);
    }

    return mergeResult;
  }

  async submitUserNameProof(usernameProof: UserNameProof, source?: HubSubmitSource): HubAsyncResult<number> {
    const logEvent = log.child({ event: usernameProofToLog(usernameProof), source });

    const mergeResult = await this.engine.mergeUserNameProof(usernameProof);

    mergeResult.match(
      (eventId) => {
        logEvent.info(
          `submitUserNameProof success ${eventId}: fname ${bytesToUtf8String(
            usernameProof.name
          )._unsafeUnwrap()} assigned to fid: ${usernameProof.fid} at timestamp ${usernameProof.timestamp}`
        );
      },
      (e) => {
        logEvent.warn({ errCode: e.errCode }, `submitUserNameProof error: ${e.message}`);
      }
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
      (e) => e as HubError
    ).map((value) => value?.[0] === 1);
  }

  async getDbNetwork(): HubAsyncResult<FarcasterNetwork | undefined> {
    const dbResult = await ResultAsync.fromPromise(
      this.rocksDB.get(Buffer.from([RootPrefix.Network])),
      (e) => e as HubError
    );
    if (dbResult.isErr()) {
      return err(dbResult.error);
    }

    // parse the buffer as an int
    const networkNumber = Result.fromThrowable(
      () => dbResult.value.readUInt32BE(0),
      (e) => e as HubError
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

  async isValidPeer(ourPeerId: PeerId, message: ContactInfoContent) {
    const theirVersion = message.hubVersion;
    const theirNetwork = message.network;

    const versionCheckResult = ensureAboveMinFarcasterVersion(theirVersion);
    if (versionCheckResult.isErr()) {
      log.warn(
        { peerId: ourPeerId, theirVersion, ourVersion: FARCASTER_VERSION, errMsg: versionCheckResult.error.message },
        'Peer is running an outdated version, ignoring'
      );
      return false;
    }

    if (theirNetwork !== this.options.network) {
      log.warn(
        { peerId: ourPeerId, theirNetwork, ourNetwork: this.options.network },
        'Peer is running a different network, ignoring'
      );
      return false;
    }

    return true;
  }
}
