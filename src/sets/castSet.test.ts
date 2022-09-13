import Faker from 'faker';
import { Factories } from '~/factories';
import CastSet from '~/sets/castSet';
import { CastRemove, CastShort } from '~/types';
import DB from '~/db';

const testDb = new DB('castSet.test');

const fid = Faker.datatype.number();
const set = new CastSet(testDb);

let castShort1: CastShort;
let castShort2: CastShort;
let castRemove1: CastRemove;
let castRemove2: CastRemove;

beforeAll(async () => {
  await testDb.open();
});

beforeAll(async () => {
  castShort1 = await Factories.CastShort.create({ data: { fid } });
  castShort2 = await Factories.CastShort.create({ data: { fid } });

  castRemove1 = await Factories.CastRemove.create({
    data: {
      fid,
      body: {
        targetHash: castShort1.hash,
      },
    },
  });

  castRemove2 = await Factories.CastRemove.create({
    data: {
      fid,
      body: {
        targetHash: castShort2.hash,
      },
    },
  });
});

afterEach(async () => {
  await testDb.clear();
});

afterAll(async () => {
  await testDb.close();
});

describe('getCast', () => {
  test('fails when cast does not exist', async () => {
    const res = await set.getCast(fid, castShort1.hash);
    expect(res.isOk()).toBeFalsy();
  });

  test('returns CastShort when cast has been added', async () => {
    await set.merge(castShort1);
    const res = await set.getCast(fid, castShort1.hash);
    expect(res.isOk()).toBeTruthy();
    expect(res._unsafeUnwrap()).toEqual(castShort1);
  });

  test('returns correct cast when multiple have been added', async () => {
    await set.merge(castShort1);
    await set.merge(castShort2);
    const res = await set.getCast(fid, castShort2.hash);
    expect(res._unsafeUnwrap()).toEqual(castShort2);
  });

  test('returns error when cast has been removed', async () => {
    await set.merge(castShort1);
    await set.merge(castRemove1);
    const res = await set.getCast(fid, castShort1.hash);
    expect(res.isOk()).toBeFalsy();
    expect(res._unsafeUnwrapErr()).toEqual('cast not found');
  });
});

describe('getCastsByUser', () => {
  test('returns empty set without casts', async () => {
    const res = await set.getCastsByUser(fid);
    expect(res).toEqual(new Set());
  });

  test('returns casts', async () => {
    await set.merge(castShort1);
    await set.merge(castShort2);
    const res = await set.getCastsByUser(fid);
    expect(res).toEqual(new Set([castShort1, castShort2]));
  });

  test('returns only added casts', async () => {
    await set.merge(castShort1);
    await set.merge(castShort2);
    await set.merge(castRemove2);
    const res = await set.getCastsByUser(fid);
    expect(res).toEqual(new Set([castShort1]));
  });
});

describe('getAllCastsByUser', () => {
  test('returns empty set without casts', async () => {
    const res = await set.getAllCastsByUser(fid);
    expect(res).toEqual(new Set());
  });

  test('returns casts', async () => {
    await set.merge(castShort1);
    await set.merge(castShort2);
    const res = await set.getAllCastsByUser(fid);
    expect(res).toEqual(new Set([castShort1, castShort2]));
  });

  test('returns removed casts', async () => {
    await set.merge(castRemove1);
    await set.merge(castRemove2);
    const res = await set.getAllCastsByUser(fid);
    expect(res).toEqual(new Set([castRemove1, castRemove2]));
  });

  test('returns most recent added and removed casts', async () => {
    await set.merge(castShort1);
    await set.merge(castShort2);
    await set.merge(castRemove2);
    const res = await set.getAllCastsByUser(fid);
    expect(res).toEqual(new Set([castShort1, castRemove2]));
  });
});

