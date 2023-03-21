import * as protobufs from '@farcaster/protobufs';
import { Factories, getInsecureHubRpcClient, HubError, HubResult, HubRpcClient } from '@farcaster/utils';
import { ok } from 'neverthrow';
import SyncEngine from '~/network/sync/syncEngine';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('protobufs.rpc.signerService.test');
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
  await engine.stop();
});

const assertMessagesMatchResult = (result: HubResult<protobufs.MessagesResponse>, messages: protobufs.Message[]) => {
  expect(result._unsafeUnwrap().messages.map((m) => protobufs.Message.toJSON(m))).toEqual(
    messages.map((m) => protobufs.Message.toJSON(m))
  );
};

const fid = Factories.Fid.build();
const fid2 = fid + 1;
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();
const custodySigner2 = Factories.Eip712Signer.build();
let custodyEvent: protobufs.IdRegistryEvent;
let custodyEvent2: protobufs.IdRegistryEvent;
let signerAdd: protobufs.SignerAddMessage;
let signerKey: Uint8Array;

beforeAll(async () => {
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  const custodySignerKey2 = (await custodySigner2.getSignerKey())._unsafeUnwrap();
  signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });
  custodyEvent2 = Factories.IdRegistryEvent.build({ fid: fid2, to: custodySignerKey2 });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } }
  );
});

describe('getSigner', () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(signerAdd);
    const result = await client.getSigner(protobufs.SignerRequest.create({ fid, signer: signerKey }));
    expect(protobufs.Message.toJSON(result._unsafeUnwrap())).toEqual(protobufs.Message.toJSON(signerAdd));
  });

  test('fails if signer is missing', async () => {
    const result = await client.getSigner(protobufs.SignerRequest.create({ fid, signer: signerKey }));
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });

  test('fails without signer key', async () => {
    const result = await client.getSigner(protobufs.SignerRequest.create({ fid, signer: new Uint8Array() }));
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'publicKey is missing'));
  });

  test('fails without fid', async () => {
    const result = await client.getSigner(protobufs.SignerRequest.create({ fid: 0, signer: signerKey }));
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'fid is missing'));
  });
});

describe('getSignersByFid', () => {
  const signer2 = Factories.Ed25519Signer.build();
  let signer2Key: Uint8Array;
  let signerAdd2: protobufs.Message;

  beforeAll(async () => {
    signer2Key = (await signer2.getSignerKey())._unsafeUnwrap();
    signerAdd2 = await Factories.SignerAddMessage.create(
      {
        data: {
          fid,
          network,
          timestamp: signerAdd.data?.timestamp + 1,
          signerAddBody: { signer: signer2Key },
        },
      },
      { transient: { signer: custodySigner } }
    );
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(signerAdd2);
    const result = await client.getSignersByFid(protobufs.FidRequest.create({ fid }));
    assertMessagesMatchResult(result, [signerAdd, signerAdd2]);
  });

  test('returns pageSize messages', async () => {
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(signerAdd2);
    const result = await client.getSignersByFid(protobufs.FidRequest.create({ fid, pageSize: 1 }));
    assertMessagesMatchResult(result, [signerAdd]);
  });

  test('returns all messages when pageSize > messages count', async () => {
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(signerAdd2);
    const result = await client.getSignersByFid(protobufs.FidRequest.create({ fid, pageSize: 3 }));
    assertMessagesMatchResult(result, [signerAdd, signerAdd2]);
  });

  test('returns results after pageToken', async () => {
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(signerAdd2);
    const page1Result = await client.getSignersByFid(protobufs.FidRequest.create({ fid, pageSize: 1 }));
    const page2Result = await client.getSignersByFid(
      protobufs.FidRequest.create({ fid, pageToken: page1Result._unsafeUnwrap().nextPageToken })
    );
    assertMessagesMatchResult(page2Result, [signerAdd2]);
  });

  test('returns empty array with invalid page token', async () => {
    await engine.mergeMessage(signerAdd);
    const result = await client.getSignersByFid(protobufs.FidRequest.create({ fid, pageToken: new Uint8Array([255]) }));
    expect(result._unsafeUnwrap().messages).toEqual([]);
  });

  test('returns empty array without messages', async () => {
    const result = await client.getSignersByFid(protobufs.FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages).toEqual([]);
  });
});

describe('getIdRegistryEvent', () => {
  test('succeeds', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    const result = await client.getIdRegistryEvent(protobufs.FidRequest.create({ fid }));
    expect(protobufs.IdRegistryEvent.toJSON(result._unsafeUnwrap())).toEqual(
      protobufs.IdRegistryEvent.toJSON(custodyEvent)
    );
  });

  test('fails when event is missing', async () => {
    const result = await client.getIdRegistryEvent(protobufs.FidRequest.create({ fid }));
    expect(result._unsafeUnwrapErr().errCode).toEqual('not_found');
  });
});

describe('getFids', () => {
  test('succeeds', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeIdRegistryEvent(custodyEvent2);
    const result = await client.getFids(protobufs.FidsRequest.create());
    expect(result).toEqual(ok({ fids: [custodyEvent.fid, custodyEvent2.fid], nextPageToken: undefined }));
  });

  test('returns pageSize results', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeIdRegistryEvent(custodyEvent2);
    const result = await client.getFids(protobufs.FidsRequest.create({ pageSize: 1 }));
    expect(result._unsafeUnwrap().fids).toEqual([custodyEvent.fid]);
  });

  test('returns all fids when pageSize > events', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeIdRegistryEvent(custodyEvent2);
    const result = await client.getFids(protobufs.FidsRequest.create({ pageSize: 3 }));
    expect(result._unsafeUnwrap().fids).toEqual([custodyEvent.fid, custodyEvent2.fid]);
  });

  test('returns results after pageToken', async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeIdRegistryEvent(custodyEvent2);
    const page1Result = await client.getFids(protobufs.FidsRequest.create({ pageSize: 1 }));
    const page2Result = await client.getFids(
      protobufs.FidsRequest.create({ pageSize: 1, pageToken: page1Result._unsafeUnwrap().nextPageToken })
    );
    expect(page2Result._unsafeUnwrap().fids).toEqual([custodyEvent2.fid]);
  });

  test('returns empty array without events', async () => {
    const result = await client.getFids(protobufs.FidsRequest.create());
    expect(result._unsafeUnwrap().fids).toEqual([]);
  });
});
