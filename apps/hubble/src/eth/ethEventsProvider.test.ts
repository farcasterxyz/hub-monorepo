import {
  Factories,
  bytesToHexString,
  FarcasterNetwork,
  IdRegistryEventType,
  hexStringToBytes,
  NameRegistryEventType,
} from '@farcaster/hub-nodejs';
import { parseEther, toHex } from 'viem';
import { IdRegistry, NameRegistry } from './abis.js';
import { EthEventsProvider } from './ethEventsProvider.js';
import { getIdRegistryEvent } from '../storage/db/idRegistryEvent.js';
import { jestRocksDB } from '../storage/db/jestUtils.js';
import { getNameRegistryEvent } from '../storage/db/nameRegistryEvent.js';
import Engine from '../storage/engine/index.js';
import { MockHub } from '../test/mocks.js';
import {
  deployIdRegistry,
  deployNameRegistry,
  publicClient,
  testClient,
  walletClientWithAccount,
} from '../test/utils.js';
import { accounts } from '../test/constants.js';
import { sleep } from '../utils/crypto.js';

const db = jestRocksDB('protobufs.ethEventsProvider.test');
const engine = new Engine(db, FarcasterNetwork.TESTNET);
const hub = new MockHub(db, engine);

const fname = Factories.Fname.build();

