import { Event } from '@ethersproject/contracts';
import { BaseProvider, Block, TransactionReceipt, TransactionResponse } from '@ethersproject/providers';
import * as protobufs from '@farcaster/protobufs';
import { Factories, bytesToHexString, hexStringToBytes } from '@farcaster/utils';
import { BigNumber, Contract, utils } from 'ethers';
import { IdRegistry, NameRegistry } from '~/eth/abis';
import { EthEventsProvider } from '~/eth/ethEventsProvider';
import { bytesToBytes32 } from '~/eth/utils';
import { getIdRegistryEvent } from '~/storage/db/idRegistryEvent';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { getNameRegistryEvent } from '~/storage/db/nameRegistryEvent';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('flatbuffers.ethEventsProvider.test');
const engine = new Engine(db, protobufs.FarcasterNetwork.TESTNET);
const hub = new MockHub(db, engine);

const fid = Factories.Fid.build();
const fname = Factories.Fname.build();

let ethEventsProvider: EthEventsProvider;
let mockRPCProvider: MockRPCProvider;
let mockIdRegistry: Contract;
let mockNameRegistry: Contract;

const generateEthAddressHex = () => {
  return bytesToHexString(Factories.EthAddress.build())._unsafeUnwrap();
};

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
  args?: utils.Result;
  decodeError?: Error;
  decode?: (data: string, topics?: string[] | undefined) => any;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
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
    ethEventsProvider = new EthEventsProvider(hub, mockRPCProvider, mockIdRegistry, mockNameRegistry, 1, 10000);
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

    const address1 = generateEthAddressHex();
    const address2 = generateEthAddressHex();

    // Emit a "Register event"
    const rRegister = mockIdRegistry.emit(
      'Register',
      address1,
      BigNumber.from(fid),
      '',
      '',
      new MockEvent(blockNumber++, '0xb00001', '0x400001', 0)
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
      BigNumber.from(fid),
      new MockEvent(blockNumber++, '0xb00002', '0x400002', 0)
    );
    // The event is not immediately available, since it has to wait for confirmations. We should still get the Register event
    const existingIdRegistryEvent = await getIdRegistryEvent(db, fid);
    expect(existingIdRegistryEvent.type).toEqual(protobufs.IdRegistryEventType.REGISTER);
    expect(existingIdRegistryEvent.to).toEqual(hexStringToBytes(address1)._unsafeUnwrap());

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The transfer event is now available
    const newIdRegistryEvent = await getIdRegistryEvent(db, fid);
    expect(newIdRegistryEvent.fid).toEqual(fid);
    expect(newIdRegistryEvent.type).toEqual(protobufs.IdRegistryEventType.TRANSFER);
    expect(newIdRegistryEvent.to).toEqual(hexStringToBytes(address2)._unsafeUnwrap());
  });

  test('processes transfer name', async () => {
    let blockNumber = 1;

    // Emit a "Transfer event"
    const rTransfer = mockNameRegistry.emit(
      'Transfer',
      '0x000001',
      '0x000002',
      bytesToBytes32(fname)._unsafeUnwrap(),
      new MockEvent(blockNumber++, '0xb00001', '0x400001', 0)
    );
    expect(rTransfer).toBeTruthy();

    // The event is not immediately available, since it has to wait for confirmations
    await expect(getNameRegistryEvent(db, fname)).rejects.toThrow();

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The event is now available
    expect((await getNameRegistryEvent(db, fname)).fname).toEqual(fname);

    // Renew the fname
    mockNameRegistry.emit(
      'Renew',
      bytesToBytes32(fname)._unsafeUnwrap(),
      BigNumber.from(Date.now() + 1000),
      new MockEvent(blockNumber++, '0xb00002', '0x400002', 0)
    );
    // The event is not immediately available, since it has to wait for confirmations. We should still get the Transfer event
    expect(await getNameRegistryEvent(db, fname)).toMatchObject({
      type: protobufs.NameRegistryEventType.TRANSFER,
    });

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The renew event is now available
    expect(await getNameRegistryEvent(db, fname)).toMatchObject({
      fname,
      type: protobufs.NameRegistryEventType.RENEW,
    });
  });
});
