import { gossipsub, GossipSub } from '@chainsafe/libp2p-gossipsub';
import { noise } from '@chainsafe/libp2p-noise';
import * as protobufs from '@farcaster/protobufs';
import { HubAsyncResult, HubError, HubResult } from '@farcaster/utils';
import { Connection } from '@libp2p/interface-connection';
import { PeerId } from '@libp2p/interface-peer-id';
import { mplex } from '@libp2p/mplex';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { tcp } from '@libp2p/tcp';
import { Multiaddr } from '@multiformats/multiaddr';
import { createLibp2p, Libp2p } from 'libp2p';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import { TypedEmitter } from 'tiny-typed-emitter';
import { ConnectionFilter } from '~/network/p2p/connectionFilter';
import { GOSSIP_TOPICS, NETWORK_TOPIC_PRIMARY } from '~/network/p2p/protocol';
import { logger } from '~/utils/logger';
import { addressInfoFromParts, checkNodeAddrs, ipMultiAddrStrFromAddressInfo } from '~/utils/p2p';

const MultiaddrLocalHost = '/ip4/127.0.0.1';

/** The maximum number of pending merge messages before we drop new incoming gossip or sync messages  */
export const MAX_MESSAGE_QUEUE_SIZE = 10_000;

const log = logger.child({ component: 'Node' });

/** Events emitted by a Farcaster Gossip Node */
interface NodeEvents {
  /** Triggers on receipt of a new message and includes the topic and message contents */
  message: (topic: string, message: HubResult<protobufs.GossipMessage>) => void;
  /** Triggers when a peer connects and includes the libp2p Connection object*/
  peerConnect: (connection: Connection) => void;
  /** Triggers when a peer disconnects and includes the libp2p Connection object */
  peerDisconnect: (connection: Connection) => void;
}

/** Optional arguments provided when creating a Farcaster Gossip Node */
interface NodeOptions {
  /** A libp2p PeerId to use as the node's identity. A random key pair is generated if undefined */
  peerId?: PeerId | undefined;
  /** A IP address that the node binds to, provided in MultiAddr format */
  ipMultiAddr?: string | undefined;
  /** An external IP address that is announced to peers */
  announceIp?: string | undefined;
  /** A port used to listen for gossip messages. A random value is selected if not specified */
  gossipPort?: number | undefined;
  /** A list of PeedIds that are allowed to connect to this node */
  allowedPeerIdStrs?: string[] | undefined;
}

/**
 * A GossipNode allows a Hubble instance to connect and gossip messages to its peers.
 *
 * Hubble instances communicate using the gossipsub protocol implemented by libp2p. Each GossipNode
 * wraps around a libp2p node which manages the gossip network and provides convenience methods to
 * interact with the network.
 */
export class GossipNode extends TypedEmitter<NodeEvents> {
  private _node?: Libp2p;

  /** Returns the PeerId (public key) of this node */
  get peerId() {
    return this._node?.peerId;
  }

  /** Returns the node's addresses in MultiAddr form, including unreachable local addresses */
  get multiaddrs() {
    return this._node?.getMultiaddrs();
  }

  /** Returns the node's libp2p AddressBook */
  get addressBook() {
    return this._node?.peerStore.addressBook;
  }

  /** Returns the libp2p Peer instance after updating the connections in the AddressBook */
  async getPeerInfo(peerId: PeerId) {
    const existingConnections = this._node?.getConnections(peerId);
    for (const conn of existingConnections ?? []) {
      const knownAddrs = await this._node?.peerStore.addressBook.get(peerId);
      if (knownAddrs && !knownAddrs.find((addr) => addr.multiaddr.equals(conn.remoteAddr))) {
        await this._node?.peerStore.addressBook.add(peerId, [conn.remoteAddr]);
      }
    }
    return await this._node?.peerStore.get(peerId);
  }

  /** Returns the GossipSub instance used by the Node */
  get gossip() {
    const pubsub = this._node?.pubsub;
    return pubsub ? (pubsub as GossipSub) : undefined;
  }

