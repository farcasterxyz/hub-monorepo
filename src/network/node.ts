import { GossipSub } from '@chainsafe/libp2p-gossipsub';
import { Noise } from '@chainsafe/libp2p-noise';
import { Connection } from '@libp2p/interface-connection';
import { PeerId } from '@libp2p/interface-peer-id';
import { Mplex } from '@libp2p/mplex';
import { PubSubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { TCP } from '@libp2p/tcp';
import { Multiaddr } from '@multiformats/multiaddr';
import { createLibp2p, Libp2p } from 'libp2p';
import { err, ok, Result } from 'neverthrow';
import { TypedEmitter } from 'tiny-typed-emitter';
import { FarcasterError, ServerError } from '~/errors';
import { decodeMessage, encodeMessage, GossipMessage, GOSSIP_TOPICS } from '~/network/protocol';

const MultiaddrLocalHost = '/ip4/127.0.0.1/tcp/0';

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

/**
 * A representation of a Libp2p network node.
 *
 * Nodes participate in the p2p GossipSub network we create using Libp2p.
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
   */
  async start(bootstrapAddrs: Multiaddr[]) {
    this._node = await createNode();
    this.registerListeners();

    await this._node.start();
    console.log(this.identity, 'LibP2P started...');
    console.log('listening on addresses:');
    this._node.getMultiaddrs().forEach((addr) => {
      console.log(addr.toString());
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
      console.error(this.identity, 'Bootstrap Error: Failed to connect to any bootstrap address');
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
    console.log(this.identity + ': stopped...');
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
    console.log(this.identity, ': Publishing message to topics: ', topics);
    const encodedMessage = encodeMessage(message);
    encodedMessage.match(
      async (msg) => {
        const results = await Promise.all(topics.map((topic) => this.gossip?.publish(topic, msg)));
        console.log(this.identity, ': Published to ' + results.length + ' peers');
      },
      async (err) => {
        console.log(this.identity, err, '. Failed to publish message.');
      }
    );
  }

  /**
   * Connect with a peer Node
   *
   * @param node The peer Node to attempt a connection with
   */
  async connect(node: Node): Promise<Result<void, string>> {
    const multiaddrs = node.multiaddrs;
    if (multiaddrs) {
      // how to select an addr here?
      for (const addr of multiaddrs) {
        const result = await this._node?.dial(addr);
        // bail after the first successful connection
        if (result) return ok(undefined);
      }
    } else {
      return err('Connection failure: No peerId');
    }
    return err('Connection failure: Unable to connect to any peer address');
  }

  /**
   * Connect with a peer's NodeAddress
   *
   * @param address The NodeAddress to attempt a connection with
   */
  async connectAddress(address: Multiaddr): Promise<Result<void, FarcasterError>> {
    console.log(this.identity, 'Attempting to connect to address:', address);
    const result = await this._node?.dial(address);
    if (result) {
      console.log(this.identity, 'Connected to peer at address:', address);
      return ok(undefined);
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
      console.debug(this.identity, ': Found peer: ', event.detail.multiaddrs);
    });
    this._node?.connectionManager.addEventListener('peer:connect', (event) => {
      console.debug(this.identity, ': Connection established to:', event.detail.remotePeer.toString());
    });
    this._node?.connectionManager.addEventListener('peer:disconnect', (event) => {
      console.debug(this.identity, ': Disconnected from:', event.detail.remotePeer.toString());
    });
    this.gossip?.addEventListener('message', (event) => {
      console.debug(this.identity, ': Received message for topic:', event.detail.topic);
    });
    this.gossip?.addEventListener('subscription-change', (event) => {
      console.debug(
        this.identity,
        ': Subscription change:',
        event.detail.subscriptions.map((value) => {
          value.topic;
        })
      );
    });
  }
}

/**
 * Creates a Libp2p node with GossipSub
 *
 * @bootstrapAddrs: A list of NodeAddresses to use for bootstrapping over tcp
 */
const createNode = async () => {
  const gossip = new GossipSub({
    emitSelf: false,
    allowPublishToZeroPeers: true,
  });

  const node = await createLibp2p({
    addresses: {
      listen: [MultiaddrLocalHost],
    },
    transports: [new TCP()],
    streamMuxers: [new Mplex()],
    connectionEncryption: [new Noise()],
    peerDiscovery: [new PubSubPeerDiscovery()],
    pubsub: gossip,
  });
  return node;
};
