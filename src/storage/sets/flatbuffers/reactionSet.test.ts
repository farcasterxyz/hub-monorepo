import Factories from '~/test/factories/flatbuffer';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { BadRequestError, NotFoundError } from '~/utils/errors';
import { ReactionAddModel, ReactionRemoveModel, UserPrefix } from '~/storage/flatbuffers/types';
import ReactionSet from '~/storage/sets/flatbuffers/reactionSet';
import { MessageType, ReactionType } from '~/utils/generated/message_generated';

const db = jestBinaryRocksDB('flatbuffers.reactionSet.test');
const set = new ReactionSet(db);
const fid = Factories.FID.build();

const castId = await Factories.CastID.create();

let reactionAdd: ReactionAddModel;
let reactionRemove: ReactionRemoveModel;
let reactionAddRecast: ReactionAddModel;
let reactionRemoveRecast: ReactionRemoveModel;

beforeAll(async () => {
  // Constructs a ReactionAdd of type Like
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

  // Constructs a ReactionRemove pointing the ReactionAdd with a later timestamp
  const reactionRemoveData = await Factories.ReactionRemoveData.create({
    fid: Array.from(fid),
    body: reactionBody,
    timestamp: reactionAddData.timestamp() + 1,
  });

  const reactionRemoveMessage = await Factories.Message.create({
    data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
  });
  reactionRemove = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;

  // Constructs a ReactionAdd of type React
  const reactionRecastBody = Factories.ReactionBody.build({
    type: ReactionType.Recast,
    cast: Factories.CastID.build({
      fid: Array.from(castId.fidArray() || new Uint8Array()),
      hash: Array.from(castId.hashArray() || new Uint8Array()),
    }),
  });

  const reactionAddRecastData = await Factories.ReactionAddData.create({
    fid: Array.from(fid),
    body: reactionRecastBody,
  });

  const reactionAddRecastMessage = await Factories.Message.create({
    data: Array.from(reactionAddRecastData.bb?.bytes() ?? []),
  });
  reactionAddRecast = new MessageModel(reactionAddRecastMessage) as ReactionAddModel;

  // Constructs a ReactionRemove pointing at the React with a later timestamp
  const reactionRemoveRecastData = await Factories.ReactionRemoveData.create({
    fid: Array.from(fid),
    body: reactionRecastBody,
    timestamp: reactionAddRecastData.timestamp() + 1,
  });

  const reactionRemoveRecastMessage = await Factories.Message.create({
    data: Array.from(reactionRemoveRecastData.bb?.bytes() ?? []),
  });

  reactionRemoveRecast = new MessageModel(reactionRemoveRecastMessage) as ReactionRemoveModel;
});

describe('getReactionAdd', () => {
  test('fails if no ReactionAdd is present', async () => {
    await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).rejects.toThrow(NotFoundError);
  });

  test('fails if only ReactionRemove exists for the target', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).rejects.toThrow(NotFoundError);
  });

  test('fails if the wrong fid is provided', async () => {
    const unknownFid = Factories.FID.build();
    await set.merge(reactionAdd);
    await expect(set.getReactionAdd(unknownFid, reactionAdd.body().type(), castId)).rejects.toThrow(NotFoundError);
  });

  test('fails if the wrong reaction type is provided', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionAdd(fid, ReactionType.Recast, castId)).rejects.toThrow(NotFoundError);
  });

  test('fails if the wrong target is provided', async () => {
    await set.merge(reactionAdd);
    const unknownCastId = await Factories.CastID.create();
    await expect(set.getReactionAdd(fid, reactionAdd.body().type(), unknownCastId)).rejects.toThrow(NotFoundError);
  });

  test('returns message if it exists for the target', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).resolves.toEqual(reactionAdd);
  });
});

