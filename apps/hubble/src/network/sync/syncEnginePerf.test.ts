// eslint-disable-file security/detect-non-literal-fs-filename

import {
  FarcasterNetwork,
  Factories,
  HubRpcClient,
  IdRegistryEvent,
  SignerAddMessage,
  CastAddMessage,
} from '@farcaster/hub-nodejs';
import SyncEngine from '~/network/sync/syncEngine';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { MockHub } from '~/test/mocks';
import { MockRpcClient } from './mock';
import { EMPTY_HASH } from './trieNode';

const testDb = jestRocksDB(`engine.syncEnginePerf.test`);
const testDb2 = jestRocksDB(`engine2.syncEnginePerf.test`);

const network = FarcasterNetwork.TESTNET;
const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodyEvent: IdRegistryEvent;
let signerAdd: SignerAddMessage;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } }
  );
});

describe('SyncEngine', () => {
  const makeMessagesWithTimestamps = async (timestamps: number[]): Promise<CastAddMessage[]> => {
    return await Promise.all(
      timestamps.map(async (t) => {
        return Factories.CastAddMessage.create({ data: { fid, network, timestamp: t } }, { transient: { signer } });
      })
    );
  };

  test(
    'should not fetch all messages when snapshot contains non-existent prefix',
    async () => {
      const nowOrig = Date.now;

      const hub1 = new MockHub(testDb);
      const syncEngine1 = new SyncEngine(hub1, testDb);
      const hub2 = new MockHub(testDb2);
      const syncEngine2 = new SyncEngine(hub2, testDb2);

      try {
        await hub1.submitIdRegistryEvent(custodyEvent);
        await hub1.submitMessage(signerAdd);
        await hub2.submitIdRegistryEvent(custodyEvent);
        await hub2.submitMessage(signerAdd);

        // Merge the same messages into both engines.
        const messages = await makeMessagesWithTimestamps([30662167, 30662169, 30662172]);
        for (const message of messages) {
          await hub1.submitMessage(message);
          await hub2.submitMessage(message);
        }

        // Sanity check, they should equal
        expect(await syncEngine1.trie.rootHash()).toEqual(await syncEngine2.trie.rootHash());

        // A timestamp after all the messages
        Date.now = () => 1609459200000 + 30662200 * 1000;

        const snapshot2 = (await syncEngine2.getSnapshot())._unsafeUnwrap();
        expect((snapshot2.prefix as Buffer).toString('utf8')).toEqual('0030662');
        // Force a non-existent prefix (the original bug #536 is fixed)
        snapshot2.prefix = Buffer.from('00306622', 'hex');

        let rpcClient = new MockRpcClient(hub2.engine, syncEngine2);
        await syncEngine1.performSync('engine2', snapshot2, rpcClient as unknown as HubRpcClient);
        expect(rpcClient.getAllSyncIdsByPrefixCalls.length).toEqual(0);
        expect(rpcClient.getAllMessagesBySyncIdsCalls.length).toEqual(0);

        // Sanity check, they should equal
        expect(await syncEngine1.trie.rootHash()).toEqual(await syncEngine2.trie.rootHash());

        // Even with a bad snapshot, we should still not call the sync APIs because the hashes match
        rpcClient = new MockRpcClient(hub2.engine, syncEngine2);
        await syncEngine1.performSync(
          'engine2',
          {
            numMessages: 1000,
            prefix: Buffer.from('999999'),
            excludedHashes: [EMPTY_HASH],
          },
          rpcClient as unknown as HubRpcClient
        );
        expect(rpcClient.getAllSyncIdsByPrefixCalls.length).toEqual(0);
        expect(rpcClient.getAllMessagesBySyncIdsCalls.length).toEqual(0);
      } finally {
        Date.now = nowOrig;
        await syncEngine1?.stop();
        await syncEngine2?.stop();
      }
    },
    15 * 1000
  );
});
