import Faker from 'faker';
import { Factories } from '~/factories';
import ReactionSet from '~/sets/reactionSet';
import { Reaction, ReactionAdd, ReactionRemove, URI } from '~/types';

const set = new ReactionSet();
const reactionAdds = () => set._getAdds();
const reactionRemoves = () => set._getRemoves();

let a: URI;
let addA: ReactionAdd;
let remA: ReactionRemove;
let b: URI;
let addB: ReactionAdd;

beforeAll(async () => {
  a = Faker.internet.url();
  addA = await Factories.ReactionAdd.create({ data: { body: { targetUri: a } } });
  remA = await Factories.ReactionRemove.create({
    data: { body: { targetUri: a }, signedAt: addA.data.signedAt + 1 },
  });
  b = Faker.internet.url();
  addB = await Factories.ReactionAdd.create({ data: { body: { targetUri: b } } });
});

beforeEach(() => {
  set._reset();
});

describe('get', () => {
  test('fails when reaction does not exist', () => {
    expect(set.get(a)).toBeFalsy();
  });

  test('returns ReactionAdd when reaction has been added', () => {
    set.merge(addA);
    expect(set.get(a)).toEqual(addA);
  });

  test('fails when reaction has been removed', () => {
    set.merge(remA);
    expect(set.get(a)).toBeFalsy();
  });

  test('fails when using message hash', () => {
    set.merge(addA);
    expect(set.get(addA.hash)).toBeFalsy();
  });
});