describe('getReactionRemove', () => {
  test('fails if no ReactionRemove is present', async () => {
    await expect(set.getReactionRemove(fid, reactionRemove.body().type(), castId)).rejects.toThrow(NotFoundError);
  });

  test('fails if only ReactionAdd exists for the target', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionRemove(fid, reactionAdd.body().type(), castId)).rejects.toThrow(NotFoundError);
  });

  test('fails if the wrong fid is provided', async () => {
    await set.merge(reactionRemove);
    const unknownFid = Factories.FID.build();
    await expect(set.getReactionRemove(unknownFid, reactionRemove.body().type(), castId)).rejects.toThrow(
      NotFoundError
    );
  });

  test('fails if the wrong reaction type is provided', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionRemove(fid, ReactionType.Recast, castId)).rejects.toThrow(NotFoundError);
  });

  test('fails if the wrong target is provided', async () => {
    await set.merge(reactionRemove);
    const unknownCastId = await Factories.CastID.create();
    await expect(set.getReactionRemove(fid, reactionRemove.body().type(), unknownCastId)).rejects.toThrow(
      NotFoundError
    );
  });

  test('returns message if it exists for the target', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionRemove(fid, reactionRemove.body().type(), castId)).resolves.toEqual(reactionRemove);
  });
});

describe('getReactionAddsByFid', () => {
  test('returns reactionAdds if they exist', async () => {
    await set.merge(reactionAdd);
    await set.merge(reactionAddRecast);
    await expect(set.getReactionAddsByFid(fid)).resolves.toEqual([reactionAdd, reactionAddRecast]);
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
    await set.merge(reactionRemove);
    await set.merge(reactionRemoveRecast);
    await expect(set.getReactionRemovesByFid(fid)).resolves.toEqual([reactionRemove, reactionRemoveRecast]);
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
    expect(byCast).toEqual([]);
  });

  test('returns reactions if they exist for a target', async () => {
    await set.merge(reactionAdd);
    await set.merge(reactionAddRecast);

    const byCast = await set.getReactionsByTarget(castId);
    expect(byCast).toEqual([reactionAdd, reactionAddRecast]);
  });

  test('returns empty array if reactions exist for a different target', async () => {
    await set.merge(reactionAdd);

    const unknownCastId = await Factories.CastID.create();
    const byCast = await set.getReactionsByTarget(unknownCastId);
    expect(byCast).toEqual([]);
  });

  describe('AndType', () => {
    test('returns empty array if no reactions exist', async () => {
      const byCast = await set.getReactionsByTarget(castId, ReactionType.Like);
      expect(byCast).toEqual([]);
    });

    test('returns empty array if reactions exist for the target with different type', async () => {
      await set.merge(reactionAddRecast);
      const byCast = await set.getReactionsByTarget(castId, ReactionType.Like);
      expect(byCast).toEqual([]);
    });

    test('returns empty array if reactions exist for the type with different target', async () => {
      await set.merge(reactionAdd);
      const unknownCastId = await Factories.CastID.create();
      const byCast = await set.getReactionsByTarget(unknownCastId, ReactionType.Like);
      expect(byCast).toEqual([]);
    });

    test('returns reactions if they exist for the target and type', async () => {
      await set.merge(reactionAdd);
      const byCast = await set.getReactionsByTarget(castId, ReactionType.Like);
      expect(byCast).toEqual([reactionAdd]);
    });
  });
});

