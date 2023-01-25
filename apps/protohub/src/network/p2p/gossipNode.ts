import { GossipSub } from '@chainsafe/libp2p-gossipsub';
import { Noise } from '@chainsafe/libp2p-noise';
import * as protobufs from '@farcaster/protobufs';
import { HubError, HubResult } from '@farcaster/protoutils';
import { Connection } from '@libp2p/interface-connection';
import { PeerId } from '@libp2p/interface-peer-id';
import { Mplex } from '@libp2p/mplex';
import { PubSubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { TCP } from '@libp2p/tcp';
import { Multiaddr } from '@multiformats/multiaddr';
import { createLibp2p, Libp2p } from 'libp2p';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import { TypedEmitter } from 'tiny-typed-emitter';
import { ConnectionFilter } from '~/network/p2p/connectionFilter';
import { GOSSIP_TOPICS, NETWORK_TOPIC_PRIMARY } from '~/network/p2p/protocol';
import { logger } from '~/utils/logger';
import { addressInfoFromParts, checkNodeAddrs, ipMultiAddrStrFromAddressInfo } from '~/utils/p2p';

const MultiaddrLocalHost = '/ip4/127.0.0.1';

const log = logger.child({ component: 'Node' });

interface NodeEvents {
  /**
   * Triggered when a new message is received. Provides the topic the message was received on
   * as well as the result of decoding the message
   */
  message: (topic: string, message: HubResult<protobufs.GossipMessage>) => void;
  /** Triggered when a peer is connected. Provides the Libp2p Connection object. */
  peerConnect: (connection: Connection) => void;
  /** Triggered when a peer is disconnected. Provides the Libp2p Connecion object. */
  peerDisconnect: (connection: Connection) => void;
}

/** Node create options */
interface NodeOptions {
  /** PeerId to use as the Node's Identity. Generates a new ephemeral PeerId if not specified*/
  peerId?: PeerId | undefined;
  /** IP address in MultiAddr format to bind to */
  ipMultiAddr?: string | undefined;
  /** External Ip address to announce */
  announceIp?: string | undefined;
  /** Port to listen for gossip. Picks a port at random if not specified. This is combined with the IPMultiAddr */
  gossipPort?: number | undefined;
  /** A list of addresses to peer with. PeersIds outside of this list will not be able to connect to this node */
  allowedPeerIdStrs?: string[] | undefined;
}

/**
 * A representation of a libp2p network node.
 *
 * Nodes participate in the p2p GossipSub network we create using libp2p.
 */
export class GossipNode extends TypedEmitter<NodeEvents> {
  private _node?: Libp2p;

  /**
   * Returns the PublicKey of the node
   */
  get peerId() {
    return this._node?.peerId;
  }

  /**
   * Returns all known addresses of the node
   *
   * This contains local addresses as well and will need to be
   * checked for reachability prior to establishing connections
   */
  get multiaddrs() {
    return this._node?.getMultiaddrs();
  }

  get addressBook() {
    return this._node?.peerStore.addressBook;
  }

  async getPeerInfo(peerId: PeerId) {
    const existingConnections = this._node?.connectionManager.getConnections(peerId);
    for (const conn of existingConnections ?? []) {
      const knownAddrs = await this._node?.peerStore.addressBook.get(peerId);
      if (knownAddrs && !knownAddrs.find((addr) => addr.multiaddr.equals(conn.remoteAddr))) {
        // updates the peer store
        await this._node?.peerStore.addressBook.add(peerId, [conn.remoteAddr]);
      }
    }
    return await this._node?.peerStore.get(peerId);
  }

  /**
   * Returns a the GossipSub implementation used by the Node
   */
  get gossip() {
    const pubsub = this._node?.pubsub;
    return pubsub ? (pubsub as GossipSub) : undefined;
  }

  /**
   * Creates and Starts the underlying libp2p node. Nodes must be started prior to any network configuration or communication.
   *
   * @param bootstrapAddrs  A list of addresses to bootstrap from. Attempts to connect with each peer in the list
   * @param startOptions    Options to configure the node's behavior
   */
  async start(bootstrapAddrs: Multiaddr[], startOptions?: NodeOptions): Promise<HubResult<void>> {
    const createResult = await this.createNode(startOptions ?? {});
    if (createResult.isErr()) return err(createResult.error);

    this._node = createResult.value;
    this.registerListeners();

    this.registerDebugListeners();

    await this._node.start();
    log.info(
      { identity: this.identity, addresses: this._node.getMultiaddrs().map((a) => a.toString()) },
      'Starting libp2p'
    );

    return this.bootstrap(bootstrapAddrs);
  }

  isStarted() {
    return this._node?.isStarted();
  }

  /**
   * Stops the node's participation on the libp2p network and tears down pubsub
   */
  async stop() {
    await this._node?.stop();
    log.info({ identity: this.identity }, 'Stopped libp2p...');
  }

  get identity() {
    return this.peerId?.toString();
  }

  /**
   * Publishes a message to the GossipSub network
   * @message The GossipMessage to publish to the network
   */
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

  /**
   * Gossip out a Message to the network
   */
  async gossipMessage(message: protobufs.Message) {
    const gossipMessage = protobufs.GossipMessage.create({
      message,
      topics: [NETWORK_TOPIC_PRIMARY],
      peerId: this.peerId?.toBytes() ?? new Uint8Array(),
    });
    await this.publish(gossipMessage);
  }

  /** Gossip out our contact info to the network */
  async gossipContactInfo(contactInfo: protobufs.ContactInfoContent) {
    const gossipMessage = protobufs.GossipMessage.create({
      contactInfoContent: contactInfo,
      topics: [NETWORK_TOPIC_PRIMARY],
      peerId: this.peerId?.toBytes() ?? new Uint8Array(),
    });
    await this.publish(gossipMessage);
  }

  /**
   * Connect with a peer Node
   *
   * @param node The peer Node to attempt a connection with
   */
  async connect(node: GossipNode): Promise<HubResult<void>> {
    const multiaddrs = node.multiaddrs;
    if (multiaddrs) {
      // how to select an addr here?
      for (const addr of multiaddrs) {
        try {
          const result = await this.connectAddress(addr);
          // bail after the first successful connection
          if (result.isOk()) return ok(undefined);
        } catch (error: any) {
          log.error(error, 'Failed to connect to addr');
          continue;
        }
      }
    } else {
      return err(new HubError('unavailable', { message: 'no peer id' }));
    }
    return err(new HubError('unavailable', { message: 'cannot connect to any peer' }));
  }

  /**
   * Connect with a peer's NodeAddress
   *
   * @param address The NodeAddress to attempt a connection with
   */
  async connectAddress(address: Multiaddr): Promise<HubResult<void>> {
    log.debug({ identity: this.identity, address }, `Attempting to connect to address ${address}`);
    try {
      const result = await this._node?.dial(address);
      if (result) {
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
    this._node?.connectionManager.addEventListener('peer:connect', (event) => {
      this.emit('peerConnect', event.detail);
    });
    this._node?.connectionManager.addEventListener('peer:disconnect', (event) => {
      this.emit('peerDisconnect', event.detail);
    });
    this.gossip?.addEventListener('message', (event) => {
      // ignore messages that aren't in our list of topics (ignores gossipsub peer discovery messages)
      if (GOSSIP_TOPICS.includes(event.detail.topic)) {
        this.emit('message', event.detail.topic, GossipNode.decodeMessage(event.detail.data));
      }
    });
  }

  registerDebugListeners() {
    // Debug
    this._node?.addEventListener('peer:discovery', (event) => {
      log.info({ identity: this.identity }, `Found peer: ${event.detail.multiaddrs}  }`);
    });
    this._node?.connectionManager.addEventListener('peer:connect', (event) => {
      log.info({ identity: this.identity }, `Connection established to: ${event.detail.remotePeer.toString()}`);
    });
    this._node?.connectionManager.addEventListener('peer:disconnect', (event) => {
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

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  //TODO: Needs better typesafety
  static encodeMessage(message: protobufs.GossipMessage): HubResult<Uint8Array> {
    // Serialize the message
    return ok(protobufs.GossipMessage.encode(message).finish());
  }

  //TODO: Needs better typesafety
  static decodeMessage(message: Uint8Array): HubResult<protobufs.GossipMessage> {
    // Deserialize the message
    return ok(protobufs.GossipMessage.decode(message));
  }

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

  /**
   * Creates a Libp2p node with GossipSub
   */
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

    const gossip = new GossipSub({
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
        // setting these optional fields to `undefined` throws an error, only set them if they're defined
        ...(options.peerId && { peerId: options.peerId }),
        connectionGater,
        addresses: {
          listen: [listenMultiAddrStr],
          announce: announceMultiAddrStrList,
        },
        transports: [new TCP()],
        streamMuxers: [new Mplex()],
        connectionEncryption: [new Noise()],
        pubsub: gossip,
        peerDiscovery: [new PubSubPeerDiscovery()],
      }),
      (e) => new HubError('unavailable', { message: 'failed to create libp2p node', cause: e as Error })
    );
  }
}
