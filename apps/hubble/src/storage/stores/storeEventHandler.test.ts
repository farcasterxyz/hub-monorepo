import {
  IdRegistryEvent,
  isMergeIdRegistryEventHubEvent,
  isMergeMessageHubEvent,
  isMergeNameRegistryEventHubEvent,
  isPruneMessageHubEvent,
  isRevokeMessageHubEvent,
  Message,
  NameRegistryEvent,
} from '@farcaster/rpc';
import { Factories } from '@farcaster/utils';
import { ok } from 'neverthrow';
import { jestRocksDB } from '../db/jestUtils';
import StoreEventHandler, { HubEventIdGenerator } from './storeEventHandler';

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
