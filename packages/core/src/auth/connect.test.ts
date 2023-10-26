import { validate, parseFid, verify, build } from "./connect";
import { HubError } from "../errors";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { PublicClient, zeroAddress } from "viem";
import { defaultL2PublicClient } from "../eth/clients";
import { jest } from "@jest/globals";

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);
const publicClient = defaultL2PublicClient as PublicClient;

const siweParams = {
  domain: "example.com",
  address: "0x63C378DDC446DFf1d831B9B96F7d338FE6bd4231",
  uri: "https://example.com/login",
  version: "1",
  nonce: "12345678",
  issuedAt: "2023-10-01T00:00:00.000Z",
};

const connectParams = {
  ...siweParams,
  statement: "Farcaster Connect",
  chainId: 10,
  resources: ["farcaster://fid/1234"],
};

afterEach(async () => {
  jest.restoreAllMocks();
});

describe("build", () => {
  test("adds connect-specific parameters", () => {
    const result = build({
      ...siweParams,
      fid: 5678,
      userData: ["pfp", "display", "username"],
    });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({
      ...siweParams,
      statement: "Farcaster Connect",
      chainId: 10,
      resources: ["farcaster://fid/5678", "farcaster://fid/5678/userdata?pfp&display&username"],
    });
  });

  test("handles empty userData", () => {
    const result = build({
      ...siweParams,
      fid: 5678,
    });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({
      ...siweParams,
      statement: "Farcaster Connect",
      chainId: 10,
      resources: ["farcaster://fid/5678"],
    });
  });

  test("handles additional resources", () => {
    const result = build({
      ...siweParams,
      fid: 5678,
      resources: ["https://example.com/resource"],
    });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toMatchObject({
      ...siweParams,
      statement: "Farcaster Connect",
      chainId: 10,
      resources: ["farcaster://fid/5678", "https://example.com/resource"],
    });
  });
});

describe("validate", () => {
  test("default parameters are valid", () => {
    const result = validate(connectParams);
    expect(result.isOk()).toBe(true);
  });

  test("propagates SIWE message errors", () => {
    const result = validate({
      ...connectParams,
      address: "Invalid address",
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().errCode).toEqual("bad_request.validation_failure");
    expect(result._unsafeUnwrapErr().message).toMatch("invalid address");
  });

  test("message must contain 'Farcaster Connect'", () => {
    const result = validate({
      ...connectParams,
      statement: "Invalid statement",
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError("bad_request.validation_failure", "Invalid statement"));
  });

  test("message must include chainId 10", () => {
    const result = validate({
      ...connectParams,
      chainId: 1,
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError("bad_request.validation_failure", "Chain ID must be 10"));
  });

  test("message must include FID resource", () => {
    const result = validate({
      ...connectParams,
      resources: [],
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError("bad_request.validation_failure", "No fid resource found"));
  });

  test("message must only include one FID resource", () => {
    const result = validate({
      ...connectParams,
      resources: ["farcaster://fid/1", "farcaster://fid/2"],
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError("bad_request.validation_failure", "Multiple fid resources"));
  });
});

describe("parseFid", () => {
  test("parses fid from valid message", () => {
    const message = validate({
      ...connectParams,
      resources: ["farcaster://fid/42"],
    });
    const result = parseFid(message._unsafeUnwrap());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(42);
  });
});

describe("verify", () => {
  test("verifies valid messages", async () => {
    jest.spyOn(publicClient, "readContract").mockImplementation(() => {
      return Promise.resolve(1234n);
    });

    const res = build({
      ...siweParams,
      address: account.address,
      fid: 1234,
    });
    const message = res._unsafeUnwrap();
    const sig = await account.signMessage({ message: message.toMessage() });
    const result = await verify(message, sig);
    expect(result.isOk()).toBe(true);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      data: message,
      success: true,
      fid: 1234,
    });
  });

  test("invalid SIWE message", async () => {
    jest.spyOn(publicClient, "readContract").mockImplementation(() => {
      return Promise.resolve(1234n);
    });

    const message = build({
      ...siweParams,
      address: zeroAddress,
      fid: 1234,
    });
    const sig = await account.signMessage({ message: message._unsafeUnwrap().toMessage() });
    const result = await verify(message._unsafeUnwrap(), sig);
    expect(result.isOk()).toBe(false);
    const err = result._unsafeUnwrapErr();
    expect(err.errCode).toBe("unauthorized");
    expect(err.message).toBe("Signature does not match address of the message.");
  });

  test("invalid fid owner", async () => {
    jest.spyOn(publicClient, "readContract").mockImplementation(() => {
      return Promise.resolve(5678n);
    });

    const message = build({
      ...siweParams,
      address: account.address,
      fid: 1234,
    });
    const sig = await account.signMessage({ message: message._unsafeUnwrap().toMessage() });
    const result = await verify(message._unsafeUnwrap(), sig);
    expect(result.isOk()).toBe(false);
    const err = result._unsafeUnwrapErr();
    expect(err.errCode).toBe("unauthorized");
    expect(err.message).toBe("Invalid resource: signer is not owner of fid.");
  });

  test("client error", async () => {
    jest.spyOn(publicClient, "readContract").mockRejectedValue(new Error("client error"));

    const message = build({
      ...siweParams,
      address: account.address,
      fid: 1234,
    });
    const sig = await account.signMessage({ message: message._unsafeUnwrap().toMessage() });
    const result = await verify(message._unsafeUnwrap(), sig);
    expect(result.isOk()).toBe(false);
    const err = result._unsafeUnwrapErr();
    expect(err.errCode).toBe("unavailable.network_failure");
    expect(err.message).toBe("client error");
  });
});
