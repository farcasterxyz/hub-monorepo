import { GossipContactInfoJobScheduler } from "./gossipContactInfoJob.js";
import { MockHub } from "../../test/mocks.js";
import { testRocksDB } from "../db/testUtils.js";
import Engine from "../engine/index.js";
import { FarcasterNetwork } from "@farcaster/core";
import { describe, test, expect } from "vitest";

const db = testRocksDB("jobs.GossipContactInfoJobScheduler.test");

describe("GossipContactInfoJobScheduler", () => {
  test("doJobs", async () => {
    const engine = new Engine(db, FarcasterNetwork.TESTNET);
    const hub = new MockHub(db, engine);
    const scheduler = new GossipContactInfoJobScheduler(hub);
    await scheduler.doJobs();
    expect(hub.gossipCount).toBe(1);
  });
});
