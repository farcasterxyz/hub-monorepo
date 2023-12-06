import { RelayServer } from "./server.js";
import axios from "axios";
import { jest } from "@jest/globals";

let httpServer: RelayServer;
let httpServerAddress: string;

const http = axios.create({
  validateStatus: () => true,
});

function getFullUrl(path: string) {
  return `${httpServerAddress}${path}`;
}

beforeAll(async () => {
  httpServer = new RelayServer({
    redisUrl: "redis://localhost:16379",
    ttl: 60,
    corsOrigin: "*",
  });
  httpServerAddress = (await httpServer.start())._unsafeUnwrap();
});

afterAll(async () => {
  await httpServer.stop();
});

afterEach(async () => {
  jest.restoreAllMocks();
});

describe("relay server", () => {
  const connectParams = {
    siweUri: "https://example.com",
    domain: "example.com",
  };

  const authenticateParams = {
    message: "example.com wants you to sign in with your Ethereum account: [...]",
    signature:
      "0x9335c30585854d1bd7040dccfbb18bfecc9eba6ee18c55a3996ef0aca783fba832b13b05dc09beec99fc6477804113fd293c68c84ea350a11794cdc121c71fd51b",
    fid: 1,
    username: "alice",
    bio: "I'm a little teapot who didn't fill out my bio",
    displayName: "Alice Teapot",
    pfpUrl: "https://example.com/alice.png",
  };

  describe("cors", () => {
    test("allows cross-origin requests", async () => {
      const response = await http.get(getFullUrl("/healthcheck"), {
        headers: { Origin: "http://example.com" },
      });

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });
  });

  describe("/healthcheck", () => {
    test("GET returns status", async () => {
      const response = await http.get(getFullUrl("/healthcheck"));

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual({ status: "OK" });
    });
  });

  describe("/v1/connect", () => {
    test("POST creates a channel", async () => {
      const response = await http.post(getFullUrl("/v1/connect"), connectParams);

      expect(response.status).toBe(201);
      const { channelToken, connectURI, ...rest } = response.data;
      expect(channelToken).toMatch(/[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}/);
      expect(rest).toStrictEqual({});
    });

    test("creates a channel with extra SIWE parameters", async () => {
      const notBefore = "2023-01-01T00:00:00Z";
      const expirationTime = "2023-12-31T00:00:00Z";
      const requestId = "some-request-id";
      const response = await http.post(getFullUrl("/v1/connect"), {
        ...connectParams,
        notBefore,
        expirationTime,
        requestId,
      });

      expect(response.status).toBe(201);
      const { channelToken, connectURI, ...rest } = response.data;
      // parse query params from URI
      const params = new URLSearchParams(connectURI.split("?")[1]);
      expect(params.get("siweUri")).toBe(connectParams.siweUri);
      expect(params.get("domain")).toBe(connectParams.domain);
      expect(params.get("notBefore")).toBe(notBefore);
      expect(params.get("expirationTime")).toBe(expirationTime);
      expect(params.get("requestId")).toBe(requestId);
      expect(channelToken).toMatch(/[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}/);
      expect(rest).toStrictEqual({});
    });

    test("validates extra SIWE parameters", async () => {
      const notBefore = "not a datetime";
      const response = await http.post(getFullUrl("/v1/connect"), {
        ...connectParams,
        notBefore,
      });

      expect(response.status).toBe(400);
      expect(response.data).toStrictEqual({
        error: "Bad Request",
        message: 'body/notBefore must match format "date-time"',
      });
    });

    test("missing siweUri", async () => {
      const { siweUri, ...missingUri } = connectParams;
      const response = await http.post(getFullUrl("/v1/connect"), missingUri);

      expect(response.status).toBe(400);
      expect(response.data).toStrictEqual({
        error: "Bad Request",
        message: "body must have required property 'siweUri'",
      });
    });

    test("invalid siweUri", async () => {
      const response = await http.post(getFullUrl("/v1/connect"), {
        ...connectParams,
        siweUri: "not-a-uri",
      });

      expect(response.status).toBe(400);
      expect(response.data).toStrictEqual({
        error: "Bad Request",
        message: 'body/siweUri must match format "uri"',
      });
    });

    test("missing domain", async () => {
      const { domain, ...missingDomain } = connectParams;
      const response = await http.post(getFullUrl("/v1/connect"), missingDomain);

      expect(response.status).toBe(400);
      expect(response.data).toStrictEqual({
        error: "Bad Request",
        message: "body must have required property 'domain'",
      });
    });

    test("invalid domain", async () => {
      const response = await http.post(getFullUrl("/v1/connect"), {
        ...connectParams,
        domain: "not a domain",
      });

      expect(response.status).toBe(400);
      expect(response.data).toStrictEqual({
        error: "Bad Request",
        message: 'body/domain must match format "hostname"',
      });
    });

    test("open channel error", async () => {
      jest.spyOn(httpServer.channels, "open").mockImplementation(() => {
        throw new Error("open error");
      });
      const response = await http.post(getFullUrl("/v1/connect"), connectParams);

      expect(response.status).toBe(500);
      expect(response.data).toStrictEqual({ error: "open error" });
    });

    test("update channel error", async () => {
      jest.spyOn(httpServer.channels, "update").mockImplementation(() => {
        throw new Error("update error");
      });
      const response = await http.post(getFullUrl("/v1/connect"), connectParams);

      expect(response.status).toBe(500);
      expect(response.data).toStrictEqual({ error: "update error" });
    });
  });

  describe("/v1/connect/authenticate", () => {
    let channelToken: string;

    beforeEach(async () => {
      const response = await http.post(getFullUrl("/v1/connect"), connectParams);
      channelToken = response.data.channelToken;
    });

    test("POST with no token", async () => {
      const response = await http.post(getFullUrl("/v1/connect/authenticate"), authenticateParams);
      expect(response.status).toBe(401);
    });

    test("POST with valid token", async () => {
      const response = await http.post(getFullUrl("/v1/connect/authenticate"), authenticateParams, {
        headers: { Authorization: `Bearer ${channelToken}` },
      });
      expect(response.status).toBe(200);
    });

    test("POST with invalid token", async () => {
      const response = await http.post(getFullUrl("/v1/connect/authenticate"), authenticateParams, {
        headers: { Authorization: "Bearer abc-123-def" },
      });
      expect(response.status).toBe(401);
    });

    test("missing body param", async () => {
      const { fid, ...missingFid } = authenticateParams;
      const response = await http.post(getFullUrl("/v1/connect/authenticate"), missingFid, {
        headers: { Authorization: `Bearer ${channelToken}` },
      });
      expect(response.status).toBe(400);
      expect(response.data).toStrictEqual({
        error: "Bad Request",
        message: "body must have required property 'fid'",
      });
    });

    test("invalid username", async () => {
      const response = await http.post(
        getFullUrl("/v1/connect/authenticate"),
        { ...authenticateParams, username: "not a username" },
        { headers: { Authorization: `Bearer ${channelToken}` } },
      );
      expect(response.status).toBe(400);
      expect(response.data).toStrictEqual({
        error: "Bad Request",
        message: 'body/username must match pattern "^[a-z0-9][a-z0-9-]{0,15}$|^[a-z0-9][a-z0-9-]{0,15}\\.eth$"',
      });
    });

    test("invalid signature", async () => {
      const response = await http.post(
        getFullUrl("/v1/connect/authenticate"),
        { ...authenticateParams, signature: "0x123" },
        { headers: { Authorization: `Bearer ${channelToken}` } },
      );
      expect(response.status).toBe(400);
      expect(response.data).toStrictEqual({
        error: "Bad Request",
        message: 'body/signature must match pattern "^0x[a-fA-F0-9]{130}$"',
      });
    });

    test("invalid pfpUrl", async () => {
      const response = await http.post(
        getFullUrl("/v1/connect/authenticate"),
        { ...authenticateParams, pfpUrl: "not a URL" },
        { headers: { Authorization: `Bearer ${channelToken}` } },
      );
      expect(response.status).toBe(400);
      expect(response.data).toStrictEqual({
        error: "Bad Request",
        message: 'body/pfpUrl must match format "uri"',
      });
    });

    test("read channel error", async () => {
      jest.spyOn(httpServer.channels, "read").mockImplementation(() => {
        throw new Error("read error");
      });
      const response = await http.post(getFullUrl("/v1/connect/authenticate"), authenticateParams, {
        headers: { Authorization: `Bearer ${channelToken}` },
      });
      expect(response.status).toBe(500);
      expect(response.data).toStrictEqual({ error: "read error" });
    });

    test("update channel error", async () => {
      jest.spyOn(httpServer.channels, "update").mockImplementation(() => {
        throw new Error("update error");
      });
      const response = await http.post(getFullUrl("/v1/connect/authenticate"), authenticateParams, {
        headers: { Authorization: `Bearer ${channelToken}` },
      });
      expect(response.status).toBe(500);
      expect(response.data).toStrictEqual({ error: "update error" });
    });

    test("expired channel", async () => {
      await httpServer.channels.close(channelToken);
      const response = await http.post(getFullUrl("/v1/connect/authenticate"), authenticateParams, {
        headers: { Authorization: `Bearer ${channelToken}` },
      });
      expect(response.status).toBe(401);
    });
  });

  describe("/v1/connect/status", () => {
    let channelToken: string;

    beforeEach(async () => {
      const response = await http.post(getFullUrl("/v1/connect"), connectParams);
      channelToken = response.data.channelToken;
    });

    test("GET with no token", async () => {
      const response = await http.get(getFullUrl("/v1/connect/status"));
      expect(response.status).toBe(401);
    });

    test("GET with valid token", async () => {
      const response = await http.get(getFullUrl("/v1/connect/status"), {
        headers: { Authorization: `Bearer ${channelToken}` },
      });
      expect(response.status).toBe(200);

      const { state, nonce, ...rest } = response.data;
      expect(state).toBe("pending");
      expect(nonce).toMatch(/[a-zA-Z0-9]{16}/);
      expect(rest).toStrictEqual({});
    });

    test("GET with invalid token", async () => {
      const response = await http.get(getFullUrl("/v1/connect/status"), {
        headers: { Authorization: "Bearer abc-123-def" },
      });
      expect(response.status).toBe(401);
    });

    test("read channel error", async () => {
      jest.spyOn(httpServer.channels, "read").mockImplementation(() => {
        throw new Error("read error");
      });
      const response = await http.get(getFullUrl("/v1/connect/status"), {
        headers: { Authorization: `Bearer ${channelToken}` },
      });
      expect(response.status).toBe(500);
      expect(response.data).toStrictEqual({ error: "read error" });
    });

    test("close channel error", async () => {
      jest.spyOn(httpServer.channels, "close").mockImplementation(() => {
        throw new Error("close error");
      });
      await http.post(getFullUrl("/v1/connect/authenticate"), authenticateParams, {
        headers: { Authorization: `Bearer ${channelToken}` },
      });
      const response = await http.get(getFullUrl("/v1/connect/status"), {
        headers: { Authorization: `Bearer ${channelToken}` },
      });
      expect(response.status).toBe(500);
      expect(response.data).toStrictEqual({ error: "close error" });
    });
  });

  describe("e2e", () => {
    test("end to end connect flow", async () => {
      let response = await http.post(getFullUrl("/v1/connect"), connectParams);
      expect(response.status).toBe(201);

      const channelToken = response.data.channelToken;
      const authHeaders = {
        headers: { Authorization: `Bearer ${channelToken}` },
      };

      response = await http.get(getFullUrl("/v1/connect/status"), authHeaders);
      expect(response.status).toBe(200);
      expect(response.data.state).toBe("pending");

      response = await http.post(getFullUrl("/v1/connect/authenticate"), authenticateParams, authHeaders);
      expect(response.status).toBe(200);

      response = await http.get(getFullUrl("/v1/connect/status"), authHeaders);
      expect(response.status).toBe(200);
      expect(response.data.state).toBe("completed");
      expect(response.data.message).toBe(authenticateParams.message);
      expect(response.data.signature).toBe(authenticateParams.signature);

      response = await http.get(getFullUrl("/v1/connect/status"), authHeaders);
      expect(response.status).toBe(401);
    });
  });
});
