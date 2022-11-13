import Factories from '~/test/factories/flatbuffer';
import CastStore from '~/storage/sets/flatbuffers/castStore';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { CastAddModel, CastRemoveModel, UserPostfix } from '~/storage/flatbuffers/types';
import { HubError } from '~/utils/hubErrors';
import { bytesDecrement, bytesIncrement } from '~/storage/flatbuffers/utils';

const db = jestBinaryRocksDB('flatbuffers.castStore.test');
const store = new CastStore(db);
const fid = Factories.FID.build();

let castAdd: CastAddModel;
let castRemove: CastRemoveModel;
let parentFid: Uint8Array;
let parentTsHash: Uint8Array;

beforeAll(async () => {
  const addData = await Factories.CastAddData.create({ fid: Array.from(fid) });
  const addMessage = await Factories.Message.create({ data: Array.from(addData.bb?.bytes() ?? []) });
  castAdd = new MessageModel(addMessage) as CastAddModel;

  parentFid = castAdd.body().parent()?.fidArray() ?? new Uint8Array();
  parentTsHash = castAdd.body().parent()?.tsHashArray() ?? new Uint8Array();

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
      body: Factories.CastAddBody.build({ parent: castAdd.body().parent()?.unpack() || null }),
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
        message.body().parent()?.fidArray() ?? new Uint8Array(),
        message.body().parent()?.tsHashArray() ?? new Uint8Array()
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
