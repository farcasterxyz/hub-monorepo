import {
  Factories,
  bytesToHexString,
  hexStringToBytes,
  FarcasterNetwork,
  IdRegistryEventType,
  NameRegistryEventType,
} from '@farcaster/hub-nodejs';
import {
  OrphanFilter,
  AbstractProvider,
  Block,
  Contract,
  Log,
  Provider,
  TransactionReceipt,
  TransactionResponse,
} from 'ethers';
import { IdRegistry, NameRegistry } from './abis.js';
import { EthEventsProvider } from './ethEventsProvider.js';
import { bytesToBytes32 } from './utils.js';
import { getIdRegistryEvent } from '../storage/db/idRegistryEvent.js';
import { jestRocksDB } from '../storage/db/jestUtils.js';
import { getNameRegistryEvent } from '../storage/db/nameRegistryEvent.js';
import Engine from '../storage/engine/index.js';
import { MockFaultyRPCProvider, MockHub, MockRPCProvider } from '../test/mocks.js';
import { RetryProvider } from './retryProvider.js';

const generateEthAddressHex = () => {
  return bytesToHexString(Factories.EthAddress.build())._unsafeUnwrap();
};

/** A Mock Event. Note the disabled no-empty-function rule at the top, it is needed to allow no-op functions in the mock. */
class MockEvent implements Log {
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

describe('process events', () => {
  const db = jestRocksDB('protobufs.ethEventsProvider.test');
  const engine = new Engine(db, FarcasterNetwork.TESTNET);
  const hub = new MockHub(db, engine);

  const fid = Factories.Fid.build();
  const fname = Factories.Fname.build();

  let ethEventsProvider: EthEventsProvider;
  let mockRPCProvider: MockRPCProvider;
  let mockIdRegistry: Contract;
  let mockNameRegistry: Contract;

  beforeAll(async () => {
    mockRPCProvider = new MockRPCProvider();
    mockIdRegistry = new Contract('0x0000000000000000000000000000000000000001', IdRegistry.abi, mockRPCProvider);
    mockNameRegistry = new Contract('0x0000000000000000000000000000000000000002', NameRegistry.abi, mockRPCProvider);
  });

  afterAll(async () => {
    await engine.stop();
  });

  beforeEach(async () => {
    ethEventsProvider = EthEventsProvider.build(
      hub,
      mockRPCProvider,
      mockIdRegistry,
      mockNameRegistry,
      1,
      10000,
      false
    );
    mockRPCProvider._forEachSubscriber((s) => s.start());
    await ethEventsProvider.start();
  });

  afterEach(async () => {
    await ethEventsProvider.stop();
  });

  const waitForBlock = async (blockNumber: number) => {
    while (ethEventsProvider.getLatestBlockNumber() < blockNumber) {
      // Wait for all async promises to resolve
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
  };

  const addBlocks = async (startAt: number, n: number): Promise<number> => {
    for (let i = 0; i < n; i++) {
      expect(await mockRPCProvider.emit('block', startAt + i)).toBeTruthy();
      await waitForBlock(startAt + i);
    }

    return startAt + n;
  };

  test('processes IdRegistry events', async () => {
    let blockNumber = 1;

    const address1 = generateEthAddressHex();
    const address2 = generateEthAddressHex();

    // Emit a "Register event"
    const rRegister = await mockIdRegistry.emit('Register', address1, BigInt(fid), '', '', {
      log: new MockEvent(
        blockNumber++,
        '0xb000000000000000000000000000000000000001',
        '0x4000000000000000000000000000000000000001',
        0,
        mockRPCProvider
      ),
    });
    expect(rRegister).toBeTruthy();

    // The event is not immediately available, since it has to wait for confirmations
    await expect(getIdRegistryEvent(db, fid)).rejects.toThrow();

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The event is now available
    const idRegistryEvent = await getIdRegistryEvent(db, fid);
    expect(idRegistryEvent.fid).toEqual(fid);

    // Transfer the ID to another address
    await mockIdRegistry.emit('Transfer', address1, address2, BigInt(fid), {
      log: new MockEvent(
        blockNumber++,
        '0xb000000000000000000000000000000000000002',
        '0x4000000000000000000000000000000000000002',
        0,
        mockRPCProvider
      ),
    });

    // The event is not immediately available, since it has to wait for confirmations. We should still get the Register event
    const existingIdRegistryEvent = await getIdRegistryEvent(db, fid);
    expect(existingIdRegistryEvent.type).toEqual(IdRegistryEventType.REGISTER);
    expect(existingIdRegistryEvent.to).toEqual(hexStringToBytes(address1)._unsafeUnwrap());

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The transfer event is now available
    const newIdRegistryEvent = await getIdRegistryEvent(db, fid);
    expect(newIdRegistryEvent.fid).toEqual(fid);
    expect(newIdRegistryEvent.type).toEqual(IdRegistryEventType.TRANSFER);
    expect(newIdRegistryEvent.to).toEqual(hexStringToBytes(address2)._unsafeUnwrap());
    mockRPCProvider._forEachSubscriber((s) => s.stop());
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 5000));
  }, 10000);

  test('processes transfer name', async () => {
    let blockNumber = 1;

    // Emit a "Transfer event"
    const rTransfer = await mockNameRegistry.emit(
      'Transfer',
      '0x0000000000000000000000000000000000000001',
      '0x0000000000000000000000000000000000000002',
      bytesToBytes32(fname)._unsafeUnwrap(),
      {
        log: new MockEvent(
          blockNumber++,
          '0xb000000000000000000000000000000000000001',
          '0x4000000000000000000000000000000000000001',
          0,
          mockRPCProvider
        ),
      }
    );
    expect(rTransfer).toBeTruthy();

    // The event is not immediately available, since it has to wait for confirmations
    await expect(getNameRegistryEvent(db, fname)).rejects.toThrow();

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The event is now available
    expect((await getNameRegistryEvent(db, fname)).fname).toEqual(fname);

    // Renew the fname
    await mockNameRegistry.emit('Renew', bytesToBytes32(fname)._unsafeUnwrap(), BigInt(Date.now() + 1000), {
      log: new MockEvent(
        blockNumber++,
        '0xb000000000000000000000000000000000000002',
        '0x4000000000000000000000000000000000000002',
        0,
        mockRPCProvider
      ),
    });
    // The event is not immediately available, since it has to wait for confirmations. We should still get the Transfer event
    expect(await getNameRegistryEvent(db, fname)).toMatchObject({
      type: NameRegistryEventType.TRANSFER,
    });

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The renew event is now available
    expect(await getNameRegistryEvent(db, fname)).toMatchObject({
      fname,
      type: NameRegistryEventType.RENEW,
    });
    mockRPCProvider._forEachSubscriber((s) => s.stop());
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 5000));
  }, 10000);
});

