import { Cast, Root, SignedCastChain, SignedCastChainFragment, SignedMessage } from '~/types';
import Engine from '~/engine';

/** The Node brokers messages to clients and peers and passes new messages into the Engine for resolution  */
class FCNode {
  public static instanceNames = ['Cook', 'Friar', 'Knight', 'Miller', 'Squire'] as const;

  name: InstanceName;
  peers?: NodeList;
  engine: Engine;

  constructor(name: InstanceName) {
    this.name = name;
    console.log(`${this.name} is starting`);
    this.engine = new Engine();
  }

  setPeers(peers: NodeList): void {
    const registryCopy = new Map(peers);
    registryCopy.delete(this.name);
    this.peers = registryCopy;
  }

  ping(name: InstanceName): void {
    if (!this.peers) {
      console.log('No peers to ping');
      return;
    }

    console.log(this.name + ' pings ' + name);
    const targetNode = this.peers.get(name);
    targetNode?.pong(this.name);
  }

  pingAll(): void {
    if (!this.peers) {
      console.log('No peers to ping');
      return;
    }

    this.peers.forEach((_peer, name) => {
      this.ping(name);
    });
  }

  pong(from: string): void {
    console.log(this.name + ' pongs ' + from);
  }

  /**
   * P2P API
   *
   * These API's are tailed to nodes, and should not be called by clients because they can
   * introduce unnecessary conflict states or errors which may adversely affect the client's
   * trustworthiness on the network.
   */

  /** TODO: Get the latest chain information for the current user, to allow syncing */

  /** Get a chain for the current user (default latest, accepts params for earlier blocks) */
  getChain(username: string): SignedCastChain | undefined {
    return this.engine.getLastChain(username);
  }

  /**
   * Client API
   *
   * These API's are more tailored to clients and have stricter validations, which other nodes
   * should not call, because it may cause network state to diverge.
   */

  /** Start a new chain for the user */
  addRoot(root: Root): void {
    this.engine.addRoot(root);
  }

  /** Merge a single message into the latest chain */
  addCast(Cast: Cast): void {
    this.engine.addCast(Cast);
  }

  /** Merge a partial chain into the latest chain */
  addChain(messages: SignedCastChainFragment): void {
    for (const cast of messages) {
      this.engine.addCast(cast);
    }
  }

  /** Get the latest messgage for a user */
  getLastMessage(username: string): SignedMessage | undefined {
    return this.engine.getLastMessage(username);
  }
}

type NodeList = Map<InstanceName, FCNode>;
export type InstanceName = typeof FCNode.instanceNames[number];

export default FCNode;
