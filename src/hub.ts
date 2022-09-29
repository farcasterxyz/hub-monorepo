import { Multiaddr } from '@multiformats/multiaddr';
import Engine from '~/engine';
import { Node } from '~/network/node';
import { RPCClient, RPCHandler, RPCServer } from '~/network/rpc';
import { Cast, SignerMessage, Reaction, Follow, Verification, IDRegistryEvent, Message } from '~/types';
import {
  ContactInfo,
  GossipMessage,
  GOSSIP_CONTACT_INTERVAL,
  IDRegistryContent,
  NETWORK_TOPIC_CONTACT,
  NETWORK_TOPIC_PRIMARY,
  UserContent,
} from '~/network/protocol';
import { AddressInfo } from 'net';
import { isContactInfo, isIDRegistryContent, isUserContent } from '~/network/typeguards';
import { TypedEmitter } from 'tiny-typed-emitter';
import RocksDB from '~/db/rocksdb';
import Faker from 'faker';
import { Result } from 'neverthrow';
import { FarcasterError } from '~/errors';

export interface HubOpts {
  // ID Registry network URL
  networkUrl?: string;
  // ID Registry address
  IDRegistryAddress?: string;
  // Addresses to use to join an existing gossip network
  bootstrapAddrs?: Multiaddr[];
  // The port to use for RPC, startup will fail if the port is unavailable
  port?: number;
  /*
   * Whether simple sync should be used once the network is established
   * This would typically only be disabled on the first node to join a new network
   */
  simpleSync?: boolean;
  // The name of the RocksDB instance to use
  rocksDBName?: string;
}

const randomDbName = () => `rocksdb.tmp.${Faker.name.lastName().toLowerCase()}`;

enum SimpleSyncState {
  Disabled,
  Pending,
  InProgress,
  Complete,
}

interface HubEvents {
  /**
   * Triggered when a simple sync starts
   */
  sync_start: () => void;
  /**
   * Triggered when a simple sync completes
   */
  sync_complete: () => void;
}

export class Hub extends TypedEmitter<HubEvents> implements RPCHandler {
  private options: HubOpts;
  private gossipNode: Node;
  private rpcServer: RPCServer;
  private syncState: SimpleSyncState;
  private contactTimer?: NodeJS.Timer;
  private rocksDB: RocksDB;

  engine: Engine;

  constructor(options: HubOpts) {
    super();
    this.options = options;
    this.rocksDB = new RocksDB(options.rocksDBName ? options.rocksDBName : randomDbName());
    this.engine = new Engine(this.rocksDB, options.networkUrl, options.IDRegistryAddress);
    this.gossipNode = new Node();
    this.rpcServer = new RPCServer(this);
    this.syncState = SimpleSyncState.Pending;
    if (options.simpleSync !== undefined && !options.simpleSync) {
      // explicitly disabled
      this.syncState = SimpleSyncState.Disabled;
    }
  }

  /* Starts the Hub's networking components */
  async start() {
    // open rocksDB
    await this.rocksDB.open();
    // start all the networking bits
    await this.gossipNode.start(this.options.bootstrapAddrs);
    await this.rpcServer.start(this.options.port ? this.options.port : 0);
    this.registerEventHandlers();

    // Publish this Node's information to the gossip network
    this.contactTimer = setInterval(async () => {
      if (this.gossipNode.peerId) {
        const gossipMesage: GossipMessage<ContactInfo> = {
          content: {
            peerId: this.gossipNode.peerId.toString(),
            rpcAddress: this.rpcAddress,
          },
          topics: [NETWORK_TOPIC_CONTACT],
        };
        await this.gossipMessage(gossipMesage);
      }
    }, GOSSIP_CONTACT_INTERVAL);
  }

  get rpcAddress() {
    // We're always configuring RPC on an IP socket so we can cast it safely here.
    if (this.rpcServer.address) {
      return this.rpcServer.address as AddressInfo;
    } else {
      return undefined;
    }
  }

  get gossipAddresses() {
    return this.gossipNode.multiaddrs ?? [];
  }

  async stop() {
    clearInterval(this.contactTimer);
    await this.gossipNode.stop();
    await this.rpcServer.stop();
    await this.rocksDB.close();
  }

  // Returns the Gossip peerId string of this Hub
  get identity(): string {
    if (!this.gossipNode.isStarted()) {
      console.error('No identity for node that has not started');
    }
    return this.gossipNode.peerId ? this.gossipNode.peerId.toString() + ':' : 'Not Started';
  }

  // Publishes the given message to the gossip network
  async gossipMessage(message: GossipMessage) {
    return this.gossipNode.publish(message);
  }

  private registerEventHandlers() {
    // subscribe to all interesting topics
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

  private async handleGossipMessage(gossipMessage: GossipMessage) {
    let result;
    if (isUserContent(gossipMessage.content as UserContent)) {
      const message = (gossipMessage.content as UserContent).message;
      result = await this.engine.mergeMessage(message as Message);
    } else if (isIDRegistryContent(gossipMessage.content as IDRegistryContent)) {
      const message = (gossipMessage.content as IDRegistryContent).message;
      result = await this.engine.mergeIDRegistryEvent(message as IDRegistryEvent);
    } else if (isContactInfo(gossipMessage.content as ContactInfo)) {
      // TODO Maybe we need a ContactInfo CRDT?
      // Check if we need sync and if we do, use this peer do it.
      if (this.syncState == SimpleSyncState.Pending) {
        console.log(this.identity, 'Received a Contact Info for Sync');
        await this.simpleSyncFromPeer(gossipMessage.content as ContactInfo);
      }
    }

    if (result && result.isErr()) {
      console.log(this.identity, result, 'Failed to merge message');
    }
  }

  private async simpleSyncFromPeer(peer: ContactInfo) {
    this.emit('sync_start');
    console.log(this.identity, 'Attempting to sync from Peer', peer);
    /*
     * Find the peer's addrs from our peer list because we cannot use the address
     * in the contact info directly
     */
    if (!peer.rpcAddress) return;
    const contactPeers = this.gossipNode.gossip?.getSubscribers(NETWORK_TOPIC_CONTACT);
    const peerId = contactPeers?.find((value) => {
      return peer.peerId === value.toString();
    });
    if (!peerId) {
      console.log(this.identity, 'Failed to find peer matching contact info', peer);
      return;
    }
    const peerAddress = await this.gossipNode.getPeerAddress(peerId);
    if (!peerAddress) {
      console.log(this.identity, 'Failed to find peer address to request simple sync');
      return;
    }
    // start requesting for peer's data over rpc
    const nodeAddress = peerAddress.addresses[0].multiaddr.nodeAddress();
    // merge peer data
    const rpcClient = new RPCClient({
      address: nodeAddress.address,
      family: nodeAddress.family == 4 ? 'ip4' : 'ip6',
      // use the rpc port we got over gossip instead of the port being used by libp2p
      port: peer.rpcAddress.port,
    });

    // start the sync
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

          // replay all messages into the our Engine
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
    this.emit('sync_complete');
    this.syncState = SimpleSyncState.Complete;
  }

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
      console.log(this.identity, mergeResult._unsafeUnwrapErr(), 'Received invalid message...');
      return mergeResult;
    }

    // push this message onto the gossip network
    const gossipMesage: GossipMessage<UserContent> = {
      content: {
        message,
        root: '',
        count: 0,
      },
      topics: [NETWORK_TOPIC_PRIMARY],
    };
    await this.gossipMessage(gossipMesage);
    return mergeResult;
  }

  /* Test API */
  async destroyDB() {
    await this.rocksDB.destroy();
  }
}
