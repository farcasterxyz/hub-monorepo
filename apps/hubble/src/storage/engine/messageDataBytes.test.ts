import {
  CastAddMessage,
  Factories,
  FarcasterNetwork,
  Message,
  MessageData,
  OnChainEvent,
  bytesCompare,
  bytesDecrement,
} from "@farcaster/hub-nodejs";
import {
  ensureMessageData,
  makeMessagePrimaryKeyFromMessage,
  makeUserKey,
  messageDecode,
  messageEncode,
} from "../db/message.js";
import { jestRocksDB } from "../db/jestUtils.js";
import Engine from "./index.js";
import { blake3Truncate160 } from "../../utils/crypto.js";
import { UserPostfix } from "../db/types.js";

const db = jestRocksDB("protobufs.messageDataBytes.test");
const network = FarcasterNetwork.TESTNET;
const engine = new Engine(db, network);
const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let castAdd: CastAddMessage;

const cloneMessage = (message: Message): Message => {
  return Message.decode(Message.encode(message).finish());
};

describe("messageDataBytes", () => {
  beforeAll(async () => {
    castAdd = await Factories.CastAddMessage.create({
      data: { fid, network, castAddBody: { text: "This is a cast" } },
    });
  });

  test("encode decode test", async () => {
    const encoded = messageEncode(castAdd);
    const decoded = messageDecode(encoded);

    expect(Message.toJSON(decoded)).toEqual(Message.toJSON(castAdd));
  });

  test("message data bytes to message.data", async () => {
    const castAddClone = cloneMessage(castAdd);
    castAddClone.data = undefined;
    castAddClone.dataBytes = MessageData.encode(castAdd.data).finish();

    const decoded = messageDecode(Message.encode(castAddClone).finish());
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    expect(MessageData.toJSON(decoded.data!)).toEqual(MessageData.toJSON(castAdd.data));
  });

  test("ensure message.data", async () => {
    const castAddClone = cloneMessage(castAdd);
    castAddClone.data = undefined;
    castAddClone.dataBytes = MessageData.encode(castAdd.data).finish();

    const ensured = ensureMessageData(castAddClone);
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    expect(MessageData.toJSON(ensured.data!)).toEqual(MessageData.toJSON(castAdd.data));
  });

  describe("With engine", () => {
    let castAdd: CastAddMessage;
    let custodyEvent: OnChainEvent;
    let signerEvent: OnChainEvent;
    let storageEvent: OnChainEvent;

    beforeAll(async () => {
      const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
      const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
      custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid }, { transient: { to: custodySignerKey } });
      signerEvent = Factories.SignerOnChainEvent.build({ fid }, { transient: { signer: signerKey } });
      storageEvent = Factories.StorageRentOnChainEvent.build({ fid });

      castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
    });

    beforeEach(async () => {
      await engine.mergeOnChainEvent(custodyEvent);
      await engine.mergeOnChainEvent(signerEvent);
      await engine.mergeOnChainEvent(storageEvent);
    });

    test("merges with dataBytes", async () => {
      const castAddClone = cloneMessage(castAdd);
      castAddClone.data = undefined;
      castAddClone.dataBytes = MessageData.encode(castAdd.data).finish();

      // Try and merge
      const result = await engine.mergeMessage(ensureMessageData(castAddClone));
      expect(result.isOk()).toBeTruthy();

      // Make sure that in the DB, the data field is erased, and only data bytes exist
      const castAddKey = makeMessagePrimaryKeyFromMessage(castAddClone);
      const castAddBytes = await db.get(castAddKey);
      expect(castAddBytes).toBeDefined();

      const castAddDecoded = Message.decode(castAddBytes);
      expect(castAddDecoded.data).toBeUndefined();
      expect(bytesCompare(castAddDecoded.dataBytes as Uint8Array, castAddClone.dataBytes as Uint8Array)).toEqual(0);

      // Then, get it via the engine. The castAdd should be fetched correctly and the data body should be populated
      const fetched = await engine.getCast(fid, castAdd.hash);

      expect(fetched.isOk()).toBeTruthy();
      expect(fetched._unsafeUnwrap()).toBeDefined();
      expect(MessageData.toJSON(fetched._unsafeUnwrap().data)).toEqual(MessageData.toJSON(castAdd.data));
    });

    test("fails without ensureData", async () => {
      const castAddClone = cloneMessage(castAdd);
      castAddClone.data = undefined;
      castAddClone.dataBytes = MessageData.encode(castAdd.data).finish();

      // Try and merge without calling ensureMessageData. This will fail
      const result = await engine.mergeMessage(castAddClone);
      expect(result.isErr()).toBeTruthy();
      expect(result._unsafeUnwrapErr().message).toContain("message data is missing");
    });

    test("data sizes should match", async () => {
      const castAddClone = cloneMessage(castAdd);
      castAddClone.dataBytes = MessageData.encode(castAdd.data).finish();

      const encodedBytesNoData = messageEncode(castAddClone);
      const encodedBytesDefault = Message.encode(castAdd).finish();

      expect(encodedBytesNoData.length).toEqual(encodedBytesDefault.length);
    });

    test("fails if hash doesn't match", async () => {
      const castAddClone = cloneMessage(castAdd);
      castAddClone.hash = new Uint8Array([0, 0, 0, 0]);
      castAddClone.dataBytes = MessageData.encode(castAdd.data).finish();

      const result = await engine.mergeMessage(castAddClone);
      expect(result.isErr()).toBeTruthy();
      expect(result._unsafeUnwrapErr().message).toContain("invalid hash");

      // Change the hash
      castAddClone.hash = bytesDecrement(castAdd.hash)._unsafeUnwrap();
      const result2 = await engine.mergeMessage(castAddClone);
      expect(result2.isErr()).toBeTruthy();
      expect(result2._unsafeUnwrapErr().message).toContain("invalid hash");

      // Change the data bytes
      castAddClone.hash = castAdd.hash;
      castAddClone.dataBytes = new Uint8Array([0, 0, 0, 0]);
      const result3 = await engine.mergeMessage(castAddClone);
      expect(result3.isErr()).toBeTruthy();
      expect(result3._unsafeUnwrapErr().message).toContain("invalid hash");
    });

    test("fails if dataBytes is > 2048 bytes", async () => {
      const castAddClone = cloneMessage(castAdd);
      castAddClone.dataBytes = new Uint8Array(2049);

      const result = await engine.mergeMessage(castAddClone);
      expect(result.isErr()).toBeTruthy();
      expect(result._unsafeUnwrapErr().message).toContain("dataBytes > 2048 bytes");
    });

    // This function re-encodes the fid with a different varint encoding, simulating what
    // the Rust code would do.
    const reencodeFidWithDifferentVarInt = (messageData: MessageData): Buffer => {
      // Step 1: Encode the original message
      const bytes = MessageData.encode(messageData).finish();

      // Step 2: Find the varint bytes for the 'fid' field
      const fidKey = 16; // 2 << 3 | 0
      let index = -1;

      for (let i = 0; i < bytes.length; i++) {
        if (bytes[i] === fidKey) {
          index = i + 1; // potentially where the varint bytes start
          break;
        }
      }

      if (index === -1) {
        console.log("Field not found");
        return Buffer.from([]);
      }

      // Extract the varint bytes of fid
      let varintEndIndex = index;
      while ((bytes[varintEndIndex] as number) > 127) {
        varintEndIndex++;
      }
      varintEndIndex++; // Include the last byte, whose MSB should be 0

      // const originalVarintBytes = bytes.slice(index, varintEndIndex);

      // Step 3: Replace the varint bytes (hacky example)
      // WARNING: This is a hacky way to manually manipulate the varint encoding.
      // Only do this in tests.
      const newVarintBytes = [];
      let value = fid;
      while (value >= 0x80) {
        newVarintBytes.push((value & 0x7f) | 0x80);
        value >>>= 7;
      }
      newVarintBytes.push(value);

      // Add leading zero to the most significant byte
      newVarintBytes[newVarintBytes.length - 1] |= 0x80;
      newVarintBytes.push(0x00);

      // Create the new bytes array with the alternative varint encoding for fid
      const newBytes = Buffer.concat([bytes.slice(0, index), Buffer.from(newVarintBytes), bytes.slice(varintEndIndex)]);

      // Decode and verify
      // const decodedMsg = MessageData.decode(newBytes);
      // console.log("Decoded message: ", decodedMsg);

      return newBytes;
    };

    test("varint encoding", async () => {
      const changedDataBytes = reencodeFidWithDifferentVarInt(castAdd.data);
      expect(bytesCompare(changedDataBytes, MessageData.encode(castAdd.data).finish()) !== 0).toBeTruthy();

      const castAddClone = cloneMessage(castAdd);
      castAddClone.data = undefined;
      castAddClone.dataBytes = changedDataBytes;
      castAddClone.hash = blake3Truncate160(changedDataBytes);

      // Try and merge. This has a different varint encoding for the fid field
      // like the one that would be produced by the Rust code.
      // But we've not updated the signature, so this will fail
      const result = await engine.mergeMessage(ensureMessageData(castAddClone));
      expect(result.isErr()).toBeTruthy();
      expect(result._unsafeUnwrapErr().message).toContain("invalid signature");

      // Update the signature, and then merge
      castAddClone.signature = (await signer.signMessageHash(castAddClone.hash))._unsafeUnwrap();
      const result2 = await engine.mergeMessage(ensureMessageData(castAddClone));
      expect(result2.isOk()).toBeTruthy();

      const fetched = await engine.getCast(fid, castAddClone.hash);
      expect(fetched.isOk()).toBeTruthy();
      expect(MessageData.toJSON(fetched._unsafeUnwrap().data)).toEqual(MessageData.toJSON(castAdd.data));
    });
  });
});
