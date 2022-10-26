import Factories from '~/test/factories/flatbuffer';
import { KeyPair } from '~/types';
import { generateEd25519KeyPair } from '~/utils/crypto';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import { NotFoundError } from '~/utils/errors';
import MessageModel from '~/storage/flatbuffers/model';

const db = jestBinaryRocksDB('flatbuffers.model.test');

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

  describe('primaryKey', () => {
    test('orders messages by fid and timestamp hash', async () => {
      const tsx = db
        .transaction()
        .put(MessageModel.primaryKey(new Uint8Array([1]), new Uint8Array([1, 1])), Buffer.from('a'))
        .put(MessageModel.primaryKey(new Uint8Array([2]), new Uint8Array([2, 1])), Buffer.from('b'))
        .put(MessageModel.primaryKey(new Uint8Array([2]), new Uint8Array([1, 1])), Buffer.from('c'))
        .put(MessageModel.primaryKey(new Uint8Array([3]), new Uint8Array([1, 1])), Buffer.from('d'))
        .put(MessageModel.primaryKey(new Uint8Array([4]), new Uint8Array([1])), Buffer.from('e'));

      await db.commit(tsx);
      const order = [];
      for await (const [_, value] of db.iterator({ keys: false, valueAsBuffer: false })) {
        order.push(value);
      }
      expect(order).toEqual(['a', 'c', 'b', 'd', 'e']);
    });

    test('orders messages with variable length fids', async () => {
      const tsx = db
        .transaction()
        .put(MessageModel.primaryKey(new Uint8Array([1]), new Uint8Array([1, 1])), Buffer.from('a'))
        .put(MessageModel.primaryKey(new Uint8Array([1, 1, 1]), new Uint8Array([2, 1])), Buffer.from('b'))
        .put(MessageModel.primaryKey(new Uint8Array([2]), new Uint8Array([1, 1])), Buffer.from('c'))
        .put(MessageModel.primaryKey(new Uint8Array([2, 1]), new Uint8Array([1, 1])), Buffer.from('d'))
        .put(MessageModel.primaryKey(new Uint8Array([4]), new Uint8Array([1])), Buffer.from('e'));

      await db.commit(tsx);
      const order = [];
      for await (const [, value] of db.iterator({ keys: false, valueAsBuffer: false })) {
        order.push(value);
      }
      expect(order).toEqual(['a', 'c', 'e', 'd', 'b']);
    });

    test('orders messages when fids overlap', async () => {
      const tsx = db
        .transaction()
        .put(MessageModel.primaryKey(new Uint8Array([1, 1]), new Uint8Array([1, 1])), Buffer.from('a'))
        .put(MessageModel.primaryKey(new Uint8Array([1, 1, 1]), new Uint8Array([2, 1])), Buffer.from('b'))
        .put(MessageModel.primaryKey(new Uint8Array([1, 1, 1]), new Uint8Array([1, 2])), Buffer.from('c'))
        .put(MessageModel.primaryKey(new Uint8Array([1, 1]), new Uint8Array([1, 2])), Buffer.from('d'))
        .put(MessageModel.primaryKey(new Uint8Array([4]), new Uint8Array([1])), Buffer.from('e'));

      await db.commit(tsx);

      const byPrefix = [];
      for await (const [, value] of db.iteratorByPrefix(MessageModel.userKey(new Uint8Array([1, 1, 1])), {
        keys: false,
        valueAsBuffer: false,
      })) {
        byPrefix.push(value);
      }
      expect(byPrefix).toEqual(['c', 'b']);

      const totalOrder = [];
      for await (const [, value] of db.iterator({ keys: false, valueAsBuffer: false })) {
        totalOrder.push(value);
      }
      expect(totalOrder).toEqual(['e', 'a', 'd', 'c', 'b']);
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

  describe('timestampHash', () => {
    test('orders messages by timestamp and hash', async () => {
      const aData = await Factories.MessageData.create({ timestamp: 1 });
      const a = new MessageModel(
        await Factories.Message.create({ data: Array.from(aData.bb?.bytes() ?? new Uint8Array()) })
      );

      const bData = await Factories.MessageData.create({ timestamp: model.timestamp() + 60 * 60 * 24 * 365 });
      const b = new MessageModel(
        await Factories.Message.create({ data: Array.from(bData.bb?.bytes() ?? new Uint8Array()) })
      );

      const cData = await Factories.MessageData.create({ timestamp: model.timestamp() - 60 });
      const c = new MessageModel(
        await Factories.Message.create({ data: Array.from(cData.bb?.bytes() ?? new Uint8Array()) })
      );

      const tsx = db
        .transaction()
        .put(Buffer.from(model.timestampHash()), Buffer.from('m'))
        .put(Buffer.from(a.timestampHash()), Buffer.from('a'))
        .put(Buffer.from(b.timestampHash()), Buffer.from('b'))
        .put(Buffer.from(c.timestampHash()), Buffer.from('c'));

      await db.commit(tsx);

      const order = [];
      for await (const [, value] of db.iterator({ keys: false, valueAsBuffer: false })) {
        order.push(value);
      }
      expect(order).toEqual(['a', 'c', 'm', 'b']);
    });
  });
});
