import { Cast, Root, Message, RootMessageBody } from '~/types';
import Engine from '~/engine';
import { Result } from 'neverthrow';

/** The Node brokers messages to clients and peers and passes new messages into the Engine for resolution  */
class FCNode {
  public static instanceNames = ['Cook', 'Friar', 'Knight', 'Miller', 'Squire'] as const;
  // TODO: Replace with usernames fetched from the on-chain Registry.
  public static usernames = ['alice'];

  name: InstanceName;
  peers?: NodeList;
  engine: Engine;

  constructor(name: InstanceName) {
    this.name = name;
    this.engine = new Engine();
  }

  setPeers(peers: NodeList): void {
    this.peers = new Map(peers);
    this.peers.delete(this.name); // remove self from list of peers
  }

  /** Sync messages with all peers at a random interval between 5 and 30 seconds */
  async sync(): Promise<void> {
    setInterval(() => {
      this.peers?.forEach((peer) => {
        FCNode.usernames.forEach((username) => {
          this.syncUserWithPeer(username, peer);
        });
      });
      console.log(`${this.name}: syncing with peers `);
    }, Math.floor(Math.random() * 25_000) + 5_000);
  }

  /** Sync messages for a specific user with a specific peer */
  syncUserWithPeer(username: string, peer: FCNode): void {
    const selfRoot = this.getRoot(username);
    const peerRoot = peer.getRoot(username);
    if (peerRoot) {
      // 1. Compare roots and add the peer's root if newer.
      if (!selfRoot || selfRoot.data.rootBlock <= peerRoot.data.rootBlock) {
        this.addRoot(peerRoot);
      }

      // 2. Compare CastAdd messages and ingest new ones.
      const selfCastAddHashes = this.getCastAddsHashes(username);
      const peerCastAddHashes = peer.getCastAddsHashes(username);
      const missingCastAddsHashes = peerCastAddHashes.filter((h) => !selfCastAddHashes.includes(h));
      peer.getCasts(username, missingCastAddsHashes).map((message) => this.addCast(message));

      // 3. Compare CastDelete messages and ingest new ones.
      const selfCastDeleteHashes = this.getCastDeletesHashes(username);
      const peerCastDeleteHashes = peer.getCastDeletesHashes(username);
      const missingCastDeleteHashes = peerCastDeleteHashes.filter((h) => !selfCastDeleteHashes.includes(h));
      peer.getCasts(username, missingCastDeleteHashes).map((message) => this.addCast(message));
    }
  }

  /**
   * P2P API's
   *
   * These API's should be called by peer nodes during the sync process. They should never be called
   * by clients, because they are less strict and this may cause more conflicts.
   */

  /** Get the Root Message for a username */
  getRoot(username: string): Message<RootMessageBody> | undefined {
    return this.engine.getRoot(username);
  }

  /** Get casts by hash, or corresponding delete message */
  getCasts(username: string, hashes: string[]): Message<any>[] {
    const messages = [];

    for (const hash of hashes) {
      const message = this.engine.getCast(username, hash);
      if (message) {
        messages.push(message);
      }
    }

    return messages;
  }

  getCastAdds(username: string): Cast[] {
    return this.engine.getCastAdds(username);
  }

  getCastDeletes(username: string): Cast[] {
    return this.engine.getCastAdds(username);
  }

  getCastAddsHashes(username: string): string[] {
    return this.engine.getCastAddsHashes(username);
  }

  getCastDeletesHashes(username: string): string[] {
    return this.engine.getCastDeletesHashes(username);
  }

  /**
   * Client API
   *
   * These API's should be called by clients to interact with the node. They should never be called
   * by peers, because they are less strict and this may cause divergent network states.
   */

  addRoot(root: Root): Result<void, string> {
    return this.engine.addRoot(root);
  }

  addCast(Cast: Cast): Result<void, string> {
    return this.engine.addCast(Cast);
  }
}

export type NodeList = Map<InstanceName, FCNode>;
export type InstanceName = typeof FCNode.instanceNames[number];

export default FCNode;
