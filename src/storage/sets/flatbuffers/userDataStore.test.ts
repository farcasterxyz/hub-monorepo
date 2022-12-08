import Factories from '~/test/factories/flatbuffer';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { UserDataAddModel, UserPostfix } from '~/storage/flatbuffers/types';
import { UserDataType } from '~/utils/generated/message_generated';
import UserDataSet from '~/storage/sets/flatbuffers/userDataStore';
import { HubError } from '~/utils/hubErrors';
import { bytesIncrement, getFarcasterTime } from '~/storage/flatbuffers/utils';
import StoreEventHandler from '~/storage/sets/flatbuffers/storeEventHandler';
import UserDataStore from '~/storage/sets/flatbuffers/userDataStore';

const db = jestBinaryRocksDB('flatbuffers.userDataSet.test');
const eventHandler = new StoreEventHandler();
const set = new UserDataSet(db, eventHandler);
const fid = Factories.FID.build();

let addPfp: UserDataAddModel;
let addBio: UserDataAddModel;
let addFname: UserDataAddModel;

beforeAll(async () => {
  const addPfpData = await Factories.UserDataAddData.create({
    fid: Array.from(fid),
    body: Factories.UserDataBody.build({ type: UserDataType.Pfp }),
  });
  addPfp = new MessageModel(
    await Factories.Message.create({ data: Array.from(addPfpData.bb?.bytes() ?? []) })
  ) as UserDataAddModel;

  const addBioData = await Factories.UserDataAddData.create({
    fid: Array.from(fid),
    body: Factories.UserDataBody.build({ type: UserDataType.Bio }),
  });
  addBio = new MessageModel(
    await Factories.Message.create({ data: Array.from(addBioData.bb?.bytes() ?? []) })
  ) as UserDataAddModel;

  const addNameData = await Factories.UserDataAddData.create({
    fid: Array.from(fid),
    body: Factories.UserDataBody.build({ type: UserDataType.Fname }),
  });
  addFname = new MessageModel(
    await Factories.Message.create({ data: Array.from(addNameData.bb?.bytes() ?? []) })
  ) as UserDataAddModel;
});

describe('getUserDataAdd', () => {
  test('fails if missing', async () => {
    await expect(set.getUserDataAdd(fid, UserDataType.Pfp)).rejects.toThrow(HubError);
    await expect(set.getUserDataAdd(fid, UserDataType.Fname)).rejects.toThrow(HubError);
  });

  test('fails if the wrong fid or datatype is provided', async () => {
    const unknownFid = Factories.FID.build();
    await set.merge(addPfp);

    await expect(set.getUserDataAdd(unknownFid, UserDataType.Pfp)).rejects.toThrow(HubError);
    await expect(set.getUserDataAdd(fid, UserDataType.Bio)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await set.merge(addPfp);
    await expect(set.getUserDataAdd(fid, UserDataType.Pfp)).resolves.toEqual(addPfp);
  });
});

describe('getUserDataAddsByUser', () => {
  test('returns user data adds for an fid', async () => {
    await set.merge(addPfp);
    await set.merge(addBio);
    expect(new Set(await set.getUserDataAddsByUser(fid))).toEqual(new Set([addPfp, addBio]));
  });

  test('returns empty array if the wrong fid or datatype is provided', async () => {
    const unknownFid = Factories.FID.build();
    await set.merge(addPfp);
    await expect(set.getUserDataAddsByUser(unknownFid)).resolves.toEqual([]);
  });

  test('returns empty array without messages', async () => {
    await expect(set.getUserDataAddsByUser(fid)).resolves.toEqual([]);
  });
});

describe('merge', () => {
  const assertUserDataExists = async (message: UserDataAddModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.UserDataMessage, message.tsHash())).resolves.toEqual(message);
  };

  const assertUserDataDoesNotExist = async (message: UserDataAddModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.UserDataMessage, message.tsHash())).rejects.toThrow(HubError);
  };

  const assertUserDataAddWins = async (message: UserDataAddModel) => {
    await assertUserDataExists(message);
    await expect(set.getUserDataAdd(fid, message.body()?.type())).resolves.toEqual(message);
  };

  test('fails with invalid message type', async () => {
    const invalidData = await Factories.ReactionAddData.create({ fid: Array.from(fid) });
    const message = await Factories.Message.create({ data: Array.from(invalidData.bb?.bytes() ?? []) });
    await expect(set.merge(new MessageModel(message))).rejects.toThrow(HubError);
  });

  describe('ReactionAdd', () => {
    test('succeeds', async () => {
      await expect(set.merge(addPfp)).resolves.toEqual(undefined);
      await assertUserDataAddWins(addPfp);
    });

    test('succeeds once, even if merged twice', async () => {
      await expect(set.merge(addPfp)).resolves.toEqual(undefined);
      await expect(set.merge(addPfp)).resolves.toEqual(undefined);

      await assertUserDataAddWins(addPfp);
    });

    test('does not conflict with UserDataAdd of different type', async () => {
      await set.merge(addBio);
      await set.merge(addPfp);
      await assertUserDataAddWins(addPfp);
      await assertUserDataAddWins(addBio);
    });

    describe('with a conflicting UserDataAdd with different timestamps', () => {
      let addPfpLater: UserDataAddModel;

      beforeAll(async () => {
        const addData = await Factories.ReactionAddData.create({
          ...addPfp.data.unpack(),
          timestamp: addPfp.timestamp() + 1,
        });
        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
        });
        addPfpLater = new MessageModel(addMessage) as UserDataAddModel;
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(addPfp);
        await expect(set.merge(addPfpLater)).resolves.toEqual(undefined);

        await assertUserDataDoesNotExist(addPfp);
        await assertUserDataAddWins(addPfpLater);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(addPfpLater);
        await expect(set.merge(addPfp)).resolves.toEqual(undefined);

        await assertUserDataDoesNotExist(addPfp);
        await assertUserDataAddWins(addPfpLater);
      });
    });

    describe('with a conflicting UserDataAdd with identical timestamps', () => {
      let addPfpLater: UserDataAddModel;

      beforeAll(async () => {
        const addData = await Factories.ReactionAddData.create({
          ...addPfp.data.unpack(),
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(addPfp.hash().slice())),
        });

        addPfpLater = new MessageModel(addMessage) as UserDataAddModel;
      });

      test('succeeds with a later hash', async () => {
        await set.merge(addPfp);
        await expect(set.merge(addPfpLater)).resolves.toEqual(undefined);

        await assertUserDataDoesNotExist(addPfp);
        await assertUserDataAddWins(addPfpLater);
      });

      test('no-ops with an earlier hash', async () => {
        await set.merge(addPfpLater);
        await expect(set.merge(addPfp)).resolves.toEqual(undefined);

        await assertUserDataDoesNotExist(addPfp);
        await assertUserDataAddWins(addPfpLater);
      });
    });
  });
});

