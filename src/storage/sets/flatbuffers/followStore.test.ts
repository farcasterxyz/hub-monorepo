import Factories from '~/test/factories/flatbuffer';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { NotFoundError } from '~/utils/errors';
import { FollowAddModel, FollowRemoveModel, UserPostfix } from '~/storage/flatbuffers/types';
import FollowStore from '~/storage/sets/flatbuffers/followStore';
import { HubError } from '~/utils/hubErrors';
import { bytesDecrement, bytesIncrement } from '~/storage/flatbuffers/utils';
import { MessageType } from '~/utils/generated/message_generated';

const db = jestBinaryRocksDB('flatbuffers.followStore.test');
const store = new FollowStore(db);
const fid = Factories.FID.build();

const userId = Factories.FID.build();
let followAdd: FollowAddModel;
let followRemove: FollowRemoveModel;

beforeAll(async () => {
  const followBody = Factories.FollowBody.build({ user: Factories.UserId.build({ fid: Array.from(userId) }) });

  const addData = await Factories.FollowAddData.create({ fid: Array.from(fid), body: followBody });
  const addMessage = await Factories.Message.create({ data: Array.from(addData.bb?.bytes() ?? []) });
  followAdd = new MessageModel(addMessage) as FollowAddModel;

  const removeData = await Factories.FollowRemoveData.create({
    fid: Array.from(fid),
    body: followBody,
    timestamp: addData.timestamp() + 1,
  });
  const removeMessage = await Factories.Message.create({ data: Array.from(removeData.bb?.bytes() ?? []) });
  followRemove = new MessageModel(removeMessage) as FollowRemoveModel;
});

describe('getFollowAdd', () => {
  test('fails if missing', async () => {
    await expect(store.getFollowAdd(fid, userId)).rejects.toThrow(NotFoundError);
  });

  test('fails if incorrect values are passed in', async () => {
    await store.merge(followAdd);

    const invalidFid = Factories.FID.build();
    await expect(store.getFollowAdd(invalidFid, userId)).rejects.toThrow(NotFoundError);

    const invalidUserId = Factories.FID.build();
    await expect(store.getFollowAdd(fid, invalidUserId)).rejects.toThrow(NotFoundError);
  });

  test('returns message', async () => {
    await store.merge(followAdd);
    await expect(store.getFollowAdd(fid, userId)).resolves.toEqual(followAdd);
  });
});

describe('getFollowRemove', () => {
  test('fails if missing', async () => {
    await expect(store.getFollowRemove(fid, userId)).rejects.toThrow(NotFoundError);
  });

  test('fails if incorrect values are passed in', async () => {
    await store.merge(followAdd);

    const invalidFid = Factories.FID.build();
    await expect(store.getFollowRemove(invalidFid, userId)).rejects.toThrow(NotFoundError);

    const invalidUserId = Factories.FID.build();
    await expect(store.getFollowRemove(fid, invalidUserId)).rejects.toThrow(NotFoundError);
  });

  test('returns message', async () => {
    await store.merge(followRemove);
    await expect(store.getFollowRemove(fid, userId)).resolves.toEqual(followRemove);
  });
});

describe('getFollowAddsByUser', () => {
  test('returns follow adds for an fid', async () => {
    await store.merge(followAdd);
    await expect(store.getFollowAddsByUser(fid)).resolves.toEqual([followAdd]);
  });

  test('returns empty array for wrong fid', async () => {
    await store.merge(followAdd);
    const invalidFid = Factories.FID.build();
    await expect(store.getFollowAddsByUser(invalidFid)).resolves.toEqual([]);
  });

  test('returns empty array without messages', async () => {
    await expect(store.getFollowAddsByUser(fid)).resolves.toEqual([]);
  });
});

