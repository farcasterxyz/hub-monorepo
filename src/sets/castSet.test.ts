import Faker from 'faker';
import { Factories } from '~/factories';
import CastSet from '~/sets/castSet';
import { CastRecast, CastRemove, CastShort } from '~/types';
import { setupRocksDB } from '~/db/jestUtils';
import CastDB from '~/db/cast';

const rocksDb = setupRocksDB('castSet.test');
const testDb = new CastDB(rocksDb);

const fid = Faker.datatype.number();
const set = new CastSet(rocksDb);

const getCastAdds = async () => {
  return new Set(await testDb.getCastAddsByUser(fid));
};

const getCastRemoves = async () => {
  return new Set(await testDb.getCastRemovesByUser(fid));
};

let castShort1: CastShort;
let castShort2: CastShort;
let castRecast: CastRecast;
let castRemove1: CastRemove;
let castRemove2: CastRemove;

beforeAll(async () => {
  castShort1 = await Factories.CastShort.create({ data: { fid } });
  castShort2 = await Factories.CastShort.create({ data: { fid } });
  castRecast = await Factories.CastRecast.create({ data: { fid } });

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

describe('getCast', () => {
  test('fails when cast does not exist', async () => {
    const getCast = set.getCast(fid, castShort1.hash);
    await expect(getCast).rejects.toThrow();
  });

  test('returns CastShort when cast has been added', async () => {
    await set.merge(castShort1);
    const getCast = set.getCast(fid, castShort1.hash);
    await expect(getCast).resolves.toEqual(castShort1);
  });

  test('returns correct cast when multiple have been added', async () => {
    await set.merge(castShort1);
    await set.merge(castShort2);
    const getCast = set.getCast(fid, castShort2.hash);
    await expect(getCast).resolves.toEqual(castShort2);
  });

  test('returns error when cast has been removed', async () => {
    await set.merge(castShort1);
    await set.merge(castRemove1);
    const getCast = set.getCast(fid, castShort1.hash);
    await expect(getCast).rejects.toThrow();
  });
});

describe('getCastsByUser', () => {
  const getCasts = () => set.getCastsByUser(fid);

  test('returns empty set without casts', async () => {
    await expect(getCasts()).resolves.toEqual(new Set());
  });

  test('returns casts', async () => {
    await set.merge(castShort1);
    await set.merge(castShort2);
    await expect(getCasts()).resolves.toEqual(new Set([castShort1, castShort2]));
  });

  test('returns only added casts', async () => {
    await set.merge(castShort1);
    await set.merge(castShort2);
    await set.merge(castRemove2);
    await expect(getCasts()).resolves.toEqual(new Set([castShort1]));
  });
});

describe('merge', () => {
  test('fails with invalid message format', async () => {
    const invalidCast = (await Factories.FollowAdd.create()) as unknown as CastShort;
    await expect(set.merge(invalidCast)).rejects.toThrowError('invalid message format');
  });

  describe('CastShort', () => {
    test('succeeds with a valid CastShort message', async () => {
      await expect(set.merge(castShort1)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set([castShort1]));
      await expect(getCastRemoves()).resolves.toEqual(new Set());
    });

    test('succeeds with multiple valid add messages', async () => {
      await expect(set.merge(castShort1)).resolves.toEqual(undefined);
      await expect(set.merge(castShort2)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set([castShort1, castShort2]));
      await expect(getCastRemoves()).resolves.toEqual(new Set());
    });

    test('succeeds (no-ops) if the add was already removed', async () => {
      await set.merge(castRemove1);
      await expect(set.merge(castShort1)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set());
      await expect(getCastRemoves()).resolves.toEqual(new Set([castRemove1]));
    });

    test('succeeds (no-ops) if the message is added twice', async () => {
      await expect(set.merge(castShort1)).resolves.toEqual(undefined);
      await expect(set.merge(castShort1)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set([castShort1]));
      await expect(getCastRemoves()).resolves.toEqual(new Set());
    });
  });

  describe('CastRecast', () => {
    test('succeeds with a valid CastRecast message', async () => {
      await expect(set.merge(castRecast)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set([castRecast]));
      await expect(getCastRemoves()).resolves.toEqual(new Set());
    });
  });

  describe('CastRemove', () => {
    test("succeeds even if the add message doesn't exist", async () => {
      await expect(getCastAdds()).resolves.toEqual(new Set());
      await expect(set.merge(castRemove1)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set());
      await expect(getCastRemoves()).resolves.toEqual(new Set([castRemove1]));
    });

    test('succeeds with multiple remove messages', async () => {
      await expect(set.merge(castRemove1)).resolves.toEqual(undefined);
      await expect(set.merge(castRemove2)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set());
      await expect(getCastRemoves()).resolves.toEqual(new Set([castRemove1, castRemove2]));
    });

    test('succeeds and removes the add message', async () => {
      await set.merge(castShort1);
      await expect(set.merge(castRemove1)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set());
      await expect(getCastRemoves()).resolves.toEqual(new Set([castRemove1]));
    });

    test('succeeds (no-ops) if the same remove message is added twice', async () => {
      await expect(set.merge(castRemove1)).resolves.toEqual(undefined);
      await expect(set.merge(castRemove1)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set());
      await expect(getCastRemoves()).resolves.toEqual(new Set([castRemove1]));
    });

    xdescribe('when another message has removed the same cast', () => {
      test('succeeds with a higher lexicographical hash', () => {
        // TODO
      });

      test('succeeds (no-ops) with lower lexicographical hash', () => {
        // TODO
      });
    });
  });
});
