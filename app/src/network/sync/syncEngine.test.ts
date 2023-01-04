import { hexStringToBytes } from '@hub/bytes';
import { MessageType } from '@hub/flatbuffers';
import { utils, Wallet } from 'ethers';
import { ok } from 'neverthrow';
import { anyString, instance, mock, when } from 'ts-mockito';
import Factories from '~/flatbuffers/factories';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import { CastAddModel, CastRemoveModel, KeyPair, SignerAddModel } from '~/flatbuffers/models/types';
import { getFarcasterTime } from '~/flatbuffers/utils/time';
import SyncEngine from '~/network/sync/syncEngine';
import { SyncId } from '~/network/sync/syncId';
import Client from '~/rpc/client';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { generateEd25519KeyPair } from '~/utils/crypto';

const testDb = jestRocksDB(`engine.syncEngine.test`);
const fid = Factories.FID.build();
const wallet = new Wallet(utils.randomBytes(32));

let custodyEvent: IdRegistryEventModel;
let signer: KeyPair;
let signerAdd: SignerAddModel;
let castAdd: CastAddModel;

beforeAll(async () => {
  custodyEvent = new IdRegistryEventModel(
    await Factories.IdRegistryEvent.create(
      { to: Array.from(hexStringToBytes(wallet.address)._unsafeUnwrap()), fid: Array.from(fid) },
      { transient: { wallet } }
    )
  );

  signer = await generateEd25519KeyPair();
  const signerAddData = await Factories.SignerAddData.create({
    body: Factories.SignerBody.build({ signer: Array.from(signer.publicKey) }),
    fid: Array.from(fid),
  });
  signerAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { wallet } })
  ) as SignerAddModel;

  const castAddData = await Factories.CastAddData.create({
    fid: Array.from(fid),
  });
  castAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(castAddData.bb?.bytes() ?? []) }, { transient: { signer } })
  ) as CastAddModel;
});

