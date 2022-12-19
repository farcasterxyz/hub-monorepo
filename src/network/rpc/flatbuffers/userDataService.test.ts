import Server from '~/network/rpc/flatbuffers/server';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import Client from '~/network/rpc/flatbuffers/client';
import MessageModel from '~/storage/flatbuffers/messageModel';
import Factories from '~/test/factories/flatbuffer';
import Engine from '~/storage/engine/flatbuffers';
import { SignerAddModel, UserDataAddModel } from '~/storage/flatbuffers/types';
import { Wallet, utils } from 'ethers';
import { generateEd25519KeyPair } from '~/utils/crypto';
import IdRegistryEventModel from '~/storage/flatbuffers/idRegistryEventModel';
import { KeyPair } from '~/types';
import { UserDataType } from '~/utils/generated/message_generated';
import { HubError } from '~/utils/hubErrors';
import NameRegistryEventModel from '~/storage/flatbuffers/nameRegistryEventModel';
import { ok } from 'neverthrow';
import { addressInfoFromParts } from '~/utils/p2p';

const db = jestBinaryRocksDB('flatbuffers.rpc.userDataService.test');
const engine = new Engine(db);

let server: Server;
let client: Client;

beforeAll(async () => {
  server = new Server(engine);
  const port = await server.start();
  client = new Client(addressInfoFromParts('127.0.0.1', port)._unsafeUnwrap());
});

afterAll(async () => {
  client.close();
  await server.stop();
});

const fid = Factories.FID.build();
const fname = Factories.Fname.build();
const wallet = new Wallet(utils.randomBytes(32));
let custodyEvent: IdRegistryEventModel;
let signer: KeyPair;
let signerAdd: SignerAddModel;

let pfpAdd: UserDataAddModel;
let locationAdd: UserDataAddModel;
let addFname: UserDataAddModel;

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

  const pfpData = await Factories.UserDataAddData.create({
    fid: Array.from(fid),
    body: Factories.UserDataBody.build({ type: UserDataType.Pfp }),
  });
  pfpAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(pfpData.bb?.bytes() ?? []) }, { transient: { signer } })
  ) as UserDataAddModel;

  const locationData = await Factories.UserDataAddData.create({
    fid: Array.from(fid),
    body: Factories.UserDataBody.build({ type: UserDataType.Location }),
  });
  locationAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(locationData.bb?.bytes() ?? []) }, { transient: { signer } })
  ) as UserDataAddModel;

  const addNameData = await Factories.UserDataAddData.create({
    fid: Array.from(fid),
    body: Factories.UserDataBody.build({ type: UserDataType.Fname, value: new TextDecoder().decode(fname) }),
  });
  addFname = new MessageModel(
    await Factories.Message.create({ data: Array.from(addNameData.bb?.bytes() ?? []) }, { transient: { signer } })
  ) as UserDataAddModel;
});

describe('getUserData', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    expect(await engine.mergeMessage(pfpAdd)).toEqual(ok(undefined));
    expect(await engine.mergeMessage(locationAdd)).toEqual(ok(undefined));

    const pfp = await client.getUserData(fid, UserDataType.Pfp);
    expect(pfp._unsafeUnwrap()).toEqual(pfpAdd);

    const location = await client.getUserData(fid, UserDataType.Location);
    expect(location._unsafeUnwrap()).toEqual(locationAdd);

    const nameRegistryEvent = await Factories.NameRegistryEvent.create({
      fname: Array.from(fname),
      to: Array.from(utils.arrayify(wallet.address)),
    });
    const model = new NameRegistryEventModel(nameRegistryEvent);
    await model.put(db);

    expect(await engine.mergeMessage(addFname)).toEqual(ok(undefined));
    const fnameData = await client.getUserData(fid, UserDataType.Fname);
    expect(fnameData._unsafeUnwrap()).toEqual(addFname);
  });

  test('fails when user data is missing', async () => {
    const pfp = await client.getUserData(fid, UserDataType.Pfp);
    expect(pfp._unsafeUnwrapErr().errCode).toEqual('not_found');

    const fname = await client.getUserData(fid, UserDataType.Fname);
    expect(fname._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails without fid', async () => {
    const result = await client.getUserData(new Uint8Array(), UserDataType.Pfp);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });
});

describe('getUserDataByFid', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(pfpAdd);
    await engine.mergeMessage(locationAdd);
    const result = await client.getUserDataByFid(fid);
    expect(new Set(result._unsafeUnwrap().map((msg) => msg.hash()))).toEqual(
      new Set([pfpAdd.hash(), locationAdd.hash()])
    );
  });

  test('returns empty array without messages', async () => {
    const result = await client.getUserDataByFid(fid);
    expect(result._unsafeUnwrap()).toEqual([]);
  });
});
