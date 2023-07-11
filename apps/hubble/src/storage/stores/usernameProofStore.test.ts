import { jestRocksDB } from "../db/jestUtils.js";
import StoreEventHandler from "./storeEventHandler.js";
import {
  Factories,
  getFarcasterTime,
  HubError,
  MergeUsernameProofHubEvent,
  MessageType,
  UserNameProof,
  UsernameProofMessage,
  UserNameType,
} from "@farcaster/hub-nodejs";
import UsernameProofStore from "./usernameProofStore.js";

const db = jestRocksDB("protobufs.usernameProofSet.test");
const eventHandler = new StoreEventHandler(db);
const set = new UsernameProofStore(db, eventHandler);
const fid = Factories.Fid.build();

describe("usernameProofStore", () => {
  let ensProof: UsernameProofMessage;
  let fname: Uint8Array;
  let currentFarcasterTime: number;

  const buildProof = async (
    fid: number,
    name: Uint8Array,
    timestamp: number,
    type: UserNameType,
  ): Promise<UsernameProofMessage> => {
    return await Factories.UsernameProofMessage.create({
      data: {
        fid,
        usernameProofBody: Factories.UserNameProof.build({
          name,
          fid,
          timestamp,
          type,
        }),
        timestamp: timestamp,
        type: MessageType.USERNAME_PROOF,
      },
    });
  };

  beforeAll(async () => {
    fname = Factories.Fname.build();
    currentFarcasterTime = getFarcasterTime()._unsafeUnwrap();
    ensProof = await buildProof(fid, fname, currentFarcasterTime, UserNameType.USERNAME_TYPE_ENS_L1);
  });

  beforeEach(async () => {
    await eventHandler.syncCache();
  });

  describe("merge", () => {
    test("should merge valid proofs", async () => {
      await set.merge(ensProof);
      const proof = await set.getUsernameProof(fname, UserNameType.USERNAME_TYPE_ENS_L1);
      expect(proof).toEqual(ensProof);
    });

    test("replaces existing proof for name if timestamp is newer", async () => {
      await set.merge(ensProof);

      const newProof = await buildProof(fid, fname, currentFarcasterTime + 10, UserNameType.USERNAME_TYPE_ENS_L1);
      expect(newProof).not.toEqual(ensProof);
      await set.merge(newProof);

      const proof = await set.getUsernameProof(fname, UserNameType.USERNAME_TYPE_ENS_L1);
      expect(proof).toEqual(newProof);

      const rawProof = await set.getAdd({ data: { fid, usernameProofBody: { name: fname } } });
      expect(rawProof).toEqual(newProof);
    });

    test("replaces existing proof for name even if fid is different if timestamp is newer", async () => {
      await set.merge(ensProof);

      const newFid = Factories.Fid.build();
      const newProof = await buildProof(newFid, fname, currentFarcasterTime + 10, UserNameType.USERNAME_TYPE_ENS_L1);
      expect(newProof).not.toEqual(ensProof);
      await set.merge(newProof);

      const proof = await set.getUsernameProof(fname, UserNameType.USERNAME_TYPE_ENS_L1);
      expect(proof).toEqual(newProof);

      await expect(set.getAdd({ data: { fid, usernameProofBody: { name: fname } } })).rejects.toThrowError("NotFound");
    });

    test("does not replace existing proof for name if timestamp is older", async () => {
      await set.merge(ensProof);

      const newFid = Factories.Fid.build();
      const newProof = await buildProof(newFid, fname, currentFarcasterTime - 10, UserNameType.USERNAME_TYPE_ENS_L1);
      await expect(set.merge(newProof)).rejects.toThrowError("message conflicts with a more recent add");

      const newProofOldFid = await buildProof(fid, fname, currentFarcasterTime - 10, UserNameType.USERNAME_TYPE_ENS_L1);
      await expect(set.merge(newProofOldFid)).rejects.toThrowError("message conflicts with a more recent add");

      const proof = await set.getUsernameProof(fname, UserNameType.USERNAME_TYPE_ENS_L1);
      expect(proof).toEqual(ensProof);
    });

    test("does not merge duplicates", async () => {
      await set.merge(ensProof);
      await expect(set.merge(ensProof)).rejects.toThrowError("message has already been merged");
    });
  });

  describe("getUsernameProof", () => {
    test("succeeds for an ens name", async () => {});
    test("succeeds for a fname name", async () => {});
    test("fails if not found", async () => {
      await expect(set.getUsernameProof(fname, UserNameType.USERNAME_TYPE_ENS_L1)).rejects.toThrowError("NotFound");
    });
  });

  describe("getUsernameProofsByFid", () => {
    test("should return empty array if no proofs", async () => {});
    test("should return all proofs for fid", async () => {});
  });

  describe("pruneMessages", () => {
    let prunedMessages: UserNameProof[];
    let addedMessages: UserNameProof[];
    const pruneMessageListener = (event: MergeUsernameProofHubEvent) => {
      if (event.mergeUsernameProofBody.deletedUsernameProof) {
        prunedMessages.push(event.mergeUsernameProofBody.deletedUsernameProof);
      } else if (event.mergeUsernameProofBody.usernameProof) {
        addedMessages.push(event.mergeUsernameProofBody.usernameProof);
      }
    };

    beforeAll(() => {
      eventHandler.on("mergeUsernameProofEvent", pruneMessageListener);
    });

    beforeEach(() => {
      prunedMessages = [];
      addedMessages = [];
    });

    afterAll(() => {
      eventHandler.off("mergeUsernameProofEvent", pruneMessageListener);
    });

    let add1: UsernameProofMessage;
    let add2: UsernameProofMessage;
    let add3: UsernameProofMessage;
    let add4: UsernameProofMessage;
    let addOld1: UsernameProofMessage;

    const generateAddWithTimestamp = async (fid: number, timestamp: number): Promise<UsernameProofMessage> => {
      return Factories.UsernameProofMessage.create({ data: { fid, timestamp } });
    };

    beforeAll(async () => {
      const time = getFarcasterTime()._unsafeUnwrap() - 10;
      add1 = await generateAddWithTimestamp(fid, time + 1);
      add2 = await generateAddWithTimestamp(fid, time + 2);
      add3 = await generateAddWithTimestamp(fid, time + 3);
      add4 = await generateAddWithTimestamp(fid, time + 5);
      addOld1 = await generateAddWithTimestamp(fid, time - 60 * 60);
    });

    describe("with size limit", () => {
      const sizePrunedStore = new UsernameProofStore(db, eventHandler, { pruneSizeLimit: 2 });

      test("defaults size limit", async () => {
        expect(set.pruneSizeLimit).toEqual(10);
        expect(set.pruneTimeLimit).toBeUndefined();
      });

      test("no-ops when no messages have been merged", async () => {
        const result = await sizePrunedStore.pruneMessages(fid);
        expect(result._unsafeUnwrap()).toEqual([]);
        expect(prunedMessages).toEqual([]);
      });

      test("prunes earliest add messages", async () => {
        const messages = [add1, add2, add3, add4];
        for (const message of messages) {
          await sizePrunedStore.merge(message);
        }

        const result = await sizePrunedStore.pruneMessages(fid);
        expect(result.isOk()).toBeTruthy();

        expect(prunedMessages).toEqual([add1.data.usernameProofBody, add2.data.usernameProofBody]);

        for (const message of prunedMessages) {
          const getAdd = () => sizePrunedStore.getUsernameProof(message.name, message.type);
          await expect(getAdd()).rejects.toThrow(HubError);
        }
      });

      test("fails to add messages older than the earliest message", async () => {
        const messages = [add1, add2, add3];
        for (const message of messages) {
          await sizePrunedStore.merge(message);
        }

        // Older messages are rejected
        await expect(sizePrunedStore.merge(addOld1)).rejects.toEqual(
          new HubError("bad_request.prunable", "message would be pruned"),
        );
      });
    });
  });
});
