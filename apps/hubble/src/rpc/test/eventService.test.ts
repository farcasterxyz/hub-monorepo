/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as protobufs from '@farcaster/protobufs';
import { Factories, getInsecureHubRpcClient, HubRpcClient } from '@farcaster/utils';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';
import { sleep } from '~/utils/crypto';

const db = jestRocksDB('rpc.eventService.test');
const engine = new Engine(db, protobufs.FarcasterNetwork.TESTNET);
const hub = new MockHub(db, engine);

let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine);
  const port = await server.start();
  client = getInsecureHubRpcClient(`127.0.0.1:${port}`);
});

afterAll(async () => {
  await server.stop();
  await engine.stop();
});

const fid = Factories.Fid.build();
const fname = Factories.Fname.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();
let custodyEvent: protobufs.IdRegistryEvent;
let nameRegistryEvent: protobufs.NameRegistryEvent;
let signerAdd: protobufs.SignerAddMessage;
let castAdd: protobufs.CastAddMessage;
let reactionAdd: protobufs.ReactionAddMessage;
let events: [protobufs.HubEventType, any][];
let stream: protobufs.ClientReadableStream<protobufs.HubEvent>;

beforeEach(async () => {
  events = [];
});

afterEach(() => {
  if (stream) {
    stream.cancel();
  }
});

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryEvent.build({ to: custodySignerKey, fid });
  nameRegistryEvent = Factories.NameRegistryEvent.build({ to: custodySignerKey, fname });
  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } }
  );
  castAdd = await Factories.CastAddMessage.create({ data: { fid } }, { transient: { signer } });
  reactionAdd = await Factories.ReactionAddMessage.create({ data: { fid } }, { transient: { signer } });
});

const setupSubscription = async (
  events: [protobufs.HubEventType, any][],
  options: { eventTypes?: protobufs.HubEventType[]; fromId?: number } = {}
): Promise<protobufs.ClientReadableStream<protobufs.HubEvent>> => {
  const request = protobufs.SubscribeRequest.create(options);

  const streamResult = await client.subscribe(request);
  expect(streamResult.isOk()).toBeTruthy();
  const stream = streamResult._unsafeUnwrap();

  stream.on('data', (event: protobufs.HubEvent) => {
    if (protobufs.isMergeMessageHubEvent(event)) {
      events.push([event.type, protobufs.Message.toJSON(event.mergeMessageBody.message!)]);
    } else if (protobufs.isPruneMessageHubEvent(event)) {
      events.push([event.type, protobufs.Message.toJSON(event.pruneMessageBody.message!)]);
    } else if (protobufs.isRevokeMessageHubEvent(event)) {
      events.push([event.type, protobufs.Message.toJSON(event.revokeMessageBody.message!)]);
    } else if (protobufs.isMergeIdRegistryEventHubEvent(event)) {
      events.push([event.type, protobufs.IdRegistryEvent.toJSON(event.mergeIdRegistryEventBody.idRegistryEvent!)]);
    } else if (protobufs.isMergeNameRegistryEventHubEvent(event)) {
      events.push([
        event.type,
        protobufs.NameRegistryEvent.toJSON(event.mergeNameRegistryEventBody.nameRegistryEvent!),
      ]);
    }
  });

  await sleep(100); // Wait for server to start listeners

  return stream;
};

