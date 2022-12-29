import { PeerId } from '@libp2p/interface-peer-id';
import { peerIdFromBytes } from '@libp2p/peer-id';
import { publicAddressesFirst } from '@libp2p/utils/address-sort';
import { multiaddr, Multiaddr } from '@multiformats/multiaddr';
import { isIP } from 'net';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import { TypedEmitter } from 'tiny-typed-emitter';
import { EthEventsProvider, GoerliEthConstants } from '~/eth/ethEventsProvider';
import {
  ContactInfoContent,
  GossipAddressInfo,
  GossipContent,
  GossipMessage,
} from '~/flatbuffers/generated/gossip_generated';
import { IdRegistryEvent } from '~/flatbuffers/generated/id_registry_event_generated';
import { Message } from '~/flatbuffers/generated/message_generated';
import HubStateModel from '~/flatbuffers/models/hubStateModel';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';
import { HubInterface, HubSubmitSource } from '~/flatbuffers/models/types';
import { Node } from '~/network/p2p/node';
import { NETWORK_TOPIC_CONTACT, NETWORK_TOPIC_PRIMARY } from '~/network/p2p/protocol';
import Client from '~/rpc/client';
import Server from '~/rpc/server';
import BinaryRocksDB from '~/storage/db/rocksdb';
import Engine from '~/storage/engine';
import { HubAsyncResult, HubError } from '~/utils/hubErrors';
import { idRegistryEventToLog, logger, messageToLog, nameRegistryEventToLog } from '~/utils/logger';
import { addressInfoFromGossip, ipFamilyToString, p2pMultiAddrStr } from '~/utils/p2p';
import { isSignerRemove } from './flatbuffers/models/typeguards';
import { RevokeSignerJobQueue, RevokeSignerJobScheduler } from './storage/jobs/revokeSignerJob';

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

  /** Cron schedule for revoke signer jobs */
  revokeSignerJobCron?: string;
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

export class Hub extends TypedEmitter<HubEvents> implements HubInterface {
  private options: HubOptions;
  private gossipNode: Node;
  private rpcServer: Server;
  private contactTimer?: NodeJS.Timer;
  private rocksDB: BinaryRocksDB;
  private revokeSignerJobQueue: RevokeSignerJobQueue;
  private revokeSignerJobScheduler: RevokeSignerJobScheduler;

  //TODO(aditya): Need a Flatbuffers SyncEngine impl

  engine: Engine;
  ethRegistryProvider: EthEventsProvider;

  constructor(options: HubOptions) {
    super();
    this.options = options;
    this.rocksDB = new BinaryRocksDB(options.rocksDBName ? options.rocksDBName : randomDbName());
    this.gossipNode = new Node();
    this.engine = new Engine(this.rocksDB);
    this.rpcServer = new Server(this, this.engine);

    // Create the ETH registry provider, which will fetch ETH events and push them into the engine.
    this.ethRegistryProvider = EthEventsProvider.makeWithGoerli(
      this,
      options.networkUrl ?? '',
      GoerliEthConstants.IdRegistryAddress,
      GoerliEthConstants.NameRegistryAddress
    );

    // Setup job queues
    this.revokeSignerJobQueue = new RevokeSignerJobQueue(this.rocksDB);

    // Setup job schedulers
    this.revokeSignerJobScheduler = new RevokeSignerJobScheduler(this.revokeSignerJobQueue, this.engine);
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
    await this.rocksDB.open();

    if (this.options.resetDB === true) {
      log.info('clearing rocksdb');
      await this.rocksDB.clear();
    }

    // Start the ETH registry provider first
    await this.ethRegistryProvider.start();

    await this.gossipNode.start(this.options.bootstrapAddrs ?? [], {
      peerId: this.options.peerId,
      ipMultiAddr: this.options.ipMultiAddr,
      gossipPort: this.options.gossipPort,
      allowedPeerIdStrs: this.options.allowedPeers,
    });

    // Start the RPC server
    await this.rpcServer.start(this.options.rpcPort ? this.options.rpcPort : 0);
    this.registerEventHandlers();

    // Start cron tasks
    this.revokeSignerJobScheduler.start();
  }

  /** Stop the GossipNode and RPC Server */
  async stop() {
    clearInterval(this.contactTimer);
    this.revokeSignerJobScheduler.stop();
    await this.ethRegistryProvider.stop();
    await this.rpcServer.stop();
    await this.rocksDB.close();
  }

