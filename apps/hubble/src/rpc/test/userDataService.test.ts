import * as protobufs from '@farcaster/protobufs';
import { bytesToUtf8String, Factories, getInsecureHubRpcClient, HubError, HubRpcClient } from '@farcaster/utils';
import { Ok } from 'neverthrow';
import SyncEngine from '~/network/sync/syncEngine';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('protobufs.rpc.userdataservice.test');
const network = protobufs.FarcasterNetwork.TESTNET;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine);

let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine, new SyncEngine(engine, db));
  const port = await server.start();
  client = getInsecureHubRpcClient(`127.0.0.1:${port}`);
});

afterAll(async () => {
  client.$.close();
  await server.stop();
  await engine.stop();
});

const fid = Factories.Fid.build();
const fname = Factories.Fname.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodySignerKey: Uint8Array;
let custodyEvent: protobufs.IdRegistryEvent;
let signerAdd: protobufs.SignerAddMessage;

let pfpAdd: protobufs.UserDataAddMessage;
let displayAdd: protobufs.UserDataAddMessage;
let addFname: protobufs.UserDataAddMessage;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } }
  );

  pfpAdd = await Factories.UserDataAddMessage.create(
    { data: { fid, userDataBody: { type: protobufs.UserDataType.PFP } } },
    { transient: { signer } }
  );

  displayAdd = await Factories.UserDataAddMessage.create(
    { data: { fid, userDataBody: { type: protobufs.UserDataType.DISPLAY }, timestamp: pfpAdd.data.timestamp + 1 } },
    { transient: { signer } }
  );

  addFname = await Factories.UserDataAddMessage.create(
    {
      data: {
        fid,
        userDataBody: {
          type: protobufs.UserDataType.FNAME,
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

    const pfp = await client.getUserData(
      protobufs.UserDataRequest.create({ fid, userDataType: protobufs.UserDataType.PFP })
    );
    expect(protobufs.Message.toJSON(pfp._unsafeUnwrap())).toEqual(protobufs.Message.toJSON(pfpAdd));

    const display = await client.getUserData(
      protobufs.UserDataRequest.create({ fid, userDataType: protobufs.UserDataType.DISPLAY })
    );
    expect(protobufs.Message.toJSON(display._unsafeUnwrap())).toEqual(protobufs.Message.toJSON(displayAdd));

    const nameRegistryEvent = Factories.NameRegistryEvent.build({ fname, to: custodySignerKey });
    await engine.mergeNameRegistryEvent(nameRegistryEvent);

    expect(await engine.mergeMessage(addFname)).toBeInstanceOf(Ok);
    const fnameData = await client.getUserData(
      protobufs.UserDataRequest.create({ fid, userDataType: protobufs.UserDataType.FNAME })
    );
    expect(protobufs.Message.toJSON(fnameData._unsafeUnwrap())).toEqual(protobufs.Message.toJSON(addFname));
  });

  test('fails when user data is missing', async () => {
    const pfp = await client.getUserData(
      protobufs.UserDataRequest.create({ fid, userDataType: protobufs.UserDataType.PFP })
    );
    expect(pfp._unsafeUnwrapErr().errCode).toEqual('not_found');
    const fname = await client.getUserData(
      protobufs.UserDataRequest.create({ fid, userDataType: protobufs.UserDataType.FNAME })
    );
    expect(fname._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails without fid', async () => {
    const result = await client.getUserData(
      protobufs.UserDataRequest.create({ fid: 0, userDataType: protobufs.UserDataType.PFP })
    );
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
    const result = await client.getUserDataByFid(protobufs.FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.map((m) => protobufs.Message.toJSON(m))).toEqual(
      [pfpAdd, displayAdd].map((m) => protobufs.Message.toJSON(m))
    );
  });

  test('returns empty array without messages', async () => {
    const result = await client.getUserDataByFid(protobufs.FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });
});
