/* eslint-disable @typescript-eslint/no-empty-function */
import { BaseProvider, Block, TransactionReceipt, TransactionResponse } from '@ethersproject/providers';
import { Event } from '@ethersproject/contracts';
import { BigNumber, Contract } from 'ethers';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine/flatbuffers';
import { IdRegistry, NameRegistry } from './abis';
import { EthEventsProvider } from './ethEventsProvider';
import { Result } from 'ethers/lib/utils';
import IdRegistryEventModel from '~/storage/flatbuffers/idRegistryEventModel';
import Factories from '~/test/factories/flatbuffer';
import NameRegistryEventModel from '~/storage/flatbuffers/nameRegistryEventModel';

const db = jestBinaryRocksDB('flatbuffers.ethevents.test');
const engine = new Engine(db);

const fid = Factories.FID.build();
const fname = Factories.Fname.build();

let ethEventsProvider: EthEventsProvider;
let mockRPCProvider: MockRPCProvider;
let mockIdRegistry: Contract;
let mockNameRegistry: Contract;

/** A Mock RPC provider */
class MockRPCProvider extends BaseProvider {
  constructor() {
    // The Goreli networkID is 5
    super(5);
  }

  override async getLogs() {
    return [];
  }
}

/** A Mock Event. Note the disabled no-empty-function rule at the top, it is needed to allow no-op functions in the mock. */
class MockEvent implements Event {
  event?: string;
  eventSignature?: string;
  args?: Result;
  decodeError?: Error;
  decode?: (data: string, topics?: string[] | undefined) => any;
  removeListener: () => void = () => {};
  getBlock: () => Promise<Block> = () => Promise.resolve({} as Block);
  getTransaction: () => Promise<TransactionResponse> = () => Promise.resolve({} as TransactionResponse);
  getTransactionReceipt: () => Promise<TransactionReceipt> = () => Promise.resolve({} as TransactionReceipt);
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  removed: boolean;
  address: string;
  data: string;
  topics: string[];
  transactionHash: string;
  logIndex: number;

  constructor(blockNumber: number, blockHash: string, transactionHash: string, logIndex: number) {
    this.blockNumber = blockNumber;
    this.blockHash = blockHash;
    this.transactionHash = transactionHash;
    this.logIndex = logIndex;

    this.transactionIndex = 0;
    this.removed = false;
    this.address = '';
    this.data = '';
    this.topics = [];
  }
}

beforeAll(async () => {
  mockRPCProvider = new MockRPCProvider();
  mockIdRegistry = new Contract('0x000001', IdRegistry.abi, mockRPCProvider);
  mockNameRegistry = new Contract('0x000002', NameRegistry.abi, mockRPCProvider);
});

describe('process events', () => {
  beforeEach(() => {
    ethEventsProvider = new EthEventsProvider(engine, mockRPCProvider, mockIdRegistry, mockNameRegistry, 6);
    mockRPCProvider.polling = true;
  });

  afterEach(() => {
    mockRPCProvider.polling = false;
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

  test('processes Register events', async () => {
    let blockNumber = 1;

    // Emit a "Register event"
    const r = mockIdRegistry.emit(
      'Register',
      '0x000001',
      BigNumber.from(fid),
      '',
      '',
      new MockEvent(blockNumber++, '0x000001', '0x000001', 0)
    );
    expect(r).toBeTruthy();

    // The event is not immediately available, since it has to wait for confirmations
    await expect(IdRegistryEventModel.get(db, fid)).rejects.toThrow();

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The event is now available
    expect((await IdRegistryEventModel.get(db, fid)).fid()).toEqual(fid);
  });

  test('processes transfer name', async () => {
    let blockNumber = 1;

    // Emit a "Transfer event"
    const r = mockNameRegistry.emit(
      'Transfer',
      '0x000001',
      '0x000002',
      BigNumber.from(fname),
      new MockEvent(blockNumber++, '0x000001', '0x000001', 0)
    );
    expect(r).toBeTruthy();

    // The event is not immediately available, since it has to wait for confirmations
    await expect(NameRegistryEventModel.get(db, fname)).rejects.toThrow();

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The event is now available
    expect((await NameRegistryEventModel.get(db, fname)).fname()).toEqual(fname);
  });
});
