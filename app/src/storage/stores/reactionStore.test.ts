import { CastId, MessageType, ReactionType } from '@hub/flatbuffers';
import Factories from '~/flatbuffers/factories';
import MessageModel from '~/flatbuffers/models/messageModel';
import { ReactionAddModel, ReactionRemoveModel, UserPostfix } from '~/flatbuffers/models/types';
import { bytesDecrement, bytesIncrement } from '~/flatbuffers/utils/bytes';
import { getFarcasterTime } from '~/flatbuffers/utils/time';
import { jestRocksDB } from '~/storage/db/jestUtils';
import ReactionStore from '~/storage/stores/reactionStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import { HubError } from '~/utils/hubErrors';

const db = jestRocksDB('flatbuffers.reactionStore.test');
const eventHandler = new StoreEventHandler();
const set = new ReactionStore(db, eventHandler);
const fid = Factories.FID.build();

const castId = await Factories.CastId.create();

let reactionAdd: ReactionAddModel;
let reactionRemove: ReactionRemoveModel;
let reactionAddRecast: ReactionAddModel;
let reactionRemoveRecast: ReactionRemoveModel;

beforeAll(async () => {
  // Constructs a ReactionAdd of type Like
  const reactionBody = Factories.ReactionBody.build({
    type: ReactionType.Like,
    target: Factories.CastId.build({
      fid: Array.from(castId.fidArray() || new Uint8Array()),
      tsHash: Array.from(castId.tsHashArray() || new Uint8Array()),
    }),
  });

  const reactionAddData = await Factories.ReactionAddData.create({ fid: Array.from(fid), body: reactionBody });
  const reactionAddMessage = await Factories.Message.create({ data: Array.from(reactionAddData.bb?.bytes() ?? []) });
  reactionAdd = new MessageModel(reactionAddMessage) as ReactionAddModel;

  // Constructs a ReactionRemove pointing the ReactionAdd with a later timestamp
  const reactionRemoveData = await Factories.ReactionRemoveData.create({
    fid: Array.from(fid),
    body: reactionBody,
    timestamp: reactionAddData.timestamp() + 1,
  });

  const reactionRemoveMessage = await Factories.Message.create({
    data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
  });
  reactionRemove = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;

  // Constructs a ReactionAdd of type React
  const reactionRecastBody = Factories.ReactionBody.build({
    type: ReactionType.Recast,
    target: Factories.CastId.build({
      fid: Array.from(castId.fidArray() || new Uint8Array()),
      tsHash: Array.from(castId.tsHashArray() || new Uint8Array()),
    }),
  });

  const reactionAddRecastData = await Factories.ReactionAddData.create({
    fid: Array.from(fid),
    body: reactionRecastBody,
  });

  const reactionAddRecastMessage = await Factories.Message.create({
    data: Array.from(reactionAddRecastData.bb?.bytes() ?? []),
  });
  reactionAddRecast = new MessageModel(reactionAddRecastMessage) as ReactionAddModel;

  // Constructs a ReactionRemove pointing at the React with a later timestamp
  const reactionRemoveRecastData = await Factories.ReactionRemoveData.create({
    fid: Array.from(fid),
    body: reactionRecastBody,
    timestamp: reactionAddRecastData.timestamp() + 1,
  });

  const reactionRemoveRecastMessage = await Factories.Message.create({
    data: Array.from(reactionRemoveRecastData.bb?.bytes() ?? []),
  });

  reactionRemoveRecast = new MessageModel(reactionRemoveRecastMessage) as ReactionRemoveModel;
});

describe('getReactionAdd', () => {
  test('fails if no ReactionAdd is present', async () => {
    await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).rejects.toThrow(HubError);
  });

  test('fails if only ReactionRemove exists for the target', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).rejects.toThrow(HubError);
  });

  test('fails if the wrong fid is provided', async () => {
    const unknownFid = Factories.FID.build();
    await set.merge(reactionAdd);
    await expect(set.getReactionAdd(unknownFid, reactionAdd.body().type(), castId)).rejects.toThrow(HubError);
  });

  test('fails if the wrong reaction type is provided', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionAdd(fid, ReactionType.Recast, castId)).rejects.toThrow(HubError);
  });

  test('fails if the wrong target is provided', async () => {
    await set.merge(reactionAdd);
    const unknownCastId = await Factories.CastId.create();
    await expect(set.getReactionAdd(fid, reactionAdd.body().type(), unknownCastId)).rejects.toThrow(HubError);
  });

  test('returns message if it exists for the target', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).resolves.toEqual(reactionAdd);
  });
});

