import { Factories, Message } from '@farcaster/hub-nodejs';
import { SyncId } from './syncId';

let message: Message;

beforeAll(async () => {
  message = await Factories.CastAddMessage.create();
});

describe('SyncId', () => {
  test('succeeds', async () => {
    const syncId = new SyncId(message).syncId();
    expect(syncId).toBeDefined();
  });
});
