import * as protobufs from '@farcaster/rpc';
import { Factories } from '@farcaster/utils';
import { SyncId } from './syncId';

let message: protobufs.Message;

beforeAll(async () => {
  message = await Factories.CastAddMessage.create();
});

describe('SyncId', () => {
  test('succeeds', async () => {
    const syncId = new SyncId(message).syncId();
    expect(syncId).toBeDefined();
  });
});
