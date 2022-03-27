import { Cast, Root, SignedCastChain, SignedCastChainFragment, SignedMessage } from '~/types';
import Engine, { ChainFingerprint } from '~/engine';
import { isCast, isRoot } from '~/types/typeguards';
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

  /** Sync chains with all peers at a random interval between 5 and 30 seconds */
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

  /** Sync chains for a specific user with a specific peer */
  syncUserWithPeer(username: string, peer: FCNode): void {
    const prints = this.getChainFingerPrints(username) || [];
    const peerPrints = peer.getChainFingerPrints(username) || [];

    for (const peerPrint of peerPrints) {
      const matchingPrint = prints.find((print) => print.rootBlockNum === peerPrint.rootBlockNum);

      if (!matchingPrint) {
        const newChain = peer.getChainFragment('alice', peerPrint.rootBlockNum, 0, peerPrint.lastMessageIndex || 0);
        if (newChain) {
          this.addChain(newChain);
        }
      } else if (matchingPrint) {
        // TODO: We ignore all lower indices, but these should be checked for conflicts.
        const lastKnownIdx = matchingPrint.lastMessageIndex || 0;
        const lastFoundIdx = peerPrint.lastMessageIndex || 0;
        if (lastKnownIdx < lastFoundIdx) {
          const newFrag = peer.getChainFragment('alice', peerPrint.rootBlockNum, lastKnownIdx, lastFoundIdx);

          if (newFrag) {
            this.addChain(newFrag);
          }
        }
      }
    }
  }

  /**
   * P2P API's
   *
   * These API's should be called by peer nodes during the sync process. They should never be called
   * by clients, because they are less strict and this may cause more conflicts.
   */

  /** Get a chain for the current user (default latest, accepts params for earlier blocks) */
  getChain(username: string): SignedCastChain | undefined {
    return this.engine.getLastChain(username);
  }

  getChainFragment(
    username: string,
    rootBlock: number,
    start: number,
    end: number
  ): SignedCastChain | SignedCastChainFragment | undefined {
    const chain = this.engine.getChain(username, rootBlock);
    if (!chain) {
      return;
    } else {
      // TODO: Inspect the typing here...
      if (start === 0) {
        return chain.slice(start, end + 1) as SignedCastChain;
      } else {
        return chain.slice(start, end + 1) as SignedCastChainFragment;
      }
    }
  }

  /** Get the latest chain information for the current user, to allow syncing */
  getChainFingerPrints(username: string): ChainFingerprint[] | undefined {
    return this.engine.getChainFingerprints(username);
  }

  /**
   * Client API
   *
   * These API's should be called by clients to interact with the node. They should never be called
   * by peers, because they are less strict and this may cause divergent network states.
   */

  /** Start a new chain for the user */
  addRoot(root: Root): Result<void, string> {
    return this.engine.addRoot(root);
  }

  /** Merge a single message into the latest chain */
  addCast(Cast: Cast): Result<void, string> {
    return this.engine.addCast(Cast);
  }

  /** Merge a partial chain into the latest chain */
  addChain(messages: SignedCastChain | SignedCastChainFragment): void {
    for (const msg of messages) {
      if (isRoot(msg)) {
        this.addRoot(msg);
      } else if (isCast(msg)) {
        this.addCast(msg);
      }
    }
  }

  /** Get the latest messgage for a user */
  getLastMessage(username: string): SignedMessage | undefined {
    return this.engine.getLastMessage(username);
  }
}

export type NodeList = Map<InstanceName, FCNode>;
export type InstanceName = typeof FCNode.instanceNames[number];

export default FCNode;
