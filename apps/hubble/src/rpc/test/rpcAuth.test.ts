import { RateLimiterMemory } from 'rate-limiter-flexible';
import {
  Factories,
  HubError,
  getInsecureHubRpcClient,
  Metadata,
  FarcasterNetwork,
  IdRegistryEvent,
  SignerAddMessage,
  Empty,
} from '@farcaster/hub-nodejs';
import SyncEngine from '~/network/sync/syncEngine';

import Server, { rateLimitByIp } from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';
import { sleep } from '~/utils/crypto';

const db = jestRocksDB('protobufs.rpcAuth.test');
const network = FarcasterNetwork.TESTNET;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine);

const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodyEvent: IdRegistryEvent;
let signerAdd: SignerAddMessage;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } }
  );
});

afterAll(async () => {
  await engine.stop();
});

describe('auth tests', () => {
  test('fails with invalid password', async () => {
    const authServer = new Server(hub, engine, new SyncEngine(engine, db), undefined, 'admin:password');
    const port = await authServer.start();
    const authClient = getInsecureHubRpcClient(`127.0.0.1:${port}`);

    await hub.submitIdRegistryEvent(custodyEvent);

    // No password
    const result = await authClient.submitMessage(signerAdd);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('unauthorized', 'gRPC authentication failed: Authorization header is empty')
    );

    // Wrong password
    const metadata = new Metadata();
    metadata.set('authorization', `Basic ${Buffer.from(`admin:wrongpassword`).toString('base64')}`);
    const result2 = await authClient.submitMessage(signerAdd, metadata);
    expect(result2._unsafeUnwrapErr()).toEqual(
      new HubError('unauthorized', 'gRPC authentication failed: Invalid password for user: admin')
    );

    // Wrong username
    const metadata2 = new Metadata();
    metadata2.set('authorization', `Basic ${Buffer.from(`wronguser:password`).toString('base64')}`);
    const result3 = await authClient.submitMessage(signerAdd, metadata2);
    expect(result3._unsafeUnwrapErr()).toEqual(
      new HubError('unauthorized', 'gRPC authentication failed: Invalid username: wronguser')
    );

    // Right password
    const metadata3 = new Metadata();
    metadata3.set('authorization', `Basic ${Buffer.from(`admin:password`).toString('base64')}`);
    const result4 = await authClient.submitMessage(signerAdd, metadata3);
    expect(result4.isOk()).toBeTruthy();

    // Non submit methods work without auth
    const result5 = await authClient.getInfo(Empty.create());
    expect(result5.isOk()).toBeTruthy();

    await authServer.stop();
    authClient.close();
  });

  test('all submit methods require auth', async () => {
    const authServer = new Server(hub, engine, new SyncEngine(engine, db), undefined, 'admin:password');
    const port = await authServer.start();
    const authClient = getInsecureHubRpcClient(`127.0.0.1:${port}`);

    await hub.submitIdRegistryEvent(custodyEvent);

    // Without auth fails
    const result1 = await authClient.submitMessage(signerAdd);
    expect(result1._unsafeUnwrapErr()).toEqual(
      new HubError('unauthorized', 'gRPC authentication failed: Authorization header is empty')
    );

    // Works with auth
    const metadata = new Metadata();
    metadata.set('authorization', `Basic ${Buffer.from(`admin:password`).toString('base64')}`);

    const result2 = await authClient.submitMessage(signerAdd, metadata);
    expect(result2.isOk()).toBeTruthy();

    await authServer.stop();
    authClient.close();
  });

  test('test rate limiting', async () => {
    const Limit10PerSecond = new RateLimiterMemory({
      points: 10,
      duration: 1,
    });

    // 10 Requests should be fine
    for (let i = 0; i < 10; i++) {
      const result = await rateLimitByIp('testip:3000', Limit10PerSecond);
      expect(result.isOk()).toBeTruthy();
    }

    // Sleep for 1 second to reset the rate limiter
    await sleep(1100);

    // 11th+ request should fail
    for (let i = 0; i < 20; i++) {
      const result = await rateLimitByIp('testip:3000', Limit10PerSecond);
      if (i < 10) {
        expect(result.isOk()).toBeTruthy();
      } else {
        expect(result._unsafeUnwrapErr().message).toEqual('Too many requests');
      }
    }
  });
});
