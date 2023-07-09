import { jestRocksDB } from "../db/jestUtils.js";
import StoreEventHandler from "./storeEventHandler.js";
import { Factories, getFarcasterTime, MessageType, UsernameProofMessage, UserNameType } from "@farcaster/hub-nodejs";
import UsernameProofStore from "./usernameProofStore.js";
import { mainnetPublicClient, publicClient, testClient } from "../../test/utils.js";

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

    test("does not merge fname proofs", async () => {});
  });

  describe("events", () => {
    test("should emit username proof event on merge", async () => {});
    test("should include deleted proof on merge conflict", async () => {});
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

  describe("prune", () => {
    test("should prune messages beyond size limit", async () => {});
  });
});
