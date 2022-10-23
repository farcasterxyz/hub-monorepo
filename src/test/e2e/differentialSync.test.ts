import { AddressInfo } from 'net';
import { RPCServer, RPCHandler, RPCClient } from '~/network/rpc';
import Engine from '~/storage/engine';
import { jestRocksDB } from '~/storage/db/jestUtils';
import { populateEngine, UserInfo } from '~/storage/engine/mock';
import { Cast, Follow, IdRegistryEvent, Message, Reaction, SignerMessage, Verification } from '~/types';
import { err, ok, Result } from 'neverthrow';
import { FarcasterError } from '~/utils/errors';
import { NodeMetadata } from '~/network/sync/merkleTrie';
import { SyncEngine } from '~/network/sync/syncEngine';
import { Factories } from '~/test/factories';

const serverDb = jestRocksDB('rpcSync.test.server');
const serverEngine = new Engine(serverDb);
let serverSyncEngine: SyncEngine;

const clientDb = jestRocksDB('rpcSync.test.client');
const clientEngine = new Engine(clientDb);
let clientSyncEngine: SyncEngine;

class mockRPCHandler implements RPCHandler {
  getUsers(): Promise<Set<number>> {
    return serverEngine.getUsers();
  }
  getAllCastsByUser(fid: number): Promise<Set<Cast>> {
    return serverEngine.getAllCastsByUser(fid);
  }
  getAllSignerMessagesByUser(fid: number): Promise<Set<SignerMessage>> {
    return serverEngine.getAllSignerMessagesByUser(fid);
  }
  getAllReactionsByUser(fid: number): Promise<Set<Reaction>> {
    return serverEngine.getAllReactionsByUser(fid);
  }
  getAllFollowsByUser(fid: number): Promise<Set<Follow>> {
    return serverEngine.getAllFollowsByUser(fid);
  }
  getAllVerificationsByUser(fid: number): Promise<Set<Verification>> {
    return serverEngine.getAllVerificationsByUser(fid);
  }
  getCustodyEventByUser(fid: number): Promise<Result<IdRegistryEvent, FarcasterError>> {
    return serverEngine.getCustodyEventByUser(fid);
  }
  getSyncMetadataByPrefix(prefix: string): Promise<Result<NodeMetadata, FarcasterError>> {
    const nodeMetadata = serverSyncEngine.getNodeMetadata(prefix);
    if (nodeMetadata) {
      return Promise.resolve(ok(nodeMetadata));
    } else {
      return Promise.resolve(err(new FarcasterError('no metadata found')));
    }
  }
  getSyncIdsByPrefix(prefix: string): Promise<Result<string[], FarcasterError>> {
    return Promise.resolve(ok(serverSyncEngine.getIdsByPrefix(prefix)));
  }
  getMessagesByHashes(hashes: string[]): Promise<Message[]> {
    return serverEngine.getMessagesByHashes(hashes);
  }
  async submitMessage(message: Message): Promise<Result<void, FarcasterError>> {
    return await serverEngine.mergeMessage(message);
  }
}

let server: RPCServer;
let client: RPCClient;

const NUM_USERS = 5;
const TEST_TIMEOUT = 2 * 60 * 1000; // 2 min timeout

