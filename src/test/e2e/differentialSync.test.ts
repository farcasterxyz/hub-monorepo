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
const hubAStorageEngine = new Engine(serverDb);
let hubASyncEngine: SyncEngine;

const clientDb = jestRocksDB('rpcSync.test.client');
const hubBStorageEngine = new Engine(clientDb);
let hubBSyncEngine: SyncEngine;

class mockRPCHandler implements RPCHandler {
  getUsers(): Promise<Set<number>> {
    return hubAStorageEngine.getUsers();
  }
  getAllCastsByUser(fid: number): Promise<Set<Cast>> {
    return hubAStorageEngine.getAllCastsByUser(fid);
  }
  getAllSignerMessagesByUser(fid: number): Promise<Set<SignerMessage>> {
    return hubAStorageEngine.getAllSignerMessagesByUser(fid);
  }
  getAllReactionsByUser(fid: number): Promise<Set<Reaction>> {
    return hubAStorageEngine.getAllReactionsByUser(fid);
  }
  getAllFollowsByUser(fid: number): Promise<Set<Follow>> {
    return hubAStorageEngine.getAllFollowsByUser(fid);
  }
  getAllVerificationsByUser(fid: number): Promise<Set<Verification>> {
    return hubAStorageEngine.getAllVerificationsByUser(fid);
  }
  getCustodyEventByUser(fid: number): Promise<Result<IdRegistryEvent, FarcasterError>> {
    return hubAStorageEngine.getCustodyEventByUser(fid);
  }
  getSyncMetadataByPrefix(prefix: string): Promise<Result<NodeMetadata, FarcasterError>> {
    const nodeMetadata = hubASyncEngine.getNodeMetadata(prefix);
    if (nodeMetadata) {
      return Promise.resolve(ok(nodeMetadata));
    } else {
      return Promise.resolve(err(new FarcasterError('no metadata found')));
    }
  }
  getSyncIdsByPrefix(prefix: string): Promise<Result<string[], FarcasterError>> {
    return Promise.resolve(ok(hubASyncEngine.getIdsByPrefix(prefix)));
  }
  getMessagesByHashes(hashes: string[]): Promise<Message[]> {
    return hubAStorageEngine.getMessagesByHashes(hashes);
  }
  async submitMessage(message: Message): Promise<Result<void, FarcasterError>> {
    return await hubAStorageEngine.mergeMessage(message);
  }
}

let hubARPCServer: RPCServer;
let hubARPCClient: RPCClient;

const NUM_USERS = 5;
const TEST_TIMEOUT = 2 * 60 * 1000; // 2 min timeout

