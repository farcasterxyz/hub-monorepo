import * as protobufs from '@farcaster/protobufs';
import { Factories, HubError } from '@farcaster/protoutils';
import SyncEngine from '~/network/sync/syncEngine';
import { getHubRpcClient, HubRpcClient } from '~/rpc/client';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('protobufs.rpc.verificationService.test');
const network = protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine);

let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine, new SyncEngine(engine));
  const port = await server.start();
  client = getHubRpcClient(`127.0.0.1:${port}`);
});

afterAll(async () => {
  client.$.close();
  await server.stop();
});

const fid = Factories.Fid.build();
const custodySigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();

let custodyEvent: protobufs.IdRegistryEvent;
let signerAdd: protobufs.Message;

let verificationAdd: protobufs.VerificationAddEthAddressMessage;

beforeAll(async () => {
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySigner.signerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerBody: { signer: signer.signerKey } } },
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
      protobufs.VerificationRequest.create({
        fid,
        address: verificationAdd.data.verificationAddEthAddressBody.address ?? new Uint8Array(),
      })
    );
    expect(protobufs.Message.toJSON(result._unsafeUnwrap())).toEqual(protobufs.Message.toJSON(verificationAdd));
  });

  test('fails if verification is missing', async () => {
    const result = await client.getVerification(
      protobufs.VerificationRequest.create({
        fid,
        address: verificationAdd.data.verificationAddEthAddressBody.address ?? new Uint8Array(),
      })
    );
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails without address', async () => {
    const result = await client.getVerification(
      protobufs.VerificationRequest.create({
        fid,
        address: new Uint8Array(),
      })
    );
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'address is missing'));
  });

  test('fails without fid', async () => {
    const result = await client.getVerification(
      protobufs.VerificationRequest.create({
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

    const verifications = await client.getVerificationsByFid(protobufs.FidRequest.create({ fid }));
    expect(verifications._unsafeUnwrap().messages.map((m) => protobufs.Message.toJSON(m))).toEqual(
      [verificationAdd].map((m) => protobufs.Message.toJSON(m))
    );
  }, 1000000);

  test('returns empty array without messages', async () => {
    const verifications = await client.getVerificationsByFid(protobufs.FidRequest.create({ fid }));
    expect(verifications._unsafeUnwrap().messages).toEqual([]);
  });
});