  async getHubState(): HubAsyncResult<HubStateModel> {
    return ResultAsync.fromPromise(HubStateModel.get(this.rocksDB), (e) => e as HubError);
  }

  async putHubState(hubState: HubStateModel): HubAsyncResult<void> {
    const txn = this.rocksDB.transaction();
    HubStateModel.putTransaction(txn, hubState);
    return await ResultAsync.fromPromise(this.rocksDB.commit(txn), (e) => e as HubError);
  }

  /** ------------------------------------------------------------------------- */
  /*                                  Private Methods                           */
  /* -------------------------------------------------------------------------- */

  private async handleGossipMessage(gossipMessage: GossipMessage): HubAsyncResult<void> {
    const contentType = gossipMessage.contentType();
    if (contentType === GossipContent.Message) {
      const message: Message = gossipMessage.content(contentType);
      return this.submitMessage(new MessageModel(message), 'gossip');
    } else if (contentType === GossipContent.IdRegistryEvent) {
      const event = new IdRegistryEventModel(gossipMessage.content(contentType) as IdRegistryEvent);
      return this.submitIdRegistryEvent(event, 'gossip');
    } else if (contentType === GossipContent.ContactInfoContent) {
      const message: ContactInfoContent = gossipMessage.content(contentType);
      await this.handleContactInfo(message);
      return ok(undefined);
    } else {
      return err(new HubError('bad_request.invalid_param', 'invalid message type'));
    }
  }

  private async handleContactInfo(message: ContactInfoContent) {
    // Updates the address book for this peer
    const gossipAddress = message.gossipAddress();
    if (gossipAddress) {
      const peerIdResult = Result.fromThrowable(
        () => peerIdFromBytes(message.peerIdArray() ?? new Uint8Array([])),
        (error) => new HubError('bad_request.parse_failure', error as unknown as Error)
      )();
      const addressInfo = addressInfoFromGossip(gossipAddress);
      if (addressInfo.isErr()) {
        log.error(addressInfo.error, 'unable to parse gossip address for peer');
        return;
      }

      const p2pMultiAddrResult = p2pMultiAddrStr(addressInfo.value, message.peerId.toString()).map((addr) =>
        multiaddr(addr)
      );

      const res = Result.combine([peerIdResult, p2pMultiAddrResult]).map(async ([peerId, multiaddr]) => {
        if (!this.gossipNode.addressBook) {
          return err(new HubError('unavailable', 'address book missing for gossipNode'));
        }

        return await ResultAsync.fromPromise(
          this.gossipNode.addressBook.add(peerId, [multiaddr]),
          (error) => new HubError('unavailable', error as unknown as Error)
        ).map(() => ok(undefined));
      });

      if (res.isErr()) {
        log.error({ error: res.error, message }, 'failed to add contact info to address book');
      }
    }

    const rpcClient = await this.getRPCClientForPeer(message);
    log.info(
      { identity: this.identity, peer: message.peerId, ip: rpcClient?.serverMultiaddr },
      'received a Contact Info for sync'
    );
    await this.diffSyncIfRequired(message, rpcClient);
  }

  private async diffSyncIfRequired(message: ContactInfoContent, rpcClient: Client | undefined) {
    this.emit('syncStart');
    if (!rpcClient) {
      log.warn(`No RPC client for peer, skipping sync`);
      this.emit('syncComplete', false);
      return;
    }

    log.warn(`Flatbuffers DiffSync is not implemented`);
    this.emit('syncComplete', false);
    return;
  }

