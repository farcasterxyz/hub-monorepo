import { CastId } from '@hub/flatbuffers';
import Factories from '~/flatbuffers/factories';
import MessageModel from '~/flatbuffers/models/messageModel';
import { CastAddModel, CastRemoveModel, UserPostfix } from '~/flatbuffers/models/types';
import { bytesDecrement, bytesIncrement } from '~/flatbuffers/utils/bytes';
import { getFarcasterTime } from '~/flatbuffers/utils/time';
import { jestRocksDB } from '~/storage/db/jestUtils';
import CastStore from '~/storage/stores/castStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import { HubError } from '~/utils/hubErrors';

const db = jestRocksDB('flatbuffers.castStore.test');
const eventHandler = new StoreEventHandler();
const store = new CastStore(db, eventHandler);
const fid = Factories.FID.build();

let castAdd: CastAddModel;
let castRemove: CastRemoveModel;
let parentFid: Uint8Array;
let parentTsHash: Uint8Array;

beforeAll(async () => {
  const addData = await Factories.CastAddData.create({ fid: Array.from(fid) });
  const addMessage = await Factories.Message.create({ data: Array.from(addData.bb?.bytes() ?? []) });
  castAdd = new MessageModel(addMessage) as CastAddModel;

  const parent = castAdd.body().parent(new CastId()) as CastId;
  parentFid = parent?.fidArray() ?? new Uint8Array();
  parentTsHash = parent?.tsHashArray() ?? new Uint8Array();

  const castRemoveData = await Factories.CastRemoveData.create({
    fid: Array.from(fid),
    body: Factories.CastRemoveBody.build({ targetTsHash: Array.from(castAdd.tsHash()) }),
  });
  const castRemoveMessage = await Factories.Message.create({ data: Array.from(castRemoveData.bb?.bytes() ?? []) });
  castRemove = new MessageModel(castRemoveMessage) as CastRemoveModel;
});

