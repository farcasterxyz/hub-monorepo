import { HubError } from '@hub/errors';
import { IdRegistryEventType, NameRegistryEventType } from '@hub/flatbuffers';
import Factories from '~/flatbuffers/factories';
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
import { addressInfoFromParts } from '~/utils/p2p';

const db = jestRocksDB('flatbuffers.rpc.submitService.test');
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

describe('submitMessage', () => {
  describe('with signer', () => {
    beforeEach(async () => {
      await hub.submitIdRegistryEvent(custodyEvent);
      await hub.submitMessage(signerAdd);
    });

    test('succeeds', async () => {
      const result = await client.submitMessage(castAdd.message);
      expect(result._unsafeUnwrap()).toEqual(castAdd.message);
      const getCast = await client.getCast(castAdd.fid(), castAdd.tsHash());
      expect(getCast._unsafeUnwrap()).toEqual(castAdd.message);
    });
  });

  test('fails without signer', async () => {
    const result = await client.submitMessage(castAdd.message);
    const err = result._unsafeUnwrapErr();
    expect(err.errCode).toEqual('bad_request.validation_failure');
    expect(err.message).toMatch('unknown fid');
  });
});

describe('submitIdRegistryEvent', () => {
  test('succeeds', async () => {
    const result = await client.submitIdRegistryEvent(custodyEvent.event);
    expect(result._unsafeUnwrap()).toEqual(custodyEvent.event);
  });

  test('fails with invalid event', async () => {
    const invalidEvent = await Factories.IdRegistryEvent.create({
      to: Array.from(ethSigner.signerKey),
      fid: Array.from(fid),
      type: 0 as IdRegistryEventType,
    });

    const result = await client.submitIdRegistryEvent(invalidEvent);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'type is invalid'));
  });
});

describe('submitNameRegistryEvent', () => {
  test('succeeds', async () => {
    const nameRegistryEvent = new NameRegistryEventModel(
      await Factories.NameRegistryEvent.create({ to: Array.from(ethSigner.signerKey) })
    );
    const result = await client.submitNameRegistryEvent(nameRegistryEvent.event);
    expect(result._unsafeUnwrap()).toEqual(nameRegistryEvent.event);
  });

  test('fails with invalid event', async () => {
    const invalidEvent = await Factories.NameRegistryEvent.create({
      to: Array.from(ethSigner.signerKey),
      type: 0 as NameRegistryEventType,
    });

    const result = await client.submitNameRegistryEvent(invalidEvent);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'type is invalid'));
  });
});
