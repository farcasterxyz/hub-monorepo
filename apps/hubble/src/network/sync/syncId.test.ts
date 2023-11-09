import { Factories, FarcasterNetwork, Message, validations, OnChainEventType } from "@farcaster/hub-nodejs";
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

    test("names that are substrings of each other are padded correctly", async () => {
      const fnameProof = Factories.UserNameProof.build({ name: Buffer.from("net") });
      const fnameProof2 = Factories.UserNameProof.build({ name: Buffer.from("network") });
      const syncId = SyncId.fromFName(fnameProof);
      const syncId2 = SyncId.fromFName(fnameProof2);
      expect(syncId.syncId().length).toEqual(syncId2.syncId().length);
      expect(syncId.syncId().length).toEqual(TIMESTAMP_LENGTH + 1 + FID_BYTES + 20);

      const unpackedSyncId = syncId.unpack() as FNameSyncId;
      const unpackedSyncId2 = syncId2.unpack() as FNameSyncId;
      expect(Buffer.from(unpackedSyncId.name)).toEqual(Buffer.from("net"));
      expect(Buffer.from(unpackedSyncId2.name)).toEqual(Buffer.from("network"));
    });

    test("handles names that end with 0", async () => {
      const fnameProof = Factories.UserNameProof.build({ name: Buffer.from("net00") });
      const unpackedSyncId = SyncId.fromFName(fnameProof).unpack() as FNameSyncId;
      expect(Buffer.from(unpackedSyncId.name)).toEqual(Buffer.from("net00"));
      expect(unpackedSyncId.padded).toEqual(true);
    });

    test("handles max length names", async () => {
      const fnameProof = Factories.UserNameProof.build({ name: Buffer.from("iamaverylongname.eth") });
      const unpackedSyncId = SyncId.fromFName(fnameProof).unpack() as FNameSyncId;
      expect(Buffer.from(unpackedSyncId.name).length).toEqual(validations.USERNAME_MAX_LENGTH);
      expect(Buffer.from(unpackedSyncId.name)).toEqual(Buffer.from("iamaverylongname.eth"));
      expect(unpackedSyncId.padded).toEqual(false);
    });

    test("works if names are longer than expected", async () => {
      const fnameProof = Factories.UserNameProof.build({ name: Buffer.from("iamaverylongname.eth.toolong") });
      const unpackedSyncId = SyncId.fromFName(fnameProof).unpack() as FNameSyncId;
      expect(Buffer.from(unpackedSyncId.name)).toEqual(Buffer.from("iamaverylongname.eth.toolong"));
      expect(unpackedSyncId.padded).toEqual(false);
    });
  });

  describe("OnChainEvent syncIds", () => {
    test("creates and unpacks correctly from message", async () => {
      const onChainEvent = Factories.IdRegistryOnChainEvent.build();
      const syncId = SyncId.fromOnChainEvent(onChainEvent);
      expect(syncId.type()).toEqual(SyncIdType.OnChainEvent);
      const unpackedSyncId = syncId.unpack() as OnChainEventSyncId;
      expect(unpackedSyncId.type).toEqual(SyncIdType.OnChainEvent);
      expect(unpackedSyncId.eventType).toEqual(OnChainEventType.EVENT_TYPE_ID_REGISTER);
      expect(unpackedSyncId.fid).toEqual(onChainEvent.fid);
      expect(unpackedSyncId.blockNumber).toEqual(onChainEvent.blockNumber);
      expect(unpackedSyncId.logIndex).toEqual(onChainEvent.logIndex);
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
