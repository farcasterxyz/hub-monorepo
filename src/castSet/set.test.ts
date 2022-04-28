import { Factories } from '~/factories';
import CastSet from '~/castSet';
import { CastDeleteMessageBody, CastShortMessageBody, Message } from '~/types';

const set = new CastSet();

describe('add', () => {
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

  describe('add', () => {
    const subject = () => set._getAdds();

    test('succeeds with a valid add message', async () => {
      expect(set.add(castShort1).isOk()).toBe(true);
      expect(subject()).toEqual([castShort1]);
    });

    test('succeeds with multiple valid add messages', async () => {
      expect(set.add(castShort1).isOk()).toBe(true);
      expect(set.add(castShort2).isOk()).toBe(true);
      // compare sets instead of arrays to avoid failures due to ordering by hash
      expect(new Set(subject())).toEqual(new Set([castShort2, castShort1]));
    });

    test('fails if the add was already deleted', async () => {
      expect(set.delete(castDelete1).isOk()).toBe(true);
      expect(set.add(castShort1).isOk()).toBe(false);
      expect(subject()).toEqual([]);
    });

    test('fails if the message is added twice', async () => {
      expect(set.add(castShort1).isOk()).toBe(true);
      expect(set.add(castShort1).isOk()).toBe(false);
      expect(subject()).toEqual([castShort1]);
    });

    // test('fails with an incorrect message type', async () => {});
  });

  describe('delete', () => {
    const subject = () => set._getDeletes();

    test("succeeds even if the add message doesn't exist", async () => {
      expect(set._getAdds()).toEqual([]);
      expect(set.delete(castDelete1).isOk()).toBe(true);
      expect(subject()).toEqual([castDelete1]);
    });

    test('succeeds with multiple delete messages', async () => {
      expect(set._getAdds()).toEqual([]);
      expect(set.delete(castDelete1).isOk()).toBe(true);
      expect(set.delete(castDelete2).isOk()).toBe(true);
      expect(subject()).toEqual([castDelete1, castDelete2]);
    });

    test('succeeds and removes the add message if it exists', async () => {
      expect(set.add(castShort1).isOk()).toBe(true);
      expect(set.delete(castDelete1).isOk()).toBe(true);
      expect(set._getAdds()).toEqual([]);
      expect(subject()).toEqual([castDelete1]);
    });

    test('fails if the same delete message is added twice', async () => {
      expect(set.delete(castDelete1).isOk()).toBe(true);
      expect(set.delete(castDelete1).isOk()).toBe(false);
      expect(set._getAdds()).toEqual([]);
      expect(subject()).toEqual([castDelete1]);
    });

    // test('fails with an incorrect message type', async () => {});
  });
});
