import { validate, parseFid, verify, build } from "./connect";
import { HubError } from "../errors";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { Hex, zeroAddress } from "viem";
import { getDefaultProvider } from "ethers";
import { SiweMessage } from "siwe";

const privateKey = generatePrivateKey();
const account = privateKeyToAccount(privateKey);

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

describe("build", () => {
  test("adds connect-specific parameters", () => {
    const result = build({
      ...siweParams,
      fid: 5678,
      userDataParams: ["pfp", "display", "username"],
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
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError("bad_request.validation_failure", "Statement must be 'Farcaster Connect'"),
    );
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
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError("bad_request.validation_failure", "No fid resource provided"),
    );
  });

  test("message must only include one FID resource", () => {
    const result = validate({
      ...connectParams,
      resources: ["farcaster://fid/1", "farcaster://fid/2"],
    });
    expect(result.isErr()).toBe(true);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError("bad_request.validation_failure", "Multiple fid resources provided"),
    );
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
  test("verifies valid EOA signatures", async () => {
    const fidVerifier = (_custody: Hex) => Promise.resolve(1234n);

    const res = build({
      ...siweParams,
      address: account.address,
      fid: 1234,
    });
    const message = res._unsafeUnwrap();
    const sig = await account.signMessage({ message: message.toMessage() });
    const result = await verify(message, sig, { fidVerifier });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      data: message,
      success: true,
      fid: 1234,
    });
  });

  test("adds parsed resources to response", async () => {
    const fidVerifier = (_custody: Hex) => Promise.resolve(1234n);

    const res = build({
      ...siweParams,
      address: account.address,
      fid: 1234,
      userDataParams: ["bio", "pfp", "display"],
    });
    const message = res._unsafeUnwrap();
    const sig = await account.signMessage({ message: message.toMessage() });
    const result = await verify(message, sig, { fidVerifier });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      data: message,
      success: true,
      fid: 1234,
      userDataParams: ["bio", "pfp", "display"],
    });
  });

  test("omits mismatched userdata", async () => {
    const fidVerifier = (_custody: Hex) => Promise.resolve(1234n);

    const message = new SiweMessage({
      ...connectParams,
      address: account.address,
      resources: ["farcaster://fid/1234", "farcaster://fid/5678/userdata?pfp&display&username"],
    });
    const sig = await account.signMessage({ message: message.toMessage() });
    const result = await verify(message, sig, { fidVerifier });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      data: message,
      success: true,
      fid: 1234,
    });
  });

  test("omits userdata with invalid parameters", async () => {
    const fidVerifier = (_custody: Hex) => Promise.resolve(1234n);

    const message = new SiweMessage({
      ...connectParams,
      address: account.address,
      resources: ["farcaster://fid/1234", "farcaster://fid/1234/userdata?invalid&param"],
    });
    const sig = await account.signMessage({ message: message.toMessage() });
    const result = await verify(message, sig, { fidVerifier });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      data: message,
      success: true,
      fid: 1234,
    });
  });

  test("verifies valid 1271 signatures", async () => {
    const fidVerifier = (_custody: Hex) => Promise.resolve(1234n);
    const provider = getDefaultProvider(10);

    const res = build({
      ...siweParams,
      address: "0xC89858205c6AdDAD842E1F58eD6c42452671885A",
      fid: 1234,
    });
    const message = res._unsafeUnwrap();
    const sig = await account.signMessage({ message: message.toMessage() });
    const result = await verify(message, sig, { fidVerifier, provider });
    expect(result.isOk()).toBe(true);
    expect(result._unsafeUnwrap()).toStrictEqual({
      data: message,
      success: true,
      fid: 1234,
    });
  });

  test("1271 signatures fail without provider", async () => {
    const fidVerifier = (_custody: Hex) => Promise.resolve(1234n);

    const res = build({
      ...siweParams,
      address: "0xC89858205c6AdDAD842E1F58eD6c42452671885A",
      fid: 1234,
    });
    const message = res._unsafeUnwrap();
    const sig = await account.signMessage({ message: message.toMessage() });
    const result = await verify(message, sig, { fidVerifier });
    expect(result.isOk()).toBe(false);
    const err = result._unsafeUnwrapErr();
    expect(err.errCode).toBe("unauthorized");
    expect(err.message).toBe("Signature does not match address of the message.");
  });

  test("invalid SIWE message", async () => {
    const fidVerifier = (_custody: Hex) => Promise.resolve(1234n);

    const message = build({
      ...siweParams,
      address: zeroAddress,
      fid: 1234,
    });
    const sig = await account.signMessage({ message: message._unsafeUnwrap().toMessage() });
    const result = await verify(message._unsafeUnwrap(), sig, { fidVerifier });
    expect(result.isOk()).toBe(false);
    const err = result._unsafeUnwrapErr();
    expect(err.errCode).toBe("unauthorized");
    expect(err.message).toBe("Signature does not match address of the message.");
  });

  test("invalid fid owner", async () => {
    const fidVerifier = (_custody: Hex) => Promise.resolve(5678n);

    const message = build({
      ...siweParams,
      address: account.address,
      fid: 1234,
    });
    const sig = await account.signMessage({ message: message._unsafeUnwrap().toMessage() });
    const result = await verify(message._unsafeUnwrap(), sig, { fidVerifier });
    expect(result.isOk()).toBe(false);
    const err = result._unsafeUnwrapErr();
    expect(err.errCode).toBe("unauthorized");
    expect(err.message).toBe(`Invalid resource: signer ${account.address} does not own fid 1234.`);
  });

  test("client error", async () => {
    const fidVerifier = (_custody: Hex) => Promise.reject(new Error("client error"));

    const message = build({
      ...siweParams,
      address: account.address,
      fid: 1234,
    });
    const sig = await account.signMessage({ message: message._unsafeUnwrap().toMessage() });
    const result = await verify(message._unsafeUnwrap(), sig, { fidVerifier });
    expect(result.isOk()).toBe(false);
    const err = result._unsafeUnwrapErr();
    expect(err.errCode).toBe("unavailable.network_failure");
    expect(err.message).toBe("client error");
  });

  test("missing verifier", async () => {
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
    expect(err.message).toBe("Not implemented: Must provide an fid verifier");
  });
});
