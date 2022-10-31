import Factories from '~/test/factories/flatbuffer';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import MessageModel from '~/storage/flatbuffers/model';
import { BadRequestError, NotFoundError } from '~/utils/errors';
import { ReactionAddModel, ReactionRemoveModel, UserPrefix } from '~/storage/flatbuffers/types';
import ReactionSet from '~/storage/sets/flatbuffers/reactionSet';
import { ReactionType } from '~/utils/generated/message_generated';

const db = jestBinaryRocksDB('flatbuffers.reactionSet.test');
const set = new ReactionSet(db);
const fid = Factories.FID.build();

const castId = await Factories.CastID.create();

let reactionAdd: ReactionAddModel;
let reactionRemove: ReactionRemoveModel;

beforeAll(async () => {
  // Constructs a ReactionAdd pointing at a specific castId
  const reactionBody = Factories.ReactionBody.build({
    type: ReactionType.Like,
    cast: Factories.CastID.build({
      fid: Array.from(castId.fidArray() || new Uint8Array()),
      hash: Array.from(castId.hashArray() || new Uint8Array()),
    }),
  });

  const reactionAddData = await Factories.ReactionAddData.create({ fid: Array.from(fid), body: reactionBody });
  const reactionAddMessage = await Factories.Message.create({ data: Array.from(reactionAddData.bb?.bytes() ?? []) });
  reactionAdd = new MessageModel(reactionAddMessage) as ReactionAddModel;

  // Constructs a ReactionRemove pointing at the same target as the ReactionAdd with a later timestamp
  const reactionRemoveData = await Factories.ReactionRemoveData.create({
    fid: Array.from(fid),
    body: reactionBody,
    timestamp: reactionAddData.timestamp() + 1,
  });

  const reactionRemoveMessage = await Factories.Message.create({
    data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
  });
  reactionRemove = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;
});

describe('getReactionAdd', () => {
  test('fails if missing', async () => {
    await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).rejects.toThrow(NotFoundError);
  });

  test('fails if only ReactionRemove exists for the target', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).rejects.toThrow(NotFoundError);
  });

  test('fails if the wrong reaction type is provided', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionAdd(fid, ReactionType.Recast, castId)).rejects.toThrow(NotFoundError);
  });

  test('returns message if it exists for the target', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).resolves.toEqual(reactionAdd);
  });
});

describe('getReactionRemove', () => {
  test('fails if missing', async () => {
    await expect(set.getReactionRemove(fid, reactionRemove.body().type(), castId)).rejects.toThrow(NotFoundError);
  });

  test('fails if only reactionAdd exists for the target', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionRemove(fid, reactionAdd.body().type(), castId)).rejects.toThrow(NotFoundError);
  });

  test('fails if the wrong reaction type is provided', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionRemove(fid, ReactionType.Recast, castId)).rejects.toThrow(NotFoundError);
  });

  test('returns reactionRemove if it exists for the target', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionRemove(fid, reactionRemove.body().type(), castId)).resolves.toEqual(reactionRemove);
  });
});

describe('getReactionAddsByFid', () => {
  test('returns reactionAdds if they exist', async () => {
    // TODO: Add multiple and assert that they are returned in the correct ordering
    await set.merge(reactionAdd);
    await expect(set.getReactionAddsByFid(fid)).resolves.toEqual([reactionAdd]);
  });

  test('returns empty array if no ReactionAdd exists', async () => {
    await expect(set.getReactionAddsByFid(fid)).resolves.toEqual([]);
  });

  test('returns empty array if no ReactionAdd exists, even if ReactionRemove exists', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionAddsByFid(fid)).resolves.toEqual([]);
  });
});

