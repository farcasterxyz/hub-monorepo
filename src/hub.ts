import { multiaddr, Multiaddr } from '@multiformats/multiaddr';
import Engine from '~/storage/engine';
import { Node } from '~/network/p2p/node';
import { RPCClient, RPCHandler, RPCServer } from '~/network/rpc';
import { PeerId } from '@libp2p/interface-peer-id';
import { Cast, SignerMessage, Reaction, Follow, Verification, IdRegistryEvent, Message, MessageType } from '~/types';
import {
  ContactInfoContent,
  GossipMessage,
  GOSSIP_CONTACT_INTERVAL,
  IdRegistryContent,
  NETWORK_TOPIC_CONTACT,
  NETWORK_TOPIC_PRIMARY,
  UserContent,
} from '~/network/p2p/protocol';
import { AddressInfo, isIP } from 'net';
import { isContactInfo, isIdRegistryContent, isUserContent } from '~/types/typeguards';
import { TypedEmitter } from 'tiny-typed-emitter';
import RocksDB from '~/storage/db/rocksdb';
import { err, ok, Result } from 'neverthrow';
import { FarcasterError, ServerError } from '~/utils/errors';
import { SyncEngine } from '~/network/sync/syncEngine';
import { logger } from '~/utils/logger';
import { NodeMetadata } from '~/network/sync/merkleTrie';
import { addressInfoFromParts, getPublicIp, p2pMultiAddrStr } from '~/utils/p2p';
import { peerIdFromString } from '@libp2p/peer-id';
import { publicAddressesFirst } from '@libp2p/utils/address-sort';

export interface HubOptions {
  /** The PeerId of this Hub */
  peerId?: PeerId;

  /** Addresses to bootstrap the gossip network */
  bootstrapAddrs?: Multiaddr[];

  /** A list of PeerId strings to allow connections with */
  allowedPeers?: string[];

  /** IP address string in MultiAddr format to bind to */
  ipMultiAddr?: string;

  /** Port for libp2p to listen for gossip */
  gossipPort?: number;

  /** Port for the RPC Client */
  rpcPort?: number;

  /** Network URL of the IdRegistry Contract */
  networkUrl?: string;

  /** Address of the IdRegistry contract  */
  IdRegistryAddress?: string;

  /** Name of the RocksDB instance */
  rocksDBName?: string;

  /** Resets the DB on start, if true */
  resetDB?: boolean;

  /**
   * Only allows the Hub to connect to and advertise local IP addresses
   *
   * Only used by tests
   */
  localIpAddrsOnly?: boolean;
}

/** @returns A randomized string of the format `rocksdb.tmp.*` used for the DB Name */
const randomDbName = () => {
  return `rocksdb.tmp.${(new Date().getUTCDate() * Math.random()).toString(36).substring(2)}`;
};

interface HubEvents {
  /** Emit an event when diff starts */
  syncStart: () => void;

  /** Emit an event when diff sync completes */
  syncComplete: (success: boolean) => void;
}

const log = logger.child({
  component: 'Hub',
});

export class Hub extends TypedEmitter<HubEvents> implements RPCHandler {
  private options: HubOptions;
  private gossipNode: Node;
  private rpcServer: RPCServer;
  private contactTimer?: NodeJS.Timer;
  private rocksDB: RocksDB;
  private syncEngine: SyncEngine;

  engine: Engine;

  constructor(options: HubOptions) {
    super();
    this.options = options;
    this.rocksDB = new RocksDB(options.rocksDBName ? options.rocksDBName : randomDbName());
    this.engine = new Engine(this.rocksDB, options.networkUrl, options.IdRegistryAddress);
    this.gossipNode = new Node();
    this.rpcServer = new RPCServer(this);
    this.syncEngine = new SyncEngine(this.engine);
  }

  get rpcAddress() {
    // Safety: RPC is always configured on an IP socket, so it can be cast safely here
    return this.rpcServer.address ? (this.rpcServer.address as AddressInfo) : undefined;
  }

  get gossipAddresses() {
    return this.gossipNode.multiaddrs ?? [];
  }

  /** Returns the Gossip peerId string of this Hub */
  get identity(): string {
    if (!this.gossipNode.isStarted() || !this.gossipNode.peerId) {
      throw new ServerError('Node not started! No identity.');
    }
    return this.gossipNode.peerId.toString();
  }

