import { GossipSub } from '@chainsafe/libp2p-gossipsub';
import { Noise } from '@chainsafe/libp2p-noise';
import { Connection } from '@libp2p/interface-connection';
import { PeerId } from '@libp2p/interface-peer-id';
import { Mplex } from '@libp2p/mplex';
import { PubSubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { TCP } from '@libp2p/tcp';
import { multiaddr, Multiaddr } from '@multiformats/multiaddr';
import { createLibp2p, Libp2p } from 'libp2p';
import { err, ok, Result } from 'neverthrow';
import { TypedEmitter } from 'tiny-typed-emitter';
import { FarcasterError, ServerError } from '~/utils/errors';
import { decodeMessage, encodeMessage, GossipMessage, GOSSIP_TOPICS } from '~/network/p2p/protocol';
import { ConnectionFilter } from './connectionFilter';
import { logger } from '~/utils/logger';

const MultiaddrLocalHost = '/ip4/127.0.0.1';

const log = logger.child({ component: 'Node' });

interface NodeEvents {
  /**
   * Triggered when a new message is received. Provides the topic the message was received on
   * as well as the result of decoding the message
   */
  message: (topic: string, message: Result<GossipMessage, string>) => void;
  /** Triggered when a peer is connected. Provides the Libp2p Connection object. */
  peerConnect: (connection: Connection) => void;
  /** Triggered when a peer is disconnected. Provides the Libp2p Connecion object. */
  peerDisconnect: (connection: Connection) => void;
}

/** Node create options */
interface StartOptions {
  /** PeerId to use as the Node's Identity. Generates a new ephemeral PeerId if not specified*/
  peerId?: PeerId | undefined;
  /** IP address in MultiAddr format to bind to */
  IPMultiAddr?: string | undefined;
  /** Port to bind to. Picks a port at random if not specified. This is combined with the IPMultiAddr */
  port?: number | undefined;
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

  async getPeerAddress(peerId: PeerId) {
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
  async start(bootstrapAddrs: Multiaddr[], startOptions?: StartOptions) {
    this._node = await this.createNode(startOptions ?? {});
    this.registerListeners();

    await this._node.start();
    log.info(
      { identity: this.identity, addresses: this._node.getMultiaddrs().map((a) => a.toString()) },
      'Starting libp2p'
    );
    log.info('listening on addresses:');
    this._node.getMultiaddrs().forEach((addr) => {
      log.info(addr.toString());
    });

    await this.bootstrap(bootstrapAddrs);
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
        log.debug({ identity: this.identity }, 'Published to ' + results.length + ' peers');
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
  async connect(node: Node): Promise<Result<void, FarcasterError>> {
    const multiaddrs = node.multiaddrs;
    if (multiaddrs) {
      // how to select an addr here?
      for (const addr of multiaddrs) {
        try {
          const result = await this._node?.dial(addr);
          // bail after the first successful connection
          if (result) return ok(undefined);
        } catch (error: any) {
          log.error(error, 'Failed to connect to addr');
          continue;
        }
      }
    } else {
      return err(new ServerError('Connection failure: No peerId'));
    }
    return err(new ServerError('Connection failure: Unable to connect to any peer address'));
  }

  /**
   * Connect with a peer's NodeAddress
   *
   * @param address The NodeAddress to attempt a connection with
   */
  async connectAddress(address: Multiaddr): Promise<Result<void, FarcasterError>> {
    log.debug({ identity: this.identity, address }, `Attempting to connect to address ${address}`);
    try {
      const result = await this._node?.dial(address);
      if (result) {
        log.info({ identity: this.identity, address }, `Connected to peer at address: ${address}`);
        return ok(undefined);
      }
    } catch (error: any) {
      log.error(error, `Failed to connect to peer at address: ${address}`);
      return err(new ServerError(error));
    }
    return err(new ServerError('Connection failure: Unable to connect to the given peer address'));
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
      log.debug({ identity: this.identity }, `Found peer: ${event.detail.multiaddrs}`);
    });
    this._node?.connectionManager.addEventListener('peer:connect', (event) => {
      log.debug({ identity: this.identity }, `Connection established to: ${event.detail.remotePeer.toString()}`);
    });
    this._node?.connectionManager.addEventListener('peer:disconnect', (event) => {
      log.debug({ identity: this.identity }, `Disconnected from: ${event.detail.remotePeer.toString()}`);
    });
    this.gossip?.addEventListener('message', (event) => {
      log.debug({ identity: this.identity }, `Received message for topic: ${event.detail.topic}`);
    });
    this.gossip?.addEventListener('subscription-change', (event) => {
      log.debug(
        { identity: this.identity },
        `Subscription change: ${event.detail.subscriptions.map((value) => {
          value.topic;
        })}`
      );
    });
  }

  /** Parses an address to verify it is actually a valid MultiAddr */
  private parseAddress(multiaddrStr: string): Result<Multiaddr, FarcasterError> {
    try {
      return ok(multiaddr(multiaddrStr));
    } catch (error: any) {
      return err(new ServerError('Invalid MultiAddr: ' + error.message));
    }
  }

  /** Checks that the IP address to bind to is valid and that the combined IP, transport, and port multiaddr is valid  */
  private checkAddrs(listenIPAddr: string, listenCombinedAddr: string) {
    // check that the provided IP addr is a valid multiaddr format
    let parsedAddr = this.parseAddress(listenIPAddr);
    parsedAddr.match(
      (addr) => {
        if (!addr) throw new Error('Invalid IP MultiAddr. Unable to create p2p Node');
        let options;
        try {
          options = addr.toOptions();
        } catch (error) {
          return;
          // intentional no-op since the IP MultiAddr is not expected to have port or transport information
        }
        if (options.port !== undefined || options.transport !== undefined)
          throw new ServerError('Invalid IP MultiAddr: unexpected transport/port information');
      },
      (error) => {
        throw error;
      }
    );

    // check that the combined address is actually valid
    parsedAddr = this.parseAddress(listenCombinedAddr);
    parsedAddr.match(
      (addr) => {
        if (!addr) throw new Error('Invalid Node MultiAddr. Unable to create p2p Node');
        const options = addr.toOptions();
        if (options.transport != 'tcp') throw new ServerError('Invalid Node MultiAddr: transport must be tcp');
      },
      (error) => {
        throw error;
      }
    );
  }

  /**
   * Creates a Libp2p node with GossipSub
   */
  private async createNode(options: StartOptions) {
    const listenIPMultiAddr = options.IPMultiAddr ?? MultiaddrLocalHost;
    const listenPort = options.port ?? 0;
    const listenMultiAddrStr = `${listenIPMultiAddr}/tcp/${listenPort}`;
    this.checkAddrs(listenIPMultiAddr, listenMultiAddrStr);

    const gossip = new GossipSub({
      emitSelf: false,
      allowPublishToZeroPeers: true,
      globalSignaturePolicy: 'StrictSign',
    });

    let connectionGater: ConnectionFilter | undefined;
    if (options.allowedPeerIdStrs) {
      log.info(
        { identity: this.identity, function: 'createNode', allowedPeerIds: options.allowedPeerIdStrs },
        `!!! PEER-ID RESTRICTIONS ENABLED !!!\nAllowed Peers: ${options.allowedPeerIdStrs}`
      );
      connectionGater = new ConnectionFilter(options.allowedPeerIdStrs);
    }

    const node = await createLibp2p({
      // setting these optional fields to `undefined` throws an error, only set them if they're defined
      ...(options.peerId && { peerId: options.peerId }),
      ...(connectionGater && { connectionGater }),
      addresses: {
        listen: [listenMultiAddrStr],
      },
      transports: [new TCP()],
      streamMuxers: [new Mplex()],
      connectionEncryption: [new Noise()],
      peerDiscovery: [new PubSubPeerDiscovery()],
      pubsub: gossip,
    });
    return node;
  }
}
