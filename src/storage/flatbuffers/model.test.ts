import Factories from '~/test/factories/flatbuffer';
import { KeyPair } from '~/types';
import { generateEd25519KeyPair } from '~/utils/crypto';
import RocksDB from '~/storage/db/binaryrocksdb';
import { NotFoundError } from '~/utils/errors';
import MessageModel from '~/storage/flatbuffers/model';

const db = new RocksDB('db.flatmessage.test');

beforeAll(async () => {
  await expect(db.open()).resolves.not.toThrow();
});

afterEach(async () => {
  await expect(db.clear()).resolves.not.toThrow();
});

afterAll(async () => {
  await expect(db.close()).resolves.not.toThrow();
  await expect(db.destroy()).resolves.not.toThrow();
});

let signer: KeyPair;
let model: MessageModel;

beforeAll(async () => {
  signer = await generateEd25519KeyPair();
  const message = await Factories.Message.create({}, { transient: { signer } });
  model = new MessageModel(message);
});

describe('static methods', () => {
  describe('get', () => {
    test('succeeds when message exists', async () => {
      await model.commit(db);
      await expect(MessageModel.get(db, model.fid(), model.timestampHash())).resolves.toEqual(model);
    });

    test('fails when message not found', async () => {
      await expect(MessageModel.get(db, model.fid(), model.timestampHash())).rejects.toThrow(NotFoundError);
    });

    test('fails with wrong key', async () => {
      await model.commit(db);
      const badKey = new Uint8Array([...model.timestampHash(), 1]);
      await expect(MessageModel.get(db, model.fid(), badKey)).rejects.toThrow(NotFoundError);
    });
  });
});

describe('instance methods', () => {
  describe('commit', () => {
    test('stores binary message', async () => {
      await expect(model.commit(db)).resolves.toEqual(undefined);
      const get = MessageModel.get(db, model.fid(), model.timestampHash());
      await expect(get).resolves.toEqual(model);
    });
  });
});
