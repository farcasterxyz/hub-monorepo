import { createLibp2p, Libp2p } from 'libp2p';
import { exit } from 'process';
import { Factories } from '~/factories';
import { GossipSub } from '@chainsafe/libp2p-gossipsub';
import { Mplex } from '@libp2p/mplex';
import { Noise } from '@chainsafe/libp2p-noise';
import { TCP } from '@libp2p/tcp';
import { encodeMessage, GossipMessage, UserContent } from '~/network/protocol';
import { sleep } from '~/utils';

// import Bootstrap from 'libp2p-bootstrap';

/**
 * A representation of a Libp2p network entity or node.
 *
 * Nodes participate in the p2p gossip network we create using libp2p.
 */
export class Node {
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
    return this._node?.pubsub as GossipSub;
  }

  /**
   * Starts the node. Nodes must be started prior to any network configuration or communication.
   */
  async start() {
    this._node = await createNode();
  }

  /**
   * Connect with a peer Node
   *
   * @param node The peer Node to attempt a connection with
   */
  async connect(node: Node) {
    const multiaddr = node.multiaddrs;
    if (multiaddr) {
      // how to select an addr here?
      await this._node?.dial(multiaddr[0]);
    } else {
      console.log('Connection failure: No peerId');
    }
  }

  /**
   * Stops the node's participation on the libp2p network and tears down pubsub
   */
  async stop() {
    await this._node?.stop();
    await this.gossip.stop();
    console.log(this.peerId + ': stopped...');
  }

  async publish(message: GossipMessage) {
    const topics = message.topics;
    console.log(this.peerId?.toString(), ': Publishing message to topics: ', topics);
    const results = await Promise.all(
      Array.from(topics, (topic) => this.gossip.publish(topic, encodeMessage(message)))
    );
    console.log(this.peerId?.toString(), ': Published to ' + results.length + ' peers');
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
    this._node?.pubsub.addEventListener('message', (event) => {
      console.log(this.peerId?.toString(), ': Received message for topic:', event.detail.topic);
    });
    this._node?.pubsub.addEventListener('subscription-change', (event) => {
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

const createNode = async () => {
  // let bootstrap = new Bootstrap({
  //     interval: 2000,
  //     list: []
  //     // list: ['/ip4/127.0.0.1/tcp/8080']
  // })

  const gossip = new GossipSub({
    emitSelf: false,
  });

  const node = await createLibp2p({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/0'],
    },
    transports: [new TCP()],
    streamMuxers: [new Mplex()],
    connectionEncryption: [new Noise()],
    // peerDiscovery: [bootstrap],
    pubsub: gossip,
  });

  await node.start();
  await gossip.start();
  console.log('LibP2P started...' + node.getMultiaddrs());
  if (!gossip.isStarted()) {
    console.log('Gossip still not started...');
  }

  return node;
};

/**
 * A simple test that sets up a network and sends a message.
 *
 * TODO Needs to be moved out of here and converted to an actual test that verfies that messages were indeed received.
 */
export const simpleConnect = async () => {
  const NODES = 10;

  const nodes = Array.from(new Array(NODES), (_) => new Node());

  await Promise.all(
    Array.from(nodes, async (node) => {
      await node.start();
      node.registerDebugListeners();
    })
  );

  // await Promise.all(Array.from(nodes.map((node, i, nodes) => {
  //   // connect to the next node
  //   if (i + 1 < nodes.length) {
  //     return node.connect(nodes[i + 1])
  //   }
  // })))

  // TODO this is more concise but is it better than ^ ?
  await Promise.all(Array.from(nodes.slice(1), (node) => node.connect(nodes[0])));
  await Promise.all(Array.from(nodes, (node) => node.gossip?.subscribe('SomeTopic')));

  // Allow a few ticks to establish the network
  await sleep(5_000);
  console.log("Node 1's Peers after 5 seconds - " + nodes[0].gossip?.getPeers());

  nodes.map((node) => {
    if (!node.gossip?.isStarted() || node.gossip?.peers.size == 0) {
      console.log(node.peerId + ": Doesn't have gossip ready");
    }
  });

  // Todo move to factory
  const message: GossipMessage<UserContent> = {
    content: {
      message: await Factories.CastShort.create(),
      root: '',
      count: 0,
    },
    topics: ['SomeTopic'],
  };

  await nodes[0].publish(message);
  await sleep(5_000);

  // TODO test to see that everyone received and decoded the same message

  await Promise.all(Array.from(nodes, (node) => node.stop()));
  exit(0);
};
