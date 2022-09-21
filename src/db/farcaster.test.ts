import FarcasterDB from '~/db/farcaster';
import { Factories } from '~/factories';
import { CastRecast, CastShort, FollowAdd } from '~/types';

const db = new FarcasterDB('farcaster.test');

beforeAll(async () => {
  await db.open();
});

beforeEach(async () => {
  await db.clear();
});

afterAll(async () => {
  await db.destroy();
});

/** Create sample data */
let cast1: CastShort;
let cast2: CastShort;
let follow1: FollowAdd;

beforeAll(async () => {
  cast1 = await Factories.CastShort.create();
  cast2 = await Factories.CastShort.create();
  follow1 = await Factories.FollowAdd.create();
});

describe('putMessage', () => {
  test('succeeds with message', async () => {
    const res = await db.putMessage(cast1);
    expect(res.isOk()).toBeTruthy();

    const value = await db.getMessage(cast1.hash);
    expect(value._unsafeUnwrap()).toEqual(cast1);

    const index = await db.get(`signer!${cast1.signer}!${cast1.data.type}!${cast1.hash}`);
    expect(index._unsafeUnwrap()).toEqual(cast1.hash);
  });
});

describe('getMessage', () => {
  test('succeeds when message exists', async () => {
    await db.putMessage(cast1);

    const res = await db.getMessage(cast1.hash);
    expect(res.isOk()).toBeTruthy();
    expect(res._unsafeUnwrap()).toEqual(cast1);
  });

  test('fails when message not found', async () => {
    const res = await db.getMessage('foo');
    expect(res.isOk()).toBeFalsy();
  });
});

describe('getMessages', () => {
  test('returns array of messages', async () => {
    await db.putMessage(cast1);
    await db.putMessage(cast2);
    await db.putMessage(follow1);

    const res = await db.getMessages([cast1.hash, cast2.hash, follow1.hash]);
    expect(res.isOk()).toBeTruthy();
    expect(res._unsafeUnwrap()).toEqual([cast1, cast2, follow1]);
  });

  test('returns empty array when messages not found', async () => {
    const res = await db.getMessages([cast1.hash, cast2.hash, follow1.hash]);
    expect(res.isOk()).toBeTruthy();
    expect(res._unsafeUnwrap()).toEqual([]);
  });
});

describe('deleteMessage', () => {
  test('succeeds when message exists', async () => {
    await db.putMessage(cast1);

    const value = await db.getMessage(cast1.hash);
    expect(value._unsafeUnwrap()).toEqual(cast1);

    const res = await db.deleteMessage(cast1.hash);
    expect(res.isOk()).toBeTruthy();

    const newValue = await db.getMessage(cast1.hash);
    expect(newValue.isOk()).toBeFalsy();
  });
});
