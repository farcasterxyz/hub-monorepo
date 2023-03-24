import * as protobufs from '@farcaster/protobufs';
import { bytesIncrement, Factories, getFarcasterTime, HubError } from '@farcaster/utils';
import { jestRocksDB } from '~/storage/db/jestUtils';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import UserDataStore from '~/storage/stores/userDataStore';
import { getMessage, makeTsHash } from '../db/message';
import { UserPostfix } from '../db/types';
import { StorageCache } from '~/storage/engine/storageCache';
import { err } from 'neverthrow';

const db = jestRocksDB('protobufs.userDataSet.test');
const cache = new StorageCache();
const eventHandler = new StoreEventHandler(db, cache);
const set = new UserDataStore(db, eventHandler);
const fid = Factories.Fid.build();

let addPfp: protobufs.UserDataAddMessage;
let addBio: protobufs.UserDataAddMessage;

beforeAll(async () => {
  addPfp = await Factories.UserDataAddMessage.create({
    data: { fid, userDataBody: { type: protobufs.UserDataType.PFP } },
  });
  addBio = await Factories.UserDataAddMessage.create({
    data: { fid, userDataBody: { type: protobufs.UserDataType.BIO }, timestamp: addPfp.data.timestamp + 1 },
  });
});

describe('getUserDataAdd', () => {
  test('fails if missing', async () => {
    await expect(set.getUserDataAdd(fid, protobufs.UserDataType.PFP)).rejects.toThrow(HubError);
    await expect(set.getUserDataAdd(fid, protobufs.UserDataType.FNAME)).rejects.toThrow(HubError);
  });

  test('fails if the wrong fid or datatype is provided', async () => {
    const unknownFid = Factories.Fid.build();
    await set.merge(addPfp);

    await expect(set.getUserDataAdd(unknownFid, protobufs.UserDataType.PFP)).rejects.toThrow(HubError);
    await expect(set.getUserDataAdd(fid, protobufs.UserDataType.BIO)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await set.merge(addPfp);
    await expect(set.getUserDataAdd(fid, protobufs.UserDataType.PFP)).resolves.toEqual(addPfp);
  });
});

describe('getUserDataAddsByFid', () => {
  test('returns user data adds for an fid in chronological order', async () => {
    await set.merge(addPfp);
    await set.merge(addBio);
    const results = await set.getUserDataAddsByFid(fid);
    expect(results.messages).toEqual([addPfp, addBio]);
  });

  test('returns empty array if the wrong fid or datatype is provided', async () => {
    const unknownFid = Factories.Fid.build();
    await set.merge(addPfp);
    await expect(set.getUserDataAddsByFid(unknownFid)).resolves.toEqual({ messages: [], nextPageToken: undefined });
  });

  test('returns empty array without messages', async () => {
    await expect(set.getUserDataAddsByFid(fid)).resolves.toEqual({ messages: [], nextPageToken: undefined });
  });
});

describe('merge', () => {
  let mergeEvents: [protobufs.Message | undefined, protobufs.Message[]][] = [];

  const mergeMessageHandler = (event: protobufs.MergeMessageHubEvent) => {
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

  const assertUserDataExists = async (message: protobufs.UserDataAddMessage) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.UserDataMessage, tsHash)).resolves.toEqual(message);
  };

  const assertUserDataDoesNotExist = async (message: protobufs.UserDataAddMessage) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.UserDataMessage, tsHash)).rejects.toThrow(HubError);
  };

  const assertUserDataAddWins = async (message: protobufs.UserDataAddMessage) => {
    await assertUserDataExists(message);
    await expect(set.getUserDataAdd(fid, message.data.userDataBody.type)).resolves.toEqual(message);
  };

  test('fails with invalid message type', async () => {
    const message = await Factories.ReactionAddMessage.create({ data: { fid } });
    await expect(set.merge(message)).rejects.toThrow(HubError);
  });

  describe('UserDataAdd', () => {
    test('succeeds', async () => {
      await expect(set.merge(addPfp)).resolves.toBeGreaterThan(0);
      await assertUserDataAddWins(addPfp);
      expect(mergeEvents).toEqual([[addPfp, []]]);
    });

    test('fails if merged twice', async () => {
      await expect(set.merge(addPfp)).resolves.toBeGreaterThan(0);
      await expect(set.merge(addPfp)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );

      await assertUserDataAddWins(addPfp);
      expect(mergeEvents).toEqual([[addPfp, []]]);
    });

    test('does not conflict with UserDataAdd of different type', async () => {
      await set.merge(addBio);
      await set.merge(addPfp);
      await assertUserDataAddWins(addPfp);
      await assertUserDataAddWins(addBio);
      expect(mergeEvents).toEqual([
        [addBio, []],
        [addPfp, []],
      ]);
    });

    describe('with a conflicting UserDataAdd with different timestamps', () => {
      let addPfpLater: protobufs.UserDataAddMessage;

      beforeAll(async () => {
        addPfpLater = await Factories.UserDataAddMessage.create({
          data: { ...addPfp.data, timestamp: addPfp.data.timestamp + 1 },
        });
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(addPfp);
        await expect(set.merge(addPfpLater)).resolves.toBeGreaterThan(0);

        await assertUserDataDoesNotExist(addPfp);
        await assertUserDataAddWins(addPfpLater);
        expect(mergeEvents).toEqual([
          [addPfp, []],
          [addPfpLater, [addPfp]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        await set.merge(addPfpLater);
        await expect(set.merge(addPfp)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent UserDataAdd')
        );

        await assertUserDataDoesNotExist(addPfp);
        await assertUserDataAddWins(addPfpLater);
        expect(mergeEvents).toEqual([[addPfpLater, []]]);
      });
    });

    describe('with a conflicting UserDataAdd with identical timestamps', () => {
      let addPfpLater: protobufs.UserDataAddMessage;

      beforeAll(async () => {
        addPfpLater = await Factories.UserDataAddMessage.create({
          ...addPfp,
          hash: bytesIncrement(addPfp.hash)._unsafeUnwrap(),
        });
      });

      test('succeeds with a higher hash', async () => {
        await set.merge(addPfp);
        await expect(set.merge(addPfpLater)).resolves.toBeGreaterThan(0);

        await assertUserDataDoesNotExist(addPfp);
        await assertUserDataAddWins(addPfpLater);
        expect(mergeEvents).toEqual([
          [addPfp, []],
          [addPfpLater, [addPfp]],
        ]);
      });

      test('fails with a lower hash', async () => {
        await set.merge(addPfpLater);
        await expect(set.merge(addPfp)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent UserDataAdd')
        );

        await assertUserDataDoesNotExist(addPfp);
        await assertUserDataAddWins(addPfpLater);
        expect(mergeEvents).toEqual([[addPfpLater, []]]);
      });
    });
  });
});

describe('revoke', () => {
  let revokedMessages: protobufs.Message[] = [];

  const revokeMessageHandler = (event: protobufs.RevokeMessageHubEvent) => {
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

  test('succeeds with UserDataAdd', async () => {
    await expect(set.merge(addBio)).resolves.toBeGreaterThan(0);
    const result = await set.revoke(addBio);
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap()).toBeGreaterThan(0);
    await expect(set.getUserDataAdd(fid, protobufs.UserDataType.BIO)).rejects.toThrow();
    expect(revokedMessages).toEqual([addBio]);
  });

  test('succeeds with unmerged message', async () => {
    const result = await set.revoke(addPfp);
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap()).toBeGreaterThan(0);
    await expect(set.getUserDataAdd(fid, protobufs.UserDataType.PFP)).rejects.toThrow();
    expect(revokedMessages).toEqual([addPfp]);
  });
});

