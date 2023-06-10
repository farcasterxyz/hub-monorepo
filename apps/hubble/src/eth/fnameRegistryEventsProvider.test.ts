import {
  FNameRegistryClientInterface,
  FNameRegistryEventsProvider,
  FNameTransfer,
} from './fnameRegistryEventsProvider.js';
import { jestRocksDB } from '../storage/db/jestUtils.js';
import Engine from '../storage/engine/index.js';
import { FarcasterNetwork } from '@farcaster/hub-nodejs';
import { MockHub } from '../test/mocks.js';
import { getUserNameProof } from '../storage/db/nameRegistryEvent.js';
import { utf8ToBytes } from '@noble/curves/abstract/utils';

class MockFnameRegistryClient implements FNameRegistryClientInterface {
  private transfersToReturn: FNameTransfer[][] = [];
  private minimumSince = 0;

  setTransfersToReturn(transfers: FNameTransfer[][]) {
    this.transfersToReturn = transfers;
  }

  setMinimumSince(minimumSince: number) {
    this.minimumSince = minimumSince;
  }

  async getTransfers(since: 0): Promise<FNameTransfer[]> {
    expect(since).toBeGreaterThanOrEqual(this.minimumSince);
    const transfers = this.transfersToReturn.shift();
    if (!transfers) {
      return Promise.resolve([]);
    }
    return Promise.resolve(transfers);
  }
}

describe('fnameRegistryEventsProvider', () => {
  const db = jestRocksDB('protobufs.fnameRegistry.test');
  const engine = new Engine(db, FarcasterNetwork.TESTNET);
  const hub = new MockHub(db, engine);
  let provider: FNameRegistryEventsProvider;
  let mockFnameRegistryClient: MockFnameRegistryClient;
  const transferEvents: FNameTransfer[] = [
    { username: 'test1', from: 0, to: 1, timestamp: 1686291736947, owner: '', signature: '' },
    { username: 'test2', from: 0, to: 2, timestamp: 1686291740231, owner: '', signature: '' },
    { username: 'test3', from: 0, to: 3, timestamp: 1686291751362, owner: '', signature: '' },
    { username: 'test3', from: 3, to: 0, timestamp: 1686291752129, owner: '', signature: '' },
  ];

  beforeEach(() => {
    mockFnameRegistryClient = new MockFnameRegistryClient();
    mockFnameRegistryClient.setTransfersToReturn([
      transferEvents.slice(0, 1),
      transferEvents.slice(1, 2),
      transferEvents.slice(2),
    ]);
    provider = new FNameRegistryEventsProvider(mockFnameRegistryClient, hub);
  });

  afterEach(async () => {
    await provider.stop();
  });

  describe('syncHistoricalEvents', () => {
    it('fetches all events from the beginning', async () => {
      await provider.start();
      expect(await getUserNameProof(db, utf8ToBytes('test1'))).toBeTruthy();
      expect(await getUserNameProof(db, utf8ToBytes('test2'))).toBeTruthy();
      await expect(getUserNameProof(db, utf8ToBytes('test4'))).rejects.toThrowError('NotFound');
      expect((await hub.getHubState())._unsafeUnwrap().lastFnameProof).toEqual(transferEvents[3]!.timestamp);
    });

    it('fetches events from where it left off', async () => {
      await hub.putHubState({ lastFnameProof: transferEvents[0]!.timestamp, lastEthBlock: 0 });
      mockFnameRegistryClient.setMinimumSince(transferEvents[0]!.timestamp);
      await provider.start();
      expect(await getUserNameProof(db, utf8ToBytes('test2'))).toBeTruthy();
      expect((await hub.getHubState())._unsafeUnwrap().lastFnameProof).toEqual(transferEvents[3]!.timestamp);
    });
  });

  describe('handles events', () => {
    it('deletes a proof from the db when a username is unregistered', async () => {
      await provider.start();
      await expect(getUserNameProof(db, utf8ToBytes('test3'))).rejects.toThrowError('NotFound');
    });
  });
});
