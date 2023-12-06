import { RelayServer } from "./server.js";
import axios from "axios";
import { jest } from "@jest/globals";

let httpServer: RelayServer;
let httpServerAddress: string;

function getFullUrl(path: string) {
  return `${httpServerAddress}${path}`;
}

beforeAll(async () => {
  httpServer = new RelayServer();
  httpServerAddress = (await httpServer.start())._unsafeUnwrap();
});

afterAll(async () => {
  await httpServer.stop();
});

afterEach(async () => {
  jest.restoreAllMocks();
});

describe("relay server", () => {
  describe("cors", () => {
    test("cors", async () => {
      const response = await axios.get(getFullUrl("/healthcheck"), {
        headers: { Origin: "http://example.com" },
      });

      expect(response.status).toBe(200);
      expect(response.headers["access-control-allow-origin"]).toBe("*");
    });
  });

  describe("/healthcheck", () => {
    test("GET returns status", async () => {
      const response = await axios.get(getFullUrl("/healthcheck"));

      expect(response.status).toBe(200);
      expect(response.data).toStrictEqual({ status: "OK" });
    });
  });

  describe("/v1/connect", () => {
    test("POST creates a channel", async () => {
      const response = await axios.post(getFullUrl("/v1/connect"), {});

      expect(response.status).toBe(201);
      const { channelToken, connectURI, ...rest } = response.data;
      expect(channelToken).toMatch(/[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}/);
      expect(rest).toStrictEqual({});
    });

    test("open channel error", async () => {
      jest.spyOn(httpServer.channels, "open").mockImplementation(() => {
        throw new Error("open error");
      });
      const response = await axios.post(
        getFullUrl("/v1/connect"),
        {},
        {
          validateStatus: () => true,
        },
      );

      expect(response.status).toBe(500);
      expect(response.data).toStrictEqual({ error: "open error" });
    });

    test("update channel error", async () => {
      jest.spyOn(httpServer.channels, "update").mockImplementation(() => {
        throw new Error("update error");
      });
      const response = await axios.post(
        getFullUrl("/v1/connect"),
        {},
        {
          validateStatus: () => true,
        },
      );

      expect(response.status).toBe(500);
      expect(response.data).toStrictEqual({ error: "update error" });
    });
  });

  describe("/v1/connect/authenticate", () => {
    let channelToken: string;

    beforeEach(async () => {
      const response = await axios.post(getFullUrl("/v1/connect"), {});
      channelToken = response.data.channelToken;
    });

    test("POST with no token", async () => {
      const response = await axios.post(getFullUrl("/v1/connect/authenticate"), {}, { validateStatus: () => true });
      expect(response.status).toBe(401);
    });

    test("POST with valid token", async () => {
      const response = await axios.post(
        getFullUrl("/v1/connect/authenticate"),
        {},
        { headers: { Authorization: `Bearer ${channelToken}` } },
      );
      expect(response.status).toBe(200);
    });

    test("POST with invalid token", async () => {
      const response = await axios.post(
        getFullUrl("/v1/connect/authenticate"),
        {},
        {
          headers: { Authorization: "Bearer abc-123-def" },
          validateStatus: () => true,
        },
      );
      expect(response.status).toBe(401);
    });

    test("read channel error", async () => {
      jest.spyOn(httpServer.channels, "read").mockImplementation(() => {
        throw new Error("read error");
      });
      const response = await axios.post(
        getFullUrl("/v1/connect/authenticate"),
        {},
        {
          headers: { Authorization: `Bearer ${channelToken}` },
          validateStatus: () => true,
        },
      );
      expect(response.status).toBe(500);
      expect(response.data).toStrictEqual({ error: "read error" });
    });

    test("update channel error", async () => {
      jest.spyOn(httpServer.channels, "update").mockImplementation(() => {
        throw new Error("update error");
      });
      const response = await axios.post(
        getFullUrl("/v1/connect/authenticate"),
        {},
        {
          headers: { Authorization: `Bearer ${channelToken}` },
          validateStatus: () => true,
        },
      );
      expect(response.status).toBe(500);
      expect(response.data).toStrictEqual({ error: "update error" });
    });

    test("expired channel", async () => {
      await httpServer.channels.close(channelToken);
      const response = await axios.post(
        getFullUrl("/v1/connect/authenticate"),
        {},
        {
          headers: { Authorization: `Bearer ${channelToken}` },
          validateStatus: () => true,
        },
      );
      expect(response.status).toBe(401);
    });
  });

  describe("/v1/connect/status", () => {
    let channelToken: string;

    beforeEach(async () => {
      const response = await axios.post(getFullUrl("/v1/connect"), {});
      channelToken = response.data.channelToken;
    });

    test("GET with no token", async () => {
      const response = await axios.get(getFullUrl("/v1/connect/status"), {
        validateStatus: () => true,
      });
      expect(response.status).toBe(401);
    });

    test("GET with valid token", async () => {
      const response = await axios.get(getFullUrl("/v1/connect/status"), {
        headers: { Authorization: `Bearer ${channelToken}` },
      });
      expect(response.status).toBe(200);

      const { state, nonce, ...rest } = response.data;
      expect(state).toBe("pending");
      expect(nonce).toMatch(/[a-zA-Z0-9]{16}/);
      expect(rest).toStrictEqual({});
    });

    test("GET with invalid token", async () => {
      const response = await axios.get(getFullUrl("/v1/connect/status"), {
        headers: { Authorization: "Bearer abc-123-def" },
        validateStatus: () => true,
      });
      expect(response.status).toBe(401);
    });

    test("read channel error", async () => {
      jest.spyOn(httpServer.channels, "read").mockImplementation(() => {
        throw new Error("read error");
      });
      const response = await axios.get(getFullUrl("/v1/connect/status"), {
        headers: { Authorization: `Bearer ${channelToken}` },
        validateStatus: () => true,
      });
      expect(response.status).toBe(500);
      expect(response.data).toStrictEqual({ error: "read error" });
    });

    test("close channel error", async () => {
      jest.spyOn(httpServer.channels, "close").mockImplementation(() => {
        throw new Error("close error");
      });
      await axios.post(
        getFullUrl("/v1/connect/authenticate"),
        {},
        { headers: { Authorization: `Bearer ${channelToken}` } },
      );
      const response = await axios.get(getFullUrl("/v1/connect/status"), {
        headers: { Authorization: `Bearer ${channelToken}` },
        validateStatus: () => true,
      });
      expect(response.status).toBe(500);
      expect(response.data).toStrictEqual({ error: "close error" });
    });
  });
});
