/* eslint-disable @typescript-eslint/no-empty-function */
import { Event } from '@ethersproject/contracts';
import { BaseProvider, Block, TransactionReceipt, TransactionResponse } from '@ethersproject/providers';
import { bytesToHexString, hexStringToBytes } from '@hub/bytes';
import { IdRegistryEventType, NameRegistryEventType } from '@hub/flatbuffers';
import { BigNumber, Contract } from 'ethers';
import { Result } from 'ethers/lib/utils';
import { IdRegistry, NameRegistry } from '~/eth/abis';
import { EthEventsProvider } from '~/eth/ethEventsProvider';
import Factories from '~/flatbuffers/factories';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('flatbuffers.ethEventsProvider.test');
const engine = new Engine(db);
const hub = new MockHub(db, engine);

const fid = Factories.FID.build();
const fname = Factories.Fname.build();

let ethEventsProvider: EthEventsProvider;
let mockRPCProvider: MockRPCProvider;
let mockIdRegistry: Contract;
let mockNameRegistry: Contract;

/** A Mock RPC provider */
class MockRPCProvider extends BaseProvider {
  constructor() {
    // The Goerli networkID is 5
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
  beforeEach(async () => {
    ethEventsProvider = new EthEventsProvider(hub, mockRPCProvider, mockIdRegistry, mockNameRegistry);
    mockRPCProvider.polling = true;
    await ethEventsProvider.start();
  });

  afterEach(async () => {
    mockRPCProvider.polling = false;
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

    const address1 = '0x000001';
    const address2 = '0x000002';

    // Emit a "Register event"
    const rRegister = mockIdRegistry.emit(
      'Register',
      address1,
      BigNumber.from(bytesToHexString(fid)._unsafeUnwrap()),
      '',
      '',
      new MockEvent(blockNumber++, '0xb00001', '0x400001', 0)
    );
    expect(rRegister).toBeTruthy();

    // The event is not immediately available, since it has to wait for confirmations
    await expect(IdRegistryEventModel.get(db, fid)).rejects.toThrow();

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The event is now available
    expect((await IdRegistryEventModel.get(db, fid)).fid()).toEqual(fid);

    // Transfer the ID to another address
    mockIdRegistry.emit(
      'Transfer',
      address1,
      address2,
      BigNumber.from(bytesToHexString(fid)._unsafeUnwrap()),
      new MockEvent(blockNumber++, '0xb00002', '0x400002', 0)
    );
    // The event is not immediately available, since it has to wait for confirmations. We should still get the Register event
    expect((await IdRegistryEventModel.get(db, fid)).type()).toEqual(IdRegistryEventType.IdRegistryRegister);
    expect((await IdRegistryEventModel.get(db, fid)).to()).toEqual(hexStringToBytes(address1)._unsafeUnwrap());

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The transfer event is now available
    expect((await IdRegistryEventModel.get(db, fid)).fid()).toEqual(fid);
    expect((await IdRegistryEventModel.get(db, fid)).type()).toEqual(IdRegistryEventType.IdRegistryTransfer);
    expect((await IdRegistryEventModel.get(db, fid)).to()).toEqual(hexStringToBytes(address2)._unsafeUnwrap());
  });

  test('processes transfer name', async () => {
    let blockNumber = 1;

    // Emit a "Transfer event"
    const rTransfer = mockNameRegistry.emit(
      'Transfer',
      '0x000001',
      '0x000002',
      BigNumber.from(bytesToHexString(fname)._unsafeUnwrap()),
      new MockEvent(blockNumber++, '0xb00001', '0x400001', 0)
    );
    expect(rTransfer).toBeTruthy();

    // The event is not immediately available, since it has to wait for confirmations
    await expect(NameRegistryEventModel.get(db, fname)).rejects.toThrow();

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The event is now available
    expect((await NameRegistryEventModel.get(db, fname)).fname()).toEqual(fname);

    // Renew the fname
    mockNameRegistry.emit(
      'Renew',
      BigNumber.from(bytesToHexString(fname)._unsafeUnwrap()),
      BigNumber.from(1000),
      new MockEvent(blockNumber++, '0xb00002', '0x400002', 0)
    );
    // The event is not immediately available, since it has to wait for confirmations. We should still get the Transfer event
    expect((await NameRegistryEventModel.get(db, fname)).type()).toEqual(NameRegistryEventType.NameRegistryTransfer);

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The renew event is now available
    expect((await NameRegistryEventModel.get(db, fname)).fname()).toEqual(fname);
    expect((await NameRegistryEventModel.get(db, fname)).type()).toEqual(NameRegistryEventType.NameRegistryRenew);
  });
});
