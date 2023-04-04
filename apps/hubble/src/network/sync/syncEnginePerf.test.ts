// eslint-disable-file security/detect-non-literal-fs-filename

import { FarcasterNetwork, Factories, HubRpcClient, IdRegistryEvent, SignerAddMessage } from '@farcaster/hub-nodejs';
import SyncEngine from '~/network/sync/syncEngine';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
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
  let engine: Engine;

  beforeEach(async () => {
    await testDb.clear();
    engine = new Engine(testDb, FarcasterNetwork.TESTNET);
  });

  afterEach(async () => {
    await engine.stop();
  });

  const addMessagesWithTimestamps = async (timestamps: number[], mergeEngine?: Engine) => {
    return await Promise.all(
      timestamps.map(async (t) => {
        const cast = await Factories.CastAddMessage.create(
          { data: { fid, network, timestamp: t } },
          { transient: { signer } }
        );

        const result = await (mergeEngine || engine).mergeMessage(cast);
        expect(result.isOk()).toBeTruthy();
        return Promise.resolve(cast);
      })
    );
  };

  test(
    'should not fetch all messages when snapshot contains non-existent prefix',
    async () => {
      const nowOrig = Date.now;
      let syncEngine1;
      let syncEngine2;

      let engine1;
      let engine2;

      try {
        testDb.clear();
        testDb2.clear();

        engine1 = new Engine(testDb, FarcasterNetwork.TESTNET);
        syncEngine1 = new SyncEngine(engine1, testDb);
        engine2 = new Engine(testDb2, FarcasterNetwork.TESTNET);
        syncEngine2 = new SyncEngine(engine2, testDb2);

        await engine1.mergeIdRegistryEvent(custodyEvent);
        await engine1.mergeMessage(signerAdd);
        await engine2.mergeIdRegistryEvent(custodyEvent);
        await engine2.mergeMessage(signerAdd);

        // Merge the same messages into both engines.
        const messages = await addMessagesWithTimestamps([30662167, 30662169, 30662172], engine1);
        for (const message of messages) {
          await engine2.mergeMessage(message);
        }

        // Sanity check, they should equal
        expect(await syncEngine1.trie.rootHash()).toEqual(await syncEngine2.trie.rootHash());

        // A timestamp after all the messages
        Date.now = () => 1609459200000 + 30662200 * 1000;

        const snapshot2 = (await syncEngine2.getSnapshot())._unsafeUnwrap();
        expect((snapshot2.prefix as Buffer).toString('utf8')).toEqual('0030662');
        // Force a non-existent prefix (the original bug #536 is fixed)
        snapshot2.prefix = Buffer.from('00306622', 'hex');

        let rpcClient = new MockRpcClient(engine2, syncEngine2);
        await syncEngine1.performSync(snapshot2, rpcClient as unknown as HubRpcClient);
        expect(rpcClient.getAllSyncIdsByPrefixCalls.length).toEqual(0);
        expect(rpcClient.getAllMessagesBySyncIdsCalls.length).toEqual(0);

        // Sanity check, they should equal
        expect(await syncEngine1.trie.rootHash()).toEqual(await syncEngine2.trie.rootHash());

        // Even with a bad snapshot, we should still not call the sync APIs because the hashes match
        rpcClient = new MockRpcClient(engine2, syncEngine2);
        await syncEngine1.performSync(
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
        await engine1?.stop();

        await syncEngine2?.stop();
        await engine2?.stop();
      }
    },
    15 * 1000
  );
});
