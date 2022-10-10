import { Multiaddr } from '@multiformats/multiaddr';
import Engine from '~/storage/engine';
import { Node } from '~/network/p2p/node';
import { RPCClient, RPCHandler, RPCServer } from '~/network/rpc';
import { Cast, SignerMessage, Reaction, Follow, Verification, IDRegistryEvent, Message } from '~/types';
import {
  ContactInfoContent,
  GossipMessage,
  GOSSIP_CONTACT_INTERVAL,
  IDRegistryContent,
  NETWORK_TOPIC_CONTACT,
  NETWORK_TOPIC_PRIMARY,
  UserContent,
} from '~/network/p2p/protocol';
import { AddressInfo } from 'net';
import { isContactInfo, isIDRegistryContent, isUserContent } from '~/types/typeguards';
import { TypedEmitter } from 'tiny-typed-emitter';
import RocksDB from '~/storage/db/rocksdb';
import { err, ok, Result } from 'neverthrow';
import { FarcasterError, ServerError } from '~/utils/errors';
import { SyncEngine } from '~/network/sync/syncEngine';

export interface HubOpts {
  /** Addresses to bootstrap the gossip network */
  bootstrapAddrs?: Multiaddr[];

  /** Port for the RPC Client */
  port?: number;

  /** Network URL of the IdRegistry Contract */
  networkUrl?: string;

  /** Address of the IdRegistry contract  */
  IDRegistryAddress?: string;

  /*
   * Enable SimpleSync once network is established.
   *
   * @remarks
   * Usually disabled for the first node that joins the network
   */
  simpleSync?: boolean;

  /** Name of the RocksDB instance */
  rocksDBName?: string;

  /** Resets the DB on start, if true */
  resetDB?: boolean;
}

/** @returns A randomized string of the format `rocksdb.tmp.*` used for the DB Name */
const randomDbName = () => {
  return `rocksdb.tmp.${(new Date().getUTCDate() * Math.random()).toString(36).substring(2)}`;
};

enum SimpleSyncState {
  Disabled,
  Pending,
  InProgress,
  Complete,
}

interface HubEvents {
  /** Emit an event when SimpleSync starts */
  syncStart: () => void;

  /** Emit an event when SimpleSync completes */
  syncComplete: (success: boolean) => void;
}

export class Hub extends TypedEmitter<HubEvents> implements RPCHandler {
  private options: HubOpts;
  private gossipNode: Node;
  private rpcServer: RPCServer;
  private syncState: SimpleSyncState;
  private contactTimer?: NodeJS.Timer;
  private rocksDB: RocksDB;
  private syncEngine: SyncEngine;

  engine: Engine;

  constructor(options: HubOpts) {
    super();
    this.options = options;
    this.rocksDB = new RocksDB(options.rocksDBName ? options.rocksDBName : randomDbName());
    this.engine = new Engine(this.rocksDB, options.networkUrl, options.IDRegistryAddress);
    this.gossipNode = new Node();
    this.rpcServer = new RPCServer(this);
    this.syncState = SimpleSyncState.Pending;
    this.syncEngine = new SyncEngine(this.engine);
    if (options.simpleSync !== undefined && !options.simpleSync) {
      this.syncState = SimpleSyncState.Disabled;
    }
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
      console.log('Clearing RocksDB...');
      await this.rocksDB.clear();
    }

    await this.gossipNode.start(this.options.bootstrapAddrs ?? []);
    await this.rpcServer.start(this.options.port ? this.options.port : 0);
    this.registerEventHandlers();

