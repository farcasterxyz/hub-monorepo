import { Factories, FarcasterNetwork, bytesToHexString } from "@farcaster/hub-nodejs";
import { deployStorageRegistry, testClient } from "../utils.js";
import { Hub, HubOptions, randomDbName } from "../../hubble.js";
import { localHttpUrl } from "../constants.js";
import { sleep } from "../../utils/crypto.js";
import { FastifyInstance } from "fastify";
import { DB_DIRECTORY } from "../../storage/db/rocksdb.js";
import fastify from "fastify";
import fs from "fs";
import { Result } from "neverthrow";

const TEST_TIMEOUT_SHORT = 10_000;

export class TestFNameRegistryServer {
  private server?: FastifyInstance;
  private port = 0;

  public async start(): Promise<string> {
    this.server = fastify();

    this.server.get("/transfers", async (request, reply) => {
      reply.send({ transfers: [] });
    });

    this.server.get("/signer", async (request, reply) => {
      reply.send({ signer: bytesToHexString(Factories.EthAddress.build())._unsafeUnwrap() });
    });

    try {
      await this.server.listen({ port: this.port, host: "localhost" });
      const address = this.server.server.address();
      const port = typeof address === "string" ? 0 : address?.port;
      return `http://localhost:${port}`;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.server?.close();
    } catch (err) {
      console.log(err);
    }
  }
}

let storageRegistryAddress: `0x${string}`;
let keyRegistryAddress: `0x${string}`;
let idRegistryAddress: `0x${string}`;

let fnameServerUrl: string;
let fnameServer: TestFNameRegistryServer;
let rocksDBName: string;

let hubOptions: HubOptions;

describe("hubble startuup tests", () => {
  beforeEach(async () => {
    const { contractAddress: storageAddr } = await deployStorageRegistry();
    if (!storageAddr) throw new Error("Failed to deploy StorageRegistry contract");
    storageRegistryAddress = storageAddr;

    idRegistryAddress = bytesToHexString(Factories.EthAddress.build())._unsafeUnwrap();
    keyRegistryAddress = bytesToHexString(Factories.EthAddress.build())._unsafeUnwrap();

    fnameServer = new TestFNameRegistryServer();
    fnameServerUrl = await fnameServer.start();

    rocksDBName = randomDbName();

    hubOptions = {
      network: FarcasterNetwork.DEVNET,
      l2StorageRegistryAddress: storageRegistryAddress,
      l2IdRegistryAddress: idRegistryAddress,
      l2KeyRegistryAddress: keyRegistryAddress,
      l2RpcUrl: localHttpUrl,
      ethMainnetRpcUrl: localHttpUrl,
      fnameServerUrl,
      rocksDBName,
      announceIp: "127.0.0.1",
      disableSnapshotSync: true,
    };
  });

  afterAll(async () => {
    await fnameServer.stop();

    // rm -rf the rocksdb directory
    fs.rm(`${DB_DIRECTORY}/${rocksDBName}`, { recursive: true }, (err) => {});
  });

  test(
    "Starts up with no errors",
    async () => {
      const client = testClient;
      let hub;

      try {
        hub = new Hub(hubOptions);

        await hub.start(); // If exception is thrown, test errors out

        // Sleep for 1 sec
        await sleep(1000);

        const hubState = await hub.getHubState();
        expect(hubState.isOk()).toBe(true);
      } finally {
        await hub?.teardown();
      }
    },
    TEST_TIMEOUT_SHORT,
  );

  test("Needs a valid fname server url", async () => {
    const hub = Result.fromThrowable(
      () => new Hub({ ...hubOptions, fnameServerUrl: "" }),
      (e) => e as Error,
    )();
    expect(hub.isErr()).toBe(true);
    expect(hub._unsafeUnwrapErr().message).toContain("Invalid fname server url");
  });

  test("Needs a valid l2 rpc url", async () => {
    const hub = Result.fromThrowable(
      () => new Hub({ ...hubOptions, l2RpcUrl: "" }),
      (e) => e as Error,
    )();
    expect(hub.isErr()).toBe(true);
    expect(hub._unsafeUnwrapErr().message).toContain("Invalid l2 rpc url");
  });

  test("Needs a valid eth mainnet rpc url", async () => {
    const hub = Result.fromThrowable(
      () => new Hub({ ...hubOptions, ethMainnetRpcUrl: "" }),
      (e) => e as Error,
    )();
    expect(hub.isErr()).toBe(true);
    expect(hub._unsafeUnwrapErr().message).toContain("Invalid eth mainnet rpc url");
  });
});
