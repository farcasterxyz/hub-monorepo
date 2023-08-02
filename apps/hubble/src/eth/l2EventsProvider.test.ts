import { FarcasterNetwork, StorageRegistryEventType } from "@farcaster/hub-nodejs";
import { StorageRegistry } from "./abis.js";
import { jestRocksDB } from "../storage/db/jestUtils.js";
import Engine from "../storage/engine/index.js";
import { MockHub } from "../test/mocks.js";
import { deployStorageRegistry, publicClient, testClient, walletClientWithAccount } from "../test/utils.js";
import { accounts } from "../test/constants.js";
import { sleep } from "../utils/crypto.js";
import { L2EventsProvider, OptimismConstants } from "./l2EventsProvider.js";
import {
  getNextRentRegistryEventFromIterator,
  getNextStorageAdminRegistryEventFromIterator,
  getRentRegistryEventsIterator,
  getStorageAdminRegistryEventsIterator,
} from "../storage/db/storageRegistryEvent.js";
import { Transport, toBytes } from "viem";

const db = jestRocksDB("protobufs.l2EventsProvider.test");
const engine = new Engine(db, FarcasterNetwork.TESTNET);
const hub = new MockHub(db, engine);

let l2EventsProvider: L2EventsProvider;
let storageRegistryAddress: `0x${string}`;
let keyRegistryAddress: `0x${string}`;
let idRegistryAddress: `0x${string}`;

beforeAll(() => {
  // Poll aggressively for fast testing
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
    while (l2EventsProvider.getLatestBlockNumber() <= blockNumber) {
      // Wait for all async promises to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  };

  test("handles new blocks", async () => {
    await testClient.mine({ blocks: 1 });
    const latestBlockNumber = await publicClient.getBlockNumber();
    await waitForBlock(Number(latestBlockNumber));
    expect(l2EventsProvider.getLatestBlockNumber()).toBeGreaterThanOrEqual(latestBlockNumber);
  }, 10000);

  test("processes StorageRegistry events", async () => {
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
    const setDeprecationTimestampHash = await walletClientWithAccount.writeContract(setDeprecationTimestampSim.request);
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

    await testClient.mine({ blocks: 7 });
    await waitForBlock(Number(maxUnitsTrx.blockNumber) + L2EventsProvider.numConfirmations);

    const postCreditRegistryEventIterator = await getRentRegistryEventsIterator(db, 1);
    const postCreditRegistryEvent = await getNextRentRegistryEventFromIterator(postCreditRegistryEventIterator);
    expect(postCreditRegistryEvent).toBeDefined();
    expect(postCreditRegistryEvent?.fid).toEqual(1);
    expect(postCreditRegistryEvent?.type).toEqual(StorageRegistryEventType.RENT);

    const storageAdminRegistryEventIterator = await getStorageAdminRegistryEventsIterator(db);
    const storageAdminEvents = [];
    for (let i = 0; i < 4; i++) {
      storageAdminEvents.push(await getNextStorageAdminRegistryEventFromIterator(storageAdminRegistryEventIterator));
    }

    expect(storageAdminEvents[0]?.type).toEqual(StorageRegistryEventType.SET_PRICE);
    expect(storageAdminEvents[0]?.value).toEqual(toBytes(BigInt(1)));

    expect(storageAdminEvents[1]?.type).toEqual(StorageRegistryEventType.SET_DEPRECATION_TIMESTAMP);
    expect(storageAdminEvents[1]?.value).toEqual(toBytes(BigInt(100000000000000)));

    expect(storageAdminEvents[2]?.type).toEqual(StorageRegistryEventType.SET_GRACE_PERIOD);
    expect(storageAdminEvents[2]?.value).toEqual(toBytes(BigInt(1)));

    expect(storageAdminEvents[3]?.type).toEqual(StorageRegistryEventType.SET_MAX_UNITS);
    expect(storageAdminEvents[3]?.value).toEqual(toBytes(BigInt(1)));
  }, 30000);
});