let ethEventsProvider: EthEventsProvider;
let idRegistryAddress: `0x${string}`;
let nameRegistryAddress: `0x${string}`;

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
    const { contractAddress: idAddr } = await deployIdRegistry();
    if (!idAddr) throw new Error('Failed to deploy NameRegistry contract');
    idRegistryAddress = idAddr;

    const { contractAddress: nameAddr } = await deployNameRegistry();
    if (!nameAddr) throw new Error('Failed to deploy NameRegistry contract');
    nameRegistryAddress = nameAddr;

    ethEventsProvider = new EthEventsProvider(
      hub,
      publicClient,
      idRegistryAddress,
      nameRegistryAddress,
      1,
      10000,
      false
    );

    await ethEventsProvider.start();
  });

  afterEach(async () => {
    await ethEventsProvider.stop();
  });

  const waitForBlock = async (blockNumber: number) => {
    while (ethEventsProvider.getLatestBlockNumber() <= blockNumber) {
      // Wait for all async promises to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  };

  test('handles new blocks', async () => {
    await testClient.mine({ blocks: 1 });
    const latestBlockNumber = await publicClient.getBlockNumber();
    await waitForBlock(Number(latestBlockNumber));
    expect(ethEventsProvider.getLatestBlockNumber()).toBeGreaterThanOrEqual(latestBlockNumber);
  });

  test('processes IdRegistry events', async () => {
    const address1 = generateEthAddressHex();
    const address2 = generateEthAddressHex();
    const changeTrustedCallerSim = await publicClient.simulateContract({
      address: idRegistryAddress,
      abi: IdRegistry.abi,
      functionName: 'changeTrustedCaller',
      account: accounts[0].address,
      args: [accounts[0].address as `0x${string}`],
    });
    const changeTrustedCallerHash = await walletClientWithAccount.writeContract(changeTrustedCallerSim.request);
    await publicClient.waitForTransactionReceipt({ hash: changeTrustedCallerHash });

    const registerSim = await publicClient.simulateContract({
      address: idRegistryAddress,
      abi: IdRegistry.abi,
      functionName: 'trustedRegister',
      account: accounts[0].address,
      args: [address1 as `0x${string}`, address2 as `0x${string}`, ''],
    });

    const registerHash = await walletClientWithAccount.writeContract(registerSim.request);
    const registerTrx = await publicClient.waitForTransactionReceipt({ hash: registerHash });
    await sleep(1000); // allow time for the register event to be polled for

    // The event is not immediately available, since it has to wait for confirmations
    await expect(getIdRegistryEvent(db, 1)).rejects.toThrow();
    await testClient.mine({ blocks: 7 });

    // Wait for the register block to be confirmed
    await waitForBlock(Number(registerTrx.blockNumber) + EthEventsProvider.numConfirmations);
    const idRegistryEvent = await getIdRegistryEvent(db, 1);
    expect(idRegistryEvent.fid).toEqual(1);

    await testClient.setBalance({
      address: address1,
      value: parseEther('1'),
    });
    await testClient.impersonateAccount({
      address: address1,
    });
    const transferSim = await publicClient.simulateContract({
      address: idRegistryAddress,
      abi: IdRegistry.abi,
      functionName: 'transfer',
      account: address1,
      args: [address2 as `0x${string}`],
    });
    const transferHash = await walletClientWithAccount.writeContract(transferSim.request);
    const transferTrx = await publicClient.waitForTransactionReceipt({ hash: transferHash });
    await sleep(1000); // allow time for the register event to be polled for

    // Wait for the transfer block to be confirmed
    await testClient.mine({ blocks: 7 });
    await waitForBlock(Number(transferTrx.blockNumber) + EthEventsProvider.numConfirmations);

    const postTransferIdRegistryEvent = await getIdRegistryEvent(db, 1);
    expect(postTransferIdRegistryEvent.fid).toEqual(1);
    expect(postTransferIdRegistryEvent.type).toEqual(IdRegistryEventType.TRANSFER);
    expect(postTransferIdRegistryEvent.to).toEqual(hexStringToBytes(address2)._unsafeUnwrap());
  });

  test('processes NameRegistry events', async () => {
    const address1 = generateEthAddressHex();
    const address2 = generateEthAddressHex();
    const changeTrustedCallerSim = await publicClient.simulateContract({
      address: idRegistryAddress,
      abi: IdRegistry.abi,
      functionName: 'changeTrustedCaller',
      account: accounts[0].address,
      args: [accounts[0].address as `0x${string}`],
    });
    const changeTrustedCallerHash = await walletClientWithAccount.writeContract(changeTrustedCallerSim.request);
    await publicClient.waitForTransactionReceipt({ hash: changeTrustedCallerHash });

    const registerSim = await publicClient.simulateContract({
      address: idRegistryAddress,
      abi: IdRegistry.abi,
      functionName: 'trustedRegister',
      account: accounts[0].address,
      args: [address1 as `0x${string}`, address2 as `0x${string}`, ''],
    });
    const registerHash = await walletClientWithAccount.writeContract(registerSim.request);
    const registerTrx = await publicClient.waitForTransactionReceipt({ hash: registerHash });
    await sleep(1000); // allow time for the register event to be polled for

    // The event is not immediately available, since it has to wait for confirmations
    await expect(getIdRegistryEvent(db, 1)).rejects.toThrow();
    await testClient.mine({ blocks: 7 });

    // Wait for the register block to be confirmed
    await waitForBlock(Number(registerTrx.blockNumber) + EthEventsProvider.numConfirmations);
    const idRegistryEvent = await getIdRegistryEvent(db, 1);
    expect(idRegistryEvent.fid).toEqual(1);

    await testClient.setBalance({
      address: address1,
      value: parseEther('10'),
    });
    await testClient.impersonateAccount({
      address: address1,
    });

    const commit = await publicClient.readContract({
      address: nameRegistryAddress,
      abi: NameRegistry.abi,
      functionName: 'generateCommit',
      args: [toHex(fname, { size: 16 }), address1, toHex('secret', { size: 32 }), address2],
    });
    const makeCommitSim = await publicClient.simulateContract({
      address: nameRegistryAddress,
      abi: NameRegistry.abi,
      functionName: 'makeCommit',
      account: address1,
      args: [commit],
    });
    const makeCommitHash = await walletClientWithAccount.writeContract(makeCommitSim.request);
    await publicClient.waitForTransactionReceipt({ hash: makeCommitHash });

    await testClient.increaseTime({
      seconds: 120,
    });
    await testClient.mine({ blocks: 1 });
    const fnameRegisterSim = await publicClient.simulateContract({
      address: nameRegistryAddress,
      abi: NameRegistry.abi,
      functionName: 'register',
      account: address1,
      value: parseEther('1'),
      args: [toHex(fname, { size: 16 }), address1, toHex('secret', { size: 32 }), address2],
    });
    const fnameRegisterHash = await walletClientWithAccount.writeContract(fnameRegisterSim.request);
    const fnameRegisterTrx = await publicClient.waitForTransactionReceipt({ hash: fnameRegisterHash });
    await sleep(1000); // allow time for the register event to be polled for

    // Wait for the transfer block to be confirmed
    await expect(getNameRegistryEvent(db, fname)).rejects.toThrow();
    await testClient.mine({ blocks: 7 });
    await waitForBlock(Number(fnameRegisterTrx.blockNumber) + EthEventsProvider.numConfirmations);

    const nameRegistryEvent = await getNameRegistryEvent(db, fname);
    expect(nameRegistryEvent.fname).toEqual(fname);
    expect(nameRegistryEvent.type).toEqual(NameRegistryEventType.TRANSFER);
    expect(nameRegistryEvent.to).toEqual(hexStringToBytes(address1)._unsafeUnwrap());
  });
});
