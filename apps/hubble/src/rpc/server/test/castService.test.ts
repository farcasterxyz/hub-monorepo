import * as protobufs from '@farcaster/protobufs';
import { Factories, getHubRpcClient, HubError, HubRpcClient } from '@farcaster/utils';
import SyncEngine from '~/network/sync/syncEngine';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('protobufs.rpc.castService.test');
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
const custodySigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();

let custodyEvent: protobufs.IdRegistryEvent;
let signerAdd: protobufs.Message;
let castAdd: protobufs.Message;

beforeAll(async () => {
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySigner.signerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerBody: { signer: signer.signerKey } } },
    { transient: { signer: custodySigner } }
  );

  castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
});

describe('getCast', () => {
  test('succeeds', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(castAdd);

    const result = await client.getCast(protobufs.CastId.create({ fid, hash: castAdd.hash }));
    expect(result.isOk()).toBeTruthy();
    expect(protobufs.Message.toJSON(result._unsafeUnwrap())).toEqual(protobufs.Message.toJSON(castAdd));
  });

  test('fails if cast is missing', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
    const result = await client.getCast(protobufs.CastId.create({ fid, hash: castAdd.hash }));
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails without fid or tsHash', async () => {
    const result = await client.getCast(protobufs.CastId.create({ fid: 0, hash: new Uint8Array() }));
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });

  test('fails without tsHash', async () => {
    const result = await client.getCast(protobufs.CastId.create({ fid, hash: new Uint8Array() }));
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'NotFound: '));
  });

  test('fails without fid', async () => {
    const result = await client.getCast(protobufs.CastId.create({ fid: 0, hash: castAdd.hash }));
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });

  describe('getCastsByFid', () => {
    beforeEach(async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeMessage(signerAdd);
    });

    test('succeeds', async () => {
      await engine.mergeMessage(castAdd);
      const casts = await client.getCastsByFid(protobufs.FidRequest.create({ fid }));
      expect(protobufs.Message.toJSON(casts._unsafeUnwrap().messages.at(0) as protobufs.Message)).toEqual(
        protobufs.Message.toJSON(castAdd)
      );
    });

    test('returns empty array without casts', async () => {
      const casts = await client.getCastsByFid(protobufs.FidRequest.create({ fid }));
      expect(casts._unsafeUnwrap().messages).toEqual([]);
    });
  });

  describe('getCastsByParent', () => {
    beforeEach(async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeMessage(signerAdd);
    });

    test('succeeds', async () => {
      await engine.mergeMessage(castAdd);
      const casts = await client.getCastsByParent(castAdd.data?.castAddBody?.parentCastId as protobufs.CastId);
      expect(protobufs.Message.toJSON(casts._unsafeUnwrap().messages.at(0) as protobufs.Message)).toEqual(
        protobufs.Message.toJSON(castAdd)
      );
    });

    test('returns empty array without casts', async () => {
      const casts = await client.getCastsByParent(castAdd.data?.castAddBody?.parentCastId as protobufs.CastId);
      expect(casts._unsafeUnwrap().messages).toEqual([]);
    });
  });

  describe('getCastsByMention', () => {
    beforeEach(async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeMessage(signerAdd);
    });

    test('succeeds', async () => {
      await engine.mergeMessage(castAdd);
      for (let i = 0; i < (castAdd.data?.castAddBody?.mentions.length as number); i++) {
        const casts = await client.getCastsByMention(
          // Safety: i is controlled by the loop and cannot be used to inject
          // eslint-disable-next-line security/detect-object-injection
          protobufs.FidRequest.create({ fid: castAdd.data?.castAddBody?.mentions[i] as number })
        );
        expect(protobufs.Message.toJSON(casts._unsafeUnwrap().messages.at(0) as protobufs.Message)).toEqual(
          protobufs.Message.toJSON(castAdd)
        );
      }
    });

    test('returns empty array without casts', async () => {
      for (let i = 0; i < (castAdd.data?.castAddBody?.mentions.length as number); i++) {
        const casts = await client.getCastsByMention(
          // Safety: i is controlled by the loop and cannot be used to inject
          // eslint-disable-next-line security/detect-object-injection
          protobufs.FidRequest.create({ fid: castAdd.data?.castAddBody?.mentions[i] as number })
        );
        expect(casts._unsafeUnwrap().messages).toEqual([]);
      }
    });
  });
});
