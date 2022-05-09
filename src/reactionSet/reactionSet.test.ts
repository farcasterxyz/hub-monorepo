import { Factories } from '~/factories';
import ReactionSet from '~/reactionSet';
import { Reaction } from '~/types';
import { hashCompare } from '~/utils';

const set = new ReactionSet();

describe('add reaction', () => {
  let activeReaction: Reaction;

  beforeAll(async () => {
    activeReaction = await Factories.Reaction.create();
  });

  beforeEach(() => {
    set._reset();
  });

  const subject = () => set._getActiveReactions();

  test('fails with an incorrect message type', async () => {
    const invalidReaction = (await Factories.Cast.create()) as unknown as Reaction;
    expect(set.merge(invalidReaction)._unsafeUnwrapErr()).toBe('ReactionSet.merge: invalid reaction');
    expect(subject()).toEqual([]);
  });

  describe('active', () => {
    test('works when active is passed in', async () => {
      expect(set.merge(activeReaction).isOk()).toBe(true);
      expect(subject()).toEqual([activeReaction]);
    });

    test('fails when duplicate active is passed in', async () => {
      expect(set.merge(activeReaction).isOk()).toBe(true);
      expect(set.merge(activeReaction)._unsafeUnwrapErr()).toBe('ReactionSet.merge: duplicate reaction');
      expect(subject()).toEqual([activeReaction]);
    });

    test('works when reactions that have different URIs', async () => {
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

      test('fails if this one has a lower timestamp', async () => {
        expect(set.merge(activeReaction).isOk()).toBe(true);
        const earlierReaction = await Factories.Reaction.create({
          data: {
            body: { targetUri },
            signedAt: activeReaction.data.signedAt - 1,
          },
        });
        expect(set.merge(earlierReaction)._unsafeUnwrapErr()).toBe('ReactionSet.merge: newer reaction was present');
        expect(subject()).toEqual([activeReaction]);
      });

      describe('with conflicting timestamps', () => {
        let conflictingReaction: Reaction;

        beforeAll(async () => {
          conflictingReaction = await Factories.Reaction.create({
            data: {
              body: { targetUri },
              signedAt: activeReaction.data.signedAt,
            },
          });
        });

        test("succeeds if this reaction's hash has higher lexicographical order", async () => {
          if (hashCompare(activeReaction.hash, conflictingReaction.hash) < 0) {
            expect(set.merge(activeReaction).isOk()).toBe(true);
            expect(set.merge(conflictingReaction).isOk()).toBe(true);
            expect(subject()).toEqual([conflictingReaction]);
          } else {
            expect(set.merge(conflictingReaction).isOk()).toBe(true);
            expect(set.merge(activeReaction).isOk()).toBe(true);
            expect(subject()).toEqual([activeReaction]);
          }
        });

        test("fails if this reaction's hash has lower lexicographical order", async () => {
          if (hashCompare(activeReaction.hash, conflictingReaction.hash) < 0) {
            expect(set.merge(conflictingReaction).isOk()).toBe(true);
            expect(set.merge(activeReaction)._unsafeUnwrapErr()).toBe(
              'ReactionSet.merge: newer reaction was present (lexicographic tiebreaker)'
            );
            expect(subject()).toEqual([conflictingReaction]);
          } else {
            expect(set.merge(activeReaction).isOk()).toBe(true);
            expect(set.merge(conflictingReaction)._unsafeUnwrapErr()).toBe(
              'ReactionSet.merge: newer reaction was present (lexicographic tiebreaker)'
            );
            expect(subject()).toEqual([activeReaction]);
          }
        });
      });
    });
  });

  describe('inactive', () => {
    let inactiveReaction: Reaction;
    let targetUri: string;

    beforeAll(async () => {
      targetUri = activeReaction.data.body.targetUri;

      inactiveReaction = await Factories.Reaction.create({
        data: {
          body: {
            targetUri,
            active: false,
          },
          signedAt: activeReaction.data.signedAt + 1,
        },
      });
    });

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

    test('fails when duplicate inactive passed in', async () => {
      expect(set.merge(inactiveReaction).isOk()).toBe(true);
      expect(set.merge(inactiveReaction)._unsafeUnwrapErr()).toBe('ReactionSet.merge: duplicate reaction');
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

      test('fails if this inactive is older', async () => {
        expect(set.merge(inactiveReaction).isOk()).toBe(true);

        const earlierDeactivation = await Factories.Reaction.create({
          data: {
            body: { targetUri, active: false },
            signedAt: inactiveReaction.data.signedAt - 1,
          },
        });

        expect(set.merge(earlierDeactivation)._unsafeUnwrapErr()).toBe('ReactionSet.merge: newer reaction was present');
        expect(subject()).toEqual([]);
        expect(set._getInactiveReactions()).toEqual([inactiveReaction]);
      });

      describe('with conflicting timestamps', () => {
        let conflictingInactiveReaction: Reaction;

        beforeAll(async () => {
          conflictingInactiveReaction = await Factories.Reaction.create({
            data: {
              body: { targetUri, active: false },
              signedAt: inactiveReaction.data.signedAt,
            },
          });
        });

        test("succeeds if this reaction's hash has higher lexicographical order", async () => {
          if (hashCompare(inactiveReaction.hash, conflictingInactiveReaction.hash) < 0) {
            expect(set.merge(inactiveReaction).isOk()).toBe(true);
            expect(set.merge(conflictingInactiveReaction).isOk()).toBe(true);
            expect(subject()).toEqual([]);
            expect(set._getInactiveReactions()).toEqual([conflictingInactiveReaction]);
          } else {
            expect(set.merge(conflictingInactiveReaction).isOk()).toBe(true);
            expect(set.merge(inactiveReaction).isOk()).toBe(true);
            expect(subject()).toEqual([]);
            expect(set._getInactiveReactions()).toEqual([inactiveReaction]);
          }
        });

        test("fails if this reaction's hash has lower lexicographical order", async () => {
          if (hashCompare(inactiveReaction.hash, conflictingInactiveReaction.hash) < 0) {
            expect(set.merge(conflictingInactiveReaction).isOk()).toBe(true);
            expect(set.merge(inactiveReaction)._unsafeUnwrapErr()).toBe(
              'ReactionSet.merge: newer reaction was present (lexicographic tiebreaker)'
            );
            expect(subject()).toEqual([]);
            expect(set._getInactiveReactions()).toEqual([conflictingInactiveReaction]);
          } else {
            expect(set.merge(inactiveReaction).isOk()).toBe(true);
            expect(set.merge(conflictingInactiveReaction)._unsafeUnwrapErr()).toBe(
              'ReactionSet.merge: newer reaction was present (lexicographic tiebreaker)'
            );
            expect(subject()).toEqual([]);
            expect(set._getInactiveReactions()).toEqual([inactiveReaction]);
          }
        });
      });
    });
  });
});
