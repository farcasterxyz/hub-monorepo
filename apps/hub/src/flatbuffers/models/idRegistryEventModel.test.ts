import { IdRegistryEventType } from '@farcaster/flatbuffers';
import { Factories, HubError } from '@farcaster/utils';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import { jestRocksDB } from '~/storage/db/jestUtils';

const db = jestRocksDB('flatbuffers.contractEventModel.test');
const fid = Factories.FID.build();

let model: IdRegistryEventModel;

beforeAll(async () => {
  const idRegistryEvent = await Factories.IdRegistryEvent.create({ fid: Array.from(fid) });
  model = new IdRegistryEventModel(idRegistryEvent);
});

describe('static methods', () => {
  describe('get', () => {
    test('succeeds when event exists', async () => {
      await model.put(db);
      await expect(IdRegistryEventModel.get(db, fid)).resolves.toEqual(model);
    });

    test('fails when event not found', async () => {
      await expect(IdRegistryEventModel.get(db, fid)).rejects.toThrow(HubError);
    });
  });

  describe('constructor', () => {
    test('fails with invalid type', async () => {
      const invalidTypeEvent = await Factories.IdRegistryEvent.create({ type: 0 });
      expect(() => new IdRegistryEventModel(invalidTypeEvent)).toThrow();
    });
  });
});

describe('instance methods', () => {
  describe('typeName', () => {
    test('returns string version of type enum', async () => {
      const register = new IdRegistryEventModel(
        await Factories.IdRegistryEvent.create({ type: IdRegistryEventType.IdRegistryRegister })
      );
      expect(register.typeName()).toEqual('IdRegistryRegister');

      const transfer = new IdRegistryEventModel(
        await Factories.IdRegistryEvent.create({ type: IdRegistryEventType.IdRegistryTransfer })
      );
      expect(transfer.typeName()).toEqual('IdRegistryTransfer');
    });
  });
});
