import Factories from '~/test/factories/flatbuffer';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { BadRequestError, NotFoundError } from '~/utils/errors';
import { FollowAddModel, FollowRemoveModel, UserPostfix } from '~/storage/flatbuffers/types';
import FollowSet from '~/storage/sets/flatbuffers/followSet';

const db = jestBinaryRocksDB('flatbuffers.followSet.test');
const set = new FollowSet(db);
const fid = Factories.FID.build();

const userId = Factories.FID.build();
let followAdd: FollowAddModel;
let followRemove: FollowRemoveModel;

beforeAll(async () => {
  const followBody = Factories.FollowBody.build({ user: Factories.UserId.build({ fid: Array.from(userId) }) });

  const followAddData = await Factories.FollowAddData.create({ fid: Array.from(fid), body: followBody });
  const followAddMessage = await Factories.Message.create({ data: Array.from(followAddData.bb?.bytes() ?? []) });
  followAdd = new MessageModel(followAddMessage) as FollowAddModel;

  const followRemoveData = await Factories.FollowRemoveData.create({
    fid: Array.from(fid),
    body: followBody,
    timestamp: followAddData.timestamp() + 1,
  });
  const followRemoveMessage = await Factories.Message.create({ data: Array.from(followRemoveData.bb?.bytes() ?? []) });
  followRemove = new MessageModel(followRemoveMessage) as FollowRemoveModel;
});

describe('getFollowAdd', () => {
  test('fails if missing', async () => {
    await expect(set.getFollowAdd(fid, userId)).rejects.toThrow(NotFoundError);
  });

  test('returns message', async () => {
    await set.merge(followAdd);
    await expect(set.getFollowAdd(fid, userId)).resolves.toEqual(followAdd);
  });
});

describe('getFollowRemove', () => {
  test('fails if missing', async () => {
    await expect(set.getFollowRemove(fid, userId)).rejects.toThrow(NotFoundError);
  });

  test('returns message', async () => {
    await set.merge(followRemove);
    await expect(set.getFollowRemove(fid, userId)).resolves.toEqual(followRemove);
  });
});

describe('getFollowAddsByUser', () => {
  test('returns follow adds for an fid', async () => {
    await set.merge(followAdd);
    await expect(set.getFollowAddsByUser(fid)).resolves.toEqual([followAdd]);
  });

  test('returns empty array without messages', async () => {
    await expect(set.getFollowAddsByUser(fid)).resolves.toEqual([]);
  });
});

describe('getFollowRemovesByUser', () => {
  test('returns follow removes for an fid', async () => {
    await set.merge(followRemove);
    await expect(set.getFollowRemovesByUser(fid)).resolves.toEqual([followRemove]);
  });

  test('returns empty array without messages', async () => {
    await expect(set.getFollowRemovesByUser(fid)).resolves.toEqual([]);
  });
});

describe('getFollowsByUser', () => {
  test('returns follows for a user', async () => {
    const sameUserData = await Factories.FollowAddData.create({
      body: followAdd.body().unpack() || null,
    });
    const sameUserMessage = await Factories.Message.create({
      data: Array.from(sameUserData.bb?.bytes() ?? []),
    });
    const sameUser = new MessageModel(sameUserMessage) as FollowAddModel;

    await set.merge(followAdd);
    await set.merge(sameUser);

    const byUser = await set.getFollowsByUser(userId);
    expect(new Set(byUser)).toEqual(new Set([followAdd, sameUser]));
  });
});

