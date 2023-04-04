import {
  Factories,
  HubError,
  getInsecureHubRpcClient,
  HubRpcClient,
  Message,
  FarcasterNetwork,
  IdRegistryEvent,
  SignerAddMessage,
  VerificationAddEthAddressMessage,
  VerificationRequest,
  FidRequest,
} from '@farcaster/hub-nodejs';
import SyncEngine from '~/network/sync/syncEngine';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('protobufs.rpc.verificationService.test');
const network = FarcasterNetwork.TESTNET;
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
  client.close();
  await server.stop();
  await engine.stop();
});

const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodyEvent: IdRegistryEvent;
let signerAdd: SignerAddMessage;

let verificationAdd: VerificationAddEthAddressMessage;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } }
  );

  verificationAdd = await Factories.VerificationAddEthAddressMessage.create(
    { data: { fid, network } },
    { transient: { signer } }
  );
});

describe('getVerification', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    const r = await engine.mergeMessage(verificationAdd);
    expect(r.isOk()).toBeTruthy();

    const result = await client.getVerification(
      VerificationRequest.create({
        fid,
        address: verificationAdd.data.verificationAddEthAddressBody.address ?? new Uint8Array(),
      })
    );
    expect(Message.toJSON(result._unsafeUnwrap())).toEqual(Message.toJSON(verificationAdd));
  });

  test('fails if verification is missing', async () => {
    const result = await client.getVerification(
      VerificationRequest.create({
        fid,
        address: verificationAdd.data.verificationAddEthAddressBody.address ?? new Uint8Array(),
      })
    );
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails without address', async () => {
    const result = await client.getVerification(
      VerificationRequest.create({
        fid,
        address: new Uint8Array(),
      })
    );
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'address is missing'));
  });

  test('fails without fid', async () => {
    const result = await client.getVerification(
      VerificationRequest.create({
        address: verificationAdd.data.verificationAddEthAddressBody.address ?? new Uint8Array(),
      })
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
    const result = await engine.mergeMessage(verificationAdd);
    expect(result.isOk()).toBeTruthy();

    const verifications = await client.getVerificationsByFid(FidRequest.create({ fid }));
    expect(verifications._unsafeUnwrap().messages.map((m) => Message.toJSON(m))).toEqual(
      [verificationAdd].map((m) => Message.toJSON(m))
    );
  });

  test('returns empty array without messages', async () => {
    const verifications = await client.getVerificationsByFid(FidRequest.create({ fid }));
    expect(verifications._unsafeUnwrap().messages).toEqual([]);
  });
});
