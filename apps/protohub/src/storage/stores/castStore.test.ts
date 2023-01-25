import * as protobufs from '@farcaster/protobufs';
import { bytesDecrement, bytesIncrement, Factories, getFarcasterTime, HubError } from '@farcaster/protoutils';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { getMessage, makeTsHash } from '~/storage/db/message';
import { UserPostfix } from '~/storage/db/types';
import CastStore from '~/storage/stores/castStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';

const db = jestRocksDB('flatbuffers.castStore.test');
const eventHandler = new StoreEventHandler();
const store = new CastStore(db, eventHandler);
const fid = Factories.Fid.build();

let castAdd: protobufs.CastAddMessage;
let castRemove: protobufs.CastRemoveMessage;
let parentCastId: protobufs.CastId;

beforeAll(async () => {
  parentCastId = Factories.CastId.build();
  castAdd = await Factories.CastAddMessage.create({ data: { fid, castAddBody: { parentCastId } } });
  castRemove = await Factories.CastRemoveMessage.create({
    data: { fid, castRemoveBody: { targetHash: castAdd.hash } },
  });
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
    await expect(store.merge(castRemove)).resolves.toEqual(undefined);
    await expect(store.getCastRemove(fid, castAdd.hash)).resolves.toEqual(castRemove);
  });
});

describe('getCastAddsByFid', () => {
  test('returns cast adds for an fid', async () => {
    await store.merge(castAdd);
    await expect(store.getCastAddsByFid(fid)).resolves.toEqual([castAdd]);
  });

  test('fails if incorrect values are passed in', async () => {
    await store.merge(castAdd);

    const invalidFid = Factories.Fid.build();
    await expect(store.getCastAddsByFid(invalidFid)).resolves.toEqual([]);
  });

  test('returns empty array without messages', async () => {
    await expect(store.getCastAddsByFid(fid)).resolves.toEqual([]);
  });
});

describe('getCastRemovesByFid', () => {
  test('returns cast removes for an fid', async () => {
    await store.merge(castRemove);
    await expect(store.getCastRemovesByFid(fid)).resolves.toEqual([castRemove]);
  });

  test('fails if incorrect values are passed in', async () => {
    await store.merge(castRemove);

    const invalidFid = Factories.Fid.build();
    await expect(store.getCastRemovesByFid(invalidFid)).resolves.toEqual([]);
  });

  test('returns empty array without messages', async () => {
    await expect(store.getCastRemovesByFid(fid)).resolves.toEqual([]);
  });
});

describe('getCastsByParent', () => {
  test('returns empty array if no casts exist', async () => {
    const byTargetUser = await store.getCastsByParent(parentCastId);
    expect(byTargetUser).toEqual([]);
  });

  test('returns empty array if casts exist, but for a different cast id', async () => {
    await store.merge(castAdd);
    expect(await store.getCastsByParent(Factories.CastId.build())).toEqual([]);
  });

  test('returns casts that reply to a parent cast', async () => {
    const castAddSameParent = await Factories.CastAddMessage.create({ data: { castAddBody: { parentCastId } } });

    await store.merge(castAdd);
    await store.merge(castAddSameParent);

    const byParent = await store.getCastsByParent(parentCastId);
    expect(new Set(byParent)).toEqual(new Set([castAdd, castAddSameParent]));
  });
});

