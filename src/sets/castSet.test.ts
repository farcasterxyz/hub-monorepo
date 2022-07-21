import { Factories } from '~/factories';
import CastSet from '~/sets/castSet';
import { CastRemove, CastShort } from '~/types';

const set = new CastSet();

describe('merge', () => {
  let castShort1: CastShort;
  let castShort2: CastShort;

  let castRemove1: CastRemove;
  let castRemove2: CastRemove;

  beforeAll(async () => {
    castShort1 = await Factories.Cast.create();
    castShort2 = await Factories.Cast.create();

    castRemove1 = await Factories.CastRemove.create({
      data: {
        body: {
          targetHash: castShort1.hash,
        },
      },
    });

    castRemove2 = await Factories.CastRemove.create({
      data: {
        body: {
          targetHash: castShort2.hash,
        },
      },
    });
  });

  beforeEach(() => {
    set._reset();
  });

  describe('add', () => {
    const subject = () => set._getAdds();

    test('succeeds with a valid add message', async () => {
      expect(set.merge(castShort1).isOk()).toBe(true);
      expect(subject()).toEqual([castShort1]);
    });

    test('succeeds with multiple valid add messages', async () => {
      expect(set.merge(castShort1).isOk()).toBe(true);
      expect(set.merge(castShort2).isOk()).toBe(true);
      // compare sets instead of arrays to avoid failures due to ordering by hash
      expect(new Set(subject())).toEqual(new Set([castShort2, castShort1]));
    });

    test('fails if the add was already removed', async () => {
      expect(set.merge(castRemove1).isOk()).toBe(true);
      expect(set.merge(castShort1).isOk()).toBe(false);
      expect(subject()).toEqual([]);
    });

    test('fails if the message is added twice', async () => {
      expect(set.merge(castShort1).isOk()).toBe(true);
      expect(set.merge(castShort1).isOk()).toBe(false);
      expect(subject()).toEqual([castShort1]);
    });

    // test('fails with an incorrect message type', async () => {});
  });

  describe('remove', () => {
    const subject = () => set._getRemoves();

    test("succeeds even if the add message doesn't exist", async () => {
      expect(set._getAdds()).toEqual([]);
      expect(set.merge(castRemove1).isOk()).toBe(true);
      expect(subject()).toEqual([castRemove1]);
    });

    test('succeeds with multiple remove messages', async () => {
      expect(set._getAdds()).toEqual([]);
      expect(set.merge(castRemove1).isOk()).toBe(true);
      expect(set.merge(castRemove2).isOk()).toBe(true);
      expect(subject()).toEqual([castRemove1, castRemove2]);
    });

    test('succeeds and removes the add message if it exists', async () => {
      expect(set.merge(castShort1).isOk()).toBe(true);
      expect(set.merge(castRemove1).isOk()).toBe(true);
      expect(set._getAdds()).toEqual([]);
      expect(subject()).toEqual([castRemove1]);
    });

    test('fails if the same remove message is added twice', async () => {
      expect(set.merge(castRemove1).isOk()).toBe(true);
      expect(set.merge(castRemove1).isOk()).toBe(false);
      expect(set._getAdds()).toEqual([]);
      expect(subject()).toEqual([castRemove1]);
    });

    // test('fails with an incorrect message type', async () => {});
  });
});
