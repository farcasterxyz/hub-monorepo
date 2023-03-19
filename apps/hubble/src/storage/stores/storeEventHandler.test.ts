import { CastAddMessage, HubEvent, HubEventType } from '@farcaster/protobufs';
import { Factories } from '@farcaster/utils';
import { ok } from 'neverthrow';
import { jestRocksDB } from '~/storage/db/jestUtils';
import StoreEventHandler, { HubEventArgs, HubEventIdGenerator } from '~/storage/stores/storeEventHandler';
import { getMessage, makeTsHash, putMessageTransaction } from '../db/message';
import { UserPostfix } from '../db/types';

const db = jestRocksDB('stores.storeEventHandler.test');
const eventHandler = new StoreEventHandler(db);

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

    const result = await eventHandler.commitTransaction(txn, [eventArgs]);
    expect(result.isOk()).toBeTruthy();
    const [eventId] = result._unsafeUnwrap();
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

  test('saves and broadcasts events in order', async () => {
    const events1: HubEventArgs[] = [];
    const events2: HubEventArgs[] = [];

    for (let i = 0; i < 10; i++) {
      const message = await Factories.Message.create();
      const eventBody = { type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message, deletedMessages: [] } };
      if (Math.random() > 0.5) {
        events1.push(eventBody);
      } else {
        events2.push(eventBody);
      }
    }

    const [result1, result2] = await Promise.all([
      eventHandler.commitTransaction(db.transaction(), events1),
      eventHandler.commitTransaction(db.transaction(), events2),
    ]);

    expect(result1.isOk()).toBeTruthy();
    expect(result2.isOk()).toBeTruthy();

    expect(Math.max(...result1._unsafeUnwrap())).toBeLessThan(Math.min(...result2._unsafeUnwrap()));

    expect(events.length).toEqual(10);

    let lastId = 0;
    for (const event of events) {
      expect(event.id).toBeGreaterThan(lastId);
      lastId = event.id;
    }
  });
});
