import { faker } from '@faker-js/faker';
import { AddressInfo } from 'net';
import { generateUserInfo, getIdRegistryEvent, getSignerAdd, mockFid, populateEngine } from '~/storage/engine/mock';
import { Factories } from '~/test/factories';
import { Hub, HubOptions } from '~/hub';
import { RPCClient } from '~/network/rpc';
import { sleep } from '~/utils/crypto';
import { ContactInfoContent, Content, GossipMessage, NETWORK_TOPIC_PRIMARY } from '~/network/p2p/protocol';
import { Message } from '~/types';
import { ServerError } from '~/utils/errors';
import { jest } from '@jest/globals';

const TEST_TIMEOUT_SHORT = 10 * 1000;
const TEST_TIMEOUT_LONG = 2 * 60 * 1000;
const opts: HubOptions = { simpleSync: false };

let hub: Hub;

const compareHubs = async (sourceHub: Hub, compareHub: Hub) => {
  // Check that the hubs have synchronized
  const userIds = await sourceHub.getUsers();
  await expect(compareHub.getUsers()).resolves.toEqual(userIds);

  const sourceTrie = sourceHub.merkleTrieForTest;
  const compareTrie = compareHub.merkleTrieForTest;
  expect(sourceTrie.items).toEqual(compareTrie.items);
  expect(sourceTrie.rootHash).toEqual(compareTrie.rootHash);

  for (const user of userIds) {
    const casts = await sourceHub.getAllCastsByUser(user);
    await expect(compareHub.getAllCastsByUser(user)).resolves.toEqual(casts);
    const follows = await sourceHub.getAllFollowsByUser(user);
    await expect(compareHub.getAllFollowsByUser(user)).resolves.toEqual(follows);
    // TODO: Verifications don't match for some reason right now. Figure out why
    // const reactions = await sourceHub.getAllReactionsByUser(user);
    // await expect(compareHub.getAllReactionsByUser(user)).resolves.toEqual(reactions);
    const verifications = await sourceHub.getAllVerificationsByUser(user);
    await expect(compareHub.getAllVerificationsByUser(user)).resolves.toEqual(verifications);
  }
};

const tearDownHub = async (hub: Hub) => {
  await hub.stop();
  await hub.destroyDB();
};

describe('Hub running tests', () => {
  beforeEach(async () => {
    hub = new Hub(opts);
    await hub.start();
    await sleep(1_000);
  });

  afterEach(async () => {
    await tearDownHub(hub);
  });

  test('run a Hub and send it a message', async () => {
    expect(hub.rpcAddress).toBeTruthy();

    const rpcClient = new RPCClient(hub.rpcAddress as AddressInfo);

    // simulate custody events for alice
    const aliceFid = faker.datatype.number();
    const aliceInfo = await mockFid(hub.engine, aliceFid);
    const cast = await Factories.CastShort.create(
      { data: { fid: aliceFid } },
      { transient: { signer: aliceInfo.delegateSigner } }
    );

    // send a message via RPC to the Hub
    const result = await rpcClient.submitMessage(cast);
    expect(result.isOk()).toBeTruthy();
    await sleep(1_000);
    await expect(hub.engine.getAllCastsByUser(aliceFid)).resolves.toEqual(new Set([cast]));
  });

  test(
    'bootstrap one Hub off of another',
    async () => {
      // populate Hub1's engine
      await populateEngine(hub.engine, 5);

      // bootstrap hub2 off of hub1
      expect(hub.gossipAddresses);
      // need a better way to pick one of the multiaddrs
      const secondHub = new Hub({ bootstrapAddrs: [hub.gossipAddresses[0]] });
      expect(secondHub).toBeDefined();
      // Use a flag to help clean up if the test fails at any point
      let shouldStop = true;
      try {
        await secondHub.start();
        // wait until sync completes
        await new Promise((resolve) => {
          secondHub.addListener('syncComplete', (_) => {
            resolve(undefined);
          });
        });
        await compareHubs(hub, secondHub);
        await tearDownHub(secondHub);
        shouldStop = false;
      } finally {
        if (shouldStop) await secondHub.stop();
      }
    },
    TEST_TIMEOUT_LONG
  );

  const testMessage = async (message: Message) => {
    const gossipMessage: GossipMessage<Content> = {
      content: {
        message,
      },
      topics: [NETWORK_TOPIC_PRIMARY],
    };
    const result = await hub.handleGossipMessage(gossipMessage);
    expect(result.isOk()).toBeTruthy();
  };

  test('hub handles various valid gossip messages', async () => {
    const aliceFid = faker.datatype.number();
    const aliceInfo = await generateUserInfo(aliceFid);
    const IdRegistryEvent: GossipMessage<Content> = {
      content: {
        message: await getIdRegistryEvent(aliceInfo),
      },
      topics: [NETWORK_TOPIC_PRIMARY],
    };
    const idRegistryResult = await hub.handleGossipMessage(IdRegistryEvent);
    expect(idRegistryResult.isOk());

    await testMessage(await getSignerAdd(aliceInfo));
    await testMessage(await getSignerAdd(aliceInfo));
    await testMessage(
      await Factories.CastShort.create({ data: { fid: aliceFid } }, { transient: { signer: aliceInfo.delegateSigner } })
    );
    await testMessage(
      await Factories.FollowAdd.create({ data: { fid: aliceFid } }, { transient: { signer: aliceInfo.delegateSigner } })
    );
    await testMessage(
      await Factories.ReactionAdd.create(
        { data: { fid: aliceFid } },
        { transient: { signer: aliceInfo.delegateSigner } }
      )
    );
  });

  test('invalid messages fail', async () => {
    const badMessage = {
      content: {
        not: '',
        a: 0,
        message: {},
      },
    };
    const result = await hub.handleGossipMessage(badMessage as any as GossipMessage);
    expect(result.isErr());
  });

  test('fail to submit invalid messages', async () => {
    // try to send it a message
    const submitResult = hub.submitMessage(await Factories.CastShort.create());
    expect((await submitResult).isErr()).toBeTruthy();
  });
});