describe('differentialSync', () => {
  let userInfos: UserInfo[];

  beforeEach(async () => {
    await hubAStorageEngine._reset();
    await hubBStorageEngine._reset();
    hubASyncEngine = new SyncEngine(hubAStorageEngine);
    hubBSyncEngine = new SyncEngine(hubBStorageEngine);
    // setup the rpc server and client
    hubARPCServer = new RPCServer(new mockRPCHandler());
    await hubARPCServer.start();
    expect(hubARPCServer.address).not.toBeNull();

    hubARPCClient = new RPCClient(hubARPCServer.address as AddressInfo);

    // TODO: Ignore reactions until https://github.com/farcasterxyz/hub/issues/178 is fixed
    userInfos = await populateEngine(hubAStorageEngine, NUM_USERS, {
      Verifications: 1,
      Casts: 10,
      Follows: 50,
      Reactions: 0,
    });
  }, TEST_TIMEOUT);

  afterEach(async () => {
    await hubARPCServer.stop();
  });

  const ensureEnginesEqual = async () => {
    const userIds = await hubAStorageEngine.getUsers();
    await expect(hubBStorageEngine.getUsers()).resolves.toEqual(userIds);

    // If the root hash of the sync engines match, then all the child nodes should match
    expect(hubASyncEngine.trie.items).toEqual(hubBSyncEngine.trie.items);
    expect(hubASyncEngine.trie.rootHash).toEqual(hubBSyncEngine.trie.rootHash);

    for (const user of userIds) {
      const casts = await hubAStorageEngine.getAllCastsByUser(user);
      await expect(hubBStorageEngine.getAllCastsByUser(user)).resolves.toEqual(casts);
      const follows = await hubAStorageEngine.getAllFollowsByUser(user);
      await expect(hubBStorageEngine.getAllFollowsByUser(user)).resolves.toEqual(follows);
      const reactions = await hubAStorageEngine.getAllReactionsByUser(user);
      await expect(hubBStorageEngine.getAllReactionsByUser(user)).resolves.toEqual(reactions);
      const verifications = await hubAStorageEngine.getAllVerificationsByUser(user);
      await expect(hubBStorageEngine.getAllVerificationsByUser(user)).resolves.toEqual(verifications);
    }
  };

  test(
    'syncs data to a completely empty client',
    async () => {
      const users = await hubAStorageEngine.getUsers();
      expect(users.size).toEqual(NUM_USERS);
      expect(await hubBStorageEngine.getUsers()).toEqual(new Set());

      const snapshot = hubASyncEngine.snapshot;
      expect(hubBSyncEngine.shouldSync(snapshot.excludedHashes, snapshot.numMessages)).toBeTruthy();
      await hubBSyncEngine.performSync(snapshot.excludedHashes, hubARPCClient);
      await ensureEnginesEqual();
      expect(hubBSyncEngine.shouldSync(snapshot.excludedHashes, snapshot.numMessages)).toBeFalsy();
    },
    TEST_TIMEOUT
  );

  test(
    'syncs only new data to a client with existing data',
    async () => {
      await hubBSyncEngine.performSync(hubASyncEngine.snapshot.excludedHashes, hubARPCClient);
      const mergedHashes: string[] = [];
      hubBStorageEngine.on('messageMerged', async (_fid, _type, message: Message) => {
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
      const res = await Promise.all(hubAStorageEngine.mergeMessages(messages));
      expect(res.every((r) => r.isOk())).toBeTruthy();

      const serverSnapshot = hubASyncEngine.snapshot;
      expect(serverSnapshot.numMessages).toEqual(hubBSyncEngine.snapshot.numMessages + newMessages);
      expect(hubBSyncEngine.shouldSync(serverSnapshot.excludedHashes, serverSnapshot.numMessages)).toBeTruthy();

      const divergencePrefix = hubBSyncEngine.trie.getDivergencePrefix(
        hubBSyncEngine.snapshot.prefix,
        serverSnapshot.excludedHashes
      );
      // The point of divergence should be some distance from the root, and must have fewer messages than the root
      expect(divergencePrefix.length).toBeGreaterThanOrEqual(3);
      const serverDivergedNodeMetadata = hubASyncEngine.trie.getNodeMetadata(divergencePrefix);
      expect(serverDivergedNodeMetadata).toBeDefined();
      expect(serverDivergedNodeMetadata?.numMessages).toBeLessThanOrEqual(hubASyncEngine.trie.root.items);

      await hubBSyncEngine.performSync(serverSnapshot.excludedHashes, hubARPCClient);

      await ensureEnginesEqual();
      for (const message of messages) {
        expect(mergedHashes).toContain(message.hash);
      }
      // In the worst case, the maximum number of messages merged should be the number of items under the divergence prefix
      expect(mergedHashes.length).toBeLessThanOrEqual(serverDivergedNodeMetadata?.numMessages || -1);
      // Ideally the merged hashes length should be exactly equal to the new messages,
      // but, depending on the location of divergence, it's possible that some existing messages are syncd
      // So just ensure it's below some reasonable threshold
      expect(mergedHashes.length).toBeLessThanOrEqual(100);
    },
    TEST_TIMEOUT
  );
});