describe('getFollowRemovesByUser', () => {
  test('returns follow removes for an fid', async () => {
    await store.merge(followRemove);
    await expect(store.getFollowRemovesByUser(fid)).resolves.toEqual([followRemove]);
  });

  test('returns empty array for wrong fid', async () => {
    await store.merge(followAdd);
    const invalidFid = Factories.FID.build();
    await expect(store.getFollowRemovesByUser(invalidFid)).resolves.toEqual([]);
  });

  test('returns empty array without messages', async () => {
    await expect(store.getFollowRemovesByUser(fid)).resolves.toEqual([]);
  });
});

describe('getFollowsByTargetUser', () => {
  test('returns empty array if no follows exist', async () => {
    const byTargetUser = await store.getFollowsByTargetUser(fid);
    expect(byTargetUser).toEqual([]);
  });

  test('returns empty array if follows exist, but for a different user', async () => {
    await store.merge(followAdd);
    const invalidFid = Factories.FID.build();
    const byTargetUser = await store.getFollowsByTargetUser(invalidFid);
    expect(byTargetUser).toEqual([]);
  });

  test('returns follows if they exist for the target user', async () => {
    const addData = await Factories.FollowAddData.create({
      body: followAdd.body().unpack() || null,
    });
    const addMessage = await Factories.Message.create({
      data: Array.from(addData.bb?.bytes() ?? []),
    });
    const followAdd2 = new MessageModel(addMessage) as FollowAddModel;

    await store.merge(followAdd);
    await store.merge(followAdd2);

    const byUser = await store.getFollowsByTargetUser(userId);
    expect(new Set(byUser)).toEqual(new Set([followAdd, followAdd2]));
  });
});

