import {
  Factories,
  getFarcasterTime,
  HubError,
  HubEvent,
  Message,
  PruneMessageHubEvent,
  RevokeMessageHubEvent,
} from "@farcaster/hub-nodejs";
import { ResultAsync } from "neverthrow";
import { jestRocksDB } from "../db/jestUtils.js";
import LinkStore from "./linkStore.js";
import StoreEventHandler from "./storeEventHandler.js";
import { putOnChainEventTransaction } from "../db/onChainEvent.js";

const db = jestRocksDB("protobufs.linkStoreCompactState.test");
const eventHandler = new StoreEventHandler(db);
const set = new LinkStore(db, eventHandler);
const fid = Factories.Fid.build();
const targetFid = fid + 1;

beforeAll(async () => {
  const rent = Factories.StorageRentOnChainEvent.build({ fid }, { transient: { units: 1 } });
  await db.commit(putOnChainEventTransaction(db.transaction(), rent));
});

beforeEach(async () => {
  await eventHandler.syncCache();
});

describe("Merge LinkCompactState messages", () => {
  test("merge link compaction messages in an empty set", async () => {
    const linkCompactState = await Factories.LinkCompactStateMessage.create({
      data: {
        fid,
        linkCompactStateBody: { targetFids: [targetFid] },
      },
    });

    const result = await set.merge(linkCompactState);
    expect(result).toBeGreaterThan(0);

    // Merging the same message again is an error, because only newer compact state messages
    // can be merged
    const expectError = await ResultAsync.fromPromise(set.merge(linkCompactState), (e) => e as HubError);
    expect(expectError.isErr()).toBe(true);
    expect(expectError._unsafeUnwrapErr().errCode).toBe("bad_request.conflict");

    // A new compact state message with a newer timestamp can be merged
    const linkCompactState2 = await Factories.LinkCompactStateMessage.create({
      data: {
        fid,
        linkCompactStateBody: { targetFids: [targetFid] },
        timestamp: linkCompactState.data.timestamp + 1,
      },
    });

    const result2 = await set.merge(linkCompactState2);
    expect(result2).toBeGreaterThan(result);
  });

  test("merge link compaction messages in a non-empty set", async () => {
    const timestamp = getFarcasterTime()._unsafeUnwrap();
    // First, create 2 link Adds
    const linkAdd1 = await Factories.LinkAddMessage.create({
      data: { fid, linkBody: Factories.LinkBody.build({ type: "follow", targetFid }), timestamp },
    });

    const linkAdd2 = await Factories.LinkAddMessage.create({
      data: { fid, linkBody: Factories.LinkBody.build({ type: "follow", targetFid: targetFid + 1 }), timestamp },
    });

    // merge both
    await set.mergeMessages([linkAdd1, linkAdd2]);

    // Both messages are in the set
    expect(await set.getLinkAdd(fid, linkAdd1.data.linkBody.type, linkAdd1.data.linkBody.targetFid as number)).toEqual(
      linkAdd1,
    );
    expect(await set.getLinkAdd(fid, linkAdd2.data.linkBody.type, linkAdd2.data.linkBody.targetFid as number)).toEqual(
      linkAdd2,
    );

    // Listen for the hubEvent
    let hubEvent: HubEvent | undefined;
    eventHandler.addListener("mergeMessage", (event) => {
      hubEvent = event;
    });

    // Create a compact state message that only has linkAdd1
    const linkCompactState = await Factories.LinkCompactStateMessage.create({
      data: {
        fid,
        linkCompactStateBody: { targetFids: [linkAdd1.data.linkBody.targetFid as number] },
        timestamp: timestamp + 2,
      },
    });
    // expect it to merge successfully
    const result = await set.merge(linkCompactState);
    expect(result).toBeGreaterThan(0);

    // Now only linkAdd1 is in the set
    expect(await set.getLinkAdd(fid, linkAdd1.data.linkBody.type, linkAdd1.data.linkBody.targetFid as number)).toEqual(
      linkAdd1,
    );
    const expectError = await ResultAsync.fromPromise(
      set.getLinkAdd(fid, linkAdd2.data.linkBody.type, linkAdd2.data.linkBody.targetFid as number),
      (e) => e as HubError,
    );
    expect(expectError.isErr()).toBe(true);
    expect(expectError._unsafeUnwrapErr().errCode).toBe("not_found");

    // Make sure that the hub event was proper.
    expect(hubEvent?.mergeMessageBody?.message?.data?.fid).toEqual(fid);
    expect(hubEvent?.mergeMessageBody?.deletedMessages).toEqual([linkAdd2]);

    // Now that there's a compact state message, linkAdd2 still won't merge because it is not in the target_fids
    const expectError2 = await ResultAsync.fromPromise(set.merge(linkAdd2), (e) => e as HubError);
    expect(expectError2.isErr()).toBe(true);

    // An older linkAdd that's not in the target fids will not be merged
    const oldLinkAdd = await Factories.LinkAddMessage.create({
      data: { fid, linkBody: Factories.LinkBody.build({ type: "follow", targetFid: targetFid + 2 }), timestamp },
    });
    const expectError3 = await ResultAsync.fromPromise(set.merge(oldLinkAdd), (e) => e as HubError);
    expect(expectError3.isErr()).toBe(true);

    // A valid linkRemove will also not merge, because no linkRemoves are allowed
    const linkRemove1 = await Factories.LinkRemoveMessage.create({
      data: { fid, linkBody: linkAdd1.data.linkBody, timestamp: linkAdd1.data.timestamp + 1 },
    });
    const expectError4 = await ResultAsync.fromPromise(set.merge(linkRemove1), (e) => e as HubError);
    expect(expectError4.isErr()).toBe(true);
  });

  test("merge link compaction messages can remove all messages", async () => {
    // First, create 2 link Adds
    const linkAdd1 = await Factories.LinkAddMessage.create({
      data: { fid, linkBody: Factories.LinkBody.build({ type: "follow", targetFid }) },
    });

    const linkAdd2 = await Factories.LinkAddMessage.create({
      data: { fid, linkBody: Factories.LinkBody.build({ type: "follow", targetFid: targetFid + 1 }) },
    });

    // merge both
    await set.mergeMessages([linkAdd1, linkAdd2]);

    // Both messages are in the set
    expect(await set.getLinkAdd(fid, linkAdd1.data.linkBody.type, linkAdd1.data.linkBody.targetFid as number)).toEqual(
      linkAdd1,
    );
    expect(await set.getLinkAdd(fid, linkAdd2.data.linkBody.type, linkAdd2.data.linkBody.targetFid as number)).toEqual(
      linkAdd2,
    );

    // Listen for the hubEvent
    let hubEvent: HubEvent | undefined;
    eventHandler.addListener("mergeMessage", (event) => {
      hubEvent = event;
    });

    // Create a compact state message that only has linkAdd1
    const linkCompactState = await Factories.LinkCompactStateMessage.create({
      data: {
        fid,
        linkCompactStateBody: { targetFids: [] },
      },
    });
    // expect it to merge successfully
    const result = await set.merge(linkCompactState);
    expect(result).toBeGreaterThan(0);

    // Now no messages are in the set
    expect((await set.getAllLinkMessagesByFid(fid)).messages).toEqual([]);

    // Make sure that the hub event was proper.
    expect(hubEvent?.mergeMessageBody?.message?.data?.fid).toEqual(fid);
    expect(hubEvent?.mergeMessageBody?.deletedMessages?.length).toEqual(2);
  });

  test("merge link compaction messages removes LinkRemove messages", async () => {
    const timestamp = getFarcasterTime()._unsafeUnwrap();
    // Create 2 link Adds
    const linkAdd1 = await Factories.LinkAddMessage.create({
      data: { fid, linkBody: Factories.LinkBody.build({ type: "follow", targetFid }), timestamp },
    });
    const linkAdd2 = await Factories.LinkAddMessage.create({
      data: { fid, linkBody: Factories.LinkBody.build({ type: "follow", targetFid: targetFid + 1 }), timestamp },
    });

    // Link Remove for linkAdd1
    const linkRemove1 = await Factories.LinkRemoveMessage.create({
      data: { fid, linkBody: linkAdd1.data.linkBody, timestamp: linkAdd1.data.timestamp + 1 },
    });

    // Merge all of them
    await set.mergeMessages([linkAdd1, linkAdd2, linkRemove1]);

    // Set only has linkAdd2 and linkRemove1
    const allMessages = (await set.getAllLinkMessagesByFid(fid)).messages;
    expect(allMessages.length).toEqual(2);
    expect(allMessages).toContainEqual(linkAdd2);
    expect(allMessages).toContainEqual(linkRemove1);

    // Listen for the hubEvent
    let hubEvent: HubEvent | undefined;
    eventHandler.addListener("mergeMessage", (event) => {
      hubEvent = event;
    });

    // Create a compact state message that only has linkAdd2
    const linkCompactState = await Factories.LinkCompactStateMessage.create({
      data: {
        fid,
        linkCompactStateBody: { targetFids: [linkAdd2.data.linkBody.targetFid as number] },
        timestamp: timestamp + 2, // Make sure it is after mergeRemove
      },
    });

    // expect it to merge successfully
    const result = await set.merge(linkCompactState);
    expect(result).toBeGreaterThan(0);

    // Now only linkAdd2 is in the set (no LinkRemove, which has been removed)
    expect((await set.getAllLinkMessagesByFid(fid)).messages).toEqual([linkAdd2]);

    // Expect the hub event to be proper
    expect(hubEvent?.mergeMessageBody?.message?.data?.fid).toEqual(fid);
    expect(hubEvent?.mergeMessageBody?.deletedMessages).toEqual([linkRemove1]);

    // linkAdd1 and linkRemove1 are both not in the set
    // Trying to merge them will fail
    const expectError = await ResultAsync.fromPromise(set.merge(linkAdd1), (e) => e as HubError);

    expect(expectError.isErr()).toBe(true);
    expect(expectError._unsafeUnwrapErr().errCode).toBe("bad_request.conflict");

    const expectError2 = await ResultAsync.fromPromise(set.merge(linkRemove1), (e) => e as HubError);
    expect(expectError2.isErr()).toBe(true);
    expect(expectError2._unsafeUnwrapErr().errCode).toBe("bad_request.prunable");
  });

  test("Doesn't remove link messages timestamped after the link compact state", async () => {
    const timestamp = getFarcasterTime()._unsafeUnwrap();

    // Create 2 link Adds, one for now and one in the future
    const linkAdd1 = await Factories.LinkAddMessage.create({
      data: { fid, linkBody: Factories.LinkBody.build({ type: "follow", targetFid }), timestamp },
    });
    const linkAdd2 = await Factories.LinkAddMessage.create({
      data: {
        fid,
        linkBody: Factories.LinkBody.build({ type: "follow", targetFid: targetFid + 1 }),
        timestamp: timestamp + 2,
      },
    });

    // Merge both
    await set.mergeMessages([linkAdd1, linkAdd2]);

    // Both messages are in the set
    const allMessages = (await set.getAllLinkMessagesByFid(fid)).messages;
    expect(allMessages.length).toEqual(2);
    expect(allMessages).toContainEqual(linkAdd1);
    expect(allMessages).toContainEqual(linkAdd2);

    // Listen for the hubEvent
    let hubEvent: HubEvent | undefined;
    eventHandler.addListener("mergeMessage", (event) => {
      hubEvent = event;
    });

    // Create a compact state message that nothing
    const linkCompactState = await Factories.LinkCompactStateMessage.create({
      data: {
        fid,
        linkCompactStateBody: { targetFids: [] },
        timestamp: timestamp + 1, // timestamp between linkAdd1 and linkAdd2
      },
    });

    // expect it to merge successfully
    const result1 = await set.mergeMessages([linkCompactState]);
    expect(result1.get(0)?._unsafeUnwrap()).toBeGreaterThan(0);

    // Now only linkAdd2 is in the set, because it is after the compact state timestamp
    expect((await set.getAllLinkMessagesByFid(fid)).messages).toEqual([linkAdd2]);

    // Expect the hub event to be proper
    expect(hubEvent?.mergeMessageBody?.message?.data?.fid).toEqual(fid);
    expect(hubEvent?.mergeMessageBody?.deletedMessages).toEqual([linkAdd1]);

    // Merge a new compact state after linkAdd2
    const linkCompactState2 = await Factories.LinkCompactStateMessage.create({
      data: {
        fid,
        linkCompactStateBody: { targetFids: [] },
        timestamp: timestamp + 3,
      },
    });

    // expect it to merge successfully
    const result2 = await set.merge(linkCompactState2);
    expect(result2).toBeGreaterThan(result1.get(0)?._unsafeUnwrap() as number);

    // Now the set is empty
    expect((await set.getAllLinkMessagesByFid(fid)).messages).toEqual([]);

    // Expect the hub event to be proper. The deleted messages should also have the previous compact state
    expect(hubEvent?.mergeMessageBody?.message?.data?.fid).toEqual(fid);
    expect(hubEvent?.mergeMessageBody?.deletedMessages).toEqual([linkCompactState, linkAdd2]);
  });

  test("link compact can be inserted in the middle of a set", async () => {
    // Create 2 link adds
    const timestamp = getFarcasterTime()._unsafeUnwrap();
    const linkAdd1 = await Factories.LinkAddMessage.create({
      data: { fid, linkBody: Factories.LinkBody.build({ type: "follow", targetFid }), timestamp },
    });
    const linkAdd2 = await Factories.LinkAddMessage.create({
      data: { fid, linkBody: Factories.LinkBody.build({ type: "follow", targetFid: targetFid + 1 }), timestamp },
    });
    const linkRemove1 = await Factories.LinkRemoveMessage.create({
      data: { fid, linkBody: linkAdd1.data.linkBody, timestamp: linkAdd1.data.timestamp + 1 },
    });

    // Merge all of them
    await set.mergeMessages([linkAdd1, linkAdd2, linkRemove1]);

    // Both messages are in the set
    const allMessages = (await set.getAllLinkMessagesByFid(fid)).messages;
    expect(allMessages.length).toEqual(2);
    expect(allMessages).toContainEqual(linkAdd2);
    expect(allMessages).toContainEqual(linkRemove1);

    // Now, create more linkadds and removes 10s later
    const timestamp2 = timestamp + 10;
    const linkAdd3 = await Factories.LinkAddMessage.create({
      data: {
        fid,
        linkBody: Factories.LinkBody.build({ type: "follow", targetFid: targetFid + 2 }),
        timestamp: timestamp2,
      },
    });
    const linkAdd4 = await Factories.LinkAddMessage.create({
      data: {
        fid,
        linkBody: Factories.LinkBody.build({ type: "follow", targetFid: targetFid + 3 }),
        timestamp: timestamp2,
      },
    });
    // Merge all of them
    await set.mergeMessages([linkAdd3, linkAdd4]);

    // Both messages are in the set
    const allMessages2 = (await set.getAllLinkMessagesByFid(fid)).messages;
    expect(allMessages2.length).toEqual(4);

    // Now, create a compact state message that only has linkAdd1 and linkAdd2, and put it in the middle
    const linkCompactState = await Factories.LinkCompactStateMessage.create({
      data: {
        fid,
        linkCompactStateBody: {
          targetFids: [
            linkAdd1.data.linkBody.targetFid as number,
            linkAdd2.data.linkBody.targetFid as number,
            linkAdd3.data.linkBody.targetFid as number,
          ],
        },
        timestamp: timestamp + 5,
      },
    });

    // expect it to merge successfully
    const result = await set.merge(linkCompactState);
    expect(result).toBeGreaterThan(0);

    // Now only linkAdd2, (linkRemove1 is gone) and linkAdd3 + linkAdd4 are in the set
    const allMessages3 = (await set.getAllLinkMessagesByFid(fid)).messages;
    expect(allMessages3.length).toEqual(3);
    expect(allMessages3).toContainEqual(linkAdd2);
    expect(allMessages3).toContainEqual(linkAdd3);
    expect(allMessages3).toContainEqual(linkAdd4);
  });

  describe("Pruning", () => {
    let prunedMessages: Message[];

    const pruneMessageListener = (event: PruneMessageHubEvent) => {
      prunedMessages.push(event.pruneMessageBody.message);
    };

    beforeAll(() => {
      eventHandler.on("pruneMessage", pruneMessageListener);
    });

    beforeEach(() => {
      prunedMessages = [];
    });

    afterAll(() => {
      eventHandler.off("pruneMessage", pruneMessageListener);
    });

    test("Pruning doesn't remove compact state messages", async () => {
      const sizePrunedStore = new LinkStore(db, eventHandler, { pruneSizeLimit: 3 });
      const timestamp = getFarcasterTime()._unsafeUnwrap();

      // Make the earliest message the compact state
      const compactState = await Factories.LinkCompactStateMessage.create({
        data: {
          fid,
          linkCompactStateBody: { targetFids: [targetFid, targetFid + 1] },
          timestamp,
        },
      });
      // Merge the compact state
      await sizePrunedStore.merge(compactState);

      // Create 5 link Adds
      const linkAdds = await Promise.all(
        [1, 2, 3, 4, 5].map(async (i) =>
          Factories.LinkAddMessage.create({
            data: {
              fid,
              linkBody: Factories.LinkBody.build({ type: "follow", targetFid: targetFid + i }),
              timestamp: timestamp + i,
            },
          }),
        ),
      );

      // Merge all of them
      const results = await sizePrunedStore.mergeMessages(linkAdds);

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result.isOk()).toBeTruthy();
      expect(result._unsafeUnwrap().length).toEqual(2);

      // Only the link Adds are pruned
      expect(prunedMessages).toEqual([linkAdds[0], linkAdds[1]]);
    });
  });

  describe("revoke", () => {
    let revokedMessages: Message[] = [];

    const revokeMessageHandler = (event: RevokeMessageHubEvent) => {
      revokedMessages.push(event.revokeMessageBody.message);
    };

    beforeAll(() => {
      eventHandler.on("revokeMessage", revokeMessageHandler);
    });

    beforeEach(() => {
      revokedMessages = [];
    });

    afterAll(() => {
      eventHandler.off("revokeMessage", revokeMessageHandler);
    });

    test("Compact state messages can be revoked", async () => {
      // Create a couple of link adds
      const timestamp = getFarcasterTime()._unsafeUnwrap();
      const linkAdd1 = await Factories.LinkAddMessage.create({
        data: { fid, linkBody: Factories.LinkBody.build({ type: "follow", targetFid }), timestamp },
      });
      const linkAdd2 = await Factories.LinkAddMessage.create({
        data: { fid, linkBody: Factories.LinkBody.build({ type: "follow", targetFid: targetFid + 1 }), timestamp },
      });
      const linkAdd3 = await Factories.LinkAddMessage.create({
        data: { fid, linkBody: Factories.LinkBody.build({ type: "follow", targetFid: targetFid + 2 }), timestamp },
      });

      // Listen for the hubEvent
      let hubEvent: HubEvent | undefined;
      eventHandler.addListener("mergeMessage", (event) => {
        hubEvent = event;
      });

      // Merge only the first 2
      await set.mergeMessages([linkAdd1, linkAdd2]);

      // Both messages are in the set
      let allMessages = (await set.getAllLinkMessagesByFid(fid)).messages;

      expect(allMessages.length).toEqual(2);
      expect(allMessages).toContainEqual(linkAdd1);
      expect(allMessages).toContainEqual(linkAdd2);

      // Create a compact state message that only has linkAdd1, linkAdd2
      const linkCompactState = await Factories.LinkCompactStateMessage.create({
        data: {
          fid,
          linkCompactStateBody: {
            targetFids: [linkAdd1.data.linkBody.targetFid as number, linkAdd2.data.linkBody.targetFid as number],
          },
          timestamp: timestamp + 1,
        },
      });

      // expect it to merge successfully
      const result = await set.merge(linkCompactState);
      expect(result).toBeGreaterThan(0);

      // linkAdd1 and linkAdd2 are still in the set
      allMessages = (await set.getAllLinkMessagesByFid(fid)).messages;
      expect(allMessages.length).toEqual(2);
      expect(allMessages).toContainEqual(linkAdd1);
      expect(allMessages).toContainEqual(linkAdd2);

      // Merging the linkAdd3 doesn't work because it's not in the target fids
      const expectError = await ResultAsync.fromPromise(set.merge(linkAdd3), (e) => e as HubError);
      expect(expectError.isErr()).toBe(true);
      expect(expectError._unsafeUnwrapErr().errCode).toBe("bad_request.conflict");

      // Listen for the hubEvent
      let revokedHubEvent: HubEvent | undefined;
      eventHandler.addListener("revokeMessage", (event) => {
        revokedHubEvent = event;
      });

      // Revoke the compact state message
      const revokResult = await set.revoke(linkCompactState);
      expect(revokResult._unsafeUnwrap()).toBeGreaterThan(0);

      // Make sure the revoke message is proper
      expect(revokedMessages).toEqual([linkCompactState]);

      // Make sure the hub event is proper
      expect(revokedHubEvent?.revokeMessageBody?.message).toEqual(linkCompactState);

      // Now that the compact state message is revoked, linkAdd3 can be merged
      const result2 = await set.merge(linkAdd3);
      expect(result2).toBeGreaterThan(result);

      // linkAdd3 is now in the set
      allMessages = (await set.getAllLinkMessagesByFid(fid)).messages;
      expect(allMessages.length).toEqual(3);
      expect(allMessages).toContainEqual(linkAdd1);
      expect(allMessages).toContainEqual(linkAdd2);
      expect(allMessages).toContainEqual(linkAdd3);

      // Re-merging the compact state message will work and remove linkAdd3
      const result3 = await set.merge(linkCompactState);
      expect(result3).toBeGreaterThan(result2);

      // Make sure the hub event is proper
      expect(hubEvent?.mergeMessageBody?.message?.data?.fid).toEqual(fid);
      expect(hubEvent?.mergeMessageBody?.deletedMessages).toEqual([linkAdd3]);

      // linkAdd3 is now removed
      allMessages = (await set.getAllLinkMessagesByFid(fid)).messages;
      expect(allMessages.length).toEqual(2);
      expect(allMessages).toContainEqual(linkAdd1);
      expect(allMessages).toContainEqual(linkAdd2);
    });
  });
});
