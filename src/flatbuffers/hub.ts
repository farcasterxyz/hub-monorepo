import { Multiaddr } from '@multiformats/multiaddr';
import Engine from '~/storage/engine/flatbuffers';
import { RPCClient } from '~/network/rpc';
import { RPCHandler } from '~/network/rpc/flatbuffers/server';
import Server from '~/network/rpc/flatbuffers/server';
import { PeerId } from '@libp2p/interface-peer-id';
import { MessageType } from '~/types';
import { ContactInfoContent } from '~/network/p2p/protocol';
import { TypedEmitter } from 'tiny-typed-emitter';
import BinaryRocksDB from '~/storage/db/binaryrocksdb';
import { logger } from '~/utils/logger';
import { HubAsyncResult } from '~/utils/hubErrors';
import MessageModel from '~/storage/flatbuffers/messageModel';
import IdRegistryEventModel from '~/storage/flatbuffers/idRegistryEventModel';

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
  private rpcServer: Server;
  private contactTimer?: NodeJS.Timer;
  private rocksDB: BinaryRocksDB;

  //TODO(sagar): Need a Flatbuffers SyncEngine impl
  //TODO(sagar): Need a Flatbuffers Gossip Node impl

  engine: Engine;

  constructor(options: HubOptions) {
    super();
    this.options = options;
    this.rocksDB = new BinaryRocksDB(options.rocksDBName ? options.rocksDBName : randomDbName());
    this.engine = new Engine(this.rocksDB);
    this.rpcServer = new Server(this.engine, this);
  }

  get rpcAddress() {
    return this.rpcServer.address;
  }

  get gossipAddresses() {
    return [];
  }

  /* Start the GossipNode and RPC server  */
  async start() {
    await this.rocksDB.open();
    if (this.options.resetDB === true) {
      log.info('clearing rocksdb');
      await this.rocksDB.clear();
    }

    await this.rpcServer.start(this.options.rpcPort ? this.options.rpcPort : 0);
  }

  /** Stop the GossipNode and RPC Server */
  async stop() {
    clearInterval(this.contactTimer);
    await this.rpcServer.stop();
    await this.rocksDB.close();
  }

  async diffSyncIfRequired(message: ContactInfoContent, rpcClient: RPCClient | undefined) {
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

  /* -------------------------------------------------------------------------- */
  /*                               RPC Handler API                              */
  /* -------------------------------------------------------------------------- */

  async submitMessage(message: MessageModel): HubAsyncResult<void> {
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

    //TODO(sagar): push this message onto the gossip network
    return mergeResult;
  }

  async submitIdRegistryEvent(event: IdRegistryEventModel): HubAsyncResult<void> {
    // push this message into the engine
    const mergeResult = await this.engine.mergeIdRegistryEvent(event, 'RPC');
    if (mergeResult.isErr()) {
      log.error(mergeResult.error, 'received invalid message');
      return mergeResult;
    }

    log.info({ event: event }, 'merged id registry event');

    //TODO(sagar): push this message onto the gossip network
    return mergeResult;
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Test API                                  */
  /* -------------------------------------------------------------------------- */

  async destroyDB() {
    await this.rocksDB.destroy();
  }
}
