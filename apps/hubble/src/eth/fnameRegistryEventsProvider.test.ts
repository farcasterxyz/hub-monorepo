import { FNameRegistryEventsProvider } from './fnameRegistryEventsProvider.js';
import { jestRocksDB } from '../storage/db/jestUtils.js';
import Engine from '../storage/engine/index.js';
import { FarcasterNetwork } from '@farcaster/hub-nodejs';
import { MockHub } from '../test/mocks.js';
import { getUserNameProof } from '../storage/db/nameRegistryEvent.js';
import { utf8ToBytes } from '@noble/curves/abstract/utils';

describe('fnameRegistryEventsProvider', () => {
  const db = jestRocksDB('protobufs.ethEventsProvider.test');
  const engine = new Engine(db, FarcasterNetwork.TESTNET);
  const hub = new MockHub(db, engine);
  let provider: FNameRegistryEventsProvider;

  beforeEach(() => {
    provider = new FNameRegistryEventsProvider('http://localhost:2284', hub);
  });

  describe('syncHistoricalEvents', () => {
    it('fetches all events from the beginning', async () => {
      await provider.start();
      expect(await getUserNameProof(db, utf8ToBytes('test1'))).toBeTruthy();
    });
  });
});
