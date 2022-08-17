import { Cast, Reaction, SignerMessage, Verification } from '~/types';
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
    // 1. Compare hashes of casts and merge any new ones discovered.
    const selfCastHashes = this.getAllCastHashes(username);
    const peerCastHashes = peer.getAllCastHashes(username);
    const missingCastHashes = peerCastHashes.filter((h) => !selfCastHashes.includes(h));
    peer.getCasts(username, missingCastHashes).map((message) => this.mergeCast(message));

    // 2. Compare hashes of reactions and merge any new ones discovered.
    const selfReactionHashes = this.getAllReactionHashes(username);
    const peerReactionHashes = peer.getAllReactionHashes(username);
    const missingReactionHashes = peerReactionHashes.filter((h) => !selfReactionHashes.includes(h));
    peer.getReactions(username, missingReactionHashes).map((reaction) => this.mergeReaction(reaction));

    // TODO: support verifications and signers
  }

  /**
   * P2P API's
   *
   * These API's should be called by peer nodes during the sync process. They should never be called
   * by clients, because they are less strict and this may cause more conflicts.
   */

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

  // TODO: add verifications and signers methods

  /**
   * Client API
   *
   * These API's should be called by clients to interact with the node. They should never be called
   * by peers, because they are less strict and this may cause divergent network states.
   */

  async mergeCast(cast: Cast): Promise<Result<void, string>> {
    return await this.engine.mergeCast(cast);
  }

  async mergeReaction(reaction: Reaction): Promise<Result<void, string>> {
    return await this.engine.mergeReaction(reaction);
  }

  async mergeVerification(verification: Verification): Promise<Result<void, string>> {
    return await this.engine.mergeVerification(verification);
  }

  async mergeSignerMessage(signerMessage: SignerMessage): Promise<Result<void, string>> {
    return await this.engine.mergeSignerMessage(signerMessage);
  }
}

export type NodeDirectory = Map<InstanceName, FCNode>;
export type InstanceName = typeof FCNode.instanceNames[number];

export default FCNode;
