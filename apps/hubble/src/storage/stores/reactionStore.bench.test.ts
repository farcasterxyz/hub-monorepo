import { Factories, HubError, ReactionAddMessage, ReactionRemoveMessage, ReactionType } from "@farcaster/hub-nodejs";
import StoreEventHandler from "./storeEventHandler.js";
import { jestRocksDB } from "../db/jestUtils.js";
import ReactionStore from "./reactionStore.js";
import { Result, ResultAsync } from "neverthrow";

xdescribe("ReactionStoreProxy", () => {
  const db = jestRocksDB("reactionStoreProxy.test");

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
  });

  beforeEach(async () => {
    await eventHandler.syncCache();
  });

  test(
    "merges 10000 reactions",
    async () => {
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

      const r3 = await set.merge(reactionAdd);
      expect(r3).toBeGreaterThan(0);

      let start = Date.now();
      for (let i = 0; i < reactionAdds.length; i++) {
        const r: number = await set.merge(reactionAdds[i] as ReactionAddMessage);
        expect(r).toBeGreaterThan(0);
      }
      console.log("Reactions: insert ", size, " reactions in ", Date.now() - start, "ms");

      // Duplicate checks
      start = Date.now();
      for (let i = 0; i < size; i++) {
        const r = await ResultAsync.fromPromise(set.merge(reactionAdd), (e) => e);
        expect(r.isErr()).toBeTruthy();
      }
      console.log("Reactions: ", size, " duplicates in ", Date.now() - start, "ms");

      // Get all messages
      const pageSize = 10;
      start = Date.now();
      for (let i = 0; i < size; i++) {
        const messages2 = await set.getAllMessagesByFid(fid, { pageSize });
        expect(messages2.messages.length).toBe(pageSize);
      }
      console.log("Reactions: ", size, " reads in ", Date.now() - start, "ms");

      // Remove the reactions
      start = Date.now();
      for (let i = 0; i < reactionRemoves.length; i++) {
        const r: number = await set.merge(reactionRemoves[i] as ReactionRemoveMessage);
        expect(r).toBeGreaterThan(0);
      }
      console.log("Reactions: ", size, " removes in ", Date.now() - start, "ms");
    },
    5 * 60 * 1000,
  );
});
