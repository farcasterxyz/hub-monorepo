import { Factories } from '~/factories';
import CastSet from '~/sets/castSet';
import { CastRemove, CastShort } from '~/types';

const set = new CastSet();

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

describe('get', () => {
  test('fails when cast does not exist', () => {
    expect(set.get(castShort1.hash)).toBeFalsy();
  });

  test('returns CastShort when cast has been added', () => {
    set.merge(castShort1);
    expect(set.get(castShort1.hash)).toEqual(castShort1);
  });

  test('returns CastRemove when cast has been removed', () => {
    set.merge(castShort1);
    set.merge(castRemove1);
    expect(set.get(castShort1.hash)).toEqual(castRemove1);
  });
});

describe('merge', () => {
  test('fails with invalid message format', async () => {
    const invalidCast = (await Factories.Follow.create()) as unknown as CastShort;
    const res = set.merge(invalidCast);
    expect(res.isOk()).toBe(false);
    expect(res._unsafeUnwrapErr()).toBe('CastSet.merge: invalid message format');
  });

  describe('add', () => {
    const subject = () => set._getAdds();

    test('succeeds with a valid add message', () => {
      expect(set.merge(castShort1).isOk()).toBe(true);
      expect(subject()).toEqual([castShort1]);
    });

    test('succeeds with multiple valid add messages', () => {
      expect(set.merge(castShort1).isOk()).toBe(true);
      expect(set.merge(castShort2).isOk()).toBe(true);
      // compare sets instead of arrays to avoid failures due to ordering by hash
      expect(new Set(subject())).toEqual(new Set([castShort2, castShort1]));
    });

    test('succeeds (no-ops) if the add was already removed', () => {
      expect(set.merge(castRemove1).isOk()).toBe(true);
      expect(set.merge(castShort1).isOk()).toBe(true);
      expect(subject()).toEqual([]);
    });

    test('succeeds (no-ops) if the message is added twice', () => {
      expect(set.merge(castShort1).isOk()).toBe(true);
      expect(set.merge(castShort1).isOk()).toBe(true);
      expect(subject()).toEqual([castShort1]);
    });
  });

  describe('remove', () => {
    const subject = () => set._getRemoves();

    test("succeeds even if the add message doesn't exist", () => {
      expect(set._getAdds()).toEqual([]);
      expect(set.merge(castRemove1).isOk()).toBe(true);
      expect(subject()).toEqual([castRemove1]);
    });

    test('succeeds with multiple remove messages', () => {
      expect(set._getAdds()).toEqual([]);
      expect(set.merge(castRemove1).isOk()).toBe(true);
      expect(set.merge(castRemove2).isOk()).toBe(true);
      expect(subject()).toEqual([castRemove1, castRemove2]);
    });

    test('succeeds and removes the add message if it exists', () => {
      expect(set.merge(castShort1).isOk()).toBe(true);
      expect(set.merge(castRemove1).isOk()).toBe(true);
      expect(set._getAdds()).toEqual([]);
      expect(subject()).toEqual([castRemove1]);
    });

    test('succeeds (no-ops) if the same remove message is added twice', () => {
      expect(set.merge(castRemove1).isOk()).toBe(true);
      expect(set.merge(castRemove1).isOk()).toBe(true);
      expect(set._getAdds()).toEqual([]);
      expect(subject()).toEqual([castRemove1]);
    });
  });
});

describe('revokeSigner', () => {
  test('succeeds without any messages', () => {
    expect(set.revokeSigner(castShort1.signer).isOk()).toBe(true);
  });

  test('succeeds and drops add messages', () => {
    expect(set.merge(castShort1).isOk()).toBe(true);
    expect(set.revokeSigner(castShort1.signer).isOk()).toBe(true);
    expect(set._getAdds()).toEqual([]);
    expect(set._getRemoves()).toEqual([]);
  });

  test('succeeds and drops remove messages', () => {
    expect(set.merge(castRemove1).isOk()).toBe(true);
    expect(set.revokeSigner(castRemove1.signer).isOk()).toBe(true);
    expect(set._getAdds()).toEqual([]);
    expect(set._getRemoves()).toEqual([]);
  });

  test('suceeds and only removes messages from signer', () => {
    expect(set.merge(castShort1).isOk()).toBe(true);
    expect(set.merge(castShort2).isOk()).toBe(true);
    expect(set.revokeSigner(castShort1.signer).isOk()).toBe(true);
    expect(set._getAdds()).toEqual([castShort2]);
    expect(set._getRemoves()).toEqual([]);
  });
});