describe('getCastAdd', () => {
  const getCastAdd = () => store.getCastAdd(fid, castAdd.tsHash());

  test('fails if missing', async () => {
    await expect(getCastAdd()).rejects.toThrow(HubError);
  });

  test('fails if incorrect values are passed in', async () => {
    await store.merge(castAdd);

    const invalidFid = Factories.FID.build();
    await expect(store.getCastAdd(invalidFid, castAdd.tsHash())).rejects.toThrow(HubError);

    const invalidTsHash = bytesIncrement(castAdd.tsHash().slice());
    await expect(store.getCastAdd(fid, invalidTsHash)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await store.merge(castAdd);
    await expect(getCastAdd()).resolves.toEqual(castAdd);
  });
});

describe('getCastRemove', () => {
  const getCastRemove = () => store.getCastRemove(fid, castAdd.tsHash());

  test('fails if missing', async () => {
    await expect(getCastRemove()).rejects.toThrow(HubError);
  });

  test('fails if incorrect values are passed in', async () => {
    await store.merge(castRemove);

    const invalidFid = Factories.FID.build();
    await expect(store.getCastAdd(invalidFid, castRemove.tsHash())).rejects.toThrow(HubError);

    const invalidTsHash = bytesIncrement(castRemove.tsHash().slice());
    await expect(store.getCastAdd(fid, invalidTsHash)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await store.merge(castRemove);
    await expect(getCastRemove()).resolves.toEqual(castRemove);
  });
});

describe('getCastAddsByUser', () => {
  test('returns cast adds for an fid', async () => {
    await store.merge(castAdd);
    await expect(store.getCastAddsByUser(fid)).resolves.toEqual([castAdd]);
  });

  test('fails if incorrect values are passed in', async () => {
    await store.merge(castAdd);

    const invalidFid = Factories.FID.build();
    await expect(store.getCastAddsByUser(invalidFid)).resolves.toEqual([]);
  });

  test('returns empty array without messages', async () => {
    await expect(store.getCastAddsByUser(fid)).resolves.toEqual([]);
  });
});

describe('getCastRemovesByUser', () => {
  test('returns cast removes for an fid', async () => {
    await store.merge(castRemove);
    await expect(store.getCastRemovesByUser(fid)).resolves.toEqual([castRemove]);
  });

  test('fails if incorrect values are passed in', async () => {
    await store.merge(castRemove);

    const invalidFid = Factories.FID.build();
    await expect(store.getCastRemovesByUser(invalidFid)).resolves.toEqual([]);
  });

  test('returns empty array without messages', async () => {
    await expect(store.getCastRemovesByUser(fid)).resolves.toEqual([]);
  });
});

describe('getCastsByParent', () => {
  test('returns empty array if no casts exist', async () => {
    const byTargetUser = await store.getCastsByParent(parentFid, parentTsHash);
    expect(byTargetUser).toEqual([]);
  });

  test('returns empty array if casts exist, but for a different fid or hash', async () => {
    await store.merge(castAdd);
    expect(await store.getCastsByParent(fid, parentTsHash)).toEqual([]);
    expect(await store.getCastsByParent(parentFid, castAdd.tsHash())).toEqual([]);
  });

  test('returns casts that reply to a parent cast', async () => {
    const addData = await Factories.CastAddData.create({
      body: Factories.CastAddBody.build({ parent: (castAdd.body().parent(new CastId()) as CastId)?.unpack() || null }),
    });
    const addMessage = await Factories.Message.create({
      data: Array.from(addData.bb?.bytes() ?? []),
    });
    const castAddSameParent = new MessageModel(addMessage) as CastAddModel;

    await store.merge(castAdd);
    await store.merge(castAddSameParent);

    const byParent = await store.getCastsByParent(parentFid, parentTsHash);
    expect(new Set(byParent)).toEqual(new Set([castAdd, castAddSameParent]));
  });
});

describe('getCastsByMention', () => {
  test('returns empty array if no casts exist', async () => {
    const mentionFid = castAdd.body().mentions(1)?.fidArray() ?? new Uint8Array();
    const byTargetUser = await store.getCastsByMention(mentionFid);
    expect(byTargetUser).toEqual([]);
  });

  test('returns empty array if casts exist, but for a different fid or hash', async () => {
    await store.merge(castAdd);
    expect(await store.getCastsByMention(fid)).toEqual([]);
  });

  test('returns casts that mention an fid', async () => {
    await store.merge(castAdd);
    await expect(store.getCastsByMention(fid)).resolves.toEqual([]);
    expect(castAdd.body().mentionsLength()).toBeGreaterThan(0);

    for (let i = 0; i < castAdd.body().mentionsLength(); i++) {
      const mentionFid = castAdd.body().mentions(i)?.fidArray() ?? new Uint8Array();
      await expect(store.getCastsByMention(mentionFid)).resolves.toEqual([castAdd]);
    }
  });
});

describe('merge', () => {
  const assertCastExists = async (message: CastAddModel | CastRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.CastMessage, message.tsHash())).resolves.toEqual(message);
  };

  const assertCastDoesNotExist = async (message: CastAddModel | CastRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.CastMessage, message.tsHash())).rejects.toThrow(HubError);
  };

  const assertCastAddWins = async (message: CastAddModel, removeMessage?: CastRemoveModel) => {
    const mentionFid = message.body().mentions(1)?.fidArray() ?? new Uint8Array();

    await assertCastExists(message);
    await expect(store.getCastAdd(fid, message.tsHash())).resolves.toEqual(message);
    await expect(store.getCastsByMention(mentionFid)).resolves.toEqual([message]);
    await expect(
      store.getCastsByParent(
        (message.body().parent(new CastId()) as CastId)?.fidArray() ?? new Uint8Array(),
        (message.body().parent(new CastId()) as CastId)?.tsHashArray() ?? new Uint8Array()
      )
    ).resolves.toEqual([message]);

    if (removeMessage) {
      await expect(store.getCastRemove(fid, removeMessage.tsHash())).rejects.toThrow(HubError);
    }
  };

  const assertCastRemoveWins = async (message: CastRemoveModel) => {
    const mentionFid = castAdd.body().mentions(1)?.fidArray() ?? new Uint8Array();
    const castAddTsHash = message.body().targetTsHashArray() ?? new Uint8Array();

    await assertCastExists(message);
    await expect(store.getCastRemove(fid, castAddTsHash)).resolves.toEqual(message);
    await expect(store.getCastAdd(fid, castAddTsHash)).rejects.toThrow(HubError);
    await expect(store.getCastsByParent(parentFid, parentTsHash)).resolves.toEqual([]);
    await expect(store.getCastsByMention(mentionFid)).resolves.toEqual([]);
  };

  test('fails with invalid message type', async () => {
    const invalidData = await Factories.ReactionAddData.create({ fid: Array.from(fid) });
    const message = await Factories.Message.create({ data: Array.from(invalidData.bb?.bytes() ?? []) });
    await expect(store.merge(new MessageModel(message))).rejects.toThrow(HubError);
  });

  describe('CastAdd', () => {
    test('succeeds', async () => {
      await expect(store.merge(castAdd)).resolves.toEqual(undefined);
      await assertCastAddWins(castAdd);
    });

    test('succeeds once, even if merged twice', async () => {
      await expect(store.merge(castAdd)).resolves.toEqual(undefined);
      await expect(store.merge(castAdd)).resolves.toEqual(undefined);

      await assertCastAddWins(castAdd);
    });

    describe('with conflicting CastRemove with different timestamps', () => {
      test('no-ops with a later timestamp', async () => {
        const removeData = await Factories.CastRemoveData.create({
          ...castRemove.data.unpack(),
          timestamp: castAdd.timestamp() - 1,
        });

        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
        });

        const castRemoveEarlier = new MessageModel(removeMessage) as CastRemoveModel;

        await store.merge(castRemoveEarlier);
        await expect(store.merge(castAdd)).resolves.toEqual(undefined);

        await assertCastRemoveWins(castRemoveEarlier);
        await assertCastDoesNotExist(castAdd);
      });

      test('no-ops with an earlier timestamp', async () => {
        await store.merge(castRemove);
        await expect(store.merge(castAdd)).resolves.toEqual(undefined);

        await assertCastRemoveWins(castRemove);
        await assertCastDoesNotExist(castAdd);
      });
    });

    describe('with conflicting CastRemove with identical timestamps', () => {
      test('no-ops with a later hash', async () => {
        const removeData = await Factories.CastRemoveData.create({
          ...castRemove.data.unpack(),
          timestamp: castAdd.timestamp(),
        });

        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
          hash: Array.from(bytesDecrement(castAdd.hash().slice())),
        });

        const castRemoveEarlier = new MessageModel(removeMessage) as CastRemoveModel;

        await store.merge(castRemoveEarlier);
        await expect(store.merge(castAdd)).resolves.toEqual(undefined);

        await assertCastRemoveWins(castRemoveEarlier);
        await assertCastDoesNotExist(castAdd);
      });

      test('no-ops with an earlier hash', async () => {
        const removeData = await Factories.CastRemoveData.create({
          ...castRemove.data.unpack(),
          timestamp: castAdd.timestamp(),
        });

        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(castAdd.hash().slice())),
        });

        const castRemoveLater = new MessageModel(removeMessage) as CastRemoveModel;

        await store.merge(castRemoveLater);
        await expect(store.merge(castAdd)).resolves.toEqual(undefined);

        await assertCastRemoveWins(castRemoveLater);
        await assertCastDoesNotExist(castAdd);
      });
    });
  });

  describe('CastRemove', () => {
    test('succeeds', async () => {
      await store.merge(castAdd);
      await expect(store.merge(castRemove)).resolves.toEqual(undefined);

      await assertCastRemoveWins(castRemove);
      await assertCastDoesNotExist(castAdd);
    });

    test('succeeds once, even if merged twice', async () => {
      await expect(store.merge(castRemove)).resolves.toEqual(undefined);
      await expect(store.merge(castRemove)).resolves.toEqual(undefined);

      await assertCastRemoveWins(castRemove);
    });

    describe('with a conflicting CastRemove with different timestamps', () => {
      let castRemoveLater: CastRemoveModel;

      beforeAll(async () => {
        const removeData = await Factories.CastRemoveData.create({
          ...castRemove.data.unpack(),
          timestamp: castRemove.timestamp() + 1,
        });
        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
        });
        castRemoveLater = new MessageModel(removeMessage) as CastRemoveModel;
      });

      test('succeeds with a later timestamp', async () => {
        await store.merge(castRemove);
        await expect(store.merge(castRemoveLater)).resolves.toEqual(undefined);

        await assertCastDoesNotExist(castRemove);
        await assertCastRemoveWins(castRemoveLater);
      });

      test('no-ops with an earlier timestamp', async () => {
        await store.merge(castRemoveLater);
        await expect(store.merge(castRemove)).resolves.toEqual(undefined);

        await assertCastDoesNotExist(castRemove);
        await assertCastRemoveWins(castRemoveLater);
      });
    });

    describe('with a conflicting CastRemove with identical timestamps', () => {
      let castRemoveLater: CastRemoveModel;

      beforeAll(async () => {
        const removeData = await Factories.CastRemoveData.create({
          ...castRemove.data.unpack(),
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(castRemove.hash().slice())),
        });

        castRemoveLater = new MessageModel(addMessage) as CastRemoveModel;
      });

      test('succeeds with a later hash', async () => {
        await store.merge(castRemove);
        await expect(store.merge(castRemoveLater)).resolves.toEqual(undefined);

        await assertCastDoesNotExist(castRemove);
        await assertCastRemoveWins(castRemoveLater);
      });

      test('no-ops with an earlier hash', async () => {
        await store.merge(castRemoveLater);
        await expect(store.merge(castRemove)).resolves.toEqual(undefined);

        await assertCastDoesNotExist(castRemove);
        await assertCastRemoveWins(castRemoveLater);
      });
    });

    describe('with conflicting CastAdd with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        await store.merge(castAdd);
        await expect(store.merge(castRemove)).resolves.toEqual(undefined);
        await assertCastRemoveWins(castRemove);
        await assertCastDoesNotExist(castAdd);
      });

      test('succeeds with an earlier timestamp', async () => {
        const removeData = await Factories.CastRemoveData.create({
          fid: Array.from(fid),
          body: Factories.CastRemoveBody.build({ targetTsHash: Array.from(castAdd.tsHash()) }),
          timestamp: castAdd.timestamp() - 1,
        });
        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
        });
        const castRemoveEarlier = new MessageModel(removeMessage) as CastRemoveModel;

        await store.merge(castAdd);
        await expect(store.merge(castRemoveEarlier)).resolves.toEqual(undefined);
        await assertCastDoesNotExist(castAdd);
        await assertCastRemoveWins(castRemoveEarlier);
      });
    });

    describe('with conflicting CastAdd with identical timestamps', () => {
      test('succeeds with an earlier hash', async () => {
        const removeData = await Factories.CastRemoveData.create({
          fid: Array.from(fid),
          body: Factories.CastRemoveBody.build({ targetTsHash: Array.from(castAdd.tsHash()) }),
          timestamp: castAdd.timestamp(),
        });
        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
          hash: Array.from(bytesDecrement(castAdd.hash().slice())),
        });
        const castRemoveEarlier = new MessageModel(removeMessage) as CastRemoveModel;

        await store.merge(castAdd);
        await expect(store.merge(castRemoveEarlier)).resolves.toEqual(undefined);

        await assertCastDoesNotExist(castAdd);
        await assertCastRemoveWins(castRemoveEarlier);
      });

      test('succeeds with a later hash', async () => {
        const removeData = await Factories.CastRemoveData.create({
          fid: Array.from(fid),
          body: Factories.CastRemoveBody.build({ targetTsHash: Array.from(castAdd.tsHash()) }),
          timestamp: castAdd.timestamp(),
        });
        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(castAdd.hash().slice())),
        });
        const castRemoveLater = new MessageModel(removeMessage) as CastRemoveModel;

        await store.merge(castAdd);
        await expect(store.merge(castRemoveLater)).resolves.toEqual(undefined);

        await assertCastDoesNotExist(castAdd);
        await assertCastRemoveWins(castRemoveLater);
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

  let add1: CastAddModel;
  let add2: CastAddModel;
  let add3: CastAddModel;
  let add4: CastAddModel;
  let add5: CastAddModel;
  let addOld1: CastAddModel;
  let addOld2: CastAddModel;

  let remove1: CastRemoveModel;
  let remove2: CastRemoveModel;
  let remove3: CastRemoveModel;
  let remove4: CastRemoveModel;
  let remove5: CastRemoveModel;
  let removeOld3: CastRemoveModel;

  const generateAddWithTimestamp = async (fid: Uint8Array, timestamp: number): Promise<CastAddModel> => {
    const addData = await Factories.CastAddData.create({ fid: Array.from(fid), timestamp });
    const addMessage = await Factories.Message.create({ data: Array.from(addData.bb?.bytes() ?? []) });
    return new MessageModel(addMessage) as CastAddModel;
  };

  const generateRemoveWithTimestamp = async (
    fid: Uint8Array,
    timestamp: number,
    target?: CastAddModel
  ): Promise<CastRemoveModel> => {
    const removeBody = await Factories.CastRemoveBody.build(
      target ? { targetTsHash: Array.from(target.tsHash()) } : {}
    );
    const removeData = await Factories.CastRemoveData.create({ fid: Array.from(fid), timestamp, body: removeBody });
    const removeMessage = await Factories.Message.create({ data: Array.from(removeData.bb?.bytes() ?? []) });
    return new MessageModel(removeMessage) as CastRemoveModel;
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

      for (const message of prunedMessages as CastAddModel[]) {
        const getAdd = () => sizePrunedStore.getCastAdd(fid, message.tsHash());
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

      for (const message of prunedMessages as CastRemoveModel[]) {
        const getRemove = () =>
          sizePrunedStore.getCastRemove(fid, message.body().targetTsHashArray() ?? new Uint8Array());
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

      await expect(timePrunedStore.getCastAdd(fid, addOld1.tsHash())).rejects.toThrow(HubError);
      await expect(timePrunedStore.getCastAdd(fid, addOld2.tsHash())).rejects.toThrow(HubError);
      await expect(
        timePrunedStore.getCastRemove(fid, removeOld3.body().targetTsHashArray() ?? new Uint8Array())
      ).rejects.toThrow(HubError);
    });
  });
});
