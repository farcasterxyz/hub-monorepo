import { ok, err } from 'neverthrow';
import { HubEvent, HubEventType } from '@farcaster/protobufs';
import { Factories, HubError } from '@farcaster/utils';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { putMessage } from '~/storage/db/message';
import { UserPostfix } from '~/storage/db/types';
import { StorageCache } from '~/storage/engine/storageCache';

const db = jestRocksDB('engine.storageCache.test');

let cache: StorageCache;

beforeEach(() => {
  cache = new StorageCache();
});

describe('syncFromDb', () => {
  test('populates cache with messages from db', async () => {
    const usage = [
      { fid: Factories.Fid.build(), usage: { cast: 3, reaction: 2, verification: 4, userData: 1, signer: 0 } },
      { fid: Factories.Fid.build(), usage: { cast: 2, reaction: 3, verification: 0, userData: 2, signer: 5 } },
    ];
    for (const fidUsage of usage) {
      for (let i = 0; i < fidUsage.usage.cast; i++) {
        const message = await Factories.CastAddMessage.create({ data: { fid: fidUsage.fid } });
        await putMessage(db, message);
      }

      for (let i = 0; i < fidUsage.usage.reaction; i++) {
        const message = await Factories.ReactionAddMessage.create({ data: { fid: fidUsage.fid } });
        await putMessage(db, message);
      }

      for (let i = 0; i < fidUsage.usage.verification; i++) {
        const message = await Factories.VerificationAddEthAddressMessage.create({ data: { fid: fidUsage.fid } });
        await putMessage(db, message);
      }

      for (let i = 0; i < fidUsage.usage.userData; i++) {
        const message = await Factories.UserDataAddMessage.create({ data: { fid: fidUsage.fid } });
        await putMessage(db, message);
      }

      for (let i = 0; i < fidUsage.usage.signer; i++) {
        const message = await Factories.SignerAddMessage.create({ data: { fid: fidUsage.fid } });
        await putMessage(db, message);
      }
    }
    await cache.syncFromDb(db);
    for (const fidUsage of usage) {
      expect(cache.getMessageCount(fidUsage.fid, UserPostfix.CastMessage)).toEqual(ok(fidUsage.usage.cast));
      expect(cache.getMessageCount(fidUsage.fid, UserPostfix.ReactionMessage)).toEqual(ok(fidUsage.usage.reaction));
      expect(cache.getMessageCount(fidUsage.fid, UserPostfix.VerificationMessage)).toEqual(
        ok(fidUsage.usage.verification)
      );
      expect(cache.getMessageCount(fidUsage.fid, UserPostfix.UserDataMessage)).toEqual(ok(fidUsage.usage.userData));
      expect(cache.getMessageCount(fidUsage.fid, UserPostfix.SignerMessage)).toEqual(ok(fidUsage.usage.signer));
    }
  });
});

describe('processEvent', () => {
  test('increments count with merge cast message event', async () => {
    const fid = Factories.Fid.build();
    const message = await Factories.CastAddMessage.create({ data: { fid } });
    const event = HubEvent.create({ type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message } });

    await cache.syncFromDb(db);
    expect(cache.getMessageCount(fid, UserPostfix.CastMessage)).toEqual(ok(0));
    cache.processEvent(event);
    expect(cache.getMessageCount(fid, UserPostfix.CastMessage)).toEqual(ok(1));
  });

  test('fails when cache is not synced', async () => {
    const fid = Factories.Fid.build();
    const message = await Factories.CastAddMessage.create({ data: { fid } });
    const event = HubEvent.create({ type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message } });
    expect(cache.processEvent(event)).toEqual(
      err(new HubError('unavailable.storage_failure', 'storage cache is not synced with db'))
    );
  });
});
