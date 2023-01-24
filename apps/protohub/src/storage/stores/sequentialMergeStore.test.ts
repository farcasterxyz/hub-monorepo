import * as flatbuffers from '@farcaster/flatbuffers';
import { Factories, HubResult, toTsHash } from '@farcaster/utils';
import MessageModel from '~/flatbuffers/models/messageModel';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { seedSigner } from '~/storage/engine/seed';
import Engine from '../engine';

const db = jestRocksDB('stores.sequentialMergeStore.test');
const engine = new Engine(db, flatbuffers.FarcasterNetwork.Testnet);

const fid = Factories.FID.build();
const signer = Factories.Ed25519Signer.build();

const assertNoTimeouts = (results: HubResult<void>[]) => {
  expect(
    results.every(
      (result) => result.isOk() || (result.isErr() && result.error.errCode !== 'unavailable.storage_failure')
    )
  ).toBeTruthy();
};

describe('mergeSequential', () => {
  beforeEach(async () => {
    await seedSigner(engine, fid, signer.signerKey);
  });

  test('succeeds with concurrent, conflicting cast messages', async () => {
    const addData = await Factories.CastAddData.create({ fid: Array.from(fid) });
    const castAdd = await Factories.Message.create(
      { data: Array.from(addData.bb?.bytes() ?? []) },
      { transient: { signer } }
    );
    const castTsHash = toTsHash(addData.timestamp(), castAdd.hashArray() ?? new Uint8Array())._unsafeUnwrap();

    const generateCastRemove = async (): Promise<flatbuffers.Message> => {
      const removeData = await Factories.CastRemoveData.create({
        fid: Array.from(fid),
        body: Factories.CastRemoveBody.build({ targetTsHash: Array.from(castTsHash) }),
      });
      return Factories.Message.create({ data: Array.from(removeData.bb?.bytes() ?? []) }, { transient: { signer } });
    };

    // Generate 10 cast removes with different timestamps
    const castRemoves: flatbuffers.Message[] = [];
    for (let i = 0; i < 10; i++) {
      const castRemove = await generateCastRemove();
      castRemoves.push(castRemove);
    }

    const messages = [castAdd, ...castRemoves, castAdd];

    const promises = messages.map((message) => engine.mergeMessage(new MessageModel(message)));

    const results = await Promise.all(promises);
    assertNoTimeouts(results);

    const allMessages = await engine.getAllCastMessagesByFid(fid);
    expect(allMessages._unsafeUnwrap().length).toEqual(1);
  });

  test('succeeds with concurrent, conflicting reaction messages', async () => {
    const castId = Factories.CastId.build();
    const body = Factories.ReactionBody.build({ type: flatbuffers.ReactionType.Like, target: castId });

    const generateAdd = async () => {
      const addData = await Factories.ReactionAddData.create({ fid: Array.from(fid), body });
      return Factories.Message.create({ data: Array.from(addData.bb?.bytes() ?? []) }, { transient: { signer } });
    };

    const generateRemove = async () => {
      const removeData = await Factories.ReactionRemoveData.create({ fid: Array.from(fid), body });
      return Factories.Message.create({ data: Array.from(removeData.bb?.bytes() ?? []) }, { transient: { signer } });
    };

    const messages: flatbuffers.Message[] = [];
    for (let i = 0; i < 10; i++) {
      if (Math.random() < 0.5) {
        messages.push(await generateAdd());
      } else {
        messages.push(await generateRemove());
      }
    }

    const promises = messages.map((message) => engine.mergeMessage(new MessageModel(message)));

    const results = await Promise.all(promises);
    assertNoTimeouts(results);

    const allMessages = await engine.getAllReactionMessagesByFid(fid);
    expect(allMessages._unsafeUnwrap().length).toEqual(1);
  });
});
