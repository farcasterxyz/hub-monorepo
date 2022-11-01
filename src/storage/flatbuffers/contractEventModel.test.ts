import Factories from '~/test/factories/flatbuffer';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import { NotFoundError } from '~/utils/errors';
import ContractEventModel from './contractEventModel';

const db = jestBinaryRocksDB('flatbuffers.contractEventModel.test');
const fid = Factories.FID.build();

let model: ContractEventModel;

beforeAll(async () => {
  const idRegistryEvent = await Factories.IDRegistryEvent.create({ fid: Array.from(fid) });
  model = new ContractEventModel(idRegistryEvent);
});

describe('static methods', () => {
  describe('get', () => {
    test('succeeds when event exists', async () => {
      await model.put(db);
      await expect(ContractEventModel.get(db, fid)).resolves.toEqual(model);
    });

    test('fails when event not found', async () => {
      await expect(ContractEventModel.get(db, fid)).rejects.toThrow(NotFoundError);
    });
  });
});
