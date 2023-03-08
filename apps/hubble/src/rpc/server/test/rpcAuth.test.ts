import * as protobufs from '@farcaster/protobufs';
import { Factories, getInsecureHubRpcClient, HubError } from '@farcaster/utils';
import SyncEngine from '~/network/sync/syncEngine';

import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('protobufs.rpcAuth.test');
const network = protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine);

const fid = Factories.Fid.build();
const custodySigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();

let custodyEvent: protobufs.IdRegistryEvent;
let signerAdd: protobufs.Message;

beforeAll(async () => {
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySigner.signerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signer.signerKey } } },
    { transient: { signer: custodySigner } }
  );
});

describe('auth tests', () => {
  test('fails with invalid password', async () => {
    const authServer = new Server(hub, engine, new SyncEngine(engine, db), undefined, 'admin:password');
    const port = await authServer.start();
    const authClient = getInsecureHubRpcClient(`127.0.0.1:${port}`);

    const nameRegistryEvent = Factories.NameRegistryEvent.build({ to: signer.signerKey });

    // No password
    const result = await authClient.submitNameRegistryEvent(nameRegistryEvent);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('unauthorized', 'User is not authenticated'));

    // Wrong password
    const metadata = new protobufs.Metadata();
    metadata.set('authorization', `Basic ${Buffer.from(`admin:wrongpassword`).toString('base64')}`);
    const result2 = await authClient.submitNameRegistryEvent(nameRegistryEvent, metadata);
    expect(result2._unsafeUnwrapErr()).toEqual(new HubError('unauthorized', 'User is not authenticated'));

    // Wrong username
    const metadata2 = new protobufs.Metadata();
    metadata2.set('authorization', `Basic ${Buffer.from(`wronguser:password`).toString('base64')}`);
    const result3 = await authClient.submitNameRegistryEvent(nameRegistryEvent, metadata2);
    expect(result3._unsafeUnwrapErr()).toEqual(new HubError('unauthorized', 'User is not authenticated'));

    // Right password
    const metadata3 = new protobufs.Metadata();
    metadata3.set('authorization', `Basic ${Buffer.from(`admin:password`).toString('base64')}`);
    const result4 = await authClient.submitNameRegistryEvent(nameRegistryEvent, metadata3);
    expect(result4.isOk()).toBeTruthy();

    // Non submit methods work without auth
    const result5 = await authClient.getInfo(protobufs.Empty.create());
    expect(result5.isOk()).toBeTruthy();

    await authServer.stop();
    authClient.$.close();
  });

  test('all submit methods require auth', async () => {
    const authServer = new Server(hub, engine, new SyncEngine(engine, db), undefined, 'admin:password');
    const port = await authServer.start();
    const authClient = getInsecureHubRpcClient(`127.0.0.1:${port}`);

    // Without auth fails
    const result = await authClient.submitIdRegistryEvent(custodyEvent);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('unauthorized', 'User is not authenticated'));

    const result2 = await authClient.submitMessage(signerAdd);
    expect(result2._unsafeUnwrapErr()).toEqual(new HubError('unauthorized', 'User is not authenticated'));

    const result3 = await authClient.submitNameRegistryEvent(Factories.NameRegistryEvent.build());
    expect(result3._unsafeUnwrapErr()).toEqual(new HubError('unauthorized', 'User is not authenticated'));

    // Works with auth
    const metadata = new protobufs.Metadata();
    metadata.set('authorization', `Basic ${Buffer.from(`admin:password`).toString('base64')}`);
    const result4 = await authClient.submitIdRegistryEvent(custodyEvent, metadata);
    expect(result4.isOk()).toBeTruthy();

    const result5 = await authClient.submitMessage(signerAdd, metadata);
    expect(result5.isOk()).toBeTruthy();

    const result6 = await authClient.submitNameRegistryEvent(Factories.NameRegistryEvent.build(), metadata);
    expect(result6.isOk()).toBeTruthy();

    await authServer.stop();
    authClient.$.close();
  });
});
