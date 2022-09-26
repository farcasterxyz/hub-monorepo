import CastDB from '~/db/cast';
import { Factories } from '~/factories';
import { CastShort } from '~/types';
import { jestRocksDB } from '~/db/jestUtils';

const rocks = jestRocksDB('db.cast.test');
const db = new CastDB(rocks);

/** Test data */
let cast1: CastShort;
// let cast2: CastShort;

beforeAll(async () => {
  cast1 = await Factories.CastShort.create();
  // cast2 = await Factories.CastShort.create();
});

describe('putCastAdd', () => {
  test('stores a cast', async () => {
    await expect(db.putCastAdd(cast1)).resolves.toEqual(undefined);
    await expect(db.getCastAdd(cast1.data.fid, cast1.hash)).resolves.toEqual(cast1);
  });

  // test('succeeds and indexes castshort by target', async () => {
  //   const cast1 = await Factories.CastShort.create({ data: { body: { targetUri: 'foo' } } });
  //   const cast2 = await Factories.CastShort.create({ data: { body: { targetUri: 'foo' } } });
  //   const cast3 = await Factories.CastShort.create({ data: { body: { targetUri: 'foo' } } });
  //   const cast4 = await Factories.CastShort.create({ data: { body: { targetUri: 'bar' } } });

  //   for (const msg of [cast1, cast2, cast3, cast4]) {
  //     expect((await set.merge(msg)).isOk()).toBeTruthy();
  //   }

  //   expect(await getCastShortsByTarget('foo')).toEqual(new Set([cast1, cast2, cast3]));
  //   expect(await getCastShortsByTarget('bar')).toEqual(new Set([cast4]));
  // });

  // test('succeeds and indexes castrecast by target', async () => {
  //   const recast1 = await Factories.CastRecast.create({ data: { body: { targetCastUri: 'alice' } } });
  //   const recast2 = await Factories.CastRecast.create({ data: { body: { targetCastUri: 'alice' } } });
  //   const recast3 = await Factories.CastRecast.create({ data: { body: { targetCastUri: 'bob' } } });

  //   for (const msg of [recast1, recast2, recast3]) {
  //     expect((await set.merge(msg)).isOk()).toBeTruthy();
  //   }

  //   expect(await getCastRecastsByTarget('alice')).toEqual(new Set([recast1, recast2]));
  //   expect(await getCastRecastsByTarget('bob')).toEqual(new Set([recast3]));
  // });
});

describe('getCastAdd', () => {
  test('returns a cast', async () => {
    await db.putCastAdd(cast1);
    await expect(db.getCastAdd(cast1.data.fid, cast1.hash)).resolves.toEqual(cast1);
  });

  test('fails if cast not found', async () => {
    await expect(db.getCastAdd(cast1.data.fid, cast1.hash)).rejects.toThrow();
  });
});

describe('getAllCastMessagesByUser', () => {
  // TODO
});

describe('deleteAllCastMessagesBySigner', () => {
  // TODO
});
