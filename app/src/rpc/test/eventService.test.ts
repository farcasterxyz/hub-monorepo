import { ClientReadableStream } from '@grpc/grpc-js';
import { EventResponse, EventType } from '@hub/flatbuffers';
import { Factories } from '@hub/utils';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';
import { CastAddModel, SignerAddModel } from '~/flatbuffers/models/types';
import SyncEngine from '~/network/sync/syncEngine';
import HubRpcClient from '~/rpc/client';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';
import { sleep } from '~/utils/crypto';
import { addressInfoFromParts } from '~/utils/p2p';

const db = jestRocksDB('flatbuffers.rpc.eventService.test');
const engine = new Engine(db);
const hub = new MockHub(db, engine);

let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine, new SyncEngine(engine));
  const port = await server.start();
  client = new HubRpcClient(addressInfoFromParts('127.0.0.1', port)._unsafeUnwrap());
});

afterAll(async () => {
  client.close();
  await server.stop();
});

const fid = Factories.FID.build();
const ethSigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();
let custodyEvent: IdRegistryEventModel;
let signerAdd: SignerAddModel;
let castAdd: CastAddModel;

beforeAll(async () => {
  custodyEvent = new IdRegistryEventModel(
    await Factories.IdRegistryEvent.create({ to: Array.from(ethSigner.signerKey), fid: Array.from(fid) })
  );

  const signerAddData = await Factories.SignerAddData.create({
    body: Factories.SignerBody.build({ signer: Array.from(signer.signerKey) }),
    fid: Array.from(fid),
  });
  signerAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { ethSigner } })
  ) as SignerAddModel;

  const castAddData = await Factories.CastAddData.create({
    fid: Array.from(fid),
  });
  castAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(castAddData.bb?.bytes() ?? []) }, { transient: { signer } })
  ) as CastAddModel;
});

describe('subscribe', () => {
  let stream: ClientReadableStream<EventResponse>;
  let events: [EventType, MessageModel | IdRegistryEventModel | NameRegistryEventModel][];

  beforeEach(async () => {
    stream = (await client.subscribe())._unsafeUnwrap();
    events = [];
    stream.on('data', (response: EventResponse) => {
      if (
        response.type() === EventType.MergeMessage ||
        response.type() === EventType.PruneMessage ||
        response.type() === EventType.RevokeMessage
      ) {
        events.push([response.type(), MessageModel.from(response.bytesArray() ?? new Uint8Array())]);
      } else if (response.type() === EventType.MergeIdRegistryEvent) {
        events.push([response.type(), IdRegistryEventModel.from(response.bytesArray() ?? new Uint8Array())]);
      } else if (response.type() === EventType.MergeNameRegistryEvent) {
        events.push([response.type(), NameRegistryEventModel.from(response.bytesArray() ?? new Uint8Array())]);
      }
    });
  });

  afterEach(async () => {
    await stream.cancel();
  });

  test('emits event', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(castAdd);
    await sleep(1_000); // Wait for server to send events over stream
    expect(events).toEqual([
      [EventType.MergeIdRegistryEvent, custodyEvent],
      [EventType.MergeMessage, signerAdd],
      [EventType.MergeMessage, castAdd],
    ]);
  });
});