  /**
   * Initializes the libp2p node, which must be done before any configuration or communication.
   *
   * @param bootstrapAddrs  A list of bootstrap addresses which the node will attempt to connect to
   * @param options         Options to configure node
   */
  async start(bootstrapAddrs: Multiaddr[], options?: NodeOptions): HubAsyncResult<void> {
    const createResult = await this.createNode(options ?? {});
    if (createResult.isErr()) return err(createResult.error);

    this._node = createResult.value;

    this.registerListeners();
    // this.registerDebugListeners();

    await this._node.start();
    log.info(
      { identity: this.identity, addresses: this._node.getMultiaddrs().map((a) => a.toString()) },
      'Starting libp2p'
    );

    // Wait for a few seconds for everything to initialize before connecting to bootstrap nodes
    setTimeout(() => this.bootstrap(bootstrapAddrs), 1 * 1000);

    return ok(undefined);
  }

  isStarted() {
    return this._node?.isStarted();
  }

  /** Removes the node from the libp2p network and tears down pubsub */
  async stop() {
    await this._node?.stop();
    log.info({ identity: this.identity }, 'Stopped libp2p...');
  }

  get identity() {
    return this.peerId?.toString();
  }

  /** Serializes and publishes a Farcaster Message to the network */
  async gossipMessage(message: protobufs.Message) {
    const gossipMessage = protobufs.GossipMessage.create({
      message,
      topics: [NETWORK_TOPIC_PRIMARY],
      peerId: this.peerId?.toBytes() ?? new Uint8Array(),
    });
    await this.publish(gossipMessage);
  }

  /** Serializes and publishes this node's ContactInfo to the network */
  async gossipContactInfo(contactInfo: protobufs.ContactInfoContent) {
    const gossipMessage = protobufs.GossipMessage.create({
      contactInfoContent: contactInfo,
      topics: [NETWORK_TOPIC_PRIMARY],
      peerId: this.peerId?.toBytes() ?? new Uint8Array(),
    });
    await this.publish(gossipMessage);
  }

  /** Publishes a Gossip Message to the network */
  async publish(message: protobufs.GossipMessage) {
    const topics = message.topics;
    const encodedMessage = GossipNode.encodeMessage(message);

    log.debug({ identity: this.identity }, `Publishing message to topics: ${topics}`);
    encodedMessage.match(
      async (msg) => {
        const results = await Promise.all(topics.map((topic) => this.gossip?.publish(topic, msg)));
        log.debug({ identity: this.identity, results }, 'Published to gossip peers');
      },
      async (err) => {
        log.error(err, 'Failed to publish message.');
      }
    );
  }

  /** Connects to a peer GossipNode */
  async connect(peerNode: GossipNode): Promise<HubResult<void>> {
    const multiaddrs = peerNode.multiaddrs;
    if (!multiaddrs) {
      return err(new HubError('unavailable', { message: 'no peer id' }));
    }

    for (const addr of multiaddrs) {
      const result = await this.connectAddress(addr);
      // Short-circuit and return if we connect to at least one address
      if (result.isOk()) return ok(undefined);
      log.error(result.error, 'Failed to connect to addr');
    }

    return err(new HubError('unavailable', { message: 'cannot connect to any peer' }));
  }

  /** Connect to a peer Gossip Node using a specific address */
  async connectAddress(address: Multiaddr): Promise<HubResult<void>> {
    log.debug({ identity: this.identity, address }, `Attempting to connect to address ${address}`);
    try {
      const conn = await this._node?.dial(address);
      if (conn) {
        log.info({ identity: this.identity, address }, `Connected to peer at address: ${address}`);
        return ok(undefined);
      }
    } catch (error: any) {
      log.error(error, `Failed to connect to peer at address: ${address}`);
      return err(new HubError('unavailable', error));
    }
    return err(new HubError('unavailable', { message: `cannot connect to peer: ${address}` }));
  }

  registerListeners() {
    this._node?.addEventListener('peer:connect', (event) => {
      log.info({ peer: event.detail.remotePeer }, `P2P Connection established`);
      this.emit('peerConnect', event.detail);
    });
    this._node?.addEventListener('peer:disconnect', (event) => {
      log.info({ peer: event.detail.remotePeer }, `P2P Connection disconnected`);
      this.emit('peerDisconnect', event.detail);
    });
    this.gossip?.addEventListener('message', (event) => {
      // ignore messages not in our topic lists (e.g. GossipSub peer discovery messages)
      if (GOSSIP_TOPICS.includes(event.detail.topic)) {
        this.emit('message', event.detail.topic, GossipNode.decodeMessage(event.detail.data));
      }
    });
  }

