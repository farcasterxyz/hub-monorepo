import { AddressInfo } from 'net';
import {
  Cast,
  CastRemove,
  CastShort,
  EthereumSigner,
  Follow,
  FollowAdd,
  FollowRemove,
  IdRegistryEvent,
  Message,
  MessageSigner,
  Reaction,
  ReactionAdd,
  ReactionRemove,
  SignerAdd,
  SignerMessage,
  Verification,
  VerificationEthereumAddress,
  VerificationRemove,
} from '~/types';
import { Factories } from '~/test/factories';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils/crypto';
import { RPCServer, RPCClient, RPCHandler } from '~/network/rpc';
import Engine from '~/storage/engine';
import { faker } from '@faker-js/faker';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { FarcasterError } from '~/utils/errors';
import { Result } from 'neverthrow';
import { multiaddr } from '@multiformats/multiaddr';

const aliceFid = faker.datatype.number();
const testDb = jestRocksDB('rpc.test');
const engine = new Engine(testDb);

let aliceCustodySigner: EthereumSigner;
let aliceCustodyRegister: IdRegistryEvent;
let aliceDelegateSigner: MessageSigner;

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

class mockRPCHandler implements RPCHandler {
  getUsers(): Promise<Set<number>> {
    return engine.getUsers();
  }
  getAllCastsByUser(fid: number): Promise<Set<Cast>> {
    return engine.getAllCastsByUser(fid);
  }
  getAllSignerMessagesByUser(fid: number): Promise<Set<SignerMessage>> {
    return engine.getAllSignerMessagesByUser(fid);
  }
  getAllReactionsByUser(fid: number): Promise<Set<Reaction>> {
    return engine.getAllReactionsByUser(fid);
  }
  getAllFollowsByUser(fid: number): Promise<Set<Follow>> {
    return engine.getAllFollowsByUser(fid);
  }
  getAllVerificationsByUser(fid: number): Promise<Set<Verification>> {
    return engine.getAllVerificationsByUser(fid);
  }
  getCustodyEventByUser(fid: number): Promise<Result<IdRegistryEvent, FarcasterError>> {
    return engine.getCustodyEventByUser(fid);
  }
  async submitMessage(message: Message): Promise<Result<void, FarcasterError>> {
    return await engine.mergeMessage(message);
  }
}

const populate = async (engine: Engine) => {
  const results = await Promise.all(
    engine.mergeMessages([
      cast,
      castRemove,
      reaction,
      reactionRemove,
      follow,
      followRemove,
      verification,
      verificationRemove,
    ])
  );
  results.forEach((value) => {
    expect(value.isOk()).toBeTruthy();
  });
};

describe('rpc', () => {
  beforeAll(async () => {
    // setup the rpc server and client
    server = new RPCServer(new mockRPCHandler());
    await server.start();
    const address = server.address;
    expect(address).not.toBeNull();
    client = new RPCClient(server.address as AddressInfo);

    // setup alices prereqs
    aliceCustodySigner = await generateEthereumSigner();
    aliceCustodyRegister = await Factories.IdRegistryEvent.create({
      args: { to: aliceCustodySigner.signerKey, id: aliceFid },
      name: 'Register',
    });
    aliceDelegateSigner = await generateEd25519Signer();

    const createParams = { data: { fid: aliceFid } };
    const createOptions = { transient: { signer: aliceDelegateSigner } };

    addDelegateSigner = await Factories.SignerAdd.create(createParams, {
      transient: { signer: aliceCustodySigner, delegateSigner: aliceDelegateSigner },
    });

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
    verification = await Factories.VerificationEthereumAddress.create(createParams, createOptions);
    verificationRemove = await Factories.VerificationRemove.create(createParams, createOptions);
  });

  beforeEach(async () => {
    engine._reset();
    await engine.mergeIdRegistryEvent(aliceCustodyRegister);
    await engine.mergeMessage(addDelegateSigner);
  });

  afterAll(async () => {
    await server.stop();
  });

  test('returns not found error if there is no custody event', async () => {
    await engine._reset();
    const response = await client.getCustodyEventByUser(aliceFid);
    expect(response.isOk()).toBeFalsy();
    expect(response._unsafeUnwrapErr().code).toEqual(404);
  });

  test('get the custody event for an fid', async () => {
    const response = await client.getCustodyEventByUser(aliceFid);
    expect(response.isOk()).toBeTruthy();
    const custodyEvent = response._unsafeUnwrap();
    expect(custodyEvent).toEqual(aliceCustodyRegister);
  });

  test('get all signer messages for an fid', async () => {
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

  test('check which server the client is configured for', async () => {
    const serverAddr = client.serverMultiaddr;
    expect(serverAddr).toBeTruthy();
    const parsedAddr = multiaddr(serverAddr);
    expect(parsedAddr).toBeTruthy();
  });

  describe('test user generated content', () => {
    beforeEach(async () => {
      await populate(engine);
    });

    test('get a cast set with adds and removes in it', async () => {
      const response = await client.getAllCastsByUser(aliceFid);
      expect(response.isOk()).toBeTruthy();
      const set = new Set([cast, castRemove]);
      expect(response._unsafeUnwrap()).toEqual(set);
    });

    test('get all users', async () => {
      const response = await client.getUsers();
      expect(response.isOk()).toBeTruthy();
      expect(response._unsafeUnwrap()).toEqual(new Set([aliceFid]));
    });

    test('get all reactions for an fid', async () => {
      const response = await client.getAllReactionsByUser(aliceFid);
      expect(response.isOk()).toBeTruthy();
      const aliceReactionMessages = response._unsafeUnwrap();
      expect(aliceReactionMessages).toEqual(new Set([reaction, reactionRemove]));
    });

    test('get all follows for an fid', async () => {
      const response = await client.getAllFollowsByUser(aliceFid);
      expect(response.isOk()).toBeTruthy();
      const aliceFollowMessages = response._unsafeUnwrap();
      expect(aliceFollowMessages).toEqual(new Set([follow, followRemove]));
    });

    test('get all verifications for an fid', async () => {
      const response = await client.getAllVerificationsByUser(aliceFid);
      expect(response.isOk()).toBeTruthy();
      const aliceVerificationMessages = response._unsafeUnwrap();
      expect(aliceVerificationMessages).toEqual(new Set([verification, verificationRemove]));
    });

    test('create a new cast and send it over RPC', async () => {
      const cast2 = await Factories.CastShort.create(
        { data: { fid: aliceFid } },
        { transient: { signer: aliceDelegateSigner } }
      );
      const response = await client.submitMessage(cast2);
      expect(response.isOk()).toBeTruthy();
      const aliceCasts = await engine.getAllCastsByUser(aliceFid);
      expect(aliceCasts).toEqual(new Set([cast, cast2, castRemove]));
    });

    test('rejects an invalid cast', async () => {
      const castInvalidUser = await Factories.CastShort.create({ data: { fid: aliceFid + 1 } });
      const response = await client.submitMessage(castInvalidUser);
      expect(response.isErr()).toBeTruthy();
    });
  });
});
