import { faker } from '@faker-js/faker';
import { Factories } from '~/test/factories';
import CastSet from '~/storage/sets/castSet';
import { CastRecast, CastRemove, CastShort } from '~/types';
import { jestRocksDB } from '~/storage/db/jestUtils';
import CastDB from '~/storage/db/cast';

const rocksDb = jestRocksDB('castSet.test');
const testDb = new CastDB(rocksDb);

const fid = faker.datatype.number();
const set = new CastSet(rocksDb);

const getCastAdds = async () => {
  return new Set(await testDb.getCastAddsByUser(fid));
};

const getCastRemoves = async () => {
  return new Set(await testDb.getCastRemovesByUser(fid));
};

let castShort1: CastShort;
let castRemove1: CastRemove; // removes castShort1 with a higher timestamp
let castRemove1Earlier: CastRemove; // removes castShort1 with a lower timestamp

let castShort2: CastShort;
let castRemove2: CastRemove; // removes castShort2 with a higher timestamp

let castRecast: CastRecast;
let castRemoveRecast: CastRemove; // removes castRecast with a higher timestamp

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
      signedAt: castShort1.data.signedAt + 1,
    },
  });

  castRemove1Earlier = await Factories.CastRemove.create({
    data: {
      fid,
      body: {
        targetHash: castShort1.hash,
      },
      signedAt: castShort1.data.signedAt - 1,
    },
  });

  castRemove2 = await Factories.CastRemove.create({
    data: {
      fid,
      body: {
        targetHash: castShort2.hash,
      },
      signedAt: castShort2.data.signedAt + 1,
    },
  });

  castRemoveRecast = await Factories.CastRemove.create({
    data: {
      fid,
      body: {
        targetHash: castRecast.hash,
      },
      signedAt: castRecast.data.signedAt + 1,
    },
  });
});

describe('getCast', () => {
  test('fails when cast does not exist', async () => {
    const getCast = set.getCast(fid, castShort1.hash);
    await expect(getCast).rejects.toThrow();
  });

  test('fails when cast has been removed', async () => {
    await set.merge(castShort1);
    await set.merge(castRemove1);
    const getCast = set.getCast(fid, castShort1.hash);
    await expect(getCast).rejects.toThrow();
  });

  test('returns correct casts when multiple have been added', async () => {
    await set.merge(castShort1);
    await set.merge(castRecast);

    const getCastShort1 = set.getCast(fid, castShort1.hash);
    await expect(getCastShort1).resolves.toEqual(castShort1);

    const getCastRecast = set.getCast(fid, castRecast.hash);
    await expect(getCastRecast).resolves.toEqual(castRecast);
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
    await set.merge(castRecast);
    await expect(getCasts()).resolves.toEqual(new Set([castShort1, castShort2, castRecast]));
  });

  test('returns only casts in the add set', async () => {
    await set.merge(castShort1);
    await set.merge(castShort2);
    await set.merge(castRemove2);
    await expect(getCasts()).resolves.toEqual(new Set([castShort1]));
  });
});

describe('getAllCastsByUser', () => {
  const getAllCasts = () => set.getAllCastsByUser(fid);

  test('returns empty set without casts', async () => {
    await expect(getAllCasts()).resolves.toEqual(new Set());
  });

  test('returns casts from the add and remove sets', async () => {
    await set.merge(castShort1);
    await set.merge(castShort2);
    await set.merge(castRemove2);
    await expect(getAllCasts()).resolves.toEqual(new Set([castShort1, castRemove2]));
  });
});

