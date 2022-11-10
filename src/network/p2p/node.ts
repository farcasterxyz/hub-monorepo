import { GossipSub } from '@chainsafe/libp2p-gossipsub';
import { Noise } from '@chainsafe/libp2p-noise';
import { Connection } from '@libp2p/interface-connection';
import { PeerId } from '@libp2p/interface-peer-id';
import { Mplex } from '@libp2p/mplex';
import { TCP } from '@libp2p/tcp';
import { Multiaddr } from '@multiformats/multiaddr';
import { createLibp2p, Libp2p } from 'libp2p';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import { TypedEmitter } from 'tiny-typed-emitter';
import { ServerError } from '~/utils/errors';
import { HubError, HubResult } from '~/utils/hubErrors';
import { decodeMessage, encodeMessage, GossipMessage, GOSSIP_TOPICS } from '~/network/p2p/protocol';
import { ConnectionFilter } from './connectionFilter';
import { logger } from '~/utils/logger';
import { checkNodeAddrs } from '~/utils/p2p';
import { PubSubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';

const MultiaddrLocalHost = '/ip4/127.0.0.1';

const log = logger.child({ component: 'Node' });

interface NodeEvents {
  /**
   * Triggered when a new message is received. Provides the topic the message was received on
   * as well as the result of decoding the message
   */
  message: (topic: string, message: Result<GossipMessage, string> | HubResult<GossipMessage>) => void;
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
export class Node extends TypedEmitter<NodeEvents> {
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

    await this._node.start();
    log.info(
      { identity: this.identity, addresses: this._node.getMultiaddrs().map((a) => a.toString()) },
      'Starting libp2p'
    );

    await this.bootstrap(bootstrapAddrs);

    return ok(undefined);
  }

  /* Attempts to dial all the addresses in the bootstrap list */
  private async bootstrap(bootstrapAddrs: Multiaddr[]) {
    if (bootstrapAddrs.length == 0) return;
    const results = await Promise.all(bootstrapAddrs.map((addr) => this.connectAddress(addr)));
    let failures = 0;
    for (const result of results) {
      if (result.isOk()) continue;
      failures++;
    }
    if (failures == bootstrapAddrs.length) {
      throw new ServerError('Failed to connect to any bootstrap address');
    }
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
  async publish(message: GossipMessage) {
    const topics = message.topics;
    log.debug({ identity: this.identity }, `Publishing message to topics: ${topics}`);
    const encodedMessage = encodeMessage(message);
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
   * Connect with a peer Node
   *
   * @param node The peer Node to attempt a connection with
   */
  async connect(node: Node): Promise<HubResult<void>> {
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
      return err(new HubError('unavailable', { cause: error }));
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
        this.emit('message', event.detail.topic, decodeMessage(event.detail.data));
      }
    });
  }

  registerDebugListeners() {
    // Debug
    this._node?.addEventListener('peer:discovery', (event) => {
      log.info({ identity: this.identity }, `Found peer: ${event.detail.multiaddrs}`);
    });
    this._node?.connectionManager.addEventListener('peer:connect', (event) => {
      log.info({ identity: this.identity }, `Connection established to: ${event.detail.remotePeer.toString()}`);
    });
    this._node?.connectionManager.addEventListener('peer:disconnect', (event) => {
      log.info({ identity: this.identity }, `Disconnected from: ${event.detail.remotePeer.toString()}`);
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

  /**
   * Creates a Libp2p node with GossipSub
   */
  private async createNode(options: NodeOptions): Promise<HubResult<Libp2p>> {
    const listenIPMultiAddr = options.ipMultiAddr ?? MultiaddrLocalHost;
    const listenPort = options.gossipPort ?? 0;
    const listenMultiAddrStr = `${listenIPMultiAddr}/tcp/${listenPort}`;

    const checkResult = checkNodeAddrs(listenIPMultiAddr, listenMultiAddrStr);
    if (checkResult.isErr()) return err(new HubError('unavailable', { cause: checkResult.error }));

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
