import Server from '~/network/rpc/flatbuffers/server';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import Client from '~/network/rpc/flatbuffers/client';
import MessageModel from '~/storage/flatbuffers/messageModel';
import Factories from '~/test/factories/flatbuffer';
import Engine from '~/storage/engine/flatbuffers';
import { CastAddModel, SignerAddModel } from '~/storage/flatbuffers/types';
import { Wallet, utils } from 'ethers';
import { generateEd25519KeyPair, sleep } from '~/utils/crypto';
import IdRegistryEventModel from '~/storage/flatbuffers/idRegistryEventModel';
import { KeyPair } from '~/types';
import { EventResponse, EventType } from '~/utils/generated/rpc_generated';
import { ClientReadableStream } from '@grpc/grpc-js';

const db = jestBinaryRocksDB('flatbuffers.rpc.eventService.test');
const engine = new Engine(db);

let server: Server;
let client: Client;

beforeAll(async () => {
  server = new Server(engine);
  const port = await server.start();
  client = new Client(port);
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