describe('process events with faulty rpc', () => {
  const db = jestRocksDB('protobufs.ethEventsProvider.test');
  const engine = new Engine(db, FarcasterNetwork.TESTNET);
  const hub = new MockHub(db, engine);

  const fid = Factories.Fid.build();
  const fname = Factories.Fname.build();

  let ethEventsProvider: EthEventsProvider;
  let mockFaultyRPCProvider: MockFaultyRPCProvider;
  let mockFaultyIdRegistry: Contract;
  let mockFaultyNameRegistry: Contract;

  beforeAll(async () => {
    const RetryingProvider = RetryProvider(MockFaultyRPCProvider, 1);
    mockFaultyRPCProvider = new RetryingProvider();

    mockFaultyIdRegistry = new Contract(
      '0x0000000000000000000000000000000000000001',
      IdRegistry.abi,
      mockFaultyRPCProvider
    );
    mockFaultyNameRegistry = new Contract(
      '0x0000000000000000000000000000000000000002',
      NameRegistry.abi,
      mockFaultyRPCProvider
    );
  });

  beforeEach(async () => {
    ethEventsProvider = EthEventsProvider.build(
      hub,
      mockFaultyRPCProvider,
      mockFaultyIdRegistry,
      mockFaultyNameRegistry,
      1,
      10000,
      false,
      1
    );
    mockFaultyRPCProvider._forEachSubscriber((s) => s.start());
    await ethEventsProvider.start();
  });

  afterAll(async () => {
    await engine.stop();
  });

  afterEach(async () => {
    await ethEventsProvider.stop();
  });

  const waitForBlock = async (blockNumber: number) => {
    while (ethEventsProvider.getLatestBlockNumber() < blockNumber) {
      // Wait for all async promises to resolve
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
  };

  const addBlocks = async (startAt: number, n: number): Promise<number> => {
    for (let i = 0; i < n; i++) {
      expect(await mockFaultyRPCProvider.emit('block', startAt + i)).toBeTruthy();
      await waitForBlock(startAt + i);
    }

    return startAt + n;
  };

  test('processes IdRegistry events', async () => {
    let blockNumber = 1;

    const address1 = generateEthAddressHex();
    const address2 = generateEthAddressHex();

    // Emit a "Register event"
    const rRegister = await mockFaultyIdRegistry.emit('Register', address1, BigInt(fid), '', '', {
      log: new MockEvent(
        blockNumber++,
        '0xb000000000000000000000000000000000000001',
        '0x4000000000000000000000000000000000000001',
        0,
        mockFaultyRPCProvider
      ),
    });
    expect(rRegister).toBeTruthy();

    // The event is not immediately available, since it has to wait for confirmations
    await expect(getIdRegistryEvent(db, fid)).rejects.toThrow();

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The event is now available
    const idRegistryEvent = await getIdRegistryEvent(db, fid);
    expect(idRegistryEvent.fid).toEqual(fid);

    // Transfer the ID to another address
    await mockFaultyIdRegistry.emit('Transfer', address1, address2, BigInt(fid), {
      log: new MockEvent(
        blockNumber++,
        '0xb000000000000000000000000000000000000002',
        '0x4000000000000000000000000000000000000002',
        0,
        mockFaultyRPCProvider
      ),
    });

    // The event is not immediately available, since it has to wait for confirmations. We should still get the Register event
    const existingIdRegistryEvent = await getIdRegistryEvent(db, fid);
    expect(existingIdRegistryEvent.type).toEqual(IdRegistryEventType.REGISTER);
    expect(existingIdRegistryEvent.to).toEqual(hexStringToBytes(address1)._unsafeUnwrap());

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The transfer event is now available
    const newIdRegistryEvent = await getIdRegistryEvent(db, fid);
    expect(newIdRegistryEvent.fid).toEqual(fid);
    expect(newIdRegistryEvent.type).toEqual(IdRegistryEventType.TRANSFER);
    expect(newIdRegistryEvent.to).toEqual(hexStringToBytes(address2)._unsafeUnwrap());
    mockFaultyRPCProvider._forEachSubscriber((s) => s.stop());
    // Because we have no control over ethers' polling (i.e. stop doesn't stop until the next delay), we have to wait it
    // out.
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 6000));
  }, 35000);

  test('processes transfer name', async () => {
    let blockNumber = 1;

    // Emit a "Transfer event"
    const rTransfer = await mockFaultyNameRegistry.emit(
      'Transfer',
      '0x0000000000000000000000000000000000000001',
      '0x0000000000000000000000000000000000000002',
      bytesToBytes32(fname)._unsafeUnwrap(),
      {
        log: new MockEvent(
          blockNumber++,
          '0xb000000000000000000000000000000000000001',
          '0x4000000000000000000000000000000000000001',
          0,
          mockFaultyRPCProvider
        ),
      }
    );
    expect(rTransfer).toBeTruthy();

    // The event is not immediately available, since it has to wait for confirmations
    await expect(getNameRegistryEvent(db, fname)).rejects.toThrow();

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The event is now available
    expect((await getNameRegistryEvent(db, fname)).fname).toEqual(fname);

    // Renew the fname
    await mockFaultyNameRegistry.emit('Renew', bytesToBytes32(fname)._unsafeUnwrap(), BigInt(Date.now() + 1000), {
      log: new MockEvent(
        blockNumber++,
        '0xb000000000000000000000000000000000000002',
        '0x4000000000000000000000000000000000000002',
        0,
        mockFaultyRPCProvider
      ),
    });

    // The event is not immediately available, since it has to wait for confirmations. We should still get the Transfer event
    expect(await getNameRegistryEvent(db, fname)).toMatchObject({
      type: NameRegistryEventType.TRANSFER,
    });

    // Add 6 confirmations
    blockNumber = await addBlocks(blockNumber, 6);

    // The renew event is now available
    expect(await getNameRegistryEvent(db, fname)).toMatchObject({
      fname,
      type: NameRegistryEventType.RENEW,
    });
    mockFaultyRPCProvider._forEachSubscriber((s) => s.stop());
    // Because we have no control over ethers' polling (i.e. stop doesn't stop until the next delay), we have to wait it
    // out.
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 6000));
  }, 35000);

  test('fname expiry handles retry', async () => {
    expect(await ethEventsProvider.getFnameExpiry(Buffer.from('test', 'utf-8'))).resolves;
    mockFaultyRPCProvider._forEachSubscriber((s) => s.stop());
    // Because we have no control over ethers' polling (i.e. stop doesn't stop until the next delay), we have to wait it
    // out.
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 6000));
  }, 15000);
});
