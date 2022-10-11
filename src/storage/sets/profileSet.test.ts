import { Factories } from '~/test/factories';
import Faker from 'faker';
import { Ed25519Signer, ProfileMeta, ProfileMetaType } from '~/types';
import { generateEd25519Signer } from '~/utils/crypto';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { BadRequestError } from '~/utils/errors';
import ProfileSet from '~/storage/sets/profileSet';

const testDb = jestRocksDB('profileSet.test');

const set = new ProfileSet(testDb);

const fid = Faker.datatype.number();

const metas = () => set.getProfileMetaByUser(fid);

let signer: Ed25519Signer;
let addDisplay: ProfileMeta;
let addBio: ProfileMeta;

beforeAll(async () => {
  signer = await generateEd25519Signer();
  addDisplay = await Factories.ProfileMeta.create(
    { data: { fid, body: { type: ProfileMetaType.Display } } },
    { transient: { signer } }
  );
  addBio = await Factories.ProfileMeta.create(
    { data: { fid, body: { type: ProfileMetaType.Bio } } },
    { transient: { signer } }
  );
});

describe('merge', () => {
  test('fails with invalid message format', async () => {
    const invalidMessage = (await Factories.CastShort.create()) as unknown as ProfileMeta;
    await expect(set.merge(invalidMessage)).rejects.toThrow(BadRequestError);
    await expect(metas()).resolves.toEqual(new Set());
  });

  test('succeeds with valid ProfileMeta', async () => {
    await expect(set.merge(addDisplay)).resolves.toEqual(undefined);
    await expect(metas()).resolves.toEqual(new Set([addDisplay]));
  });

  test('succeeds (no-op) with duplicate messages', async () => {
    await expect(set.merge(addDisplay)).resolves.toEqual(undefined);
    await expect(set.merge(addDisplay)).resolves.toEqual(undefined);
    await expect(metas()).resolves.toEqual(new Set([addDisplay]));
  });

  test('succeeds with multiple valid messages', async () => {
    await expect(set.merge(addDisplay)).resolves.toEqual(undefined);
    await expect(set.merge(addBio)).resolves.toEqual(undefined);
    await expect(metas()).resolves.toEqual(new Set([addDisplay, addBio]));
  });

  describe('when another message exists with the same type', () => {
    beforeEach(async () => {
      await set.merge(addDisplay);
    });

    test('succeeds with later timestamp', async () => {
      const addDisplayLater: ProfileMeta = {
        ...addDisplay,
        hash: Faker.datatype.hexaDecimal(128),
        data: { ...addDisplay.data, signedAt: addDisplay.data.signedAt + 1 },
      };
      await expect(set.merge(addDisplayLater)).resolves.toEqual(undefined);
      await expect(metas()).resolves.toEqual(new Set([addDisplayLater]));
    });

    test('succeeds (no-op) with earlier timestamp', async () => {
      const addDisplayEarlier: ProfileMeta = {
        ...addDisplay,
        hash: Faker.datatype.hexaDecimal(128),
        data: { ...addDisplay.data, signedAt: addDisplay.data.signedAt - 1 },
      };
      await expect(set.merge(addDisplayEarlier)).resolves.toEqual(undefined);
      await expect(metas()).resolves.toEqual(new Set([addDisplay]));
    });

    describe('with the same timestamp', () => {
      test('succeeds with a higher hash order', async () => {
        const addDisplayHigherHash: ProfileMeta = { ...addDisplay, hash: addDisplay.hash + 'a' };
        await expect(set.merge(addDisplayHigherHash)).resolves.toEqual(undefined);
        await expect(metas()).resolves.toEqual(new Set([addDisplayHigherHash]));
      });

      test('succeeds (no-op) with a lower hash order', async () => {
        const addDisplayLowerHash: ProfileMeta = { ...addDisplay, hash: addDisplay.hash.slice(0, -1) };
        await expect(set.merge(addDisplayLowerHash)).resolves.toEqual(undefined);
        await expect(metas()).resolves.toEqual(new Set([addDisplay]));
      });
    });
  });
});
