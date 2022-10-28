import { faker } from '@faker-js/faker';
import CastDB from '~/storage/db/cast';
import { Factories } from '~/test/factories';
import { CastRecast, CastRemove, CastShort } from '~/types';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { NotFoundError } from '~/utils/errors';

const rocks = jestRocksDB('db.cast.test');
const db = new CastDB(rocks);

/** Test data */
const fid = faker.datatype.number();
const target = faker.internet.url();

let cast1: CastShort;
let recast1: CastRecast;
let remove1: CastRemove;

beforeAll(async () => {
  cast1 = await Factories.CastShort.create({
    data: { fid, body: { parent: target, mentions: [faker.datatype.number(), faker.datatype.number()] } },
  });
  recast1 = await Factories.CastRecast.create({ data: { fid, body: { targetCastUri: target } } });
  remove1 = await Factories.CastRemove.create({ data: { fid, body: { targetHash: cast1.hash } } });
});

describe('putCastAdd', () => {
  describe('CastShort', () => {
    test('stores cast', async () => {
      await expect(db.putCastAdd(cast1)).resolves.toEqual(undefined);
      await expect(db.getCastAdd(cast1.data.fid, cast1.hash)).resolves.toEqual(cast1);
      await expect(db.getCastShortsByParent(target)).resolves.toEqual([cast1]);
      await expect(db.getCastRecastsByTarget(target)).resolves.toEqual([]);
    });

    test('indexes cast by parent if parent is present', async () => {
      await expect(db.putCastAdd(cast1)).resolves.toEqual(undefined);
      await expect(db.getCastShortsByParent(target)).resolves.toEqual([cast1]);
    });

    test('does not index by parent if parent is blank', async () => {
      // Safety: cast to unknown is required to circumvent the exactOptionalPropertyTypes and is acceptable since the
      // purpose of this check is to test incorrectly typed objects
      const cast1NoParent: CastShort = {
        ...cast1,
        data: { ...cast1.data, body: { ...cast1.data.body, parent: undefined } },
      } as unknown as CastShort;
      await expect(db.putCastAdd(cast1NoParent)).resolves.toEqual(undefined);
      await expect(db.getCastShortsByParent(target)).resolves.toEqual([]);
    });

    test('indexes cast by mentions if mentions is present', async () => {
      await expect(db.putCastAdd(cast1)).resolves.toEqual(undefined);
      for (const mention of cast1.data.body.mentions || []) {
        await expect(db.getCastShortsByMention(mention)).resolves.toEqual([cast1]);
      }
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

describe('deleteCastAdd', () => {
  describe('CastShort', () => {
    beforeEach(async () => {
      await db.putCastAdd(cast1);
    });

    test('deletes cast', async () => {
      await expect(db.deleteCastAdd(fid, cast1.hash)).resolves.toEqual(undefined);
      await expect(db.getCastAdd(fid, cast1.hash)).rejects.toThrow(NotFoundError);
    });

    test('deletes cast from castShortsByParent index', async () => {
      await expect(db.deleteCastAdd(fid, cast1.hash)).resolves.toEqual(undefined);
      await expect(db.getCastShortsByParent(target)).resolves.toEqual([]);
    });

    test('deletes from castShortsByMention index', async () => {
      await expect(db.deleteCastAdd(fid, cast1.hash)).resolves.toEqual(undefined);
      for (const mention of cast1.data.body.mentions || []) {
        await expect(db.getCastShortsByMention(mention)).resolves.toEqual([]);
      }
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
