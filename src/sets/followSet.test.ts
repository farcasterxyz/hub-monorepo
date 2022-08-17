import { Factories } from '~/factories';
import Faker from 'faker';
import FollowSet from '~/sets/followSet';
import { Ed25519Signer, Follow, Reaction, URI } from '~/types';
import { generateEd25519Signer, hashCompare } from '~/utils';

const set = new FollowSet();
const activeFollows = () => set._getActiveFollows();
const inactiveFollows = () => set._getInactiveFollows();

let signer: Ed25519Signer;
let a: URI;
let followA: Follow;
let unfollowA: Follow;
let b: URI;
let followB: Follow;
let unfollowB: Follow;

beforeAll(async () => {
  signer = await generateEd25519Signer();
  a = Faker.internet.url();
  followA = await Factories.Follow.create({ data: { body: { targetUri: a } } }, { transient: { signer } });
  unfollowA = await Factories.Follow.create(
    { data: { body: { targetUri: a, active: false }, signedAt: followA.data.signedAt + 1 } },
    { transient: { signer } }
  );
  b = Faker.internet.url();
  followB = await Factories.Follow.create({ data: { body: { targetUri: b } } }, { transient: { signer } });
  unfollowB = await Factories.Follow.create(
    { data: { body: { targetUri: b, active: false }, signedAt: followB.data.signedAt + 1 } },
    { transient: { signer } }
  );
});

beforeEach(() => {
  set._reset();
});