describe('merge', () => {
  test('fails with an incorrect message type', async () => {
    const invalidReaction = (await Factories.CastShort.create()) as unknown as Reaction;
    expect(set.merge(invalidReaction)._unsafeUnwrapErr()).toBe('ReactionSet.merge: invalid message format');
    expect(reactionAdds()).toEqual(new Set());
    expect(reactionRemoves()).toEqual(new Set());
  });

  describe('mergeReactionAdd', () => {
    test('succeeds with valid ReactionAdd', async () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(reactionAdds()).toEqual(new Set([addA]));
      expect(reactionRemoves()).toEqual(new Set());
    });

    test('succeeds (no-ops) with duplicate valid ReactionAdd', async () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(addA).isOk()).toBe(true);
      expect(reactionAdds()).toEqual(new Set([addA]));
      expect(reactionRemoves()).toEqual(new Set());
    });

    test('succeeds when reactions have different URIs', async () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(addB).isOk()).toBe(true);
      expect(reactionAdds()).toEqual(new Set([addA, addB]));
      expect(reactionRemoves()).toEqual(new Set());
    });

    describe('with conflicting URIs', () => {
      beforeEach(() => {
        expect(set.merge(addA).isOk()).toBe(true);
      });

      test('succeeds with a later timestamp', () => {
        const addALater: ReactionAdd = {
          ...addA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...addA.data, signedAt: addA.data.signedAt + 1 },
        };
        expect(set.merge(addALater).isOk()).toBe(true);
        expect(reactionAdds()).toEqual(new Set([addALater]));
        expect(reactionRemoves()).toEqual(new Set());
      });

      test('succeeds (no-ops) with an earlier timestamp', () => {
        const addAEarlier: ReactionAdd = {
          ...addA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...addA.data, signedAt: addA.data.signedAt - 1 },
        };
        expect(set.merge(addAEarlier).isOk()).toBe(true);
        expect(reactionAdds()).toEqual(new Set([addA]));
        expect(reactionRemoves()).toEqual(new Set());
      });

      describe('with conflicting timestamps', () => {
        test('succeeds if message hash has higher lexicographical order', () => {
          const addAHigherHash = { ...addA, hash: addA.hash + 'a' };
          expect(set.merge(addAHigherHash).isOk()).toBe(true);
          expect(reactionAdds()).toEqual(new Set([addAHigherHash]));
          expect(reactionRemoves()).toEqual(new Set());
        });

        test('succeeds (no-ops) if message hash has lower lexicographical order', () => {
          const addALowerHash = { ...addA, hash: addA.hash.slice(-1, 0) };
          expect(set.merge(addALowerHash).isOk()).toBe(true);
          expect(reactionAdds()).toEqual(new Set([addA]));
          expect(reactionRemoves()).toEqual(new Set());
        });
      });
    });

    describe('when reaction has been removed', () => {
      beforeEach(() => {
        expect(set.merge(remA).isOk()).toBe(true);
      });

      test('succeeds with a later timestamp', () => {
        const addALater: ReactionAdd = {
          ...addA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...addA.data, signedAt: remA.data.signedAt + 1 },
        };
        expect(set.merge(addALater).isOk()).toBe(true);
        expect(reactionAdds()).toEqual(new Set([addALater]));
        expect(reactionRemoves()).toEqual(new Set());
      });

      test('succeeds (no-ops) with an earlier timestamp', () => {
        expect(set.merge(addA).isOk()).toBe(true);
        expect(reactionAdds()).toEqual(new Set());
        expect(reactionRemoves()).toEqual(new Set([remA]));
      });
    });
  });

  describe('inactive', () => {
    test('succeeds with valid ReactionRemove', () => {
      expect(set.merge(remA).isOk()).toBe(true);
      expect(reactionAdds()).toEqual(new Set());
      expect(reactionRemoves()).toEqual(new Set([remA]));
    });

    test('succeeds when target has already been added', async () => {
      expect(set.merge(addA).isOk()).toBe(true);
      expect(set.merge(remA).isOk()).toBe(true);
      expect(reactionAdds()).toEqual(new Set());
      expect(reactionRemoves()).toEqual(new Set([remA]));
    });

    test('succeeds (no-ops) with duplicate ReactionRemove messages', async () => {
      expect(set.merge(remA).isOk()).toBe(true);
      expect(set.merge(remA).isOk()).toBe(true);
      expect(reactionAdds()).toEqual(new Set());
      expect(reactionRemoves()).toEqual(new Set([remA]));
    });

    describe('with conflicting URIs', () => {
      beforeEach(() => {
        expect(set.merge(remA).isOk()).toBe(true);
      });

      test('succeeds with a later timestamp', () => {
        const remALater: ReactionRemove = {
          ...remA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...remA.data, signedAt: remA.data.signedAt + 1 },
        };
        expect(set.merge(remALater).isOk()).toBe(true);
        expect(reactionAdds()).toEqual(new Set());
        expect(reactionRemoves()).toEqual(new Set([remALater]));
      });

      test('succeeds (no-ops) with an earlier timestamp', () => {
        const remAEarlier: ReactionRemove = {
          ...remA,
          hash: Faker.datatype.hexaDecimal(128),
          data: { ...remA.data, signedAt: remA.data.signedAt - 1 },
        };
        expect(set.merge(remAEarlier).isOk()).toBe(true);
        expect(reactionAdds()).toEqual(new Set());
        expect(reactionRemoves()).toEqual(new Set([remA]));
      });

      describe('with conflicting timestamps', () => {
        test('succeeds if message hash has higher lexicographical order', () => {
          const remAHigherHash = { ...remA, hash: remA.hash + 'a' };
          expect(set.merge(remAHigherHash).isOk()).toBe(true);
          expect(reactionAdds()).toEqual(new Set());
          expect(reactionRemoves()).toEqual(new Set([remAHigherHash]));
        });

        test('succeeds (no-ops) if message hash has lower lexicographical order', () => {
          const remALowerHash = { ...remA, hash: remA.hash.slice(-1, 0) };
          expect(set.merge(remALowerHash).isOk()).toBe(true);
          expect(reactionAdds()).toEqual(new Set());
          expect(reactionRemoves()).toEqual(new Set([remA]));
        });
      });
    });
  });
});

describe('revokeSigner', () => {
  let reaction: Reaction;
  let reaction2: Reaction;

  beforeAll(async () => {
    reaction = await Factories.ReactionAdd.create();
    reaction2 = await Factories.ReactionAdd.create();
  });

  test('succeeds without any messages', () => {
    expect(set.revokeSigner(reaction.signer).isOk()).toBe(true);
  });

  test('succeeds and drops messages', () => {
    expect(set.merge(reaction).isOk()).toBe(true);
    expect(set.revokeSigner(reaction.signer).isOk()).toBe(true);
    expect(reactionAdds()).toEqual(new Set());
    expect(reactionRemoves()).toEqual(new Set());
  });

  test('suceeds and only removes messages from signer', () => {
    expect(set.merge(reaction).isOk()).toBe(true);
    expect(set.merge(reaction2).isOk()).toBe(true);
    expect(set.revokeSigner(reaction2.signer).isOk()).toBe(true);
    expect(reactionAdds()).toEqual(new Set([reaction]));
    expect(reactionRemoves()).toEqual(new Set());
  });
});
