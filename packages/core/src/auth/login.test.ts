import { SiweError, SiweErrorType } from "siwe";
import { build, parseFid, verify } from "./login";
import { HubError } from "../errors";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { zeroAddress } from "viem";

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

const validParams = {
  domain: "example.com",
  statement: "Log in With Farcaster",
  address: "0x63C378DDC446DFf1d831B9B96F7d338FE6bd4231",
  uri: "https://example.com/login",
  version: "1",
  nonce: "12345678",
  issuedAt: "2023-10-01T00:00:00.000Z",
  chainId: 10,
  resources: ["farcaster://fids/1234"],
};

describe("build", () => {
  test("default parameters are valid", () => {
    const result = build(validParams);
    expect(result.isOk()).toBe(true);
  });

  test("propagates SIWE message errors", () => {
    const result = build({
      ...validParams,
      address: "Invalid address",
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr().errCode).toEqual("bad_request.validation_failure");
    expect(result._unsafeUnwrapErr().message).toMatch("invalid address");
  });

  test("message must contain 'Log in With Farcaster'", () => {
    const result = build({
      ...validParams,
      statement: "Invalid statement",
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError("bad_request.validation_failure", "Invalid statement"));
  });

  test("message must include chainId 10", () => {
    const result = build({
      ...validParams,
      chainId: 1,
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError("bad_request.validation_failure", "Chain ID must be 10"));
  });

  test("message must include FID resource", () => {
    const result = build({
      ...validParams,
      resources: [],
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError("bad_request.validation_failure", "No fid resource found"));
  });

  test("message must only include one FID resource", () => {
    const result = build({
      ...validParams,
      resources: ["farcaster://fids/1", "farcaster://fids/2"],
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError("bad_request.validation_failure", "Multiple fid resources"));
  });
});

describe("parseFid", () => {
  test("parses fid from valid message", () => {
    const message = build({
      ...validParams,
      resources: ["farcaster://fids/42"],
    });
    const result = parseFid(message._unsafeUnwrap());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(42);
  });

  test("parses fid from valid message", () => {
    const message = build({
      ...validParams,
      resources: ["farcaster://fids/42"],
    });
    const result = parseFid(message._unsafeUnwrap());
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toEqual(42);
  });
});

describe("verify", () => {
  test("verifies valid messages", async () => {
    const res = build({
      ...validParams,
      address: account.address,
    });
    const message = res._unsafeUnwrap();
    const sig = await account.signMessage({ message: message.toMessage() });
    const result = await verify(message, sig);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      data: message,
      success: true,
      fid: 1234,
    });
  });

  test("invalid message", async () => {
    const message = build({
      ...validParams,
      address: zeroAddress,
    });
    const sig = await account.signMessage({ message: message._unsafeUnwrap().toMessage() });
    const result = await verify(message._unsafeUnwrap(), sig);
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      data: message._unsafeUnwrap(),
      success: false,
      error: new SiweError(SiweErrorType.INVALID_SIGNATURE, account.address, `Resolved address to be ${zeroAddress}`),
      fid: 1234,
    });
  });
});
