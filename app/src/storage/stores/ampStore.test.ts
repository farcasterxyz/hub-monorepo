import Factories from '~/flatbuffers/factories';
import { MessageType, UserId } from '~/flatbuffers/generated/message_generated';
import MessageModel from '~/flatbuffers/models/messageModel';
import { AmpAddModel, AmpRemoveModel, UserPostfix } from '~/flatbuffers/models/types';
import { bytesDecrement, bytesIncrement } from '~/flatbuffers/utils/bytes';
import { getFarcasterTime } from '~/flatbuffers/utils/time';
import { jestRocksDB } from '~/storage/db/jestUtils';
import AmpStore from '~/storage/stores/ampStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import { HubError } from '~/utils/hubErrors';

const db = jestRocksDB('flatbuffers.ampStore.test');
const eventHandler = new StoreEventHandler();
const store = new AmpStore(db, eventHandler);
const fid = Factories.FID.build();

const userId = Factories.FID.build();
let ampAdd: AmpAddModel;
let ampRemove: AmpRemoveModel;

beforeAll(async () => {
  const ampBody = Factories.AmpBody.build({ user: Factories.UserId.build({ fid: Array.from(userId) }) });

  const addData = await Factories.AmpAddData.create({ fid: Array.from(fid), body: ampBody });
  const addMessage = await Factories.Message.create({ data: Array.from(addData.bb?.bytes() ?? []) });
  ampAdd = new MessageModel(addMessage) as AmpAddModel;

  const removeData = await Factories.AmpRemoveData.create({
    fid: Array.from(fid),
    body: ampBody,
    timestamp: addData.timestamp() + 1,
  });
  const removeMessage = await Factories.Message.create({ data: Array.from(removeData.bb?.bytes() ?? []) });
  ampRemove = new MessageModel(removeMessage) as AmpRemoveModel;
});

