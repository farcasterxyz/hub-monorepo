import {
  bytesDecrement,
  bytesIncrement,
  CastAddMessage,
  CastId,
  CastRemoveMessage,
  Factories,
  getFarcasterTime,
  HubError,
  MergeMessageHubEvent,
  Message,
  PruneMessageHubEvent,
  RevokeMessageHubEvent,
} from '@farcaster/hub-nodejs';
import { jestRocksDB } from '../db/jestUtils.js';
import { getMessage, makeTsHash } from '../db/message.js';
import { UserPostfix } from '../db/types.js';
import CastStore from './castStore.js';
import StoreEventHandler from './storeEventHandler.js';
import { sleep } from '../../utils/crypto.js';
import { err, ok } from 'neverthrow';
import { faker } from '@faker-js/faker';
import { FARCASTER_EPOCH } from '@farcaster/core';

const db = jestRocksDB('protobufs.castStore.test');
const eventHandler = new StoreEventHandler(db);
const store = new CastStore(db, eventHandler);
const fid = Factories.Fid.build();

let castAdd: CastAddMessage;
let castRemove: CastRemoveMessage;
let parentCastId: CastId;

beforeAll(async () => {
  parentCastId = Factories.CastId.build();
  castAdd = await Factories.CastAddMessage.create({ data: { fid, castAddBody: { parentCastId } } });
  castRemove = await Factories.CastRemoveMessage.create({
    data: { fid, castRemoveBody: { targetHash: castAdd.hash } },
  });
});

beforeEach(async () => {
  await eventHandler.syncCache();
});

describe('getCastAdd', () => {
  const getCastAdd = () => store.getCastAdd(fid, castAdd.hash);

  test('fails if missing', async () => {
    await expect(getCastAdd()).rejects.toThrow(HubError);
  });

  test('fails if incorrect values are passed in', async () => {
    await store.merge(castAdd);

    const invalidFid = Factories.Fid.build();
    await expect(store.getCastAdd(invalidFid, castAdd.hash)).rejects.toThrow(HubError);

    const invalidHash = Factories.Bytes.build();
    await expect(store.getCastAdd(fid, invalidHash)).rejects.toThrow(HubError);
  });

  test('succeeds with message', async () => {
    await store.merge(castAdd);
    await expect(getCastAdd()).resolves.toEqual(castAdd);
  });
});