describe('Hub negative tests', () => {
  test('Poke a hub before starting it', async () => {
    hub = new Hub(opts);

    expect(hub.rpcAddress).toBeUndefined();
    expect(hub.gossipAddresses).toEqual([]);
    expect(() => {
      hub.identity;
    }).toThrow(ServerError);
  });

  test('Fail to sync from invalid peers', async () => {
    hub = new Hub({});
    await hub.start();

    const syncHandler = jest.fn((success: boolean) => {
      expect(success).toBeFalsy();
    });

    hub.addListener('syncComplete', syncHandler);

    const badPeerInfo: ContactInfoContent = {
      peerId: '',
      excludedHashes: [],
      count: 0,
    };
    // fails because this peerinfo has no RPC to sync from
    hub.simpleSyncFromPeer(badPeerInfo);
    badPeerInfo.rpcAddress = { address: '', port: 0, family: 'ip4' };
    // fails because hub has no peers (despite this peerInfo having an rpc address)
    hub.simpleSyncFromPeer(badPeerInfo);

    expect(syncHandler).toBeCalledTimes(2);

    await hub.stop();
    await hub.destroyDB();
  });

  test(
    'starts with "resetDB" set',
    async () => {
      const rocksDBName = 'rocks.clearOnBootTest.testdb';
      hub = new Hub({ ...opts, resetDB: true, rocksDBName });
      await hub.start();

      // add some data to the engine and by extension, the DB
      await populateEngine(hub.engine, 1);
      const fids = await hub.getUsers();
      expect(fids.size).toBe(1);
      await hub.stop();

      // recreate a Hub with the same DB but without resetting and check that the data is still there
      hub = new Hub({ ...opts, resetDB: false, rocksDBName });
      await hub.start();
      // check that the data is preserved
      await expect(hub.getUsers()).resolves.toEqual(fids);
      await hub.stop();

      // start the hub again but without reset set
      hub = new Hub({ ...opts, resetDB: true, rocksDBName });
      await hub.start();
      expect(hub.rpcAddress).toBeDefined();
      expect(() => {
        hub.identity;
      }).not.toThrow();

      await expect(hub.getUsers()).resolves.toEqual(new Set([]));

      await hub.stop();
      hub.destroyDB();
    },
    TEST_TIMEOUT_SHORT
  );
});