describe('pruneMessages', () => {
  let prunedMessages: protobufs.Message[];
  const pruneMessageListener = (event: protobufs.PruneMessageHubEvent) => {
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

  let add1: protobufs.UserDataAddMessage;
  let add2: protobufs.UserDataAddMessage;
  let add3: protobufs.UserDataAddMessage;
  let add4: protobufs.UserDataAddMessage;

  const generateAddWithTimestamp = async (
    fid: number,
    timestamp: number,
    type: protobufs.UserDataType
  ): Promise<protobufs.UserDataAddMessage> => {
    return Factories.UserDataAddMessage.create({ data: { fid, timestamp, userDataBody: { type } } });
  };

  beforeAll(async () => {
    const time = getFarcasterTime()._unsafeUnwrap() - 10;
    add1 = await generateAddWithTimestamp(fid, time + 1, protobufs.UserDataType.PFP);
    add2 = await generateAddWithTimestamp(fid, time + 2, protobufs.UserDataType.DISPLAY);
    add3 = await generateAddWithTimestamp(fid, time + 3, protobufs.UserDataType.BIO);
    add4 = await generateAddWithTimestamp(fid, time + 5, protobufs.UserDataType.URL);
  });

  beforeEach(async () => {
    await cache.syncFromDb(db);
  });

  describe('with size limit', () => {
    const sizePrunedStore = new UserDataStore(db, eventHandler, { pruneSizeLimit: 2 });

    test('no-ops when no messages have been merged', async () => {
      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result._unsafeUnwrap()).toEqual([]);
      expect(prunedMessages).toEqual([]);
    });

    test('prunes earliest add messages', async () => {
      const messages = [add1, add2, add3, add4];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result.isOk()).toBeTruthy();

      expect(prunedMessages).toEqual([add1, add2]);

      for (const message of prunedMessages as protobufs.UserDataAddMessage[]) {
        const getAdd = () => sizePrunedStore.getUserDataAdd(fid, message.data.userDataBody.type);
        await expect(getAdd()).rejects.toThrow(HubError);
      }
    });
  });
});
