import { PeerScorer } from "./peerScore.js";
import { MergeResult } from "./syncEngine.js";

describe("peerScore", () => {
  let peerScorer: PeerScorer;

  beforeEach(() => {
    peerScorer = new PeerScorer();
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
});
