import { Factories } from '~/factories';
import Faker from 'faker';
import FollowSet from '~/storage/sets/followSet';
import { Ed25519Signer, Follow, FollowAdd, FollowRemove, URI } from '~/types';
import { generateEd25519Signer } from '~/utils';
import { jestRocksDB } from '~/storage/db/jestUtils';
import FollowDB from '~/storage/db/follow';
import { BadRequestError, NotFoundError } from '~/errors';

const testDb = jestRocksDB('followSet.test');
const followDb = new FollowDB(testDb);
const set = new FollowSet(testDb);

const fid = Faker.datatype.number();

const follows = async (): Promise<Set<FollowAdd>> => {
  const followAdds = await followDb.getFollowAddsByUser(fid);
  return new Set(followAdds);
};
const unfollows = async (): Promise<Set<FollowRemove>> => {
  const followRemoves = await followDb.getFollowRemovesByUser(fid);
  return new Set(followRemoves);
};

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
  followA = await Factories.FollowAdd.create({ data: { fid, body: { targetUri: a } } }, { transient: { signer } });
  unfollowA = await Factories.FollowRemove.create(
    { data: { fid, body: { targetUri: a }, signedAt: followA.data.signedAt + 1 } },
    { transient: { signer } }
  );
  b = Faker.internet.url();
  followB = await Factories.FollowAdd.create({ data: { fid, body: { targetUri: b } } }, { transient: { signer } });
  unfollowB = await Factories.FollowRemove.create(
    { data: { fid, body: { targetUri: b }, signedAt: followB.data.signedAt + 1 } },
    { transient: { signer } }
  );
});

describe('getFollow', () => {
  test('fails when follow does not exist', async () => {
    await expect(set.getFollow(fid, a)).rejects.toThrow(NotFoundError);
  });

  test('returns FollowAdd when target has been followed', async () => {
    await set.merge(followA);
    await expect(set.getFollow(fid, a)).resolves.toEqual(followA);
  });

  test('fails when target has been unfollowed', async () => {
    await set.merge(followA);
    await set.merge(unfollowA);
    await expect(set.getFollow(fid, a)).rejects.toThrow(NotFoundError);
  });

  test('fails when using message hash', async () => {
    await set.merge(followA);
    await expect(set.getFollow(fid, followA.hash)).rejects.toThrow(NotFoundError);
  });
});

