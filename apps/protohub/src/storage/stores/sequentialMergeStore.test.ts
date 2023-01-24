import * as protobufs from '@farcaster/protobufs';
import { Factories, HubResult } from '@farcaster/protoutils';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';

const db = jestRocksDB('stores.sequentialMergeStore.test');
const engine = new Engine(db, protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET);

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
    // await seedSigner(engine, fid, signer.signerKey);
  });

  // test('succeeds with concurrent, conflicting cast messages', async () => {
  //   const addData = await Factories.CastAddData.create({ fid: Array.from(fid) });
  //   const castAdd = await Factories..create(
  //     { data: Array.from(addData.bb?.bytes() ?? []) },
  //     { transient: { signer } }
  //   );
  //   const castTsHash = toTsHash(addData.timestamp(), castAdd.hashArray() ?? new Uint8Array())._unsafeUnwrap();

  //   const generateCastRemove = async (): Promise<flatbuffers.Message> => {
  //     const removeData = await Factories.CastRemoveData.create({
  //       fid: Array.from(fid),
  //       body: Factories.CastRemoveBody.build({ targetTsHash: Array.from(castTsHash) }),
  //     });
  //     return Factories.Message.create({ data: Array.from(removeData.bb?.bytes() ?? []) }, { transient: { signer } });
  //   };

  //   // Generate 10 cast removes with different timestamps
  //   const castRemoves: flatbuffers.Message[] = [];
  //   for (let i = 0; i < 10; i++) {
  //     const castRemove = await generateCastRemove();
  //     castRemoves.push(castRemove);
  //   }

  //   const messages = [castAdd, ...castRemoves, castAdd];

  //   const promises = messages.map((message) => engine.mergeMessage(new MessageModel(message)));

  //   const results = await Promise.all(promises);
  //   assertNoTimeouts(results);

  //   const allMessages = await engine.getAllCastMessagesByFid(fid);
  //   expect(allMessages._unsafeUnwrap().length).toEqual(1);
  // });

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
          await Factories.ReactionAddMessage.create({ data: { reactionBody: body, fid } }, { transient: { signer } })
        );
      } else {
        messages.push(
          await Factories.ReactionRemoveMessage.create({ data: { reactionBody: body, fid } }, { transient: { signer } })
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