  /* Start the GossipNode and RPC server  */
  async start() {
    await this.rocksDB.open();
    if (this.options.resetDB === true) {
      log.info('clearing rocksdb');
      await this.rocksDB.clear();
    }

    await this.syncEngine.initialize();

    await this.gossipNode.start(this.options.bootstrapAddrs ?? [], {
      peerId: this.options.peerId,
      ipMultiAddr: this.options.ipMultiAddr,
      gossipPort: this.options.gossipPort,
      allowedPeerIdStrs: this.options.allowedPeers,
    });
    await this.rpcServer.start(this.options.rpcPort ? this.options.rpcPort : 0);
    this.registerEventHandlers();

    // Publishes this Node's information to the gossip network
    this.contactTimer = setInterval(async () => {
      if (this.gossipNode.peerId) {
        let gossipInfo = {};
        let rpcInfo = this.rpcAddress ? { rpcAddress: this.rpcAddress } : {};

        const localAddrs = this.gossipAddresses;
        // publishes the public IP address of this Hub if public addressing is allowed
        if (localAddrs.length > 0 && !this.options.localIpAddrsOnly) {
          const ipAddr = await getPublicIp();

          ipAddr.match(
            (ipAddr) => {
              const port = localAddrs[0].nodeAddress().port;
              addressInfoFromParts(ipAddr, port).map((gossipAddress) => {
                // populates the gossip address
                gossipInfo = { gossipAddress };

                // populates the RPC address with the public address
                if (this.rpcAddress) rpcInfo = { rpcAddress: { ...gossipAddress, port: this.rpcAddress.port } };
              });
            },
            (error) => {
              log.error(error);
            }
          );
        }

        const currentSnapshot = this.syncEngine.snapshot;
        const gossipMessage: GossipMessage<ContactInfoContent> = {
          content: {
            ...rpcInfo,
            ...gossipInfo,
            peerId: this.gossipNode.peerId.toString(),
            excludedHashes: currentSnapshot.excludedHashes,
            count: currentSnapshot.numMessages,
          },
          topics: [NETWORK_TOPIC_CONTACT],
        };
        await this.gossipMessage(gossipMessage);
      }
    }, GOSSIP_CONTACT_INTERVAL);
  }

  /** Stop the GossipNode and RPC Server */
  async stop() {
    clearInterval(this.contactTimer);
    await this.gossipNode.stop();
    await this.rpcServer.stop();
    await this.rocksDB.close();
  }

  /** Publish message to the gossip network */
  async gossipMessage(message: GossipMessage) {
    return this.gossipNode.publish(message);
  }

  async handleGossipMessage(gossipMessage: GossipMessage) {
    let result: Result<void, FarcasterError> = err(new ServerError('Invalid message type'));
    if (isUserContent(gossipMessage.content)) {
      const message = (gossipMessage.content as UserContent).message;
      result = await this.engine.mergeMessage(message, 'Gossip');
    } else if (isIdRegistryContent(gossipMessage.content)) {
      const message = (gossipMessage.content as IdRegistryContent).message;
      result = await this.engine.mergeIdRegistryEvent(message, 'Gossip');
      if (result.isOk()) log.info({ event: message }, 'merged id registry event');
    } else if (isContactInfo(gossipMessage.content)) {
      const message = gossipMessage.content as ContactInfoContent;
      await this.handleContactInfo(message);
      result = ok(undefined);
    }

    if (result.isErr()) {
      log.error(result.error, 'Failed to merge message');
    }
    return result;
  }

  async handleContactInfo(message: ContactInfoContent) {
    // Updates the address book for this peer
    if (message.gossipAddress) {
      try {
        const p2pMultiAddr = multiaddr(p2pMultiAddrStr(message.gossipAddress, message.peerId.toString()));
        const peerId = peerIdFromString(message.peerId);
        await this.gossipNode.addressBook?.add(peerId, [p2pMultiAddr]);
      } catch (err) {
        log.error(err, `Failed to add contact Info to address book. ${message}`);
      }
    }

    const rpcClient = await this.getRPCClientForPeer(message);
    log.info(
      { identity: this.identity, peer: message.peerId, ip: rpcClient?.serverMultiaddr },
      'received a Contact Info for sync'
    );
    await this.diffSyncIfRequired(message, rpcClient);
  }

  async diffSyncIfRequired(message: ContactInfoContent, rpcClient: RPCClient | undefined) {
    this.emit('syncStart');
    if (!rpcClient) {
      log.warn(`No RPC client for peer, skipping sync`);
      this.emit('syncComplete', false);
      return;
    }
    if (this.syncEngine.isSyncing) {
      // Don't fire syncComplete
      log.debug(`Already syncing, skipping sync`);
      return;
    }
    if (!this.syncEngine.shouldSync(message.excludedHashes)) {
      log.debug(`Upto date with peer, skipping sync`);
      this.emit('syncComplete', false);
      return;
    }
    await this.syncEngine.performSync(message.excludedHashes, rpcClient);
    this.emit('syncComplete', true);
  }