  registerDebugListeners() {
    this._node?.addEventListener('peer:discovery', (event) => {
      log.info({ identity: this.identity }, `Found peer: ${event.detail.multiaddrs}  }`);
    });
    this._node?.addEventListener('peer:connect', (event) => {
      log.info({ identity: this.identity }, `Connection established to: ${event.detail.remotePeer.toString()}`);
    });
    this._node?.addEventListener('peer:disconnect', (event) => {
      log.info({ identity: this.identity }, `Disconnected from: ${event.detail.remotePeer.toString()} `);
    });
    this.gossip?.addEventListener('message', (event) => {
      log.info({ identity: this.identity }, `Received message for topic: ${event.detail.topic}`);
    });
    this.gossip?.addEventListener('subscription-change', (event) => {
      log.info(
        { identity: this.identity },
        `Subscription change: ${event.detail.subscriptions.map((value) => {
          value.topic;
        })}`
      );
    });
  }

  //TODO: Needs better typesafety
  static encodeMessage(message: protobufs.GossipMessage): HubResult<Uint8Array> {
    return ok(protobufs.GossipMessage.encode(message).finish());
  }

  //TODO: Needs better typesafety
  static decodeMessage(message: Uint8Array): HubResult<protobufs.GossipMessage> {
    // Convert GossipMessage to Uint8Array or decode will return nested Uint8Arrays as Buffers
    return ok(protobufs.GossipMessage.decode(Uint8Array.from(message)));
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  /* Attempts to dial all the addresses in the bootstrap list */
  private async bootstrap(bootstrapAddrs: Multiaddr[]): Promise<HubResult<void>> {
    if (bootstrapAddrs.length == 0) return ok(undefined);
    const results = await Promise.all(bootstrapAddrs.map((addr) => this.connectAddress(addr)));

    const finalResults = Result.combineWithAllErrors(results) as Result<void[], HubError[]>;
    if (finalResults.isErr() && finalResults.error.length == bootstrapAddrs.length) {
      // only fail if all connections failed
      return err(new HubError('unavailable', 'could not connect to any bootstrap nodes'));
    }

    return ok(undefined);
  }

  /** Creates a Libp2p node with GossipSub */
  private async createNode(options: NodeOptions): Promise<HubResult<Libp2p>> {
    const listenIPMultiAddr = options.ipMultiAddr ?? MultiaddrLocalHost;
    const listenPort = options.gossipPort ?? 0;
    const listenMultiAddrStr = `${listenIPMultiAddr}/tcp/${listenPort}`;

    let announceMultiAddrStrList: string[] = [];
    if (options.announceIp && options.gossipPort) {
      const announceMultiAddr = addressInfoFromParts(options.announceIp, options.gossipPort).map((addressInfo) =>
        ipMultiAddrStrFromAddressInfo(addressInfo)
      );
      if (announceMultiAddr.isOk() && announceMultiAddr.value.isOk()) {
        // If we have a valid announce IP, use it
        const announceIpMultiaddr = announceMultiAddr.value.value;
        announceMultiAddrStrList = [`${announceIpMultiaddr}/tcp/${options.gossipPort}`];
      }
    }

    const checkResult = checkNodeAddrs(listenIPMultiAddr, listenMultiAddrStr);
    if (checkResult.isErr()) return err(new HubError('unavailable', checkResult.error));

    const gossip = gossipsub({
      emitSelf: false,
      allowPublishToZeroPeers: true,
      globalSignaturePolicy: 'StrictSign',
    });

    if (options.allowedPeerIdStrs) {
      log.info(
        { identity: this.identity, function: 'createNode', allowedPeerIds: options.allowedPeerIdStrs },
        `!!! PEER-ID RESTRICTIONS ENABLED !!!`
      );
    }
    const connectionGater = new ConnectionFilter(options.allowedPeerIdStrs);

    return ResultAsync.fromPromise(
      createLibp2p({
        // Only set optional fields if defined to avoid errors
        ...(options.peerId && { peerId: options.peerId }),
        connectionGater,
        addresses: {
          listen: [listenMultiAddrStr],
          announce: announceMultiAddrStrList,
        },
        transports: [tcp()],
        streamMuxers: [mplex()],
        connectionEncryption: [noise()],
        pubsub: gossip,
        peerDiscovery: [pubsubPeerDiscovery()],
      }),
      (e) => new HubError('unavailable', { message: 'failed to create libp2p node', cause: e as Error })
    );
  }
}