describe('getCastRemove', () => {
  test('fails if missing', async () => {
    await expect(store.getCastRemove(fid, castAdd.hash)).rejects.toThrow(HubError);
  });

  test('fails if incorrect values are passed in', async () => {
    await store.merge(castRemove);

    const invalidFid = Factories.Fid.build();
    await expect(store.getCastAdd(invalidFid, castRemove.hash)).rejects.toThrow(HubError);

    const invalidHash = Factories.Bytes.build();
    await expect(store.getCastAdd(fid, invalidHash)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await expect(store.merge(castRemove)).resolves.toBeGreaterThan(0);
    await expect(store.getCastRemove(fid, castAdd.hash)).resolves.toEqual(castRemove);
  });
});

describe('getCastAddsByFid', () => {
  test('returns cast adds for an fid', async () => {
    await store.merge(castAdd);
    await expect(store.getCastAddsByFid(fid)).resolves.toEqual({ messages: [castAdd], nextPageToken: undefined });
  });

  test('fails if incorrect values are passed in', async () => {
    await store.merge(castAdd);

    const invalidFid = Factories.Fid.build();
    await expect(store.getCastAddsByFid(invalidFid)).resolves.toEqual({ messages: [], nextPageToken: undefined });
  });

  test('returns empty array without messages', async () => {
    await expect(store.getCastAddsByFid(fid)).resolves.toEqual({ messages: [], nextPageToken: undefined });
  });

  test('returns cast adds in chronological order according to pageOptions', async () => {
    const castAdd2 = await Factories.CastAddMessage.create({ data: { fid, timestamp: castAdd.data.timestamp + 1 } });
    const castRemove2 = await Factories.CastRemoveMessage.create({ data: { fid } });
    await store.merge(castRemove2);
    await store.merge(castAdd);
    await store.merge(castAdd2);

    const results = await store.getCastAddsByFid(fid);
    expect(results).toEqual({ messages: [castAdd, castAdd2], nextPageToken: undefined });

    const results1 = await store.getCastAddsByFid(fid, { pageSize: 1 });
    expect(results1.messages).toEqual([castAdd]);

    const results2 = await store.getCastAddsByFid(fid, { pageToken: results1.nextPageToken });
    expect(results2).toEqual({ messages: [castAdd2], nextPageToken: undefined });
  });
});

describe('getCastRemovesByFid', () => {
  test('fails if incorrect values are passed in', async () => {
    await store.merge(castRemove);

    const invalidFid = Factories.Fid.build();
    await expect(store.getCastRemovesByFid(invalidFid)).resolves.toEqual({ messages: [], nextPageToken: undefined });
  });

  test('returns empty array without messages', async () => {
    await expect(store.getCastRemovesByFid(fid)).resolves.toEqual({ messages: [], nextPageToken: undefined });
  });

  test('returns cast removes in chronological order according to pageOptions', async () => {
    const castAdd2 = await Factories.CastAddMessage.create({ data: { fid } });
    const castRemove2 = await Factories.CastRemoveMessage.create({
      data: { fid, timestamp: castRemove.data.timestamp + 1 },
    });
    await store.merge(castRemove);
    await store.merge(castRemove2);
    await store.merge(castAdd2);

    const results = await store.getCastRemovesByFid(fid);
    expect(results).toEqual({ messages: [castRemove, castRemove2], nextPageToken: undefined });

    const results1 = await store.getCastRemovesByFid(fid, { pageSize: 1 });
    expect(results1.messages).toEqual([castRemove]);

    const results2 = await store.getCastRemovesByFid(fid, { pageToken: results1.nextPageToken });
    expect(results2).toEqual({ messages: [castRemove2], nextPageToken: undefined });
  });
});

describe('getCastsByParent', () => {
  test('returns empty array if no casts exist', async () => {
    const byTargetUser = await store.getCastsByParent(parentCastId);
    expect(byTargetUser).toEqual({ messages: [], nextPageToken: undefined });
  });

  test('returns empty array if casts exist, but for a different parent', async () => {
    await store.merge(castAdd);
    expect(await store.getCastsByParent(Factories.CastId.build())).toEqual({ messages: [], nextPageToken: undefined });
    expect(await store.getCastsByParent('foo')).toEqual({ messages: [], nextPageToken: undefined });
  });

  test('returns casts that reply to a parent cast id according to pageOptions', async () => {
    const castAddSameParent = await Factories.CastAddMessage.create({
      data: { castAddBody: { parentCastId }, timestamp: castAdd.data.timestamp + 1 },
    });

    await store.merge(castAdd);
    await store.merge(castAddSameParent);

    const byParent = await store.getCastsByParent(parentCastId);
    expect(byParent).toEqual({ messages: [castAdd, castAddSameParent], nextPageToken: undefined });

    const results1 = await store.getCastsByParent(parentCastId, { pageSize: 1 });
    expect(results1.messages).toEqual([castAdd]);

    const results2 = await store.getCastsByParent(parentCastId, { pageToken: results1.nextPageToken });
    expect(results2).toEqual({ messages: [castAddSameParent], nextPageToken: undefined });

    const results3 = await store.getCastsByParent(parentCastId, { reverse: true });
    expect(results3).toEqual({ messages: [castAddSameParent, castAdd], nextPageToken: undefined });
  });

  test('returns casts that reply to a parent url', async () => {
    const parentUrl = faker.internet.url();
    const cast1 = await Factories.CastAddMessage.create({
      data: { castAddBody: { parentUrl, parentCastId: undefined } },
    });
    const cast2 = await Factories.CastAddMessage.create({
      data: { castAddBody: { parentUrl, parentCastId: undefined }, timestamp: cast1.data.timestamp + 1 },
    });

    await store.merge(castAdd);
    await store.merge(cast1);
    await store.merge(cast2);

    const casts = await store.getCastsByParent(parentUrl);
    expect(casts).toEqual({ messages: [cast1, cast2], nextPageToken: undefined });
  });
});

describe('getCastsByMention', () => {
  test('returns empty array if no casts exist', async () => {
    const byTargetUser = await store.getCastsByMention(Factories.Fid.build());
    expect(byTargetUser).toEqual({ messages: [], nextPageToken: undefined });
  });

  test('returns empty array if casts exist, but for a different fid or hash', async () => {
    await store.merge(castAdd);
    expect(await store.getCastsByMention(Factories.Fid.build())).toEqual({ messages: [], nextPageToken: undefined });
  });

  test('returns casts that mention an fid according to pageOptions', async () => {
    const castAdd2 = await Factories.CastAddMessage.create({
      data: {
        timestamp: castAdd.data.timestamp + 1,
        castAddBody: { mentions: castAdd.data.castAddBody.mentions },
      },
    });
    await store.merge(castAdd);
    await store.merge(castAdd2);
    expect(castAdd.data.castAddBody.mentions.length).toBeGreaterThan(0);
    for (const mentionFid of castAdd.data.castAddBody.mentions) {
      await expect(store.getCastsByMention(mentionFid)).resolves.toEqual({
        messages: [castAdd, castAdd2],
        nextPageToken: undefined,
      });

      const results1 = await store.getCastsByMention(mentionFid, { pageSize: 1 });
      expect(results1.messages).toEqual([castAdd]);

      const results2 = await store.getCastsByMention(mentionFid, { pageToken: results1.nextPageToken });
      expect(results2).toEqual({ messages: [castAdd2], nextPageToken: undefined });

      const results3 = await store.getCastsByMention(mentionFid, { reverse: true });
      expect(results3).toEqual({ messages: [castAdd2, castAdd], nextPageToken: undefined });
    }
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

  const assetMessageExists = async (message: CastAddMessage | CastRemoveMessage) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.CastMessage, tsHash)).resolves.toEqual(message);
  };

  const assertMessageDoesNotExist = async (message: CastAddMessage | CastRemoveMessage) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.CastMessage, tsHash)).rejects.toThrow(HubError);
  };

  const assertCastAddWins = async (message: CastAddMessage, removeMessage?: CastRemoveMessage) => {
    await assetMessageExists(message);
    await expect(store.getCastAdd(fid, message.hash)).resolves.toEqual(message);
    for (const mentionFid of message.data.castAddBody.mentions) {
      await expect(store.getCastsByMention(mentionFid)).resolves.toEqual({
        messages: [message],
        nextPageToken: undefined,
      });
    }
    if (message.data.castAddBody.parentCastId) {
      await expect(store.getCastsByParent(message.data.castAddBody.parentCastId)).resolves.toEqual({
        messages: [message],
        nextPageToken: undefined,
      });
    }

    if (removeMessage) {
      await expect(store.getCastRemove(fid, removeMessage.data.castRemoveBody.targetHash)).rejects.toThrow(HubError);
      await assertMessageDoesNotExist(removeMessage);
    }
  };

  const assertCastRemoveWins = async (message: CastRemoveMessage) => {
    const castHash = message.data.castRemoveBody.targetHash;

    await assetMessageExists(message);
    await expect(store.getCastRemove(fid, castHash)).resolves.toEqual(message);
    await expect(store.getCastAdd(fid, castHash)).rejects.toThrow(HubError);
  };

  test('fails with invalid message type', async () => {
    const message = await Factories.ReactionAddMessage.create();
    await expect(store.merge(message)).rejects.toThrow(HubError);
  });

  describe('CastAdd', () => {
    test('succeeds', async () => {
      await expect(store.merge(castAdd)).resolves.toBeGreaterThan(0);
      await assertCastAddWins(castAdd);

      expect(mergeEvents).toEqual([[castAdd, []]]);
    });

    test('fails if merged twice', async () => {
      await expect(store.merge(castAdd)).resolves.toBeGreaterThan(0);
      await expect(store.merge(castAdd)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );

      await assertCastAddWins(castAdd);

      expect(mergeEvents).toEqual([[castAdd, []]]);
    });

    describe('with conflicting CastRemove with different timestamps', () => {
      test('fails with a later timestamp', async () => {
        const castRemoveEarlier = await Factories.CastRemoveMessage.create({
          data: { ...castRemove.data, timestamp: castAdd.data.timestamp - 1 },
        });

        await store.merge(castRemoveEarlier);
        await expect(store.merge(castAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a CastRemove')
        );

        await assertCastRemoveWins(castRemoveEarlier);
        await assertMessageDoesNotExist(castAdd);
      });

      test('fails with an earlier timestamp', async () => {
        await store.merge(castRemove);
        await expect(store.merge(castAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a CastRemove')
        );

        await assertCastRemoveWins(castRemove);
        await assertMessageDoesNotExist(castAdd);
      });
    });

    describe('with conflicting CastRemove with identical timestamps', () => {
      test('fails with a later hash', async () => {
        const castRemoveEarlier = await Factories.CastRemoveMessage.create({
          data: { ...castRemove.data, timestamp: castAdd.data.timestamp },
          hash: bytesDecrement(castAdd.hash)._unsafeUnwrap(),
        });

        await store.merge(castRemoveEarlier);
        await expect(store.merge(castAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a CastRemove')
        );

        await assertCastRemoveWins(castRemoveEarlier);
        await assertMessageDoesNotExist(castAdd);
      });

      test('fails with an earlier hash', async () => {
        const castRemoveLater = await Factories.CastRemoveMessage.create({
          data: { ...castRemove.data, timestamp: castAdd.data.timestamp },
          hash: bytesIncrement(castAdd.hash)._unsafeUnwrap(),
        });

        await store.merge(castRemoveLater);
        await expect(store.merge(castAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a CastRemove')
        );

        await assertCastRemoveWins(castRemoveLater);
        await assertMessageDoesNotExist(castAdd);
      });
    });
  });

  describe('CastRemove', () => {
    test('succeeds', async () => {
      await store.merge(castAdd);
      await expect(store.merge(castRemove)).resolves.toBeGreaterThan(0);

      await assertCastRemoveWins(castRemove);
      await assertMessageDoesNotExist(castAdd);

      expect(mergeEvents).toEqual([
        [castAdd, []],
        [castRemove, [castAdd]],
      ]);
    });

    test('fails if merged twice', async () => {
      await expect(store.merge(castRemove)).resolves.toBeGreaterThan(0);
      await expect(store.merge(castRemove)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );

      await assertCastRemoveWins(castRemove);

      expect(mergeEvents).toEqual([[castRemove, []]]);
    });

    describe('with a conflicting CastRemove with different timestamps', () => {
      let castRemoveLater: CastRemoveMessage;

      beforeAll(async () => {
        castRemoveLater = await Factories.CastRemoveMessage.create({
          data: { ...castRemove.data, timestamp: castRemove.data.timestamp + 1 },
        });
      });

      test('succeeds with a later timestamp', async () => {
        await store.merge(castRemove);
        await expect(store.merge(castRemoveLater)).resolves.toBeGreaterThan(0);

        await assertMessageDoesNotExist(castRemove);
        await assertCastRemoveWins(castRemoveLater);

        expect(mergeEvents).toEqual([
          [castRemove, []],
          [castRemoveLater, [castRemove]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        await store.merge(castRemoveLater);
        await expect(store.merge(castRemove)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent remove')
        );

        await assertMessageDoesNotExist(castRemove);
        await assertCastRemoveWins(castRemoveLater);
      });
    });

    describe('with a conflicting CastRemove with identical timestamps', () => {
      let castRemoveLater: CastRemoveMessage;

      beforeAll(async () => {
        castRemoveLater = await Factories.CastRemoveMessage.create({
          ...castRemove,
          hash: bytesIncrement(castRemove.hash)._unsafeUnwrap(),
        });
      });

      test('succeeds with a later hash', async () => {
        await store.merge(castRemove);
        await expect(store.merge(castRemoveLater)).resolves.toBeGreaterThan(0);

        await assertMessageDoesNotExist(castRemove);
        await assertCastRemoveWins(castRemoveLater);

        await sleep(100);
        expect(mergeEvents).toEqual([
          [castRemove, []],
          [castRemoveLater, [castRemove]],
        ]);
      });

      test('fails with an earlier hash', async () => {
        await store.merge(castRemoveLater);
        await expect(store.merge(castRemove)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent remove')
        );

        await assertMessageDoesNotExist(castRemove);
        await assertCastRemoveWins(castRemoveLater);
      });
    });

    describe('with conflicting CastAdd with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        await store.merge(castAdd);
        await expect(store.merge(castRemove)).resolves.toBeGreaterThan(0);
        await assertCastRemoveWins(castRemove);
        await assertMessageDoesNotExist(castAdd);

        expect(mergeEvents).toEqual([
          [castAdd, []],
          [castRemove, [castAdd]],
        ]);
      });

      test('succeeds with an earlier timestamp', async () => {
        const castRemoveEarlier = await Factories.CastRemoveMessage.create({
          data: { ...castRemove.data, timestamp: castAdd.data.timestamp - 1 },
        });

        await store.merge(castAdd);
        await expect(store.merge(castRemoveEarlier)).resolves.toBeGreaterThan(0);
        await assertMessageDoesNotExist(castAdd);
        await assertCastRemoveWins(castRemoveEarlier);

        expect(mergeEvents).toEqual([
          [castAdd, []],
          [castRemoveEarlier, [castAdd]],
        ]);
      });
    });

    describe('with conflicting CastAdd with identical timestamps', () => {
      test('succeeds with an earlier hash', async () => {
        const castRemoveEarlier = await Factories.CastRemoveMessage.create({
          data: { ...castRemove.data, timestamp: castAdd.data.timestamp },
          hash: bytesDecrement(castAdd.hash)._unsafeUnwrap(),
        });

        await store.merge(castAdd);
        await expect(store.merge(castRemoveEarlier)).resolves.toBeGreaterThan(0);

        await assertMessageDoesNotExist(castAdd);
        await assertCastRemoveWins(castRemoveEarlier);

        expect(mergeEvents).toEqual([
          [castAdd, []],
          [castRemoveEarlier, [castAdd]],
        ]);
      });

      test('succeeds with a later hash', async () => {
        const castRemoveLater = await Factories.CastRemoveMessage.create({
          data: { ...castRemove.data, timestamp: castAdd.data.timestamp },
          hash: bytesIncrement(castAdd.hash)._unsafeUnwrap(),
        });

        await store.merge(castAdd);
        await expect(store.merge(castRemoveLater)).resolves.toBeGreaterThan(0);

        await assertMessageDoesNotExist(castAdd);
        await assertCastRemoveWins(castRemoveLater);

        const events = await eventHandler.getEvents();
        const mergeEvents = events._unsafeUnwrap().map((event) => {
          return [event.mergeMessageBody?.message, event.mergeMessageBody?.deletedMessages];
        });

        expect(mergeEvents).toEqual([
          [castAdd, []],
          [castRemoveLater, [castAdd]],
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
    const reactionAdd = await Factories.ReactionAddMessage.create({ data: { fid } });
    const result = await store.revoke(reactionAdd);
    expect(result).toEqual(err(new HubError('bad_request.invalid_param', 'invalid message type')));
    expect(revokedMessages).toEqual([]);
  });

  test('deletes all keys relating to the cast', async () => {
    await store.merge(castAdd);
    const castKeys: Buffer[] = [];
    for await (const [key] of db.iterator()) {
      castKeys.push(key as Buffer);
    }
    expect(castKeys.length).toBeGreaterThan(0);
    await store.revoke(castAdd);
    const castKeysAfterRevoke: Buffer[] = [];
    for await (const [key] of db.iterator()) {
      castKeysAfterRevoke.push(key as Buffer);
    }
    // Two hub events left behind (one merge, one revoke)
    expect(castKeysAfterRevoke.length).toEqual(2);
  });

  test('deletes all keys relating to the cast with parent url', async () => {
    const cast = await Factories.CastAddMessage.create({
      data: { castAddBody: { parentCastId: undefined, parentUrl: faker.internet.url() } },
    });
    await store.merge(cast);
    const castKeys: Buffer[] = [];
    for await (const [key] of db.iterator()) {
      castKeys.push(key as Buffer);
    }
    expect(castKeys.length).toBeGreaterThan(0);
    await store.revoke(cast);
    const castKeysAfterRevoke: Buffer[] = [];
    for await (const [key] of db.iterator()) {
      castKeysAfterRevoke.push(key as Buffer);
    }
    // Two hub events left behind (one merge, one revoke)
    expect(castKeysAfterRevoke.length).toEqual(2);
  });

  test('succeeds with CastAdd', async () => {
    await expect(store.merge(castAdd)).resolves.toBeGreaterThan(0);
    const result = await store.revoke(castAdd);
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap()).toBeGreaterThan(0);
    await expect(store.getCastAdd(fid, castAdd.hash)).rejects.toThrow();
    expect(revokedMessages).toEqual([castAdd]);
  });

  test('succeeds with CastRemove', async () => {
    await expect(store.merge(castRemove)).resolves.toBeGreaterThan(0);
    const result = await store.revoke(castRemove);
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap()).toBeGreaterThan(0);
    await expect(store.getCastRemove(fid, castRemove.data.castRemoveBody.targetHash)).rejects.toThrow();
    expect(revokedMessages).toEqual([castRemove]);
  });

  test('succeeds with unmerged message', async () => {
    const result = await store.revoke(castAdd);
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap()).toBeGreaterThan(0);
    await expect(store.getCastAdd(fid, castAdd.hash)).rejects.toThrow();
    expect(revokedMessages).toEqual([castAdd]);
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

  let add1: CastAddMessage;
  let add2: CastAddMessage;
  let add3: CastAddMessage;
  let add4: CastAddMessage;
  let add5: CastAddMessage;
  let addOld1: CastAddMessage;

  let remove1: CastRemoveMessage;
  let remove2: CastRemoveMessage;
  let remove3: CastRemoveMessage;
  let remove4: CastRemoveMessage;
  let remove5: CastRemoveMessage;

  const generateAddWithTimestamp = async (fid: number, timestamp: number): Promise<CastAddMessage> => {
    return Factories.CastAddMessage.create({
      data: { fid, timestamp },
    });
  };

  const generateRemoveWithTimestamp = async (
    fid: number,
    timestamp: number,
    target?: CastAddMessage
  ): Promise<CastRemoveMessage> => {
    return Factories.CastRemoveMessage.create({
      data: { fid, timestamp, castRemoveBody: { targetHash: target ? target.hash : Factories.MessageHash.build() } },
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

    remove1 = await generateRemoveWithTimestamp(fid, time + 1, add1);
    remove2 = await generateRemoveWithTimestamp(fid, time + 2, add2);
    remove3 = await generateRemoveWithTimestamp(fid, time + 3, add3);
    remove4 = await generateRemoveWithTimestamp(fid, time + 4, add4);
    remove5 = await generateRemoveWithTimestamp(fid, time + 5, add5);
  });

  describe('with size limit', () => {
    const sizePrunedStore = new CastStore(db, eventHandler, { pruneSizeLimit: 3 });

    test('no-ops when no messages have been merged', async () => {
      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result.isOk()).toBeTruthy();
      expect(prunedMessages).toEqual([]);
    });

    test('prunes earliest add messages', async () => {
      const messages = [add1, add2, add3, add4, add5];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result.isOk()).toBeTruthy();

      expect(prunedMessages).toEqual([add1, add2]);

      for (const message of prunedMessages as CastAddMessage[]) {
        const getAdd = () => sizePrunedStore.getCastAdd(fid, message.hash);
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

      expect(prunedMessages).toEqual([remove1, remove2]);

      for (const message of prunedMessages as CastRemoveMessage[]) {
        const getRemove = () => sizePrunedStore.getCastRemove(fid, message.data.castRemoveBody.targetHash);
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

      expect(prunedMessages).toEqual([add1, remove2]);
    });

    test('no-ops when adds have been removed', async () => {
      const messages = [add1, remove1, add2, remove2, add3];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result.isOk()).toBeTruthy();

      expect(prunedMessages).toEqual([]);
    });

    test('fails to merge message which would be immediately pruned', async () => {
      await expect(eventHandler.getEarliestTsHash(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(undefined));

      await expect(sizePrunedStore.merge(add3)).resolves.toBeGreaterThan(0);
      await expect(eventHandler.getCacheMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(1));
      await expect(eventHandler.getEarliestTsHash(fid, UserPostfix.CastMessage)).resolves.toEqual(
        makeTsHash(add3.data.timestamp, add3.hash)
      );

      await expect(sizePrunedStore.merge(add2)).resolves.toBeGreaterThan(0);
      await expect(eventHandler.getCacheMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(2));
      await expect(eventHandler.getEarliestTsHash(fid, UserPostfix.CastMessage)).resolves.toEqual(
        makeTsHash(add2.data.timestamp, add2.hash)
      );

      await expect(sizePrunedStore.merge(remove2)).resolves.toBeGreaterThan(0);
      await expect(eventHandler.getCacheMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(2));
      await expect(eventHandler.getEarliestTsHash(fid, UserPostfix.CastMessage)).resolves.toEqual(
        makeTsHash(remove2.data.timestamp, remove2.hash)
      );

      await expect(sizePrunedStore.merge(add4)).resolves.toBeGreaterThan(0);
      await expect(eventHandler.getCacheMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(3));
      await expect(eventHandler.getEarliestTsHash(fid, UserPostfix.CastMessage)).resolves.toEqual(
        makeTsHash(remove2.data.timestamp, remove2.hash)
      );

      // remove1 is older than remove2 and the store is at capacity so it's rejected
      await expect(sizePrunedStore.merge(remove1)).rejects.toEqual(
        new HubError('bad_request.prunable', 'message would be pruned')
      );

      // add1 is older than remove2 and the store is at capacity so it's rejected
      await expect(sizePrunedStore.merge(add1)).rejects.toEqual(
        new HubError('bad_request.prunable', 'message would be pruned')
      );

      // merging add5 succeeds because while the store is at capacity, add5 would not be pruned
      await expect(sizePrunedStore.merge(add5)).resolves.toBeGreaterThan(0);
      await expect(eventHandler.getCacheMessageCount(fid, UserPostfix.CastMessage)).resolves.toEqual(ok(4));
      await expect(eventHandler.getEarliestTsHash(fid, UserPostfix.CastMessage)).resolves.toEqual(
        makeTsHash(remove2.data.timestamp, remove2.hash)
      );

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result.isOk()).toBeTruthy();

      expect(prunedMessages).toEqual([remove2]);
    });
  });

  describe('with time limit', () => {
    const timePrunedStore = new CastStore(db, eventHandler, { pruneTimeLimit: 60 * 60 - 1 });

    test('prunes earliest messages', async () => {
      const messages = [add1, add2, remove3, add4];
      for (const message of messages) {
        await timePrunedStore.merge(message);
      }

      const nowOrig = Date.now;
      Date.now = () => FARCASTER_EPOCH + (add4.data.timestamp - 1 + 60 * 60) * 1000;
      try {
        const result = await timePrunedStore.pruneMessages(fid);
        expect(result.isOk()).toBeTruthy();

        expect(prunedMessages).toEqual([add1, add2, remove3]);
      } finally {
        Date.now = nowOrig;
      }

      await expect(timePrunedStore.getCastAdd(fid, add1.hash)).rejects.toThrow(HubError);
      await expect(timePrunedStore.getCastAdd(fid, add1.hash)).rejects.toThrow(HubError);
      await expect(timePrunedStore.getCastRemove(fid, remove3.data.castRemoveBody.targetHash)).rejects.toThrow(
        HubError
      );
    });

    test('fails to merge message which would be immediately pruned', async () => {
      const messages = [add1, add2];
      for (const message of messages) {
        await timePrunedStore.merge(message);
      }

      await expect(timePrunedStore.merge(addOld1)).rejects.toEqual(
        new HubError('bad_request.prunable', 'message would be pruned')
      );

      const result = await timePrunedStore.pruneMessages(fid);
      expect(result.isOk()).toBeTruthy();

      expect(prunedMessages).toEqual([]);
    });
  });
});
