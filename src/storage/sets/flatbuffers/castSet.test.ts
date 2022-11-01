import Factories from '~/test/factories/flatbuffer';
import CastSet from '~/storage/sets/flatbuffers/castSet';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { BadRequestError, NotFoundError } from '~/utils/errors';
import { CastAddModel, CastRemoveModel, UserPostfix } from '~/storage/flatbuffers/types';

const db = jestBinaryRocksDB('flatbuffers.castSet.test');
const set = new CastSet(db);
const fid = Factories.FID.build();

let castAdd: CastAddModel;
let castRemove: CastRemoveModel;

beforeAll(async () => {
  const castAddData = await Factories.CastAddData.create({ fid: Array.from(fid) });
  const castAddMessage = await Factories.Message.create({ data: Array.from(castAddData.bb?.bytes() ?? []) });
  castAdd = new MessageModel(castAddMessage) as CastAddModel;

  const castRemoveData = await Factories.CastRemoveData.create({
    fid: Array.from(fid),
    body: Factories.CastRemoveBody.build({ hash: Array.from(castAdd.tsHash()) }),
  });
  const castRemoveMessage = await Factories.Message.create({ data: Array.from(castRemoveData.bb?.bytes() ?? []) });
  castRemove = new MessageModel(castRemoveMessage) as CastRemoveModel;
});

describe('getCastAdd', () => {
  const getCastAdd = () => set.getCastAdd(fid, castAdd.tsHash());

  test('fails if missing', async () => {
    await expect(getCastAdd()).rejects.toThrow(NotFoundError);
  });

  test('returns message', async () => {
    await set.merge(castAdd);
    await expect(getCastAdd()).resolves.toEqual(castAdd);
  });
});

describe('getCastRemove', () => {
  const getCastRemove = () => set.getCastRemove(fid, castAdd.tsHash());

  test('fails if missing', async () => {
    await expect(getCastRemove()).rejects.toThrow(NotFoundError);
  });

  test('returns message', async () => {
    await set.merge(castRemove);
    await expect(getCastRemove()).resolves.toEqual(castRemove);
  });
});

describe('getCastAddsByUser', () => {
  test('returns cast adds for an fid', async () => {
    await set.merge(castAdd);
    await expect(set.getCastAddsByUser(fid)).resolves.toEqual([castAdd]);
  });

  test('returns empty array without messages', async () => {
    await expect(set.getCastAddsByUser(fid)).resolves.toEqual([]);
  });
});

describe('getCastRemovesByUser', () => {
  test('returns cast removes for an fid', async () => {
    await set.merge(castRemove);
    await expect(set.getCastRemovesByUser(fid)).resolves.toEqual([castRemove]);
  });

  test('returns empty array without messages', async () => {
    await expect(set.getCastRemovesByUser(fid)).resolves.toEqual([]);
  });
});

describe('getCastsByParent', () => {
  test('returns casts that reply to a parent cast', async () => {
    const sameParentData = await Factories.CastAddData.create({
      body: Factories.CastAddBody.build({ parent: castAdd.body().parent()?.unpack() || null }),
    });
    const sameParentMessage = await Factories.Message.create({
      data: Array.from(sameParentData.bb?.bytes() ?? []),
    });
    const sameParent = new MessageModel(sameParentMessage) as CastAddModel;

    await set.merge(castAdd);
    await set.merge(sameParent);

    const byParent = await set.getCastsByParent(
      castAdd.body().parent()?.fidArray() ?? new Uint8Array(),
      castAdd.body().parent()?.hashArray() ?? new Uint8Array()
    );
    expect(new Set(byParent)).toEqual(new Set([castAdd, sameParent]));
  });
});

describe('getCastsByMention', () => {
  test('returns casts that mention an fid', async () => {
    await set.merge(castAdd);
    await expect(set.getCastsByMention(fid)).resolves.toEqual([]);
    expect(castAdd.body().mentionsLength()).toBeGreaterThan(0);
    for (let i = 0; i < castAdd.body().mentionsLength(); i++) {
      const mentionFid = castAdd.body().mentions(i)?.fidArray() ?? new Uint8Array();
      await expect(set.getCastsByMention(mentionFid)).resolves.toEqual([castAdd]);
    }
  });
});