describe('merge', () => {
  const assertReactionExists = async (message: ReactionAddModel | ReactionRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPrefix.ReactionMessage, message.timestampHash())).resolves.toEqual(
      message
    );
  };

  const assertReactionDoesNotExist = async (message: ReactionAddModel | ReactionRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPrefix.ReactionMessage, message.timestampHash())).rejects.toThrow(
      NotFoundError
    );
  };

  const assertReactionAddWins = async (message: ReactionAddModel) => {
    await assertReactionExists(message);
    await expect(set.getReactionAdd(fid, message.body().type(), castId)).resolves.toEqual(message);
    await expect(set.getReactionsByTarget(castId)).resolves.toEqual([message]);
    await expect(set.getReactionRemove(fid, message.body().type(), castId)).rejects.toThrow(NotFoundError);
  };

  const assertReactionRemoveWins = async (message: ReactionRemoveModel) => {
    await assertReactionExists(message);
    await expect(set.getReactionRemove(fid, message.body().type(), castId)).resolves.toEqual(message);
    await expect(set.getReactionsByTarget(castId)).resolves.toEqual([]);
    await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).rejects.toThrow(NotFoundError);
  };

  test('fails with invalid message type', async () => {
    const invalidData = await Factories.FollowAddData.create({ fid: Array.from(fid) });
    const message = await Factories.Message.create({ data: Array.from(invalidData.bb?.bytes() ?? []) });

    await expect(set.merge(new MessageModel(message))).rejects.toThrow(BadRequestError);
    // TODO: maybe check state and assert that nothing improved
  });

  describe('ReactionAdd', () => {
    test('succeeds', async () => {
      await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

      await assertReactionAddWins(reactionAdd);
    });

    test('succeeds once, even if  merged twice', async () => {
      await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);
      await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

      await assertReactionAddWins(reactionAdd);
    });

    describe('with a conflicting ReactionAdd with different timestamps', () => {
      let reactionAddLater: ReactionAddModel;

      beforeAll(async () => {
        const reactionAddData = await Factories.ReactionAddData.create({
          ...reactionAdd.data.unpack(),
          timestamp: reactionAdd.timestamp() + 1,
        });
        const reactionAddMessage = await Factories.Message.create({
          data: Array.from(reactionAddData.bb?.bytes() ?? []),
        });
        reactionAddLater = new MessageModel(reactionAddMessage) as ReactionAddModel;
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(reactionAdd);
        await expect(set.merge(reactionAddLater)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionAdd);
        await assertReactionAddWins(reactionAddLater);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(reactionAddLater);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionAdd);
        await assertReactionAddWins(reactionAddLater);
      });
    });

    describe('with a conflicting ReactionAdd with identical timestamps', () => {
      let reactionAddLater: ReactionAddModel;

      beforeAll(async () => {
        const reactionAddData = await Factories.ReactionAddData.create({
          ...reactionAdd.data.unpack(),
        });

        const laterHash = Array.from(reactionAdd.hash());
        laterHash[0] = 255;

        const reactionAddMessage = await Factories.Message.create({
          data: Array.from(reactionAddData.bb?.bytes() ?? []),
          hash: Array.from(laterHash),
        });

        reactionAddLater = new MessageModel(reactionAddMessage) as ReactionAddModel;
      });

      test('succeeds with a later hash', async () => {
        await set.merge(reactionAdd);
        await expect(set.merge(reactionAddLater)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionAdd);
        await assertReactionAddWins(reactionAddLater);
      });

      test('no-ops with an earlier hash', async () => {
        await set.merge(reactionAddLater);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionAdd);
        await assertReactionAddWins(reactionAddLater);
      });
    });

    describe('with conflicting ReactionRemove with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        const reactionRemoveData = await Factories.ReactionRemoveData.create({
          ...reactionRemove.data.unpack(),
          timestamp: reactionAdd.timestamp() - 1,
        });

        const reactionRemoveMessage = await Factories.Message.create({
          data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
        });

        const reactionRemoveEarlier = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;

        await set.merge(reactionRemoveEarlier);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

        await assertReactionAddWins(reactionAdd);
        await assertReactionDoesNotExist(reactionRemoveEarlier);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(reactionRemove);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

        await assertReactionRemoveWins(reactionRemove);
        await assertReactionDoesNotExist(reactionAdd);
      });
    });

    describe('with conflicting ReactionRemove with identical timestamps', () => {
      test('succeeds with a later hash', async () => {
        const reactionRemoveData = await Factories.ReactionRemoveData.create({
          ...reactionRemove.data.unpack(),
          timestamp: reactionAdd.timestamp(),
        });

        // Set the first byte of the hash to the max value to ensure it is later
        const laterHash = Array.from(reactionAdd.hash());
        laterHash[0] = 255;

        const reactionRemoveMessage = await Factories.Message.create({
          data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
          hash: Array.from(laterHash),
        });

        const reactionRemoveLater = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;

        await set.merge(reactionRemoveLater);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

        await assertReactionRemoveWins(reactionRemoveLater);
        await assertReactionDoesNotExist(reactionAdd);
      });

      test('no-ops with an earlier hash', async () => {
        const reactionRemoveData = await Factories.ReactionRemoveData.create({
          ...reactionRemove.data.unpack(),
          timestamp: reactionAdd.timestamp(),
        });

        // Set the first byte of the hash to the min value to ensure it is earlier
        const earlierHash = Array.from(reactionAdd.hash());
        earlierHash[0] = 0;

        const reactionRemoveMessage = await Factories.Message.create({
          data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
          hash: Array.from(earlierHash),
        });

        const reactionRemoveEarlier = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;

        await set.merge(reactionRemoveEarlier);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionRemoveEarlier);
        await assertReactionAddWins(reactionAdd);
      });
    });
  });

  describe('ReactionRemove', () => {
    test('succeeds', async () => {
      await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

      await assertReactionRemoveWins(reactionRemove);
    });

    test('succeeds once, even if merged twice', async () => {
      await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);
      await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

      await assertReactionRemoveWins(reactionRemove);
    });

    describe('with a conflicting ReactionRemove with different timestamps', () => {
      let reactionRemoveLater: ReactionRemoveModel;

      beforeAll(async () => {
        const reactionRemoveData = await Factories.ReactionRemoveData.create({
          ...reactionRemove.data.unpack(),
          timestamp: reactionRemove.timestamp() + 1,
        });
        const reactionRemoveMessage = await Factories.Message.create({
          data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
        });
        reactionRemoveLater = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(reactionRemove);
        await expect(set.merge(reactionRemoveLater)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionRemove);
        await assertReactionRemoveWins(reactionRemoveLater);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(reactionRemoveLater);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionRemove);
        await assertReactionRemoveWins(reactionRemoveLater);
      });
    });

    describe('with a conflicting ReactionRemove with identical timestamps', () => {
      let reactionRemoveLater: ReactionRemoveModel;

      beforeAll(async () => {
        const reactionRemoveData = await Factories.ReactionRemoveData.create({
          ...reactionRemove.data.unpack(),
        });

        const laterHash = Array.from(reactionRemove.hash());
        laterHash[0] = 255;

        const reactionAddMessage = await Factories.Message.create({
          data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
          hash: Array.from(laterHash),
        });

        reactionRemoveLater = new MessageModel(reactionAddMessage) as ReactionRemoveModel;
      });

      test('succeeds with a later hash', async () => {
        await set.merge(reactionRemove);
        await expect(set.merge(reactionRemoveLater)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionRemove);
        await assertReactionRemoveWins(reactionRemoveLater);
      });

      test('no-ops with an earlier hash', async () => {
        await set.merge(reactionRemoveLater);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionRemove);
        await assertReactionRemoveWins(reactionRemoveLater);
      });
    });

    describe('with conflicting ReactionAdd with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        await set.merge(reactionAdd);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);
        await assertReactionRemoveWins(reactionRemove);
        await assertReactionDoesNotExist(reactionAdd);
      });

      test('no-ops with an earlier timestamp', async () => {
        const reactionAddData = await Factories.ReactionAddData.create({
          ...reactionRemove.data.unpack(),
          timestamp: reactionRemove.timestamp() + 1,
          type: MessageType.ReactionAdd,
        });
        const reactionAddMessage = await Factories.Message.create({
          data: Array.from(reactionAddData.bb?.bytes() ?? []),
        });
        const reactionAddLater = new MessageModel(reactionAddMessage) as ReactionAddModel;
        await set.merge(reactionAddLater);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);
        await assertReactionAddWins(reactionAddLater);
        await assertReactionDoesNotExist(reactionRemove);
      });
    });

    describe('with conflicting ReactionAdd with identical timestamps', () => {
      test('no-ops with an earlier hash', async () => {
        const reactionAddData = await Factories.ReactionAddData.create({
          ...reactionRemove.data.unpack(),
          type: MessageType.ReactionAdd,
        });

        // Set the first byte of the hash to the max value to ensure it is later
        const laterHash = Array.from(reactionRemove.hash());
        laterHash[0] = 255;

        const reactionAddMessage = await Factories.Message.create({
          data: Array.from(reactionAddData.bb?.bytes() ?? []),
          hash: Array.from(laterHash),
        });
        const reactionAddLater = new MessageModel(reactionAddMessage) as ReactionAddModel;

        await set.merge(reactionAddLater);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionRemove);
        await assertReactionAddWins(reactionAddLater);
      });

      test('succeeds with a later hash', async () => {
        const reactionAddData = await Factories.ReactionAddData.create({
          ...reactionRemove.data.unpack(),
        });

        // Set the first byte of the hash to the min value to ensure it is earlier
        const earlierHash = Array.from(reactionRemove.hash());
        earlierHash[0] = 0;

        const reactionRemoveMessage = await Factories.Message.create({
          data: Array.from(reactionAddData.bb?.bytes() ?? []),
          hash: Array.from(earlierHash),
        });

        const reactionRemoveEarlier = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;

        await set.merge(reactionRemoveEarlier);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionRemoveEarlier);
        await assertReactionRemoveWins(reactionRemove);
      });
    });
  });
});
