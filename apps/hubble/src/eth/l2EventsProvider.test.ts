import { Factories, bytesToHexString, FarcasterNetwork, StorageRegistryEventType } from '@farcaster/hub-nodejs';
import { StorageRegistry } from './abis.js';
import { EthEventsProvider } from './ethEventsProvider.js';
import { getIdRegistryEvent } from '../storage/db/idRegistryEvent.js';
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
} from 'storage/db/storageRegistryEvent.js';

const db = jestRocksDB('protobufs.l2EventsProvider.test');
const engine = new Engine(db, FarcasterNetwork.TESTNET);
const hub = new MockHub(db, engine);

let l2EventsProvider: L2EventsProvider;
let storageRegistryAddress: `0x${string}`;

const generateEthAddressHex = () => {
  return bytesToHexString(Factories.EthAddress.build())._unsafeUnwrap() as `0x${string}`;
};

beforeAll(() => {
  // Poll aggressively for fast testing
  EthEventsProvider.blockPollingInterval = 10;
  EthEventsProvider.eventPollingInterval = 10;
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
    const address1 = generateEthAddressHex();
    const transferOwnershipSim = await publicClient.simulateContract({
      address: storageRegistryAddress,
      abi: StorageRegistry.abi,
      functionName: 'transferOwnership',
      account: accounts[0].address,
      args: [accounts[0].address as `0x${string}`],
    });
    const transferOwnershipHash = await walletClientWithAccount.writeContract(transferOwnershipSim.request);
    await publicClient.waitForTransactionReceipt({ hash: transferOwnershipHash });

    const acceptOwnerSim = await publicClient.simulateContract({
      address: storageRegistryAddress,
      abi: StorageRegistry.abi,
      functionName: 'acceptOwnership',
      account: accounts[0].address,
    });

    const acceptOwnerHash = await walletClientWithAccount.writeContract(acceptOwnerSim.request);
    await publicClient.waitForTransactionReceipt({ hash: acceptOwnerHash });
    await sleep(1000); // allow time for the accept event to be polled for

    // The event is not immediately available, since it has to wait for confirmations
    await expect(getIdRegistryEvent(db, 1)).rejects.toThrow();
    await testClient.mine({ blocks: 7 });

    const creditSim = await publicClient.simulateContract({
      address: storageRegistryAddress,
      abi: StorageRegistry.abi,
      functionName: 'credit',
      account: address1,
      args: [BigInt(1), BigInt(1)],
    });
    const creditHash = await walletClientWithAccount.writeContract(creditSim.request);
    const creditTrx = await publicClient.waitForTransactionReceipt({ hash: creditHash });
    await sleep(1000); // allow time for the register event to be polled for

    // Wait for the transfer block to be confirmed
    await testClient.mine({ blocks: 7 });
    await waitForBlock(Number(creditTrx.blockNumber) + L2EventsProvider.numConfirmations);

    const postCreditRegistryEventIterator = await getRentRegistryEventsIterator(db, 1);
    const postCreditRegistryEvent = await getNextRentRegistryEventFromIterator(postCreditRegistryEventIterator);
    expect(postCreditRegistryEvent).toBeDefined();
    expect(postCreditRegistryEvent!.fid).toEqual(1);
    expect(postCreditRegistryEvent!.type).toEqual(StorageRegistryEventType.RENT);
    expect(postCreditRegistryEvent!.expiry).toEqual(creditTrx.blockNumber);
  });
});