    // Publishes this Node's information to the gossip network
    this.contactTimer = setInterval(async () => {
      if (this.gossipNode.peerId) {
        const content = this.rpcAddress
          ? { peerId: this.gossipNode.peerId.toString(), rpcAddress: this.rpcAddress }
          : { peerId: this.gossipNode.peerId.toString() };

        const gossipMessage: GossipMessage<ContactInfoContent> = {
          content,
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
      result = await this.engine.mergeMessage(message);
    } else if (isIDRegistryContent(gossipMessage.content)) {
      const message = (gossipMessage.content as IDRegistryContent).message;
      result = await this.engine.mergeIDRegistryEvent(message);
    } else if (isContactInfo(gossipMessage.content)) {
      // TODO: Maybe we need a ContactInfo CRDT?
      // Check if we need sync and if we do, use this peer do it.
      if (this.syncState == SimpleSyncState.Pending) {
        console.log(this.identity, 'Received a Contact Info for Sync');
        await this.simpleSyncFromPeer(gossipMessage.content as ContactInfoContent);
      }
      result = ok(undefined);
    }

    if (result.isErr()) {
      console.log(this.identity, result, 'Failed to merge message');
    }
    return result;
  }

  /** Attempt to sync data from a peer */
  async simpleSyncFromPeer(peer: ContactInfoContent) {
    if (this.syncState != SimpleSyncState.Pending) return;

    this.emit('syncStart');
    console.log(this.identity, 'Attempting to sync from Peer', peer);
    /*
     * Find the peer's addrs from our peer list because we cannot use the address
     * in the contact info directly
     */
    if (!peer.rpcAddress) {
      this.emit('syncComplete', false);
      return;
    }
    const contactPeers = this.gossipNode.gossip?.getSubscribers(NETWORK_TOPIC_CONTACT);
    const peerId = contactPeers?.find((value) => {
      return peer.peerId === value.toString();
    });
    if (!peerId) {
      console.log(this.identity, 'Failed to find peer matching contact info', peer);
      this.emit('syncComplete', false);
      return;
    }
    const peerAddress = await this.gossipNode.getPeerAddress(peerId);
    if (!peerAddress) {
      console.log(this.identity, 'Failed to find peer address to request simple sync');
      this.emit('syncComplete', false);
      return;
    }

    // Request and merge peer's data over RPC
    const nodeAddress = peerAddress.addresses[0].multiaddr.nodeAddress();
    const rpcClient = new RPCClient({
      address: nodeAddress.address,
      family: nodeAddress.family == 4 ? 'ip4' : 'ip6',
      // Use the gossip rpc port instead of the port used by libp2p
      port: peer.rpcAddress.port,
    });

    // Start the Sync
    this.syncState = SimpleSyncState.InProgress;
    const users = await rpcClient.getUsers();
    await users.match(
      async (users) => {
        for (const user of users) {
          // get the signer messages first so we can prepare to ingest the remaining messages later
          const custodyEventResult = await rpcClient.getCustodyEventByUser(user);
          if (custodyEventResult.isErr()) {
            console.log(
              this.identity,
              custodyEventResult,
              'Failed to get custody events for Fid',
              user,
              'Cannot sync user...'
            );
            continue;
          }
          await this.engine.mergeIDRegistryEvent(custodyEventResult._unsafeUnwrap());
          const signerMessagesResult = await rpcClient.getAllSignerMessagesByUser(user);
          if (signerMessagesResult.isErr()) {
            console.log(
              this.identity,
              signerMessagesResult,
              'Failed to get signer messages events for Fid',
              user,
              'Cannot sync user...'
            );
            continue;
          }
          await Promise.all(this.engine.mergeMessages([...signerMessagesResult._unsafeUnwrap()]));

          // now collect all the messages from each set
          const responses = await Promise.all([
            rpcClient.getAllCastsByUser(user),
            rpcClient.getAllFollowsByUser(user),
            rpcClient.getAllReactionsByUser(user),
            rpcClient.getAllVerificationsByUser(user),
          ]);

          // collect all the messages for each Set into a single list of messages
          const allMessages = responses.flatMap((response) => {
            return response.match(
              (messages) => {
                return [...messages];
              },
              () => {
                return [];
              }
            );
          });

          // Replays all messages into the engine
          const mergeResults = await Promise.all(this.engine.mergeMessages(allMessages));
          let success = 0;
          let fail = 0;
          mergeResults.forEach((result) => {
            result.isErr() ? fail++ : success++;
          });
          console.log(
            this.identity,
            'Sync Progress( Fid:',
            user,
            '): Merged:',
            success,
            'messages and failed',
            fail,
            'messages'
          );
        }
      },
      async (error) => {
        console.log(this.identity, error, 'Failed to get users, sync failure...');
      }
    );
    console.log(this.identity, 'Sync completed');
    this.emit('syncComplete', true);
    this.syncState = SimpleSyncState.Complete;
  }

  private registerEventHandlers() {
    // Subscribes to all relevant topics
    this.gossipNode.gossip?.subscribe(NETWORK_TOPIC_PRIMARY);
    this.gossipNode.gossip?.subscribe(NETWORK_TOPIC_CONTACT);

    this.gossipNode.addListener('message', async (_topic, message) => {
      console.debug(message);
      await message.match(
        async (gossipMessage) => {
          await this.handleGossipMessage(gossipMessage);
        },
        async (error) => {
          console.log(this.identity, error, 'Received a message but failed to decode it');
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
  getCustodyEventByUser(fid: number): Promise<Result<IDRegistryEvent, FarcasterError>> {
    return this.engine.getCustodyEventByUser(fid);
  }

  async submitMessage(message: Message): Promise<Result<void, FarcasterError>> {
    // push this message into the engine
    const mergeResult = await this.engine.mergeMessage(message);
    if (mergeResult.isErr()) {
      console.log(this.identity, mergeResult.error, 'Received invalid message...');
      return mergeResult;
    }

    // push this message onto the gossip network
    const gossipMessage: GossipMessage<UserContent> = {
      content: {
        message,
        root: '',
        count: 0,
      },
      topics: [NETWORK_TOPIC_PRIMARY],
    };
    await this.gossipMessage(gossipMessage);
    return mergeResult;
  }

  async submitIDRegistryEvent(event: IDRegistryEvent): Promise<Result<void, FarcasterError>> {
    // push this message into the engine
    const mergeResult = await this.engine.mergeIDRegistryEvent(event);
    if (mergeResult.isErr()) {
      console.log(this.identity, mergeResult.error, 'Received invalid message...');
      return mergeResult;
    }

    // push this message onto the gossip network
    const gossipMessage: GossipMessage<IDRegistryContent> = {
      content: {
        message: event,
        root: '',
        count: 0,
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
