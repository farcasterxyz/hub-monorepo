import { faker } from '@faker-js/faker';
import { jestRocksDB } from '~/storage/db/jestUtils';
import ReactionDB from '~/storage/db/reaction';
import { BadRequestError, NotFoundError } from '~/utils/errors';
import { Factories } from '~/test/factories';
import ReactionSet from '~/storage/sets/reactionSet';
import { Reaction, ReactionAdd, ReactionRemove, URI } from '~/types';

const testDb = jestRocksDB('reactionSet.test');
const reactionDb = new ReactionDB(testDb);
const set = new ReactionSet(testDb);

const fid = faker.datatype.number();

const reactionAdds = async (): Promise<Set<ReactionAdd>> => {
  const adds = await reactionDb.getReactionAddsByUser(fid);
  return new Set(adds);
};
const reactionRemoves = async (): Promise<Set<ReactionRemove>> => {
  const removes = await reactionDb.getreactionRemovesByUser(fid);
  return new Set(removes);
};

let a: URI;
let addA: ReactionAdd;
let remA: ReactionRemove;
let b: URI;
let addB: ReactionAdd;

beforeAll(async () => {
  a = faker.internet.url();
  addA = await Factories.ReactionAdd.create({ data: { fid, body: { targetUri: a } } });
  remA = await Factories.ReactionRemove.create({
    data: { fid, body: { targetUri: a }, signedAt: addA.data.signedAt + 1 },
  });
  b = faker.internet.url();
  addB = await Factories.ReactionAdd.create({ data: { fid, body: { targetUri: b } } });
});

describe('getReaction', () => {
  test('fails when reaction does not exist', async () => {
    await expect(set.getReaction(fid, a)).rejects.toThrow(NotFoundError);
  });

  test('returns ReactionAdd when reaction has been added', async () => {
    await set.merge(addA);
    await expect(set.getReaction(fid, a)).resolves.toEqual(addA);
  });

  test('fails when reaction has been removed', async () => {
    await set.merge(remA);
    await expect(set.getReaction(fid, a)).rejects.toThrow(NotFoundError);
  });

  test('fails when using message hash', async () => {
    await set.merge(addA);
    await expect(set.getReaction(fid, addA.hash)).rejects.toThrow(NotFoundError);
  });
});

