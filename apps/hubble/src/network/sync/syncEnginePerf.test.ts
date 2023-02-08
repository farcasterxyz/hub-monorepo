// eslint-disable-file security/detect-non-literal-fs-filename

import * as protobufs from '@farcaster/protobufs';
import { FarcasterNetwork } from '@farcaster/protobufs';
import { Factories, HubResult, HubRpcClient } from '@farcaster/utils';
import { ok } from 'neverthrow';
import SyncEngine from '~/network/sync/syncEngine';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { NodeMetadata } from './merkleTrie';
import { EMPTY_HASH } from './trieNode';

const testDb = jestRocksDB(`engine.syncEnginePerf.test`);
const testDb2 = jestRocksDB(`engine2.syncEnginePerf.test`);

const network = protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET;

const fid = Factories.Fid.build();
const custodySigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();

let custodyEvent: protobufs.IdRegistryEvent;
let signerAdd: protobufs.Message;

beforeAll(async () => {
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySigner.signerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerBody: { signer: signer.signerKey } } },
    { transient: { signer: custodySigner } }
  );
});

describe('SyncEngine', () => {
  let engine: Engine;

  beforeEach(async () => {
    await testDb.clear();
    engine = new Engine(testDb, FarcasterNetwork.FARCASTER_NETWORK_TESTNET);
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

  test('should not fetch all messages when snapshot contains non-existent prefix', async () => {
    const nowOrig = Date.now;
    try {
      testDb.clear();
      testDb2.clear();

      const engine1 = new Engine(testDb, FarcasterNetwork.FARCASTER_NETWORK_TESTNET);
      const syncEngine1 = new SyncEngine(engine1, testDb);
      const engine2 = new Engine(testDb2, FarcasterNetwork.FARCASTER_NETWORK_TESTNET);
      const syncEngine2 = new SyncEngine(engine2, testDb2);

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
      Date.now = () => 1640995200000 + 30662200 * 1000;

      const snapshot2 = (await syncEngine2.getSnapshot())._unsafeUnwrap();
      expect((snapshot2.prefix as Buffer).toString('utf8')).toEqual('00306622');

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
    }
  });
});

class MockRpcClient {
  engine: Engine;
  syncEngine: SyncEngine;

  getSyncMetadataByPrefixCalls: Array<any> = [];
  getAllSyncIdsByPrefixCalls: Array<any> = [];
  getAllMessagesBySyncIdsCalls: Array<any> = [];

  constructor(engine: Engine, syncEngine: SyncEngine) {
    this.engine = engine;
    this.syncEngine = syncEngine;
  }

  async getSyncMetadataByPrefix(
    request: protobufs.TrieNodePrefix
  ): Promise<HubResult<protobufs.TrieNodeMetadataResponse>> {
    this.getSyncMetadataByPrefixCalls.push(request);
    const toTrieNodeMetadataResponse = (metadata?: NodeMetadata): protobufs.TrieNodeMetadataResponse => {
      const childrenTrie = [];

      if (!metadata) {
        return protobufs.TrieNodeMetadataResponse.create({});
      }

      if (metadata.children) {
        for (const [, child] of metadata.children) {
          childrenTrie.push(
            protobufs.TrieNodeMetadataResponse.create({
              prefix: child.prefix,
              numMessages: child.numMessages,
              hash: child.hash,
              children: [],
            })
          );
        }
      }

      const metadataResponse = protobufs.TrieNodeMetadataResponse.create({
        prefix: metadata.prefix,
        numMessages: metadata.numMessages,
        hash: metadata.hash,
        children: childrenTrie,
      });

      return metadataResponse;
    };

    const metadata = await this.syncEngine.getTrieNodeMetadata(request.prefix);
    return ok(toTrieNodeMetadataResponse(metadata));
  }

  async getAllSyncIdsByPrefix(request: protobufs.TrieNodePrefix): Promise<HubResult<protobufs.SyncIds>> {
    this.getAllSyncIdsByPrefixCalls.push(request);
    return ok(
      protobufs.SyncIds.create({
        syncIds: await this.syncEngine.getAllSyncIdsByPrefix(request.prefix),
      })
    );
  }

  async getAllMessagesBySyncIds(request: protobufs.SyncIds): Promise<HubResult<protobufs.MessagesResponse>> {
    this.getAllMessagesBySyncIdsCalls.push(request);
    const messagesResult = await this.engine.getAllMessagesBySyncIds(request.syncIds);
    return messagesResult.map((messages) => {
      return protobufs.MessagesResponse.create({ messages: messages ?? [] });
    });
  }
}
