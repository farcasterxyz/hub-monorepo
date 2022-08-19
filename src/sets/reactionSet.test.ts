import Faker from 'faker';
import { Factories } from '~/factories';
import ReactionSet from '~/sets/reactionSet';
import { Reaction, URI } from '~/types';

const set = new ReactionSet();

let targetUri: URI;
let activeReaction: Reaction;
let inactiveReaction: Reaction;

beforeAll(async () => {
  targetUri = Faker.internet.url();
  activeReaction = await Factories.Reaction.create({ data: { body: { targetUri } } });
  inactiveReaction = await Factories.Reaction.create({
    data: { body: { targetUri, active: false }, signedAt: activeReaction.data.signedAt + 1 },
  });
});

beforeEach(() => {
  set._reset();
});

describe('get', () => {
  test('fails when reaction does not exist', () => {
    expect(set.get(targetUri)).toBeFalsy();
  });

  test('returns Reaction when active', () => {
    set.merge(activeReaction);
    expect(set.get(targetUri)).toEqual(activeReaction);
  });

  test('returns Reaction when inactive', () => {
    set.merge(inactiveReaction);
    expect(set.get(targetUri)).toEqual(inactiveReaction);
  });

  test('fails when using message hash', () => {
    set.merge(activeReaction);
    expect(set.get(activeReaction.hash)).toBeFalsy();
  });
});

