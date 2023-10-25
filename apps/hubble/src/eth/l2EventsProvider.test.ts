import { bytesToHexString, Factories, FarcasterNetwork, OnChainEventType } from "@farcaster/hub-nodejs";
import { StorageRegistry } from "./abis.js";
import { jestRocksDB } from "../storage/db/jestUtils.js";
import Engine from "../storage/engine/index.js";
import { MockHub } from "../test/mocks.js";
import { deployStorageRegistry, publicClient, testClient, walletClientWithAccount } from "../test/utils.js";
import { accounts } from "../test/constants.js";
import { sleep } from "../utils/crypto.js";
import { L2EventsProvider, OptimismConstants } from "./l2EventsProvider.js";
import { Transport } from "viem";
import OnChainEventStore from "../storage/stores/onChainEventStore.js";
import StoreEventHandler from "../storage/stores/storeEventHandler.js";

const db = jestRocksDB("protobufs.l2EventsProvider.test");
const engine = new Engine(db, FarcasterNetwork.TESTNET);
const hub = new MockHub(db, engine);
const onChainEventStore = new OnChainEventStore(db, new StoreEventHandler(db));

let l2EventsProvider: L2EventsProvider;
let storageRegistryAddress: `0x${string}`;
let keyRegistryAddress: `0x${string}`;
let idRegistryAddress: `0x${string}`;
let keyRegistryV2Address: `0x${string}`;
let idRegistryV2Address: `0x${string}`;

const TEST_TIMEOUT_LONG = 30 * 1000; // 30s timeout

beforeAll(() => {
  // Poll aggressively for fast testing
  storageRegistryAddress = bytesToHexString(Factories.EthAddress.build())._unsafeUnwrap();
  idRegistryAddress = bytesToHexString(Factories.EthAddress.build())._unsafeUnwrap();
  keyRegistryAddress = bytesToHexString(Factories.EthAddress.build())._unsafeUnwrap();
  idRegistryV2Address = bytesToHexString(Factories.EthAddress.build())._unsafeUnwrap();
  keyRegistryV2Address = bytesToHexString(Factories.EthAddress.build())._unsafeUnwrap();
  L2EventsProvider.blockPollingInterval = 10;
  L2EventsProvider.eventPollingInterval = 10;
});

afterAll(async () => {
  await engine.stop();
});

describe("build", () => {
  test("handles single RPC URL", () => {
    const l2EventsProvider = L2EventsProvider.build(
      hub,
      "http://some-url",
      false,
      storageRegistryAddress,
      keyRegistryAddress,
      idRegistryAddress,
      keyRegistryV2Address,
      idRegistryV2Address,
      1,
      10000,
      OptimismConstants.ChainId,
      false,
    );

    const transports = (l2EventsProvider["_publicClient"].transport as unknown as { transports: Transport[] })
      .transports;

    expect(transports.length).toBe(1);
  });

  test("handles multiple RPC URLs", () => {
    const l2EventsProvider = L2EventsProvider.build(
      hub,
      "http://some-url,http://some-other-url",
      false,
      storageRegistryAddress,
      keyRegistryAddress,
      idRegistryAddress,
      keyRegistryV2Address,
      idRegistryV2Address,
      1,
      10000,
      OptimismConstants.ChainId,
      false,
    );

    const transports = (l2EventsProvider["_publicClient"].transport as unknown as { transports: Transport[] })
      .transports;

    expect(transports.length).toBe(2);
  });
});

describe("process events", () => {
  beforeEach(async () => {
    const { contractAddress: storageAddr } = await deployStorageRegistry();
    if (!storageAddr) throw new Error("Failed to deploy StorageRegistry contract");
    storageRegistryAddress = storageAddr;

    l2EventsProvider = new L2EventsProvider(
      hub,
      publicClient,
      storageRegistryAddress,
      keyRegistryAddress,
      idRegistryAddress,
      keyRegistryV2Address,
      idRegistryV2Address,
      1,
      10000,
      OptimismConstants.ChainId,
      false,
    );

    await l2EventsProvider.start();
  });

  afterEach(async () => {
    await l2EventsProvider.stop();
  });

  const waitForBlock = async (blockNumber: number) => {
    while (l2EventsProvider.getLatestBlockNumber() < blockNumber) {
      // Wait for all async promises to resolve
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  };

  test(
    "handles new blocks",
    async () => {
      const firstBlockNumber = await publicClient.getBlockNumber();
      await testClient.mine({ blocks: 1 });

      let latestBlockNumber = await publicClient.getBlockNumber();
      while ((await publicClient.getBlockNumber()) <= firstBlockNumber) {
        await sleep(100);
        latestBlockNumber = await publicClient.getBlockNumber();
      }
      await waitForBlock(Number(latestBlockNumber));
      expect(l2EventsProvider.getLatestBlockNumber()).toBeGreaterThanOrEqual(latestBlockNumber);
    },
    TEST_TIMEOUT_LONG,
  );

  test(
    "processes StorageRegistry events",
    async () => {
      const rentSim = await publicClient.simulateContract({
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        functionName: "batchCredit",
        account: accounts[0].address,
        args: [[BigInt(1)], BigInt(1)],
      });

      const rentHash = await walletClientWithAccount.writeContract(rentSim.request);
      await publicClient.waitForTransactionReceipt({ hash: rentHash });

      const setPriceSim = await publicClient.simulateContract({
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        functionName: "setPrice",
        account: accounts[0].address,
        args: [BigInt(1)],
      });
      const setPriceHash = await walletClientWithAccount.writeContract(setPriceSim.request);
      await publicClient.waitForTransactionReceipt({ hash: setPriceHash });
      await testClient.mine({ blocks: 1 });

      const setDeprecationTimestampSim = await publicClient.simulateContract({
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        functionName: "setDeprecationTimestamp",
        account: accounts[0].address,
        args: [BigInt(100000000000000)],
      });
      const setDeprecationTimestampHash = await walletClientWithAccount.writeContract(
        setDeprecationTimestampSim.request,
      );
      await publicClient.waitForTransactionReceipt({ hash: setDeprecationTimestampHash });
      await testClient.mine({ blocks: 1 });

      const setGracePeriodSim = await publicClient.simulateContract({
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        functionName: "setGracePeriod",
        account: accounts[0].address,
        args: [BigInt(1)],
      });
      const setGracePeriodHash = await walletClientWithAccount.writeContract(setGracePeriodSim.request);
      await publicClient.waitForTransactionReceipt({ hash: setGracePeriodHash });
      await testClient.mine({ blocks: 1 });

      const setMaxUnitsSim = await publicClient.simulateContract({
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        functionName: "setMaxUnits",
        account: accounts[0].address,
        args: [BigInt(1)],
      });
      const setMaxUnitsHash = await walletClientWithAccount.writeContract(setMaxUnitsSim.request);
      const maxUnitsTrx = await publicClient.waitForTransactionReceipt({ hash: setMaxUnitsHash });
      await sleep(1000); // allow time for the rent event to be polled for

      await testClient.mine({ blocks: L2EventsProvider.numConfirmations });
      await waitForBlock(Number(maxUnitsTrx.blockNumber) + L2EventsProvider.numConfirmations);

      const events = await onChainEventStore.getOnChainEvents(OnChainEventType.EVENT_TYPE_STORAGE_RENT, 1);
      expect(events.length).toEqual(1);
      expect(events[0]?.fid).toEqual(1);
      expect(events[0]?.storageRentEventBody?.units).toEqual(1);
    },
    TEST_TIMEOUT_LONG,
  );
});
