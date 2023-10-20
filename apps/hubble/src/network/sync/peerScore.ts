import { logger } from "../../utils/logger.js";
import { statsd } from "../../utils/statsd.js";
import { MergeResult } from "./syncEngine.js";

const BAD_PEER_MESSAGE_THRESHOLD = 1000; // Number of messages we can't merge before we consider a peer "bad"
const BLOCKED_PEER_SCORE_THRESHOLD = -100; // A score below this threshold means a peer is blocked
const BAD_SYNC_WINDOW_THRESHOLD = 120000; // Number of milliseconds between expected sync intervals in the minimum case

const log = logger.child({
  component: "PeerScorer",
});

export class PeerScore {
  score: number;
  blocked: boolean;
  blockedAt: number | undefined;
  lastSyncTime: number | undefined;
  lastBadSyncTime: number | undefined;
  lastSyncResult: MergeResult | undefined;

  constructor() {
    this.score = 0;
    this.blocked = false;
  }

  clone(): PeerScore {
    const score = new PeerScore();
    score.score = this.score;
    score.blocked = this.blocked;
    score.blockedAt = this.blockedAt;
    score.lastSyncTime = this.lastSyncTime;
    score.lastBadSyncTime = this.lastBadSyncTime;
    score.lastSyncResult = this.lastSyncResult;
    return score;
  }
}

export type PeerScorerOptions = {
  onPeerScoreChanged?: (peerId: string, score: number) => void;
  overrideBadSyncWindowThreshold?: number | undefined;
};

/**
 * Keeps track of the score of each peer.
 */
export class PeerScorer {
  // PeerID (string) -> Score
  private scores: Map<string, PeerScore> = new Map();
  private onPeerScoreChanged?: ((peerId: string, score: number) => void) | undefined;
  private badSyncWindowThreshold: number;

  constructor(peerScorerOptions: PeerScorerOptions) {
    this.onPeerScoreChanged = peerScorerOptions.onPeerScoreChanged;
    this.badSyncWindowThreshold =
      peerScorerOptions.overrideBadSyncWindowThreshold === undefined
        ? BAD_SYNC_WINDOW_THRESHOLD
        : peerScorerOptions.overrideBadSyncWindowThreshold;
  }

  incrementScore(peerID?: string, by = 1) {
    if (!peerID) {
      return;
    }

    if (!this.scores.has(peerID)) {
      this.scores.set(peerID, new PeerScore());
    }

    const score = this.scores.get(peerID) as PeerScore;
    score.score += by;

    if (this.onPeerScoreChanged) {
      this.onPeerScoreChanged(peerID, score.score);
    }

    statsd().gauge(`peer.${peerID}.score`, score.score);
  }

  decrementScore(peerID?: string, by = 1) {
    this.incrementScore(peerID, -by);
  }

  updateLastSync(peerId: string, result: MergeResult) {
    if (!this.scores.has(peerId)) {
      this.scores.set(peerId, new PeerScore());
    }
    const score = this.scores.get(peerId) as PeerScore;

    // If the peer is somehow inducing synchronization more frequently than the minimum possible timeframe, penalize.
    if (Date.now() - (score.lastSyncTime ?? 0) < this.badSyncWindowThreshold) {
      log.warn({ peerId }, "Perform sync: Peer is syncing too often.");
      this.decrementScore(peerId, 2);
    }

    // If we did not merge any messages and didn't defer any. Then this peer only had old messages.
    if (result.total >= BAD_PEER_MESSAGE_THRESHOLD && result.successCount === 0 && result.deferredCount === 0) {
      log.warn({ peerId }, "Perform sync: No messages were successfully fetched. Peer will be blocked for a while.");
      score.lastBadSyncTime = Date.now();
      this.decrementScore(peerId, 10);
    }

    // If on the other hand, we merged >80% of the messages, then we consider this peer good.
    if (result.total > 0 && result.successCount / result.total > 0.8) {
      log.debug({ peerId }, "Perform sync: 80%+ success. Peer is good.");
      this.incrementScore(peerId);
    }

    // If we didn't merge any messages (i.e., the hashes matched), then we consider this peer good.
    if (result.total === 0 && result.successCount === 0) {
      log.debug({ peerId }, "Perform sync: No messages differed. Peer is good.");
      this.incrementScore(peerId);
    }

    score.lastSyncTime = Date.now();
    score.lastSyncResult = result;
  }

  getScore(peerId: string): PeerScore | undefined {
    return this.scores.get(peerId);
  }

  /**
   * A PeerID with a score <= -100 is considered a bad peer.
   */
  getBadPeerIds(): string[] {
    const blocked = [];
    for (const [peerId, score] of this.scores.entries()) {
      if (score.score <= BLOCKED_PEER_SCORE_THRESHOLD) {
        if (!score.blocked) {
          log.warn({ peerId }, "Peer blocked");
          score.blocked = true;
          score.blockedAt = Date.now();
        }
        blocked.push(peerId);
      }
    }

    return blocked;
  }
}
