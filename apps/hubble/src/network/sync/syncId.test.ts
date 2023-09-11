import { Factories, FarcasterNetwork, Message } from "@farcaster/hub-nodejs";
import { SyncId } from "./syncId.js";
import { makeMessagePrimaryKeyFromMessage } from "../../storage/db/message.js";
import { describe, test, expect, beforeAll } from "vitest";

let message: Message;

const network = FarcasterNetwork.TESTNET;
const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();

beforeAll(async () => {
  message = await Factories.CastAddMessage.create();
});

describe("SyncId", () => {
  test("succeeds", async () => {
    const syncId = new SyncId(message).syncId();
    expect(syncId).toBeDefined();
  });

  test("Test pkFromSyncId", async () => {
    // Create a new castAdd
    const castAdd1 = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
    expect(makeMessagePrimaryKeyFromMessage(castAdd1)).toEqual(SyncId.pkFromSyncId(new SyncId(castAdd1).syncId()));
  });
});
