import {
  Factories,
  HubError,
  bytesDecrement,
  bytesIncrement,
  getFarcasterTime,
  ReactionAddMessage,
  CastId,
  MergeMessageHubEvent,
  Message,
  MessageType,
  PruneMessageHubEvent,
  ReactionBody,
  ReactionRemoveMessage,
  ReactionType,
  RevokeMessageHubEvent,
} from '@farcaster/hub-nodejs';
import { err, ok } from 'neverthrow';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { getMessage, makeTsHash } from '~/storage/db/message';
import { UserPostfix } from '~/storage/db/types';
import ReactionStore from '~/storage/stores/reactionStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import { StorageCache } from '~/storage/engine/storageCache';

const db = jestRocksDB('protobufs.reactionStore.test');
const cache = new StorageCache();
const eventHandler = new StoreEventHandler(db, cache);
const set = new ReactionStore(db, eventHandler);
const fid = Factories.Fid.build();
const castId = Factories.CastId.build();

let reactionAdd: ReactionAddMessage;
let reactionRemove: ReactionRemoveMessage;
let reactionAddRecast: ReactionAddMessage;
let reactionRemoveRecast: ReactionRemoveMessage;

beforeAll(async () => {
  const likeBody = Factories.ReactionBody.build({
    type: ReactionType.LIKE,
    targetCastId: castId,
  });

  reactionAdd = await Factories.ReactionAddMessage.create({
    data: { fid, reactionBody: likeBody },
  });

  reactionRemove = await Factories.ReactionRemoveMessage.create({
    data: { fid, reactionBody: likeBody, timestamp: reactionAdd.data.timestamp + 1 },
  });

  const recastBody = Factories.ReactionBody.build({
    type: ReactionType.RECAST,
    targetCastId: castId,
  });

  reactionAddRecast = await Factories.ReactionAddMessage.create({
    data: { fid, reactionBody: recastBody, timestamp: reactionAdd.data.timestamp + 1 },
  });

  reactionRemoveRecast = await Factories.ReactionRemoveMessage.create({
    data: { fid, reactionBody: recastBody, timestamp: reactionAddRecast.data.timestamp + 1 },
  });
});

describe('getReactionAdd', () => {
  test('fails if no ReactionAdd is present', async () => {
    await expect(set.getReactionAdd(fid, reactionAdd.data.reactionBody.type, castId)).rejects.toThrow(HubError);
  });

  test('fails if only ReactionRemove exists for the target', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionAdd(fid, reactionAdd.data.reactionBody.type, castId)).rejects.toThrow(HubError);
  });

  test('fails if the wrong fid is provided', async () => {
    const unknownFid = Factories.Fid.build();
    await set.merge(reactionAdd);
    await expect(set.getReactionAdd(unknownFid, reactionAdd.data.reactionBody.type, castId)).rejects.toThrow(HubError);
  });

  test('fails if the wrong reaction type is provided', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionAdd(fid, ReactionType.RECAST, castId)).rejects.toThrow(HubError);
  });

  test('fails if the wrong target is provided', async () => {
    await set.merge(reactionAdd);
    const unknownCastId = Factories.CastId.build();
    await expect(set.getReactionAdd(fid, reactionAdd.data.reactionBody.type, unknownCastId)).rejects.toThrow(HubError);
  });

  test('returns message if it exists for the target', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionAdd(fid, reactionAdd.data.reactionBody.type, castId)).resolves.toEqual(reactionAdd);
  });
});