describe('merge', () => {
  const subject = () => set._getActiveReactions();

  test('fails with an incorrect message type', async () => {
    const invalidReaction = (await Factories.Cast.create()) as unknown as Reaction;
    expect(set.merge(invalidReaction)._unsafeUnwrapErr()).toBe('ReactionSet.merge: invalid message format');
    expect(subject()).toEqual([]);
  });

  describe('active', () => {
    test('succeeds when active is passed in', async () => {
      expect(set.merge(activeReaction).isOk()).toBe(true);
      expect(subject()).toEqual([activeReaction]);
    });

    test('succeeds (no-ops) when duplicate active is passed in', async () => {
      expect(set.merge(activeReaction).isOk()).toBe(true);
      expect(set.merge(activeReaction).isOk()).toBe(true);
      expect(subject()).toEqual([activeReaction]);
    });

    test('succeeds when reactions have different URIs', async () => {
      expect(set.merge(activeReaction).isOk()).toBe(true);
      const secondReaction = await Factories.Reaction.create();

      expect(set.merge(secondReaction).isOk()).toBe(true);
      // compare sets instead of arrays to avoid failures due to ordering by hash
      expect(new Set(subject())).toEqual(new Set([secondReaction, activeReaction]));
    });

    describe('with conflicting URIs', () => {
      let targetUri: string;
      beforeAll(() => {
        targetUri = activeReaction.data.body.targetUri;
      });

      test('replaces existing reaction if this one has a higher timestamp', async () => {
        expect(set.merge(activeReaction).isOk()).toBe(true);
        const laterReaction = await Factories.Reaction.create({
          data: {
            body: { targetUri },
            signedAt: activeReaction.data.signedAt + 1,
          },
        });
        expect(set.merge(laterReaction).isOk()).toBe(true);
        expect(subject()).toEqual([laterReaction]);
      });

      test('succeeds (no-ops) if this one has a lower timestamp', async () => {
        expect(set.merge(activeReaction).isOk()).toBe(true);
        const earlierReaction = await Factories.Reaction.create({
          data: {
            body: { targetUri },
            signedAt: activeReaction.data.signedAt - 1,
          },
        });
        expect(set.merge(earlierReaction).isOk()).toBe(true);
        expect(subject()).toEqual([activeReaction]);
      });

      describe('with conflicting timestamps', () => {
        let conflictingReaction: Reaction;

        beforeAll(() => {
          conflictingReaction = { ...activeReaction, hash: activeReaction.hash + 'a' };
          conflictingReaction.data.signedAt = activeReaction.data.signedAt;
        });

        test('succeeds if message hash has higher lexicographical order', () => {
          expect(set.merge(activeReaction).isOk()).toBe(true);
          expect(set.merge(conflictingReaction).isOk()).toBe(true);
          expect(subject()).toEqual([conflictingReaction]);
        });

        test('succeeds (no-ops) if message hash has lower lexicographical order', () => {
          expect(set.merge(conflictingReaction).isOk()).toBe(true);
          expect(set.merge(activeReaction).isOk()).toBe(true);
          expect(subject()).toEqual([conflictingReaction]);
        });
      });
    });
  });

  describe('inactive', () => {
    test('works when inactive passed in', async () => {
      expect(set.merge(inactiveReaction).isOk()).toBe(true);
      expect(subject()).toEqual([]);
      expect(set._getInactiveReactions()).toEqual([inactiveReaction]);
    });

    test('works when inactive passed in after active', async () => {
      expect(set.merge(activeReaction).isOk()).toBe(true);
      expect(set.merge(inactiveReaction).isOk()).toBe(true);
      expect(subject()).toEqual([]);
      expect(set._getInactiveReactions()).toEqual([inactiveReaction]);
    });

    test('works when active passed in after inactive', async () => {
      const laterActiveReaction = await Factories.Reaction.create({
        data: {
          body: { targetUri, active: true },
          signedAt: inactiveReaction.data.signedAt + 1,
        },
      });

      expect(set.merge(inactiveReaction).isOk()).toBe(true);
      expect(set.merge(laterActiveReaction).isOk()).toBe(true);
      expect(subject()).toEqual([laterActiveReaction]);
      expect(set._getInactiveReactions()).toEqual([]);
    });

    test('succeeds (no-ops) when duplicate inactive passed in', async () => {
      expect(set.merge(inactiveReaction).isOk()).toBe(true);
      expect(set.merge(inactiveReaction).isOk()).toBe(true);
      expect(subject()).toEqual([]);
      expect(set._getInactiveReactions()).toEqual([inactiveReaction]);
    });

    describe('with conflicting URIs', () => {
      test('replaces existing inactive if this is newer', async () => {
        expect(set.merge(inactiveReaction).isOk()).toBe(true);

        const laterDeactivation = await Factories.Reaction.create({
          data: {
            body: {
              targetUri,
              active: false,
            },
            signedAt: inactiveReaction.data.signedAt + 1,
          },
        });

        expect(set.merge(laterDeactivation).isOk()).toBe(true);
        expect(subject()).toEqual([]);
        expect(set._getInactiveReactions()).toEqual([laterDeactivation]);
      });

      test('succeeds (no-ops) if this inactive is older', async () => {
        expect(set.merge(inactiveReaction).isOk()).toBe(true);

        const earlierDeactivation = await Factories.Reaction.create({
          data: {
            body: { targetUri, active: false },
            signedAt: inactiveReaction.data.signedAt - 1,
          },
        });

        expect(set.merge(earlierDeactivation).isOk()).toBe(true);
        expect(subject()).toEqual([]);
        expect(set._getInactiveReactions()).toEqual([inactiveReaction]);
      });

      describe('with conflicting timestamps', () => {
        let conflictingInactiveReaction: Reaction;

        beforeAll(async () => {
          conflictingInactiveReaction = { ...inactiveReaction, hash: inactiveReaction.hash + 'a' };
          conflictingInactiveReaction.data.signedAt = inactiveReaction.data.signedAt;
        });

        test('succeeds if message hash has higher lexicographical order', async () => {
          expect(set.merge(inactiveReaction).isOk()).toBe(true);
          expect(set.merge(conflictingInactiveReaction).isOk()).toBe(true);
          expect(subject()).toEqual([]);
          expect(set._getInactiveReactions()).toEqual([conflictingInactiveReaction]);
        });

        test('succeeds (no-ops) if message hash has lower lexicographical order', async () => {
          expect(set.merge(conflictingInactiveReaction).isOk()).toBe(true);
          expect(set.merge(inactiveReaction).isOk()).toBe(true);
          expect(subject()).toEqual([]);
          expect(set._getInactiveReactions()).toEqual([conflictingInactiveReaction]);
        });
      });
    });
  });
});

describe('revokeSigner', () => {
  let reaction: Reaction;
  let reaction2: Reaction;

  beforeAll(async () => {
    reaction = await Factories.Reaction.create();
    reaction2 = await Factories.Reaction.create();
  });

  test('succeeds without any messages', () => {
    expect(set.revokeSigner(reaction.signer).isOk()).toBe(true);
  });

  test('succeeds and drops messages', () => {
    expect(set.merge(reaction).isOk()).toBe(true);
    expect(set.revokeSigner(reaction.signer).isOk()).toBe(true);
    expect(set._getActiveReactions()).toEqual([]);
    expect(set._getInactiveReactions()).toEqual([]);
  });

  test('suceeds and only removes messages from signer', () => {
    expect(set.merge(reaction).isOk()).toBe(true);
    expect(set.merge(reaction2).isOk()).toBe(true);
    expect(set.revokeSigner(reaction2.signer).isOk()).toBe(true);
    expect(set._getActiveReactions()).toEqual([reaction]);
    expect(set._getInactiveReactions()).toEqual([]);
  });
});