describe('SyncEngine', () => {
  let syncEngine: SyncEngine;
  let engine: Engine;

  beforeEach(async () => {
    await testDb.clear();
    engine = new Engine(testDb);
    syncEngine = new SyncEngine(engine);
  });

  const addMessagesWithTimestamps = async (timestamps: number[]) => {
    return await Promise.all(
      timestamps.map(async (t) => {
        const addData = await Factories.CastAddData.create({ fid: Array.from(fid), timestamp: t });
        const addMessage = await Factories.Message.create(
          { data: Array.from(addData.bb?.bytes() ?? []) },
          { transient: { signer } }
        );
        const addMessageModel = new MessageModel(addMessage);

        const result = await engine.mergeMessage(addMessageModel);
        expect(result.isOk()).toBeTruthy();
        return Promise.resolve(addMessageModel);
      })
    );
  };

  test('trie is updated on successful merge', async () => {
    const existingItems = syncEngine.trie.items;

    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
    const result = await engine.mergeMessage(castAdd);

    expect(result.isOk()).toBeTruthy();

    // Two messages (signerAdd + castAdd) was added to the trie
    expect(syncEngine.trie.items - existingItems).toEqual(2);
    expect(syncEngine.trie.exists(new SyncId(castAdd))).toBeTruthy();
  });

  test('trie is not updated on merge failure', async () => {
    expect(syncEngine.trie.items).toEqual(0);

    // Merging a message without the custody event should fail
    const result = await engine.mergeMessage(castAdd);

    expect(result.isErr()).toBeTruthy();
    expect(syncEngine.trie.items).toEqual(0);
    expect(syncEngine.trie.exists(new SyncId(castAdd))).toBeFalsy();
  });

  test('trie is updated when a message is removed', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
    let result = await engine.mergeMessage(castAdd);
    expect(result.isOk()).toBeTruthy();

    // Remove this cast.
    const castRemoveBody = await Factories.CastRemoveBody.create({ targetTsHash: Array.from(castAdd.tsHash()) });
    const castRemoveData = await Factories.CastRemoveData.create({
      fid: Array.from(fid),
      body: castRemoveBody.unpack(),
    });
    const castRemove = new MessageModel(
      await Factories.Message.create({ data: Array.from(castRemoveData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as CastRemoveModel;

    // Merging the cast remove deletes the cast add in the db, and it should be reflected in the trie
    result = await engine.mergeMessage(castRemove);
    expect(result.isOk()).toBeTruthy();

    const id = new SyncId(castRemove);
    expect(syncEngine.trie.exists(id)).toBeTruthy();

    const allMessages = await engine.getAllMessagesBySyncIds([id.toString()]);
    expect(allMessages.isOk()).toBeTruthy();
    expect(allMessages._unsafeUnwrap()[0]?.type()).toEqual(MessageType.CastRemove);

    // The trie should contain the message remove
    expect(syncEngine.trie.exists(id)).toBeTruthy();

    // The trie should not contain the castAdd anymore
    expect(syncEngine.trie.exists(new SyncId(castAdd))).toBeFalsy();
  });

  test('snapshotTimestampPrefix trims the seconds', async () => {
    const nowInSeconds = getFarcasterTime();
    const snapshotTimestamp = syncEngine.snapshotTimestamp;
    expect(snapshotTimestamp).toBeLessThanOrEqual(nowInSeconds);
    expect(snapshotTimestamp).toEqual(Math.floor(nowInSeconds / 10) * 10);
  });

  test('shouldSync returns false when already syncing', async () => {
    const mockRPCClient = mock(Client);
    const rpcClient = instance(mockRPCClient);
    let called = false;
    when(mockRPCClient.getSyncMetadataByPrefix(anyString())).thenCall(() => {
      expect(syncEngine.shouldSync([])).toBeFalsy();
      called = true;
      // Return an empty child map so sync will finish with a noop
      return Promise.resolve(ok({ prefix: '', numMessages: 1000, hash: '', children: new Map() }));
    });
    await syncEngine.performSync(['some-divergence'], rpcClient);
    expect(called).toBeTruthy();
  });

  test('shouldSync returns false when excludedHashes match', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);

    await addMessagesWithTimestamps([30662167, 30662169, 30662172]);
    expect(syncEngine.shouldSync(syncEngine.snapshot.excludedHashes)).toBeFalsy();
  });

  test('shouldSync returns true when hashes dont match', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);

    await addMessagesWithTimestamps([30662167, 30662169, 30662172]);
    const oldSnapshot = syncEngine.snapshot;
    await addMessagesWithTimestamps([30662372]);
    expect(oldSnapshot.excludedHashes).not.toEqual(syncEngine.snapshot.excludedHashes);
    expect(syncEngine.shouldSync(oldSnapshot.excludedHashes)).toBeTruthy();
  });

  // xtest('should not sync if messages were added within the sync threshold', async () => {
  //   const user = await mockFid(engine, faker.datatype.number());
  //   const snapshotTimestamp = syncEngine.snapshotTimestamp;
  //   await addMessagesWithTimestamps(user, [snapshotTimestamp - 3, snapshotTimestamp - 2, snapshotTimestamp - 1]);

  //   const snapshot = syncEngine.snapshot;
  //   // Add a message after the snapshot, within the sync threshold
  //   await addMessagesWithTimestamps(user, [snapshotTimestamp + 1]);
  //   expect(syncEngine.shouldSync(snapshot.excludedHashes)).toBeFalsy();
  // });

  test('initialize populates the trie with all existing messages', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);

    const messages = await addMessagesWithTimestamps([30662167, 30662169, 30662172]);

    const syncEngine = new SyncEngine(engine);
    expect(syncEngine.trie.items).toEqual(0);

    await syncEngine.initialize();

    // There might be more messages related to user creation, but it's sufficient to check for casts
    expect(syncEngine.trie.items).toBeGreaterThanOrEqual(3);
    expect(syncEngine.trie.rootHash).toBeTruthy();
    expect(syncEngine.trie.exists(new SyncId(messages[0] as MessageModel))).toBeTruthy();
    expect(syncEngine.trie.exists(new SyncId(messages[1] as MessageModel))).toBeTruthy();
    expect(syncEngine.trie.exists(new SyncId(messages[2] as MessageModel))).toBeTruthy();
  });
});
