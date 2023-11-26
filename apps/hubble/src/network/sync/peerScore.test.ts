import { PeerScorer } from "./peerScore.js";
import { MergeResult } from "./syncEngine.js";

describe("peerScore", () => {
  let peerScorer: PeerScorer;
  let scoreChanged: Map<string, number>;

  beforeEach(() => {
    scoreChanged = new Map<string, number>();
    peerScorer = new PeerScorer({
      onPeerScoreChanged(peerId, score) {
        scoreChanged.set(peerId, score);
      },
      overrideBadSyncWindowThreshold: 0,
    });
  });

  test("not blocked by default", () => {
    peerScorer.incrementScore("peerId");
    expect(peerScorer.getScore("peerId")?.blocked).toBe(false);
  });

  test("blocks peer after 10 bad syncs", () => {
    for (let i = 0; i < 10; i++) {
      const result = new MergeResult(1000, 0, 0);
      peerScorer.updateLastSync("peerId", result);
    }

    expect(peerScorer.getScore("peerId")?.score).toBe(-100);
    expect(peerScorer.getBadPeerIds()).toEqual(["peerId"]);
    expect(peerScorer.getScore("peerId")?.blocked).toBe(true);
  });

  test("Good sync increases score", () => {
    const result = new MergeResult(1000, 1000, 0);
    peerScorer.updateLastSync("peerId", result);

    expect(peerScorer.getScore("peerId")?.score).toBe(1);
    expect(peerScorer.getBadPeerIds()).toEqual([]);
    expect(peerScorer.getScore("peerId")?.blocked).toBe(false);
  });

  test("No messages differed increases score", () => {
    const result = new MergeResult(0, 0, 0);
    peerScorer.updateLastSync("peerId", result);

    expect(peerScorer.getScore("peerId")?.score).toBe(1);
    expect(peerScorer.getBadPeerIds()).toEqual([]);
    expect(peerScorer.getScore("peerId")?.blocked).toBe(false);
  });

  test("changing score reports back to optional callback", () => {
    peerScorer.incrementScore("peerId", 2);
    expect(scoreChanged.get("peerId")).toBe(2);
    peerScorer.decrementScore("peerId", 3);
    expect(scoreChanged.get("peerId")).toBe(-1);
  });
});