describe('merge', () => {
  test('fails with an incorrect message type', async () => {
    const invalidReaction = (await Factories.CastShort.create()) as unknown as Reaction;
    await expect(set.merge(invalidReaction)).rejects.toThrow(BadRequestError);
    await expect(reactionAdds()).resolves.toEqual(new Set());
    await expect(reactionRemoves()).resolves.toEqual(new Set());
  });

  describe('mergeReactionAdd', () => {
    test('succeeds with valid ReactionAdd', async () => {
      await expect(set.merge(addA)).resolves.toEqual(undefined);
      await expect(reactionAdds()).resolves.toEqual(new Set([addA]));
      await expect(reactionRemoves()).resolves.toEqual(new Set());
    });

    test('succeeds (no-ops) with duplicate valid ReactionAdd', async () => {
      await expect(set.merge(addA)).resolves.toEqual(undefined);
      await expect(set.merge(addA)).resolves.toEqual(undefined);
      await expect(reactionAdds()).resolves.toEqual(new Set([addA]));
      await expect(reactionRemoves()).resolves.toEqual(new Set());
    });

    test('succeeds when reactions have different URIs', async () => {
      await expect(set.merge(addA)).resolves.toEqual(undefined);
      await expect(set.merge(addB)).resolves.toEqual(undefined);
      await expect(reactionAdds()).resolves.toEqual(new Set([addA, addB]));
      await expect(reactionRemoves()).resolves.toEqual(new Set());
    });

    describe('with conflicting URIs', () => {
      beforeEach(async () => {
        await set.merge(addA);
      });

      test('succeeds with a later timestamp', async () => {
        const addALater: ReactionAdd = {
          ...addA,
          hash: faker.datatype.hexadecimal({ length: 128 }),
          data: { ...addA.data, signedAt: addA.data.signedAt + 1 },
        };
        await expect(set.merge(addALater)).resolves.toEqual(undefined);
        await expect(reactionAdds()).resolves.toEqual(new Set([addALater]));
        await expect(reactionRemoves()).resolves.toEqual(new Set());
      });

      test('succeeds (no-ops) with an earlier timestamp', async () => {
        const addAEarlier: ReactionAdd = {
          ...addA,
          hash: faker.datatype.hexadecimal({ length: 128 }),
          data: { ...addA.data, signedAt: addA.data.signedAt - 1 },
        };
        await expect(set.merge(addAEarlier)).resolves.toEqual(undefined);
        await expect(reactionAdds()).resolves.toEqual(new Set([addA]));
        await expect(reactionRemoves()).resolves.toEqual(new Set());
      });

      describe('with conflicting timestamps', () => {
        test('succeeds if message hash has higher lexicographical order', async () => {
          const addAHigherHash = { ...addA, hash: addA.hash + 'a' };
          await expect(set.merge(addAHigherHash)).resolves.toEqual(undefined);
          await expect(reactionAdds()).resolves.toEqual(new Set([addAHigherHash]));
          await expect(reactionRemoves()).resolves.toEqual(new Set());
        });

        test('succeeds (no-ops) if message hash has lower lexicographical order', async () => {
          const addALowerHash = { ...addA, hash: addA.hash.slice(0, -1) };
          await expect(set.merge(addALowerHash)).resolves.toEqual(undefined);
          await expect(reactionAdds()).resolves.toEqual(new Set([addA]));
          await expect(reactionRemoves()).resolves.toEqual(new Set());
        });
      });
    });

    describe('when reaction has been removed', () => {
      beforeEach(async () => {
        await set.merge(remA);
      });

      test('succeeds with a later timestamp', async () => {
        const addALater: ReactionAdd = {
          ...addA,
          hash: faker.datatype.hexadecimal({ length: 128 }),
          data: { ...addA.data, signedAt: remA.data.signedAt + 1 },
        };
        await expect(set.merge(addALater)).resolves.toEqual(undefined);
        await expect(reactionAdds()).resolves.toEqual(new Set([addALater]));
        await expect(reactionRemoves()).resolves.toEqual(new Set());
      });

      test('succeeds (no-ops) with an earlier timestamp', async () => {
        await expect(set.merge(addA)).resolves.toEqual(undefined);
        await expect(reactionAdds()).resolves.toEqual(new Set());
        await expect(reactionRemoves()).resolves.toEqual(new Set([remA]));
      });

      test('succeeds (no-ops) with the same timestamp', async () => {
        const addASameTimestamp: ReactionAdd = {
          ...addA,
          hash: faker.datatype.hexadecimal({ length: 128 }),
          data: { ...addA.data, signedAt: remA.data.signedAt },
        };
        await expect(set.merge(addASameTimestamp)).resolves.toEqual(undefined);
        await expect(reactionAdds()).resolves.toEqual(new Set());
        await expect(reactionRemoves()).resolves.toEqual(new Set([remA]));
      });
    });
  });

  describe('mergeReactionRemove', () => {
    test('succeeds with valid ReactionRemove', async () => {
      await expect(set.merge(remA)).resolves.toEqual(undefined);
      await expect(reactionAdds()).resolves.toEqual(new Set());
      await expect(reactionRemoves()).resolves.toEqual(new Set([remA]));
    });

    test('succeeds when target has already been added', async () => {
      await expect(set.merge(addA)).resolves.toEqual(undefined);
      await expect(set.merge(remA)).resolves.toEqual(undefined);
      await expect(reactionAdds()).resolves.toEqual(new Set());
      await expect(reactionRemoves()).resolves.toEqual(new Set([remA]));
    });

    test('succeeds (no-ops) with duplicate ReactionRemove messages', async () => {
      await expect(set.merge(remA)).resolves.toEqual(undefined);
      await expect(set.merge(remA)).resolves.toEqual(undefined);
      await expect(reactionAdds()).resolves.toEqual(new Set());
      await expect(reactionRemoves()).resolves.toEqual(new Set([remA]));
    });

    describe('with conflicting URIs', () => {
      beforeEach(async () => {
        await set.merge(remA);
      });

      test('succeeds with a later timestamp', async () => {
        const remALater: ReactionRemove = {
          ...remA,
          hash: faker.datatype.hexadecimal({ length: 128 }),
          data: { ...remA.data, signedAt: remA.data.signedAt + 1 },
        };
        await expect(set.merge(remALater)).resolves.toEqual(undefined);
        await expect(reactionAdds()).resolves.toEqual(new Set());
        await expect(reactionRemoves()).resolves.toEqual(new Set([remALater]));
      });

      test('succeeds (no-ops) with an earlier timestamp', async () => {
        const remAEarlier: ReactionRemove = {
          ...remA,
          hash: faker.datatype.hexadecimal({ length: 128 }),
          data: { ...remA.data, signedAt: remA.data.signedAt - 1 },
        };
        await expect(set.merge(remAEarlier)).resolves.toEqual(undefined);
        await expect(reactionAdds()).resolves.toEqual(new Set());
        await expect(reactionRemoves()).resolves.toEqual(new Set([remA]));
      });

      describe('with conflicting timestamps', () => {
        test('succeeds if message hash has higher lexicographical order', async () => {
          const remAHigherHash = { ...remA, hash: remA.hash + 'a' };
          await expect(set.merge(remAHigherHash)).resolves.toEqual(undefined);
          await expect(reactionAdds()).resolves.toEqual(new Set());
          await expect(reactionRemoves()).resolves.toEqual(new Set([remAHigherHash]));
        });

        test('succeeds (no-ops) if message hash has lower lexicographical order', async () => {
          const remALowerHash = { ...remA, hash: remA.hash.slice(0, -1) };
          await expect(set.merge(remALowerHash)).resolves.toEqual(undefined);
          await expect(reactionAdds()).resolves.toEqual(new Set());
          await expect(reactionRemoves()).resolves.toEqual(new Set([remA]));
        });
      });
    });

    describe('when reaction has been added', () => {
      beforeEach(async () => {
        await set.merge(addA);
      });

      test('succeeds with a later timestamp', async () => {
        await expect(set.merge(remA)).resolves.toEqual(undefined);
        await expect(reactionAdds()).resolves.toEqual(new Set());
        await expect(reactionRemoves()).resolves.toEqual(new Set([remA]));
      });

      test('succeeds (no-ops) with an earlier timestamp', async () => {
        const remAEarlier: ReactionRemove = {
          ...remA,
          hash: faker.datatype.hexadecimal({ length: 128 }),
          data: { ...remA.data, signedAt: addA.data.signedAt - 1 },
        };
        await expect(set.merge(remAEarlier)).resolves.toEqual(undefined);
        await expect(reactionAdds()).resolves.toEqual(new Set([addA]));
        await expect(reactionRemoves()).resolves.toEqual(new Set());
      });

      test('succeeds with the same timestamp', async () => {
        const remASameTimestamp: ReactionRemove = {
          ...remA,
          hash: faker.datatype.hexadecimal({ length: 128 }),
          data: { ...remA.data, signedAt: addA.data.signedAt },
        };
        await expect(set.merge(remASameTimestamp)).resolves.toEqual(undefined);
        await expect(reactionAdds()).resolves.toEqual(new Set());
        await expect(reactionRemoves()).resolves.toEqual(new Set([remASameTimestamp]));
      });
    });
  });
});
