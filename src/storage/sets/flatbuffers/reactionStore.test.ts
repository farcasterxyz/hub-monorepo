import Factories from '~/test/factories/flatbuffer';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { NotFoundError } from '~/utils/errors';
import { ReactionAddModel, ReactionRemoveModel, UserPostfix } from '~/storage/flatbuffers/types';
import ReactionStore from '~/storage/sets/flatbuffers/reactionStore';
import { MessageType, ReactionType } from '~/utils/generated/message_generated';
import { bytesDecrement, bytesIncrement } from '~/storage/flatbuffers/utils';
import { HubError } from '~/utils/hubErrors';

const db = jestBinaryRocksDB('flatbuffers.reactionStore.test');
const set = new ReactionStore(db);
const fid = Factories.FID.build();

const castId = await Factories.CastId.create();

let reactionAdd: ReactionAddModel;
let reactionRemove: ReactionRemoveModel;
let reactionAddRecast: ReactionAddModel;
let reactionRemoveRecast: ReactionRemoveModel;

beforeAll(async () => {
  // Constructs a ReactionAdd of type Like
  const reactionBody = Factories.ReactionBody.build({
    type: ReactionType.Like,
    cast: Factories.CastId.build({
      fid: Array.from(castId.fidArray() || new Uint8Array()),
      tsHash: Array.from(castId.tsHashArray() || new Uint8Array()),
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
    cast: Factories.CastId.build({
      fid: Array.from(castId.fidArray() || new Uint8Array()),
      tsHash: Array.from(castId.tsHashArray() || new Uint8Array()),
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
    const unknownCastId = await Factories.CastId.create();
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
    const unknownCastId = await Factories.CastId.create();
    await expect(set.getReactionRemove(fid, reactionRemove.body().type(), unknownCastId)).rejects.toThrow(
      NotFoundError
    );
  });

  test('returns message if it exists for the target', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionRemove(fid, reactionRemove.body().type(), castId)).resolves.toEqual(reactionRemove);
  });
});

describe('getReactionAddsByUser', () => {
  test('returns reactionAdds if they exist', async () => {
    await set.merge(reactionAdd);
    await set.merge(reactionAddRecast);
    await expect(set.getReactionAddsByUser(fid)).resolves.toEqual([reactionAdd, reactionAddRecast]);
  });

  test('returns empty array if no ReactionAdd exists', async () => {
    await expect(set.getReactionAddsByUser(fid)).resolves.toEqual([]);
  });

  test('returns empty array if no ReactionAdd exists, even if ReactionRemove exists', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionAddsByUser(fid)).resolves.toEqual([]);
  });
});

describe('getReactionRemovesByUser', () => {
  test('returns ReactionRemove if it exists', async () => {
    await set.merge(reactionRemove);
    await set.merge(reactionRemoveRecast);
    await expect(set.getReactionRemovesByUser(fid)).resolves.toEqual([reactionRemove, reactionRemoveRecast]);
  });

  test('returns empty array if no ReactionRemove exists', async () => {
    await expect(set.getReactionRemovesByUser(fid)).resolves.toEqual([]);
  });

  test('returns empty array if no ReactionRemove exists, even if ReactionAdds exists', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionRemovesByUser(fid)).resolves.toEqual([]);
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

    const unknownCastId = await Factories.CastId.create();
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
      const unknownCastId = await Factories.CastId.create();
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
    await expect(MessageModel.get(db, fid, UserPostfix.ReactionMessage, message.tsHash())).resolves.toEqual(message);
  };

  const assertReactionDoesNotExist = async (message: ReactionAddModel | ReactionRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.ReactionMessage, message.tsHash())).rejects.toThrow(
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

    await expect(set.merge(new MessageModel(message))).rejects.toThrow(HubError);
  });

  describe('ReactionAdd', () => {
    test('succeeds', async () => {
      await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

      await assertReactionAddWins(reactionAdd);
    });

    test('succeeds once, even if merged twice', async () => {
      await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);
      await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

      await assertReactionAddWins(reactionAdd);
    });

    describe('with a conflicting ReactionAdd with different timestamps', () => {
      let reactionAddLater: ReactionAddModel;

      beforeAll(async () => {
        const addData = await Factories.ReactionAddData.create({
          ...reactionAdd.data.unpack(),
          timestamp: reactionAdd.timestamp() + 1,
        });
        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
        });
        reactionAddLater = new MessageModel(addMessage) as ReactionAddModel;
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
        const addData = await Factories.ReactionAddData.create({
          ...reactionAdd.data.unpack(),
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(reactionAdd.hash().slice())),
        });

        reactionAddLater = new MessageModel(addMessage) as ReactionAddModel;
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
      test('no-ops if remove has a later hash', async () => {
        const reactionRemoveData = await Factories.ReactionRemoveData.create({
          ...reactionRemove.data.unpack(),
          timestamp: reactionAdd.timestamp(),
        });

        const reactionRemoveMessage = await Factories.Message.create({
          data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(reactionAdd.hash().slice())),
        });

        const reactionRemoveLater = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;

        await set.merge(reactionRemoveLater);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

        await assertReactionRemoveWins(reactionRemoveLater);
        await assertReactionDoesNotExist(reactionAdd);
      });

      test('succeeds if remove has an earlier hash', async () => {
        const reactionRemoveData = await Factories.ReactionRemoveData.create({
          ...reactionRemove.data.unpack(),
          timestamp: reactionAdd.timestamp(),
        });

        const reactionRemoveMessage = await Factories.Message.create({
          data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
          hash: Array.from(bytesDecrement(reactionAdd.hash().slice())),
        });

        const reactionRemoveEarlier = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;

        await set.merge(reactionRemoveEarlier);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionAdd);
        await assertReactionRemoveWins(reactionRemoveEarlier);
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

        const addMessage = await Factories.Message.create({
          data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(reactionRemove.hash().slice())),
        });

        reactionRemoveLater = new MessageModel(addMessage) as ReactionRemoveModel;
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
        const addData = await Factories.ReactionAddData.create({
          ...reactionRemove.data.unpack(),
          timestamp: reactionRemove.timestamp() + 1,
          type: MessageType.ReactionAdd,
        });
        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
        });
        const reactionAddLater = new MessageModel(addMessage) as ReactionAddModel;
        await set.merge(reactionAddLater);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);
        await assertReactionAddWins(reactionAddLater);
        await assertReactionDoesNotExist(reactionRemove);
      });
    });

    describe('with conflicting ReactionAdd with identical timestamps', () => {
      test('succeeds with an earlier hash', async () => {
        const addData = await Factories.ReactionAddData.create({
          ...reactionRemove.data.unpack(),
          type: MessageType.ReactionAdd,
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(reactionRemove.hash().slice())),
        });
        const reactionAddLater = new MessageModel(addMessage) as ReactionAddModel;

        await set.merge(reactionAddLater);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionAddLater);
        await assertReactionRemoveWins(reactionRemove);
      });

      test('succeeds with a later hash', async () => {
        const removeData = await Factories.ReactionAddData.create({
          ...reactionRemove.data.unpack(),
        });

        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
          hash: Array.from(bytesDecrement(reactionRemove.hash().slice())),
        });

        const reactionRemoveEarlier = new MessageModel(removeMessage) as ReactionRemoveModel;

        await set.merge(reactionRemoveEarlier);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionRemoveEarlier);
        await assertReactionRemoveWins(reactionRemove);
      });
    });
  });
});