describe('getReactionRemove', () => {
  test('fails if no ReactionRemove is present', async () => {
    await expect(set.getReactionRemove(fid, reactionRemove.data.reactionBody.type, castId)).rejects.toThrow(HubError);
  });

  test('fails if only ReactionAdd exists for the target', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionRemove(fid, reactionAdd.data.reactionBody.type, castId)).rejects.toThrow(HubError);
  });

  test('fails if the wrong fid is provided', async () => {
    await set.merge(reactionRemove);
    const unknownFid = Factories.Fid.build();
    await expect(set.getReactionRemove(unknownFid, reactionRemove.data.reactionBody.type, castId)).rejects.toThrow(
      HubError
    );
  });

  test('fails if the wrong reaction type is provided', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionRemove(fid, ReactionType.RECAST, castId)).rejects.toThrow(HubError);
  });

  test('fails if the wrong target is provided', async () => {
    await set.merge(reactionRemove);
    const unknownCastId = Factories.CastId.build();
    await expect(set.getReactionRemove(fid, reactionRemove.data.reactionBody.type, unknownCastId)).rejects.toThrow(
      HubError
    );
  });

  test('returns message if it exists for the target', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionRemove(fid, reactionRemove.data.reactionBody.type, castId)).resolves.toEqual(
      reactionRemove
    );
  });
});

describe('getReactionAddsByFid', () => {
  test('returns ReactionAdd messages in chronological order according to pageOptions', async () => {
    const reactionAdd2 = await Factories.ReactionAddMessage.create({
      data: { fid, timestamp: reactionAdd.data.timestamp + 2 },
    });
    await set.merge(reactionAdd2);
    await set.merge(reactionAdd);
    await set.merge(reactionAddRecast);
    await expect(set.getReactionAddsByFid(fid)).resolves.toEqual({
      messages: [reactionAdd, reactionAddRecast, reactionAdd2],
      nextPageToken: undefined,
    });

    const results1 = await set.getReactionAddsByFid(fid, undefined, { pageSize: 1 });
    expect(results1.messages).toEqual([reactionAdd]);

    const results2 = await set.getReactionAddsByFid(fid, undefined, { pageToken: results1.nextPageToken });
    expect(results2).toEqual({ messages: [reactionAddRecast, reactionAdd2], nextPageToken: undefined });
  });

  test('returns ReactionAdd messages by type', async () => {
    await set.merge(reactionAdd);
    await set.merge(reactionAddRecast);
    await expect(set.getReactionAddsByFid(fid, ReactionType.LIKE)).resolves.toEqual({
      messages: [reactionAdd],
      nextPageToken: undefined,
    });
    await expect(set.getReactionAddsByFid(fid, ReactionType.RECAST)).resolves.toEqual({
      messages: [reactionAddRecast],
      nextPageToken: undefined,
    });
  });

  test('returns empty array if no ReactionAdd exists', async () => {
    await expect(set.getReactionAddsByFid(fid)).resolves.toEqual({ messages: [], nextPageToken: undefined });
  });

  test('returns empty array if no ReactionAdd exists, even if ReactionRemove exists', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionAddsByFid(fid)).resolves.toEqual({ messages: [], nextPageToken: undefined });
  });
});

describe('getReactionRemovesByFid', () => {
  test('returns ReactionRemove if it exists', async () => {
    await set.merge(reactionRemove);
    await set.merge(reactionRemoveRecast);
    await expect(set.getReactionRemovesByFid(fid)).resolves.toEqual({
      messages: [reactionRemove, reactionRemoveRecast],
      nextPageToken: undefined,
    });
  });

  test('returns empty array if no ReactionRemove exists', async () => {
    await expect(set.getReactionRemovesByFid(fid)).resolves.toEqual({ messages: [], nextPageToken: undefined });
  });

  test('returns empty array if no ReactionRemove exists, even if ReactionAdds exists', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionRemovesByFid(fid)).resolves.toEqual({ messages: [], nextPageToken: undefined });
  });
});

describe('getAllReactionMessagesByFid', () => {
  test('returns ReactionRemove if it exists', async () => {
    await set.merge(reactionAdd);
    await set.merge(reactionRemoveRecast);
    await expect(set.getAllReactionMessagesByFid(fid)).resolves.toEqual({
      messages: [reactionAdd, reactionRemoveRecast],
      nextPageToken: undefined,
    });
  });

  test('returns empty array if no messages exist', async () => {
    await expect(set.getAllReactionMessagesByFid(fid)).resolves.toEqual({ messages: [], nextPageToken: undefined });
  });
});

