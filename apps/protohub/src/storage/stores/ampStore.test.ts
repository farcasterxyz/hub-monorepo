import * as protobufs from '@farcaster/protobufs';
import { bytesDecrement, bytesIncrement, Factories, getFarcasterTime, HubError } from '@farcaster/protoutils';
import { jestRocksDB } from '~/storage/db/jestUtils';
import AmpStore from '~/storage/stores/ampStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import { getMessage, makeTsHash } from '../db/message';
import { UserPostfix } from '../db/types';

const db = jestRocksDB('flatbuffers.ampStore.test');
const eventHandler = new StoreEventHandler();
const store = new AmpStore(db, eventHandler);
const fid = Factories.Fid.build();

const targetFid = Factories.Fid.build();

let ampAdd: protobufs.AmpAddMessage;
let ampRemove: protobufs.AmpRemoveMessage;

beforeAll(async () => {
  ampAdd = await Factories.AmpAddMessage.create({ data: { fid, ampBody: { targetFid } } });
  ampRemove = await Factories.AmpRemoveMessage.create({
    data: { fid, ampBody: { targetFid }, timestamp: ampAdd.data.timestamp },
  });
});

describe('getAmpAdd', () => {
  test('fails if missing', async () => {
    await expect(store.getAmpAdd(fid, targetFid)).rejects.toThrow(HubError);
  });

  test('fails if incorrect values are passed in', async () => {
    await store.merge(ampAdd);

    const invalidFid = Factories.Fid.build();
    await expect(store.getAmpAdd(invalidFid, targetFid)).rejects.toThrow(HubError);

    const invalidUserId = Factories.Fid.build();
    await expect(store.getAmpAdd(fid, invalidUserId)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await store.merge(ampAdd);
    await expect(store.getAmpAdd(fid, targetFid)).resolves.toEqual(ampAdd);
  });
});

describe('getAmpRemove', () => {
  test('fails if missing', async () => {
    await expect(store.getAmpRemove(fid, targetFid)).rejects.toThrow(HubError);
  });

  test('fails if incorrect values are passed in', async () => {
    await store.merge(ampAdd);

    const invalidFid = Factories.Fid.build();
    await expect(store.getAmpRemove(invalidFid, targetFid)).rejects.toThrow(HubError);

    const invalidUserId = Factories.Fid.build();
    await expect(store.getAmpRemove(fid, invalidUserId)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await store.merge(ampRemove);
    await expect(store.getAmpRemove(fid, targetFid)).resolves.toEqual(ampRemove);
  });
});

describe('getAmpAddsByFid', () => {
  test('returns amp adds for an fid', async () => {
    await store.merge(ampAdd);
    await expect(store.getAmpAddsByFid(fid)).resolves.toEqual([ampAdd]);
  });

  test('returns empty array for wrong fid', async () => {
    await store.merge(ampAdd);
    const invalidFid = Factories.Fid.build();
    await expect(store.getAmpAddsByFid(invalidFid)).resolves.toEqual([]);
  });

  test('returns empty array without messages', async () => {
    await expect(store.getAmpAddsByFid(fid)).resolves.toEqual([]);
  });
});

describe('getAmpRemovesByFid', () => {
  test('returns amp removes for an fid', async () => {
    await store.merge(ampRemove);
    await expect(store.getAmpRemovesByFid(fid)).resolves.toEqual([ampRemove]);
  });

  test('returns empty array for wrong fid', async () => {
    await store.merge(ampAdd);
    const invalidFid = Factories.Fid.build();
    await expect(store.getAmpRemovesByFid(invalidFid)).resolves.toEqual([]);
  });

  test('returns empty array without messages', async () => {
    await expect(store.getAmpRemovesByFid(fid)).resolves.toEqual([]);
  });
});

describe('getAmpsByTargetFid', () => {
  test('returns empty array if no amps exist', async () => {
    const byTargetUser = await store.getAmpsByTargetFid(fid);
    expect(byTargetUser).toEqual([]);
  });

  test('returns empty array if amps exist, but for a different user', async () => {
    await store.merge(ampAdd);
    const invalidFid = Factories.Fid.build();
    const byTargetUser = await store.getAmpsByTargetFid(invalidFid);
    expect(byTargetUser).toEqual([]);
  });

  test('returns amps if they exist for the target user', async () => {
    const ampAdd2 = await Factories.AmpAddMessage.create({ data: { ampBody: { targetFid } } });

    await store.merge(ampAdd);
    await store.merge(ampAdd2);

    const byUser = await store.getAmpsByTargetFid(targetFid);
    expect(new Set(byUser)).toEqual(new Set([ampAdd, ampAdd2]));
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

  const assertAmpExists = async (message: protobufs.AmpAddMessage | protobufs.AmpRemoveMessage) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.AmpMessage, tsHash)).resolves.toEqual(message);
  };

  const assertAmpDoesNotExist = async (message: protobufs.AmpAddMessage | protobufs.AmpRemoveMessage) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.AmpMessage, tsHash)).rejects.toThrow(HubError);
  };

  const assertAmpAddWins = async (message: protobufs.AmpAddMessage) => {
    await assertAmpExists(message);
    await expect(store.getAmpAdd(fid, targetFid)).resolves.toEqual(message);
    await expect(store.getAmpsByTargetFid(targetFid)).resolves.toEqual([message]);
    await expect(store.getAmpRemove(fid, targetFid)).rejects.toThrow(HubError);
  };

  const assertAmpRemoveWins = async (message: protobufs.AmpRemoveMessage) => {
    await assertAmpExists(message);
    await expect(store.getAmpRemove(fid, targetFid)).resolves.toEqual(message);
    await expect(store.getAmpsByTargetFid(targetFid)).resolves.toEqual([]);
    await expect(store.getAmpAdd(fid, targetFid)).rejects.toThrow(HubError);
  };

  test('fails with invalid message type', async () => {
    const message = await Factories.ReactionAddMessage.create({ data: { fid } });
    await expect(store.merge(message)).rejects.toThrow(HubError);
  });

  describe('AmpAdd', () => {
    test('succeeds', async () => {
      await expect(store.merge(ampAdd)).resolves.toEqual(undefined);
      await assertAmpAddWins(ampAdd);

      expect(mergeEvents).toEqual([[ampAdd, []]]);
    });

    test('fails with duplicate', async () => {
      await expect(store.merge(ampAdd)).resolves.toEqual(undefined);
      await expect(store.merge(ampAdd)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );

      await assertAmpAddWins(ampAdd);
      expect(mergeEvents).toEqual([[ampAdd, []]]);
    });

    describe('with a conflicting AmpAdd with different timestamps', () => {
      let ampAddLater: protobufs.AmpAddMessage;

      beforeAll(async () => {
        ampAddLater = await Factories.AmpAddMessage.create({
          data: { ...ampAdd.data, timestamp: ampAdd.data.timestamp + 1 },
        });
      });

      test('succeeds with a later timestamp', async () => {
        await store.merge(ampAdd);
        await expect(store.merge(ampAddLater)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampAdd);
        await assertAmpAddWins(ampAddLater);

        expect(mergeEvents).toEqual([
          [ampAdd, []],
          [ampAddLater, [ampAdd]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        await store.merge(ampAddLater);
        await expect(store.merge(ampAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent AmpAdd')
        );

        await assertAmpDoesNotExist(ampAdd);
        await assertAmpAddWins(ampAddLater);
      });
    });

    describe('with a conflicting AmpAdd with identical timestamps', () => {
      let ampAddLater: protobufs.AmpAddMessage;

      beforeAll(async () => {
        ampAddLater = await Factories.AmpAddMessage.create({
          ...ampAdd,
          hash: bytesIncrement(ampAdd.hash),
        });
      });

      test('succeeds with a higher hash', async () => {
        await store.merge(ampAdd);
        await expect(store.merge(ampAddLater)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampAdd);
        await assertAmpAddWins(ampAddLater);

        expect(mergeEvents).toEqual([
          [ampAdd, []],
          [ampAddLater, [ampAdd]],
        ]);
      });

      test('fails with a lower hash', async () => {
        await store.merge(ampAddLater);
        await expect(store.merge(ampAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent AmpAdd')
        );

        await assertAmpDoesNotExist(ampAdd);
        await assertAmpAddWins(ampAddLater);
      });
    });

    describe('with conflicting AmpRemove with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        const ampRemoveEarlier = await Factories.AmpRemoveMessage.create({
          data: { ...ampRemove.data, timestamp: ampAdd.data.timestamp - 1 },
        });

        await store.merge(ampRemoveEarlier);
        await expect(store.merge(ampAdd)).resolves.toEqual(undefined);

        await assertAmpAddWins(ampAdd);
        await assertAmpDoesNotExist(ampRemoveEarlier);

        expect(mergeEvents).toEqual([
          [ampRemoveEarlier, []],
          [ampAdd, [ampRemoveEarlier]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        await store.merge(ampRemove);
        await expect(store.merge(ampAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent AmpRemove')
        );

        await assertAmpRemoveWins(ampRemove);
        await assertAmpDoesNotExist(ampAdd);
      });
    });

    describe('with conflicting AmpRemove with identical timestamps', () => {
      test('fails if remove has a higher hash', async () => {
        const ampRemoveLater = await Factories.AmpRemoveMessage.create({
          data: { ...ampRemove.data, timestamp: ampAdd.data.timestamp },
          hash: bytesIncrement(ampAdd.hash),
        });

        await store.merge(ampRemoveLater);
        await expect(store.merge(ampAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent AmpRemove')
        );

        await assertAmpRemoveWins(ampRemoveLater);
        await assertAmpDoesNotExist(ampAdd);
      });

      test('fails if remove has a lower hash', async () => {
        const ampRemoveEarlier = await Factories.AmpRemoveMessage.create({
          data: { ...ampRemove.data, timestamp: ampAdd.data.timestamp },
          hash: bytesDecrement(ampAdd.hash)._unsafeUnwrap(),
        });

        await store.merge(ampRemoveEarlier);
        await expect(store.merge(ampAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent AmpRemove')
        );

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

    test('fails with duplicate', async () => {
      await expect(store.merge(ampRemove)).resolves.toEqual(undefined);
      await expect(store.merge(ampRemove)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );

      await assertAmpRemoveWins(ampRemove);
    });

    describe('with a conflicting AmpRemove with different timestamps', () => {
      let ampRemoveLater: protobufs.AmpRemoveMessage;

      beforeAll(async () => {
        ampRemoveLater = await Factories.AmpRemoveMessage.create({
          data: { ...ampRemove.data, timestamp: ampRemove.data.timestamp + 1 },
        });
      });

      test('succeeds with a later timestamp', async () => {
        await store.merge(ampRemove);
        await expect(store.merge(ampRemoveLater)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampRemove);
        await assertAmpRemoveWins(ampRemoveLater);

        expect(mergeEvents).toEqual([
          [ampRemove, []],
          [ampRemoveLater, [ampRemove]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        await store.merge(ampRemoveLater);
        await expect(store.merge(ampRemove)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent AmpRemove')
        );

        await assertAmpDoesNotExist(ampRemove);
        await assertAmpRemoveWins(ampRemoveLater);
      });
    });

    describe('with a conflicting AmpRemove with identical timestamps', () => {
      let ampRemoveLater: protobufs.AmpRemoveMessage;

      beforeAll(async () => {
        ampRemoveLater = await Factories.AmpRemoveMessage.create({
          ...ampRemove,
          hash: bytesIncrement(ampRemove.hash),
        });
      });

      test('succeeds with a higher hash', async () => {
        await store.merge(ampRemove);
        await expect(store.merge(ampRemoveLater)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampRemove);
        await assertAmpRemoveWins(ampRemoveLater);

        expect(mergeEvents).toEqual([
          [ampRemove, []],
          [ampRemoveLater, [ampRemove]],
        ]);
      });

      test('fails with a lower hash', async () => {
        await store.merge(ampRemoveLater);
        await expect(store.merge(ampRemove)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent AmpRemove')
        );

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

        expect(mergeEvents).toEqual([
          [ampAdd, []],
          [ampRemove, [ampAdd]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        const ampAddLater = await Factories.AmpAddMessage.create({
          data: { ...ampAdd.data, timestamp: ampRemove.data.timestamp + 1 },
        });

        await store.merge(ampAddLater);
        await expect(store.merge(ampRemove)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent AmpAdd')
        );
        await assertAmpAddWins(ampAddLater);
        await assertAmpDoesNotExist(ampRemove);
      });
    });

    describe('with conflicting AmpAdd with identical timestamps', () => {
      test('succeeds with a lower hash', async () => {
        const ampAddHigherHash = await Factories.AmpAddMessage.create({
          data: {
            ...ampAdd.data,
            timestamp: ampRemove.data.timestamp,
          },
          hash: bytesIncrement(ampRemove.hash),
        });

        await store.merge(ampAddHigherHash);
        await expect(store.merge(ampRemove)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampAddHigherHash);
        await assertAmpRemoveWins(ampRemove);

        expect(mergeEvents).toEqual([
          [ampAddHigherHash, []],
          [ampRemove, [ampAddHigherHash]],
        ]);
      });

      test('succeeds with a higher hash', async () => {
        const ampAddLowerHash = await Factories.AmpAddMessage.create({
          data: {
            ...ampAdd.data,
            timestamp: ampRemove.data.timestamp,
          },
          hash: bytesDecrement(ampRemove.hash)._unsafeUnwrap(),
        });

        await store.merge(ampAddLowerHash);
        await expect(store.merge(ampRemove)).resolves.toEqual(undefined);

        await assertAmpDoesNotExist(ampAddLowerHash);
        await assertAmpRemoveWins(ampRemove);

        expect(mergeEvents).toEqual([
          [ampAddLowerHash, []],
          [ampRemove, [ampAddLowerHash]],
        ]);
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

  let add1: protobufs.AmpAddMessage;
  let add2: protobufs.AmpAddMessage;
  let add3: protobufs.AmpAddMessage;
  let add4: protobufs.AmpAddMessage;
  let add5: protobufs.AmpAddMessage;
  let addOld1: protobufs.AmpAddMessage;
  let addOld2: protobufs.AmpAddMessage;

  let remove1: protobufs.AmpRemoveMessage;
  let remove2: protobufs.AmpRemoveMessage;
  let remove3: protobufs.AmpRemoveMessage;
  let remove4: protobufs.AmpRemoveMessage;
  let remove5: protobufs.AmpRemoveMessage;
  let removeOld3: protobufs.AmpRemoveMessage;

  const generateAddWithTimestamp = async (fid: number, timestamp: number): Promise<protobufs.AmpAddMessage> => {
    return Factories.AmpAddMessage.create({ data: { fid, timestamp } });
  };

  const generateRemoveWithTimestamp = async (
    fid: number,
    timestamp: number,
    targetFid?: number | null
  ): Promise<protobufs.AmpRemoveMessage> => {
    return Factories.AmpRemoveMessage.create({
      data: { fid, timestamp, ampBody: { targetFid: targetFid ?? Factories.Fid.build() } },
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

    remove1 = await generateRemoveWithTimestamp(fid, time + 1, add1.data.ampBody.targetFid);
    remove2 = await generateRemoveWithTimestamp(fid, time + 2, add2.data.ampBody.targetFid);
    remove3 = await generateRemoveWithTimestamp(fid, time + 3, add3.data.ampBody.targetFid);
    remove4 = await generateRemoveWithTimestamp(fid, time + 4, add4.data.ampBody.targetFid);
    remove5 = await generateRemoveWithTimestamp(fid, time + 5, add5.data.ampBody.targetFid);
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

      for (const message of prunedMessages as protobufs.AmpAddMessage[]) {
        const getAdd = () => sizePrunedStore.getAmpAdd(fid, message.data.ampBody.targetFid);
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

      for (const message of prunedMessages as protobufs.AmpRemoveMessage[]) {
        const getRemove = () => sizePrunedStore.getAmpRemove(fid, message.data.ampBody.targetFid);
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

      await expect(timePrunedStore.getAmpAdd(fid, addOld1.data.ampBody.targetFid)).rejects.toThrow(HubError);
      await expect(timePrunedStore.getAmpAdd(fid, addOld2.data.ampBody.targetFid)).rejects.toThrow(HubError);
      await expect(timePrunedStore.getAmpRemove(fid, removeOld3.data.ampBody.targetFid)).rejects.toThrow(HubError);
    });
  });
});
