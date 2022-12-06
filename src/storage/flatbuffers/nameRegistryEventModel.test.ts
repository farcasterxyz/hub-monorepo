import Factories from '~/test/factories/flatbuffer';
import { jestBinaryRocksDB } from '../db/jestUtils';
import NameRegistryEventModel from './nameRegistryEventModel';

const db = jestBinaryRocksDB('flatbuffers.nameRegistryEventModel.test');
const fname = Factories.Fname.build();

let model: NameRegistryEventModel;

beforeAll(async () => {
  const nameRegistryEvent = await Factories.NameRegistryEvent.create({
    fname: Array.from(fname),
  });
  model = new NameRegistryEventModel(nameRegistryEvent);
});

describe('static methods', () => {
  describe('get', () => {
    test('succeeds when event exists', async () => {
      await model.put(db);
      await expect(NameRegistryEventModel.get(db, fname)).resolves.toEqual(model);
    });

    test('fails when event not found', async () => {
      await expect(NameRegistryEventModel.get(db, fname)).rejects.toThrow();
    });
  });
});