describe('getReactionRemove', () => {
  test('fails if no ReactionRemove is present', async () => {
    await expect(set.getReactionRemove(fid, reactionRemove.body().type(), castId)).rejects.toThrow(HubError);
  });

  test('fails if only ReactionAdd exists for the target', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionRemove(fid, reactionAdd.body().type(), castId)).rejects.toThrow(HubError);
  });

  test('fails if the wrong fid is provided', async () => {
    await set.merge(reactionRemove);
    const unknownFid = Factories.FID.build();
    await expect(set.getReactionRemove(unknownFid, reactionRemove.body().type(), castId)).rejects.toThrow(HubError);
  });

  test('fails if the wrong reaction type is provided', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionRemove(fid, ReactionType.Recast, castId)).rejects.toThrow(HubError);
  });

  test('fails if the wrong target is provided', async () => {
    await set.merge(reactionRemove);
    const unknownCastId = await Factories.CastId.create();
    await expect(set.getReactionRemove(fid, reactionRemove.body().type(), unknownCastId)).rejects.toThrow(HubError);
  });

  test('returns message if it exists for the target', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionRemove(fid, reactionRemove.body().type(), castId)).resolves.toEqual(reactionRemove);
  });
});

describe('getReactionAddsByUser', () => {
  test('returns reactionAdds if they exist', async () => {
    await set.merge(reactionAdd);
    await set.merge(reactionAddRecast);
    await expect(set.getReactionAddsByUser(fid)).resolves.toEqual([reactionAdd, reactionAddRecast]);
  });

  test('returns empty array if no ReactionAdd exists', async () => {
    await expect(set.getReactionAddsByUser(fid)).resolves.toEqual([]);
  });

  test('returns empty array if no ReactionAdd exists, even if ReactionRemove exists', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionAddsByUser(fid)).resolves.toEqual([]);
  });
});

describe('getReactionRemovesByUser', () => {
  test('returns ReactionRemove if it exists', async () => {
    await set.merge(reactionRemove);
    await set.merge(reactionRemoveRecast);
    await expect(set.getReactionRemovesByUser(fid)).resolves.toEqual([reactionRemove, reactionRemoveRecast]);
  });

  test('returns empty array if no ReactionRemove exists', async () => {
    await expect(set.getReactionRemovesByUser(fid)).resolves.toEqual([]);
  });

  test('returns empty array if no ReactionRemove exists, even if ReactionAdds exists', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionRemovesByUser(fid)).resolves.toEqual([]);
  });
});

describe('getReactionsByTargetCast', () => {
  test('returns empty array if no reactions exist', async () => {
    const byCast = await set.getReactionsByTargetCast(castId);
    expect(byCast).toEqual([]);
  });

  test('returns reactions if they exist for a target', async () => {
    await set.merge(reactionAdd);
    await set.merge(reactionAddRecast);

    const byCast = await set.getReactionsByTargetCast(castId);
    expect(byCast).toEqual([reactionAdd, reactionAddRecast]);
  });

  test('returns empty array if reactions exist for a different target', async () => {
    await set.merge(reactionAdd);

    const unknownCastId = await Factories.CastId.create();
    const byCast = await set.getReactionsByTargetCast(unknownCastId);
    expect(byCast).toEqual([]);
  });

  describe('AndType', () => {
    test('returns empty array if no reactions exist', async () => {
      const byCast = await set.getReactionsByTargetCast(castId, ReactionType.Like);
      expect(byCast).toEqual([]);
    });

    test('returns empty array if reactions exist for the target with different type', async () => {
      await set.merge(reactionAddRecast);
      const byCast = await set.getReactionsByTargetCast(castId, ReactionType.Like);
      expect(byCast).toEqual([]);
    });

    test('returns empty array if reactions exist for the type with different target', async () => {
      await set.merge(reactionAdd);
      const unknownCastId = await Factories.CastId.create();
      const byCast = await set.getReactionsByTargetCast(unknownCastId, ReactionType.Like);
      expect(byCast).toEqual([]);
    });

    test('returns reactions if they exist for the target and type', async () => {
      await set.merge(reactionAdd);
      const byCast = await set.getReactionsByTargetCast(castId, ReactionType.Like);
      expect(byCast).toEqual([reactionAdd]);
    });
  });
});

