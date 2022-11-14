import Server from '~/network/rpc/flatbuffers/server';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import Client from '~/network/rpc/flatbuffers/client';
import MessageModel from '~/storage/flatbuffers/messageModel';
import Factories from '~/test/factories/flatbuffer';
import Engine from '~/storage/engine/flatbuffers';
import { FollowAddModel, SignerAddModel } from '~/storage/flatbuffers/types';
import { Wallet, utils } from 'ethers';
import { generateEd25519KeyPair } from '~/utils/crypto';
import ContractEventModel from '~/storage/flatbuffers/contractEventModel';
import { KeyPair } from '~/types';
import { UserId } from '~/utils/generated/message_generated';
import { HubError } from '~/utils/hubErrors';

const db = jestBinaryRocksDB('flatbuffers.rpc.followService.test');
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
const wallet = Wallet.createRandom();
let custodyEvent: ContractEventModel;
let signer: KeyPair;
let signerAdd: SignerAddModel;
let followAdd: FollowAddModel;

beforeAll(async () => {
  custodyEvent = new ContractEventModel(
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

  const followAddData = await Factories.FollowAddData.create({
    fid: Array.from(fid),
  });
  followAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(followAddData.bb?.bytes() ?? []) }, { transient: { signer } })
  ) as FollowAddModel;
});

describe('getFollow', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(followAdd);
    const result = await client.getFollow(fid, followAdd.body().user() ?? new UserId());
    expect(result._unsafeUnwrap()).toEqual(followAdd);
  });

  test('fails if follow is missing', async () => {
    const result = await client.getFollow(fid, followAdd.body().user() ?? new UserId());
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails without user', async () => {
    const user = await Factories.UserId.create({ fid: [] });
    const result = await client.getFollow(fid, user);
    // TODO: improve error messages so we know this is user.fid is missing
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });

  test('fails without fid', async () => {
    const result = await client.getFollow(new Uint8Array(), followAdd.body().user() ?? new UserId());
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });
});

describe('getFollowsByFid', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(followAdd);
    const follows = await client.getFollowsByFid(fid);
    // The underlying buffers are different, so we can't compare full messages directly
    expect(follows._unsafeUnwrap().map((msg) => msg.hash())).toEqual([followAdd.hash()]);
  });

  test('returns empty array without messages', async () => {
    const follows = await client.getFollowsByFid(fid);
    expect(follows._unsafeUnwrap()).toEqual([]);
  });
});

describe('getFollowsByUser', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(followAdd);
    const follows = await client.getFollowsByUser(followAdd.body().user() ?? new UserId());
    // The underlying buffers are different, so we can't compare full messages directly
    expect(follows._unsafeUnwrap().map((msg) => msg.hash())).toEqual([followAdd.hash()]);
  });

  test('returns empty array without messages', async () => {
    const follows = await client.getFollowsByUser(followAdd.body().user() ?? new UserId());
    expect(follows._unsafeUnwrap()).toEqual([]);
  });
});