describe('getReactionRemovesByFid', () => {
  test('returns ReactionRemove if it exists', async () => {
    // TODO: Add multiple and assert that they are returned in the correct ordering
    await set.merge(reactionRemove);
    await expect(set.getReactionRemovesByFid(fid)).resolves.toEqual([reactionRemove]);
  });

  test('returns empty array if no ReactionRemove exists', async () => {
    await expect(set.getReactionRemovesByFid(fid)).resolves.toEqual([]);
  });

  test('returns empty array if no ReactionRemove exists, even if ReactionAdds exists', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionRemovesByFid(fid)).resolves.toEqual([]);
  });
});

describe('getReactionsByTarget', () => {
  test('returns empty array if no reactions exist', async () => {
    const byCast = await set.getReactionsByTarget(castId);
    expect(new Set(byCast)).toEqual(new Set([]));
  });

  test('returns reactions for a target', async () => {
    const sameUserData = await Factories.ReactionAddData.create({
      body: reactionAdd.body().unpack() || null,
    });
    const sameUserMessage = await Factories.Message.create({
      data: Array.from(sameUserData.bb?.bytes() ?? []),
    });
    const sameUser = new MessageModel(sameUserMessage) as ReactionAddModel;

    await set.merge(reactionAdd);
    await set.merge(sameUser);

    const byCast = await set.getReactionsByTarget(castId);
    expect(new Set(byCast)).toEqual(new Set([reactionAdd, sameUser]));
  });

  test('returns empty array if reactions exist, but for a different target', async () => {
    await set.merge(reactionAdd);

    const unknownCastId = await Factories.CastID.create();
    const byCast = await set.getReactionsByTarget(unknownCastId);
    expect(new Set(byCast)).toEqual(new Set([]));
  });
});

