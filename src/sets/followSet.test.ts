import { Factories } from '~/factories';
import Faker from 'faker';
import FollowSet from '~/sets/followSet';
import { Ed25519Signer, Follow, FollowAdd, FollowRemove, URI } from '~/types';
import { generateEd25519Signer } from '~/utils';

const set = new FollowSet();
const follows = () => set._getAdds();
const unfollows = () => set._getRemoves();

let signer: Ed25519Signer;
let a: URI;
let followA: FollowAdd;
let unfollowA: FollowRemove;
let b: URI;
let followB: Follow;
let unfollowB: Follow;

beforeAll(async () => {
  signer = await generateEd25519Signer();
  a = Faker.internet.url();
  followA = await Factories.FollowAdd.create({ data: { body: { targetUri: a } } }, { transient: { signer } });
  unfollowA = await Factories.FollowRemove.create(
    { data: { body: { targetUri: a }, signedAt: followA.data.signedAt + 1 } },
    { transient: { signer } }
  );
  b = Faker.internet.url();
  followB = await Factories.FollowAdd.create({ data: { body: { targetUri: b } } }, { transient: { signer } });
  unfollowB = await Factories.FollowRemove.create(
    { data: { body: { targetUri: b }, signedAt: followB.data.signedAt + 1 } },
    { transient: { signer } }
  );
});

beforeEach(() => {
  set._reset();
});

describe('get', () => {
  test('fails when follow does not exist', () => {
    expect(set.get(a)).toBeFalsy();
  });

  test('returns FollowAdd when target has been followed', () => {
    set.merge(followA);
    expect(set.get(a)).toEqual(followA);
  });

  test('fails when target has been unfollowed', () => {
    set.merge(followA);
    set.merge(unfollowA);
    expect(set.get(a)).toBeFalsy();
  });

  test('fails when using message hash', () => {
    set.merge(followA);
    expect(set.get(followA.hash)).toBeFalsy();
  });
});

