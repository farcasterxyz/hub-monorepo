import ReactionDB from '~/storage/db/reaction';
import { Factories } from '~/factories';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { Ed25519Signer, ReactionAdd, ReactionRemove } from '~/types';
import { NotFoundError } from '~/errors';
import { generateEd25519Signer } from '~/utils';

const rocks = jestRocksDB('db.reaction.test');
const db = new ReactionDB(rocks);

/** Test data */
let signer: Ed25519Signer;
let reactionAdd1: ReactionAdd;
let reactionAdd2: ReactionAdd;
let reactionAdd3: ReactionAdd;
let reactionRemove3: ReactionRemove;

beforeAll(async () => {
  signer = await generateEd25519Signer();
  reactionAdd1 = await Factories.ReactionAdd.create({}, { transient: { signer } });
  reactionAdd2 = await Factories.ReactionAdd.create({
    data: { body: { targetUri: reactionAdd1.data.body.targetUri } },
  });
  reactionAdd3 = await Factories.ReactionAdd.create(
    { data: { fid: reactionAdd1.data.fid } },
    { transient: { signer } }
  );
  reactionRemove3 = await Factories.ReactionRemove.create(
    {
      data: {
        fid: reactionAdd1.data.fid,
        body: { targetUri: reactionAdd1.data.body.targetUri },
      },
    },
    { transient: { signer } }
  );
});

describe('putReactionAdd', () => {
  test('stores a ReactionAdd message and indexes message by target', async () => {
    await expect(db.putReactionAdd(reactionAdd1)).resolves.toEqual(undefined);
    await expect(db.getReactionAdd(reactionAdd1.data.fid, reactionAdd1.data.body.targetUri)).resolves.toEqual(
      reactionAdd1
    );
    await expect(db.getReactionAddsByTarget(reactionAdd1.data.body.targetUri)).resolves.toEqual([reactionAdd1]);
  });

  test('deletes associated ReactionRemove', async () => {
    const target = reactionAdd1.data.body.targetUri;
    await db.putReactionRemove(reactionRemove3);
    await expect(db.putReactionAdd(reactionAdd1)).resolves.toEqual(undefined);
    await expect(db.getReactionAdd(reactionAdd1.data.fid, target)).resolves.toEqual(reactionAdd1);
    await expect(db.getReactionRemove(reactionAdd1.data.fid, target)).rejects.toThrow(NotFoundError);
    await expect(db.getAllReactionMessagesByUser(reactionAdd1.data.fid)).resolves.toEqual([reactionAdd1]);
  });
});

describe('getAllReactionMessagesByUser', () => {
  test('returns array of ReactionAdd and ReactionRemove messages', async () => {
    const { fid } = reactionAdd1.data;
    await db.putReactionAdd(reactionAdd3);
    await db.putReactionRemove(reactionRemove3);
    const messages = await db.getAllReactionMessagesByUser(fid);
    expect(new Set(messages)).toEqual(new Set([reactionAdd3, reactionRemove3]));
  });
});

describe('deleteAllReactionMessagesBySigner', () => {
  test('deletes all ReactionAdd and ReactionRemove messages from a signer', async () => {
    const { fid } = reactionAdd1.data;
    await db.putReactionAdd(reactionAdd3);
    await db.putReactionRemove(reactionRemove3);
    await expect(db.deleteAllReactionMessagesBySigner(fid, signer.signerKey)).resolves.toEqual(undefined);
    const messages = await db.getAllReactionMessagesByUser(fid);
    expect(messages).toEqual([]);
  });
});

describe('getReactionAddsByTarget', () => {
  test('returns array of ReactionAdd messages by target', async () => {
    const target = reactionAdd1.data.body.targetUri;
    await db.putReactionAdd(reactionAdd1);
    await db.putReactionAdd(reactionAdd2);
    expect(reactionAdd2.data.body.targetUri).toEqual(target); // sanity check
    const ReactionAdds = new Set(await db.getReactionAddsByTarget(target));
    expect(new Set(ReactionAdds)).toEqual(new Set([reactionAdd1, reactionAdd2]));
  });
});
