import Faker from 'faker';
import { Factories } from '~/factories';
import CastSet from '~/sets/castSet';
import { CastRemove, CastShort, MessageType } from '~/types';
import DB from '~/db/farcaster';

const testDb = new DB('castSet.test');

const fid = Faker.datatype.number();
const set = new CastSet(testDb);

const getCastAdds = async () => {
  const res = await testDb.getCastAddsByUser(fid);
  return new Set(res._unsafeUnwrap());
};

const getCastRemoves = async () => {
  const res = await testDb.getCastRemovesByUser(fid);
  return new Set(res._unsafeUnwrap());
};

const getMessagesBySigner = async (signer: string, type?: MessageType) => {
  const res = await testDb.getMessagesBySigner(signer, type);
  return new Set(res._unsafeUnwrap());
};

const getCastShortsByTarget = async (target: string) => {
  const res = await testDb.getCastShortsByTarget(target);
  return new Set(res._unsafeUnwrap());
};

const getCastRecastsByTarget = async (target: string) => {
  const res = await testDb.getCastRecastsByTarget(target);
  return new Set(res._unsafeUnwrap());
};

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
  await testDb.destroy();
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
    expect(res._unsafeUnwrap()).toEqual(new Set());
  });

  test('returns casts', async () => {
    await set.merge(castShort1);
    await set.merge(castShort2);
    const res = await set.getCastsByUser(fid);
    expect(res._unsafeUnwrap()).toEqual(new Set([castShort1, castShort2]));
  });

  test('returns only added casts', async () => {
    await set.merge(castShort1);
    await set.merge(castShort2);
    await set.merge(castRemove2);
    const res = await set.getCastsByUser(fid);
    expect(res._unsafeUnwrap()).toEqual(new Set([castShort1]));
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
    test('succeeds with a valid add message', async () => {
      const res = await set.merge(castShort1);
      expect(res.isOk()).toBe(true);

      expect(await getCastAdds()).toEqual(new Set([castShort1]));
    });

    test('succeeds and indexes message by signer', async () => {
      const res = await set.merge(castShort1);
      expect(res.isOk()).toBe(true);
      expect(await getMessagesBySigner(castShort1.signer)).toEqual(new Set([castShort1]));
    });

    test('succeeds and indexes castshort by target', async () => {
      const cast1 = await Factories.CastShort.create({ data: { body: { targetUri: 'foo' } } });
      const cast2 = await Factories.CastShort.create({ data: { body: { targetUri: 'foo' } } });
      const cast3 = await Factories.CastShort.create({ data: { body: { targetUri: 'foo' } } });
      const cast4 = await Factories.CastShort.create({ data: { body: { targetUri: 'bar' } } });

      for (const msg of [cast1, cast2, cast3, cast4]) {
        expect((await set.merge(msg)).isOk()).toBeTruthy();
      }

      expect(await getCastShortsByTarget('foo')).toEqual(new Set([cast1, cast2, cast3]));
      expect(await getCastShortsByTarget('bar')).toEqual(new Set([cast4]));
    });

    test('succeeds and indexes castrecast by target', async () => {
      const recast1 = await Factories.CastRecast.create({ data: { body: { targetCastUri: 'alice' } } });
      const recast2 = await Factories.CastRecast.create({ data: { body: { targetCastUri: 'alice' } } });
      const recast3 = await Factories.CastRecast.create({ data: { body: { targetCastUri: 'bob' } } });

      for (const msg of [recast1, recast2, recast3]) {
        expect((await set.merge(msg)).isOk()).toBeTruthy();
      }

      expect(await getCastRecastsByTarget('alice')).toEqual(new Set([recast1, recast2]));
      expect(await getCastRecastsByTarget('bob')).toEqual(new Set([recast3]));
    });

    test('succeeds with multiple valid add messages', async () => {
      expect((await set.merge(castShort1)).isOk()).toBe(true);
      expect((await set.merge(castShort2)).isOk()).toBe(true);
      expect(await getCastAdds()).toEqual(new Set([castShort1, castShort2]));
    });

    test('succeeds (no-ops) if the add was already removed', async () => {
      expect((await set.merge(castRemove1)).isOk()).toBe(true);
      expect((await set.merge(castShort1)).isOk()).toBe(true);
      expect(await getCastAdds()).toEqual(new Set([]));
    });

    test('succeeds (no-ops) if the message is added twice', async () => {
      expect((await set.merge(castShort1)).isOk()).toBe(true);
      expect((await set.merge(castShort1)).isOk()).toBe(true);
      expect(await getCastAdds()).toEqual(new Set([castShort1]));
    });
  });

  describe('remove', () => {
    test("succeeds even if the add message doesn't exist", async () => {
      expect(await getCastAdds()).toEqual(new Set([]));
      expect((await set.merge(castRemove1)).isOk()).toBe(true);
      expect(await getCastRemoves()).toEqual(new Set([castRemove1]));
    });

    test('succeeds with multiple remove messages', async () => {
      expect(await getCastAdds()).toEqual(new Set([]));
      expect((await set.merge(castRemove1)).isOk()).toBe(true);
      expect((await set.merge(castRemove2)).isOk()).toBe(true);
      expect(await getCastRemoves()).toEqual(new Set([castRemove1, castRemove2]));
    });

    test('succeeds and removes the add message if it exists', async () => {
      expect((await set.merge(castShort1)).isOk()).toBe(true);
      expect((await set.merge(castRemove1)).isOk()).toBe(true);
      expect(await getCastAdds()).toEqual(new Set([]));
      expect(await getCastRemoves()).toEqual(new Set([castRemove1]));
    });

    test('succeeds (no-ops) if the same remove message is added twice', async () => {
      expect((await set.merge(castRemove1)).isOk()).toBe(true);
      expect((await set.merge(castRemove1)).isOk()).toBe(true);
      expect(await getCastAdds()).toEqual(new Set([]));
      expect(await getCastRemoves()).toEqual(new Set([castRemove1]));
    });
  });
});