describe('getReactionsByTargetCast', () => {
  test('returns empty array if no reactions exist', async () => {
    const byCast = await set.getReactionsByTargetCast(castId);
    expect(byCast).toEqual({ messages: [], nextPageToken: undefined });
  });

  test('returns reactions if they exist for a target in chronological order and according to pageOptions', async () => {
    const reactionSameTarget = await Factories.ReactionAddMessage.create({
      data: { timestamp: reactionAddRecast.data.timestamp + 1, reactionBody: { targetCastId: castId } },
    });
    await set.merge(reactionAdd);
    await set.merge(reactionAddRecast);
    await set.merge(reactionSameTarget);

    const byCast = await set.getReactionsByTargetCast(castId);
    expect(byCast).toEqual({
      messages: [reactionAdd, reactionAddRecast, reactionSameTarget],
      nextPageToken: undefined,
    });

    const results1 = await set.getReactionsByTargetCast(castId, undefined, { pageSize: 1 });
    expect(results1.messages).toEqual([reactionAdd]);

    const results2 = await set.getReactionsByTargetCast(castId, undefined, { pageToken: results1.nextPageToken });
    expect(results2).toEqual({ messages: [reactionAddRecast, reactionSameTarget], nextPageToken: undefined });

    const results3 = await set.getReactionsByTargetCast(castId, undefined, { reverse: true });
    expect(results3).toEqual({
      messages: [reactionSameTarget, reactionAddRecast, reactionAdd],
      nextPageToken: undefined,
    });
  });

  test('returns empty array if reactions exist for a different target', async () => {
    await set.merge(reactionAdd);

    const unknownCastId = Factories.CastId.build();
    const byCast = await set.getReactionsByTargetCast(unknownCastId);
    expect(byCast).toEqual({ messages: [], nextPageToken: undefined });
  });

  describe('with type', () => {
    test('returns empty array if no reactions exist', async () => {
      const byCast = await set.getReactionsByTargetCast(castId, ReactionType.LIKE);
      expect(byCast).toEqual({ messages: [], nextPageToken: undefined });
    });

    test('returns empty array if reactions exist for the target with different type', async () => {
      await set.merge(reactionAddRecast);
      const byCast = await set.getReactionsByTargetCast(castId, ReactionType.LIKE);
      expect(byCast).toEqual({ messages: [], nextPageToken: undefined });
    });

    test('returns empty array if reactions exist for the type with different target', async () => {
      await set.merge(reactionAdd);
      const unknownCastId = Factories.CastId.build();
      const byCast = await set.getReactionsByTargetCast(unknownCastId, ReactionType.LIKE);
      expect(byCast).toEqual({ messages: [], nextPageToken: undefined });
    });

    test('returns reactions if they exist for the target and type', async () => {
      const reactionLike2 = await Factories.ReactionAddMessage.create({
        data: {
          timestamp: reactionAddRecast.data.timestamp + 1,
          reactionBody: { type: ReactionType.LIKE, targetCastId: castId },
        },
      });
      await set.merge(reactionLike2);
      await set.merge(reactionAdd);
      await set.merge(reactionAddRecast);
      const results1 = await set.getReactionsByTargetCast(castId, ReactionType.LIKE);
      expect(results1).toEqual({ messages: [reactionAdd, reactionLike2], nextPageToken: undefined });

      const results2 = await set.getReactionsByTargetCast(castId, ReactionType.LIKE, {
        reverse: true,
        pageSize: 1,
      });
      expect(results2.messages).toEqual([reactionLike2]);

      const results3 = await set.getReactionsByTargetCast(castId, ReactionType.LIKE, {
        reverse: true,
        pageToken: results2.nextPageToken,
      });
      expect(results3).toEqual({ messages: [reactionAdd], nextPageToken: undefined });

      const results4 = await set.getReactionsByTargetCast(castId, ReactionType.RECAST);
      expect(results4).toEqual({ messages: [reactionAddRecast], nextPageToken: undefined });
    });
  });
});