describe('merge', () => {
  test('fails with invalid message format', async () => {
    const invalidFollow = (await Factories.CastShort.create()) as unknown as Follow;
    await expect(set.merge(invalidFollow)).rejects.toThrow(BadRequestError);
    await expect(follows()).resolves.toEqual(new Set());
    await expect(unfollows()).resolves.toEqual(new Set());
  });

  describe('mergeFollowAdd', () => {
    test('succeeds with valid follow', async () => {
      await expect(set.merge(followA)).resolves.toEqual(undefined);
      await expect(follows()).resolves.toEqual(new Set([followA]));
      await expect(unfollows()).resolves.toEqual(new Set());
    });

    test('succeeds (no-op) with duplicate follow', async () => {
      await expect(set.merge(followA)).resolves.toEqual(undefined);
      await expect(set.merge(followA)).resolves.toEqual(undefined);
      await expect(follows()).resolves.toEqual(new Set([followA]));
      await expect(unfollows()).resolves.toEqual(new Set());
    });

    test('succeeds with multiple valid follows', async () => {
      await expect(set.merge(followA)).resolves.toEqual(undefined);
      await expect(set.merge(followB)).resolves.toEqual(undefined);
      await expect(follows()).resolves.toEqual(new Set([followA, followB]));
      await expect(unfollows()).resolves.toEqual(new Set());
    });

    describe('when the same target is already added', () => {
      beforeEach(async () => {
        await set.merge(followA);
      });

      test('succeeds with later timestamp', async () => {
        const followALater: FollowAdd = {
          ...followA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...followA.data, signedAt: followA.data.signedAt + 1 },
        };
        await expect(set.merge(followALater)).resolves.toEqual(undefined);
        await expect(follows()).resolves.toEqual(new Set([followALater]));
        await expect(unfollows()).resolves.toEqual(new Set());
      });

      test('succeeds (no-op) with earlier timestamp', async () => {
        const followAEarlier: FollowAdd = {
          ...followA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...followA.data, signedAt: followA.data.signedAt - 1 },
        };
        await expect(set.merge(followAEarlier)).resolves.toEqual(undefined);
        await expect(follows()).resolves.toEqual(new Set([followA]));
        await expect(unfollows()).resolves.toEqual(new Set());
      });

      describe('with the same timestamp', () => {
        test('succeeds with a higher hash order', async () => {
          const followAHigherHash: FollowAdd = { ...followA, hash: followA.hash + 'a' };
          await expect(set.merge(followAHigherHash)).resolves.toEqual(undefined);
          await expect(follows()).resolves.toEqual(new Set([followAHigherHash]));
          await expect(unfollows()).resolves.toEqual(new Set());
        });

        test('succeeds (no-op) with a lower hash order', async () => {
          const followALowerHash: FollowAdd = { ...followA, hash: followA.hash.slice(0, -1) };
          await expect(set.merge(followALowerHash)).resolves.toEqual(undefined);
          await expect(follows()).resolves.toEqual(new Set([followA]));
          await expect(unfollows()).resolves.toEqual(new Set());
        });
      });
    });

    describe('when the same target is already removed', () => {
      beforeEach(async () => {
        await set.merge(unfollowA);
      });

      test('succeeds with later timestamp', async () => {
        const followALater: FollowAdd = {
          ...followA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...followA.data, signedAt: unfollowA.data.signedAt + 1 },
        };
        await expect(set.merge(followALater)).resolves.toEqual(undefined);
        await expect(follows()).resolves.toEqual(new Set([followALater]));
        await expect(unfollows()).resolves.toEqual(new Set());
      });

      test('succeeds (no-op) with earlier timestamp', async () => {
        const followAEarlier: FollowAdd = {
          ...followA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...followA.data, signedAt: unfollowA.data.signedAt - 1 },
        };
        await expect(set.merge(followAEarlier)).resolves.toEqual(undefined);
        await expect(follows()).resolves.toEqual(new Set());
        await expect(unfollows()).resolves.toEqual(new Set([unfollowA]));
      });

      test('succeeds (no-op) with same timestamp', async () => {
        const followASameTimestamp: FollowAdd = {
          ...followA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...followA.data, signedAt: unfollowA.data.signedAt },
        };
        await expect(set.merge(followASameTimestamp)).resolves.toEqual(undefined);
        await expect(follows()).resolves.toEqual(new Set());
        await expect(unfollows()).resolves.toEqual(new Set([unfollowA]));
      });
    });
  });

  describe('mergeFollowRemove', () => {
    test('succeeds with valid FollowRemove', async () => {
      await expect(set.merge(unfollowA)).resolves.toEqual(undefined);
      await expect(follows()).resolves.toEqual(new Set());
      await expect(unfollows()).resolves.toEqual(new Set([unfollowA]));
    });

    test('succeeds (no-op) with duplicate FollowRemove', async () => {
      await expect(set.merge(unfollowA)).resolves.toEqual(undefined);
      await expect(set.merge(unfollowA)).resolves.toEqual(undefined);
      await expect(follows()).resolves.toEqual(new Set());
      await expect(unfollows()).resolves.toEqual(new Set([unfollowA]));
    });

    test('succeeds with multiple valid FollowRemove messages', async () => {
      await expect(set.merge(unfollowA)).resolves.toEqual(undefined);
      await expect(set.merge(unfollowB)).resolves.toEqual(undefined);
      await expect(follows()).resolves.toEqual(new Set());
      await expect(unfollows()).resolves.toEqual(new Set([unfollowA, unfollowB]));
    });

    describe('when the same target has been added', () => {
      beforeEach(async () => {
        await set.merge(followA);
      });

      test('succeeds with later timestamp', async () => {
        await expect(set.merge(unfollowA)).resolves.toEqual(undefined);
        await expect(follows()).resolves.toEqual(new Set());
        await expect(unfollows()).resolves.toEqual(new Set([unfollowA]));
      });

      test('succeeds (no-op) with earlier timestamp', async () => {
        const unfollowAEarlier: FollowRemove = {
          ...unfollowA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...unfollowA.data, signedAt: followA.data.signedAt - 1 },
        };
        await expect(set.merge(unfollowAEarlier)).resolves.toEqual(undefined);
        await expect(follows()).resolves.toEqual(new Set([followA]));
        await expect(unfollows()).resolves.toEqual(new Set());
      });

      test('succeeds with same timestamp', async () => {
        const unfollowASameTimestamp: FollowRemove = {
          ...unfollowA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...unfollowA.data, signedAt: followA.data.signedAt },
        };
        await expect(set.merge(unfollowASameTimestamp)).resolves.toEqual(undefined);
        await expect(follows()).resolves.toEqual(new Set());
        await expect(unfollows()).resolves.toEqual(new Set([unfollowASameTimestamp]));
      });
    });

    describe('when the same target is already removed', () => {
      beforeEach(async () => {
        await set.merge(unfollowA);
      });

      test('succeeds with later timestamp', async () => {
        const unfollowALater: FollowRemove = {
          ...unfollowA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...unfollowA.data, signedAt: unfollowA.data.signedAt + 1 },
        };
        await expect(set.merge(unfollowALater)).resolves.toEqual(undefined);
        await expect(follows()).resolves.toEqual(new Set());
        await expect(unfollows()).resolves.toEqual(new Set([unfollowALater]));
      });

      test('succeeds (no-op) with earlier timestamp', async () => {
        const unfollowAEarlier: FollowRemove = {
          ...unfollowA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...unfollowA.data, signedAt: unfollowA.data.signedAt - 1 },
        };
        await expect(set.merge(unfollowAEarlier)).resolves.toEqual(undefined);
        await expect(follows()).resolves.toEqual(new Set());
        await expect(unfollows()).resolves.toEqual(new Set([unfollowA]));
      });

      describe('with the same timestamp', () => {
        test('succeeds with a higher hash order', async () => {
          const unfollowAHigherHash: FollowRemove = { ...unfollowA, hash: unfollowA.hash + 'a' };
          await expect(set.merge(unfollowAHigherHash)).resolves.toEqual(undefined);
          await expect(follows()).resolves.toEqual(new Set());
          await expect(unfollows()).resolves.toEqual(new Set([unfollowAHigherHash]));
        });

        test('succeeds (no-op) with a lower hash order', async () => {
          const unfollowALowerHash: FollowRemove = { ...unfollowA, hash: unfollowA.hash.slice(0, -1) };
          await expect(set.merge(unfollowALowerHash)).resolves.toEqual(undefined);
          await expect(follows()).resolves.toEqual(new Set());
          await expect(unfollows()).resolves.toEqual(new Set([unfollowA]));
        });
      });
    });
  });
});

