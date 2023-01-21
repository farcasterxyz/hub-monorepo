import { FarcasterNetwork, MessageType, ReactionBody } from '@farcaster/flatbuffers';
import { Factories, getFarcasterTime } from '@farcaster/utils';
import { ok } from 'neverthrow';
import { anyString, instance, mock, when } from 'ts-mockito';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import { CastAddModel, CastRemoveModel, SignerAddModel } from '~/flatbuffers/models/types';
import SyncEngine from '~/network/sync/syncEngine';
import { SyncId } from '~/network/sync/syncId';
import Client from '~/rpc/client';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';

const testDb = jestRocksDB(`engine.syncEngine.test`);
const testDb2 = jestRocksDB(`engine2.syncEngine.test`);

const fid = Factories.FID.build();
const ethSigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();

let custodyEvent: IdRegistryEventModel;
let signerAdd: SignerAddModel;
let castAdd: CastAddModel;

beforeAll(async () => {
  custodyEvent = new IdRegistryEventModel(
    await Factories.IdRegistryEvent.create({ to: Array.from(ethSigner.signerKey), fid: Array.from(fid) })
  );

  const signerAddData = await Factories.SignerAddData.create({
    body: Factories.SignerBody.build({ signer: Array.from(signer.signerKey) }),
    fid: Array.from(fid),
  });
  signerAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { ethSigner } })
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
    engine = new Engine(testDb, FarcasterNetwork.Testnet);
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
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine.trie.exists(new SyncId(castAdd))).toBeTruthy();
  });

  test('trie is not updated on merge failure', async () => {
    expect(syncEngine.trie.items).toEqual(0);

    // Merging a message without the custody event should fail
    const result = await engine.mergeMessage(castAdd);

    expect(result.isErr()).toBeTruthy();
    expect(syncEngine.trie.items).toEqual(0);
    // eslint-disable-next-line security/detect-non-literal-fs-filename
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
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine.trie.exists(id)).toBeTruthy();

    const allMessages = await engine.getAllMessagesBySyncIds([id.idString()]);
    expect(allMessages.isOk()).toBeTruthy();
    expect(allMessages._unsafeUnwrap()[0]?.type()).toEqual(MessageType.CastRemove);

    // The trie should contain the message remove
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine.trie.exists(id)).toBeTruthy();

    // The trie should not contain the castAdd anymore
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine.trie.exists(new SyncId(castAdd))).toBeFalsy();
  });

  test('trie is updated when message with higher order is merged', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);

    // Reaction
    const reaction1 = await Factories.ReactionAddData.create({ fid: Array.from(fid), timestamp: 30662167 });
    const body1 = reaction1.body(new ReactionBody()) as ReactionBody;
    const reaction1Message = await Factories.Message.create(
      {
        data: Array.from(reaction1.bb?.bytes() ?? []),
      },
      { transient: { signer } }
    );
    const reaction1Model = new MessageModel(reaction1Message);

    // Same reaction, but with different timestamp
    const reaction2 = await Factories.ReactionAddData.create({
      fid: Array.from(reaction1.fidArray() ?? new Uint8Array()),
      network: reaction1.network(),
      type: reaction1.type(),
      body: body1.unpack(),
      timestamp: reaction1.timestamp() + 1,
    });
    const reaction2Message = await Factories.Message.create(
      {
        data: Array.from(reaction2.bb?.bytes() ?? []),
      },
      { transient: { signer } }
    );
    const reaction2Model = new MessageModel(reaction2Message);

    // Merging the first reaction should succeed
    let result = await engine.mergeMessage(reaction1Model);
    expect(result.isOk()).toBeTruthy();
    expect(syncEngine.trie.items).toEqual(2); // signerAdd + reaction1

    // Then merging the second reaction should also succeed and remove reaction1
    result = await engine.mergeMessage(reaction2Model);
    expect(result.isOk()).toBeTruthy();
    expect(syncEngine.trie.items).toEqual(2); // signerAdd + reaction2 (reaction1 is removed)

    // Create a new engine and sync engine
    testDb2.clear();
    const engine2 = new Engine(testDb2, FarcasterNetwork.Testnet);
    const syncEngine2 = new SyncEngine(engine2);
    await engine2.mergeIdRegistryEvent(custodyEvent);
    await engine2.mergeMessage(signerAdd);

    // Only merge reaction2
    result = await engine2.mergeMessage(reaction2Model);
    expect(result.isOk()).toBeTruthy();
    expect(syncEngine2.trie.items).toEqual(2); // signerAdd + reaction2

    // Roothashes must match
    expect(syncEngine2.trie.rootHash).toEqual(syncEngine.trie.rootHash);
  });

  test('snapshotTimestampPrefix trims the seconds', async () => {
    const nowInSeconds = getFarcasterTime()._unsafeUnwrap();
    const snapshotTimestamp = syncEngine.snapshotTimestamp._unsafeUnwrap();
    expect(snapshotTimestamp).toBeLessThanOrEqual(nowInSeconds);
    expect(snapshotTimestamp).toEqual(Math.floor(nowInSeconds / 10) * 10);
  });

  test('shouldSync returns false when already syncing', async () => {
    const mockRPCClient = mock(Client);
    const rpcClient = instance(mockRPCClient);
    let called = false;
    when(mockRPCClient.getSyncMetadataByPrefix(anyString())).thenCall(() => {
      expect(syncEngine.shouldSync([])._unsafeUnwrap()).toBeFalsy();
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
    expect(syncEngine.shouldSync(syncEngine.snapshot._unsafeUnwrap().excludedHashes)._unsafeUnwrap()).toBeFalsy();
  });

  test('shouldSync returns true when hashes dont match', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);

    await addMessagesWithTimestamps([30662167, 30662169, 30662172]);
    const oldSnapshot = syncEngine.snapshot._unsafeUnwrap();
    await addMessagesWithTimestamps([30662372]);
    expect(oldSnapshot.excludedHashes).not.toEqual(syncEngine.snapshot._unsafeUnwrap().excludedHashes);
    expect(syncEngine.shouldSync(oldSnapshot.excludedHashes)._unsafeUnwrap()).toBeTruthy();
  });

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
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine.trie.exists(new SyncId(messages[0] as MessageModel))).toBeTruthy();
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine.trie.exists(new SyncId(messages[1] as MessageModel))).toBeTruthy();
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    expect(syncEngine.trie.exists(new SyncId(messages[2] as MessageModel))).toBeTruthy();
  });
});
