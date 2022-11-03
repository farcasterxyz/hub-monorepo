import Factories from '~/test/factories/flatbuffer';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { BadRequestError, NotFoundError } from '~/utils/errors';
import { UserDataAddModel, UserPostfix } from '~/storage/flatbuffers/types';
import { UserDataType } from '~/utils/generated/message_generated';
import UserDataSet from '~/storage/sets/flatbuffers/userDataStore';

const db = jestBinaryRocksDB('flatbuffers.userDataSet.test');
const set = new UserDataSet(db);
const fid = Factories.FID.build();

let addPfp: UserDataAddModel;
let changePfp: UserDataAddModel;
let addBio: UserDataAddModel;

beforeAll(async () => {
  const addPfpData = await Factories.UserDataAddData.create({
    fid: Array.from(fid),
    body: Factories.UserDataBody.build({ type: UserDataType.Pfp }),
  });
  addPfp = new MessageModel(
    await Factories.Message.create({ data: Array.from(addPfpData.bb?.bytes() ?? []) })
  ) as UserDataAddModel;

  const changePfpData = await Factories.UserDataAddData.create({
    fid: Array.from(fid),
    body: Factories.UserDataBody.build({ type: UserDataType.Pfp }),
    timestamp: addPfp.timestamp() + 1,
  });
  changePfp = new MessageModel(
    await Factories.Message.create({ data: Array.from(changePfpData.bb?.bytes() ?? []) })
  ) as UserDataAddModel;

  const addBioData = await Factories.UserDataAddData.create({
    fid: Array.from(fid),
    body: Factories.UserDataBody.build({ type: UserDataType.Bio }),
  });
  addBio = new MessageModel(
    await Factories.Message.create({ data: Array.from(addBioData.bb?.bytes() ?? []) })
  ) as UserDataAddModel;
});

describe('getUserDataAdd', () => {
  test('fails if missing', async () => {
    await expect(set.getUserDataAdd(fid, UserDataType.Pfp)).rejects.toThrow(NotFoundError);
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

  test('returns empty array without messages', async () => {
    await expect(set.getUserDataAddsByUser(fid)).resolves.toEqual([]);
  });
});

describe('merge', () => {
  test('fails with invalid message type', async () => {
    const invalidData = await Factories.ReactionAddData.create({ fid: Array.from(fid) });
    const message = await Factories.Message.create({ data: Array.from(invalidData.bb?.bytes() ?? []) });
    await expect(set.merge(new MessageModel(message))).rejects.toThrow(BadRequestError);
  });

  describe('UserDataAdd', () => {
    describe('succeeds', () => {
      beforeEach(async () => {
        await expect(set.merge(addPfp)).resolves.toEqual(undefined);
      });

      test('saves message', async () => {
        await expect(MessageModel.get(db, fid, UserPostfix.UserDataMessage, addPfp.tsHash())).resolves.toEqual(addPfp);
      });

      test('saves userDataAdds index', async () => {
        await expect(set.getUserDataAdd(fid, UserDataType.Pfp)).resolves.toEqual(addPfp);
      });

      test('no-ops when merged twice', async () => {
        await expect(set.merge(addPfp)).resolves.toEqual(undefined);
        await expect(set.getUserDataAdd(fid, UserDataType.Pfp)).resolves.toEqual(addPfp);
      });

      test('does not conflict with UserDataAdd of different type', async () => {
        await set.merge(addBio);
        expect(new Set(await set.getUserDataAddsByUser(fid))).toEqual(new Set([addBio, addPfp]));
      });
    });

    describe('with conflicting UserDataAdd', () => {
      test('succeeds with a later timestamp', async () => {
        await set.merge(addPfp);
        await expect(set.merge(changePfp)).resolves.toEqual(undefined);
        await expect(set.getUserDataAdd(fid, UserDataType.Pfp)).resolves.toEqual(changePfp);
        await expect(MessageModel.get(db, fid, UserPostfix.UserDataMessage, addPfp.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(changePfp);
        await expect(set.merge(addPfp)).resolves.toEqual(undefined);
        await expect(set.getUserDataAdd(fid, UserDataType.Pfp)).resolves.toEqual(changePfp);
        await expect(MessageModel.get(db, fid, UserPostfix.UserDataMessage, addPfp.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });
    });
  });
});