describe('getAmpAdd', () => {
  test('fails if missing', async () => {
    await expect(store.getAmpAdd(fid, userId)).rejects.toThrow(HubError);
  });

  test('fails if incorrect values are passed in', async () => {
    await store.merge(ampAdd);

    const invalidFid = Factories.FID.build();
    await expect(store.getAmpAdd(invalidFid, userId)).rejects.toThrow(HubError);

    const invalidUserId = Factories.FID.build();
    await expect(store.getAmpAdd(fid, invalidUserId)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await store.merge(ampAdd);
    await expect(store.getAmpAdd(fid, userId)).resolves.toEqual(ampAdd);
  });
});

describe('getAmpRemove', () => {
  test('fails if missing', async () => {
    await expect(store.getAmpRemove(fid, userId)).rejects.toThrow(HubError);
  });

  test('fails if incorrect values are passed in', async () => {
    await store.merge(ampAdd);

    const invalidFid = Factories.FID.build();
    await expect(store.getAmpRemove(invalidFid, userId)).rejects.toThrow(HubError);

    const invalidUserId = Factories.FID.build();
    await expect(store.getAmpRemove(fid, invalidUserId)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await store.merge(ampRemove);
    await expect(store.getAmpRemove(fid, userId)).resolves.toEqual(ampRemove);
  });
});

describe('getAmpAddsByUser', () => {
  test('returns amp adds for an fid', async () => {
    await store.merge(ampAdd);
    await expect(store.getAmpAddsByUser(fid)).resolves.toEqual([ampAdd]);
  });

  test('returns empty array for wrong fid', async () => {
    await store.merge(ampAdd);
    const invalidFid = Factories.FID.build();
    await expect(store.getAmpAddsByUser(invalidFid)).resolves.toEqual([]);
  });

  test('returns empty array without messages', async () => {
    await expect(store.getAmpAddsByUser(fid)).resolves.toEqual([]);
  });
});

describe('getAmpRemovesByUser', () => {
  test('returns amp removes for an fid', async () => {
    await store.merge(ampRemove);
    await expect(store.getAmpRemovesByUser(fid)).resolves.toEqual([ampRemove]);
  });

  test('returns empty array for wrong fid', async () => {
    await store.merge(ampAdd);
    const invalidFid = Factories.FID.build();
    await expect(store.getAmpRemovesByUser(invalidFid)).resolves.toEqual([]);
  });

  test('returns empty array without messages', async () => {
    await expect(store.getAmpRemovesByUser(fid)).resolves.toEqual([]);
  });
});

describe('getAmpsByTargetUser', () => {
  test('returns empty array if no amps exist', async () => {
    const byTargetUser = await store.getAmpsByTargetUser(fid);
    expect(byTargetUser).toEqual([]);
  });

  test('returns empty array if amps exist, but for a different user', async () => {
    await store.merge(ampAdd);
    const invalidFid = Factories.FID.build();
    const byTargetUser = await store.getAmpsByTargetUser(invalidFid);
    expect(byTargetUser).toEqual([]);
  });

  test('returns amps if they exist for the target user', async () => {
    const addData = await Factories.AmpAddData.create({
      body: ampAdd.body().unpack() || null,
    });
    const addMessage = await Factories.Message.create({
      data: Array.from(addData.bb?.bytes() ?? []),
    });
    const ampAdd2 = new MessageModel(addMessage) as AmpAddModel;

    await store.merge(ampAdd);
    await store.merge(ampAdd2);

    const byUser = await store.getAmpsByTargetUser(userId);
    expect(new Set(byUser)).toEqual(new Set([ampAdd, ampAdd2]));
  });
});

describe('merge', () => {
  const assertAmpExists = async (message: AmpAddModel | AmpRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.AmpMessage, message.tsHash())).resolves.toEqual(message);
  };

  const assertAmpDoesNotExist = async (message: AmpAddModel | AmpRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.AmpMessage, message.tsHash())).rejects.toThrow(HubError);
  };

  const assertAmpAddWins = async (message: AmpAddModel) => {
    await assertAmpExists(message);
    await expect(store.getAmpAdd(fid, userId)).resolves.toEqual(message);
    await expect(store.getAmpsByTargetUser(userId)).resolves.toEqual([message]);
    await expect(store.getAmpRemove(fid, userId)).rejects.toThrow(HubError);
  };

  const assertAmpRemoveWins = async (message: AmpRemoveModel) => {
    await assertAmpExists(message);
    await expect(store.getAmpRemove(fid, userId)).resolves.toEqual(message);
    await expect(store.getAmpsByTargetUser(userId)).resolves.toEqual([]);
    await expect(store.getAmpAdd(fid, userId)).rejects.toThrow(HubError);
  };

  test('fails with invalid message type', async () => {
    const invalidData = await Factories.ReactionAddData.create({ fid: Array.from(fid) });
    const message = await Factories.Message.create({ data: Array.from(invalidData.bb?.bytes() ?? []) });
    await expect(store.merge(new MessageModel(message))).rejects.toThrow(HubError);
  });

  describe('AmpAdd', () => {
    test('succeeds', async () => {
      await expect(store.merge(ampAdd)).resolves.toEqual(undefined);
      await assertAmpAddWins(ampAdd);
    });

    test('succeeds once, even if merged twice', async () => {
      await expect(store.merge(ampAdd)).resolves.toEqual(undefined);
      await expect(store.merge(ampAdd)).resolves.toEqual(undefined);

      await assertAmpAddWins(ampAdd);
    });

    describe('with a conflicting AmpAdd with different timestamps', () => {
      let ampAddLater: AmpAddModel;

      beforeAll(async () => {
        const addData = await Factories.AmpAddData.create({
          ...ampAdd.data.unpack(),
          timestamp: ampAdd.timestamp() + 1,
        });
        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
        });
        ampAddLater = new MessageModel(addMessage) as AmpAddModel;
      });

      test('succeeds with a later timestamp', async () => {
        await store.merge(ampAdd);
        await expect(store.merge(ampAddLater)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampAdd);
        await assertAmpAddWins(ampAddLater);
      });

      test('no-ops with an earlier timestamp', async () => {
        await store.merge(ampAddLater);
        await expect(store.merge(ampAdd)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampAdd);
        await assertAmpAddWins(ampAddLater);
      });
    });

    describe('with a conflicting AmpAdd with identical timestamps', () => {
      let ampAddLater: AmpAddModel;

      beforeAll(async () => {
        const addData = await Factories.AmpAddData.create({
          ...ampAdd.data.unpack(),
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(ampAdd.hash().slice())),
        });

        ampAddLater = new MessageModel(addMessage) as AmpAddModel;
      });

      test('succeeds with a later hash', async () => {
        await store.merge(ampAdd);
        await expect(store.merge(ampAddLater)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampAdd);
        await assertAmpAddWins(ampAddLater);
      });

      test('no-ops with an earlier hash', async () => {
        await store.merge(ampAddLater);
        await expect(store.merge(ampAdd)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampAdd);
        await assertAmpAddWins(ampAddLater);
      });
    });

    describe('with conflicting AmpRemove with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        const removeData = await Factories.AmpRemoveData.create({
          ...ampRemove.data.unpack(),
          timestamp: ampAdd.timestamp() - 1,
        });

        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
        });

        const ampRemoveEarlier = new MessageModel(removeMessage) as AmpRemoveModel;

        await store.merge(ampRemoveEarlier);
        await expect(store.merge(ampAdd)).resolves.toEqual(undefined);

        await assertAmpAddWins(ampAdd);
        await assertAmpDoesNotExist(ampRemoveEarlier);
      });

      test('no-ops with an earlier timestamp', async () => {
        await store.merge(ampRemove);
        await expect(store.merge(ampAdd)).resolves.toEqual(undefined);

        await assertAmpRemoveWins(ampRemove);
        await assertAmpDoesNotExist(ampAdd);
      });
    });

    describe('with conflicting AmpRemove with identical timestamps', () => {
      test('no-ops if remove has a later hash', async () => {
        const removeData = await Factories.AmpRemoveData.create({
          ...ampRemove.data.unpack(),
          timestamp: ampAdd.timestamp(),
        });

        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(ampAdd.hash().slice())),
        });

        const ampRemoveLater = new MessageModel(removeMessage) as AmpRemoveModel;

        await store.merge(ampRemoveLater);
        await expect(store.merge(ampAdd)).resolves.toEqual(undefined);

        await assertAmpRemoveWins(ampRemoveLater);
        await assertAmpDoesNotExist(ampAdd);
      });

      test('succeeds if remove has an earlier hash', async () => {
        const removeData = await Factories.AmpRemoveData.create({
          ...ampRemove.data.unpack(),
          timestamp: ampAdd.timestamp(),
        });

        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),

          // TODO: this slice doesn't seem necessary, and its also in reactions
          // TODO: rename set to store in reactions, signer and other places
          hash: Array.from(bytesDecrement(ampAdd.hash().slice())),
        });

        const ampRemoveEarlier = new MessageModel(removeMessage) as AmpRemoveModel;

        await store.merge(ampRemoveEarlier);
        await expect(store.merge(ampAdd)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampAdd);
        await assertAmpRemoveWins(ampRemoveEarlier);
      });
    });
  });

  describe('AmpRemove', () => {
    test('succeeds', async () => {
      await expect(store.merge(ampRemove)).resolves.toEqual(undefined);

      await assertAmpRemoveWins(ampRemove);
    });

    test('succeeds once, even if merged twice', async () => {
      await expect(store.merge(ampRemove)).resolves.toEqual(undefined);
      await expect(store.merge(ampRemove)).resolves.toEqual(undefined);

      await assertAmpRemoveWins(ampRemove);
    });

    describe('with a conflicting AmpRemove with different timestamps', () => {
      let ampRemoveLater: AmpRemoveModel;

      beforeAll(async () => {
        const ampRemoveData = await Factories.AmpRemoveData.create({
          ...ampRemove.data.unpack(),
          timestamp: ampRemove.timestamp() + 1,
        });
        const ampRemoveMessage = await Factories.Message.create({
          data: Array.from(ampRemoveData.bb?.bytes() ?? []),
        });
        ampRemoveLater = new MessageModel(ampRemoveMessage) as AmpRemoveModel;
      });

      test('succeeds with a later timestamp', async () => {
        await store.merge(ampRemove);
        await expect(store.merge(ampRemoveLater)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampRemove);
        await assertAmpRemoveWins(ampRemoveLater);
      });

      test('no-ops with an earlier timestamp', async () => {
        await store.merge(ampRemoveLater);
        await expect(store.merge(ampRemove)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampRemove);
        await assertAmpRemoveWins(ampRemoveLater);
      });
    });

    describe('with a conflicting AmpRemove with identical timestamps', () => {
      let ampRemoveLater: AmpRemoveModel;

      beforeAll(async () => {
        const ampRemoveData = await Factories.AmpRemoveData.create({
          ...ampRemove.data.unpack(),
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(ampRemoveData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(ampRemove.hash().slice())),
        });

        ampRemoveLater = new MessageModel(addMessage) as AmpRemoveModel;
      });

      test('succeeds with a later hash', async () => {
        await store.merge(ampRemove);
        await expect(store.merge(ampRemoveLater)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampRemove);
        await assertAmpRemoveWins(ampRemoveLater);
      });

      test('no-ops with an earlier hash', async () => {
        await store.merge(ampRemoveLater);
        await expect(store.merge(ampRemove)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampRemove);
        await assertAmpRemoveWins(ampRemoveLater);
      });
    });

    describe('with conflicting AmpAdd with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        await store.merge(ampAdd);
        await expect(store.merge(ampRemove)).resolves.toEqual(undefined);
        await assertAmpRemoveWins(ampRemove);
        await assertAmpDoesNotExist(ampAdd);
      });

      test('no-ops with an earlier timestamp', async () => {
        const addData = await Factories.AmpAddData.create({
          ...ampRemove.data.unpack(),
          timestamp: ampRemove.timestamp() + 1,
          type: MessageType.AmpAdd,
        });
        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
        });
        const ampAddLater = new MessageModel(addMessage) as AmpAddModel;
        await store.merge(ampAddLater);
        await expect(store.merge(ampRemove)).resolves.toEqual(undefined);
        await assertAmpAddWins(ampAddLater);
        await assertAmpDoesNotExist(ampRemove);
      });
    });

    describe('with conflicting AmpAdd with identical timestamps', () => {
      test('succeeds with an earlier hash', async () => {
        const addData = await Factories.AmpAddData.create({
          ...ampRemove.data.unpack(),
          type: MessageType.AmpAdd,
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(ampRemove.hash().slice())),
        });
        const ampAddLater = new MessageModel(addMessage) as AmpAddModel;

        await store.merge(ampAddLater);
        await expect(store.merge(ampRemove)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampAddLater);
        await assertAmpRemoveWins(ampRemove);
      });

      test('succeeds with a later hash', async () => {
        const removeData = await Factories.AmpAddData.create({
          ...ampRemove.data.unpack(),
        });

        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
          hash: Array.from(bytesDecrement(ampRemove.hash().slice())),
        });

        const ampRemoveEarlier = new MessageModel(removeMessage) as AmpRemoveModel;

        await store.merge(ampRemoveEarlier);
        await expect(store.merge(ampRemove)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampRemoveEarlier);
        await assertAmpRemoveWins(ampRemove);
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

  let add1: AmpAddModel;
  let add2: AmpAddModel;
  let add3: AmpAddModel;
  let add4: AmpAddModel;
  let add5: AmpAddModel;
  let addOld1: AmpAddModel;
  let addOld2: AmpAddModel;

  let remove1: AmpRemoveModel;
  let remove2: AmpRemoveModel;
  let remove3: AmpRemoveModel;
  let remove4: AmpRemoveModel;
  let remove5: AmpRemoveModel;
  let removeOld3: AmpRemoveModel;

  const generateAddWithTimestamp = async (fid: Uint8Array, timestamp: number): Promise<AmpAddModel> => {
    const addData = await Factories.AmpAddData.create({ fid: Array.from(fid), timestamp });
    const addMessage = await Factories.Message.create({ data: Array.from(addData.bb?.bytes() ?? []) });
    return new MessageModel(addMessage) as AmpAddModel;
  };

  const generateRemoveWithTimestamp = async (
    fid: Uint8Array,
    timestamp: number,
    user?: UserId | null
  ): Promise<AmpRemoveModel> => {
    const removeBody = await Factories.AmpBody.build(user ? { user: user.unpack() } : {});
    const removeData = await Factories.AmpRemoveData.create({ fid: Array.from(fid), timestamp, body: removeBody });
    const removeMessage = await Factories.Message.create({ data: Array.from(removeData.bb?.bytes() ?? []) });
    return new MessageModel(removeMessage) as AmpRemoveModel;
  };

  beforeAll(async () => {
    const time = getFarcasterTime() - 10;
    add1 = await generateAddWithTimestamp(fid, time + 1);
    add2 = await generateAddWithTimestamp(fid, time + 2);
    add3 = await generateAddWithTimestamp(fid, time + 3);
    add4 = await generateAddWithTimestamp(fid, time + 4);
    add5 = await generateAddWithTimestamp(fid, time + 5);
    addOld1 = await generateAddWithTimestamp(fid, time - 60 * 60);
    addOld2 = await generateAddWithTimestamp(fid, time - 60 * 60 + 1);

    remove1 = await generateRemoveWithTimestamp(fid, time + 1, add1.body().user());
    remove2 = await generateRemoveWithTimestamp(fid, time + 2, add2.body().user());
    remove3 = await generateRemoveWithTimestamp(fid, time + 3, add3.body().user());
    remove4 = await generateRemoveWithTimestamp(fid, time + 4, add4.body().user());
    remove5 = await generateRemoveWithTimestamp(fid, time + 5, add5.body().user());
    removeOld3 = await generateRemoveWithTimestamp(fid, time - 60 * 60 + 2);
  });

  describe('with size limit', () => {
    const sizePrunedStore = new AmpStore(db, eventHandler, { pruneSizeLimit: 3 });

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

      for (const message of prunedMessages as AmpAddModel[]) {
        const getAdd = () => sizePrunedStore.getAmpAdd(fid, message.body().user()?.fidArray() ?? new Uint8Array());
        await expect(getAdd()).rejects.toThrow(HubError);
      }
    });

    test('prunes earliest remove messages', async () => {
      const messages = [remove1, remove2, remove3, remove4, remove5];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result._unsafeUnwrap()).toEqual(undefined);

      expect(prunedMessages).toEqual([remove1, remove2]);

      for (const message of prunedMessages as AmpRemoveModel[]) {
        const getRemove = () =>
          sizePrunedStore.getAmpRemove(fid, message.body().user()?.fidArray() ?? new Uint8Array());
        await expect(getRemove()).rejects.toThrow(HubError);
      }
    });

    test('prunes earliest messages', async () => {
      const messages = [add1, remove2, add3, remove4, add5];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result._unsafeUnwrap()).toEqual(undefined);

      expect(prunedMessages).toEqual([add1, remove2]);
    });

    test('no-ops when adds have been removed', async () => {
      const messages = [add1, remove1, add2, remove2, add3];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result._unsafeUnwrap()).toEqual(undefined);

      expect(prunedMessages).toEqual([]);
    });
  });

  describe('with time limit', () => {
    const timePrunedStore = new AmpStore(db, eventHandler, { pruneTimeLimit: 60 * 60 - 1 });

    test('prunes earliest messages', async () => {
      const messages = [add1, remove2, addOld1, addOld2, removeOld3];
      for (const message of messages) {
        await timePrunedStore.merge(message);
      }

      const result = await timePrunedStore.pruneMessages(fid);
      expect(result._unsafeUnwrap()).toEqual(undefined);

      expect(prunedMessages).toEqual([addOld1, addOld2, removeOld3]);

      await expect(
        timePrunedStore.getAmpAdd(fid, addOld1.body().user()?.fidArray() ?? new Uint8Array())
      ).rejects.toThrow(HubError);
      await expect(
        timePrunedStore.getAmpAdd(fid, addOld2.body().user()?.fidArray() ?? new Uint8Array())
      ).rejects.toThrow(HubError);
      await expect(
        timePrunedStore.getAmpRemove(fid, removeOld3.body().user()?.fidArray() ?? new Uint8Array())
      ).rejects.toThrow(HubError);
    });
  });
});