describe('merge', () => {
  test('fails with invalid message format', async () => {
    const invalidCast = (await Factories.FollowAdd.create()) as unknown as CastShort;
    const res = await set.merge(invalidCast);
    expect(res.isOk()).toBe(false);
    expect(res._unsafeUnwrapErr()).toBe('CastSet.merge: invalid message format');
  });

  describe('add', () => {
    const subject = () => set._getAdds(fid);

    test('succeeds with a valid add message', async () => {
      const res = await set.merge(castShort1);
      expect(res.isOk()).toBe(true);

      expect(await subject()).toEqual(new Set([castShort1]));
    });

    test('succeeds and indexes message by signer', async () => {
      const res = await set.merge(castShort1);
      expect(res.isOk()).toBe(true);

      const values = await testDb.messagesBySigner(castShort1.signer).values().all();
      expect(values).toEqual([castShort1.hash]);
    });

    test('succeeds and indexes castshort by target', async () => {
      const cast1 = await Factories.CastShort.create({ data: { body: { targetUri: 'foo' } } });
      const cast2 = await Factories.CastShort.create({ data: { body: { targetUri: 'foo' } } });
      const cast3 = await Factories.CastShort.create({ data: { body: { targetUri: 'foo' } } });
      const cast4 = await Factories.CastShort.create({ data: { body: { targetUri: 'bar' } } });

      for (const msg of [cast1, cast2, cast3, cast4]) {
        expect((await set.merge(msg)).isOk()).toBeTruthy();
      }

      const indexedFoo = await testDb.castShortsByTarget('foo').values().all();
      expect(new Set(indexedFoo)).toEqual(new Set([cast1.hash, cast2.hash, cast3.hash]));

      const indexedBar = await testDb.castShortsByTarget('bar').values().all();
      expect(new Set(indexedBar)).toEqual(new Set([cast4.hash]));
    });

    test('succeeds and indexed castrecast by target', async () => {
      const recast1 = await Factories.CastRecast.create({ data: { body: { targetCastUri: 'alice' } } });
      const recast2 = await Factories.CastRecast.create({ data: { body: { targetCastUri: 'alice' } } });
      const recast3 = await Factories.CastRecast.create({ data: { body: { targetCastUri: 'bob' } } });

      for (const msg of [recast1, recast2, recast3]) {
        expect((await set.merge(msg)).isOk()).toBeTruthy();
      }

      const indexedAlice = await testDb.castRecastsByTarget('alice').values().all();
      expect(new Set(indexedAlice)).toEqual(new Set([recast1.hash, recast2.hash]));

      const indexedBob = await testDb.castRecastsByTarget('bob').values().all();
      expect(new Set(indexedBob)).toEqual(new Set([recast3.hash]));
    });

    test('succeeds with multiple valid add messages', async () => {
      expect((await set.merge(castShort1)).isOk()).toBe(true);
      expect((await set.merge(castShort2)).isOk()).toBe(true);
      expect(await subject()).toEqual(new Set([castShort2, castShort1]));
    });

    test('succeeds (no-ops) if the add was already removed', async () => {
      expect((await set.merge(castRemove1)).isOk()).toBe(true);
      expect((await set.merge(castShort1)).isOk()).toBe(true);
      expect(await subject()).toEqual(new Set());
    });

    test('succeeds (no-ops) if the message is added twice', async () => {
      expect((await set.merge(castShort1)).isOk()).toBe(true);
      expect((await set.merge(castShort1)).isOk()).toBe(true);
      expect(await subject()).toEqual(new Set([castShort1]));
    });
  });

  describe('remove', () => {
    const subject = () => set._getRemoves(fid);

    test("succeeds even if the add message doesn't exist", async () => {
      expect(await set._getAdds(fid)).toEqual(new Set());
      expect((await set.merge(castRemove1)).isOk()).toBe(true);
      expect(await subject()).toEqual(new Set([castRemove1]));
    });

    test('succeeds with multiple remove messages', async () => {
      expect(await set._getAdds(fid)).toEqual(new Set());
      expect((await set.merge(castRemove1)).isOk()).toBe(true);
      expect((await set.merge(castRemove2)).isOk()).toBe(true);
      expect(await subject()).toEqual(new Set([castRemove1, castRemove2]));
    });

    test('succeeds and removes the add message if it exists', async () => {
      expect((await set.merge(castShort1)).isOk()).toBe(true);
      expect((await set.merge(castRemove1)).isOk()).toBe(true);
      expect(await set._getAdds(fid)).toEqual(new Set());
      expect(await subject()).toEqual(new Set([castRemove1]));
    });

    test('succeeds (no-ops) if the same remove message is added twice', async () => {
      expect((await set.merge(castRemove1)).isOk()).toBe(true);
      expect((await set.merge(castRemove1)).isOk()).toBe(true);
      expect(await set._getAdds(fid)).toEqual(new Set());
      expect(await subject()).toEqual(new Set([castRemove1]));
    });
  });
});
