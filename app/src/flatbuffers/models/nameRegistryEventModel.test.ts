import { NameRegistryEventType } from '@hub/flatbuffers';
import Factories from '~/flatbuffers/factories';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';
import { jestRocksDB } from '~/storage/db/jestUtils';

const db = jestRocksDB('flatbuffers.nameRegistryEventModel.test');

const fname = Factories.Fname.build();

let model: NameRegistryEventModel;
let custody1Address: Uint8Array;
let custody2Address: Uint8Array;

beforeAll(async () => {
  const custody1 = Factories.Eip712Signer.build();
  custody1Address = custody1.signerKey;

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

describe('instance methods', () => {
  describe('put', () => {
    test('succeeds when fname is transfered', async () => {
      await model.put(db);

      const custody2 = Factories.Eip712Signer.build();
      custody2Address = custody2.signerKey;

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

  describe('typeName', () => {
    test('returns string version of type enum', async () => {
      const transfer = new NameRegistryEventModel(
        await Factories.NameRegistryEvent.create({ type: NameRegistryEventType.NameRegistryTransfer })
      );
      expect(transfer.typeName()).toEqual('NameRegistryTransfer');

      const renew = new NameRegistryEventModel(
        await Factories.NameRegistryEvent.create({ type: NameRegistryEventType.NameRegistryRenew })
      );
      expect(renew.typeName()).toEqual('NameRegistryRenew');
    });
  });
});
