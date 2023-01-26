import * as protobufs from '@farcaster/protobufs';
import { bytesIncrement, Factories, getFarcasterTime, HubError } from '@farcaster/protoutils';
import { jestRocksDB } from '~/storage/db/jestUtils';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import UserDataStore from '~/storage/stores/userDataStore';
import { getMessage, makeTsHash } from '../db/message';
import { UserPostfix } from '../db/types';

const db = jestRocksDB('flatbuffers.userDataSet.test');

const eventHandler = new StoreEventHandler();
const set = new UserDataStore(db, eventHandler);
const fid = Factories.Fid.build();

let addPfp: protobufs.UserDataAddMessage;
let addBio: protobufs.UserDataAddMessage;

beforeAll(async () => {
  addPfp = await Factories.UserDataAddMessage.create({
    data: { fid, userDataBody: { type: protobufs.UserDataType.USER_DATA_TYPE_PFP } },
  });
  addBio = await Factories.UserDataAddMessage.create({
    data: { fid, userDataBody: { type: protobufs.UserDataType.USER_DATA_TYPE_BIO } },
  });
});

describe('getUserDataAdd', () => {
  test('fails if missing', async () => {
    await expect(set.getUserDataAdd(fid, protobufs.UserDataType.USER_DATA_TYPE_PFP)).rejects.toThrow(HubError);
    await expect(set.getUserDataAdd(fid, protobufs.UserDataType.USER_DATA_TYPE_FNAME)).rejects.toThrow(HubError);
  });

  test('fails if the wrong fid or datatype is provided', async () => {
    const unknownFid = Factories.Fid.build();
    await set.merge(addPfp);

    await expect(set.getUserDataAdd(unknownFid, protobufs.UserDataType.USER_DATA_TYPE_PFP)).rejects.toThrow(HubError);
    await expect(set.getUserDataAdd(fid, protobufs.UserDataType.USER_DATA_TYPE_BIO)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await set.merge(addPfp);
    await expect(set.getUserDataAdd(fid, protobufs.UserDataType.USER_DATA_TYPE_PFP)).resolves.toEqual(addPfp);
  });
});

describe('getUserDataAddsByFid', () => {
  test('returns user data adds for an fid', async () => {
    await set.merge(addPfp);
    await set.merge(addBio);
    expect(new Set(await set.getUserDataAddsByFid(fid))).toEqual(new Set([addPfp, addBio]));
  });

  test('returns empty array if the wrong fid or datatype is provided', async () => {
    const unknownFid = Factories.Fid.build();
    await set.merge(addPfp);
    await expect(set.getUserDataAddsByFid(unknownFid)).resolves.toEqual([]);
  });

  test('returns empty array without messages', async () => {
    await expect(set.getUserDataAddsByFid(fid)).resolves.toEqual([]);
  });
});

describe('merge', () => {
  let mergeEvents: [protobufs.Message, protobufs.Message[]][] = [];

  const mergeMessageHandler = (message: protobufs.Message, deletedMessages?: protobufs.Message[]) => {
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
      await expect(set.merge(addPfp)).resolves.toEqual(undefined);
      await assertUserDataAddWins(addPfp);
      expect(mergeEvents).toEqual([[addPfp, []]]);
    });

    test('fails if merged twice', async () => {
      await expect(set.merge(addPfp)).resolves.toEqual(undefined);
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
        await expect(set.merge(addPfpLater)).resolves.toEqual(undefined);

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
          hash: bytesIncrement(addPfp.hash),
        });
      });

      test('succeeds with a higher hash', async () => {
        await set.merge(addPfp);
        await expect(set.merge(addPfpLater)).resolves.toEqual(undefined);

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

describe('pruneMessages', () => {
  let prunedMessages: protobufs.Message[];
  const pruneMessageListener = (message: protobufs.Message) => {
    prunedMessages.push(message);
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
  let add5: protobufs.UserDataAddMessage;

  const generateAddWithTimestamp = async (
    fid: number,
    timestamp: number,
    type: protobufs.UserDataType
  ): Promise<protobufs.UserDataAddMessage> => {
    return Factories.UserDataAddMessage.create({ data: { fid, timestamp, userDataBody: { type } } });
  };

  beforeAll(async () => {
    const time = getFarcasterTime()._unsafeUnwrap() - 10;
    add1 = await generateAddWithTimestamp(fid, time + 1, protobufs.UserDataType.USER_DATA_TYPE_PFP);
    add2 = await generateAddWithTimestamp(fid, time + 2, protobufs.UserDataType.USER_DATA_TYPE_DISPLAY);
    add3 = await generateAddWithTimestamp(fid, time + 3, protobufs.UserDataType.USER_DATA_TYPE_BIO);
    add4 = await generateAddWithTimestamp(fid, time + 4, protobufs.UserDataType.USER_DATA_TYPE_LOCATION);
    add5 = await generateAddWithTimestamp(fid, time + 5, protobufs.UserDataType.USER_DATA_TYPE_URL);
  });

  describe('with size limit', () => {
    const sizePrunedStore = new UserDataStore(db, eventHandler, { pruneSizeLimit: 3 });

    test('no-ops when no messages have been merged', async () => {
      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result._unsafeUnwrap()).toEqual(undefined);
      expect(prunedMessages).toEqual([]);
    });

    test('prunes earliest add messages', async () => {
      const messages = [add1, add2, add3, add4, add5];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result._unsafeUnwrap()).toEqual(undefined);

      expect(prunedMessages).toEqual([add1, add2]);

      for (const message of prunedMessages as protobufs.UserDataAddMessage[]) {
        const getAdd = () => sizePrunedStore.getUserDataAdd(fid, message.data.userDataBody.type);
        await expect(getAdd()).rejects.toThrow(HubError);
      }
    });
  });
});
