import FollowDB from '~/storage/db/follow';
import { Factories } from '~/test/factories';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { Ed25519Signer, FollowAdd, FollowRemove } from '~/types';
import { NotFoundError } from '~/utils/errors';
import { generateEd25519Signer } from '~/utils/crypto';

const rocks = jestRocksDB('db.follow.test');
const db = new FollowDB(rocks);

/** Test data */
let signer: Ed25519Signer;
let followAdd1: FollowAdd;
let followAdd2: FollowAdd;
let followAdd3: FollowAdd;
let followRemove1: FollowRemove;

beforeAll(async () => {
  signer = await generateEd25519Signer();
  followAdd1 = await Factories.FollowAdd.create({}, { transient: { signer } });
  followAdd2 = await Factories.FollowAdd.create({ data: { body: { targetUri: followAdd1.data.body.targetUri } } });
  followAdd3 = await Factories.FollowAdd.create({ data: { fid: followAdd1.data.fid } }, { transient: { signer } });
  followRemove1 = await Factories.FollowRemove.create(
    {
      data: {
        fid: followAdd1.data.fid,
        body: { targetUri: followAdd1.data.body.targetUri },
      },
    },
    { transient: { signer } }
  );
});

describe('putFollowAdd', () => {
  test('stores a FollowAdd message and indexes message by target', async () => {
    await expect(db.putFollowAdd(followAdd1)).resolves.toEqual(undefined);
    await expect(db.getFollowAdd(followAdd1.data.fid, followAdd1.data.body.targetUri)).resolves.toEqual(followAdd1);
    await expect(db.getFollowAddsByTarget(followAdd1.data.body.targetUri)).resolves.toEqual([followAdd1]);
  });

  test('deletes associated FollowRemove', async () => {
    const target = followAdd1.data.body.targetUri;
    await db.putFollowRemove(followRemove1);
    await expect(db.putFollowAdd(followAdd1)).resolves.toEqual(undefined);
    await expect(db.getFollowAdd(followAdd1.data.fid, target)).resolves.toEqual(followAdd1);
    await expect(db.getFollowRemove(followAdd1.data.fid, target)).rejects.toThrow(NotFoundError);
    await expect(db.getAllFollowMessagesByUser(followAdd1.data.fid)).resolves.toEqual([followAdd1]);
  });
});

describe('getAllFollowMessagesByUser', () => {
  test('returns array of FollowAdd and FollowRemove messages', async () => {
    const { fid } = followAdd1.data;
    await db.putFollowAdd(followAdd3);
    await db.putFollowRemove(followRemove1);
    const messages = await db.getAllFollowMessagesByUser(fid);
    expect(new Set(messages)).toEqual(new Set([followAdd3, followRemove1]));
  });
});

describe('deleteAllFollowMessagesBySigner', () => {
  test('deletes all FollowAdd and FollowRemove messages from a signer', async () => {
    const { fid } = followAdd1.data;
    await db.putFollowAdd(followAdd3);
    await db.putFollowRemove(followRemove1);
    await expect(db.deleteAllFollowMessagesBySigner(fid, signer.signerKey)).resolves.toEqual(undefined);
    const messages = await db.getAllFollowMessagesByUser(fid);
    expect(messages).toEqual([]);
  });
});

describe('getFollowAddsByTarget', () => {
  test('returns array of FollowAdd messages by target', async () => {
    const target = followAdd1.data.body.targetUri;
    await db.putFollowAdd(followAdd1);
    await db.putFollowAdd(followAdd2);
    expect(followAdd2.data.body.targetUri).toEqual(target); // sanity check
    const followAdds = new Set(await db.getFollowAddsByTarget(target));
    expect(new Set(followAdds)).toEqual(new Set([followAdd1, followAdd2]));
  });
});
