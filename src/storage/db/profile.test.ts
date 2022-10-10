import Faker from 'faker';
import { Factories } from '~/test/factories';
import { ProfileMeta } from '~/types';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { NotFoundError } from '~/utils/errors';
import ProfileDB from '~/storage/db/profile';

const rocks = jestRocksDB('db.profile.test');
const db = new ProfileDB(rocks);

/** Test data */
const fid = Faker.datatype.number();

let meta1: ProfileMeta;
let meta2: ProfileMeta;

beforeAll(async () => {
  meta1 = await Factories.ProfileMeta.create({ data: { fid } });
  meta2 = await Factories.ProfileMeta.create({ data: { fid, body: { type: meta1.data.body.type } } });
});

describe('putProfileMeta', () => {
  test('stores profile meta', async () => {
    await expect(db.putProfileMeta(meta1)).resolves.toEqual(undefined);
    await expect(db.getProfileMeta(fid, meta1.data.body.type)).resolves.toEqual(meta1);
  });

  test('deletes overwritten message', async () => {
    await db.putProfileMeta(meta1);
    await expect(db.putProfileMeta(meta2)).resolves.toEqual(undefined);
    await expect(db.getMessage(meta1.hash)).rejects.toThrow(NotFoundError);
  });
});

describe('getProfileMeta', () => {
  test('returns a profile meta message', async () => {
    await db.putProfileMeta(meta1);
    await expect(db.getProfileMeta(fid, meta1.data.body.type)).resolves.toEqual(meta1);
  });

  test('fails if profile meta not found', async () => {
    await expect(db.getProfileMeta(fid, meta1.data.body.type)).rejects.toThrow(NotFoundError);
  });
});

describe('deleteAllProfileMessagesBySigner', () => {
  test('deletes all messages from a signer', async () => {
    await db.putProfileMeta(meta1);

    await expect(db.getMessagesBySigner(fid, meta1.signer)).resolves.toEqual([meta1]);
    await expect(db.deleteAllProfileMessagesBySigner(fid, meta1.signer)).resolves.toEqual(undefined);
    await expect(db.getMessagesBySigner(fid, meta1.signer)).resolves.toEqual([]);
  });
});
