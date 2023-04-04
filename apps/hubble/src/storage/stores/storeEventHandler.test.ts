import { CastAddMessage, HubEvent, HubEventType, Factories } from '@farcaster/hub-nodejs';
import { ok, Result } from 'neverthrow';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { getMessage, makeTsHash, putMessageTransaction } from '~/storage/db/message';
import { UserPostfix } from '~/storage/db/types';
import StoreEventHandler, { HubEventArgs, HubEventIdGenerator } from '~/storage/stores/storeEventHandler';
import { sleep } from '~/utils/crypto';
import { StorageCache } from '~/storage/engine/storageCache';

const db = jestRocksDB('stores.storeEventHandler.test');
const cache = new StorageCache();
const eventHandler = new StoreEventHandler(db, cache);

let events: HubEvent[] = [];

const eventListener = (event: HubEvent) => {
  events.push(event);
};

beforeAll(() => {
  eventHandler.on('mergeMessage', eventListener);
});

beforeEach(() => {
  events = [];
});

afterAll(() => {
  eventHandler.off('mergeMessage', eventListener);
});

let message: CastAddMessage;

beforeAll(async () => {
  message = await Factories.CastAddMessage.create();
});

describe('HubEventIdGenerator', () => {
  const generator = new HubEventIdGenerator();

  test('succeeds', () => {
    let lastId = 0;

    for (let i = 0; i < 10; i++) {
      const id = generator.generateId()._unsafeUnwrap();
      expect(id).toBeGreaterThan(lastId);
      lastId = id;
    }
  });
});

describe('commitTransaction', () => {
  test('commits transaction and returns event id', async () => {
    const txn = putMessageTransaction(db.transaction(), message);
    const eventArgs: HubEventArgs = {
      type: HubEventType.MERGE_MESSAGE,
      mergeMessageBody: { message, deletedMessages: [] },
    };

    const result = await eventHandler.commitTransaction(txn, eventArgs);
    expect(result.isOk()).toBeTruthy();
    const eventId = result._unsafeUnwrap();
    expect(eventId).toBeGreaterThan(0);
    await expect(
      getMessage(
        db,
        message.data.fid,
        UserPostfix.CastMessage,
        makeTsHash(message.data?.timestamp, message.hash)._unsafeUnwrap()
      )
    ).resolves.toEqual(message);
    const event = await eventHandler.getEvent(eventId as number);
    expect(event).toMatchObject(ok(eventArgs));
    expect(events).toEqual([event._unsafeUnwrap()]);
  });
});

describe('pruneEvents', () => {
  test('deletes events based on time limit', async () => {
    const message1 = await Factories.Message.create();
    const idRegistryEvent = Factories.IdRegistryEvent.build();
    const message2 = await Factories.Message.create();
    const message3 = await Factories.Message.create();

    const eventArgs1 = {
      type: HubEventType.MERGE_MESSAGE,
      mergeMessageBody: { message: message1, deletedMessages: [] },
    };
    const eventArgs2 = { type: HubEventType.MERGE_ID_REGISTRY_EVENT, mergeIdRegistryEventBody: { idRegistryEvent } };
    const eventArgs3 = { type: HubEventType.PRUNE_MESSAGE, pruneMessageBody: { message: message2 } };
    const eventArgs4 = {
      type: HubEventType.MERGE_MESSAGE,
      mergeMessageBody: { message: message3, deletedMessages: [] },
    };

    const result1 = Result.combine([
      await eventHandler.commitTransaction(db.transaction(), eventArgs1),
      await eventHandler.commitTransaction(db.transaction(), eventArgs2),
    ]);
    expect(result1.isOk()).toBeTruthy();

    await sleep(2_000);

    const result2 = Result.combine([
      await eventHandler.commitTransaction(db.transaction(), eventArgs3),
      await eventHandler.commitTransaction(db.transaction(), eventArgs4),
    ]);
    expect(result2.isOk()).toBeTruthy();

    const allEvents1 = await eventHandler.getEvents();
    expect(allEvents1._unsafeUnwrap()).toMatchObject([eventArgs1, eventArgs2, eventArgs3, eventArgs4]);

    const pruneResult1 = await eventHandler.pruneEvents(); // Should not prune any events since none are passed the default 3 days
    expect(pruneResult1.isOk()).toBeTruthy();

    const allEvents2 = await eventHandler.getEvents();
    expect(allEvents2._unsafeUnwrap()).toMatchObject([eventArgs1, eventArgs2, eventArgs3, eventArgs4]);

    const pruneResult2 = await eventHandler.pruneEvents(1_000); // Prune the events that happened more than a second ago
    expect(pruneResult2.isOk()).toBeTruthy();

    const allEvents3 = await eventHandler.getEvents();
    expect(allEvents3._unsafeUnwrap()).toMatchObject([eventArgs3, eventArgs4]);
  });
});