describe('merge', () => {
  test('fails with invalid message format', async () => {
    const invalidFollow = (await Factories.Cast.create()) as unknown as Follow;
    const res = await set.merge(invalidFollow);
    expect(res.isOk()).toBe(false);
    expect(res._unsafeUnwrapErr()).toBe('FollowSet.merge: invalid message format');
    expect(activeFollows()).toEqual(new Set());
    expect(inactiveFollows()).toEqual(new Set());
  });

  describe('with an active follow', () => {
    test('succeeds with valid follow', () => {
      expect(set.merge(followA).isOk()).toBe(true);
      expect(activeFollows()).toEqual(new Set([followA]));
      expect(inactiveFollows()).toEqual(new Set());
    });

    test('succeeds (no-op) with duplicate follow', () => {
      expect(set.merge(followA).isOk()).toBe(true);
      expect(set.merge(followA).isOk()).toBe(true);
      expect(activeFollows()).toEqual(new Set([followA]));
      expect(inactiveFollows()).toEqual(new Set());
    });

    test('succeeds with multiple valid follows', () => {
      expect(set.merge(followA).isOk()).toBe(true);
      expect(set.merge(followB).isOk()).toBe(true);
      expect(activeFollows()).toEqual(new Set([followA, followB]));
      expect(inactiveFollows()).toEqual(new Set());
    });

    describe('with the same targetURI', () => {
      let followALater: Follow;

      beforeAll(() => {
        followALater = { ...followA };
        followALater.data.signedAt = followA.data.signedAt + 1;
      });

      test('succeeds with later timestamp', () => {
        expect(set.merge(followA).isOk()).toBe(true);
        expect(set.merge(followALater).isOk()).toBe(true);
        expect(activeFollows()).toEqual(new Set([followALater]));
        expect(inactiveFollows()).toEqual(new Set());
      });

      test('succeeds (no-op) with earlier timestamp', () => {
        expect(set.merge(followALater).isOk()).toBe(true);
        expect(set.merge(followA).isOk()).toBe(true);
        expect(activeFollows()).toEqual(new Set([followALater]));
        expect(inactiveFollows()).toEqual(new Set());
      });
    });

    describe('with the same targetURI and timestamp', () => {
      let followAHigherHash: Follow;

      beforeAll(() => {
        followAHigherHash = { ...followA, hash: followA.hash + 'a' };
        followAHigherHash.data.signedAt = followA.data.signedAt;
      });

      test('succeeds with a higher hash order', () => {
        expect(set.merge(followA).isOk()).toBe(true);
        expect(set.merge(followAHigherHash).isOk()).toBe(true);
        expect(activeFollows()).toEqual(new Set([followAHigherHash]));
        expect(inactiveFollows()).toEqual(new Set());
      });

      test('succeeds (no-op) with a lower hash order', () => {
        expect(set.merge(followAHigherHash).isOk()).toBe(true);
        expect(set.merge(followA).isOk()).toBe(true);
        expect(activeFollows()).toEqual(new Set([followAHigherHash]));
        expect(inactiveFollows()).toEqual(new Set());
      });
    });
  });

  describe('with an inactive follow (unfollow)', () => {
    test('succeeds with valid unfollow', () => {
      expect(set.merge(unfollowA).isOk()).toBe(true);
      expect(activeFollows()).toEqual(new Set());
      expect(inactiveFollows()).toEqual(new Set([unfollowA]));
    });

    test('succeeds (no-op) with duplicate unfollow', () => {
      expect(set.merge(unfollowA).isOk()).toBe(true);
      expect(set.merge(unfollowA).isOk()).toBe(true);
      expect(activeFollows()).toEqual(new Set());
      expect(inactiveFollows()).toEqual(new Set([unfollowA]));
    });

    test('succeeds with multiple valid unfollows', () => {
      expect(set.merge(unfollowA).isOk()).toBe(true);
      expect(set.merge(unfollowB).isOk()).toBe(true);
      expect(activeFollows()).toEqual(new Set());
      expect(inactiveFollows()).toEqual(new Set([unfollowA, unfollowB]));
    });

    test('succeeds when a follow exists', () => {
      expect(set.merge(followA).isOk()).toBe(true);
      expect(set.merge(unfollowA).isOk()).toBe(true);
      expect(activeFollows()).toEqual(new Set());
      expect(inactiveFollows()).toEqual(new Set([unfollowA]));
    });

    test('succeeds when a follow exists with the same timestamp', () => {
      const unfollowASameTimestamp: Follow = { ...unfollowA };
      unfollowASameTimestamp.data.signedAt = followA.data.signedAt;
      expect(set.merge(followA).isOk()).toBe(true);
      expect(set.merge(unfollowASameTimestamp).isOk()).toBe(true);
      expect(activeFollows()).toEqual(new Set());
      expect(inactiveFollows()).toEqual(new Set([unfollowASameTimestamp]));
    });

    describe('with the same targetURI', () => {
      let unfollowALater: Follow;

      beforeAll(() => {
        unfollowALater = { ...unfollowA };
        unfollowALater.data.signedAt = unfollowA.data.signedAt + 1;
      });

      test('succeeds with later timestamp', () => {
        expect(set.merge(unfollowA).isOk()).toBe(true);
        expect(set.merge(unfollowALater).isOk()).toBe(true);
        expect(activeFollows()).toEqual(new Set());
        expect(inactiveFollows()).toEqual(new Set([unfollowALater]));
      });

      test('succeeds (no-op) with earlier timestamp', () => {
        expect(set.merge(unfollowALater).isOk()).toBe(true);
        expect(set.merge(unfollowA).isOk()).toBe(true);
        expect(activeFollows()).toEqual(new Set());
        expect(inactiveFollows()).toEqual(new Set([unfollowALater]));
      });
    });

    describe('with the same targetURI and timestamp', () => {
      let unfollowAHigherHash: Follow;

      beforeAll(() => {
        unfollowAHigherHash = { ...unfollowA, hash: unfollowA.hash + 'a' };
        unfollowAHigherHash.data.signedAt = unfollowA.data.signedAt;
      });

      test('succeeds with a higher hash order', () => {
        expect(set.merge(unfollowA).isOk()).toBe(true);
        expect(set.merge(unfollowAHigherHash).isOk()).toBe(true);
        expect(activeFollows()).toEqual(new Set());
        expect(inactiveFollows()).toEqual(new Set([unfollowAHigherHash]));
      });

      test('succeeds (no-op) with a lower hash order', () => {
        expect(set.merge(unfollowAHigherHash).isOk()).toBe(true);
        expect(set.merge(unfollowA).isOk()).toBe(true);
        expect(activeFollows()).toEqual(new Set());
        expect(inactiveFollows()).toEqual(new Set([unfollowAHigherHash]));
      });
    });
  });
});

describe('revokeSigner', () => {
  test('succeeds without any messages', () => {
    expect(set.revokeSigner(followA.signer).isOk()).toBe(true);
  });

  test('succeeds and drops messages', () => {
    expect(set.merge(followA).isOk()).toBe(true);
    expect(set.revokeSigner(followA.signer).isOk()).toBe(true);
    expect(activeFollows()).toEqual(new Set());
    expect(inactiveFollows()).toEqual(new Set());
  });

  test('suceeds and only removes messages from signer', () => {
    const followBDifferentSigner: Follow = { ...followB, signer: 'foo' };
    expect(set.merge(followA).isOk()).toBe(true);
    expect(set.merge(followBDifferentSigner).isOk()).toBe(true);
    expect(set.revokeSigner(followA.signer).isOk()).toBe(true);
    expect(activeFollows()).toEqual(new Set([followBDifferentSigner]));
    expect(inactiveFollows()).toEqual(new Set());
  });
});
