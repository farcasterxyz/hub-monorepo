import Factories from '~/test/factories/flatbuffer';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import IdRegistryEventModel from './idRegistryEventModel';
import { HubError } from '~/utils/hubErrors';

const db = jestBinaryRocksDB('flatbuffers.contractEventModel.test');
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
});
