import { AddressInfo } from 'net';
import { err, ok, Result } from 'neverthrow';
import { RPCClient, RPCHandler, RPCServer } from '~/network/rpc/json';
import { NodeMetadata } from '~/network/sync/merkleTrie';
import { SyncEngine } from '~/network/sync/syncEngine';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { populateEngine, UserInfo } from '~/storage/engine/mock';
import { Factories } from '~/test/factories';
import { Cast, Follow, IdRegistryEvent, Message, Reaction, SignerMessage, Verification } from '~/types';
import { sleep } from '~/utils/crypto';
import { FarcasterError } from '~/utils/errors';

const serverDb = jestRocksDB('rpcSync.test.server');
let hubAStorageEngine: Engine;
let hubASyncEngine: SyncEngine;

const clientDb = jestRocksDB('rpcSync.test.client');
let hubBStorageEngine: Engine;
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
    const nodeMetadata = hubASyncEngine.getTrieNodeMetadata(prefix);
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
  let firstUserInfo: UserInfo;

  beforeEach(async () => {
    await serverDb.clear();
    await clientDb.clear();
    hubAStorageEngine = new Engine(serverDb);
    hubBStorageEngine = new Engine(clientDb);
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
    firstUserInfo = userInfos[0] as UserInfo;
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
    const snapshot = hubASyncEngine.snapshot;
    expect(hubBSyncEngine.shouldSync(snapshot.excludedHashes)).toBeFalsy();

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
      expect(hubBSyncEngine.shouldSync(snapshot.excludedHashes)).toBeTruthy();
      await hubBSyncEngine.performSync(snapshot.excludedHashes, hubARPCClient);
      await ensureEnginesEqual();
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
        { data: { fid: firstUserInfo.fid } },
        {
          transient: {
            signer: firstUserInfo.delegateSigner,
            minDate: new Date(now - 1000 * 100), // Between 100-50 seconds ago
            maxDate: new Date(now - 1000 * 50),
          },
        }
      );
      const res = await Promise.all(hubAStorageEngine.mergeMessages(messages));
      expect(res.every((r) => r.isOk())).toBeTruthy();

      const serverSnapshot = hubASyncEngine.snapshot;
      expect(serverSnapshot.numMessages).toEqual(hubBSyncEngine.snapshot.numMessages + newMessages);
      expect(hubBSyncEngine.shouldSync(serverSnapshot.excludedHashes)).toBeTruthy();

      const divergencePrefix = hubBSyncEngine.trie.getDivergencePrefix(
        hubBSyncEngine.snapshot.prefix,
        serverSnapshot.excludedHashes
      );
      // The point of divergence should be some distance from the root, and must have fewer messages than the root
      expect(divergencePrefix.length).toBeGreaterThanOrEqual(3);
      const serverDivergedNodeMetadata = hubASyncEngine.trie.getTrieNodeMetadata(divergencePrefix);
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

  test(
    'sync handles removed messages',
    async () => {
      await hubBSyncEngine.performSync(hubASyncEngine.snapshot.excludedHashes, hubARPCClient);

      // Remove a user's messages
      const now = Date.now();
      const message = await Factories.SignerRemove.create(
        { data: { fid: firstUserInfo.fid, body: { delegate: firstUserInfo.delegateSigner.signerKey } } },
        {
          transient: {
            signer: firstUserInfo.ethereumSigner,
            minDate: new Date(now - 1000 * 100), // Between 100-50 seconds ago (before sync threshold)
            maxDate: new Date(now - 1000 * 50),
          },
        }
      );
      const res = await hubAStorageEngine.mergeMessage(message);
      expect(res.isOk()).toBeTruthy();

      const serverSnapshot = hubASyncEngine.snapshot;
      expect(hubBSyncEngine.shouldSync(serverSnapshot.excludedHashes)).toBeTruthy();

      await hubBSyncEngine.performSync(serverSnapshot.excludedHashes, hubARPCClient);
      // Wait a few seconds for the remove to delete all messages
      await sleep(2_000);

      await ensureEnginesEqual();
    },
    TEST_TIMEOUT
  );

  test(
    'sync converges even if signer removal is not within sync threshold',
    async () => {
      await hubBSyncEngine.performSync(hubASyncEngine.snapshot.excludedHashes, hubARPCClient);

      // Merge a signer remove within sync threshold (should not be picked up for sync)
      const now = Date.now();
      const message = await Factories.SignerRemove.create(
        { data: { fid: firstUserInfo.fid, body: { delegate: firstUserInfo.delegateSigner.signerKey }, signedAt: now } },
        { transient: { signer: firstUserInfo.ethereumSigner } }
      );
      const res = await hubAStorageEngine.mergeMessage(message);
      expect(res.isOk()).toBeTruthy();

      const serverSnapshot = hubASyncEngine.snapshot;
      expect(hubASyncEngine.snapshotTimestamp).toBeLessThanOrEqual(now / 1000);
      expect(hubBSyncEngine.shouldSync(serverSnapshot.excludedHashes)).toBeTruthy();

      await hubBSyncEngine.performSync(serverSnapshot.excludedHashes, hubARPCClient);
      // Wait a few seconds for the remove to delete all messages
      await sleep(2_000);
      await ensureEnginesEqual();
    },
    TEST_TIMEOUT
  );

  test(
    'syncing an empty client with a hub that has removed messages converges',
    async () => {
      const now = Date.now();
      const signerRemove = await Factories.SignerRemove.create(
        { data: { fid: firstUserInfo.fid, body: { delegate: firstUserInfo.delegateSigner.signerKey } } },
        {
          transient: {
            signer: firstUserInfo.ethereumSigner,
            minDate: new Date(now - 1000 * 100), // Between 100-50 seconds ago
            maxDate: new Date(now - 1000 * 50),
          },
        }
      );
      const res = await hubAStorageEngine.mergeMessage(signerRemove);
      expect(res.isOk()).toBeTruthy();

      await hubBSyncEngine.performSync(hubASyncEngine.snapshot.excludedHashes, hubARPCClient);

      await ensureEnginesEqual();
    },
    TEST_TIMEOUT
  );
});
