import { Factories, FarcasterNetwork, bytesToHexString } from "@farcaster/hub-nodejs";
import { deployStorageRegistry } from "../utils.js";
import { Hub, HubOptions, HubShutdownReason, randomDbName } from "../../hubble.js";
import { localHttpUrl } from "../constants.js";
import { sleep } from "../../utils/crypto.js";
import { DB_DIRECTORY } from "../../storage/db/rocksdb.js";
import fs from "fs";
import { Result } from "neverthrow";
import { TestFNameRegistryServer } from "./testFnameRegistryServer.js";

const TEST_TIMEOUT_SHORT = 10_000;

let storageRegistryAddress: `0x${string}`;
let keyRegistryAddress: `0x${string}`;
let idRegistryAddress: `0x${string}`;

let fnameServerUrl: string;
let fnameServer: TestFNameRegistryServer;
let rocksDBName: string;

let hubOptions: HubOptions;

describe("hubble startup tests", () => {
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
      connectToDbPeers: false,
    };
  });

  afterEach(async () => {
    await fnameServer.stop();

    // rm -rf the rocksdb directory
    fs.rm(`${DB_DIRECTORY}/${rocksDBName}`, { recursive: true }, (err) => {});
  });

  test(
    "Starts up with no errors",
    async () => {
      let hub;

      try {
        hub = new Hub(hubOptions);

        await hub.start(); // If exception is thrown, test errors out

        // Sleep for 1 sec
        await sleep(1000);

        const hubState = await hub.getHubState();
        expect(hubState.isOk()).toBe(true);
      } finally {
        await hub?.teardown(HubShutdownReason.SELF_TERMINATED);
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
