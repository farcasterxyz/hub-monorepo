import * as protobufs from '@farcaster/protobufs';
import { bytesDecrement, bytesIncrement, Factories, HubError } from '@farcaster/utils';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { getMessage, makeTsHash } from '~/storage/db/message';
import { UserPostfix } from '~/storage/db/types';
import ReactionStore from '~/storage/stores/reactionStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';

const db = jestRocksDB('protobufs.reactionStore.test');
const eventHandler = new StoreEventHandler();
const set = new ReactionStore(db, eventHandler);
const fid = Factories.Fid.build();
const castId = Factories.CastId.build();

let reactionAdd: protobufs.ReactionAddMessage;
let reactionRemove: protobufs.ReactionRemoveMessage;
let reactionAddRecast: protobufs.ReactionAddMessage;
let reactionRemoveRecast: protobufs.ReactionRemoveMessage;

beforeAll(async () => {
  const likeBody = Factories.ReactionBody.build({
    type: protobufs.ReactionType.REACTION_TYPE_LIKE,
    targetCastId: castId,
  });

  reactionAdd = await Factories.ReactionAddMessage.create({
    data: { fid, reactionBody: likeBody },
  });

  reactionRemove = await Factories.ReactionRemoveMessage.create({
    data: { fid, reactionBody: likeBody, timestamp: reactionAdd.data.timestamp + 1 },
  });

  const recastBody = Factories.ReactionBody.build({
    type: protobufs.ReactionType.REACTION_TYPE_RECAST,
    targetCastId: castId,
  });

  reactionAddRecast = await Factories.ReactionAddMessage.create({
    data: { fid, reactionBody: recastBody },
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
    await expect(set.getReactionAdd(fid, protobufs.ReactionType.REACTION_TYPE_RECAST, castId)).rejects.toThrow(
      HubError
    );
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
    await expect(set.getReactionRemove(fid, protobufs.ReactionType.REACTION_TYPE_RECAST, castId)).rejects.toThrow(
      HubError
    );
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
  test('returns reactionAdds if they exist', async () => {
    await set.merge(reactionAdd);
    await set.merge(reactionAddRecast);
    await expect(set.getReactionAddsByFid(fid)).resolves.toEqual([reactionAdd, reactionAddRecast]);
  });

  test('returns empty array if no ReactionAdd exists', async () => {
    await expect(set.getReactionAddsByFid(fid)).resolves.toEqual([]);
  });

  test('returns empty array if no ReactionAdd exists, even if ReactionRemove exists', async () => {
    await set.merge(reactionRemove);
    await expect(set.getReactionAddsByFid(fid)).resolves.toEqual([]);
  });
});

describe('getReactionRemovesByFid', () => {
  test('returns ReactionRemove if it exists', async () => {
    await set.merge(reactionRemove);
    await set.merge(reactionRemoveRecast);
    await expect(set.getReactionRemovesByFid(fid)).resolves.toEqual([reactionRemove, reactionRemoveRecast]);
  });

  test('returns empty array if no ReactionRemove exists', async () => {
    await expect(set.getReactionRemovesByFid(fid)).resolves.toEqual([]);
  });

  test('returns empty array if no ReactionRemove exists, even if ReactionAdds exists', async () => {
    await set.merge(reactionAdd);
    await expect(set.getReactionRemovesByFid(fid)).resolves.toEqual([]);
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

    const unknownCastId = Factories.CastId.build();
    const byCast = await set.getReactionsByTargetCast(unknownCastId);
    expect(byCast).toEqual([]);
  });

  describe('AndType', () => {
    test('returns empty array if no reactions exist', async () => {
      const byCast = await set.getReactionsByTargetCast(castId, protobufs.ReactionType.REACTION_TYPE_LIKE);
      expect(byCast).toEqual([]);
    });

    test('returns empty array if reactions exist for the target with different type', async () => {
      await set.merge(reactionAddRecast);
      const byCast = await set.getReactionsByTargetCast(castId, protobufs.ReactionType.REACTION_TYPE_LIKE);
      expect(byCast).toEqual([]);
    });

    test('returns empty array if reactions exist for the type with different target', async () => {
      await set.merge(reactionAdd);
      const unknownCastId = Factories.CastId.build();
      const byCast = await set.getReactionsByTargetCast(unknownCastId, protobufs.ReactionType.REACTION_TYPE_LIKE);
      expect(byCast).toEqual([]);
    });

    test('returns reactions if they exist for the target and type', async () => {
      await set.merge(reactionAdd);
      const byCast = await set.getReactionsByTargetCast(castId, protobufs.ReactionType.REACTION_TYPE_LIKE);
      expect(byCast).toEqual([reactionAdd]);
    });
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

  const assertReactionExists = async (message: protobufs.ReactionAddMessage | protobufs.ReactionRemoveMessage) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.ReactionMessage, tsHash)).resolves.toEqual(message);
  };

  const assertReactionDoesNotExist = async (
    message: protobufs.ReactionAddMessage | protobufs.ReactionRemoveMessage
  ) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.ReactionMessage, tsHash)).rejects.toThrow(HubError);
  };

  const assertReactionAddWins = async (message: protobufs.ReactionAddMessage) => {
    await assertReactionExists(message);
    await expect(
      set.getReactionAdd(
        fid,
        message.data.reactionBody.type,
        message.data.reactionBody.targetCastId as protobufs.CastId
      )
    ).resolves.toEqual(message);
    await expect(
      set.getReactionsByTargetCast(message.data.reactionBody.targetCastId as protobufs.CastId)
    ).resolves.toEqual([message]);
    await expect(
      set.getReactionRemove(
        fid,
        message.data.reactionBody.type,
        message.data.reactionBody.targetCastId as protobufs.CastId
      )
    ).rejects.toThrow(HubError);
  };

  const assertReactionRemoveWins = async (message: protobufs.ReactionRemoveMessage) => {
    await assertReactionExists(message);
    await expect(
      set.getReactionRemove(
        fid,
        message.data.reactionBody.type,
        message.data.reactionBody.targetCastId as protobufs.CastId
      )
    ).resolves.toEqual(message);
    await expect(
      set.getReactionsByTargetCast(message.data.reactionBody.targetCastId as protobufs.CastId)
    ).resolves.toEqual([]);
    await expect(
      set.getReactionAdd(
        fid,
        reactionAdd.data.reactionBody.type,
        message.data.reactionBody.targetCastId as protobufs.CastId
      )
    ).rejects.toThrow(HubError);
  };

  test('fails with invalid message type', async () => {
    const message = await Factories.CastAddMessage.create();
    await expect(set.merge(message)).rejects.toThrow(HubError);
  });

  describe('ReactionAdd', () => {
    test('succeeds', async () => {
      await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

      await assertReactionAddWins(reactionAdd);

      expect(mergeEvents).toEqual([[reactionAdd, []]]);
    });

    test('fails if merged twice', async () => {
      await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);
      await expect(set.merge(reactionAdd)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );

      await assertReactionAddWins(reactionAdd);

      expect(mergeEvents).toEqual([[reactionAdd, []]]);
    });

    describe('with a conflicting ReactionAdd with different timestamps', () => {
      let reactionAddLater: protobufs.ReactionAddMessage;

      beforeAll(async () => {
        reactionAddLater = await Factories.ReactionAddMessage.create({
          data: { ...reactionAdd.data, timestamp: reactionAdd.data.timestamp + 1 },
        });
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(reactionAdd);
        await expect(set.merge(reactionAddLater)).resolves.toEqual(undefined);

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
      let reactionAddLater: protobufs.ReactionAddMessage;

      beforeAll(async () => {
        reactionAddLater = await Factories.ReactionAddMessage.create({
          ...reactionAdd,
          hash: bytesIncrement(reactionAdd.hash),
        });
      });

      test('succeeds with a higher hash', async () => {
        await set.merge(reactionAdd);
        await expect(set.merge(reactionAddLater)).resolves.toEqual(undefined);

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
        await expect(set.merge(reactionAdd)).resolves.toEqual(undefined);

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
          hash: bytesIncrement(reactionAdd.hash),
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
      await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

      await assertReactionRemoveWins(reactionRemove);

      expect(mergeEvents).toEqual([[reactionRemove, []]]);
    });

    test('fails if merged twice', async () => {
      await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);
      await expect(set.merge(reactionRemove)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );

      await assertReactionRemoveWins(reactionRemove);
    });

    describe('with a conflicting ReactionRemove with different timestamps', () => {
      let reactionRemoveLater: protobufs.ReactionRemoveMessage;

      beforeAll(async () => {
        reactionRemoveLater = await Factories.ReactionRemoveMessage.create({
          data: { ...reactionRemove.data, timestamp: reactionRemove.data.timestamp + 1 },
        });
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(reactionRemove);
        await expect(set.merge(reactionRemoveLater)).resolves.toEqual(undefined);

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
      let reactionRemoveLater: protobufs.ReactionRemoveMessage;

      beforeAll(async () => {
        reactionRemoveLater = await Factories.ReactionRemoveMessage.create({
          ...reactionRemove,
          hash: bytesIncrement(reactionRemove.hash),
        });
      });

      test('succeeds with a higher hash', async () => {
        await set.merge(reactionRemove);
        await expect(set.merge(reactionRemoveLater)).resolves.toEqual(undefined);

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
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);
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
            type: protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD,
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
          data: { ...reactionRemove.data, type: protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD },
          hash: bytesIncrement(reactionRemove.hash),
        });

        await set.merge(reactionAddLater);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

        await assertReactionDoesNotExist(reactionAddLater);
        await assertReactionRemoveWins(reactionRemove);

        expect(mergeEvents).toEqual([
          [reactionAddLater, []],
          [reactionRemove, [reactionAddLater]],
        ]);
      });

      test('succeeds with a higher hash', async () => {
        const reactionAddEarlier = await Factories.ReactionAddMessage.create({
          data: { ...reactionRemove.data, type: protobufs.MessageType.MESSAGE_TYPE_REACTION_ADD },
          hash: bytesDecrement(reactionRemove.hash)._unsafeUnwrap(),
        });

        await set.merge(reactionAddEarlier);
        await expect(set.merge(reactionRemove)).resolves.toEqual(undefined);

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

// describe('pruneMessages', () => {
//   let prunedMessages: MessageModel[];
//   const pruneMessageListener = (message: MessageModel) => {
//     prunedMessages.push(message);
//   };

//   beforeAll(() => {
//     eventHandler.on('pruneMessage', pruneMessageListener);
//   });

//   beforeEach(() => {
//     prunedMessages = [];
//   });

//   afterAll(() => {
//     eventHandler.off('pruneMessage', pruneMessageListener);
//   });

//   let add1: protobufs.ReactionAddMessage;
//   let add2: protobufs.ReactionAddMessage;
//   let add3: protobufs.ReactionAddMessage;
//   let add4: protobufs.ReactionAddMessage;
//   let add5: protobufs.ReactionAddMessage;
//   let addOld1: protobufs.ReactionAddMessage;
//   let addOld2: protobufs.ReactionAddMessage;

//   let remove1: protobufs.ReactionRemoveMessage;
//   let remove2: protobufs.ReactionRemoveMessage;
//   let remove3: protobufs.ReactionRemoveMessage;
//   let remove4: protobufs.ReactionRemoveMessage;
//   let remove5: protobufs.ReactionRemoveMessage;
//   let removeOld3: protobufs.ReactionRemoveMessage;

//   const generateAddWithTimestamp = async (
//     fid: Uint8Array,
//     timestamp: number
//   ): Promise<protobufs.ReactionAddMessage> => {
//     const addData = await Factories.ReactionAddData.create({ fid: Array.from(fid), timestamp });
//     const addMessage = await Factories.Message.create({ data: Array.from(addData.bb?.bytes() ?? []) });
//     return new MessageModel(addMessage) as protobufs.ReactionAddMessage;
//   };

//   const generateRemoveWithTimestamp = async (
//     fid: Uint8Array,
//     timestamp: number,
//     cast?: CastId | null
//   ): Promise<protobufs.ReactionRemoveMessage> => {
//     const removeBody = await Factories.ReactionBody.build(cast ? { target: cast.unpack() } : {});
//     const removeData = await Factories.ReactionRemoveData.create({ fid: Array.from(fid), timestamp, body: removeBody });
//     const removeMessage = await Factories.Message.create({ data: Array.from(removeData.bb?.bytes() ?? []) });
//     return new MessageModel(removeMessage) as protobufs.ReactionRemoveMessage;
//   };

//   beforeAll(async () => {
//     const time = getFarcasterTime()._unsafeUnwrap() - 10;
//     add1 = await generateAddWithTimestamp(fid, time + 1);
//     add2 = await generateAddWithTimestamp(fid, time + 2);
//     add3 = await generateAddWithTimestamp(fid, time + 3);
//     add4 = await generateAddWithTimestamp(fid, time + 4);
//     add5 = await generateAddWithTimestamp(fid, time + 5);
//     addOld1 = await generateAddWithTimestamp(fid, time - 60 * 60);
//     addOld2 = await generateAddWithTimestamp(fid, time - 60 * 60 + 1);

//     remove1 = await generateRemoveWithTimestamp(fid, time + 1, add1.body().target(new CastId()));
//     remove2 = await generateRemoveWithTimestamp(fid, time + 2, add2.body().target(new CastId()));
//     remove3 = await generateRemoveWithTimestamp(fid, time + 3, add3.body().target(new CastId()));
//     remove4 = await generateRemoveWithTimestamp(fid, time + 4, add4.body().target(new CastId()));
//     remove5 = await generateRemoveWithTimestamp(fid, time + 5, add5.body().target(new CastId()));
//     removeOld3 = await generateRemoveWithTimestamp(fid, time - 60 * 60 + 2);
//   });

//   describe('with size limit', () => {
//     const sizePrunedStore = new ReactionStore(db, eventHandler, { pruneSizeLimit: 3 });

//     test('no-ops when no messages have been merged', async () => {
//       const result = await sizePrunedStore.pruneMessages(fid);
//       expect(result._unsafeUnwrap()).toEqual(undefined);
//       expect(prunedMessages).toEqual([]);
//     });

//     test('prunes earliest add messages', async () => {
//       const messages = [add1, add2, add3, add4, add5];
//       for (const message of messages) {
//         await sizePrunedStore.merge(message);
//       }

//       const result = await sizePrunedStore.pruneMessages(fid);
//       expect(result._unsafeUnwrap()).toEqual(undefined);

//       expect(prunedMessages).toEqual([add1, add2]);

//       for (const message of prunedMessages as protobufs.ReactionAddMessage[]) {
//         const getAdd = () =>
//           sizePrunedStore.getReactionAdd(
//             fid,
//             message.body().type(),
//             message.body().target(new CastId()) ?? new CastId()
//           );
//         await expect(getAdd()).rejects.toThrow(HubError);
//       }
//     });

//     test('prunes earliest remove messages', async () => {
//       const messages = [remove1, remove2, remove3, remove4, remove5];
//       for (const message of messages) {
//         await sizePrunedStore.merge(message);
//       }

//       const result = await sizePrunedStore.pruneMessages(fid);
//       expect(result._unsafeUnwrap()).toEqual(undefined);

//       expect(prunedMessages).toEqual([remove1, remove2]);

//       for (const message of prunedMessages as protobufs.ReactionRemoveMessage[]) {
//         const getRemove = () =>
//           sizePrunedStore.getReactionRemove(
//             fid,
//             message.body().type(),
//             message.body().target(new CastId()) ?? new CastId()
//           );
//         await expect(getRemove()).rejects.toThrow(HubError);
//       }
//     });

//     test('prunes earliest messages', async () => {
//       const messages = [add1, remove2, add3, remove4, add5];
//       for (const message of messages) {
//         await sizePrunedStore.merge(message);
//       }

//       const result = await sizePrunedStore.pruneMessages(fid);
//       expect(result._unsafeUnwrap()).toEqual(undefined);

//       expect(prunedMessages).toEqual([add1, remove2]);
//     });

//     test('no-ops when adds have been removed', async () => {
//       const messages = [add1, remove1, add2, remove2, add3];
//       for (const message of messages) {
//         await sizePrunedStore.merge(message);
//       }

//       const result = await sizePrunedStore.pruneMessages(fid);
//       expect(result._unsafeUnwrap()).toEqual(undefined);

//       expect(prunedMessages).toEqual([]);
//     });
//   });

//   describe('with time limit', () => {
//     const timePrunedStore = new ReactionStore(db, eventHandler, { pruneTimeLimit: 60 * 60 - 1 });

//     test('prunes earliest messages', async () => {
//       const messages = [add1, remove2, addOld1, addOld2, removeOld3];
//       for (const message of messages) {
//         await timePrunedStore.merge(message);
//       }

//       const result = await timePrunedStore.pruneMessages(fid);
//       expect(result._unsafeUnwrap()).toEqual(undefined);

//       expect(prunedMessages).toEqual([addOld1, addOld2, removeOld3]);

//       await expect(
//         timePrunedStore.getReactionAdd(fid, addOld1.body().type(), addOld1.body().target(new CastId()) ?? new CastId())
//       ).rejects.toThrow(HubError);
//       await expect(
//         timePrunedStore.getReactionAdd(fid, addOld2.body().type(), addOld2.body().target(new CastId()) ?? new CastId())
//       ).rejects.toThrow(HubError);
//       await expect(
//         timePrunedStore.getReactionRemove(
//           fid,
//           removeOld3.body().type(),
//           removeOld3.body().target(new CastId()) ?? new CastId()
//         )
//       ).rejects.toThrow(HubError);
//     });
//   });
// });