describe('getCastsByMention', () => {
  test('returns empty array if no casts exist', async () => {
    const byTargetUser = await store.getCastsByMention(Factories.Fid.build());
    expect(byTargetUser).toEqual([]);
  });

  test('returns empty array if casts exist, but for a different fid or hash', async () => {
    await store.merge(castAdd);
    expect(await store.getCastsByMention(Factories.Fid.build())).toEqual([]);
  });

  test('returns casts that mention an fid', async () => {
    await store.merge(castAdd);
    expect(castAdd.data.castAddBody.mentions.length).toBeGreaterThan(0);
    for (const mentionFid of castAdd.data.castAddBody.mentions) {
      await expect(store.getCastsByMention(mentionFid)).resolves.toEqual([castAdd]);
    }
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

  const assetMessageExists = async (message: protobufs.CastAddMessage | protobufs.CastRemoveMessage) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.CastMessage, tsHash)).resolves.toEqual(message);
  };

  const assertMessageDoesNotExist = async (message: protobufs.CastAddMessage | protobufs.CastRemoveMessage) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.CastMessage, tsHash)).rejects.toThrow(HubError);
  };

  const assertCastAddWins = async (message: protobufs.CastAddMessage, removeMessage?: protobufs.CastRemoveMessage) => {
    await assetMessageExists(message);
    await expect(store.getCastAdd(fid, message.hash)).resolves.toEqual(message);
    for (const mentionFid of message.data.castAddBody.mentions) {
      await expect(store.getCastsByMention(mentionFid)).resolves.toEqual([message]);
    }
    if (message.data.castAddBody.parentCastId) {
      await expect(store.getCastsByParent(message.data.castAddBody.parentCastId)).resolves.toEqual([message]);
    }

    if (removeMessage) {
      await expect(store.getCastRemove(fid, removeMessage.data.castRemoveBody.targetHash)).rejects.toThrow(HubError);
      await assertMessageDoesNotExist(removeMessage);
    }
  };

  const assertCastRemoveWins = async (message: protobufs.CastRemoveMessage) => {
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
      await expect(store.merge(castAdd)).resolves.toEqual(undefined);
      await assertCastAddWins(castAdd);

      expect(mergeEvents).toEqual([[castAdd, []]]);
    });

    test('fails if merged twice', async () => {
      await expect(store.merge(castAdd)).resolves.toEqual(undefined);
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
          hash: bytesIncrement(castAdd.hash),
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
      await expect(store.merge(castRemove)).resolves.toEqual(undefined);

      await assertCastRemoveWins(castRemove);
      await assertMessageDoesNotExist(castAdd);

      expect(mergeEvents).toEqual([
        [castAdd, []],
        [castRemove, [castAdd]],
      ]);
    });

    test('fails if merged twice', async () => {
      await expect(store.merge(castRemove)).resolves.toEqual(undefined);
      await expect(store.merge(castRemove)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );

      await assertCastRemoveWins(castRemove);

      expect(mergeEvents).toEqual([[castRemove, []]]);
    });

    describe('with a conflicting CastRemove with different timestamps', () => {
      let castRemoveLater: protobufs.CastRemoveMessage;

      beforeAll(async () => {
        castRemoveLater = await Factories.CastRemoveMessage.create({
          data: { ...castRemove.data, timestamp: castRemove.data.timestamp + 1 },
        });
      });

      test('succeeds with a later timestamp', async () => {
        await store.merge(castRemove);
        await expect(store.merge(castRemoveLater)).resolves.toEqual(undefined);

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
          new HubError('bad_request.conflict', 'message conflicts with a more recent CastRemove')
        );

        await assertMessageDoesNotExist(castRemove);
        await assertCastRemoveWins(castRemoveLater);
      });
    });

    describe('with a conflicting CastRemove with identical timestamps', () => {
      let castRemoveLater: protobufs.CastRemoveMessage;

      beforeAll(async () => {
        castRemoveLater = await Factories.CastRemoveMessage.create({
          ...castRemove,
          hash: bytesIncrement(castRemove.hash),
        });
      });

      test('succeeds with a later hash', async () => {
        await store.merge(castRemove);
        await expect(store.merge(castRemoveLater)).resolves.toEqual(undefined);

        await assertMessageDoesNotExist(castRemove);
        await assertCastRemoveWins(castRemoveLater);

        expect(mergeEvents).toEqual([
          [castRemove, []],
          [castRemoveLater, [castRemove]],
        ]);
      });

      test('fails with an earlier hash', async () => {
        await store.merge(castRemoveLater);
        await expect(store.merge(castRemove)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent CastRemove')
        );

        await assertMessageDoesNotExist(castRemove);
        await assertCastRemoveWins(castRemoveLater);
      });
    });

    describe('with conflicting CastAdd with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        await store.merge(castAdd);
        await expect(store.merge(castRemove)).resolves.toEqual(undefined);
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
        await expect(store.merge(castRemoveEarlier)).resolves.toEqual(undefined);
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
        await expect(store.merge(castRemoveEarlier)).resolves.toEqual(undefined);

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
          hash: bytesIncrement(castAdd.hash),
        });

        await store.merge(castAdd);
        await expect(store.merge(castRemoveLater)).resolves.toEqual(undefined);

        await assertMessageDoesNotExist(castAdd);
        await assertCastRemoveWins(castRemoveLater);

        expect(mergeEvents).toEqual([
          [castAdd, []],
          [castRemoveLater, [castAdd]],
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

  let add1: protobufs.CastAddMessage;
  let add2: protobufs.CastAddMessage;
  let add3: protobufs.CastAddMessage;
  let add4: protobufs.CastAddMessage;
  let add5: protobufs.CastAddMessage;
  let addOld1: protobufs.CastAddMessage;
  let addOld2: protobufs.CastAddMessage;

  let remove1: protobufs.CastRemoveMessage;
  let remove2: protobufs.CastRemoveMessage;
  let remove3: protobufs.CastRemoveMessage;
  let remove4: protobufs.CastRemoveMessage;
  let remove5: protobufs.CastRemoveMessage;
  let removeOld3: protobufs.CastRemoveMessage;

  const generateAddWithTimestamp = async (fid: number, timestamp: number): Promise<protobufs.CastAddMessage> => {
    return Factories.CastAddMessage.create({
      data: { fid, timestamp },
    });
  };

  const generateRemoveWithTimestamp = async (
    fid: number,
    timestamp: number,
    target?: protobufs.CastAddMessage
  ): Promise<protobufs.CastRemoveMessage> => {
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
    addOld2 = await generateAddWithTimestamp(fid, time - 60 * 60 + 1);

    remove1 = await generateRemoveWithTimestamp(fid, time + 1, add1);
    remove2 = await generateRemoveWithTimestamp(fid, time + 2, add2);
    remove3 = await generateRemoveWithTimestamp(fid, time + 3, add3);
    remove4 = await generateRemoveWithTimestamp(fid, time + 4, add4);
    remove5 = await generateRemoveWithTimestamp(fid, time + 5, add5);
    removeOld3 = await generateRemoveWithTimestamp(fid, time - 60 * 60 + 2);
  });

  describe('with size limit', () => {
    const sizePrunedStore = new CastStore(db, eventHandler, { pruneSizeLimit: 3 });

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

      for (const message of prunedMessages as protobufs.CastAddMessage[]) {
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
      expect(result._unsafeUnwrap()).toEqual(undefined);

      expect(prunedMessages).toEqual([remove1, remove2]);

      for (const message of prunedMessages as protobufs.CastRemoveMessage[]) {
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
    const timePrunedStore = new CastStore(db, eventHandler, { pruneTimeLimit: 60 * 60 - 1 });

    test('prunes earliest messages', async () => {
      const messages = [add1, remove2, addOld1, addOld2, removeOld3];
      for (const message of messages) {
        await timePrunedStore.merge(message);
      }

      const result = await timePrunedStore.pruneMessages(fid);
      expect(result._unsafeUnwrap()).toEqual(undefined);

      expect(prunedMessages).toEqual([addOld1, addOld2, removeOld3]);

      await expect(timePrunedStore.getCastAdd(fid, addOld1.hash)).rejects.toThrow(HubError);
      await expect(timePrunedStore.getCastAdd(fid, addOld2.hash)).rejects.toThrow(HubError);
      await expect(timePrunedStore.getCastRemove(fid, removeOld3.data.castRemoveBody.targetHash)).rejects.toThrow(
        HubError
      );
    });
  });
});
