import { ReactionStoreProxy } from "./reactionStore.proxy.js";
import { Factories, ReactionAddMessage, ReactionType } from "@farcaster/hub-nodejs";
import StoreEventHandler from "./storeEventHandler.js";
import { jestRocksDB } from "../../storage/db/jestUtils.js";
import ReactionStore from "./reactionStore.js";

describe("ReactionStoreProxy", () => {
  let reactionStoreProxy: ReactionStoreProxy;

  const db = jestRocksDB("reactionStoreProxy.test");
  const eventHandler = new StoreEventHandler(db);
  const set = new ReactionStore(db, eventHandler);

  const fid = Factories.Fid.build();
  const castId = Factories.CastId.build();

  let reactionAdd: ReactionAddMessage;

  beforeAll(async () => {
    const likeBody = Factories.ReactionBody.build({
      type: ReactionType.LIKE,
      targetCastId: castId,
    });

    reactionAdd = await Factories.ReactionAddMessage.create({
      data: { fid, reactionBody: likeBody },
    });

    reactionStoreProxy = new ReactionStoreProxy();
  });

  beforeEach(async () => {
    await eventHandler.syncCache();
  });

  test("merges basic reaction message", async () => {
    const r: number = await reactionStoreProxy.merge(reactionAdd);
    expect(r).toBe(0);

    const r2: number = await reactionStoreProxy.merge(reactionAdd);
    expect(r2).toBe(-1); // Dup

    // Create 1000 reactions
    const size = 10000;

    let start = Date.now();
    for (let i = 0; i < size; i++) {
      reactionAdd.data.reactionBody.targetCastId = Factories.CastId.build();
      const r: number = await reactionStoreProxy.merge(reactionAdd);
      expect(r).toBe(0);
    }
    console.log(size, " reactions in ", Date.now() - start, "ms");

    // Now do this with the normal store
    const r3 = await set.merge(reactionAdd);
    expect(r3).toBeGreaterThan(0);

    start = Date.now();
    for (let i = 0; i < size; i++) {
      // reactionAdd.data.reactionBody.targetCastId = Factories.CastId.build();
      // const r: number = await set.merge(reactionAdd);
      // expect(r).toBeGreaterThan(0);
    }
    console.log(size, " reactions in ", Date.now() - start, "ms");
  });
});