describe('merge', () => {
  test('fails with invalid message format', async () => {
    const invalidCast = (await Factories.FollowAdd.create()) as unknown as CastShort;
    await expect(set.merge(invalidCast)).rejects.toThrowError('invalid message format');
  });

  describe('CastShort', () => {
    test('succeeds with multiple valid CastShort messages', async () => {
      await expect(set.merge(castShort1)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set([castShort1]));

      await expect(set.merge(castShort2)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set([castShort1, castShort2]));
      await expect(getCastRemoves()).resolves.toEqual(new Set());
    });

    test('succeeds (no-ops) if the message is added twice', async () => {
      await expect(set.merge(castShort1)).resolves.toEqual(undefined);
      await expect(set.merge(castShort1)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set([castShort1]));
      await expect(getCastRemoves()).resolves.toEqual(new Set());
    });

    describe('succeeds (no-ops) if the add was already removed', () => {
      test('and if the remove has a later timestamp', async () => {
        await set.merge(castRemove1);
        await expect(set.merge(castShort1)).resolves.toEqual(undefined);
        await expect(getCastAdds()).resolves.toEqual(new Set());
        await expect(getCastRemoves()).resolves.toEqual(new Set([castRemove1]));
      });

      test('and if the remove had an earlier timestamp', async () => {
        await set.merge(castRemove1Earlier);
        await expect(set.merge(castShort1)).resolves.toEqual(undefined);
        await expect(getCastAdds()).resolves.toEqual(new Set());
        await expect(getCastRemoves()).resolves.toEqual(new Set([castRemove1Earlier]));
      });
    });
  });

  describe('CastRecast', () => {
    test('succeeds with a valid CastRecast message', async () => {
      await expect(set.merge(castRecast)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set([castRecast]));
      await expect(getCastRemoves()).resolves.toEqual(new Set());
    });

    test('succeeds (no-ops) if the message is added twice', async () => {
      await expect(set.merge(castRecast)).resolves.toEqual(undefined);
      await expect(set.merge(castRecast)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set([castRecast]));
      await expect(getCastRemoves()).resolves.toEqual(new Set());
    });

    describe('succeeds (no-ops) if the add was already removed', () => {
      test('and if the remove has a later timestamp', async () => {
        await set.merge(castRemoveRecast);
        await expect(set.merge(castRecast)).resolves.toEqual(undefined);
        await expect(getCastAdds()).resolves.toEqual(new Set());
        await expect(getCastRemoves()).resolves.toEqual(new Set([castRemoveRecast]));
      });

      test('and if the remove had an earlier timestamp', async () => {
        const castRemoveRecastEarlier = await Factories.CastRemove.create({
          data: {
            fid,
            body: {
              targetHash: castRecast.hash,
            },
            signedAt: castRecast.data.signedAt - 1,
          },
        });

        await set.merge(castRemoveRecastEarlier);
        await expect(set.merge(castRecast)).resolves.toEqual(undefined);
        await expect(getCastAdds()).resolves.toEqual(new Set());
        await expect(getCastRemoves()).resolves.toEqual(new Set([castRemoveRecastEarlier]));
      });
    });
  });

  describe('CastRemove', () => {
    test('succeeds and removes a CastShort message', async () => {
      await set.merge(castShort1);
      await expect(set.merge(castRemove1)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set());
      await expect(getCastRemoves()).resolves.toEqual(new Set([castRemove1]));
    });

    test('succeeds and removes a CastRecast message', async () => {
      await set.merge(castRecast);
      await expect(set.merge(castRemoveRecast)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set());
      await expect(getCastRemoves()).resolves.toEqual(new Set([castRemoveRecast]));
    });

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

    test('succeeds and removes the add message even if it has a later timestamp', async () => {
      await expect(set.merge(castShort1)).resolves.toEqual(undefined);
      await expect(set.merge(castRemove1Earlier)).resolves.toEqual(undefined);
      await expect(getCastAdds()).resolves.toEqual(new Set([]));
      await expect(getCastRemoves()).resolves.toEqual(new Set([castRemove1Earlier]));
    });

    describe('when another message has removed the same cast', () => {
      test('succeeds (no-ops) if messages are identical', async () => {
        await expect(set.merge(castRemove1)).resolves.toEqual(undefined);
        await expect(set.merge(castRemove1)).resolves.toEqual(undefined);
        await expect(getCastAdds()).resolves.toEqual(new Set());
        await expect(getCastRemoves()).resolves.toEqual(new Set([castRemove1]));
      });

      test('succeeds with a later timestamp', async () => {
        const castRemove1Later = {
          ...castRemove1,
          data: { ...castRemove1.data, signedAt: castRemove1.data.signedAt + 1 },
          hash: faker.datatype.hexadecimal({ length: 128 }),
        };
        await set.merge(castRemove1);
        await expect(set.merge(castRemove1Later)).resolves.toEqual(undefined);
        await expect(getCastRemoves()).resolves.toEqual(new Set([castRemove1Later]));
      });

      test('succeeds (no-ops) with earlier timestamp', async () => {
        await set.merge(castRemove1);
        await expect(set.merge(castRemove1Earlier)).resolves.toEqual(undefined);
        await expect(getCastRemoves()).resolves.toEqual(new Set([castRemove1]));
      });

      describe('with the same timestamp', () => {
        test('succeeds with higher hash', async () => {
          const castRemove1HigherHash = {
            ...castRemove1,
            hash: castRemove1.hash + 'a',
          };
          await set.merge(castRemove1);
          await expect(set.merge(castRemove1HigherHash)).resolves.toEqual(undefined);
          await expect(getCastRemoves()).resolves.toEqual(new Set([castRemove1HigherHash]));
        });

        test('succeeds (no-ops) with lower hash', async () => {
          const castRemove1LowerHash = {
            ...castRemove1,
            hash: castRemove1.hash.slice(0, -1),
          };

          await set.merge(castRemove1);
          await expect(set.merge(castRemove1LowerHash)).resolves.toEqual(undefined);
          await expect(getCastRemoves()).resolves.toEqual(new Set([castRemove1]));
        });
      });
    });
  });
});