  private async getRPCClientForPeer(peer: ContactInfoContent): Promise<RPCClient | undefined> {
    /*
     * Find the peer's addrs from our peer list because we cannot use the address
     * in the contact info directly
     */
    if (!peer.rpcAddress) {
      return;
    }
    const contactPeers = this.gossipNode.gossip?.getSubscribers(NETWORK_TOPIC_CONTACT);
    const peerId = contactPeers?.find((value) => {
      return peer.peerId.toString() === value.toString();
    });
    if (!peerId) {
      // cannot receive information from peer's not on Gossip.
      log.info(
        { function: 'getRPCClientForPeer', identity: this.identity, peer: peer },
        `peer is not subscribed to gossip`
      );
      return;
    }

    // prefer the advertised address if it's available
    if (isIP(peer.rpcAddress.address)) {
      return new RPCClient({
        ...peer.rpcAddress,
      });
    }

    log.info({ peerId: peer.peerId.toString() }, 'falling back to addressbook lookup for peer');
    const peerInfo = await this.gossipNode.getPeerInfo(peerId);
    if (!peerInfo) {
      log.info(
        { function: 'getRPCClientForPeer', identity: this.identity, peer: peer },
        `failed to find peer's address to request simple sync`
      );

      return;
    }

    // sorts addresses by Public IPs first
    const addrs = peerInfo.addresses.sort((a, b) => publicAddressesFirst(a, b));
    const nodeAddress = addrs[0].multiaddr.nodeAddress();
    return new RPCClient({
      address: nodeAddress.address,
      family: nodeAddress.family == 4 ? 'IPv4' : 'IPv6',
      // Use the gossip rpc port instead of the port used by libp2p
      port: peer.rpcAddress.port,
    });
  }

  private registerEventHandlers() {
    // Subscribes to all relevant topics
    this.gossipNode.gossip?.subscribe(NETWORK_TOPIC_PRIMARY);
    this.gossipNode.gossip?.subscribe(NETWORK_TOPIC_CONTACT);

    this.gossipNode.addListener('message', async (_topic, message) => {
      await message.match(
        async (gossipMessage) => {
          await this.handleGossipMessage(gossipMessage);
        },
        async (error) => {
          log.error(error, 'failed to decode message');
        }
      );
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                               RPC Handler API                              */
  /* -------------------------------------------------------------------------- */

  /* RPCHandler API */
  getUsers(): Promise<Set<number>> {
    return this.engine.getUsers();
  }
  getAllCastsByUser(fid: number): Promise<Set<Cast>> {
    return this.engine.getAllCastsByUser(fid);
  }
  getAllSignerMessagesByUser(fid: number): Promise<Set<SignerMessage>> {
    return this.engine.getAllSignerMessagesByUser(fid);
  }
  getAllReactionsByUser(fid: number): Promise<Set<Reaction>> {
    return this.engine.getAllReactionsByUser(fid);
  }
  getAllFollowsByUser(fid: number): Promise<Set<Follow>> {
    return this.engine.getAllFollowsByUser(fid);
  }
  getAllVerificationsByUser(fid: number): Promise<Set<Verification>> {
    return this.engine.getAllVerificationsByUser(fid);
  }
  getCustodyEventByUser(fid: number): Promise<Result<IdRegistryEvent, FarcasterError>> {
    return this.engine.getCustodyEventByUser(fid);
  }
  getSyncMetadataByPrefix(prefix: string): Promise<Result<NodeMetadata, FarcasterError>> {
    const nodeMetadata = this.syncEngine.getTrieNodeMetadata(prefix);
    if (nodeMetadata) {
      return Promise.resolve(ok(nodeMetadata));
    } else {
      return Promise.resolve(err(new FarcasterError('no metadata found')));
    }
  }
  getSyncIdsByPrefix(prefix: string): Promise<Result<string[], FarcasterError>> {
    return Promise.resolve(ok(this.syncEngine.getIdsByPrefix(prefix)));
  }

  getMessagesByHashes(hashes: string[]): Promise<Message[]> {
    return this.engine.getMessagesByHashes(hashes);
  }

  async submitMessage(message: Message): Promise<Result<void, FarcasterError>> {
    // push this message into the engine
    const mergeResult = await this.engine.mergeMessage(message, 'RPC');
    if (mergeResult.isErr()) {
      // Safe to disable because the type is being checked to be within bounds
      // eslint-disable-next-line security/detect-object-injection
      log.error(
        mergeResult.error,
        `received invalid message of type: ${
          message.data.type <= MessageType.SignerRemove ? MessageType[message.data.type] : 'unknown'
        }`
      );
      return mergeResult;
    }

    // push this message onto the gossip network
    const gossipMessage: GossipMessage<UserContent> = {
      content: {
        message,
      },
      topics: [NETWORK_TOPIC_PRIMARY],
    };
    await this.gossipMessage(gossipMessage);
    return mergeResult;
  }

  async submitIdRegistryEvent(event: IdRegistryEvent): Promise<Result<void, FarcasterError>> {
    // push this message into the engine
    const mergeResult = await this.engine.mergeIdRegistryEvent(event, 'RPC');
    if (mergeResult.isErr()) {
      log.error(mergeResult.error, 'received invalid message');
      return mergeResult;
    }

    log.info({ event: event }, 'merged id registry event');

    // push this message onto the gossip network
    const gossipMessage: GossipMessage<IdRegistryContent> = {
      content: {
        message: event,
      },
      topics: [NETWORK_TOPIC_PRIMARY],
    };
    await this.gossipMessage(gossipMessage);
    return mergeResult;
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Test API                                  */
  /* -------------------------------------------------------------------------- */

  async destroyDB() {
    await this.rocksDB.destroy();
  }

  get merkleTrieForTest() {
    return this.syncEngine.trie;
  }
}
