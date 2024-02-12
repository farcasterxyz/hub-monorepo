import * as protobufs from "./protobufs";
import { ok } from "neverthrow";
import { Factories } from "./factories";
import * as validations from "./validations";

describe("CastAddMessageFactory", () => {
  test("generates a valid CastAdd", async () => {
    const message = await Factories.CastAddMessage.create();
    expect(protobufs.isCastAddMessage(message)).toBeTruthy();
    await expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });

  test("generates new data each time", async () => {
    const message1 = await Factories.CastAddMessage.create();
    const message2 = await Factories.CastAddMessage.create();
    expect(message1.data.castAddBody.text).not.toEqual(message2.data.castAddBody.text);
    expect(message1.hash).not.toEqual(message2.hash);
  });
});

describe("CastRemoveMessageFactory", () => {
  test("generates a valid CastRemove", async () => {
    const message = await Factories.CastRemoveMessage.create();
    expect(protobufs.isCastRemoveMessage(message)).toBeTruthy();
    await expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe("ReactionAddMessageFactory", () => {
  test("generates a valid ReactionAdd", async () => {
    const message = await Factories.ReactionAddMessage.create();
    expect(protobufs.isReactionAddMessage(message)).toBeTruthy();
    await expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe("ReactionRemoveMessageFactory", () => {
  test("generates a valid ReactionRemove", async () => {
    const message = await Factories.ReactionRemoveMessage.create();
    expect(protobufs.isReactionRemoveMessage(message)).toBeTruthy();
    await expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe("LinkAddMessageFactory", () => {
  test("generates a valid LinkAdd", async () => {
    const message = await Factories.LinkAddMessage.create();
    expect(protobufs.isLinkAddMessage(message)).toBeTruthy();
    await expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe("LinkRemoveMessageFactory", () => {
  test("generates a valid LinkRemove", async () => {
    const message = await Factories.LinkRemoveMessage.create();
    expect(protobufs.isLinkRemoveMessage(message)).toBeTruthy();
    await expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe("VerificationAddEthAddressMessageFactory", () => {
  test("generates a valid VerificationAddEthAddress", async () => {
    const message = await Factories.VerificationAddEthAddressMessage.create();
    expect(protobufs.isVerificationAddAddressMessage(message)).toBeTruthy();
    await expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe("VerificationAddSolAddressMessageFactory", () => {
  test("generates a valid VerificationAddSolAddress", async () => {
    const message = await Factories.VerificationAddSolAddressMessage.create();
    expect(protobufs.isVerificationAddAddressMessage(message)).toBeTruthy();
    await expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe("VerificationRemoveMessageFactory", () => {
  test("generates a valid VerificationRemove", async () => {
    const message = await Factories.VerificationRemoveMessage.create();
    expect(protobufs.isVerificationRemoveMessage(message)).toBeTruthy();
    await expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe("UserDataAddMessageFactory", () => {
  test("generates a valid UserDataAdd", async () => {
    const message = await Factories.UserDataAddMessage.create();
    expect(protobufs.isUserDataAddMessage(message)).toBeTruthy();
    await expect(validations.validateMessage(message)).resolves.toEqual(ok(message));
  });
});

describe("StorageRentOnChainEventFactory", () => {
  test("succeeds", () => {
    const event = Factories.StorageRentOnChainEvent.build();
    const encoded = protobufs.OnChainEvent.encode(event).finish();
    const decoded = protobufs.OnChainEvent.decode(encoded);
    expect(protobufs.OnChainEvent.toJSON(decoded)).toEqual(protobufs.OnChainEvent.toJSON(event));
  });
});
