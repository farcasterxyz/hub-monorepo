import RocksDB from '~/storage/db/rocksdb';
import SignerDB from '~/storage/db/signer';
import { Factories } from '~/test/factories';
import { SignerAdd } from '~/types';

const rocks = new RocksDB('db.signer.test');
const db = new SignerDB(rocks);

beforeAll(async () => {
  await rocks.open();
});

beforeEach(async () => {
  await rocks.clear();
});

afterAll(async () => {
  await rocks.close();
  await rocks.destroy();
});

/** Test data */
let signerAdd1: SignerAdd;

beforeAll(async () => {
  signerAdd1 = await Factories.SignerAdd.create();
});

describe('putSignerAdd', () => {
  test('stores a SignerAdd message', async () => {
    await expect(db.putSignerAdd(signerAdd1)).resolves.toEqual(undefined);
    const getSigner = await db.getSignerAdd(signerAdd1.data.fid, signerAdd1.signer, signerAdd1.data.body.delegate);
    expect(getSigner).toEqual(signerAdd1);
  });
});

describe('getSignerAdd', () => {
  test('returns a SignerAdd message', async () => {
    await db.putSignerAdd(signerAdd1);
    const getSigner = db.getSignerAdd(signerAdd1.data.fid, signerAdd1.signer, signerAdd1.data.body.delegate);
    await expect(getSigner).resolves.toEqual(signerAdd1);
  });

  test('fails if signer not found', async () => {
    const getSigner = db.getSignerAdd(signerAdd1.data.fid, signerAdd1.signer, signerAdd1.data.body.delegate);
    await expect(getSigner).rejects.toThrow();
  });
});
