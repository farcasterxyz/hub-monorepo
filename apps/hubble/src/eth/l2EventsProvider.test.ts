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
import { getBlockNumber, mine, simulateContract, waitForTransactionReceipt, writeContract } from "viem/actions";
import OnChainEventStore from "../storage/stores/onChainEventStore.js";
import StoreEventHandler from "../storage/stores/storeEventHandler.js";

const db = jestRocksDB("protobufs.l2EventsProvider.test");
const engine = new Engine(db, FarcasterNetwork.TESTNET);
const hub = new MockHub(db, engine);
const onChainEventStore = new OnChainEventStore(db, new StoreEventHandler(db));

let l2EventsProvider: L2EventsProvider;
let storageRegistryAddress: `0x${string}`;
let keyRegistryV2Address: `0x${string}`;
let idRegistryV2Address: `0x${string}`;

const TEST_TIMEOUT_LONG = 30 * 1000; // 30s timeout

beforeAll(() => {
  // Poll aggressively for fast testing
  storageRegistryAddress = bytesToHexString(Factories.EthAddress.build())._unsafeUnwrap();
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
      const firstBlockNumber = await getBlockNumber(publicClient);
      await mine(testClient, { blocks: 1 });

      let latestBlockNumber = await getBlockNumber(publicClient);
      while ((await getBlockNumber(publicClient)) <= firstBlockNumber) {
        await sleep(100);
        latestBlockNumber = await getBlockNumber(publicClient);
      }
      await waitForBlock(Number(latestBlockNumber));
      expect(l2EventsProvider.getLatestBlockNumber()).toBeGreaterThanOrEqual(latestBlockNumber);
    },
    TEST_TIMEOUT_LONG,
  );

  test(
    "processes StorageRegistry events",
    async () => {
      const rentSim = await simulateContract(publicClient, {
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        functionName: "batchCredit",
        account: accounts[0].address,
        args: [[BigInt(1)], BigInt(1)],
      });

      const rentHash = await writeContract(walletClientWithAccount, rentSim.request);
      await waitForTransactionReceipt(publicClient, { hash: rentHash });

      const setPriceSim = await simulateContract(publicClient, {
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        functionName: "setPrice",
        account: accounts[0].address,
        args: [BigInt(1)],
      });
      const setPriceHash = await writeContract(walletClientWithAccount, setPriceSim.request);
      await waitForTransactionReceipt(publicClient, { hash: setPriceHash });
      await mine(testClient, { blocks: 1 });

      const setDeprecationTimestampSim = await simulateContract(publicClient, {
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        functionName: "setDeprecationTimestamp",
        account: accounts[0].address,
        args: [BigInt(100000000000000)],
      });
      const setDeprecationTimestampHash = await writeContract(
        walletClientWithAccount,
        setDeprecationTimestampSim.request,
      );
      await waitForTransactionReceipt(publicClient, { hash: setDeprecationTimestampHash });
      await mine(testClient, { blocks: 1 });

      const setGracePeriodSim = await simulateContract(publicClient, {
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        functionName: "setGracePeriod",
        account: accounts[0].address,
        args: [BigInt(1)],
      });
      const setGracePeriodHash = await writeContract(walletClientWithAccount, setGracePeriodSim.request);
      await waitForTransactionReceipt(publicClient, { hash: setGracePeriodHash });
      await mine(testClient, { blocks: 1 });

      const setMaxUnitsSim = await simulateContract(publicClient, {
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        functionName: "setMaxUnits",
        account: accounts[0].address,
        args: [BigInt(1)],
      });
      const setMaxUnitsHash = await writeContract(walletClientWithAccount, setMaxUnitsSim.request);
      const maxUnitsTrx = await waitForTransactionReceipt(publicClient, { hash: setMaxUnitsHash });
      await sleep(1000); // allow time for the rent event to be polled for

      await mine(testClient, { blocks: L2EventsProvider.numConfirmations });
      await waitForBlock(Number(maxUnitsTrx.blockNumber) + L2EventsProvider.numConfirmations);

      const events = await onChainEventStore.getOnChainEvents(OnChainEventType.EVENT_TYPE_STORAGE_RENT, 1);
      expect(events.length).toEqual(1);
      expect(events[0]?.fid).toEqual(1);
      expect(events[0]?.storageRentEventBody?.units).toEqual(1);
    },
    TEST_TIMEOUT_LONG,
  );

  // TODO(aditi): It's pretty high overhead to set up tests with the id registry and key registry -- need to deploy contracts (need bytecode). Testing via the storage contract tests most of the meaningful logic.
  test(
    "retry by fid",
    async () => {
      const rentSim = await simulateContract(publicClient, {
        address: storageRegistryAddress,
        abi: StorageRegistry.abi,
        functionName: "credit",
        account: accounts[0].address,
        args: [BigInt(1), BigInt(1)],
      });

      // Set up the storage rent event
      const rentHash = await writeContract(walletClientWithAccount, rentSim.request);
      const rentTrx = await waitForTransactionReceipt(publicClient, { hash: rentHash });
      await sleep(1000); // allow time for the rent event to be polled for
      await mine(testClient, { blocks: L2EventsProvider.numConfirmations });
      await waitForBlock(Number(rentTrx.blockNumber) + L2EventsProvider.numConfirmations);

      const events1 = await onChainEventStore.getOnChainEvents(OnChainEventType.EVENT_TYPE_STORAGE_RENT, 1);
      expect(events1.length).toEqual(1);
      expect(events1[0]?.fid).toEqual(1);
      expect(events1[0]?.storageRentEventBody?.units).toEqual(1);

      const clearAndRetryForFid = async () => {
        // Clear on chain events and show that they get re-ingested when retrying by fid
        await OnChainEventStore.clearEvents(db);
        const events = await onChainEventStore.getOnChainEvents(OnChainEventType.EVENT_TYPE_STORAGE_RENT, 1);

        expect(events.length).toEqual(0);

        await l2EventsProvider.retryEventsForFid(1);
        await sleep(1000); // allow time for the rent event to be polled for
        return await onChainEventStore.getOnChainEvents(OnChainEventType.EVENT_TYPE_STORAGE_RENT, 1);
      };

      const events2 = await clearAndRetryForFid();

      expect(events2.length).toEqual(1);
      expect(events2[0]?.fid).toEqual(1);
      expect(events2[0]?.storageRentEventBody?.units).toEqual(1);

      // After retrying once, we don't retry again
      const events3 = await clearAndRetryForFid();
      expect(events3.length).toEqual(0);
    },
    TEST_TIMEOUT_LONG,
  );
});
