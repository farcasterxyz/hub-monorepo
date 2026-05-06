import { Factories } from "../factories";
import * as protobufs from "./generated/message";
import {
  isKeyAddData,
  isKeyAddMessage,
  isKeyRemoveData,
  isKeyRemoveMessage,
  isLendStorageData,
  isLendStorageMessage,
} from "./typeguards";

describe("typeguards", () => {
  describe("LendStorage", () => {
    test("isLendStorageData returns true for matching MessageData", () => {
      const data = Factories.LendStorageData.build();
      expect(isLendStorageData(data)).toBe(true);
    });

    test("isLendStorageData returns false when type is wrong", () => {
      const data = Factories.LendStorageData.build({ type: protobufs.MessageType.CAST_ADD });
      expect(isLendStorageData(data)).toBe(false);
    });

    test("isLendStorageData returns false when body is missing", () => {
      const data = Factories.LendStorageData.build({ lendStorageBody: undefined });
      expect(isLendStorageData(data)).toBe(false);
    });

    test("isLendStorageMessage returns true for ED25519-signed message", async () => {
      const message = await Factories.LendStorageMessage.create();
      expect(isLendStorageMessage(message)).toBe(true);
    });

    test("isLendStorageMessage returns false when signatureScheme is not ED25519", async () => {
      const message = await Factories.LendStorageMessage.create();
      message.signatureScheme = protobufs.SignatureScheme.EIP712;
      expect(isLendStorageMessage(message)).toBe(false);
    });
  });

  describe("KeyAdd", () => {
    test("isKeyAddData returns true for matching MessageData", () => {
      const data = Factories.KeyAddData.build();
      expect(isKeyAddData(data)).toBe(true);
    });

    test("isKeyAddData returns false when type is wrong", () => {
      const data = Factories.KeyAddData.build({ type: protobufs.MessageType.CAST_ADD });
      expect(isKeyAddData(data)).toBe(false);
    });

    test("isKeyAddData returns false when body is missing", () => {
      const data = Factories.KeyAddData.build({ keyAddBody: undefined });
      expect(isKeyAddData(data)).toBe(false);
    });

    test("isKeyAddData returns false when an unrelated body is set", () => {
      const data = Factories.CastAddData.build();
      expect(isKeyAddData(data)).toBe(false);
    });

    test("isKeyAddMessage returns true for ED25519-signed message", async () => {
      const message = await Factories.KeyAddMessage.create();
      expect(isKeyAddMessage(message)).toBe(true);
    });

    test("isKeyAddMessage returns false when signatureScheme is not ED25519", async () => {
      const message = await Factories.KeyAddMessage.create();
      message.signatureScheme = protobufs.SignatureScheme.EIP712;
      expect(isKeyAddMessage(message)).toBe(false);
    });
  });

  describe("KeyRemove", () => {
    test("isKeyRemoveData returns true for matching MessageData", () => {
      const data = Factories.KeyRemoveData.build();
      expect(isKeyRemoveData(data)).toBe(true);
    });

    test("isKeyRemoveData returns false when type is wrong", () => {
      const data = Factories.KeyRemoveData.build({ type: protobufs.MessageType.KEY_ADD });
      expect(isKeyRemoveData(data)).toBe(false);
    });

    test("isKeyRemoveData returns false when body is missing", () => {
      const data = Factories.KeyRemoveData.build({ keyRemoveBody: undefined });
      expect(isKeyRemoveData(data)).toBe(false);
    });

    test("isKeyRemoveMessage returns true for ED25519-signed message", async () => {
      const message = await Factories.KeyRemoveMessage.create();
      expect(isKeyRemoveMessage(message)).toBe(true);
    });

    test("isKeyRemoveMessage returns false when signatureScheme is not ED25519", async () => {
      const message = await Factories.KeyRemoveMessage.create();
      message.signatureScheme = protobufs.SignatureScheme.EIP712;
      expect(isKeyRemoveMessage(message)).toBe(false);
    });

    test("isKeyRemoveMessage discriminates from KeyAdd", async () => {
      const keyAdd = await Factories.KeyAddMessage.create();
      expect(isKeyRemoveMessage(keyAdd)).toBe(false);
      expect(isKeyAddMessage(keyAdd)).toBe(true);
    });
  });
});
