import * as protobufs from '@farcaster/protobufs';
import { Eip712Signer, Factories, getInsecureHubRpcClient, HubError, HubRpcClient } from '@farcaster/utils';
import { err } from 'neverthrow';
import SyncEngine from '~/network/sync/syncEngine';

import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('protobufs.rpc.submitService.test');
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
});

const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();

let custodySigner: Eip712Signer;
let custodyEvent: protobufs.IdRegistryEvent;
let signerAdd: protobufs.Message;
let castAdd: protobufs.Message;
let castRemove: protobufs.Message;

beforeAll(async () => {
  custodySigner = await Factories.Eip712Signer.create();
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySigner.signerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signer.signerKey } } },
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
