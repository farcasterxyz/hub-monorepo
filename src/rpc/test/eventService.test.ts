import { ClientReadableStream } from '@grpc/grpc-js';
import { utils, Wallet } from 'ethers';
import Factories from '~/flatbuffers/factories/flatbuffer';
import { EventResponse, EventType } from '~/flatbuffers/generated/rpc_generated';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import { CastAddModel, KeyPair, SignerAddModel } from '~/flatbuffers/models/types';
import Client from '~/rpc/client';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';
import { generateEd25519KeyPair, sleep } from '~/utils/crypto';
import { addressInfoFromParts } from '~/utils/p2p';

const db = jestRocksDB('flatbuffers.rpc.eventService.test');
const engine = new Engine(db);
const hub = new MockHub(db, engine);

let server: Server;
let client: Client;

beforeAll(async () => {
  server = new Server(hub, engine);
  const port = await server.start();
  client = new Client(addressInfoFromParts('127.0.0.1', port)._unsafeUnwrap());
});

afterAll(async () => {
  client.close();
  await server.stop();
});

const fid = Factories.FID.build();
const wallet = new Wallet(utils.randomBytes(32));
let custodyEvent: IdRegistryEventModel;
let signer: KeyPair;
let signerAdd: SignerAddModel;
let castAdd: CastAddModel;

beforeAll(async () => {
  custodyEvent = new IdRegistryEventModel(
    await Factories.IdRegistryEvent.create(
      { to: Array.from(utils.arrayify(wallet.address)), fid: Array.from(fid) },
      { transient: { wallet } }
    )
  );

  signer = await generateEd25519KeyPair();
  const signerAddData = await Factories.SignerAddData.create({
    body: Factories.SignerBody.build({ signer: Array.from(signer.publicKey) }),
    fid: Array.from(fid),
  });
  signerAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { wallet } })
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
  let events: EventResponse[];

  beforeEach(async () => {
    stream = (await client.subscribe())._unsafeUnwrap();
    events = [];
    stream.on('data', (response: EventResponse) => {
      events.push(response);
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
    expect(events.map((e) => e.type())).toEqual([
      EventType.MergeContractEvent,
      EventType.MergeMessage,
      EventType.MergeMessage,
    ]);
  });
});
