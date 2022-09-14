import { Bootstrap } from '@libp2p/bootstrap';
import { Connection } from '@libp2p/interface-connection';
import { createLibp2p, Libp2p } from 'libp2p';
import { decodeMessage, encodeMessage, GossipMessage } from '~/network/protocol';
import { err, ok, Result } from 'neverthrow';
import { GossipSub } from '@chainsafe/libp2p-gossipsub';
import { Mplex } from '@libp2p/mplex';
import { Multiaddr, NodeAddress } from '@multiformats/multiaddr';
import { Noise } from '@chainsafe/libp2p-noise';
import { TCP } from '@libp2p/tcp';
import { TypedEmitter } from 'tiny-typed-emitter';

const MultiaddrLocalHost = '/ip4/127.0.0.1/tcp/0';

interface NodeEvents {
  /**
   * Triggered when a new message. Provides the topic the message was received on
   * as well as the result of decoding the message
   */
  message: (topic: string, message: Result<GossipMessage, string>) => void;
  /** Triggered when a peer is connected. Provides the Libp2p Connection object. */
  peer_connect: (connection: Connection) => void;
  /** Triggered when a peer is disconnected. Provides the Libp2p Connecion object. */
  peer_disconnect: (connection: Connection) => void;
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
  async start() {
    this._node = await createNode();
    this.registerListeners();

    await this._node.start();
    console.log('LibP2P started...' + this._node.getMultiaddrs());
  }

  /**
   * Stops the node's participation on the libp2p network and tears down pubsub
   */
  async stop() {
    await this._node?.stop();
    console.log(this.peerId + ': stopped...');
  }

  /**
   * Publishes a message to the GossipSub network
   * @message The GossipMessage to publish to the network
   */
  async publish(message: GossipMessage) {
    const topics = message.topics;
    console.log(this.peerId?.toString(), ': Publishing message to topics: ', topics);
    const results = await Promise.all(topics.map((topic) => this.gossip?.publish(topic, encodeMessage(message))));
    console.log(this.peerId?.toString(), ': Published to ' + results.length + ' peers');
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

  registerListeners() {
    this._node?.connectionManager.addEventListener('peer:connect', (event) => {
      this.emit('peer_connect', event.detail);
    });
    this._node?.connectionManager.addEventListener('peer:disconnect', (event) => {
      this.emit('peer_disconnect', event.detail);
    });
    this.gossip?.addEventListener('message', (event) => {
      this.emit('message', event.detail.topic, decodeMessage(event.detail.data));
    });
  }

  // move this to a test
  registerDebugListeners() {
    // Debug
    this._node?.addEventListener('peer:discovery', (event) => {
      console.log(this.peerId?.toString(), ': Found peer: ', event.detail.toString());
    });
    this._node?.connectionManager.addEventListener('peer:connect', (event) => {
      console.log(this.peerId?.toString(), ': Connection established to:', event.detail.remotePeer.toString());
    });
    this._node?.connectionManager.addEventListener('peer:disconnect', (event) => {
      console.log(this.peerId?.toString(), ': Disconnected from to:', event.detail.remotePeer.toString());
    });
    this.gossip?.addEventListener('message', (event) => {
      console.log(this.peerId?.toString(), ': Received message for topic:', event.detail.topic);
    });
    this.gossip?.addEventListener('subscription-change', (event) => {
      console.log(
        this.peerId?.toString(),
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
const createNode = async (bootstrapAddrs: NodeAddress[] | undefined = undefined) => {
  let bootstrap;
  if (bootstrapAddrs) {
    bootstrap = new Bootstrap({
      interval: 1000,
      list: bootstrapAddrs.map((n) => Multiaddr.fromNodeAddress(n, 'tcp')).map((m) => m.toString()),
    });
  }

  const gossip = new GossipSub({
    emitSelf: false,
  });

  const node = await createLibp2p({
    addresses: {
      listen: [MultiaddrLocalHost],
    },
    transports: [new TCP()],
    streamMuxers: [new Mplex()],
    connectionEncryption: [new Noise()],
    peerDiscovery: bootstrap ? [bootstrap] : undefined,
    pubsub: gossip,
  });
  return node;
};