// describe('revokeSigner', () => {
//   test('succeeds without any messages', () => {
//     expect(set.revokeSigner(followA.signer)).resolves.toEqual(undefined);
//   });

//   test('succeeds and drops adds', () => {
//     await expect(set.merge(followA)).resolves.toBe(true);
//     expect(set.revokeSigner(followA.signer)).resolves.toEqual(undefined);
//     await expect(follows()).resolves.toEqual(new Set());
//     await expect(unfollows()).resolves.toEqual(new Set());
//   });

//   test('succeeds and drops removes', () => {
//     expect(set.merge(unfollowA)).resolves.toEqual(undefined);
//     expect(set.revokeSigner(unfollowA.signer)).resolves.toEqual(undefined);
//     await expect(follows()).resolves.toEqual(new Set());
//     await expect(unfollows()).resolves.toEqual(new Set());
//   });

//   test('suceeds and only removes messages from signer', () => {
//     const followBDifferentSigner: Follow = { ...followB, signer: 'foo' };
//     await expect(set.merge(followA)).resolves.toBe(true);
//     expect(set.merge(followBDifferentSigner)).resolves.toEqual(undefined);
//     expect(set.revokeSigner(followA.signer)).resolves.toEqual(undefined);
//     await expect(follows()).resolves.toEqual(new Set([followBDifferentSigner]));
//     await expect(unfollows()).resolves.toEqual(new Set());
//   });
// });