describe('merge', () => {
  const assertReactionExists = async (message: ReactionAddModel | ReactionRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.ReactionMessage, message.tsHash())).resolves.toEqual(message);
  };

  const assertReactionDoesNotExist = async (message: ReactionAddModel | ReactionRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.ReactionMessage, message.tsHash())).rejects.toThrow(HubError);
  };

  const assertReactionAddWins = async (message: ReactionAddModel) => {
    await assertReactionExists(message);
    await expect(set.getReactionAdd(fid, message.body().type(), castId)).resolves.toEqual(message);
    await expect(set.getReactionsByTargetCast(castId)).resolves.toEqual([message]);
    await expect(set.getReactionRemove(fid, message.body().type(), castId)).rejects.toThrow(HubError);
  };

  const assertReactionRemoveWins = async (message: ReactionRemoveModel) => {
    await assertReactionExists(message);
    await expect(set.getReactionRemove(fid, message.body().type(), castId)).resolves.toEqual(message);
    await expect(set.getReactionsByTargetCast(castId)).resolves.toEqual([]);
    await expect(set.getReactionAdd(fid, reactionAdd.body().type(), castId)).rejects.toThrow(HubError);
  };

  test('fails with invalid message type', async () => {
    const invalidData = await Factories.AmpAddData.create({ fid: Array.from(fid) });
    const message = await Factories.Message.create({ data: Array.from(invalidData.bb?.bytes() ?? []) });

    await expect(set.merge(new MessageModel(message))).rejects.toThrow(HubError);
  });

  describe('ReactionAdd', () => {
    test('succeeds', async () => {
      await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

      await assertReactionAddWins(reactionAdd);
    });

    test('succeeds once, even if merged twice', async () => {
      await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);
      await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

      await assertReactionAddWins(reactionAdd);
    });

    describe('with a conflicting ReactionAdd with different timestamps', () => {
      let reactionAddLater: ReactionAddModel;

      beforeAll(async () => {
        const addData = await Factories.ReactionAddData.create({
          ...reactionAdd.data.unpack(),
          timestamp: reactionAdd.timestamp() + 1,
        });
        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
        });
        reactionAddLater = new MessageModel(addMessage) as ReactionAddModel;
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(reactionAdd);
        await expect(set.merge(reactionAddLater)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionAdd);
        await assertReactionAddWins(reactionAddLater);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(reactionAddLater);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionAdd);
        await assertReactionAddWins(reactionAddLater);
      });
    });

    describe('with a conflicting ReactionAdd with identical timestamps', () => {
      let reactionAddLater: ReactionAddModel;

      beforeAll(async () => {
        const addData = await Factories.ReactionAddData.create({
          ...reactionAdd.data.unpack(),
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(reactionAdd.hash().slice())),
        });

        reactionAddLater = new MessageModel(addMessage) as ReactionAddModel;
      });

      test('succeeds with a later hash', async () => {
        await set.merge(reactionAdd);
        await expect(set.merge(reactionAddLater)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionAdd);
        await assertReactionAddWins(reactionAddLater);
      });

      test('no-ops with an earlier hash', async () => {
        await set.merge(reactionAddLater);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionAdd);
        await assertReactionAddWins(reactionAddLater);
      });
    });

    describe('with conflicting ReactionRemove with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        const reactionRemoveData = await Factories.ReactionRemoveData.create({
          ...reactionRemove.data.unpack(),
          timestamp: reactionAdd.timestamp() - 1,
        });

        const reactionRemoveMessage = await Factories.Message.create({
          data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
        });

        const reactionRemoveEarlier = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;

        await set.merge(reactionRemoveEarlier);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

        await assertReactionAddWins(reactionAdd);
        await assertReactionDoesNotExist(reactionRemoveEarlier);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(reactionRemove);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

        await assertReactionRemoveWins(reactionRemove);
        await assertReactionDoesNotExist(reactionAdd);
      });
    });

    describe('with conflicting ReactionRemove with identical timestamps', () => {
      test('no-ops if remove has a later hash', async () => {
        const reactionRemoveData = await Factories.ReactionRemoveData.create({
          ...reactionRemove.data.unpack(),
          timestamp: reactionAdd.timestamp(),
        });

        const reactionRemoveMessage = await Factories.Message.create({
          data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(reactionAdd.hash().slice())),
        });

        const reactionRemoveLater = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;

        await set.merge(reactionRemoveLater);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

        await assertReactionRemoveWins(reactionRemoveLater);
        await assertReactionDoesNotExist(reactionAdd);
      });

      test('succeeds if remove has an earlier hash', async () => {
        const reactionRemoveData = await Factories.ReactionRemoveData.create({
          ...reactionRemove.data.unpack(),
          timestamp: reactionAdd.timestamp(),
        });

        const reactionRemoveMessage = await Factories.Message.create({
          data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
          hash: Array.from(bytesDecrement(reactionAdd.hash().slice())),
        });

        const reactionRemoveEarlier = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;

        await set.merge(reactionRemoveEarlier);
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionAdd);
        await assertReactionRemoveWins(reactionRemoveEarlier);
      });
    });
  });

  describe('ReactionRemove', () => {
    test('succeeds', async () => {
      await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

      await assertReactionRemoveWins(reactionRemove);
    });

    test('succeeds once, even if merged twice', async () => {
      await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);
      await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

      await assertReactionRemoveWins(reactionRemove);
    });

    describe('with a conflicting ReactionRemove with different timestamps', () => {
      let reactionRemoveLater: ReactionRemoveModel;

      beforeAll(async () => {
        const reactionRemoveData = await Factories.ReactionRemoveData.create({
          ...reactionRemove.data.unpack(),
          timestamp: reactionRemove.timestamp() + 1,
        });
        const reactionRemoveMessage = await Factories.Message.create({
          data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
        });
        reactionRemoveLater = new MessageModel(reactionRemoveMessage) as ReactionRemoveModel;
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(reactionRemove);
        await expect(set.merge(reactionRemoveLater)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionRemove);
        await assertReactionRemoveWins(reactionRemoveLater);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(reactionRemoveLater);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionRemove);
        await assertReactionRemoveWins(reactionRemoveLater);
      });
    });

    describe('with a conflicting ReactionRemove with identical timestamps', () => {
      let reactionRemoveLater: ReactionRemoveModel;

      beforeAll(async () => {
        const reactionRemoveData = await Factories.ReactionRemoveData.create({
          ...reactionRemove.data.unpack(),
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(reactionRemoveData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(reactionRemove.hash().slice())),
        });

        reactionRemoveLater = new MessageModel(addMessage) as ReactionRemoveModel;
      });

      test('succeeds with a later hash', async () => {
        await set.merge(reactionRemove);
        await expect(set.merge(reactionRemoveLater)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionRemove);
        await assertReactionRemoveWins(reactionRemoveLater);
      });

      test('no-ops with an earlier hash', async () => {
        await set.merge(reactionRemoveLater);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionRemove);
        await assertReactionRemoveWins(reactionRemoveLater);
      });
    });

    describe('with conflicting ReactionAdd with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        await set.merge(reactionAdd);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);
        await assertReactionRemoveWins(reactionRemove);
        await assertReactionDoesNotExist(reactionAdd);
      });

      test('no-ops with an earlier timestamp', async () => {
        const addData = await Factories.ReactionAddData.create({
          ...reactionRemove.data.unpack(),
          timestamp: reactionRemove.timestamp() + 1,
          type: MessageType.ReactionAdd,
        });
        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
        });
        const reactionAddLater = new MessageModel(addMessage) as ReactionAddModel;
        await set.merge(reactionAddLater);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);
        await assertReactionAddWins(reactionAddLater);
        await assertReactionDoesNotExist(reactionRemove);
      });
    });

    describe('with conflicting ReactionAdd with identical timestamps', () => {
      test('succeeds with an earlier hash', async () => {
        const addData = await Factories.ReactionAddData.create({
          ...reactionRemove.data.unpack(),
          type: MessageType.ReactionAdd,
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(reactionRemove.hash().slice())),
        });
        const reactionAddLater = new MessageModel(addMessage) as ReactionAddModel;

        await set.merge(reactionAddLater);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionAddLater);
        await assertReactionRemoveWins(reactionRemove);
      });

      test('succeeds with a later hash', async () => {
        const removeData = await Factories.ReactionAddData.create({
          ...reactionRemove.data.unpack(),
        });

        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
          hash: Array.from(bytesDecrement(reactionRemove.hash().slice())),
        });

        const reactionRemoveEarlier = new MessageModel(removeMessage) as ReactionRemoveModel;

        await set.merge(reactionRemoveEarlier);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionRemoveEarlier);
        await assertReactionRemoveWins(reactionRemove);
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

  let add1: ReactionAddModel;
  let add2: ReactionAddModel;
  let add3: ReactionAddModel;
  let add4: ReactionAddModel;
  let add5: ReactionAddModel;
  let addOld1: ReactionAddModel;
  let addOld2: ReactionAddModel;

  let remove1: ReactionRemoveModel;
  let remove2: ReactionRemoveModel;
  let remove3: ReactionRemoveModel;
  let remove4: ReactionRemoveModel;
  let remove5: ReactionRemoveModel;
  let removeOld3: ReactionRemoveModel;

  const generateAddWithTimestamp = async (fid: Uint8Array, timestamp: number): Promise<ReactionAddModel> => {
    const addData = await Factories.ReactionAddData.create({ fid: Array.from(fid), timestamp });
    const addMessage = await Factories.Message.create({ data: Array.from(addData.bb?.bytes() ?? []) });
    return new MessageModel(addMessage) as ReactionAddModel;
  };

  const generateRemoveWithTimestamp = async (
    fid: Uint8Array,
    timestamp: number,
    cast?: CastId | null
  ): Promise<ReactionRemoveModel> => {
    const removeBody = await Factories.ReactionBody.build(cast ? { target: cast.unpack() } : {});
    const removeData = await Factories.ReactionRemoveData.create({ fid: Array.from(fid), timestamp, body: removeBody });
    const removeMessage = await Factories.Message.create({ data: Array.from(removeData.bb?.bytes() ?? []) });
    return new MessageModel(removeMessage) as ReactionRemoveModel;
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

    remove1 = await generateRemoveWithTimestamp(fid, time + 1, add1.body().target(new CastId()));
    remove2 = await generateRemoveWithTimestamp(fid, time + 2, add2.body().target(new CastId()));
    remove3 = await generateRemoveWithTimestamp(fid, time + 3, add3.body().target(new CastId()));
    remove4 = await generateRemoveWithTimestamp(fid, time + 4, add4.body().target(new CastId()));
    remove5 = await generateRemoveWithTimestamp(fid, time + 5, add5.body().target(new CastId()));
    removeOld3 = await generateRemoveWithTimestamp(fid, time - 60 * 60 + 2);
  });

  describe('with size limit', () => {
    const sizePrunedStore = new ReactionStore(db, eventHandler, { pruneSizeLimit: 3 });

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

      for (const message of prunedMessages as ReactionAddModel[]) {
        const getAdd = () =>
          sizePrunedStore.getReactionAdd(
            fid,
            message.body().type(),
            message.body().target(new CastId()) ?? new CastId()
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
      expect(result._unsafeUnwrap()).toEqual(undefined);

      expect(prunedMessages).toEqual([remove1, remove2]);

      for (const message of prunedMessages as ReactionRemoveModel[]) {
        const getRemove = () =>
          sizePrunedStore.getReactionRemove(
            fid,
            message.body().type(),
            message.body().target(new CastId()) ?? new CastId()
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
    const timePrunedStore = new ReactionStore(db, eventHandler, { pruneTimeLimit: 60 * 60 - 1 });

    test('prunes earliest messages', async () => {
      const messages = [add1, remove2, addOld1, addOld2, removeOld3];
      for (const message of messages) {
        await timePrunedStore.merge(message);
      }

      const result = await timePrunedStore.pruneMessages(fid);
      expect(result._unsafeUnwrap()).toEqual(undefined);

      expect(prunedMessages).toEqual([addOld1, addOld2, removeOld3]);

      await expect(
        timePrunedStore.getReactionAdd(fid, addOld1.body().type(), addOld1.body().target(new CastId()) ?? new CastId())
      ).rejects.toThrow(HubError);
      await expect(
        timePrunedStore.getReactionAdd(fid, addOld2.body().type(), addOld2.body().target(new CastId()) ?? new CastId())
      ).rejects.toThrow(HubError);
      await expect(
        timePrunedStore.getReactionRemove(
          fid,
          removeOld3.body().type(),
          removeOld3.body().target(new CastId()) ?? new CastId()
        )
      ).rejects.toThrow(HubError);
    });
  });
});
