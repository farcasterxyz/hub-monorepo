import {
  HubEventType,
  IdRegistryEvent,
  isMergeIdRegistryEventHubEvent,
  isMergeMessageHubEvent,
  isMergeNameRegistryEventHubEvent,
  isPruneMessageHubEvent,
  isRevokeMessageHubEvent,
  MergeMessageHubEvent,
  Message,
  NameRegistryEvent,
} from '@farcaster/protobufs';
import { Factories } from '@farcaster/utils';
import { ok } from 'neverthrow';
import { jestRocksDB } from '../db/jestUtils';
import StoreEventHandler, { HubEventBody, HubEventIdGenerator } from './storeEventHandler';

const db = jestRocksDB('stores.storeEventHandler.test');
const eventHandler = new StoreEventHandler(db);

let message: Message;
let idRegistryEvent: IdRegistryEvent;
let nameRegistryEvent: NameRegistryEvent;

beforeAll(async () => {
  message = await Factories.Message.create();
  idRegistryEvent = Factories.IdRegistryEvent.build();
  nameRegistryEvent = Factories.NameRegistryEvent.build();
});

describe('putEvent', () => {
  test('succeeds', async () => {
    const event = eventHandler.makeMergeMessage(message)._unsafeUnwrap();
    const result = await eventHandler.putEvent(event);
    expect(result.isOk()).toBeTruthy();
    const events = await eventHandler.getEvents();
    expect(events).toEqual(ok([event]));
  });

  test('succeeds with multiple events at the same time', async () => {
    const event1 = eventHandler.makeMergeMessage(message)._unsafeUnwrap();
    const event2 = eventHandler.makeRevokeMessage(message)._unsafeUnwrap();
    const event3 = eventHandler.makeMergeIdRegistryEvent(idRegistryEvent)._unsafeUnwrap();

    await Promise.all([eventHandler.putEvent(event1), eventHandler.putEvent(event2), eventHandler.putEvent(event3)]);
    const events = await eventHandler.getEvents();
    expect(events).toEqual(ok([event1, event2, event3]));
  });
});

describe('makeMergeMessage', () => {
  test('succeeds', () => {
    const event = eventHandler.makeMergeMessage(message);
    expect(event.isOk()).toBeTruthy();
    expect(isMergeMessageHubEvent(event._unsafeUnwrap())).toBeTruthy();
  });

  test('succeeds with deleted messages', async () => {
    const deletedMessage = await Factories.Message.create();
    const event = await eventHandler.makeMergeMessage(message, [deletedMessage]);
    expect(event.isOk()).toBeTruthy();
    expect(isMergeMessageHubEvent(event._unsafeUnwrap())).toBeTruthy();
  });
});

describe('makePruneMessage', () => {
  test('succeeds', async () => {
    const event = await eventHandler.makePruneMessage(message);
    expect(event.isOk()).toBeTruthy();
    expect(isPruneMessageHubEvent(event._unsafeUnwrap())).toBeTruthy();
  });
});

describe('makeRevokeMessage', () => {
  test('succeeds', async () => {
    const event = await eventHandler.makeRevokeMessage(message);
    expect(event.isOk()).toBeTruthy();
    expect(isRevokeMessageHubEvent(event._unsafeUnwrap())).toBeTruthy();
  });
});

describe('makeMergeIdRegistryEvent', () => {
  test('succeeds', async () => {
    const event = await eventHandler.makeMergeIdRegistryEvent(idRegistryEvent);
    expect(event.isOk()).toBeTruthy();
    expect(isMergeIdRegistryEventHubEvent(event._unsafeUnwrap())).toBeTruthy();
  });
});

describe('makeMergeNameRegistryEvent', () => {
  test('succeeds', async () => {
    const event = await eventHandler.makeMergeNameRegistryEvent(nameRegistryEvent);
    expect(event.isOk()).toBeTruthy();
    expect(isMergeNameRegistryEventHubEvent(event._unsafeUnwrap())).toBeTruthy();
  });
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
  test('saves and broadcasts events in order', async () => {
    const events: MergeMessageHubEvent[] = [];

    const eventListener = (event: MergeMessageHubEvent) => {
      events.push(event);
    };

    const events1: HubEventBody[] = [];
    const events2: HubEventBody[] = [];

    for (let i = 0; i < 10; i++) {
      const message = await Factories.Message.create();
      const eventBody = { type: HubEventType.MERGE_MESSAGE, mergeMessageBody: { message, deletedMessages: [] } };
      if (Math.random() > 0.5) {
        events1.push(eventBody);
      } else {
        events2.push(eventBody);
      }
    }

    eventHandler.on('mergeMessage', eventListener);
    const [result1, result2] = await Promise.all([
      eventHandler.commitTransaction(db.transaction(), events1),
      eventHandler.commitTransaction(db.transaction(), events2),
    ]);
    eventHandler.off('mergeMessage', eventListener);

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
