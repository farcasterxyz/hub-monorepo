import { HubError } from '@hub/errors';
import Factories from '~/flatbuffers/factories';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import { SignerAddModel, VerificationAddEthAddressModel } from '~/flatbuffers/models/types';
import SyncEngine from '~/network/sync/syncEngine';
import HubClient from '~/rpc/client';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('flatbuffers.rpc.verificationService.test');
const engine = new Engine(db);
const hub = new MockHub(db, engine);

let server: Server;
let client: HubClient;

beforeAll(async () => {
  server = new Server(hub, engine, new SyncEngine(engine));
  const port = await server.start();
  client = new HubClient(`127.0.0.1:${port}`);
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

let verificationAdd: VerificationAddEthAddressModel;

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

  const verificationBody = await Factories.VerificationAddEthAddressBody.create({}, { transient: { fid } });
  const verificationData = await Factories.VerificationAddEthAddressData.create({
    fid: Array.from(fid),
    body: verificationBody.unpack(),
  });
  verificationAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(verificationData.bb?.bytes() ?? []) }, { transient: { signer } })
  ) as VerificationAddEthAddressModel;
});

describe('getVerification', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(verificationAdd);
    const result = await client.getVerification(fid, verificationAdd.body().addressArray() ?? new Uint8Array());
    expect(result._unsafeUnwrap()).toEqual(verificationAdd.message);
  });

  test('fails if verification is missing', async () => {
    const result = await client.getVerification(fid, verificationAdd.body().addressArray() ?? new Uint8Array());
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails without address', async () => {
    const result = await client.getVerification(fid, new Uint8Array());
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'address is missing'));
  });

  test('fails without fid', async () => {
    const result = await client.getVerification(
      new Uint8Array(),
      verificationAdd.body().addressArray() ?? new Uint8Array()
    );
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });
});

describe('getVerificationsByFid', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(verificationAdd);
    const verifications = await client.getVerificationsByFid(fid);
    expect(verifications._unsafeUnwrap()).toEqual([verificationAdd.message]);
  });

  test('returns empty array without messages', async () => {
    const verifications = await client.getVerificationsByFid(fid);
    expect(verifications._unsafeUnwrap()).toEqual([]);
  });
});