describe('merge', () => {
  test('fails with invalid message type', async () => {
    const invalidData = await Factories.FollowAddData.create({ fid: Array.from(fid) });
    const message = await Factories.Message.create({ data: Array.from(invalidData.bb?.bytes() ?? []) });
    await expect(set.merge(new MessageModel(message))).rejects.toThrow(BadRequestError);
  });

  describe('ReactionRemove', () => {
    describe('succeeds', () => {
      beforeEach(async () => {
        await set.merge(reactionAdd);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);
      });

      test('saves message', async () => {
        await expect(
          MessageModel.get(db, fid, UserPrefix.ReactionMessage, reactionRemove.timestampHash())
        ).resolves.toEqual(reactionRemove);
      });

      test('saves reactionRemoves index', async () => {
        // TODO: helper or shortcut for the type finder
        await expect(set.getReactionRemove(fid, reactionRemove.body().type(), castId)).resolves.toEqual(reactionRemove);
      });

      test('deletes ReactionAdd message', async () => {
        await expect(
          MessageModel.get(db, fid, UserPrefix.ReactionMessage, reactionAdd.timestampHash())
        ).rejects.toThrow(NotFoundError);
      });

      test('deletes reactionAdds index', async () => {
        await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).rejects.toThrow(NotFoundError);
      });

      test('deletes reactionsByTarget index', async () => {
        await expect(set.getReactionsByTarget(castId)).resolves.toEqual([]);
      });

      test('overwrites earlier ReactionRemove', async () => {
        const reactionRemoveData = await Factories.ReactionRemoveData.create({
          ...reactionRemove.data.unpack(),
          timestamp: reactionRemove.timestamp() + 1,
        });
        const reactionRemoveMessage = await Factories.Message.create({
          data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
        });
        const reactionRemoveLater = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;
        await expect(set.merge(reactionRemoveLater)).resolves.toEqual(undefined);
        await expect(set.getReactionRemove(fid, reactionRemove.body().type(), castId)).resolves.toEqual(
          reactionRemoveLater
        );
        await expect(
          MessageModel.get(db, fid, UserPrefix.ReactionMessage, reactionRemove.timestampHash())
        ).rejects.toThrow(NotFoundError);
      });

      test('no-ops when later FollowRemove exists', async () => {
        const reactionRemoveData = await Factories.ReactionRemoveData.create({
          ...reactionRemove.data.unpack(),
          timestamp: reactionRemove.timestamp() - 1,
        });
        const reactionRemoveMessage = await Factories.Message.create({
          data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
        });
        const reactionRemoveEarlier = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;
        await expect(set.merge(reactionRemoveEarlier)).resolves.toEqual(undefined);
        await expect(set.getReactionRemove(fid, reactionRemove.body().type(), castId)).resolves.toEqual(reactionRemove);
      });

      test('no-ops when merged twice', async () => {
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);
        await expect(set.getReactionRemove(fid, reactionRemove.body().type(), castId)).resolves.toEqual(reactionRemove);
      });
    });

    test('succeeds when ReactionAdd does not exist', async () => {
      await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);
      await expect(set.getReactionRemove(fid, reactionRemove.body().type(), castId)).resolves.toEqual(reactionRemove);
      await expect(set.getReactionAdd(fid, reactionRemove.body().type(), castId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('ReactionAdd', () => {
    describe('succeeds', () => {
      beforeEach(async () => {
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);
      });
      test('saves message', async () => {
        await expect(
          MessageModel.get(db, fid, UserPrefix.ReactionMessage, reactionAdd.timestampHash())
        ).resolves.toEqual(reactionAdd);
      });

      test('saves reactionAdds index', async () => {
        await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).resolves.toEqual(reactionAdd);
      });

      test('saves reactionsByTarget index', async () => {
        await expect(set.getReactionsByTarget(castId)).resolves.toEqual([reactionAdd]);
      });

      test('no-ops when merged twice', async () => {
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);
        await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).resolves.toEqual(reactionAdd);
      });
    });

    describe('with conflicting FollowAdd', () => {
      let followAddLater: ReactionAddModel;
      beforeAll(async () => {
        const reactionAddData = await Factories.FollowAddData.create({
          ...reactionAdd.data.unpack(),
          timestamp: reactionAdd.timestamp() + 1,
        });
        const reactionAddMessage = await Factories.Message.create({
          data: Array.from(reactionAddData.bb?.bytes() ?? []),
        });
        followAddLater = new MessageModel(reactionAddMessage) as ReactionAddModel;
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(reactionAdd);
        await expect(set.merge(followAddLater)).resolves.toEqual(undefined);
        await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).resolves.toEqual(followAddLater);
        await expect(MessageModel.get(db, fid, UserPrefix.FollowMessage, reactionAdd.timestampHash())).rejects.toThrow(
          NotFoundError
        );
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(followAddLater);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);
        await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).resolves.toEqual(followAddLater);
        await expect(MessageModel.get(db, fid, UserPrefix.FollowMessage, reactionAdd.timestampHash())).rejects.toThrow(
          NotFoundError
        );
      });
    });

    describe('with conflicting FollowRemove', () => {
      test('succeeds with a later timestamp', async () => {
        const reactionRemoveData = await Factories.FollowRemoveData.create({
          ...reactionRemove.data.unpack(),
          timestamp: reactionAdd.timestamp() - 1,
        });
        const reactionRemoveMessage = await Factories.Message.create({
          data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
        });
        const followRemoveEarlier = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;
        await set.merge(followRemoveEarlier);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);
        await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).resolves.toEqual(reactionAdd);
        await expect(set.getReactionRemove(fid, reactionRemove.body().type(), castId)).rejects.toThrow(NotFoundError);
        await expect(
          MessageModel.get(db, fid, UserPrefix.FollowMessage, followRemoveEarlier.timestampHash())
        ).rejects.toThrow(NotFoundError);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(reactionRemove);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);
        await expect(set.getReactionRemove(fid, reactionRemove.body().type(), castId)).resolves.toEqual(reactionRemove);
        await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).rejects.toThrow(NotFoundError);
        await expect(MessageModel.get(db, fid, UserPrefix.FollowMessage, reactionAdd.timestampHash())).rejects.toThrow(
          NotFoundError
        );
      });
    });
  });
});