  private async getRPCClientForPeer(peer: ContactInfoContent): Promise<Client | undefined> {
    /*
     * Find the peer's addrs from our peer list because we cannot use the address
     * in the contact info directly
     */
    if (!peer.rpcAddress() || !peer.peerIdArray()) {
      return;
    }
    const contactPeers = this.gossipNode.gossip?.getSubscribers(NETWORK_TOPIC_CONTACT);
    const peerId = contactPeers?.find((value) => {
      return peer.peerIdArray()?.toString() === value.toString();
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
    const addressInfo = addressInfoFromGossip(peer.rpcAddress() as GossipAddressInfo);
    if (addressInfo.isErr()) {
      log.error(addressInfo.error, 'unable to parse gossip address for peer');
      return;
    }

    if (isIP(addressInfo.value.address)) {
      return new Client(addressInfo.value);
    }

    log.info({ peerId: peer.peerIdArray()?.toString() }, 'falling back to addressbook lookup for peer');
    const peerInfo = await this.gossipNode.getPeerInfo(peerId);
    if (!peerInfo) {
      log.info(
        { function: 'getRPCClientForPeer', identity: this.identity, peer: peer },
        `failed to find peer's address to request simple sync`
      );

      return;
    }

    // sorts addresses by Public IPs first
    const addr = peerInfo.addresses.sort((a, b) => publicAddressesFirst(a, b))[0];
    if (addr === undefined) {
      log.info(
        { function: 'getRPCClientForPeer', identity: this.identity, peer: peer },
        `peer found but no address is available to request simple sync`
      );

      return;
    }

    const nodeAddress = addr.multiaddr.nodeAddress();
    return new Client({
      address: nodeAddress.address,
      family: ipFamilyToString(nodeAddress.family),
      // Use the gossip rpc port instead of the port used by libp2p
      port: addressInfo.value.port,
    });
  }

  private registerEventHandlers() {
    // Subscribe to store events
    this.engine.eventHandler.on('mergeMessage', async (message: MessageModel) => {
      log.info(messageToLog(message), 'mergeMessage');

      if (isSignerRemove(message)) {
        const revokeSignerPayload = RevokeSignerJobQueue.makePayload(
          message.fid(),
          message.body().signerArray() ?? new Uint8Array()
        );
        if (revokeSignerPayload.isOk()) {
          // Revoke signer in one hour
          await this.revokeSignerJobQueue.enqueueJob(revokeSignerPayload.value);
        }
      }

      // TODO: gossip merged message
    });

    this.engine.eventHandler.on('mergeIdRegistryEvent', async (event: IdRegistryEventModel) => {
      log.info(idRegistryEventToLog(event), 'mergeIdRegistryEvent');

      const fromAddress = event.from();
      if (fromAddress && fromAddress.length > 0) {
        const revokeSignerPayload = RevokeSignerJobQueue.makePayload(event.fid(), fromAddress);
        if (revokeSignerPayload.isOk()) {
          // Revoke eth address in one hour
          await this.revokeSignerJobQueue.enqueueJob(revokeSignerPayload.value);
        }
      }
    });

    this.engine.eventHandler.on('mergeNameRegistryEvent', (event: NameRegistryEventModel) => {
      log.info(nameRegistryEventToLog(event), 'mergeNameRegistryEvent');
    });

    // Subscribes to all relevant topics
    this.gossipNode.gossip?.subscribe(NETWORK_TOPIC_PRIMARY);
    this.gossipNode.gossip?.subscribe(NETWORK_TOPIC_CONTACT);

    this.gossipNode.on('message', async (_topic, message) => {
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

  async submitMessage(message: MessageModel, source?: HubSubmitSource): HubAsyncResult<void> {
    log.info({ ...messageToLog(message), source }, 'submitMessage');

    // push this message into the storage engine
    const mergeResult = await this.engine.mergeMessage(message);
    if (mergeResult.isErr()) {
      log.error(mergeResult.error);
      return mergeResult;
    }

    return mergeResult;
  }

  async submitIdRegistryEvent(event: IdRegistryEventModel, source?: HubSubmitSource): HubAsyncResult<void> {
    log.info({ ...idRegistryEventToLog(event), source }, 'submitIdRegistryEvent');

    // push this message into the storage engine
    const mergeResult = await this.engine.mergeIdRegistryEvent(event);
    if (mergeResult.isErr()) {
      log.error(mergeResult.error);
      return mergeResult;
    }

    return mergeResult;
  }

  async submitNameRegistryEvent(event: NameRegistryEventModel, source?: HubSubmitSource): HubAsyncResult<void> {
    log.info({ ...nameRegistryEventToLog(event), source }, 'submitNameRegistryEvent');

    // push this message into the storage engine
    const mergeResult = await this.engine.mergeNameRegistryEvent(event);
    if (mergeResult.isErr()) {
      log.error(mergeResult.error);
      return mergeResult;
    }

    return mergeResult;
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Test API                                  */
  /* -------------------------------------------------------------------------- */

  async destroyDB() {
    await this.rocksDB.destroy();
  }
}
