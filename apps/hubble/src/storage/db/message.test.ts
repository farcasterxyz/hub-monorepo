import { MessageType } from '@farcaster/protobufs';
import { bytesCompare, Factories, HubError } from '@farcaster/utils';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { TRUE_VALUE, UserPostfix } from '~/storage/db/types';
import {
  getAllMessagesByFid,
  getAllMessagesBySigner,
  getManyMessages,
  getMessage,
  makeMessagePrimaryKey,
  makeMessagePrimaryKeyFromMessage,
  makeTsHash,
  makeUserKey,
  putMessage,
  typeToSetPostfix,
} from './message';

const db = jestRocksDB('storage.db.message.test');

const signer = Factories.Ed25519Signer.build();

const castMessage = await Factories.CastAddMessage.create({}, { transient: { signer } });
const ampMessage = await Factories.AmpAddMessage.create({}, { transient: { signer } });

describe('makeUserKey', () => {
  test('orders keys by fid', () => {
    const key1 = makeUserKey(1_000);
    const key2 = makeUserKey(1_001);
    const key3 = makeUserKey(1_000_000);
    expect(bytesCompare(key1, key2)).toEqual(-1);
    expect(bytesCompare(key2, key3)).toEqual(-1);
  });
});

describe('makeMessagePrimaryKey', () => {
  test('orders keys by fid, set, tsHash', async () => {
    const tsHash1 = makeTsHash(castMessage.data.timestamp, castMessage.hash)._unsafeUnwrap();
    const tsHash2 = makeTsHash(castMessage.data.timestamp + 1, castMessage.hash)._unsafeUnwrap();
    const key1 = makeMessagePrimaryKey(10, UserPostfix.CastMessage, tsHash1);
    const key2 = makeMessagePrimaryKey(10, UserPostfix.CastMessage, tsHash2);
    const key3 = makeMessagePrimaryKey(10, UserPostfix.AmpMessage, tsHash1);
    const key4 = makeMessagePrimaryKey(11, UserPostfix.CastMessage, tsHash1);
    const key5 = makeMessagePrimaryKey(11_000_000, UserPostfix.CastMessage, tsHash1);
    for (const key of [key1, key2, key3, key4, key5]) {
      await db.put(key, TRUE_VALUE);
    }
    const dbKeys = [];
    for await (const [key] of db.iterator({ values: false, keyAsBuffer: true })) {
      dbKeys.push(key);
    }
    expect(dbKeys).toEqual([key1, key2, key3, key4, key5]);
  });
});

describe('makeTsHash', () => {
  test('succeeds', () => {
    const tsHash = makeTsHash(castMessage.data.timestamp, castMessage.hash);
    expect(tsHash.isOk()).toBeTruthy();
  });

  test('primarily orders keys by timestamp', () => {
    const tsHash1 = makeTsHash(castMessage.data.timestamp, castMessage.hash);
    const tsHash2 = makeTsHash(castMessage.data.timestamp + 1, castMessage.hash);
    expect(bytesCompare(tsHash1._unsafeUnwrap(), tsHash2._unsafeUnwrap())).toEqual(-1);
  });

  test('secondarily orders keys by hash', () => {
    const tsHash1 = makeTsHash(castMessage.data.timestamp, castMessage.hash);
    const tsHash2 = makeTsHash(castMessage.data.timestamp, new Uint8Array([...castMessage.hash, 1]));
    expect(bytesCompare(tsHash1._unsafeUnwrap(), tsHash2._unsafeUnwrap())).toEqual(-1);
  });
});

describe('putMessage', () => {
  test('succeeds', async () => {
    await expect(putMessage(db, castMessage)).resolves.toEqual(undefined);
    await expect(
      getMessage(
        db,
        castMessage.data.fid,
        typeToSetPostfix(castMessage.data.type),
        makeTsHash(castMessage.data.timestamp, castMessage.hash)._unsafeUnwrap()
      )
    ).resolves.toEqual(castMessage);
  });
});

describe('getMessage', () => {
  test('succeeds when message exists', async () => {
    await putMessage(db, castMessage);
    await expect(
      getMessage(
        db,
        castMessage.data.fid,
        typeToSetPostfix(castMessage.data.type),
        makeTsHash(castMessage.data.timestamp, castMessage.hash)._unsafeUnwrap()
      )
    ).resolves.toEqual(castMessage);
  });

  test('fails when message not found', async () => {
    await expect(
      getMessage(
        db,
        castMessage.data.fid,
        typeToSetPostfix(castMessage.data.type),
        makeTsHash(castMessage.data.timestamp, castMessage.hash)._unsafeUnwrap()
      )
    ).rejects.toThrow(HubError);
  });

  test('fails with wrong key', async () => {
    await putMessage(db, castMessage);
    const badTsHash = new Uint8Array([...makeTsHash(castMessage.data.timestamp, castMessage.hash)._unsafeUnwrap(), 1]);
    await expect(
      getMessage(db, castMessage.data.fid, typeToSetPostfix(castMessage.data.type), badTsHash)
    ).rejects.toThrow(HubError);
  });
});

describe('getManyMessages', () => {
  test('succeeds', async () => {
    await putMessage(db, castMessage);
    await putMessage(db, ampMessage);
    const primaryKey = makeMessagePrimaryKeyFromMessage(castMessage);
    const ampPrimaryKey = makeMessagePrimaryKeyFromMessage(ampMessage);
    const results = await getManyMessages(db, [primaryKey, ampPrimaryKey]);
    expect(new Set(results)).toEqual(new Set([castMessage, ampMessage]));
  });
});

describe('getAllMessagesByFid', () => {
  test('succeeds', async () => {
    await putMessage(db, castMessage);
    await putMessage(db, ampMessage);
    await expect(getAllMessagesByFid(db, castMessage.data.fid)).resolves.toEqual([castMessage]);
    await expect(getAllMessagesByFid(db, ampMessage.data.fid)).resolves.toEqual([ampMessage]);
  });

  test('succeeds with no results', async () => {
    await expect(getAllMessagesByFid(db, Factories.Fid.build())).resolves.toEqual([]);
  });
});

describe('getAllMessagesBySigner', () => {
  test('succeeds', async () => {
    await putMessage(db, castMessage);
    await putMessage(db, ampMessage);
    await expect(getAllMessagesBySigner(db, castMessage.data.fid, castMessage.signer)).resolves.toEqual([castMessage]);
    await expect(getAllMessagesBySigner(db, ampMessage.data.fid, ampMessage.signer)).resolves.toEqual([ampMessage]);
  });

  test('succeeds with type', async () => {
    await putMessage(db, castMessage);
    await putMessage(db, ampMessage);
    await expect(
      getAllMessagesBySigner(db, castMessage.data.fid, castMessage.signer, MessageType.MESSAGE_TYPE_CAST_ADD)
    ).resolves.toEqual([castMessage]);
    await expect(
      getAllMessagesBySigner(db, castMessage.data.fid, castMessage.signer, MessageType.MESSAGE_TYPE_AMP_ADD)
    ).resolves.toEqual([]);
  });

  test('succeeds with no results', async () => {
    await expect(
      getAllMessagesBySigner(db, castMessage.data.fid, Factories.Ed25519Signer.build().signerKey)
    ).resolves.toEqual([]);
  });
});
