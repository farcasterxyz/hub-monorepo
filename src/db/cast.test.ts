import Faker from 'faker';
import CastDB from '~/db/cast';
import { Factories } from '~/factories';
import { CastRecast, CastRemove, CastShort } from '~/types';
import { jestRocksDB } from '~/db/jestUtils';
import { NotFoundError } from '~/errors';

const rocks = jestRocksDB('db.cast.test');
const db = new CastDB(rocks);

/** Test data */
const fid = Faker.datatype.number();
const target = Faker.internet.url();

let cast1: CastShort;
let recast1: CastRecast;
let remove1: CastRemove;

beforeAll(async () => {
  cast1 = await Factories.CastShort.create({ data: { fid, body: { targetUri: target } } });
  recast1 = await Factories.CastRecast.create({ data: { fid, body: { targetCastUri: target } } });
  remove1 = await Factories.CastRemove.create({ data: { fid, body: { targetHash: cast1.hash } } });
});

describe('putCastAdd', () => {
  describe('CastShort', () => {
    test('stores cast', async () => {
      await expect(db.putCastAdd(cast1)).resolves.toEqual(undefined);
      await expect(db.getCastAdd(cast1.data.fid, cast1.hash)).resolves.toEqual(cast1);
      await expect(db.getCastShortsByTarget(target)).resolves.toEqual([cast1]);
      await expect(db.getCastRecastsByTarget(target)).resolves.toEqual([]);
    });

    test('indexes cast by target if targetUri is present', async () => {
      await expect(db.putCastAdd(cast1)).resolves.toEqual(undefined);
      await expect(db.getCastShortsByTarget(target)).resolves.toEqual([cast1]);
    });

    test('does not index by target if targetUri is blank', async () => {
      const cast1NoTarget: CastShort = {
        ...cast1,
        data: { ...cast1.data, body: { ...cast1.data.body, targetUri: undefined } },
      };
      await expect(db.putCastAdd(cast1NoTarget)).resolves.toEqual(undefined);
      await expect(db.getCastShortsByTarget(target)).resolves.toEqual([]);
    });

    test('deletes associated CastRemove if present', async () => {
      await db.putCastRemove(remove1);
      await expect(db.getCastRemove(cast1.data.fid, cast1.hash)).resolves.toEqual(remove1);
      await expect(db.putCastAdd(cast1)).resolves.toEqual(undefined);
      await expect(db.getCastRemove(cast1.data.fid, cast1.hash)).rejects.toThrow(NotFoundError);
    });
  });

  describe('CastRecast', () => {
    test('stores cast and indexes it by target', async () => {
      await expect(db.putCastAdd(recast1)).resolves.toEqual(undefined);
      await expect(db.getCastAdd(recast1.data.fid, recast1.hash)).resolves.toEqual(recast1);
    });

    test('indexes cast by target', async () => {
      await expect(db.putCastAdd(recast1)).resolves.toEqual(undefined);
      await expect(db.getCastRecastsByTarget(target)).resolves.toEqual([recast1]);
    });
  });
});

describe('putCastRemove', () => {
  test('stores CastRemove', async () => {
    await expect(db.putCastRemove(remove1)).resolves.toEqual(undefined);
    await expect(db.getCastRemove(remove1.data.fid, remove1.data.body.targetHash)).resolves.toEqual(remove1);
  });

  test('deletes associated cast if present', async () => {
    await db.putCastAdd(cast1);
    await expect(db.getCastAdd(remove1.data.fid, cast1.hash)).resolves.toEqual(cast1);
    await expect(db.putCastRemove(remove1)).resolves.toEqual(undefined);
    await expect(db.getCastAdd(remove1.data.fid, cast1.hash)).rejects.toThrow(NotFoundError);
  });
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
  test('returns array of messages', async () => {
    await db.putCastAdd(recast1);
    await db.putCastRemove(remove1);
    const messages = await db.getAllCastMessagesByUser(fid);
    expect(new Set(messages)).toEqual(new Set([recast1, remove1]));
  });

  test('returns empty array without messages', async () => {
    await expect(db.getAllCastMessagesByUser(fid)).resolves.toEqual([]);
  });
});

describe('deleteAllCastMessagesBySigner', () => {
  test('deletes all messages from a signer', async () => {
    await db.putCastAdd(recast1);
    await db.putCastRemove(remove1);

    await expect(db.getMessagesBySigner(fid, recast1.signer)).resolves.toEqual([recast1]);
    await expect(db.deleteAllCastMessagesBySigner(fid, recast1.signer)).resolves.toEqual(undefined);
    await expect(db.getMessagesBySigner(fid, recast1.signer)).resolves.toEqual([]);

    await expect(db.getMessagesBySigner(fid, remove1.signer)).resolves.toEqual([remove1]);
    await expect(db.deleteAllCastMessagesBySigner(fid, remove1.signer)).resolves.toEqual(undefined);
    await expect(db.getMessagesBySigner(fid, remove1.signer)).resolves.toEqual([]);
  });
});
