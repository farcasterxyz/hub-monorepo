import { FarcasterNetwork, StorageRegistryEventType } from '@farcaster/hub-nodejs';
import { StorageRegistry } from './abis.js';
import { jestRocksDB } from '../storage/db/jestUtils.js';
import Engine from '../storage/engine/index.js';
import { MockHub } from '../test/mocks.js';
import { deployStorageRegistry, publicClient, testClient, walletClientWithAccount } from '../test/utils.js';
import { accounts } from '../test/constants.js';
import { sleep } from '../utils/crypto.js';
import { L2EventsProvider } from './l2EventsProvider.js';
import {
  getNextRentRegistryEventFromIterator,
  getRentRegistryEventsIterator,
} from '../storage/db/storageRegistryEvent.js';

const db = jestRocksDB('protobufs.l2EventsProvider.test');
const engine = new Engine(db, FarcasterNetwork.TESTNET);
const hub = new MockHub(db, engine);

let l2EventsProvider: L2EventsProvider;
let storageRegistryAddress: `0x${string}`;

beforeAll(() => {
  // Poll aggressively for fast testing
  L2EventsProvider.blockPollingInterval = 10;
  L2EventsProvider.eventPollingInterval = 10;
});

afterAll(async () => {
  await engine.stop();
});

describe('process events', () => {
  beforeEach(async () => {
    const { contractAddress: storageAddr } = await deployStorageRegistry();
    if (!storageAddr) throw new Error('Failed to deploy StorageRegistry contract');
    storageRegistryAddress = storageAddr;

    l2EventsProvider = new L2EventsProvider(hub, publicClient, storageRegistryAddress, 1, 10000, false);

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

  test('handles new blocks', async () => {
    await testClient.mine({ blocks: 1 });
    const latestBlockNumber = await publicClient.getBlockNumber();
    await waitForBlock(Number(latestBlockNumber));
    expect(l2EventsProvider.getLatestBlockNumber()).toBeGreaterThanOrEqual(latestBlockNumber);
  });

  test('processes StorageRegistry events', async () => {
    const rentSim = await publicClient.simulateContract({
      address: storageRegistryAddress,
      abi: StorageRegistry.abi,
      functionName: 'batchCredit',
      account: accounts[1].address,
      args: [[BigInt(1)], BigInt(1)],
    });
    const rentHash = await walletClientWithAccount.writeContract(rentSim.request);
    const rentTrx = await publicClient.waitForTransactionReceipt({ hash: rentHash });
    await sleep(1000); // allow time for the rent event to be polled for

    await testClient.mine({ blocks: 7 });
    await waitForBlock(Number(rentTrx.blockNumber) + L2EventsProvider.numConfirmations);

    const postCreditRegistryEventIterator = await getRentRegistryEventsIterator(db, 1);
    const postCreditRegistryEvent = await getNextRentRegistryEventFromIterator(postCreditRegistryEventIterator);
    expect(postCreditRegistryEvent).toBeDefined();
    expect(postCreditRegistryEvent!.fid).toEqual(1);
    expect(postCreditRegistryEvent!.type).toEqual(StorageRegistryEventType.RENT);
    expect(postCreditRegistryEvent!.expiry).toEqual(rentTrx.blockNumber);
  }, 30000);
});
