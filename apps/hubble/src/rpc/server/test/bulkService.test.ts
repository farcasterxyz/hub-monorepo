import * as protobufs from '@farcaster/protobufs';
import { Factories, getInsecureHubRpcClient, HubResult, HubRpcClient } from '@farcaster/utils';
import SyncEngine from '~/network/sync/syncEngine';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';

const db = jestRocksDB('protobufs.rpc.bulkService.test');
const network = protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET;
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
const custodySigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();

let custodyEvent: protobufs.IdRegistryEvent;
let signerAdd: protobufs.Message;

beforeAll(async () => {
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySigner.signerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerBody: { signer: signer.signerKey } } },
    { transient: { signer: custodySigner } }
  );
});

const assertMessagesMatchResult = (result: HubResult<protobufs.MessagesResponse>, messages: protobufs.Message[]) => {
  expect(result._unsafeUnwrap().messages.map((m) => protobufs.Message.toJSON(m))).toEqual(
    messages.map((m) => protobufs.Message.toJSON(m))
  );
};

describe('getAllCastMessagesByFid', () => {
  let castAdd: protobufs.CastAddMessage;
  let castRemove: protobufs.CastRemoveMessage;

  beforeAll(async () => {
    castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });

    castRemove = await Factories.CastRemoveMessage.create({ data: { fid, network } }, { transient: { signer } });
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(castAdd);
    await engine.mergeMessage(castRemove);
    const result = await client.getAllCastMessagesByFid(protobufs.FidRequest.create({ fid }));
    assertMessagesMatchResult(result, [castAdd, castRemove]);
  });

  test('returns empty array without messages', async () => {
    const result = await client.getAllCastMessagesByFid(protobufs.FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });
});

describe('getAllReactionMessagesByFid', () => {
  let reactionAdd: protobufs.ReactionAddMessage;
  let reactionRemove: protobufs.ReactionRemoveMessage;

  beforeAll(async () => {
    reactionAdd = await Factories.ReactionAddMessage.create({ data: { fid, network } }, { transient: { signer } });

    reactionRemove = await Factories.ReactionRemoveMessage.create(
      { data: { fid, network } },
      { transient: { signer } }
    );
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(reactionAdd);
    await engine.mergeMessage(reactionRemove);
    const result = await client.getAllReactionMessagesByFid(protobufs.FidRequest.create({ fid }));
    assertMessagesMatchResult(result, [reactionAdd, reactionRemove]);
  });

  test('returns empty array without messages', async () => {
    const result = await client.getAllReactionMessagesByFid(protobufs.FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });
});

describe('getAllVerificationMessagesByFid', () => {
  let verificationAdd: protobufs.VerificationAddEthAddressMessage;
  let verificationRemove: protobufs.VerificationRemoveMessage;

  beforeAll(async () => {
    verificationAdd = await Factories.VerificationAddEthAddressMessage.create(
      { data: { fid, network } },
      { transient: { signer } }
    );

    verificationRemove = await Factories.VerificationRemoveMessage.create(
      { data: { fid, network } },
      { transient: { signer } }
    );
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(verificationAdd);
    await engine.mergeMessage(verificationRemove);
    const result = await client.getAllVerificationMessagesByFid(protobufs.FidRequest.create({ fid }));
    assertMessagesMatchResult(result, [verificationAdd, verificationRemove]);
  });

  test('returns empty array without messages', async () => {
    const result = await client.getAllVerificationMessagesByFid(protobufs.FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });
});

describe('getAllSignerMessagesByFid', () => {
  let signerRemove: protobufs.SignerRemoveMessage;

  beforeAll(async () => {
    signerRemove = await Factories.SignerRemoveMessage.create(
      { data: { fid, network } },
      { transient: { signer: custodySigner } }
    );
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(signerRemove);
    const result = await client.getAllSignerMessagesByFid(protobufs.FidRequest.create({ fid }));
    assertMessagesMatchResult(result, [signerAdd, signerRemove]);
  });

  test('returns empty array without messages', async () => {
    const result = await client.getAllSignerMessagesByFid(protobufs.FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });
});

describe('getAllUserDataMessagesByFid', () => {
  let userDataAdd: protobufs.UserDataAddMessage;

  beforeAll(async () => {
    userDataAdd = await Factories.UserDataAddMessage.create(
      { data: { fid, network, userDataBody: { type: protobufs.UserDataType.USER_DATA_TYPE_BIO } } },
      { transient: { signer } }
    );
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(userDataAdd);
    const result = await client.getAllUserDataMessagesByFid(protobufs.FidRequest.create({ fid }));
    assertMessagesMatchResult(result, [userDataAdd]);
  });

  test('returns empty array without messages', async () => {
    const result = await client.getAllUserDataMessagesByFid(protobufs.FidRequest.create({ fid }));
    expect(result._unsafeUnwrap().messages.length).toEqual(0);
  });
});
