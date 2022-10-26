import Faker from 'faker';
import { Factories } from '~/test/factories';
import { CastShort, Ed25519Signer, FollowAdd, MessageType } from '~/types';
import { generateEd25519Signer } from '~/utils/crypto';
import MessageDB from '~/storage/db/message';
import { jestRocksDB } from '~/storage/db/jestUtils';

const rocks = jestRocksDB('db.message.test');
const db = new MessageDB(rocks);

const fid = Faker.datatype.number();

/** Create sample data */
let signer: Ed25519Signer;
let cast1: CastShort;
let cast2: CastShort;
let follow1: FollowAdd;

beforeAll(async () => {
  signer = await generateEd25519Signer();
  cast1 = await Factories.CastShort.create({ data: { fid } }, { transient: { signer } });
  cast2 = await Factories.CastShort.create({ data: { fid } });
  follow1 = await Factories.FollowAdd.create({ data: { fid } }, { transient: { signer } });
});

describe('putMessage', () => {
  test('stores messages and indexes it by signer', async () => {
    await expect(db.putMessage(cast1)).resolves.toEqual(undefined);
    await expect(db.getMessage(cast1.hash)).resolves.toEqual(cast1);
    await expect(db.getMessagesBySigner(cast1.data.fid, cast1.signer)).resolves.toEqual([cast1]);
  });

  test('benchmark', async () => {
    const num = 100000;
    const start = new Date().getTime();

    let i = 0;
    while (i < num) {
      await db.putMessage(cast1);
      const message = await db.getMessage<CastShort>(cast1.hash);
      message.signature;
      message.data.body.text;
      i++;
    }

    const end = new Date().getTime() - start;
    console.log(end);
  });
});

describe('getMessage', () => {
  test('succeeds when message exists', async () => {
    await db.putMessage(cast1);
    await expect(db.getMessage(cast1.hash)).resolves.toEqual(cast1);
  });

  test('fails when message not found', async () => {
    await expect(db.getMessage(cast1.hash)).rejects.toThrow();
  });
});

describe('getMessages', () => {
  test('returns array of messages', async () => {
    await db.putMessage(cast1);
    await db.putMessage(cast2);
    await db.putMessage(follow1);

    const res = await db.getMessages([cast1.hash, cast2.hash, follow1.hash]);
    expect(res).toEqual([cast1, cast2, follow1]);
  });

  test('returns empty array when messages not found', async () => {
    const res = await db.getMessages([cast1.hash, cast2.hash, follow1.hash]);
    expect(res).toEqual([]);
  });
});

describe('deleteMessage', () => {
  test('deletes message and index', async () => {
    await db.putMessage(cast1);

    await expect(db.deleteMessage(cast1.hash)).resolves.toEqual(undefined);

    await expect(db.getMessage(cast1.hash)).rejects.toThrow();
    await expect(db.getMessagesBySigner(cast1.data.fid, cast1.signer)).resolves.toEqual([]);
  });
});

describe('getMessagesBySigner', () => {
  test('returns array of messages', async () => {
    await db.putMessage(cast1);
    await db.putMessage(cast2);
    await db.putMessage(follow1);

    const wrongFid = await db.getMessagesBySigner(fid + 1, signer.signerKey);
    expect(wrongFid).toEqual([]);

    const allMessages = await db.getMessagesBySigner(fid, signer.signerKey);
    expect(allMessages).toEqual([cast1, follow1]);

    const casts = await db.getMessagesBySigner(fid, signer.signerKey, MessageType.CastShort);
    expect(casts).toEqual([cast1]);

    const follows = await db.getMessagesBySigner(fid, signer.signerKey, MessageType.FollowAdd);
    expect(follows).toEqual([follow1]);
  });
});
