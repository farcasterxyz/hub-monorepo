import { Message } from '~/types';
import { SyncId } from '~/sync/syncId';
import { Factories } from '~/factories';

describe('syncId', () => {
  let message: Message;
  let syncId: SyncId;

  beforeEach(async () => {
    message = await Factories.CastShort.create();
    syncId = new SyncId(message);
  });

  test('timestamp is correct', () => {
    expect(syncId.timestampString).toEqual(Math.floor(message.data.signedAt / 1000).toString());
    expect(syncId.timestampString.length).toEqual(10);
  });

  test('hash is correct', () => {
    expect(syncId.hashString.startsWith('0x')).toBeFalsy();
    expect(message.hash.endsWith(syncId.hashString)).toBeTruthy();
    expect(syncId.hashString.length).toEqual(128);
  });

  test('id correct', () => {
    expect(syncId.toString()).toEqual(`${syncId.timestampString}${syncId.hashString}`);
    expect(syncId.toString().length).toEqual(138);
  });
});
