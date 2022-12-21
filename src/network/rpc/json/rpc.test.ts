import { AddressInfo } from 'net';
import * as types from '~/types';
import { Factories } from '~/test/factories';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils/crypto';
import { RPCServer, RPCClient, RPCHandler } from '~/network/rpc/json';
import Engine from '~/storage/engine';
import { faker } from '@faker-js/faker';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { FarcasterError } from '~/utils/errors';
import { err, ok, Result } from 'neverthrow';
import { multiaddr } from '@multiformats/multiaddr';
import { SyncEngine } from '~/network/sync/syncEngine';
import { SyncId } from '~/network/sync/syncId';
import { NodeMetadata } from '~/network/sync/merkleTrie';

const aliceFid = faker.datatype.number();
const testDb = jestRocksDB('rpc.test');

let engine: Engine;
let aliceCustodySigner: types.EthereumSigner;
let aliceCustodyRegister: types.IdRegistryEvent;
let aliceDelegateSigner: types.MessageSigner;
let syncEngine: SyncEngine;

let cast: types.CastShort;
let castRemove: types.CastRemove;
let reaction: types.ReactionAdd;
let reactionRemove: types.ReactionRemove;
let follow: types.FollowAdd;
let followRemove: types.FollowRemove;
let verification: types.VerificationEthereumAddress;
let verificationRemove: types.VerificationRemove;
let addDelegateSigner: types.SignerAdd;

let server: RPCServer;
let client: RPCClient;

const TEST_TIMEOUT_SHORT = 10_000;

class mockRPCHandler implements RPCHandler {
  getUsers(): Promise<Set<number>> {
    return engine.getUsers();
  }
  getAllCastsByUser(fid: number): Promise<Set<types.Cast>> {
    return engine.getAllCastsByUser(fid);
  }
  getAllSignerMessagesByUser(fid: number): Promise<Set<types.SignerMessage>> {
    return engine.getAllSignerMessagesByUser(fid);
  }
  getAllReactionsByUser(fid: number): Promise<Set<types.Reaction>> {
    return engine.getAllReactionsByUser(fid);
  }
  getAllFollowsByUser(fid: number): Promise<Set<types.Follow>> {
    return engine.getAllFollowsByUser(fid);
  }
  getAllVerificationsByUser(fid: number): Promise<Set<types.Verification>> {
    return engine.getAllVerificationsByUser(fid);
  }
  getCustodyEventByUser(fid: number): Promise<Result<types.IdRegistryEvent, FarcasterError>> {
    return engine.getCustodyEventByUser(fid);
  }
  getSyncMetadataByPrefix(prefix: string): Promise<Result<NodeMetadata, FarcasterError>> {
    const nodeMetadata = syncEngine.getTrieNodeMetadata(prefix);
    if (nodeMetadata) {
      return Promise.resolve(ok(nodeMetadata));
    } else {
      return Promise.resolve(err(new FarcasterError('no metadata found')));
    }
  }
  getSyncIdsByPrefix(prefix: string): Promise<Result<string[], FarcasterError>> {
    return Promise.resolve(ok(syncEngine.getIdsByPrefix(prefix)));
  }
  getMessagesByHashes(hashes: string[]): Promise<types.Message[]> {
    return engine.getMessagesByHashes(hashes);
  }
  async submitMessage(message: types.Message): Promise<Result<void, FarcasterError>> {
    return await engine.mergeMessage(message);
  }
  async submitIdRegistryEvent(event: types.IdRegistryEvent): Promise<Result<void, FarcasterError>> {
    return await engine.mergeIdRegistryEvent(event);
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
    await testDb.clear();
    engine = new Engine(testDb);
    syncEngine = new SyncEngine(engine);
    await engine.mergeIdRegistryEvent(aliceCustodyRegister);
    await engine.mergeMessage(addDelegateSigner);
  });

  afterAll(async () => {
    await server.stop();
  });

  // TODO: review after GRPC refactor

  // test('returns not found error if there is no custody event', async () => {
  //   await engine._reset();
  //   const response = await client.getCustodyEventByUser(aliceFid);
  //   expect(response.isOk()).toBeFalsy();
  //   expect(response._unsafeUnwrapErr().code).toEqual(404);
  // });

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

    test('create a batch of new casts and send them over RPC', async () => {
      const casts = [];
      for (let i = 0; i < 5; i++) {
        casts.push(
          await Factories.CastShort.create({ data: { fid: aliceFid } }, { transient: { signer: aliceDelegateSigner } })
        );
      }
      const response = await client.submitMessages(casts);
      expect(response.every((r) => r.isOk())).toBeTruthy();
      const aliceCasts = await engine.getAllCastsByUser(aliceFid);
      expect(aliceCasts).toEqual(new Set([cast, ...casts, castRemove]));
    });

    test(
      'create a batch of IdRegistryEvents and send them over RPC',
      async () => {
        const events = [];

        for (let i = 0; i < 5; i++) {
          const signer = await generateEthereumSigner();
          events.push(
            await Factories.IdRegistryEvent.create({
              args: { to: signer.signerKey, id: faker.datatype.number() },
              name: 'Register',
            })
          );
        }
        const response = await client.submitMessages(events);
        expect(response.every((r) => r.isOk())).toBeTruthy();
      },
      TEST_TIMEOUT_SHORT
    );

    test('rejects an invalid cast', async () => {
      const castInvalidUser = await Factories.CastShort.create({ data: { fid: aliceFid + 1 } });
      const response = await client.submitMessage(castInvalidUser);
      expect(response.isErr()).toBeTruthy();
    });

    test('gets sync metadata by prefix', async () => {
      const syncId = new SyncId(cast);
      const response = await client.getSyncMetadataByPrefix(syncId.timestampString);
      expect(response.isOk()).toBeTruthy();
      expect(response._unsafeUnwrap().prefix).toEqual(syncId.timestampString);
      expect(response._unsafeUnwrap().numMessages).toBeGreaterThanOrEqual(1);
      expect(response._unsafeUnwrap().hash).toBeTruthy();

      const errorResponse = await client.getSyncMetadataByPrefix('non_existent_prefix');
      expect(errorResponse.isErr()).toBeTruthy();
    });

    test('gets all sync ids by prefix', async () => {
      const response = await client.getSyncIdsByPrefix('1');
      expect(response.isOk()).toBeTruthy();
      expect(response._unsafeUnwrap()).toHaveLength(syncEngine.trie.items);
    });

    test('get messages by hashes', async () => {
      const response = await client.getMessagesByHashes([cast.hash, follow.hash, 'non-existent-hash']);
      expect(response.isOk()).toBeTruthy();
      expect(response._unsafeUnwrap()).toHaveLength(2);
      expect(response._unsafeUnwrap()).toContainEqual(cast);
      expect(response._unsafeUnwrap()).toContainEqual(follow);
    });
  });
});
