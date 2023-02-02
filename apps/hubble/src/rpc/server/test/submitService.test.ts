import * as protobufs from '@farcaster/grpc';
import { Factories, getHubRpcClient, HubError, HubRpcClient } from '@farcaster/utils';
import { err } from 'neverthrow';
import SyncEngine from '~/network/sync/syncEngine';

import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('protobufs.rpc.submitService.test');
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
let castAdd: protobufs.Message;
let castRemove: protobufs.Message;

beforeAll(async () => {
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySigner.signerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerBody: { signer: signer.signerKey } } },
    { transient: { signer: custodySigner } }
  );

  castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });

  castRemove = await Factories.CastRemoveMessage.create(
    { data: { fid, network, castRemoveBody: { targetHash: castAdd.hash } } },
    { transient: { signer } }
  );
});

describe('submitMessage', () => {
  describe('with signer', () => {
    beforeEach(async () => {
      await hub.submitIdRegistryEvent(custodyEvent);
      await hub.submitMessage(signerAdd);
    });

    test('succeeds', async () => {
      const result = await client.submitMessage(castAdd);
      expect(protobufs.Message.toJSON(result._unsafeUnwrap())).toEqual(protobufs.Message.toJSON(castAdd));
      const getCast = await client.getCast(
        protobufs.CastId.create({ fid: castAdd.data?.fid ?? 0, hash: castAdd.hash })
      );
      expect(protobufs.Message.toJSON(getCast._unsafeUnwrap())).toEqual(protobufs.Message.toJSON(castAdd));
    });

    test('fails with conflict', async () => {
      await engine.mergeMessage(castRemove);
      const result = await client.submitMessage(castAdd);
      expect(result).toEqual(err(new HubError('bad_request.conflict', 'message conflicts with a CastRemove')));
    });
  });

  test('fails without signer', async () => {
    const result = await client.submitMessage(castAdd);
    const err = result._unsafeUnwrapErr();
    expect(err.errCode).toEqual('bad_request.validation_failure');
    expect(err.message).toMatch('unknown fid');
  });
});

describe('submitIdRegistryEvent', () => {
  test('succeeds', async () => {
    const result = await client.submitIdRegistryEvent(custodyEvent);
    expect(protobufs.IdRegistryEvent.toJSON(result._unsafeUnwrap())).toEqual(
      protobufs.IdRegistryEvent.toJSON(custodyEvent)
    );
  });

  test('fails with invalid event', async () => {
    const invalidEvent = Factories.IdRegistryEvent.build({
      to: signer.signerKey,
      fid,
      type: 0,
    });

    const result = await client.submitIdRegistryEvent(invalidEvent);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid event type'));
  });
});

describe('submitNameRegistryEvent', () => {
  test('succeeds', async () => {
    const nameRegistryEvent = Factories.NameRegistryEvent.build({ to: signer.signerKey });
    const result = await client.submitNameRegistryEvent(nameRegistryEvent);
    expect(protobufs.NameRegistryEvent.toJSON(result._unsafeUnwrap())).toEqual(
      protobufs.NameRegistryEvent.toJSON(nameRegistryEvent)
    );
  });

  test('fails with invalid event', async () => {
    const invalidEvent = Factories.NameRegistryEvent.build({
      to: signer.signerKey,
      type: 0,
    });

    const result = await client.submitNameRegistryEvent(invalidEvent);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid event type'));
  });
});
