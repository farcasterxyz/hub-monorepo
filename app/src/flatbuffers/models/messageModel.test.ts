import Factories from '~/flatbuffers/factories';
import MessageModel, { TRUE_VALUE } from '~/flatbuffers/models/messageModel';
import { UserPostfix } from '~/flatbuffers/models/types';
import { bytesCompare } from '~/flatbuffers/utils/bytes';
import { toFarcasterTime } from '~/flatbuffers/utils/time';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { HubError } from '~/utils/hubErrors';

const db = jestRocksDB('flatbuffers.model.test');

const signer = Factories.Ed25519Signer.build();
let model: MessageModel;

beforeAll(async () => {
  const message = await Factories.Message.create({}, { transient: { signer } });
  model = new MessageModel(message);
});

describe('static methods', () => {
  describe('constructor', () => {
    test('fails with missing message type', async () => {
      const missingTypeData = await Factories.MessageData.create({ type: null });
      const missingTypeMessage = await Factories.Message.create({
        data: Array.from(missingTypeData.bb?.bytes() ?? new Uint8Array()),
      });
      expect(() => new MessageModel(missingTypeMessage)).toThrow(
        new HubError('bad_request.invalid_param', 'message type is missing')
      );
    });

    test('fails with invalid message type', async () => {
      const invalidTypeData = await Factories.MessageData.create({ type: 100 });
      const invalidTypeMessage = await Factories.Message.create({
        data: Array.from(invalidTypeData.bb?.bytes() ?? new Uint8Array()),
      });
      expect(() => new MessageModel(invalidTypeMessage)).toThrow(
        new HubError('bad_request.invalid_param', 'message type is invalid')
      );
    });
  });

  describe('from', () => {
    test('fails with empty byte array', () => {
      expect(() => MessageModel.from(new Uint8Array())).toThrow(
        new HubError('bad_request.invalid_param', 'message type is missing')
      );
    });
  });

  describe('get', () => {
    test('succeeds when message exists', async () => {
      await model.put(db);
      await expect(MessageModel.get(db, model.fid(), model.setPostfix(), model.tsHash())).resolves.toEqual(model);
    });

    test('fails when message not found', async () => {
      await expect(MessageModel.get(db, model.fid(), model.setPostfix(), model.tsHash())).rejects.toThrow(HubError);
    });

    test('fails with wrong key', async () => {
      await model.put(db);
      const badKey = new Uint8Array([...model.tsHash(), 1]);
      await expect(MessageModel.get(db, model.fid(), model.setPostfix(), badKey)).rejects.toThrow(HubError);
    });
  });

  describe('getManyByUser', () => {
    test('succeeds', async () => {
      await model.put(db);
      const getMany = MessageModel.getManyByUser(db, model.fid(), model.setPostfix(), [model.tsHash()]);
      await expect(getMany).resolves.toEqual([model]);
    });
  });

  describe('getAllBySigner', () => {
    test('succeeds', async () => {
      await model.put(db);
      const getBySigner = MessageModel.getAllBySigner(db, model.fid(), model.signer());
      await expect(getBySigner).resolves.toEqual([model]);
    });
  });

  describe('primaryKey', () => {
    test('orders messages by fid and timestamp hash', async () => {
      const tsx = db
        .transaction()
        .put(
          MessageModel.primaryKey(new Uint8Array([1]), UserPostfix.CastMessage, new Uint8Array([1, 1])),
          Buffer.from('a')
        )
        .put(
          MessageModel.primaryKey(new Uint8Array([2]), UserPostfix.CastMessage, new Uint8Array([2, 1])),
          Buffer.from('b')
        )
        .put(
          MessageModel.primaryKey(new Uint8Array([2]), UserPostfix.CastMessage, new Uint8Array([1, 1])),
          Buffer.from('c')
        )
        .put(
          MessageModel.primaryKey(new Uint8Array([3]), UserPostfix.CastMessage, new Uint8Array([1, 1])),
          Buffer.from('d')
        )
        .put(
          MessageModel.primaryKey(new Uint8Array([4]), UserPostfix.CastMessage, new Uint8Array([1])),
          Buffer.from('e')
        );

      await db.commit(tsx);
      const order = [];
      for await (const [, value] of db.iterator({ keys: false, valueAsBuffer: false })) {
        order.push(value);
      }
      expect(order).toEqual(['a', 'c', 'b', 'd', 'e']);
    });

    test('orders messages with variable length fids', async () => {
      const tsx = db
        .transaction()
        .put(
          MessageModel.primaryKey(new Uint8Array([1]), UserPostfix.CastMessage, new Uint8Array([1, 1])),
          Buffer.from('a')
        )
        .put(
          MessageModel.primaryKey(new Uint8Array([1, 1, 1]), UserPostfix.CastMessage, new Uint8Array([2, 1])),
          Buffer.from('b')
        )
        .put(
          MessageModel.primaryKey(new Uint8Array([2]), UserPostfix.CastMessage, new Uint8Array([1, 1])),
          Buffer.from('c')
        )
        .put(
          MessageModel.primaryKey(new Uint8Array([2, 1]), UserPostfix.CastMessage, new Uint8Array([1, 1])),
          Buffer.from('d')
        )
        .put(
          MessageModel.primaryKey(new Uint8Array([4]), UserPostfix.CastMessage, new Uint8Array([1])),
          Buffer.from('e')
        );

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
        .put(
          MessageModel.primaryKey(new Uint8Array([1, 1]), UserPostfix.CastMessage, new Uint8Array([1, 1])),
          Buffer.from('a')
        )
        .put(
          MessageModel.primaryKey(new Uint8Array([1, 1, 1]), UserPostfix.CastMessage, new Uint8Array([2, 1])),
          Buffer.from('b')
        )
        .put(
          MessageModel.primaryKey(new Uint8Array([1, 1, 1]), UserPostfix.CastMessage, new Uint8Array([1, 2])),
          Buffer.from('c')
        )
        .put(
          MessageModel.primaryKey(new Uint8Array([1, 1]), UserPostfix.CastMessage, new Uint8Array([1, 2])),
          Buffer.from('d')
        )
        .put(
          MessageModel.primaryKey(new Uint8Array([4]), UserPostfix.CastMessage, new Uint8Array([1])),
          Buffer.from('e')
        );

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

  describe('tsHash', () => {
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
        .put(Buffer.from(model.tsHash()), Buffer.from('m'))
        .put(Buffer.from(a.tsHash()), Buffer.from('a'))
        .put(Buffer.from(b.tsHash()), Buffer.from('b'))
        .put(Buffer.from(c.tsHash()), Buffer.from('c'));

      await db.commit(tsx);

      const order = [];
      for await (const [, value] of db.iterator({ keys: false, valueAsBuffer: false })) {
        order.push(value);
      }
      expect(order).toEqual(['a', 'c', 'm', 'b']);
    });

    test('stores timestamp in big-endian order', () => {
      const time = toFarcasterTime(Date.now());
      const hash = Factories.Bytes.build({}, { transient: { length: 16 } });
      const a = MessageModel.tsHash(time, hash);
      const b = MessageModel.tsHash(time + 1, hash);
      expect(bytesCompare(a, b)).toEqual(-1);
    });

    test('is fixed size, even with small timestamp', () => {
      const hash = Factories.Bytes.build({}, { transient: { length: 16 } });
      const tsHash = MessageModel.tsHash(1, hash);
      expect(tsHash.length).toEqual(20);
    });
  });
});

describe('instance methods', () => {
  describe('put', () => {
    beforeEach(async () => {
      await expect(model.put(db)).resolves.toEqual(undefined);
    });
    test('stores binary message', async () => {
      const get = MessageModel.get(db, model.fid(), model.setPostfix(), model.tsHash());
      await expect(get).resolves.toEqual(model);
    });

    test('indexes message by signer', async () => {
      await expect(db.get(model.bySignerKey())).resolves.toEqual(TRUE_VALUE);
    });
  });

  describe('typeName', () => {
    test('returns string version of type enum', async () => {
      const reactionAddData = await Factories.ReactionAddData.create();
      const reactionAdd = new MessageModel(
        await Factories.Message.create({
          data: Array.from(reactionAddData.bb?.bytes() ?? new Uint8Array()),
        })
      );
      expect(reactionAdd.typeName()).toEqual('ReactionAdd');

      const signerAddData = await Factories.SignerAddData.create();
      const signerAdd = new MessageModel(
        await Factories.Message.create({
          data: Array.from(signerAddData.bb?.bytes() ?? new Uint8Array()),
        })
      );
      expect(signerAdd.typeName()).toEqual('SignerAdd');
    });
  });
});