describe('userfname', () => {
  const assertUserFnameExists = async (message: UserDataAddModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.UserDataMessage, message.tsHash())).resolves.toEqual(message);
  };

  const assertUserFnameAddWins = async (message: UserDataAddModel) => {
    await assertUserFnameExists(message);

    await expect(set.getUserDataAdd(fid, message.body()?.type())).resolves.toEqual(message);
  };

  test('succeeds', async () => {
    await expect(set.merge(addFname)).resolves.toEqual(undefined);
    await assertUserFnameAddWins(addFname);
  });

  test('succeeds even if merged twice', async () => {
    await expect(set.merge(addFname)).resolves.toEqual(undefined);
    await expect(set.merge(addFname)).resolves.toEqual(undefined);
    await assertUserFnameAddWins(addFname);
  });

  describe('with a conflicting UserNameAdd with different timestamps', () => {
    let addFnameLater: UserDataAddModel;

    beforeAll(async () => {
      const addData = await Factories.UserDataAddData.create({
        ...addFname.data.unpack(),
        timestamp: addFname.timestamp() + 1,
      });
      const addMessage = await Factories.Message.create({
        data: Array.from(addData.bb?.bytes() ?? []),
      });
      addFnameLater = new MessageModel(addMessage) as UserDataAddModel;
    });

    test('successfully merges with a later timestamp', async () => {
      await set.merge(addFname);
      await expect(set.merge(addFnameLater)).resolves.toEqual(undefined);

      await assertUserFnameAddWins(addFnameLater);
    });

    test('no-ops with an earlier timestamp', async () => {
      await set.merge(addFnameLater);
      await expect(set.merge(addFname)).resolves.toEqual(undefined);

      await assertUserFnameAddWins(addFnameLater);
    });

    test('no-ops with an earlier timestamp, even if merged twice', async () => {
      await set.merge(addFnameLater);
      await expect(set.merge(addFname)).resolves.toEqual(undefined);
      await expect(set.merge(addFname)).resolves.toEqual(undefined);

      await assertUserFnameAddWins(addFnameLater);
    });

    describe('with a conflicting UserNameAdd with identical timestamps', () => {
      let addFnameLater: UserDataAddModel;

      beforeAll(async () => {
        const addData = await Factories.UserDataAddData.create({
          ...addFname.data.unpack(),
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(addFname.hash().slice())),
        });

        addFnameLater = new MessageModel(addMessage) as UserDataAddModel;
      });

      test('succeeds with a later hash', async () => {
        await set.merge(addFname);
        await expect(set.merge(addFnameLater)).resolves.toEqual(undefined);

        await assertUserFnameAddWins(addFnameLater);
      });

      test('no-ops with an earlier hash', async () => {
        await set.merge(addFnameLater);
        await expect(set.merge(addFname)).resolves.toEqual(undefined);

        await assertUserFnameAddWins(addFnameLater);
      });
    });
  });
});

describe('pruneMessages', () => {
  let prunedMessages: MessageModel[];
  const pruneMessageListener = (message: MessageModel) => {
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

  let add1: UserDataAddModel;
  let add2: UserDataAddModel;
  let add3: UserDataAddModel;
  let add4: UserDataAddModel;
  let add5: UserDataAddModel;

  const generateAddWithTimestamp = async (
    fid: Uint8Array,
    timestamp: number,
    type: UserDataType
  ): Promise<UserDataAddModel> => {
    const addBody = Factories.UserDataBody.build({ type });
    const addData = await Factories.UserDataAddData.create({ fid: Array.from(fid), timestamp, body: addBody });
    const addMessage = await Factories.Message.create({ data: Array.from(addData.bb?.bytes() ?? []) });
    return new MessageModel(addMessage) as UserDataAddModel;
  };

  beforeAll(async () => {
    const time = getFarcasterTime() - 10;
    add1 = await generateAddWithTimestamp(fid, time + 1, UserDataType.Pfp);
    add2 = await generateAddWithTimestamp(fid, time + 2, UserDataType.Display);
    add3 = await generateAddWithTimestamp(fid, time + 3, UserDataType.Bio);
    add4 = await generateAddWithTimestamp(fid, time + 4, UserDataType.Location);
    add5 = await generateAddWithTimestamp(fid, time + 5, UserDataType.Url);
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

      for (const message of prunedMessages as UserDataAddModel[]) {
        const getAdd = () => sizePrunedStore.getUserDataAdd(fid, message.body().type());
        await expect(getAdd()).rejects.toThrow(HubError);
      }
    });
  });
});