describe('merge', () => {
  test('fails with invalid message format', async () => {
    const invalidFollow = (await Factories.CastShort.create()) as unknown as Follow;
    const res = set.merge(invalidFollow);
    expect(res.isOk()).toBe(false);
    expect(res._unsafeUnwrapErr()).toBe('FollowSet.merge: invalid message format');
    expect(follows()).toEqual(new Set());
    expect(unfollows()).toEqual(new Set());
  });

  describe('mergeFollowAdd', () => {
    test('succeeds with valid follow', () => {
      expect(set.merge(followA).isOk()).toBe(true);
      expect(follows()).toEqual(new Set([followA]));
      expect(unfollows()).toEqual(new Set());
    });

    test('succeeds (no-op) with duplicate follow', () => {
      expect(set.merge(followA).isOk()).toBe(true);
      expect(set.merge(followA).isOk()).toBe(true);
      expect(follows()).toEqual(new Set([followA]));
      expect(unfollows()).toEqual(new Set());
    });

    test('succeeds with multiple valid follows', () => {
      expect(set.merge(followA).isOk()).toBe(true);
      expect(set.merge(followB).isOk()).toBe(true);
      expect(follows()).toEqual(new Set([followA, followB]));
      expect(unfollows()).toEqual(new Set());
    });

    describe('when the same target is already added', () => {
      beforeEach(() => {
        expect(set.merge(followA).isOk()).toBe(true);
      });

      test('succeeds with later timestamp', () => {
        const followALater: FollowAdd = {
          ...followA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...followA.data, signedAt: followA.data.signedAt + 1 },
        };
        expect(set.merge(followALater).isOk()).toBe(true);
        expect(follows()).toEqual(new Set([followALater]));
        expect(unfollows()).toEqual(new Set());
      });

      test('succeeds (no-op) with earlier timestamp', () => {
        const followAEarlier: FollowAdd = {
          ...followA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...followA.data, signedAt: followA.data.signedAt - 1 },
        };
        expect(set.merge(followAEarlier).isOk()).toBe(true);
        expect(follows()).toEqual(new Set([followA]));
        expect(unfollows()).toEqual(new Set());
      });

      describe('with the same timestamp', () => {
        test('succeeds with a higher hash order', () => {
          const followAHigherHash: FollowAdd = { ...followA, hash: followA.hash + 'a' };
          expect(set.merge(followAHigherHash).isOk()).toBe(true);
          expect(follows()).toEqual(new Set([followAHigherHash]));
          expect(unfollows()).toEqual(new Set());
        });

        test('succeeds (no-op) with a lower hash order', () => {
          const followALowerHash: FollowAdd = { ...followA, hash: followA.hash.slice(-1, 0) };
          expect(set.merge(followALowerHash).isOk()).toBe(true);
          expect(follows()).toEqual(new Set([followA]));
          expect(unfollows()).toEqual(new Set());
        });
      });
    });

    describe('when the same target is already removed', () => {
      beforeEach(() => {
        expect(set.merge(unfollowA).isOk()).toBe(true);
      });

      test('succeeds with later timestamp', () => {
        const followALater: FollowAdd = {
          ...followA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...followA.data, signedAt: unfollowA.data.signedAt + 1 },
        };
        expect(set.merge(followALater).isOk()).toBe(true);
        expect(follows()).toEqual(new Set([followALater]));
        expect(unfollows()).toEqual(new Set());
      });

      test('succeeds (no-op) with earlier timestamp', () => {
        const followAEarlier: FollowAdd = {
          ...followA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...followA.data, signedAt: unfollowA.data.signedAt - 1 },
        };
        expect(set.merge(followAEarlier).isOk()).toBe(true);
        expect(follows()).toEqual(new Set());
        expect(unfollows()).toEqual(new Set([unfollowA]));
      });

      test('succeeds (no-op) with same timestamp', () => {
        const followASameTimestamp: FollowAdd = {
          ...followA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...followA.data, signedAt: unfollowA.data.signedAt },
        };
        expect(set.merge(followASameTimestamp).isOk()).toBe(true);
        expect(follows()).toEqual(new Set());
        expect(unfollows()).toEqual(new Set([unfollowA]));
      });
    });
  });

  describe('mergeFollowRemove', () => {
    test('succeeds with valid FollowRemove', () => {
      expect(set.merge(unfollowA).isOk()).toBe(true);
      expect(follows()).toEqual(new Set());
      expect(unfollows()).toEqual(new Set([unfollowA]));
    });

    test('succeeds (no-op) with duplicate FollowRemove', () => {
      expect(set.merge(unfollowA).isOk()).toBe(true);
      expect(set.merge(unfollowA).isOk()).toBe(true);
      expect(follows()).toEqual(new Set());
      expect(unfollows()).toEqual(new Set([unfollowA]));
    });

    test('succeeds with multiple valid FollowRemove messages', () => {
      expect(set.merge(unfollowA).isOk()).toBe(true);
      expect(set.merge(unfollowB).isOk()).toBe(true);
      expect(follows()).toEqual(new Set());
      expect(unfollows()).toEqual(new Set([unfollowA, unfollowB]));
    });

    describe('when the same target has been added', () => {
      beforeEach(() => {
        expect(set.merge(followA).isOk()).toBe(true);
      });

      test('succeeds with later timestamp', () => {
        expect(set.merge(unfollowA).isOk()).toBe(true);
        expect(follows()).toEqual(new Set());
        expect(unfollows()).toEqual(new Set([unfollowA]));
      });

      test('succeeds (no-op) with earlier timestamp', () => {
        const unfollowAEarlier: FollowRemove = {
          ...unfollowA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...unfollowA.data, signedAt: followA.data.signedAt - 1 },
        };
        expect(set.merge(unfollowAEarlier).isOk()).toBe(true);
        expect(follows()).toEqual(new Set([followA]));
        expect(unfollows()).toEqual(new Set());
      });

      test('succeeds with same timestamp', () => {
        const unfollowASameTimestamp: FollowRemove = {
          ...unfollowA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...unfollowA.data, signedAt: followA.data.signedAt },
        };
        expect(set.merge(unfollowASameTimestamp).isOk()).toBe(true);
        expect(follows()).toEqual(new Set());
        expect(unfollows()).toEqual(new Set([unfollowASameTimestamp]));
      });
    });

    describe('when the same target is already removed', () => {
      beforeEach(() => {
        expect(set.merge(unfollowA).isOk()).toBe(true);
      });

      test('succeeds with later timestamp', () => {
        const unfollowALater: FollowRemove = {
          ...unfollowA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...unfollowA.data, signedAt: unfollowA.data.signedAt + 1 },
        };
        expect(set.merge(unfollowALater).isOk()).toBe(true);
        expect(follows()).toEqual(new Set());
        expect(unfollows()).toEqual(new Set([unfollowALater]));
      });

      test('succeeds (no-op) with earlier timestamp', () => {
        const unfollowAEarlier: FollowRemove = {
          ...unfollowA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...unfollowA.data, signedAt: unfollowA.data.signedAt - 1 },
        };
        expect(set.merge(unfollowAEarlier).isOk()).toBe(true);
        expect(follows()).toEqual(new Set());
        expect(unfollows()).toEqual(new Set([unfollowA]));
      });

      describe('with the same timestamp', () => {
        test('succeeds with a higher hash order', () => {
          const unfollowAHigherHash: FollowRemove = { ...unfollowA, hash: unfollowA.hash + 'a' };
          expect(set.merge(unfollowAHigherHash).isOk()).toBe(true);
          expect(follows()).toEqual(new Set());
          expect(unfollows()).toEqual(new Set([unfollowAHigherHash]));
        });

        test('succeeds (no-op) with a lower hash order', () => {
          const unfollowALowerHash: FollowRemove = { ...unfollowA, hash: unfollowA.hash.slice(-1, 0) };
          expect(set.merge(unfollowALowerHash).isOk()).toBe(true);
          expect(follows()).toEqual(new Set());
          expect(unfollows()).toEqual(new Set([unfollowA]));
        });
      });
    });
  });
});

describe('revokeSigner', () => {
  test('succeeds without any messages', () => {
    expect(set.revokeSigner(followA.signer).isOk()).toBe(true);
  });

  test('succeeds and drops adds', () => {
    expect(set.merge(followA).isOk()).toBe(true);
    expect(set.revokeSigner(followA.signer).isOk()).toBe(true);
    expect(follows()).toEqual(new Set());
    expect(unfollows()).toEqual(new Set());
  });

  test('succeeds and drops removes', () => {
    expect(set.merge(unfollowA).isOk()).toBe(true);
    expect(set.revokeSigner(unfollowA.signer).isOk()).toBe(true);
    expect(follows()).toEqual(new Set());
    expect(unfollows()).toEqual(new Set());
  });

  test('suceeds and only removes messages from signer', () => {
    const followBDifferentSigner: Follow = { ...followB, signer: 'foo' };
    expect(set.merge(followA).isOk()).toBe(true);
    expect(set.merge(followBDifferentSigner).isOk()).toBe(true);
    expect(set.revokeSigner(followA.signer).isOk()).toBe(true);
    expect(follows()).toEqual(new Set([followBDifferentSigner]));
    expect(unfollows()).toEqual(new Set());
  });
});
