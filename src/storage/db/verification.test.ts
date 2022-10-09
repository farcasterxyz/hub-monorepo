import { Factories } from '~/test/factories';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { Ed25519Signer, VerificationEthereumAddress, VerificationRemove } from '~/types';
import { NotFoundError } from '~/utils/errors';
import { generateEd25519Signer } from '~/utils/utils';
import VerificationDB from '~/storage/db/verification';

const rocks = jestRocksDB('db.verification.test');
const db = new VerificationDB(rocks);

/** Test data */
let signer: Ed25519Signer;
let fid: number;
let claimHash: string;
let verification1: VerificationEthereumAddress;
let verification2: VerificationEthereumAddress;
let verification3: VerificationEthereumAddress;
let verificationRemove1: VerificationRemove;

beforeAll(async () => {
  signer = await generateEd25519Signer();
  verification1 = await Factories.VerificationEthereumAddress.create({}, { transient: { signer } });
  fid = verification1.data.fid;
  claimHash = verification1.data.body.claimHash;
  verification2 = await Factories.VerificationEthereumAddress.create({
    data: { body: { claimHash } },
  });
  verification3 = await Factories.VerificationEthereumAddress.create({ data: { fid } }, { transient: { signer } });
  verificationRemove1 = await Factories.VerificationRemove.create(
    { data: { fid, body: { claimHash } } },
    { transient: { signer } }
  );
});

describe('putVerificationAdd', () => {
  test('stores a VerificationEthereumAddress message', async () => {
    await expect(db.putVerificationAdd(verification1)).resolves.toEqual(undefined);
    await expect(db.getVerificationAdd(fid, claimHash)).resolves.toEqual(verification1);
  });

  test('deletes associated VerificationRemove', async () => {
    await db.putVerificationRemove(verificationRemove1);
    await expect(db.putVerificationAdd(verification1)).resolves.toEqual(undefined);
    await expect(db.getVerificationAdd(fid, claimHash)).resolves.toEqual(verification1);
    await expect(db.getVerificationRemove(fid, claimHash)).rejects.toThrow(NotFoundError);
    await expect(db.getAllVerificationMessagesByUser(fid)).resolves.toEqual([verification1]);
  });
});

describe('getVerificationAddsByUser', () => {
  test('returns array of VerificationEthereumAddress messages', async () => {
    await db.putVerificationAdd(verification1);
    await db.putVerificationAdd(verification2);
    await db.putVerificationAdd(verification3);
    expect(new Set(await db.getVerificationAddsByUser(fid))).toEqual(new Set([verification1, verification3]));
    await expect(db.getVerificationAddsByUser(verification2.data.fid)).resolves.toEqual([verification2]);
  });
});

describe('getAllVerificationMessagesByUser', () => {
  test('returns array of VerificationEthereumAddress and VerificationRemove messages', async () => {
    await db.putVerificationAdd(verification3);
    await db.putVerificationRemove(verificationRemove1);
    const messages = await db.getAllVerificationMessagesByUser(fid);
    expect(new Set(messages)).toEqual(new Set([verification3, verificationRemove1]));
  });
});

describe('deleteAllVerificationMessagesBySigner', () => {
  test('deletes all VerificationEthereumAddress and VerificationRemove messages from a signer', async () => {
    await db.putVerificationAdd(verification3);
    await db.putVerificationRemove(verificationRemove1);
    await expect(db.deleteAllVerificationMessagesBySigner(fid, signer.signerKey)).resolves.toEqual(undefined);
    const messages = await db.getAllVerificationMessagesByUser(fid);
    expect(messages).toEqual([]);
  });
});
