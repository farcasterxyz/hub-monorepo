import * as protobufs from '@farcaster/protobufs';
import { bytesToHexString, Factories, hexStringToBytes } from '@farcaster/utils';
import { AbstractProvider, Block, Contract, Log, Provider, TransactionReceipt, TransactionResponse } from 'ethers';
import { OrphanFilter } from 'ethers/types/providers';
import { IdRegistry, NameRegistry } from '~/eth/abis';
import { EthEventsProvider } from '~/eth/ethEventsProvider';
import { getIdRegistryEvent } from '~/storage/db/idRegistryEvent';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { getNameRegistryEvent } from '~/storage/db/nameRegistryEvent';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('flatbuffers.ethEventsProvider.test');
const engine = new Engine(db, protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET);
const hub = new MockHub(db, engine);

const fid = Factories.Fid.build();
const fname = Factories.Fname.build();

let ethEventsProvider: EthEventsProvider;
let mockRPCProvider: MockRPCProvider;
let mockIdRegistry: Contract;
let mockNameRegistry: Contract;

/** A Mock RPC provider */
class MockRPCProvider extends AbstractProvider {
  constructor() {
    // The Goerli networkID is 5
    super(5);
  }

  override async getLogs() {
    return [];
  }

  override async getBlockNumber(): Promise<number> {
    return Math.round(Math.random() * 100_000);
  }
}

/** MockLog mocks the Log class instead of EventLog since we do not need to access args in the test */
class MockLog implements Log {
  address: string;
  blockNumber: number;
  blockHash: string;
  data: string;
  index: number;
  provider: Provider;
  removed: boolean;
  topics: string[];
  transactionHash: string;
  transactionIndex: number;

  // Allow no-op functions in the mock
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  removeListener: () => void = () => {};
  getBlock: () => Promise<Block> = () => Promise.resolve({} as Block);
  getTransaction: () => Promise<TransactionResponse> = () => Promise.resolve({} as TransactionResponse);
  getTransactionReceipt: () => Promise<TransactionReceipt> = () => Promise.resolve({} as TransactionReceipt);

  constructor(
    blockNumber: number,
    blockHash: string,
    transactionHash: string,
    index: number,
    provider: AbstractProvider
  ) {
    this.blockNumber = blockNumber;
    this.blockHash = blockHash;
    this.transactionHash = transactionHash;
    this.index = index;
    this.provider = provider;

    this.transactionIndex = 0;
    this.removed = false;
    this.address = '';
    this.data = '';
    this.topics = [];
  }

  get eventName(): string {
    throw new Error('Method not implemented.');
  }
  get eventSignature(): string {
    throw new Error('Method not implemented.');
  }

  toJSON() {
    throw new Error('Method not implemented.');
  }
  removedEvent(): OrphanFilter {
    throw new Error('Method not implemented.');
  }
}

beforeAll(async () => {
  mockRPCProvider = new MockRPCProvider();
  mockIdRegistry = new Contract('0x000001', IdRegistry.abi, mockRPCProvider);
  mockNameRegistry = new Contract('0x000002', NameRegistry.abi, mockRPCProvider);
});

describe('process events', () => {
  beforeEach(async () => {
    ethEventsProvider = new EthEventsProvider(hub, mockRPCProvider, mockIdRegistry, mockNameRegistry);
    await ethEventsProvider.start();
  });

  afterEach(async () => {
    await ethEventsProvider.stop();
  });

  const waitForBlock = async (blockNumber: number) => {
    while (ethEventsProvider.getLatestBlockNumber() < blockNumber) {
      // Wait for all async promises to resolve
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  };

  const addBlocks = async (startAt: number, n: number): Promise<number> => {
    for (let i = 0; i < n; i++) {
      expect(mockRPCProvider.emit('block', startAt + i)).toBeTruthy();
      await waitForBlock(startAt + i);
    }

    return startAt + n;
  };

  test('processes IdRegistry events', async () => {
    let blockNumber = 1;

    const address1 = Factories.EthAddressHex.build();
    const address2 = Factories.EthAddressHex.build();

    // Emit a "Register event"
    const rRegister = mockIdRegistry.emit(
      'Register',
      address1,
      BigInt(fid),
      '',
      '',
      new MockLog(blockNumber++, '0xb00001', '0x400001', 0, mockRPCProvider)
    );
    expect(rRegister).toBeTruthy();

    // The event is not immediately available, since it has to wait for confirmations
    await expect(getIdRegistryEvent(db, fid)).rejects.toThrow();

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The event is now available
    const idRegistryEvent = await getIdRegistryEvent(db, fid);
    expect(idRegistryEvent.fid).toEqual(fid);

    // Transfer the ID to another address
    mockIdRegistry.emit(
      'Transfer',
      address1,
      address2,
      BigInt(fid),
      new MockLog(blockNumber++, '0xb00002', '0x400002', 0, mockRPCProvider)
    );
    // The event is not immediately available, since it has to wait for confirmations. We should still get the Register event
    const existingIdRegistryEvent = await getIdRegistryEvent(db, fid);
    expect(existingIdRegistryEvent.type).toEqual(protobufs.IdRegistryEventType.ID_REGISTRY_EVENT_TYPE_REGISTER);
    expect(existingIdRegistryEvent.to).toEqual(hexStringToBytes(address1)._unsafeUnwrap());

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The transfer event is now available
    const newIdRegistryEvent = await getIdRegistryEvent(db, fid);
    expect(newIdRegistryEvent.fid).toEqual(fid);
    expect(newIdRegistryEvent.type).toEqual(protobufs.IdRegistryEventType.ID_REGISTRY_EVENT_TYPE_TRANSFER);
    expect(newIdRegistryEvent.to).toEqual(hexStringToBytes(address2)._unsafeUnwrap());
  });

  test('processes transfer name', async () => {
    let blockNumber = 1;

    // Emit a "Transfer event"
    const rTransfer = mockNameRegistry.emit(
      'Transfer',
      '0x000001',
      '0x000002',
      BigInt(bytesToHexString(fname)._unsafeUnwrap()),
      new MockLog(blockNumber++, '0xb00001', '0x400001', 0, mockRPCProvider)
    );
    expect(rTransfer).toBeTruthy();

    // The event is not immediately available, since it has to wait for confirmations
    await expect(getNameRegistryEvent(db, fname)).rejects.toThrow();

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The event is now available
    expect((await getNameRegistryEvent(db, fname)).fname).toEqual(fname);

    // // Renew the fname
    // mockNameRegistry.emit(
    //   'Renew',
    //   BigNumber.from(bytesToHexString(fname)._unsafeUnwrap()),
    //   BigNumber.from(1000),
    //   new MockLog(blockNumber++, '0xb00002', '0x400002', 0)
    // );
    // // The event is not immediately available, since it has to wait for confirmations. We should still get the Transfer event
    // expect((await getNameRegistryEvent(db, fname)).type).toEqual(
    //   protobufs.NameRegistryEventType.NAME_REGISTRY_EVENT_TYPE_TRANSFER
    // );

    // // Add 6 confirmations
    // blockNumber = await addBlocks(blockNumber, 6);

    // // The renew event is now available
    // expect((await getNameRegistryEvent(db, fname)).fname).toEqual(fname);
    // expect((await getNameRegistryEvent(db, fname)).type).toEqual(
    //   protobufs.NameRegistryEventType.NAME_REGISTRY_EVENT_TYPE_RENEW
    // );
  });
});
