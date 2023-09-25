import { Factories, FarcasterNetwork, Message } from "@farcaster/hub-nodejs";
import { FNameSyncId, MessageSyncId, OnChainEventSyncId, SyncId, SyncIdType, TIMESTAMP_LENGTH } from "./syncId.js";
import { makeFidKey, makeMessagePrimaryKeyFromMessage } from "../../storage/db/message.js";
import { FID_BYTES, RootPrefix } from "../../storage/db/types.js";

let message: Message;

const network = FarcasterNetwork.TESTNET;
const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();

beforeAll(async () => {
  message = await Factories.CastAddMessage.create();
});

describe("SyncId", () => {
  test("succeeds", async () => {
    const syncId = SyncId.fromMessage(message).syncId();
    expect(syncId).toBeDefined();
  });

  describe("Message syncIds", () => {
    test("creates and unpacks correctly from message", async () => {
      const castAddMessage = await Factories.CastAddMessage.create(
        { data: { fid, network } },
        { transient: { signer } },
      );
      const syncId = SyncId.fromMessage(castAddMessage);
      expect(syncId.type()).toEqual(SyncIdType.Message);
      const unpackedSyncId = syncId.unpack() as MessageSyncId;
      expect(unpackedSyncId.type).toEqual(SyncIdType.Message);
      expect(unpackedSyncId.fid).toEqual(fid);
      expect(unpackedSyncId.hash).toEqual(castAddMessage.hash);
      expect(unpackedSyncId.primaryKey).toEqual(makeMessagePrimaryKeyFromMessage(castAddMessage));
    });
  });

  describe("FName syncIds", () => {
    test("creates and unpacks correctly from message", async () => {
      const fnameProof = Factories.UserNameProof.build();
      const syncId = SyncId.fromFName(fnameProof);
      expect(syncId.type()).toEqual(SyncIdType.FName);
      const unpackedSyncId = syncId.unpack() as FNameSyncId;
      expect(unpackedSyncId.type).toEqual(SyncIdType.FName);
      expect(unpackedSyncId.fid).toEqual(fnameProof.fid);
      expect(unpackedSyncId.name).toEqual(fnameProof.name);
    });
  });

  describe("OnChainEvent syncIds", () => {
    test("creates and unpacks correctly from message", async () => {
      const onChainEvent = Factories.IdRegistryOnChainEvent.build();
      const syncId = SyncId.fromOnChainEvent(onChainEvent);
      expect(syncId.type()).toEqual(SyncIdType.OnChainEvent);
      const unpackedSyncId = syncId.unpack() as OnChainEventSyncId;
      expect(unpackedSyncId.type).toEqual(SyncIdType.OnChainEvent);
      expect(unpackedSyncId.fid).toEqual(onChainEvent.fid);
      expect(unpackedSyncId.blockNumber).toEqual(onChainEvent.blockNumber);
    });
  });

  describe("unknown syncIds", () => {
    test("always returns 0 fid", async () => {
      const bytes = new Uint8Array(TIMESTAMP_LENGTH + 1 + FID_BYTES + 1);
      bytes.set([RootPrefix.HubEvents], TIMESTAMP_LENGTH);
      const fid = Factories.Fid.build();
      bytes.set(makeFidKey(fid), TIMESTAMP_LENGTH + 1);
      const syncId = SyncId.fromBytes(bytes);
      expect(syncId.type()).toEqual(SyncIdType.Unknown);
      const unpackedSyncId = syncId.unpack();
      expect(unpackedSyncId.type).toEqual(SyncIdType.Unknown);
      expect(unpackedSyncId.fid).toEqual(0);
    });
  });
});