describe('merge', () => {
  test('fails with invalid message type', async () => {
    const invalidData = await Factories.ReactionAddData.create({ fid: Array.from(fid) });
    const message = await Factories.Message.create({ data: Array.from(invalidData.bb?.bytes() ?? []) });
    await expect(set.merge(new MessageModel(message))).rejects.toThrow(BadRequestError);
  });

  describe('CastRemove', () => {
    describe('succeeds', () => {
      beforeEach(async () => {
        await set.merge(castAdd);
        await expect(set.merge(castRemove)).resolves.toEqual(undefined);
      });

      test('saves message', async () => {
        await expect(MessageModel.get(db, fid, UserPostfix.CastMessage, castRemove.tsHash())).resolves.toEqual(
          castRemove
        );
      });

      test('saves castRemoves index', async () => {
        await expect(set.getCastRemove(fid, castRemove.body().hashArray() ?? new Uint8Array())).resolves.toEqual(
          castRemove
        );
      });

      test('deletes CastAdd message', async () => {
        await expect(MessageModel.get(db, fid, UserPostfix.CastMessage, castAdd.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });

      test('deletes castAdds index', async () => {
        await expect(set.getCastAdd(fid, castAdd.tsHash())).rejects.toThrow(NotFoundError);
      });

      test('deletes castsByParent index', async () => {
        await expect(
          set.getCastsByParent(
            castAdd.body().parent()?.fidArray() ?? new Uint8Array(),
            castAdd.body().parent()?.hashArray() ?? new Uint8Array()
          )
        ).resolves.toEqual([]);
      });

      test('deletes castsByMention index', async () => {
        for (let i = 0; i < castAdd.body().mentionsLength(); i++) {
          await expect(
            set.getCastsByMention(castAdd.body().mentions(i)?.fidArray() ?? new Uint8Array())
          ).resolves.toEqual([]);
        }
      });

      test('overwrites earlier CastRemove', async () => {
        // TODO: make it easier to construct conflicting messages
        const castRemoveData = await Factories.CastRemoveData.create({
          fid: Array.from(fid),
          body: Factories.CastRemoveBody.build({ hash: Array.from(castAdd.tsHash()) }),
          timestamp: castRemove.timestamp() + 1,
        });
        const castRemoveMessage = await Factories.Message.create({
          data: Array.from(castRemoveData.bb?.bytes() ?? []),
        });
        const castRemoveLater = new MessageModel(castRemoveMessage) as CastRemoveModel;

        await expect(set.merge(castRemoveLater)).resolves.toEqual(undefined);
        await expect(set.getCastRemove(fid, castAdd.tsHash())).resolves.toEqual(castRemoveLater);
        await expect(MessageModel.get(db, fid, UserPostfix.CastMessage, castRemove.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });

      test('no-ops when later CastRemove exists', async () => {
        const castRemoveData = await Factories.CastRemoveData.create({
          fid: Array.from(fid),
          body: Factories.CastRemoveBody.build({ hash: Array.from(castAdd.tsHash()) }),
          timestamp: castRemove.timestamp() - 1,
        });
        const castRemoveMessage = await Factories.Message.create({
          data: Array.from(castRemoveData.bb?.bytes() ?? []),
        });
        const castRemoveEarlier = new MessageModel(castRemoveMessage) as CastRemoveModel;
        await expect(set.merge(castRemoveEarlier)).resolves.toEqual(undefined);
        await expect(set.getCastRemove(fid, castAdd.tsHash())).resolves.toEqual(castRemove);
      });

      test('no-ops when merged twice', async () => {
        await expect(set.merge(castRemove)).resolves.toEqual(undefined);
        await expect(set.getCastRemove(fid, castRemove.body().hashArray() ?? new Uint8Array())).resolves.toEqual(
          castRemove
        );
      });
    });

    test('succeeds when CastAdd does not exist', async () => {
      await expect(set.merge(castRemove)).resolves.toEqual(undefined);
      await expect(set.getCastRemove(fid, castRemove.body().hashArray() ?? new Uint8Array())).resolves.toEqual(
        castRemove
      );
    });
  });

  describe('CastAdd', () => {
    describe('succeeds', () => {
      beforeEach(async () => {
        await expect(set.merge(castAdd)).resolves.toEqual(undefined);
      });

      test('saves message', async () => {
        await expect(MessageModel.get(db, fid, UserPostfix.CastMessage, castAdd.tsHash())).resolves.toEqual(castAdd);
      });

      test('saves castAdds index', async () => {
        await expect(set.getCastAdd(fid, castAdd.tsHash())).resolves.toEqual(castAdd);
      });

      test('saves castsByParent index', async () => {
        const byParent = set.getCastsByParent(
          castAdd.body().parent()?.fidArray() ?? new Uint8Array(),
          castAdd.body().parent()?.hashArray() ?? new Uint8Array()
        );
        await expect(byParent).resolves.toEqual([castAdd]);
      });

      test('saves castsByMention index', async () => {
        for (let i = 0; i < castAdd.body().mentionsLength(); i++) {
          await expect(
            set.getCastsByMention(castAdd.body().mentions(i)?.fidArray() ?? new Uint8Array())
          ).resolves.toEqual([castAdd]);
        }
      });
    });

    test('no-ops when CastRemove exists', async () => {
      await set.merge(castRemove);
      await expect(set.merge(castAdd)).resolves.toEqual(undefined);
      await expect(MessageModel.get(db, fid, UserPostfix.CastMessage, castAdd.tsHash())).rejects.toThrow(NotFoundError);
      await expect(set.getCastAdd(fid, castAdd.tsHash())).rejects.toThrow(NotFoundError);
    });

    test('no-ops when CastRemove exists with an earlier timestamp', async () => {
      const castRemoveData = await Factories.CastRemoveData.create({
        fid: Array.from(fid),
        body: Factories.CastRemoveBody.build({ hash: Array.from(castAdd.tsHash()) }),
        timestamp: castAdd.timestamp() - 1,
      });
      const castRemoveMessage = await Factories.Message.create({
        data: Array.from(castRemoveData.bb?.bytes() ?? []),
      });
      const castRemoveEarlier = new MessageModel(castRemoveMessage) as CastRemoveModel;
      await set.merge(castRemoveEarlier);
      await expect(set.merge(castAdd)).resolves.toEqual(undefined);
      await expect(MessageModel.get(db, fid, UserPostfix.CastMessage, castAdd.tsHash())).rejects.toThrow(NotFoundError);
      await expect(set.getCastAdd(fid, castAdd.tsHash())).rejects.toThrow(NotFoundError);
    });
  });
});
