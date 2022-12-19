import { arrayify } from 'ethers/lib/utils';
import Factories from '~/test/factories/flatbuffer';
import { generateEthereumSigner } from '~/utils/crypto';
import { jestBinaryRocksDB } from '../db/jestUtils';
import NameRegistryEventModel from './nameRegistryEventModel';

const db = jestBinaryRocksDB('flatbuffers.nameRegistryEventModel.test');

const fname = Factories.Fname.build();

let model: NameRegistryEventModel;
let custody1Address: Uint8Array;
let custody2Address: Uint8Array;

beforeAll(async () => {
  const custody1 = await generateEthereumSigner();
  custody1Address = arrayify(custody1.signerKey);

  const nameRegistryEvent = await Factories.NameRegistryEvent.create({
    fname: Array.from(fname),
    to: Array.from(custody1Address),
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

describe('transfer', () => {
  test('succeeds when fname is transfered', async () => {
    await model.put(db);

    const custody2 = await generateEthereumSigner();
    custody2Address = arrayify(custody2.signerKey);

    // Transfer evemt
    const transferNameRegistryEvent = await Factories.NameRegistryEvent.create({
      fname: Array.from(fname),
      from: Array.from(custody1Address),
      to: Array.from(custody2Address),
    });
    const model2 = new NameRegistryEventModel(transferNameRegistryEvent);
    await model2.put(db);

    await expect(NameRegistryEventModel.get(db, fname)).resolves.toEqual(model2);
  });
});