describe('merge', () => {
  let mergeEvents: [Message | undefined, Message[]][] = [];

  const mergeMessageHandler = (event: MergeMessageHubEvent) => {
    const { message, deletedMessages } = event.mergeMessageBody;
    mergeEvents.push([message, deletedMessages ?? []]);
  };

  beforeAll(() => {
    eventHandler.on('mergeMessage', mergeMessageHandler);
  });

  beforeEach(() => {
    mergeEvents = [];
  });

  afterAll(() => {
    eventHandler.off('mergeMessage', mergeMessageHandler);
  });

  const assertReactionExists = async (message: ReactionAddMessage | ReactionRemoveMessage) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.ReactionMessage, tsHash)).resolves.toEqual(message);
  };

  const assertReactionDoesNotExist = async (message: ReactionAddMessage | ReactionRemoveMessage) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.ReactionMessage, tsHash)).rejects.toThrow(HubError);
  };

  const assertReactionAddWins = async (message: ReactionAddMessage) => {
    await assertReactionExists(message);
    await expect(
      set.getReactionAdd(fid, message.data.reactionBody.type, message.data.reactionBody.targetCastId as CastId)
    ).resolves.toEqual(message);
    await expect(set.getReactionsByTargetCast(message.data.reactionBody.targetCastId as CastId)).resolves.toEqual({
      messages: [message],
      nextPageToken: undefined,
    });
    await expect(
      set.getReactionRemove(fid, message.data.reactionBody.type, message.data.reactionBody.targetCastId as CastId)
    ).rejects.toThrow(HubError);
  };

  const assertReactionRemoveWins = async (message: ReactionRemoveMessage) => {
    await assertReactionExists(message);
    await expect(
      set.getReactionRemove(fid, message.data.reactionBody.type, message.data.reactionBody.targetCastId as CastId)
    ).resolves.toEqual(message);
    await expect(set.getReactionsByTargetCast(message.data.reactionBody.targetCastId as CastId)).resolves.toEqual({
      messages: [],
      nextPageToken: undefined,
    });
    await expect(
      set.getReactionAdd(fid, reactionAdd.data.reactionBody.type, message.data.reactionBody.targetCastId as CastId)
    ).rejects.toThrow(HubError);
  };

  test('fails with invalid message type', async () => {
    const message = await Factories.CastAddMessage.create();
    await expect(set.merge(message)).rejects.toThrow(HubError);
  });

  describe('ReactionAdd', () => {
    test('succeeds', async () => {
      await expect(set.merge(reactionAdd)).resolves.toBeGreaterThan(0);

      await assertReactionAddWins(reactionAdd);

      expect(mergeEvents).toEqual([[reactionAdd, []]]);
    });

    test('fails if merged twice', async () => {
      await expect(set.merge(reactionAdd)).resolves.toBeGreaterThan(0);
      await expect(set.merge(reactionAdd)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );

      await assertReactionAddWins(reactionAdd);

      expect(mergeEvents).toEqual([[reactionAdd, []]]);
    });

    describe('with a conflicting ReactionAdd with different timestamps', () => {
      let reactionAddLater: ReactionAddMessage;

      beforeAll(async () => {
        reactionAddLater = await Factories.ReactionAddMessage.create({
          data: { ...reactionAdd.data, timestamp: reactionAdd.data.timestamp + 1 },
        });
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(reactionAdd);
        await expect(set.merge(reactionAddLater)).resolves.toBeGreaterThan(0);

        await assertReactionDoesNotExist(reactionAdd);
        await assertReactionAddWins(reactionAddLater);

        expect(mergeEvents).toEqual([
          [reactionAdd, []],
          [reactionAddLater, [reactionAdd]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        await set.merge(reactionAddLater);
        await expect(set.merge(reactionAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent ReactionAdd')
        );

        await assertReactionDoesNotExist(reactionAdd);
        await assertReactionAddWins(reactionAddLater);
      });
    });

    describe('with a conflicting ReactionAdd with identical timestamps', () => {
      let reactionAddLater: ReactionAddMessage;

      beforeAll(async () => {
        reactionAddLater = await Factories.ReactionAddMessage.create({
          ...reactionAdd,
          hash: bytesIncrement(reactionAdd.hash)._unsafeUnwrap(),
        });
      });

      test('succeeds with a higher hash', async () => {
        await set.merge(reactionAdd);
        await expect(set.merge(reactionAddLater)).resolves.toBeGreaterThan(0);

        await assertReactionDoesNotExist(reactionAdd);
        await assertReactionAddWins(reactionAddLater);

        expect(mergeEvents).toEqual([
          [reactionAdd, []],
          [reactionAddLater, [reactionAdd]],
        ]);
      });

      test('fails with a lower hash', async () => {
        await set.merge(reactionAddLater);
        await expect(set.merge(reactionAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent ReactionAdd')
        );

        await assertReactionDoesNotExist(reactionAdd);
        await assertReactionAddWins(reactionAddLater);
      });
    });

    describe('with conflicting ReactionRemove with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        const reactionRemoveEarlier = await Factories.ReactionRemoveMessage.create({
          data: { ...reactionRemove.data, timestamp: reactionAdd.data.timestamp - 1 },
        });

        await set.merge(reactionRemoveEarlier);
        await expect(set.merge(reactionAdd)).resolves.toBeGreaterThan(0);

        await assertReactionAddWins(reactionAdd);
        await assertReactionDoesNotExist(reactionRemoveEarlier);

        expect(mergeEvents).toEqual([
          [reactionRemoveEarlier, []],
          [reactionAdd, [reactionRemoveEarlier]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        await set.merge(reactionRemove);
        await expect(set.merge(reactionAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent ReactionRemove')
        );

        await assertReactionRemoveWins(reactionRemove);
        await assertReactionDoesNotExist(reactionAdd);
      });
    });

    describe('with conflicting ReactionRemove with identical timestamps', () => {
      test('fails if remove has a higher hash', async () => {
        const reactionRemoveLater = await Factories.ReactionRemoveMessage.create({
          data: {
            ...reactionRemove.data,
            timestamp: reactionAdd.data.timestamp,
          },
          hash: bytesIncrement(reactionAdd.hash)._unsafeUnwrap(),
        });

        await set.merge(reactionRemoveLater);
        await expect(set.merge(reactionAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent ReactionRemove')
        );

        await assertReactionRemoveWins(reactionRemoveLater);
        await assertReactionDoesNotExist(reactionAdd);
      });

      test('fails if remove has a lower hash', async () => {
        const reactionRemoveEarlier = await Factories.ReactionRemoveMessage.create({
          data: {
            ...reactionRemove.data,
            timestamp: reactionAdd.data.timestamp,
          },
          hash: bytesDecrement(reactionAdd.hash)._unsafeUnwrap(),
        });

        await set.merge(reactionRemoveEarlier);
        await expect(set.merge(reactionAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent ReactionRemove')
        );

        await assertReactionRemoveWins(reactionRemoveEarlier);
        await assertReactionDoesNotExist(reactionAdd);
      });
    });
  });

  describe('ReactionRemove', () => {
    test('succeeds', async () => {
      await expect(set.merge(reactionRemove)).resolves.toBeGreaterThan(0);

      await assertReactionRemoveWins(reactionRemove);

      expect(mergeEvents).toEqual([[reactionRemove, []]]);
    });

    test('fails if merged twice', async () => {
      await expect(set.merge(reactionRemove)).resolves.toBeGreaterThan(0);
      await expect(set.merge(reactionRemove)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );

      await assertReactionRemoveWins(reactionRemove);
    });

    describe('with a conflicting ReactionRemove with different timestamps', () => {
      let reactionRemoveLater: ReactionRemoveMessage;

      beforeAll(async () => {
        reactionRemoveLater = await Factories.ReactionRemoveMessage.create({
          data: { ...reactionRemove.data, timestamp: reactionRemove.data.timestamp + 1 },
        });
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(reactionRemove);
        await expect(set.merge(reactionRemoveLater)).resolves.toBeGreaterThan(0);

        await assertReactionDoesNotExist(reactionRemove);
        await assertReactionRemoveWins(reactionRemoveLater);

        expect(mergeEvents).toEqual([
          [reactionRemove, []],
          [reactionRemoveLater, [reactionRemove]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        await set.merge(reactionRemoveLater);
        await expect(set.merge(reactionRemove)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent ReactionRemove')
        );

        await assertReactionDoesNotExist(reactionRemove);
        await assertReactionRemoveWins(reactionRemoveLater);
      });
    });

    describe('with a conflicting ReactionRemove with identical timestamps', () => {
      let reactionRemoveLater: ReactionRemoveMessage;

      beforeAll(async () => {
        reactionRemoveLater = await Factories.ReactionRemoveMessage.create({
          ...reactionRemove,
          hash: bytesIncrement(reactionRemove.hash)._unsafeUnwrap(),
        });
      });

      test('succeeds with a higher hash', async () => {
        await set.merge(reactionRemove);
        await expect(set.merge(reactionRemoveLater)).resolves.toBeGreaterThan(0);

        await assertReactionDoesNotExist(reactionRemove);
        await assertReactionRemoveWins(reactionRemoveLater);

        expect(mergeEvents).toEqual([
          [reactionRemove, []],
          [reactionRemoveLater, [reactionRemove]],
        ]);
      });

      test('fails with a lower hash', async () => {
        await set.merge(reactionRemoveLater);
        await expect(set.merge(reactionRemove)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent ReactionRemove')
        );

        await assertReactionDoesNotExist(reactionRemove);
        await assertReactionRemoveWins(reactionRemoveLater);
      });
    });

    describe('with conflicting ReactionAdd with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        await set.merge(reactionAdd);
        await expect(set.merge(reactionRemove)).resolves.toBeGreaterThan(0);
        await assertReactionRemoveWins(reactionRemove);
        await assertReactionDoesNotExist(reactionAdd);

        expect(mergeEvents).toEqual([
          [reactionAdd, []],
          [reactionRemove, [reactionAdd]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        const reactionAddLater = await Factories.ReactionAddMessage.create({
          data: {
            ...reactionRemove.data,
            timestamp: reactionRemove.data.timestamp + 1,
            type: MessageType.REACTION_ADD,
          },
        });

        await set.merge(reactionAddLater);
        await expect(set.merge(reactionRemove)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent ReactionAdd')
        );
        await assertReactionAddWins(reactionAddLater);
        await assertReactionDoesNotExist(reactionRemove);
      });
    });

    describe('with conflicting ReactionAdd with identical timestamps', () => {
      test('succeeds with a lower hash', async () => {
        const reactionAddLater = await Factories.ReactionAddMessage.create({
          data: { ...reactionRemove.data, type: MessageType.REACTION_ADD },
          hash: bytesIncrement(reactionRemove.hash)._unsafeUnwrap(),
        });

        await set.merge(reactionAddLater);
        await expect(set.merge(reactionRemove)).resolves.toBeGreaterThan(0);

        await assertReactionDoesNotExist(reactionAddLater);
        await assertReactionRemoveWins(reactionRemove);

        expect(mergeEvents).toEqual([
          [reactionAddLater, []],
          [reactionRemove, [reactionAddLater]],
        ]);
      });

      test('succeeds with a higher hash', async () => {
        const reactionAddEarlier = await Factories.ReactionAddMessage.create({
          data: { ...reactionRemove.data, type: MessageType.REACTION_ADD },
          hash: bytesDecrement(reactionRemove.hash)._unsafeUnwrap(),
        });

        await set.merge(reactionAddEarlier);
        await expect(set.merge(reactionRemove)).resolves.toBeGreaterThan(0);

        await assertReactionDoesNotExist(reactionAddEarlier);
        await assertReactionRemoveWins(reactionRemove);

        expect(mergeEvents).toEqual([
          [reactionAddEarlier, []],
          [reactionRemove, [reactionAddEarlier]],
        ]);
      });
    });
  });
});

describe('revoke', () => {
  let revokedMessages: Message[] = [];

  const revokeMessageHandler = (event: RevokeMessageHubEvent) => {
    revokedMessages.push(event.revokeMessageBody.message);
  };

  beforeAll(() => {
    eventHandler.on('revokeMessage', revokeMessageHandler);
  });

  beforeEach(() => {
    revokedMessages = [];
  });

  afterAll(() => {
    eventHandler.off('revokeMessage', revokeMessageHandler);
  });

  test('fails with invalid message type', async () => {
    const castAdd = await Factories.CastAddMessage.create({ data: { fid } });
    const result = await set.revoke(castAdd);
    expect(result).toEqual(err(new HubError('bad_request.invalid_param', 'invalid message type')));
    expect(revokedMessages).toEqual([]);
  });

  test('succeeds with ReactionAdd', async () => {
    await expect(set.merge(reactionAdd)).resolves.toBeGreaterThan(0);
    const result = await set.revoke(reactionAdd);
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap()).toBeGreaterThan(0);
    await expect(
      set.getReactionAdd(fid, reactionAdd.data.reactionBody.type, reactionAdd.data.reactionBody.targetCastId as CastId)
    ).rejects.toThrow();
    expect(revokedMessages).toEqual([reactionAdd]);
  });

  test('succeeds with ReactionRemove', async () => {
    await expect(set.merge(reactionRemove)).resolves.toBeGreaterThan(0);
    const result = await set.revoke(reactionRemove);
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap()).toBeGreaterThan(0);
    await expect(
      set.getReactionRemove(
        fid,
        reactionRemove.data.reactionBody.type,
        reactionRemove.data.reactionBody.targetCastId as CastId
      )
    ).rejects.toThrow();
    expect(revokedMessages).toEqual([reactionRemove]);
  });

  test('succeeds with unmerged message', async () => {
    const result = await set.revoke(reactionAdd);
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap()).toBeGreaterThan(0);
    await expect(
      set.getReactionAdd(fid, reactionAdd.data.reactionBody.type, reactionAdd.data.reactionBody.targetCastId as CastId)
    ).rejects.toThrow();
    expect(revokedMessages).toEqual([reactionAdd]);
  });
});

describe('pruneMessages', () => {
  let prunedMessages: Message[];

  const pruneMessageListener = (event: PruneMessageHubEvent) => {
    prunedMessages.push(event.pruneMessageBody.message);
  };

  beforeAll(() => {
    eventHandler.on('pruneMessage', pruneMessageListener);
  });

  beforeEach(() => {
    prunedMessages = [];
  });

  afterAll(() => {
    eventHandler.off('pruneMessage', pruneMessageListener);
  });

  let add1: ReactionAddMessage;
  let add2: ReactionAddMessage;
  let add3: ReactionAddMessage;
  let add4: ReactionAddMessage;
  let add5: ReactionAddMessage;
  let addOld1: ReactionAddMessage;
  let addOld2: ReactionAddMessage;

  let remove1: ReactionRemoveMessage;
  let remove2: ReactionRemoveMessage;
  let remove3: ReactionRemoveMessage;
  let remove4: ReactionRemoveMessage;
  let remove5: ReactionRemoveMessage;
  let removeOld3: ReactionRemoveMessage;

  const generateAddWithTimestamp = async (fid: number, timestamp: number): Promise<ReactionAddMessage> => {
    return Factories.ReactionAddMessage.create({ data: { fid, timestamp } });
  };

  const generateRemoveWithTimestamp = async (
    fid: number,
    timestamp: number,
    addBody?: ReactionBody
  ): Promise<ReactionRemoveMessage> => {
    return Factories.ReactionRemoveMessage.create({
      data: {
        fid,
        timestamp,
        reactionBody: addBody ?? Factories.ReactionBody.build(),
      },
    });
  };

  beforeAll(async () => {
    const time = getFarcasterTime()._unsafeUnwrap() - 10;
    add1 = await generateAddWithTimestamp(fid, time + 1);
    add2 = await generateAddWithTimestamp(fid, time + 2);
    add3 = await generateAddWithTimestamp(fid, time + 3);
    add4 = await generateAddWithTimestamp(fid, time + 4);
    add5 = await generateAddWithTimestamp(fid, time + 5);
    addOld1 = await generateAddWithTimestamp(fid, time - 60 * 60);
    addOld2 = await generateAddWithTimestamp(fid, time - 60 * 60 + 1);

    remove1 = await generateRemoveWithTimestamp(fid, time + 1, add1.data.reactionBody);
    remove2 = await generateRemoveWithTimestamp(fid, time + 2, add2.data.reactionBody);
    remove3 = await generateRemoveWithTimestamp(fid, time + 3, add3.data.reactionBody);
    remove4 = await generateRemoveWithTimestamp(fid, time + 4, add4.data.reactionBody);
    remove5 = await generateRemoveWithTimestamp(fid, time + 5, add5.data.reactionBody);
    removeOld3 = await generateRemoveWithTimestamp(fid, time - 60 * 60 + 2);
  });

  beforeEach(async () => {
    await cache.syncFromDb(db);
  });

  describe('with size limit', () => {
    const sizePrunedStore = new ReactionStore(db, eventHandler, { pruneSizeLimit: 3 });

    test('no-ops when no messages have been merged', async () => {
      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result._unsafeUnwrap()).toEqual([]);
      expect(prunedMessages).toEqual([]);
    });

    test('prunes earliest add messages', async () => {
      const messages = [add1, add2, add3, add4, add5];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result.isOk()).toBeTruthy();
      expect(result._unsafeUnwrap().length).toEqual(2);

      expect(prunedMessages).toEqual([add1, add2]);

      for (const message of prunedMessages as ReactionAddMessage[]) {
        const getAdd = () =>
          sizePrunedStore.getReactionAdd(
            fid,
            message.data.reactionBody.type,
            message.data.reactionBody.targetCastId ?? Factories.CastId.build()
          );
        await expect(getAdd()).rejects.toThrow(HubError);
      }
    });

    test('prunes earliest remove messages', async () => {
      const messages = [remove1, remove2, remove3, remove4, remove5];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result.isOk()).toBeTruthy();
      expect(result._unsafeUnwrap().length).toEqual(2);

      expect(prunedMessages).toEqual([remove1, remove2]);

      for (const message of prunedMessages as ReactionRemoveMessage[]) {
        const getRemove = () =>
          sizePrunedStore.getReactionRemove(
            fid,
            message.data.reactionBody.type,
            message.data.reactionBody.targetCastId ?? Factories.CastId.build()
          );
        await expect(getRemove()).rejects.toThrow(HubError);
      }
    });

    test('prunes earliest messages', async () => {
      const messages = [add1, remove2, add3, remove4, add5];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result.isOk()).toBeTruthy();
      expect(result._unsafeUnwrap().length).toEqual(2);

      expect(prunedMessages).toEqual([add1, remove2]);
    });

    test('no-ops when adds have been removed', async () => {
      const messages = [add1, remove1, add2, remove2, add3];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result).toEqual(ok([]));

      expect(prunedMessages).toEqual([]);
    });
  });

  describe('with time limit', () => {
    const timePrunedStore = new ReactionStore(db, eventHandler, { pruneTimeLimit: 60 * 60 - 1 });

    test('prunes earliest messages', async () => {
      const messages = [add1, remove2, addOld1, addOld2, removeOld3];
      for (const message of messages) {
        await timePrunedStore.merge(message);
      }

      const result = await timePrunedStore.pruneMessages(fid);
      expect(result.isOk()).toBeTruthy();

      expect(prunedMessages).toEqual([addOld1, addOld2, removeOld3]);

      await expect(
        timePrunedStore.getReactionAdd(
          fid,
          addOld1.data.reactionBody.type,
          addOld1.data.reactionBody.targetCastId ?? Factories.CastId.build()
        )
      ).rejects.toThrow(HubError);
      await expect(
        timePrunedStore.getReactionAdd(
          fid,
          addOld2.data.reactionBody.type,
          addOld2.data.reactionBody.targetCastId ?? Factories.CastId.build()
        )
      ).rejects.toThrow(HubError);
      await expect(
        timePrunedStore.getReactionRemove(
          fid,
          removeOld3.data.reactionBody.type,
          removeOld3.data.reactionBody.targetCastId ?? Factories.CastId.build()
        )
      ).rejects.toThrow(HubError);
    });
  });
});
