/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as protobufs from '@farcaster/protobufs';
import { Factories, getHubRpcClient, HubRpcClient } from '@farcaster/utils';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';
import { sleep } from '~/utils/crypto';

const db = jestRocksDB('rpc.eventService.test');
const engine = new Engine(db, protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET);
const hub = new MockHub(db, engine);

let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine);
  const port = await server.start();
  client = getHubRpcClient(`127.0.0.1:${port}`);
});

afterAll(async () => {
  await server.stop();
});

const fid = Factories.Fid.build();
const fname = Factories.Fname.build();
const ethSigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();
let custodyEvent: protobufs.IdRegistryEvent;
let nameRegistryEvent: protobufs.NameRegistryEvent;
let signerAdd: protobufs.SignerAddMessage;
let castAdd: protobufs.CastAddMessage;

beforeAll(async () => {
  custodyEvent = Factories.IdRegistryEvent.build({ to: ethSigner.signerKey, fid });
  nameRegistryEvent = Factories.NameRegistryEvent.build({ to: ethSigner.signerKey, fname });
  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, signerBody: { signer: signer.signerKey } } },
    { transient: { signer: ethSigner } }
  );
  castAdd = await Factories.CastAddMessage.create({ data: { fid } }, { transient: { signer } });
});

describe('subscribe', () => {
  const setupSubscription = (eventTypes?: protobufs.HubEventType[]) => {
    let stream: protobufs.ClientReadableStream<protobufs.HubEvent>;
    const events: [protobufs.HubEventType, any][] = [];

    beforeEach(async () => {
      const request = protobufs.SubscribeRequest.create({ eventTypes: eventTypes ?? [] });

      stream = (await client.subscribe(request))._unsafeUnwrap();
      stream.on('data', (event: protobufs.HubEvent) => {
        // events.push(protobufs.HubEvent.toJSON(event));
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
    });

    afterEach(async () => {
      await stream?.cancel();
    });

    return { events };
  };

  describe('without type filters', () => {
    const { events } = setupSubscription();

    test('emits event', async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeMessage(signerAdd);
      await engine.mergeMessage(castAdd);
      await sleep(1_000); // Wait for server to send events over stream
      expect(events).toEqual([
        [protobufs.HubEventType.HUB_EVENT_TYPE_MERGE_ID_REGISTRY_EVENT, protobufs.IdRegistryEvent.toJSON(custodyEvent)],
        [protobufs.HubEventType.HUB_EVENT_TYPE_MERGE_MESSAGE, protobufs.Message.toJSON(signerAdd)],
        [protobufs.HubEventType.HUB_EVENT_TYPE_MERGE_MESSAGE, protobufs.Message.toJSON(castAdd)],
      ]);
    });
  });

  describe('with one type filter', () => {
    const { events } = setupSubscription([protobufs.HubEventType.HUB_EVENT_TYPE_MERGE_MESSAGE]);

    test('emits event', async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeNameRegistryEvent(nameRegistryEvent);
      await engine.mergeMessage(signerAdd);
      await engine.mergeMessage(castAdd);
      await sleep(1_000); // Wait for server to send events over stream
      expect(events).toEqual([
        [protobufs.HubEventType.HUB_EVENT_TYPE_MERGE_MESSAGE, protobufs.Message.toJSON(signerAdd)],
        [protobufs.HubEventType.HUB_EVENT_TYPE_MERGE_MESSAGE, protobufs.Message.toJSON(castAdd)],
      ]);
    });
  });

  describe('with multiple type filters', () => {
    const { events } = setupSubscription([
      protobufs.HubEventType.HUB_EVENT_TYPE_MERGE_MESSAGE,
      protobufs.HubEventType.HUB_EVENT_TYPE_MERGE_NAME_REGISTRY_EVENT,
      protobufs.HubEventType.HUB_EVENT_TYPE_MERGE_ID_REGISTRY_EVENT,
    ]);

    test('emits event', async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeNameRegistryEvent(nameRegistryEvent);
      await engine.mergeMessage(signerAdd);
      await engine.mergeMessage(castAdd);
      await sleep(1_000); // Wait for server to send events over stream
      expect(events).toEqual([
        [protobufs.HubEventType.HUB_EVENT_TYPE_MERGE_ID_REGISTRY_EVENT, protobufs.IdRegistryEvent.toJSON(custodyEvent)],
        [
          protobufs.HubEventType.HUB_EVENT_TYPE_MERGE_NAME_REGISTRY_EVENT,
          protobufs.NameRegistryEvent.toJSON(nameRegistryEvent),
        ],
        [protobufs.HubEventType.HUB_EVENT_TYPE_MERGE_MESSAGE, protobufs.Message.toJSON(signerAdd)],
        [protobufs.HubEventType.HUB_EVENT_TYPE_MERGE_MESSAGE, protobufs.Message.toJSON(castAdd)],
      ]);
    });
  });
});
