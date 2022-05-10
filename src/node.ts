import { Cast, Root, Reaction } from '~/types';
import Engine from '~/engine';
import { Result } from 'neverthrow';

/** The Node brokers messages to clients and peers and passes new messages into the Engine for resolution  */
class FCNode {
  public static instanceNames = ['Cook', 'Friar', 'Knight', 'Miller', 'Squire'] as const;
  // TODO: Replace with usernames fetched from the on-chain Registry.
  public static usernames = ['alice', 'bob'];

  name: InstanceName;
  peers?: NodeDirectory;
  engine: Engine;

  constructor(name: InstanceName) {
    this.name = name;
    this.engine = new Engine();
  }

  setPeers(peers: NodeDirectory): void {
    this.peers = new Map(peers);
    this.peers.delete(this.name); // remove self from list of peers
  }

  /** Sync messages with all peers */
  async sync(): Promise<void> {
    this.peers?.forEach((peer) => this.syncWithPeer(peer));
  }

  /** Sync messages with a specific peer */
  syncWithPeer(peer: FCNode): void {
    FCNode.usernames.forEach((username) => {
      this.syncUserWithPeer(username, peer);
    });
  }

  /** Sync messages for a specific user with a specific peer */
  syncUserWithPeer(username: string, peer: FCNode): void {
    const selfRoot = this.getRoot(username);
    const peerRoot = peer.getRoot(username);
    if (peerRoot) {
      // 1. Compare roots and add the peer's root if newer.
      if (!selfRoot || selfRoot.data.rootBlock <= peerRoot.data.rootBlock) {
        this.mergeRoot(peerRoot);
      }

      // 2. Compare hashes of casts and merge any new ones discovered.
      const selfCastHashes = this.getAllCastHashes(username);
      const peerCastHashes = peer.getAllCastHashes(username);
      const missingCastAddsHashes = peerCastHashes.filter((h) => !selfCastHashes.includes(h));
      peer.getCasts(username, missingCastAddsHashes).map((message) => this.mergeCast(message));

      // 3. Compare hashes of reactions and merge any new ones discovered.
      const selfReactionHashes = this.getAllReactionHashes(username);
      const peerReactionHashes = peer.getAllReactionHashes(username);
      const missingReactionHashes = peerReactionHashes.filter((h) => !selfReactionHashes.includes(h));
      peer.getReactions(username, missingReactionHashes).map((reaction) => this.mergeReaction(reaction));
    }
  }

  /**
   * P2P API's
   *
   * These API's should be called by peer nodes during the sync process. They should never be called
   * by clients, because they are less strict and this may cause more conflicts.
   */

  /** Get the Root Message for a username */
  getRoot(username: string): Root | undefined {
    return this.engine.getRoot(username);
  }

  /** Get casts by hash, or corresponding delete message */
  getCasts(username: string, hashes: string[]): Cast[] {
    const messages = [];

    for (const hash of hashes) {
      const message = this.engine.getCast(username, hash);
      if (message) {
        messages.push(message);
      }
    }

    return messages;
  }

  getCastHashes(username: string): string[] {
    return this.engine.getCastHashes(username);
  }

  getAllCastHashes(username: string): string[] {
    return this.engine.getAllCastHashes(username);
  }

  getReactions(username: string, hashes: string[]): Reaction[] {
    return hashes
      .map((hash) => this.engine.getReaction(username, hash))
      .filter((reaction): reaction is Reaction => !!reaction);
  }

  getReactionHashes(username: string): string[] {
    return this.engine.getReactionHashes(username);
  }

  getAllReactionHashes(username: string): string[] {
    return this.engine.getAllReactionHashes(username);
  }

  /**
   * Client API
   *
   * These API's should be called by clients to interact with the node. They should never be called
   * by peers, because they are less strict and this may cause divergent network states.
   */

  mergeRoot(root: Root): Result<void, string> {
    return this.engine.mergeRoot(root);
  }

  mergeCast(cast: Cast): Result<void, string> {
    return this.engine.mergeCast(cast);
  }

  mergeReaction(reaction: Reaction): Result<void, string> {
    return this.engine.mergeReaction(reaction);
  }
}

export type NodeDirectory = Map<InstanceName, FCNode>;
export type InstanceName = typeof FCNode.instanceNames[number];

export default FCNode;