describe('merge', () => {
  test('fails with invalid message type', async () => {
    const invalidData = await Factories.ReactionAddData.create({ fid: Array.from(fid) });
    const message = await Factories.Message.create({ data: Array.from(invalidData.bb?.bytes() ?? []) });
    await expect(set.merge(new MessageModel(message))).rejects.toThrow(BadRequestError);
  });

  describe('FollowRemove', () => {
    describe('succeeds', () => {
      beforeEach(async () => {
        await set.merge(followAdd);
        await expect(set.merge(followRemove)).resolves.toEqual(undefined);
      });

      test('saves message', async () => {
        await expect(MessageModel.get(db, fid, UserPostfix.FollowMessage, followRemove.tsHash())).resolves.toEqual(
          followRemove
        );
      });

      test('saves followRemoves index', async () => {
        await expect(set.getFollowRemove(fid, userId)).resolves.toEqual(followRemove);
      });

      test('deletes FollowAdd message', async () => {
        await expect(MessageModel.get(db, fid, UserPostfix.FollowMessage, followAdd.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });

      test('deletes followAdds index', async () => {
        await expect(set.getFollowAdd(fid, userId)).rejects.toThrow(NotFoundError);
      });

      test('deletes followsByUser index', async () => {
        await expect(set.getFollowsByUser(userId)).resolves.toEqual([]);
      });

      test('overwrites earlier FollowRemove', async () => {
        const followRemoveData = await Factories.FollowRemoveData.create({
          ...followRemove.data.unpack(),
          timestamp: followRemove.timestamp() + 1,
        });
        const followRemoveMessage = await Factories.Message.create({
          data: Array.from(followRemoveData.bb?.bytes() ?? []),
        });
        const followRemoveLater = new MessageModel(followRemoveMessage) as FollowRemoveModel;

        await expect(set.merge(followRemoveLater)).resolves.toEqual(undefined);
        await expect(set.getFollowRemove(fid, userId)).resolves.toEqual(followRemoveLater);
        await expect(MessageModel.get(db, fid, UserPostfix.FollowMessage, followRemove.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });

      test('no-ops when later FollowRemove exists', async () => {
        const followRemoveData = await Factories.FollowRemoveData.create({
          ...followRemove.data.unpack(),
          timestamp: followRemove.timestamp() - 1,
        });
        const followRemoveMessage = await Factories.Message.create({
          data: Array.from(followRemoveData.bb?.bytes() ?? []),
        });
        const followRemoveEarlier = new MessageModel(followRemoveMessage) as FollowRemoveModel;
        await expect(set.merge(followRemoveEarlier)).resolves.toEqual(undefined);
        await expect(set.getFollowRemove(fid, userId)).resolves.toEqual(followRemove);
      });

      test('no-ops when merged twice', async () => {
        await expect(set.merge(followRemove)).resolves.toEqual(undefined);
        await expect(set.getFollowRemove(fid, userId)).resolves.toEqual(followRemove);
      });
    });

    test('succeeds when FollowAdd does not exist', async () => {
      await expect(set.merge(followRemove)).resolves.toEqual(undefined);
      await expect(set.getFollowRemove(fid, userId)).resolves.toEqual(followRemove);
      await expect(set.getFollowAdd(fid, userId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('FollowAdd', () => {
    describe('succeeds', () => {
      beforeEach(async () => {
        await expect(set.merge(followAdd)).resolves.toEqual(undefined);
      });

      test('saves message', async () => {
        await expect(MessageModel.get(db, fid, UserPostfix.FollowMessage, followAdd.tsHash())).resolves.toEqual(
          followAdd
        );
      });

      test('saves followAdds index', async () => {
        await expect(set.getFollowAdd(fid, userId)).resolves.toEqual(followAdd);
      });

      test('saves followsByUser index', async () => {
        await expect(set.getFollowsByUser(userId)).resolves.toEqual([followAdd]);
      });

      test('no-ops when merged twice', async () => {
        await expect(set.merge(followAdd)).resolves.toEqual(undefined);
        await expect(set.getFollowAdd(fid, userId)).resolves.toEqual(followAdd);
      });
    });

    describe('with conflicting FollowAdd', () => {
      let followAddLater: FollowAddModel;

      beforeAll(async () => {
        const followAddData = await Factories.FollowAddData.create({
          ...followAdd.data.unpack(),
          timestamp: followAdd.timestamp() + 1,
        });
        const followAddMessage = await Factories.Message.create({
          data: Array.from(followAddData.bb?.bytes() ?? []),
        });
        followAddLater = new MessageModel(followAddMessage) as FollowAddModel;
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(followAdd);
        await expect(set.merge(followAddLater)).resolves.toEqual(undefined);
        await expect(set.getFollowAdd(fid, userId)).resolves.toEqual(followAddLater);
        await expect(MessageModel.get(db, fid, UserPostfix.FollowMessage, followAdd.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(followAddLater);
        await expect(set.merge(followAdd)).resolves.toEqual(undefined);
        await expect(set.getFollowAdd(fid, userId)).resolves.toEqual(followAddLater);
        await expect(MessageModel.get(db, fid, UserPostfix.FollowMessage, followAdd.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });
    });

    describe('with conflicting FollowRemove', () => {
      test('succeeds with a later timestamp', async () => {
        const followRemoveData = await Factories.FollowRemoveData.create({
          ...followRemove.data.unpack(),
          timestamp: followAdd.timestamp() - 1,
        });
        const followRemoveMessage = await Factories.Message.create({
          data: Array.from(followRemoveData.bb?.bytes() ?? []),
        });
        const followRemoveEarlier = new MessageModel(followRemoveMessage) as FollowRemoveModel;

        await set.merge(followRemoveEarlier);
        await expect(set.merge(followAdd)).resolves.toEqual(undefined);
        await expect(set.getFollowAdd(fid, userId)).resolves.toEqual(followAdd);
        await expect(set.getFollowRemove(fid, userId)).rejects.toThrow(NotFoundError);
        await expect(
          MessageModel.get(db, fid, UserPostfix.FollowMessage, followRemoveEarlier.tsHash())
        ).rejects.toThrow(NotFoundError);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(followRemove);
        await expect(set.merge(followAdd)).resolves.toEqual(undefined);
        await expect(set.getFollowRemove(fid, userId)).resolves.toEqual(followRemove);
        await expect(set.getFollowAdd(fid, userId)).rejects.toThrow(NotFoundError);
        await expect(MessageModel.get(db, fid, UserPostfix.FollowMessage, followAdd.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });
    });
  });
});
