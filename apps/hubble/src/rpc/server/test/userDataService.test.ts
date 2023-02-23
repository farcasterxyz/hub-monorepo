import * as protobufs from '@farcaster/protobufs';
import { bytesToUtf8String, Factories, getHubRpcClient, HubError, HubRpcClient } from '@farcaster/utils';
import { Ok } from 'neverthrow';
import SyncEngine from '~/network/sync/syncEngine';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('protobufs.rpc.userdataservice.test');
const network = protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine);

let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine, new SyncEngine(engine, db));
  const port = await server.start();
  client = getHubRpcClient(`127.0.0.1:${port}`);
});

afterAll(async () => {
  client.$.close();
  await server.stop();
});

const fid = Factories.Fid.build();
const fname = Factories.Fname.build();
const custodySigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();

let custodyEvent: protobufs.IdRegistryEvent;
let signerAdd: protobufs.Message;

let pfpAdd: protobufs.UserDataAddMessage;
let locationAdd: protobufs.UserDataAddMessage;
let addFname: protobufs.UserDataAddMessage;

beforeAll(async () => {
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySigner.signerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerBody: { signer: signer.signerKey } } },
    { transient: { signer: custodySigner } }
  );

  pfpAdd = await Factories.UserDataAddMessage.create(
    { data: { fid, userDataBody: { type: protobufs.UserDataType.USER_DATA_TYPE_PFP } } },
    { transient: { signer } }
  );

  locationAdd = await Factories.UserDataAddMessage.create(
    { data: { fid, userDataBody: { type: protobufs.UserDataType.USER_DATA_TYPE_LOCATION } } },
    { transient: { signer } }
  );

  addFname = await Factories.UserDataAddMessage.create(
    {
      data: {
        fid,
        userDataBody: {
          type: protobufs.UserDataType.USER_DATA_TYPE_FNAME,
          value: bytesToUtf8String(fname)._unsafeUnwrap(),
        },
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
    expect(await engine.mergeMessage(locationAdd)).toBeInstanceOf(Ok);

    const pfp = await client.getUserData(
      protobufs.UserDataRequest.create({ fid, userDataType: protobufs.UserDataType.USER_DATA_TYPE_PFP })
    );
    expect(protobufs.Message.toJSON(pfp._unsafeUnwrap())).toEqual(protobufs.Message.toJSON(pfpAdd));

    const location = await client.getUserData(
      protobufs.UserDataRequest.create({ fid, userDataType: protobufs.UserDataType.USER_DATA_TYPE_LOCATION })
    );
    expect(protobufs.Message.toJSON(location._unsafeUnwrap())).toEqual(protobufs.Message.toJSON(locationAdd));

    const nameRegistryEvent = Factories.NameRegistryEvent.build({ fname, to: custodySigner.signerKey });
    await engine.mergeNameRegistryEvent(nameRegistryEvent);

    expect(await engine.mergeMessage(addFname)).toBeInstanceOf(Ok);
    const fnameData = await client.getUserData(
      protobufs.UserDataRequest.create({ fid, userDataType: protobufs.UserDataType.USER_DATA_TYPE_FNAME })
    );
    expect(protobufs.Message.toJSON(fnameData._unsafeUnwrap())).toEqual(protobufs.Message.toJSON(addFname));
  });

  test('fails when user data is missing', async () => {
    const pfp = await client.getUserData(
      protobufs.UserDataRequest.create({ fid, userDataType: protobufs.UserDataType.USER_DATA_TYPE_PFP })
    );
    expect(pfp._unsafeUnwrapErr().errCode).toEqual('not_found');
    const fname = await client.getUserData(
      protobufs.UserDataRequest.create({ fid, userDataType: protobufs.UserDataType.USER_DATA_TYPE_FNAME })
    );
    expect(fname._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails without fid', async () => {
    const result = await client.getUserData(
      protobufs.UserDataRequest.create({ fid: 0, userDataType: protobufs.UserDataType.USER_DATA_TYPE_PFP })
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
    await engine.mergeMessage(locationAdd);
    const result = await client.getUserDataByFid(protobufs.FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.map((m) => protobufs.Message.toJSON(m))).toEqual(
      [pfpAdd, locationAdd].map((m) => protobufs.Message.toJSON(m))
    );
  });

  test('returns empty array without messages', async () => {
    const result = await client.getUserDataByFid(protobufs.FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });
});
