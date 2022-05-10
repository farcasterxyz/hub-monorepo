import { Factories } from '~/factories';
import CastSet from '~/castSet';
import { CastDeleteMessageBody, CastShortMessageBody, Message } from '~/types';

const set = new CastSet();

describe('merge', () => {
  let castShort1: Message<CastShortMessageBody>;
  let castShort2: Message<CastShortMessageBody>;

  let castDelete1: Message<CastDeleteMessageBody>;
  let castDelete2: Message<CastDeleteMessageBody>;

  beforeAll(async () => {
    castShort1 = await Factories.Cast.create();
    castShort2 = await Factories.Cast.create();

    castDelete1 = await Factories.CastDelete.create({
      data: {
        body: {
          targetHash: castShort1.hash,
        },
      },
    });

    castDelete2 = await Factories.CastDelete.create({
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

  describe('cast-add', () => {
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

    test('fails if the add was already deleted', async () => {
      expect(set.merge(castDelete1).isOk()).toBe(true);
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

  describe('cast-delete', () => {
    const subject = () => set._getDeletes();

    test("succeeds even if the add message doesn't exist", async () => {
      expect(set._getAdds()).toEqual([]);
      expect(set.merge(castDelete1).isOk()).toBe(true);
      expect(subject()).toEqual([castDelete1]);
    });

    test('succeeds with multiple delete messages', async () => {
      expect(set._getAdds()).toEqual([]);
      expect(set.merge(castDelete1).isOk()).toBe(true);
      expect(set.merge(castDelete2).isOk()).toBe(true);
      expect(subject()).toEqual([castDelete1, castDelete2]);
    });

    test('succeeds and removes the add message if it exists', async () => {
      expect(set.merge(castShort1).isOk()).toBe(true);
      expect(set.merge(castDelete1).isOk()).toBe(true);
      expect(set._getAdds()).toEqual([]);
      expect(subject()).toEqual([castDelete1]);
    });

    test('fails if the same delete message is added twice', async () => {
      expect(set.merge(castDelete1).isOk()).toBe(true);
      expect(set.merge(castDelete1).isOk()).toBe(false);
      expect(set._getAdds()).toEqual([]);
      expect(subject()).toEqual([castDelete1]);
    });

    // test('fails with an incorrect message type', async () => {});
  });
});
