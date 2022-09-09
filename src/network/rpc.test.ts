import { AddressInfo } from 'net';
import {
  CastRemove,
  CastShort,
  EthereumSigner,
  FollowAdd,
  FollowRemove,
  IDRegistryEvent,
  MessageSigner,
  ReactionAdd,
  ReactionRemove,
  SignerAdd,
  VerificationEthereumAddress,
  VerificationEthereumAddressClaim,
  VerificationRemove,
} from '~/types';
import { Factories } from '~/factories';
import { generateEd25519Signer, generateEthereumSigner, hashFCObject } from '~/utils';
import { RPCServer, RPCClient } from '~/network/rpc';
import Engine from '~/engine';
import Faker from 'faker';
import { Wallet } from 'ethers';

const aliceFid = Faker.datatype.number();

let engine: Engine;
let aliceCustodySigner: EthereumSigner;
let aliceCustodyRegister: IDRegistryEvent;
let aliceDelegateSigner: MessageSigner;
let aliceEthWallet: Wallet;
let aliceBlockHash: string;
let aliceClaimHash: string;
let aliceExternalSignature: string;
let cast: CastShort;
let castRemove: CastRemove;
let reaction: ReactionAdd;
let reactionRemove: ReactionRemove;
let follow: FollowAdd;
let followRemove: FollowRemove;
let verification: VerificationEthereumAddress;
let verificationRemove: VerificationRemove;
let addDelegateSigner: SignerAdd;

let server: RPCServer;
let client: RPCClient;

const populate = async (engine: Engine) => {
  const results = await Promise.all([
    engine.mergeMessage(cast),
    engine.mergeMessage(castRemove),
    engine.mergeMessage(reaction),
    engine.mergeMessage(reactionRemove),
    engine.mergeMessage(follow),
    engine.mergeMessage(followRemove),
    engine.mergeMessage(verification),
    engine.mergeMessage(verificationRemove),
  ]);
  results.forEach((value) => {
    expect(value.isOk()).toBeTruthy();
  });
};

describe('rpc', () => {
  beforeAll(async () => {
    // setup the rpc server and client
    engine = new Engine();
    server = new RPCServer(engine);
    await server.start();
    const address = server.address;
    expect(address).not.toBeNull();
    client = new RPCClient(server.address as AddressInfo);

    // setup alices prereqs
    aliceCustodySigner = await generateEthereumSigner();
    aliceCustodyRegister = await Factories.IDRegistryEvent.create({
      args: { to: aliceCustodySigner.signerKey, id: aliceFid },
      name: 'Register',
    });
    aliceDelegateSigner = await generateEd25519Signer();
    aliceEthWallet = Wallet.createRandom();
    aliceBlockHash = Faker.datatype.hexaDecimal(64).toLowerCase();
    const createParams = {
      data: { fid: aliceFid },
    };
    const createOptions = {
      transient: { signer: aliceDelegateSigner },
    };
    addDelegateSigner = await Factories.SignerAdd.create(createParams, {
      transient: { signer: aliceCustodySigner, delegateSigner: aliceDelegateSigner },
    });
    const verificationOptions = { transient: { signer: aliceDelegateSigner, ethWallet: aliceEthWallet } };
    // The remove messages are intentionally unrelated to their "add" counterparts so that each Set has
    // 1 add and 1 remove
    cast = await Factories.CastShort.create(createParams, createOptions);
    castRemove = await Factories.CastRemove.create(createParams, createOptions);
    reaction = await Factories.ReactionAdd.create(createParams, createOptions);
    reactionRemove = await Factories.ReactionRemove.create(createParams, createOptions);
    follow = await Factories.FollowAdd.create(createParams, createOptions);
    followRemove = await Factories.FollowRemove.create(
      { data: { fid: aliceFid, body: { targetUri: follow.data.body.targetUri + '1' } } },
      createOptions
    );

    const verificationClaim: VerificationEthereumAddressClaim = {
      fid: aliceFid,
      externalUri: Factories.EthereumAddressURL.build(undefined, {
        transient: { address: aliceEthWallet.address },
      }).toString(),
      blockHash: aliceBlockHash,
    };
    aliceClaimHash = await hashFCObject(verificationClaim);
    aliceExternalSignature = await aliceEthWallet.signMessage(aliceClaimHash);

    verification = await Factories.VerificationEthereumAddress.create(
      {
        data: {
          fid: aliceFid,
          body: {
            claimHash: aliceClaimHash,
            blockHash: aliceBlockHash,
            externalSignature: aliceExternalSignature,
          },
        },
      },
      verificationOptions
    );

    // intentionally unrelated remove message
    verificationRemove = await Factories.VerificationRemove.create(
      {
        data: {
          fid: aliceFid,
          signedAt: verification.data.signedAt + 1,
          body: { claimHash: verification.data.body.claimHash + 1 },
        },
      },
      verificationOptions
    );
  });

  beforeEach(async () => {
    engine._reset();
    await engine.mergeIDRegistryEvent(aliceCustodyRegister);
    await engine.mergeMessage(addDelegateSigner);
  });

  afterAll(async () => {
    await server.stop();
  });

  test('get all signers for FID', async () => {
    const response = await client.getAllSignerMessagesByUser(aliceFid);
    expect(response.isOk()).toBeTruthy();
    const aliceSignerMessages = response._unsafeUnwrap();
    expect(aliceSignerMessages).toEqual(new Set([addDelegateSigner]));
  });

  test('simple test for an empty set', async () => {
    const response = await client.getAllCastsByUser(aliceFid);
    expect(response.isOk()).toBeTruthy();
    expect(response._unsafeUnwrap()).toEqual(new Set([]));
  });

  test('get a cast set with adds and removes in it', async () => {
    await populate(engine);
    const response = await client.getAllCastsByUser(aliceFid);
    expect(response.isOk()).toBeTruthy();
    const set = new Set([cast, castRemove]);
    expect(response._unsafeUnwrap()).toEqual(set);
  });

  test('get all Fids', async () => {
    await populate(engine);
    const response = await client.getFids();
    expect(response.isOk()).toBeTruthy();
    expect(response._unsafeUnwrap()).toEqual(new Set([aliceFid]));
  });

  test('get all reactions for Fid', async () => {
    await populate(engine);
    const response = await client.getAllReactionsByUser(aliceFid);
    expect(response.isOk()).toBeTruthy();
    const aliceReactionMessages = response._unsafeUnwrap();
    expect(aliceReactionMessages).toEqual(new Set([reaction, reactionRemove]));
  });

  test('get all follows for Fid', async () => {
    await populate(engine);
    const response = await client.getAllFollowsByUser(aliceFid);
    expect(response.isOk()).toBeTruthy();
    const aliceFollowMessages = response._unsafeUnwrap();
    // Only the remove msg is sent back
    expect(aliceFollowMessages).toEqual(new Set([follow, followRemove]));
  });

  test('get all verifications for Fid', async () => {
    await populate(engine);
    const response = await client.getAllVerificationsByUser(aliceFid);
    expect(response.isOk()).toBeTruthy();
    const aliceVerificationMessages = response._unsafeUnwrap();
    // Only the remove msg is sent back
    expect(aliceVerificationMessages).toEqual(new Set([verification, verificationRemove]));
  });
});