describe('subscribe', () => {
  describe('without type filters', () => {
    test('emits events', async () => {
      stream = await setupSubscription(events);
      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeMessage(signerAdd);
      await engine.mergeMessage(castAdd);
      await sleep(100); // Wait for server to send events over stream
      expect(events).toEqual([
        [protobufs.HubEventType.MERGE_ID_REGISTRY_EVENT, protobufs.IdRegistryEvent.toJSON(custodyEvent)],
        [protobufs.HubEventType.MERGE_MESSAGE, protobufs.Message.toJSON(signerAdd)],
        [protobufs.HubEventType.MERGE_MESSAGE, protobufs.Message.toJSON(castAdd)],
      ]);
    });
  });

  describe('with one type filter', () => {
    test('emits events', async () => {
      stream = await setupSubscription(events, {
        eventTypes: [protobufs.HubEventType.MERGE_MESSAGE],
      });

      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeNameRegistryEvent(nameRegistryEvent);
      await engine.mergeMessage(signerAdd);
      await engine.mergeMessage(castAdd);
      await sleep(100); // Wait for server to send events over stream
      expect(events).toEqual([
        [protobufs.HubEventType.MERGE_MESSAGE, protobufs.Message.toJSON(signerAdd)],
        [protobufs.HubEventType.MERGE_MESSAGE, protobufs.Message.toJSON(castAdd)],
      ]);
    });
  });

  describe('with multiple type filters', () => {
    test('emits events', async () => {
      stream = await setupSubscription(events, {
        eventTypes: [
          protobufs.HubEventType.MERGE_MESSAGE,
          protobufs.HubEventType.MERGE_NAME_REGISTRY_EVENT,
          protobufs.HubEventType.MERGE_ID_REGISTRY_EVENT,
        ],
      });

      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeNameRegistryEvent(nameRegistryEvent);
      await engine.mergeMessage(signerAdd);
      await engine.mergeMessage(castAdd);
      await sleep(100); // Wait for server to send events over stream
      expect(events).toEqual([
        [protobufs.HubEventType.MERGE_ID_REGISTRY_EVENT, protobufs.IdRegistryEvent.toJSON(custodyEvent)],
        [protobufs.HubEventType.MERGE_NAME_REGISTRY_EVENT, protobufs.NameRegistryEvent.toJSON(nameRegistryEvent)],
        [protobufs.HubEventType.MERGE_MESSAGE, protobufs.Message.toJSON(signerAdd)],
        [protobufs.HubEventType.MERGE_MESSAGE, protobufs.Message.toJSON(castAdd)],
      ]);
    });
  });

  describe('with fromId', () => {
    test('emits events from id onwards', async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
      const idResult = await engine.mergeMessage(signerAdd);
      await engine.mergeMessage(castAdd);
      stream = await setupSubscription(events, { fromId: idResult._unsafeUnwrap() });
      await engine.mergeNameRegistryEvent(nameRegistryEvent);
      await engine.mergeMessage(reactionAdd);
      await sleep(100);
      expect(events).toEqual([
        [protobufs.HubEventType.MERGE_MESSAGE, protobufs.Message.toJSON(signerAdd)],
        [protobufs.HubEventType.MERGE_MESSAGE, protobufs.Message.toJSON(castAdd)],
        [protobufs.HubEventType.MERGE_NAME_REGISTRY_EVENT, protobufs.NameRegistryEvent.toJSON(nameRegistryEvent)],
        [protobufs.HubEventType.MERGE_MESSAGE, protobufs.Message.toJSON(reactionAdd)],
      ]);
    });

    test('emits events with early id', async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeMessage(signerAdd);

      stream = await setupSubscription(events, { fromId: 1 });

      expect(events).toEqual([
        [protobufs.HubEventType.MERGE_ID_REGISTRY_EVENT, protobufs.IdRegistryEvent.toJSON(custodyEvent)],
        [protobufs.HubEventType.MERGE_MESSAGE, protobufs.Message.toJSON(signerAdd)],
      ]);
    });
  });

  describe('with fromId and type filters', () => {
    test('emits events', async () => {
      const idResult = await engine.mergeNameRegistryEvent(nameRegistryEvent);
      await engine.mergeIdRegistryEvent(custodyEvent);
      stream = await setupSubscription(events, {
        fromId: idResult._unsafeUnwrap(),
        eventTypes: [protobufs.HubEventType.MERGE_MESSAGE, protobufs.HubEventType.MERGE_ID_REGISTRY_EVENT],
      });
      await engine.mergeMessage(signerAdd);
      await engine.mergeMessage(castAdd);
      await engine.mergeMessage(reactionAdd);
      await sleep(100);
      expect(events).toEqual([
        [protobufs.HubEventType.MERGE_ID_REGISTRY_EVENT, protobufs.IdRegistryEvent.toJSON(custodyEvent)],
        [protobufs.HubEventType.MERGE_MESSAGE, protobufs.Message.toJSON(signerAdd)],
        [protobufs.HubEventType.MERGE_MESSAGE, protobufs.Message.toJSON(castAdd)],
        [protobufs.HubEventType.MERGE_MESSAGE, protobufs.Message.toJSON(reactionAdd)],
      ]);
    });
  });
});
