import { NameRegistryEventType } from '@hub/flatbuffers';
import { Factories } from '@hub/utils';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';
import { jestRocksDB } from '~/storage/db/jestUtils';

const db = jestRocksDB('flatbuffers.nameRegistryEventModel.test');

const fname = Factories.Fname.build();
const custody1 = Factories.Eip712Signer.build();

let model: NameRegistryEventModel;

beforeAll(async () => {
  const nameRegistryEvent = await Factories.NameRegistryEvent.create({
    fname: Array.from(fname),
    to: Array.from(custody1.signerKey),
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

      // Transfer evemt
      const transferNameRegistryEvent = await Factories.NameRegistryEvent.create({
        fname: Array.from(fname),
        from: Array.from(custody1.signerKey),
        to: Array.from(custody2.signerKey),
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