describe('merge', () => {
  const assertFollowExists = async (message: FollowAddModel | FollowRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.FollowMessage, message.tsHash())).resolves.toEqual(message);
  };

  const assertFollowDoesNotExist = async (message: FollowAddModel | FollowRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.FollowMessage, message.tsHash())).rejects.toThrow(NotFoundError);
  };

  const assertFollowAddWins = async (message: FollowAddModel) => {
    await assertFollowExists(message);
    await expect(store.getFollowAdd(fid, userId)).resolves.toEqual(message);
    await expect(store.getFollowsByTargetUser(userId)).resolves.toEqual([message]);
    await expect(store.getFollowRemove(fid, userId)).rejects.toThrow(NotFoundError);
  };

  const assertFollowRemoveWins = async (message: FollowRemoveModel) => {
    await assertFollowExists(message);
    await expect(store.getFollowRemove(fid, userId)).resolves.toEqual(message);
    await expect(store.getFollowsByTargetUser(userId)).resolves.toEqual([]);
    await expect(store.getFollowAdd(fid, userId)).rejects.toThrow(NotFoundError);
  };

  test('fails with invalid message type', async () => {
    const invalidData = await Factories.ReactionAddData.create({ fid: Array.from(fid) });
    const message = await Factories.Message.create({ data: Array.from(invalidData.bb?.bytes() ?? []) });
    await expect(store.merge(new MessageModel(message))).rejects.toThrow(HubError);
  });

  describe('FollowAdd', () => {
    test('succeeds', async () => {
      await expect(store.merge(followAdd)).resolves.toEqual(undefined);
      await assertFollowAddWins(followAdd);
    });

    test('succeeds once, even if merged twice', async () => {
      await expect(store.merge(followAdd)).resolves.toEqual(undefined);
      await expect(store.merge(followAdd)).resolves.toEqual(undefined);

      await assertFollowAddWins(followAdd);
    });

    describe('with a conflicting FollowAdd with different timestamps', () => {
      let followAddLater: FollowAddModel;

      beforeAll(async () => {
        const addData = await Factories.FollowAddData.create({
          ...followAdd.data.unpack(),
          timestamp: followAdd.timestamp() + 1,
        });
        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
        });
        followAddLater = new MessageModel(addMessage) as FollowAddModel;
      });

      test('succeeds with a later timestamp', async () => {
        await store.merge(followAdd);
        await expect(store.merge(followAddLater)).resolves.toEqual(undefined);

        await assertFollowDoesNotExist(followAdd);
        await assertFollowAddWins(followAddLater);
      });

      test('no-ops with an earlier timestamp', async () => {
        await store.merge(followAddLater);
        await expect(store.merge(followAdd)).resolves.toEqual(undefined);

        await assertFollowDoesNotExist(followAdd);
        await assertFollowAddWins(followAddLater);
      });
    });

    describe('with a conflicting FollowAdd with identical timestamps', () => {
      let followAddLater: FollowAddModel;

      beforeAll(async () => {
        const addData = await Factories.FollowAddData.create({
          ...followAdd.data.unpack(),
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(followAdd.hash().slice())),
        });

        followAddLater = new MessageModel(addMessage) as FollowAddModel;
      });

      test('succeeds with a later hash', async () => {
        await store.merge(followAdd);
        await expect(store.merge(followAddLater)).resolves.toEqual(undefined);

        await assertFollowDoesNotExist(followAdd);
        await assertFollowAddWins(followAddLater);
      });

      test('no-ops with an earlier hash', async () => {
        await store.merge(followAddLater);
        await expect(store.merge(followAdd)).resolves.toEqual(undefined);

        await assertFollowDoesNotExist(followAdd);
        await assertFollowAddWins(followAddLater);
      });
    });

    describe('with conflicting FollowRemove with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        const removeData = await Factories.FollowRemoveData.create({
          ...followRemove.data.unpack(),
          timestamp: followAdd.timestamp() - 1,
        });

        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
        });

        const followRemoveEarlier = new MessageModel(removeMessage) as FollowRemoveModel;

        await store.merge(followRemoveEarlier);
        await expect(store.merge(followAdd)).resolves.toEqual(undefined);

        await assertFollowAddWins(followAdd);
        await assertFollowDoesNotExist(followRemoveEarlier);
      });

      test('no-ops with an earlier timestamp', async () => {
        await store.merge(followRemove);
        await expect(store.merge(followAdd)).resolves.toEqual(undefined);

        await assertFollowRemoveWins(followRemove);
        await assertFollowDoesNotExist(followAdd);
      });
    });

    describe('with conflicting FollowRemove with identical timestamps', () => {
      test('no-ops if remove has a later hash', async () => {
        const removeData = await Factories.FollowRemoveData.create({
          ...followRemove.data.unpack(),
          timestamp: followAdd.timestamp(),
        });

        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(followAdd.hash().slice())),
        });

        const followRemoveLater = new MessageModel(removeMessage) as FollowRemoveModel;

        await store.merge(followRemoveLater);
        await expect(store.merge(followAdd)).resolves.toEqual(undefined);

        await assertFollowRemoveWins(followRemoveLater);
        await assertFollowDoesNotExist(followAdd);
      });

      test('succeeds if remove has an earlier hash', async () => {
        const removeData = await Factories.FollowRemoveData.create({
          ...followRemove.data.unpack(),
          timestamp: followAdd.timestamp(),
        });

        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),

          // TODO: this slice doesn't seem necessary, and its also in reactions
          // TODO: rename set to store in reactions, signer and other places
          hash: Array.from(bytesDecrement(followAdd.hash().slice())),
        });

        const followRemoveEarlier = new MessageModel(removeMessage) as FollowRemoveModel;

        await store.merge(followRemoveEarlier);
        await expect(store.merge(followAdd)).resolves.toEqual(undefined);

        await assertFollowDoesNotExist(followAdd);
        await assertFollowRemoveWins(followRemoveEarlier);
      });
    });
  });

  describe('FollowRemove', () => {
    test('succeeds', async () => {
      await expect(store.merge(followRemove)).resolves.toEqual(undefined);

      await assertFollowRemoveWins(followRemove);
    });

    test('succeeds once, even if merged twice', async () => {
      await expect(store.merge(followRemove)).resolves.toEqual(undefined);
      await expect(store.merge(followRemove)).resolves.toEqual(undefined);

      await assertFollowRemoveWins(followRemove);
    });

    describe('with a conflicting FollowRemove with different timestamps', () => {
      let followRemoveLater: FollowRemoveModel;

      beforeAll(async () => {
        const followRemoveData = await Factories.FollowRemoveData.create({
          ...followRemove.data.unpack(),
          timestamp: followRemove.timestamp() + 1,
        });
        const followRemoveMessage = await Factories.Message.create({
          data: Array.from(followRemoveData.bb?.bytes() ?? []),
        });
        followRemoveLater = new MessageModel(followRemoveMessage) as FollowRemoveModel;
      });

      test('succeeds with a later timestamp', async () => {
        await store.merge(followRemove);
        await expect(store.merge(followRemoveLater)).resolves.toEqual(undefined);

        await assertFollowDoesNotExist(followRemove);
        await assertFollowRemoveWins(followRemoveLater);
      });

      test('no-ops with an earlier timestamp', async () => {
        await store.merge(followRemoveLater);
        await expect(store.merge(followRemove)).resolves.toEqual(undefined);

        await assertFollowDoesNotExist(followRemove);
        await assertFollowRemoveWins(followRemoveLater);
      });
    });

    describe('with a conflicting FollowRemove with identical timestamps', () => {
      let followRemoveLater: FollowRemoveModel;

      beforeAll(async () => {
        const followRemoveData = await Factories.FollowRemoveData.create({
          ...followRemove.data.unpack(),
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(followRemoveData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(followRemove.hash().slice())),
        });

        followRemoveLater = new MessageModel(addMessage) as FollowRemoveModel;
      });

      test('succeeds with a later hash', async () => {
        await store.merge(followRemove);
        await expect(store.merge(followRemoveLater)).resolves.toEqual(undefined);

        await assertFollowDoesNotExist(followRemove);
        await assertFollowRemoveWins(followRemoveLater);
      });

      test('no-ops with an earlier hash', async () => {
        await store.merge(followRemoveLater);
        await expect(store.merge(followRemove)).resolves.toEqual(undefined);

        await assertFollowDoesNotExist(followRemove);
        await assertFollowRemoveWins(followRemoveLater);
      });
    });

    describe('with conflicting FollowAdd with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        await store.merge(followAdd);
        await expect(store.merge(followRemove)).resolves.toEqual(undefined);
        await assertFollowRemoveWins(followRemove);
        await assertFollowDoesNotExist(followAdd);
      });

      test('no-ops with an earlier timestamp', async () => {
        const addData = await Factories.FollowAddData.create({
          ...followRemove.data.unpack(),
          timestamp: followRemove.timestamp() + 1,
          type: MessageType.FollowAdd,
        });
        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
        });
        const followAddLater = new MessageModel(addMessage) as FollowAddModel;
        await store.merge(followAddLater);
        await expect(store.merge(followRemove)).resolves.toEqual(undefined);
        await assertFollowAddWins(followAddLater);
        await assertFollowDoesNotExist(followRemove);
      });
    });

    describe('with conflicting FollowAdd with identical timestamps', () => {
      test('succeeds with an earlier hash', async () => {
        const addData = await Factories.FollowAddData.create({
          ...followRemove.data.unpack(),
          type: MessageType.FollowAdd,
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(followRemove.hash().slice())),
        });
        const followAddLater = new MessageModel(addMessage) as FollowAddModel;

        await store.merge(followAddLater);
        await expect(store.merge(followRemove)).resolves.toEqual(undefined);

        await assertFollowDoesNotExist(followAddLater);
        await assertFollowRemoveWins(followRemove);
      });

      test('succeeds with a later hash', async () => {
        const removeData = await Factories.FollowAddData.create({
          ...followRemove.data.unpack(),
        });

        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
          hash: Array.from(bytesDecrement(followRemove.hash().slice())),
        });

        const followRemoveEarlier = new MessageModel(removeMessage) as FollowRemoveModel;

        await store.merge(followRemoveEarlier);
        await expect(store.merge(followRemove)).resolves.toEqual(undefined);

        await assertFollowDoesNotExist(followRemoveEarlier);
        await assertFollowRemoveWins(followRemove);
      });
    });
  });
});
