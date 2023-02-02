import * as protobufs from '@farcaster/grpc';
import { Factories, HubResult } from '@farcaster/utils';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { seedSigner } from '~/storage/engine/seed';

const db = jestRocksDB('stores.sequentialMergeStore.test');
const network = protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET;
const engine = new Engine(db, network);

const fid = Factories.Fid.build();
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
    const castAdd = await Factories.CastAddMessage.create({ data: { fid } }, { transient: { signer } });

    const generateCastRemove = async (): Promise<protobufs.CastRemoveMessage> => {
      return Factories.CastRemoveMessage.create(
        { data: { fid, castRemoveBody: { targetHash: castAdd.hash } } },
        { transient: { signer } }
      );
    };

    // Generate 10 cast removes with different timestamps
    const castRemoves: protobufs.CastRemoveMessage[] = [];
    for (let i = 0; i < 10; i++) {
      const castRemove = await generateCastRemove();
      castRemoves.push(castRemove);
    }

    const messages = [castAdd, ...castRemoves, castAdd];

    const promises = messages.map((message) => engine.mergeMessage(message));

    const results = await Promise.all(promises);
    assertNoTimeouts(results);

    const allMessages = await engine.getAllCastMessagesByFid(fid);
    expect(allMessages._unsafeUnwrap().length).toEqual(1);
  });

  test('succeeds with concurrent, conflicting reaction messages', async () => {
    const castId = Factories.CastId.build();
    const body = Factories.ReactionBody.build({
      type: protobufs.ReactionType.REACTION_TYPE_LIKE,
      targetCastId: castId,
    });

    const messages: protobufs.Message[] = [];
    for (let i = 0; i < 10; i++) {
      if (Math.random() < 0.5) {
        messages.push(
          await Factories.ReactionAddMessage.create(
            { data: { reactionBody: body, fid, network } },
            { transient: { signer } }
          )
        );
      } else {
        messages.push(
          await Factories.ReactionRemoveMessage.create(
            { data: { reactionBody: body, fid, network } },
            { transient: { signer } }
          )
        );
      }
    }

    const promises = messages.map((message) => engine.mergeMessage(message));

    const results = await Promise.all(promises);
    assertNoTimeouts(results);

    const allMessages = await engine.getAllReactionMessagesByFid(fid);
    expect(allMessages._unsafeUnwrap().length).toEqual(1);
  });
});
