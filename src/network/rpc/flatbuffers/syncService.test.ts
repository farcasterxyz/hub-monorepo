import Server from '~/network/rpc/flatbuffers/server';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import Client from '~/network/rpc/flatbuffers/client';
import MessageModel from '~/storage/flatbuffers/messageModel';
import Factories from '~/test/factories/flatbuffer';
import Engine from '~/storage/engine/flatbuffers';
import {
  CastAddModel,
  CastRemoveModel,
  AmpAddModel,
  AmpRemoveModel,
  ReactionAddModel,
  ReactionRemoveModel,
  SignerAddModel,
  SignerRemoveModel,
  UserDataAddModel,
  VerificationAddEthAddressModel,
  VerificationRemoveModel,
} from '~/storage/flatbuffers/types';
import { Wallet, utils } from 'ethers';
import { generateEd25519KeyPair } from '~/utils/crypto';
import IdRegistryEventModel from '~/storage/flatbuffers/idRegistryEventModel';
import { KeyPair } from '~/types';
import { HubResult } from '~/utils/hubErrors';

const db = jestBinaryRocksDB('flatbuffers.rpc.syncService.test');
const engine = new Engine(db);

let server: Server;
let client: Client;

beforeAll(async () => {
  server = new Server(engine);
  const port = await server.start();
  client = new Client(port);
});

afterAll(async () => {
  client.close();
  await server.stop();
});

const fid = Factories.FID.build();
const wallet = new Wallet(utils.randomBytes(32));
let custodyEvent: IdRegistryEventModel;
let signer: KeyPair;
let signerAdd: SignerAddModel;

beforeAll(async () => {
  custodyEvent = new IdRegistryEventModel(
    await Factories.IdRegistryEvent.create(
      { to: Array.from(utils.arrayify(wallet.address)), fid: Array.from(fid) },
      { transient: { wallet } }
    )
  );

  signer = await generateEd25519KeyPair();
  const signerAddData = await Factories.SignerAddData.create({
    body: Factories.SignerBody.build({ signer: Array.from(signer.publicKey) }),
    fid: Array.from(fid),
  });
  signerAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { wallet } })
  ) as SignerAddModel;
});

const assertMessagesMatchResult = (result: HubResult<MessageModel[]>, messages: MessageModel[]) => {
  expect(new Set(result._unsafeUnwrap().map((msg) => msg.hash()))).toEqual(new Set(messages.map((msg) => msg.hash())));
};

