import { ReactionStoreProxy } from "./reactionStore.proxy.js";
import { Factories, HubError, ReactionAddMessage, ReactionRemoveMessage, ReactionType } from "@farcaster/hub-nodejs";
import StoreEventHandler from "./storeEventHandler.js";
import { jestRocksDB } from "../db/jestUtils.js";
import ReactionStore from "./reactionStore.js";
import { Result, ResultAsync } from "neverthrow";
import { createDb, dbClear } from "../../rustfunctions.js";

describe("ReactionStoreProxy", () => {
  let reactionStoreProxy: ReactionStoreProxy;

  const db = jestRocksDB("reactionStoreProxy.test");
  const rustDb = createDb("/tmp/rust_db_for_test.bench.test");

  const eventHandler = new StoreEventHandler(db);
  const set = new ReactionStore(db, eventHandler);

  const fid = Factories.Fid.build();
  const castId = Factories.CastId.build();

  let reactionAdd: ReactionAddMessage;
  let reactionRemove: ReactionRemoveMessage;

  beforeAll(async () => {
    const likeBody = Factories.ReactionBody.build({
      type: ReactionType.LIKE,
      targetCastId: castId,
    });

    reactionAdd = await Factories.ReactionAddMessage.create({
      data: { fid, reactionBody: likeBody },
    });
    reactionRemove = await Factories.ReactionRemoveMessage.create({
      data: { fid, reactionBody: likeBody, timestamp: reactionAdd.data.timestamp + 1 },
    });

    reactionStoreProxy = new ReactionStoreProxy(rustDb, eventHandler);
  });

  beforeEach(async () => {
    await eventHandler.syncCache();
    await dbClear(rustDb);
  });

  test("merges basic reaction message", async () => {
    // Merge the reaction
    const r: number = await reactionStoreProxy.merge(reactionAdd);
    expect(r).toBeGreaterThan(0);
    let reactionsForFid = await reactionStoreProxy.getAllMessagesByFid(fid, {});
    expect(reactionsForFid.messages.length).toBe(1);

    // Merge the same reaction again, should be duplicate
    const r2 = (await ResultAsync.fromPromise(reactionStoreProxy.merge(reactionAdd), (e) => e)) as Result<
      number,
      HubError
    >;
    expect(r2.isErr()).toBeTruthy();
    expect(r2._unsafeUnwrapErr().errCode).toBe("bad_request.duplicate");

    reactionsForFid = await reactionStoreProxy.getAllMessagesByFid(fid, {});
    expect(reactionsForFid.messages.length).toBe(1);

    // Merge the remove reaction, it should disappear.
    const rr: number = await reactionStoreProxy.merge(reactionRemove);
    expect(rr).toBeGreaterThan(0);
    reactionsForFid = await reactionStoreProxy.getAllMessagesByFid(fid, {});
    expect(reactionsForFid.messages.length).toBe(1);
  });

  test(
    "merges 10000 reactions",
    async () => {
      const r: number = await reactionStoreProxy.merge(reactionAdd);
      expect(r).toBeGreaterThan(0);

      let timestamp = reactionAdd.data.timestamp;

      // Create 10000 reactions
      const size = 10000;
      const reactionAdds = [];
      for (let i = 0; i < size; i++) {
        timestamp += 1; // Add 1 to each timestamp so it doesn't get pruned
        const castId = Factories.CastId.build();
        const likeBody = Factories.ReactionBody.build({
          type: ReactionType.LIKE,
          targetCastId: castId,
        });
        reactionAdds.push(
          await Factories.ReactionAddMessage.create({
            data: { fid, reactionBody: likeBody, timestamp },
          }),
        );
      }

      const reactionRemoves = [];
      for (let i = 0; i < size; i++) {
        const reactionAdd = reactionAdds[i] as ReactionAddMessage;

        reactionRemoves.push(
          await Factories.ReactionRemoveMessage.create({
            data: { fid, reactionBody: reactionAdd.data.reactionBody, timestamp: reactionAdd.data.timestamp + 1 },
          }),
        );
      }

      let start = Date.now();
      for (let i = 0; i < reactionAdds.length; i++) {
        const r: number = await reactionStoreProxy.merge(reactionAdds[i] as ReactionAddMessage);
        expect(r).toBeGreaterThan(0);
      }
      console.log("rust: ", size, " reactions in ", Date.now() - start, "ms");

      // Now do this with the normal store
      const r3 = await set.merge(reactionAdd);
      expect(r3).toBeGreaterThan(0);

      start = Date.now();
      for (let i = 0; i < reactionAdds.length; i++) {
        const r: number = await set.merge(reactionAdds[i] as ReactionAddMessage);
        expect(r).toBeGreaterThan(0);
      }
      console.log("nodejs: ", size, " reactions in ", Date.now() - start, "ms");

      // Duplicate checks
      // First merge the message
      start = Date.now();
      for (let i = 0; i < size; i++) {
        const r = await ResultAsync.fromPromise(reactionStoreProxy.merge(reactionAdd), (e) => e);
        expect(r.isErr()).toBeTruthy();
      }
      console.log("rust: ", size, " duplicates in ", Date.now() - start, "ms");

      // Now do this with the normal store
      start = Date.now();
      for (let i = 0; i < size; i++) {
        const r = await ResultAsync.fromPromise(set.merge(reactionAdd), (e) => e);
        expect(r.isErr()).toBeTruthy();
      }
      console.log("nodejs: ", size, " duplicates in ", Date.now() - start, "ms");

      // Get all messages
      start = Date.now();
      const pageSize = 10;
      for (let i = 0; i < size; i++) {
        const allMessages = await reactionStoreProxy.getAllMessagesByFid(fid, { pageSize });
        expect(allMessages.messages.length).toBe(pageSize);
      }
      console.log("rust: ", size, " reads in ", Date.now() - start, "ms");

      start = Date.now();
      for (let i = 0; i < size; i++) {
        const messages2 = await set.getAllMessagesByFid(fid, { pageSize });
        expect(messages2.messages.length).toBe(pageSize);
      }
      console.log("nodejs: ", size, " reads in ", Date.now() - start, "ms");

      // Remove the reactions
      start = Date.now();
      for (let i = 0; i < reactionRemoves.length; i++) {
        const r: number = await reactionStoreProxy.merge(reactionRemoves[i] as ReactionRemoveMessage);
        expect(r).toBeGreaterThan(0);
      }
      console.log("rust: ", size, " removes in ", Date.now() - start, "ms");

      start = Date.now();
      for (let i = 0; i < reactionRemoves.length; i++) {
        const r: number = await set.merge(reactionRemoves[i] as ReactionRemoveMessage);
        expect(r).toBeGreaterThan(0);
      }
      console.log("nodejs: ", size, " removes in ", Date.now() - start, "ms");
    },
    5 * 60 * 1000,
  );
});
