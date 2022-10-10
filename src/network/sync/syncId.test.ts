import { Message } from '~/types';
import { SyncId } from '~/network/sync/syncId';
import { Factories } from '~/test/factories';

describe('SyncId', () => {
  let message: Message;
  let syncId: SyncId;

  beforeEach(async () => {
    message = await Factories.CastShort.create();
    syncId = new SyncId(message);
  });

  test('behaves correctly for a known timestamp and hash', () => {
    message.data.signedAt = 1665182332467;
    message.hash =
      '0xcb33b16f1f79c586473f42c8a4b66cd601c966ee6ed9d7797bb065cc9d8e1c2445cd44e92862c2ffa71cfdc76aa2314248e4182c1f1a7eb4059a278d08af23f5';
    syncId = new SyncId(message);
    expect(syncId.hashString).toEqual(
      'cb33b16f1f79c586473f42c8a4b66cd601c966ee6ed9d7797bb065cc9d8e1c2445cd44e92862c2ffa71cfdc76aa2314248e4182c1f1a7eb4059a278d08af23f5'
    );
    expect(syncId.timestampString).toEqual('1665182332');
    expect(syncId.toString()).toEqual(
      '1665182332cb33b16f1f79c586473f42c8a4b66cd601c966ee6ed9d7797bb065cc9d8e1c2445cd44e92862c2ffa71cfdc76aa2314248e4182c1f1a7eb4059a278d08af23f5'
    );
  });

  test('raises if message hash is not in the expected format', () => {
    const originalHash = message.hash;
    message.hash = originalHash.slice(0, 10); // When message is thw wrong length
    expect(() => new SyncId(message)).toThrow('Invalid hash');
    message.hash = originalHash.slice(2) + 'ad'; // When the message does not start with 0x
    expect(() => new SyncId(message)).toThrow('Invalid hash');
  });

  test('raises if message timestamp is not in the expected format', () => {
    // We expect timestamps to be in milliseconds, so a 13 digit string. Anything bigger than that is invalid
    message.data.signedAt = message.data.signedAt * 10;
    expect(() => new SyncId(message)).toThrow('Invalid timestamp');
  });

  test('pads timestamp with zeros', () => {
    message.data.signedAt = 1000; // It's in milliseconds, so 1 second after the epoch
    syncId = new SyncId(message);
    expect(syncId.timestampString).toEqual('0000000001');
    expect(syncId.toString().startsWith('0000000001')).toBeTruthy();
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
