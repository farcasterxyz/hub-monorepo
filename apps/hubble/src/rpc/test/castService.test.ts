import {
  Message,
  FarcasterNetwork,
  IdRegistryEvent,
  SignerAddMessage,
  CastAddMessage,
  CastId,
  FidRequest,
  CastsByParentRequest,
  Factories,
  HubError,
  getInsecureHubRpcClient,
  HubRpcClient,
} from '@farcaster/hub-nodejs';
import SyncEngine from '~/network/sync/syncEngine';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('protobufs.rpc.castService.test');
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
let castAdd: CastAddMessage;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } }
  );

  castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
});

describe('getCast', () => {
  test('succeeds', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(castAdd);

    const result = await client.getCast(CastId.create({ fid, hash: castAdd.hash }));
    expect(result.isOk()).toBeTruthy();
    expect(Message.toJSON(result._unsafeUnwrap())).toEqual(Message.toJSON(castAdd));
  });

  test('fails if cast is missing', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
    const result = await client.getCast(CastId.create({ fid, hash: castAdd.hash }));
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails without fid or tsHash', async () => {
    const result = await client.getCast(CastId.create({ fid: 0, hash: new Uint8Array() }));
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });

  test('fails without tsHash', async () => {
    const result = await client.getCast(CastId.create({ fid, hash: new Uint8Array() }));
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'NotFound: '));
  });

  test('fails without fid', async () => {
    const result = await client.getCast(CastId.create({ fid: 0, hash: castAdd.hash }));
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });

  describe('getCastsByFid', () => {
    beforeEach(async () => {
      await engine.mergeIdRegistryEvent(custodyEvent);
      await engine.mergeMessage(signerAdd);
    });

    test('succeeds', async () => {
      await engine.mergeMessage(castAdd);
      const casts = await client.getCastsByFid(FidRequest.create({ fid }));
      expect(Message.toJSON(casts._unsafeUnwrap().messages.at(0) as Message)).toEqual(Message.toJSON(castAdd));
    });

    test('returns casts in chronological order', async () => {
      const castsAsJson = [];
      let latestCast;
      for (let i = 0; i < 4; i++) {
        latestCast = await Factories.CastAddMessage.create(
          {
            data: { fid, network, timestamp: i },
          },
          { transient: { signer } }
        );
        await engine.mergeMessage(latestCast);
        castsAsJson.push(Message.toJSON(latestCast));
      }

      const clientRetrievedCasts = await client.getCastsByFid(FidRequest.create({ fid }));
      const clientRetrievedCastsAsJson = clientRetrievedCasts._unsafeUnwrap().messages.map(Message.toJSON);

      expect(castsAsJson.length).toEqual(4);
      expect(clientRetrievedCastsAsJson.length).toEqual(4);

      expect(clientRetrievedCastsAsJson).toEqual(castsAsJson);
    });

    test('returns empty array without casts', async () => {
      const casts = await client.getCastsByFid(FidRequest.create({ fid }));
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
      const request = CastsByParentRequest.create({ castId: castAdd.data.castAddBody.parentCastId });
      const casts = await client.getCastsByParent(request);
      expect(Message.toJSON(casts._unsafeUnwrap().messages.at(0) as Message)).toEqual(Message.toJSON(castAdd));
    });

    test('returns empty array without casts', async () => {
      const request = CastsByParentRequest.create({ castId: castAdd.data.castAddBody.parentCastId });
      const casts = await client.getCastsByParent(request);
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
          FidRequest.create({ fid: castAdd.data?.castAddBody?.mentions[i] as number })
        );
        expect(Message.toJSON(casts._unsafeUnwrap().messages.at(0) as Message)).toEqual(Message.toJSON(castAdd));
      }
    });

    test('returns empty array without casts', async () => {
      for (let i = 0; i < (castAdd.data?.castAddBody?.mentions.length as number); i++) {
        const casts = await client.getCastsByMention(
          // Safety: i is controlled by the loop and cannot be used to inject
          // eslint-disable-next-line security/detect-object-injection
          FidRequest.create({ fid: castAdd.data?.castAddBody?.mentions[i] as number })
        );
        expect(casts._unsafeUnwrap().messages).toEqual([]);
      }
    });
  });
});