describe('getAllCastMessagesByFid', () => {
  let castAdd: CastAddModel;
  let castRemove: CastRemoveModel;

  beforeAll(async () => {
    const castAddData = await Factories.CastAddData.create({
      fid: Array.from(fid),
    });
    castAdd = new MessageModel(
      await Factories.Message.create({ data: Array.from(castAddData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as CastAddModel;
    const castRemoveData = await Factories.CastRemoveData.create({ fid: Array.from(fid) });
    castRemove = new MessageModel(
      await Factories.Message.create({ data: Array.from(castRemoveData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as CastRemoveModel;
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(castAdd);
    await engine.mergeMessage(castRemove);
    const result = await client.getAllCastMessagesByFid(fid);
    assertMessagesMatchResult(result, [castAdd, castRemove]);
  });

  test('returns empty array without messages', async () => {
    const result = await client.getAllCastMessagesByFid(fid);
    expect(result._unsafeUnwrap()).toEqual([]);
  });
});

describe('getAllAmpMessagesByFid', () => {
  let ampAdd: AmpAddModel;
  let ampRemove: AmpRemoveModel;

  beforeAll(async () => {
    const ampAddData = await Factories.AmpAddData.create({
      fid: Array.from(fid),
    });
    ampAdd = new MessageModel(
      await Factories.Message.create({ data: Array.from(ampAddData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as AmpAddModel;
    const ampRemoveData = await Factories.AmpRemoveData.create({ fid: Array.from(fid) });
    ampRemove = new MessageModel(
      await Factories.Message.create({ data: Array.from(ampRemoveData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as AmpRemoveModel;
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(ampAdd);
    await engine.mergeMessage(ampRemove);
    const result = await client.getAllAmpMessagesByFid(fid);
    assertMessagesMatchResult(result, [ampAdd, ampRemove]);
  });

  test('returns empty array without messages', async () => {
    const result = await client.getAllAmpMessagesByFid(fid);
    expect(result._unsafeUnwrap()).toEqual([]);
  });
});

describe('getAllReactionMessagesByFid', () => {
  let reactionAdd: ReactionAddModel;
  let reactionRemove: ReactionRemoveModel;

  beforeAll(async () => {
    const reactionAddData = await Factories.ReactionAddData.create({
      fid: Array.from(fid),
    });
    reactionAdd = new MessageModel(
      await Factories.Message.create({ data: Array.from(reactionAddData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as ReactionAddModel;
    const reactionRemoveData = await Factories.ReactionRemoveData.create({ fid: Array.from(fid) });
    reactionRemove = new MessageModel(
      await Factories.Message.create(
        { data: Array.from(reactionRemoveData.bb?.bytes() ?? []) },
        { transient: { signer } }
      )
    ) as ReactionRemoveModel;
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(reactionAdd);
    await engine.mergeMessage(reactionRemove);
    const result = await client.getAllReactionMessagesByFid(fid);
    assertMessagesMatchResult(result, [reactionAdd, reactionRemove]);
  });

  test('returns empty array without messages', async () => {
    const result = await client.getAllReactionMessagesByFid(fid);
    expect(result._unsafeUnwrap()).toEqual([]);
  });
});

describe('getAllVerificationMessagesByFid', () => {
  let verificationAdd: VerificationAddEthAddressModel;
  let verificationRemove: VerificationRemoveModel;

  beforeAll(async () => {
    const verificationAddBody = await Factories.VerificationAddEthAddressBody.create({}, { transient: { fid } });
    const verificationAddData = await Factories.VerificationAddEthAddressData.create({
      fid: Array.from(fid),
      body: verificationAddBody.unpack(),
    });
    verificationAdd = new MessageModel(
      await Factories.Message.create(
        { data: Array.from(verificationAddData.bb?.bytes() ?? []) },
        { transient: { signer } }
      )
    ) as VerificationAddEthAddressModel;
    const verificationRemoveData = await Factories.VerificationRemoveData.create({ fid: Array.from(fid) });
    verificationRemove = new MessageModel(
      await Factories.Message.create(
        { data: Array.from(verificationRemoveData.bb?.bytes() ?? []) },
        { transient: { signer } }
      )
    ) as VerificationRemoveModel;
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(verificationAdd);
    await engine.mergeMessage(verificationRemove);
    const result = await client.getAllVerificationMessagesByFid(fid);
    assertMessagesMatchResult(result, [verificationAdd, verificationRemove]);
  });

  test('returns empty array without messages', async () => {
    const result = await client.getAllVerificationMessagesByFid(fid);
    expect(result._unsafeUnwrap()).toEqual([]);
  });
});

describe('getAllSignerMessagesByFid', () => {
  let signerRemove: SignerRemoveModel;

  beforeAll(async () => {
    const signerRemoveData = await Factories.SignerRemoveData.create({ fid: Array.from(fid) });
    signerRemove = new MessageModel(
      await Factories.Message.create(
        { data: Array.from(signerRemoveData.bb?.bytes() ?? []) },
        { transient: { wallet } }
      )
    ) as SignerRemoveModel;
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(signerAdd);
    await engine.mergeMessage(signerRemove);
    const result = await client.getAllSignerMessagesByFid(fid);
    assertMessagesMatchResult(result, [signerAdd, signerRemove]);
  });

  test('returns empty array without messages', async () => {
    const result = await client.getAllSignerMessagesByFid(fid);
    expect(result._unsafeUnwrap()).toEqual([]);
  });
});

describe('getAllUserDataMessagesByFid', () => {
  let userDataAdd: UserDataAddModel;

  beforeAll(async () => {
    const userDataAddData = await Factories.UserDataAddData.create({
      fid: Array.from(fid),
    });
    userDataAdd = new MessageModel(
      await Factories.Message.create({ data: Array.from(userDataAddData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as UserDataAddModel;
  });

  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  test('succeeds', async () => {
    await engine.mergeMessage(userDataAdd);
    const result = await client.getAllUserDataMessagesByFid(fid);
    assertMessagesMatchResult(result, [userDataAdd]);
  });

  test('returns empty array without messages', async () => {
    const result = await client.getAllUserDataMessagesByFid(fid);
    expect(result._unsafeUnwrap()).toEqual([]);
  });
});
