import {
  Message,
  FarcasterNetwork,
  IdRegistryEvent,
  SignerAddMessage,
  UserDataAddMessage,
  UserDataType,
  UserDataRequest,
  FidRequest,
  bytesToUtf8String,
  Factories,
  HubError,
  getInsecureHubRpcClient,
  HubRpcClient,
  UsernameProofRequest,
  UserNameProof,
} from '@farcaster/hub-nodejs';
import { Ok } from 'neverthrow';
import SyncEngine from '../../network/sync/syncEngine.js';
import Server from '../server.js';
import { jestRocksDB } from '../../storage/db/jestUtils.js';
import Engine from '../../storage/engine/index.js';
import { MockHub } from '../../test/mocks.js';

const db = jestRocksDB('protobufs.rpc.userdataservice.test');
const network = FarcasterNetwork.TESTNET;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine);

let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine, new SyncEngine(hub, db));
  const port = await server.start();
  client = getInsecureHubRpcClient(`127.0.0.1:${port}`);
});

afterAll(async () => {
  client.close();
  await server.stop();
  await engine.stop();
});

const fid = Factories.Fid.build();
const fname = Factories.Fname.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodySignerKey: Uint8Array;
let custodyEvent: IdRegistryEvent;
let signerAdd: SignerAddMessage;

let pfpAdd: UserDataAddMessage;
let displayAdd: UserDataAddMessage;
let addFname: UserDataAddMessage;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } }
  );

  pfpAdd = await Factories.UserDataAddMessage.create(
    { data: { fid, userDataBody: { type: UserDataType.PFP } } },
    { transient: { signer } }
  );

  displayAdd = await Factories.UserDataAddMessage.create(
    { data: { fid, userDataBody: { type: UserDataType.DISPLAY }, timestamp: pfpAdd.data.timestamp + 1 } },
    { transient: { signer } }
  );

  addFname = await Factories.UserDataAddMessage.create(
    {
      data: {
        fid,
        userDataBody: {
          type: UserDataType.FNAME,
          value: bytesToUtf8String(fname)._unsafeUnwrap(),
        },
        timestamp: pfpAdd.data.timestamp + 2,
      },
    },
    { transient: { signer } }
  );
});

describe('getUserData', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    expect(await engine.mergeMessage(pfpAdd)).toBeInstanceOf(Ok);
    expect(await engine.mergeMessage(displayAdd)).toBeInstanceOf(Ok);

    const pfp = await client.getUserData(UserDataRequest.create({ fid, userDataType: UserDataType.PFP }));
    expect(Message.toJSON(pfp._unsafeUnwrap())).toEqual(Message.toJSON(pfpAdd));

    const display = await client.getUserData(UserDataRequest.create({ fid, userDataType: UserDataType.DISPLAY }));
    expect(Message.toJSON(display._unsafeUnwrap())).toEqual(Message.toJSON(displayAdd));

    const nameProof = Factories.UserNameProof.build({ name: fname, owner: custodySignerKey });
    await engine.mergeUserNameProof(nameProof);

    expect(await engine.mergeMessage(addFname)).toBeInstanceOf(Ok);
    const fnameData = await client.getUserData(UserDataRequest.create({ fid, userDataType: UserDataType.FNAME }));
    expect(Message.toJSON(fnameData._unsafeUnwrap())).toEqual(Message.toJSON(addFname));

    const usernameProof = await client.getUsernameProof(UsernameProofRequest.create({ name: nameProof.name }));
    expect(UserNameProof.toJSON(usernameProof._unsafeUnwrap())).toEqual(UserNameProof.toJSON(nameProof));
  });

  test('fails when user data is missing', async () => {
    const pfp = await client.getUserData(UserDataRequest.create({ fid, userDataType: UserDataType.PFP }));
    expect(pfp._unsafeUnwrapErr().errCode).toEqual('not_found');
    const fname = await client.getUserData(UserDataRequest.create({ fid, userDataType: UserDataType.FNAME }));
    expect(fname._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails without fid', async () => {
    const result = await client.getUserData(UserDataRequest.create({ fid: 0, userDataType: UserDataType.PFP }));
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
    await engine.mergeMessage(displayAdd);
    const result = await client.getUserDataByFid(FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
      [pfpAdd, displayAdd].map((m) => Message.toJSON(m))
    );
  });

  test('returns empty array without messages', async () => {
    const result = await client.getUserDataByFid(FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });
});