describe('differentialSync', () => {
  let userInfos: UserInfo[];

  beforeEach(async () => {
    await serverEngine._reset();
    await clientEngine._reset();
    serverSyncEngine = new SyncEngine(serverEngine);
    clientSyncEngine = new SyncEngine(clientEngine);
    // setup the rpc server and client
    server = new RPCServer(new mockRPCHandler());
    await server.start();
    expect(server.address).not.toBeNull();

    client = new RPCClient(server.address as AddressInfo);

    // TODO: Ignore reactions until https://github.com/farcasterxyz/hub/issues/178 is fixed
    userInfos = await populateEngine(serverEngine, NUM_USERS, {
      Verifications: 1,
      Casts: 10,
      Follows: 50,
      Reactions: 0,
    });
  }, TEST_TIMEOUT);

  afterEach(async () => {
    await server.stop();
  });

  const ensureEnginesEqual = async () => {
    const userIds = await serverEngine.getUsers();
    await expect(clientEngine.getUsers()).resolves.toEqual(userIds);

    expect(serverSyncEngine.trie.items).toEqual(clientSyncEngine.trie.items);
    expect(serverSyncEngine.trie.rootHash).toEqual(clientSyncEngine.trie.rootHash);
    for (const user of userIds) {
      const casts = await serverEngine.getAllCastsByUser(user);
      await expect(clientEngine.getAllCastsByUser(user)).resolves.toEqual(casts);
      const follows = await serverEngine.getAllFollowsByUser(user);
      await expect(clientEngine.getAllFollowsByUser(user)).resolves.toEqual(follows);
      const reactions = await serverEngine.getAllReactionsByUser(user);
      await expect(clientEngine.getAllReactionsByUser(user)).resolves.toEqual(reactions);
      const verifications = await serverEngine.getAllVerificationsByUser(user);
      await expect(clientEngine.getAllVerificationsByUser(user)).resolves.toEqual(verifications);
    }
  };

  test(
    'syncs data to a completely empty client',
    async () => {
      // sanity test that the server has something in it and the client, nothing
      const users = await serverEngine.getUsers();
      expect(users.size).toEqual(NUM_USERS);
      expect(await clientEngine.getUsers()).toEqual(new Set());

      const snapshot = serverSyncEngine.snapshot;
      await clientSyncEngine.performSync(snapshot.excludedHashes, client);
      await ensureEnginesEqual();
      expect(clientSyncEngine.shouldSync(snapshot.excludedHashes, snapshot.numMessages)).toBeFalsy();
    },
    TEST_TIMEOUT
  );

  test(
    'syncs only new data to a client with existing data',
    async () => {
      await clientSyncEngine.performSync(serverSyncEngine.snapshot.excludedHashes, client);
      const mergedHashes: string[] = [];
      clientEngine.on('messageMerged', async (_fid, _type, message: Message) => {
        mergedHashes.push(message.hash);
      });

      // add new messages to the server and sync again
      const newMessages = 10;
      const now = Date.now();
      const messages = await Factories.CastShort.createList(
        newMessages,
        { data: { fid: userInfos[0].fid } },
        {
          transient: {
            signer: userInfos[0].delegateSigner,
            minDate: new Date(now - 1000 * 100), // Between 100-50 seconds ago
            maxDate: new Date(now - 1000 * 50),
          },
        }
      );
      const res = await Promise.all(serverEngine.mergeMessages(messages));
      expect(res.every((r) => r.isOk())).toBeTruthy();

      const serverSnapshot = serverSyncEngine.snapshot;
      expect(serverSnapshot.numMessages).toBeGreaterThanOrEqual(clientSyncEngine.snapshot.numMessages);
      expect(clientSyncEngine.shouldSync(serverSnapshot.excludedHashes, serverSnapshot.numMessages)).toBeTruthy();

      const divergencePrefix = clientSyncEngine.trie.getDivergencePrefix(
        clientSyncEngine.snapshot.prefix,
        serverSnapshot.excludedHashes
      );
      // The point of divergence should be some distance from the root, and must have few messages than the root
      expect(divergencePrefix.length).toBeGreaterThanOrEqual(3);
      const serverDivergedNode = serverSyncEngine.trie.getNodeMetadata(divergencePrefix);
      expect(serverDivergedNode).toBeDefined();
      expect(serverDivergedNode?.numMessages).toBeLessThanOrEqual(serverSyncEngine.trie.root.items);

      await clientSyncEngine.performSync(serverSnapshot.excludedHashes, client);

      await ensureEnginesEqual();
      for (const message of messages) {
        expect(mergedHashes).toContain(message.hash);
      }
      // In the worst case, the maximum number of messages merged should be the number of items under the divergence prefix
      expect(mergedHashes.length).toBeLessThanOrEqual(serverDivergedNode?.numMessages || -1);
      // Ideally the merged hashes length should be exactly equal to the new messages,
      // but, depending on the location of divergence, it's possible that some existing messages are syncd
      // So just ensure it's below some reasonable threshold
      expect(mergedHashes.length).toBeLessThanOrEqual(100);
    },
    TEST_TIMEOUT
  );
});
