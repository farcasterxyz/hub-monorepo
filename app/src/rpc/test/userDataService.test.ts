import { UserDataType } from '@hub/flatbuffers';
import { HubError } from '@hub/utils';
import { ok } from 'neverthrow';
import Factories from '~/flatbuffers/factories';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';
import { SignerAddModel, UserDataAddModel } from '~/flatbuffers/models/types';
import SyncEngine from '~/network/sync/syncEngine';
import HubRpcClient from '~/rpc/client';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';
import { addressInfoFromParts } from '~/utils/p2p';

const db = jestRocksDB('flatbuffers.rpc.userDataService.test');
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
const fname = Factories.Fname.build();
const ethSigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();
let custodyEvent: IdRegistryEventModel;
let signerAdd: SignerAddModel;

let pfpAdd: UserDataAddModel;
let locationAdd: UserDataAddModel;
let addFname: UserDataAddModel;

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
    expect(pfp._unsafeUnwrap()).toEqual(pfpAdd.message);

    const location = await client.getUserData(fid, UserDataType.Location);
    expect(location._unsafeUnwrap()).toEqual(locationAdd.message);

    const nameRegistryEvent = await Factories.NameRegistryEvent.create({
      fname: Array.from(fname),
      to: Array.from(ethSigner.signerKey),
    });
    const model = new NameRegistryEventModel(nameRegistryEvent);
    await model.put(db);

    expect(await engine.mergeMessage(addFname)).toEqual(ok(undefined));
    const fnameData = await client.getUserData(fid, UserDataType.Fname);
    expect(fnameData._unsafeUnwrap()).toEqual(addFname.message);
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
    expect(new Set(result._unsafeUnwrap())).toEqual(new Set([pfpAdd.message, locationAdd.message]));
  });

  test('returns empty array without messages', async () => {
    const result = await client.getUserDataByFid(fid);
    expect(result._unsafeUnwrap()).toEqual([]);
  });
});
