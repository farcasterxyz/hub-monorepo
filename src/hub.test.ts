import Faker from 'faker';
import { AddressInfo } from 'net';
import { generateUserInfo, getIDRegistryEvent, getSignerAdd, mockFid, populateEngine } from '~/engine/mock';
import { Factories } from '~/factories';
import { Hub, HubOpts } from '~/hub';
import { RPCClient } from '~/network/rpc';
import { sleep } from '~/utils';
import { Content, GossipMessage, NETWORK_TOPIC_PRIMARY } from '~/network/protocol';
import { Message } from '~/types';

const TEST_TIMEOUT = 2 * 60 * 1000;
const opts: HubOpts = { simpleSync: false };

let hub: Hub;

const compareHubs = async (sourceHub: Hub, compareHub: Hub) => {
  // Check that the hubs have synchronized
  const userIds = await sourceHub.getUsers();
  await expect(compareHub.getUsers()).resolves.toEqual(userIds);
  for (const user of userIds) {
    const casts = await sourceHub.getAllCastsByUser(user);
    await expect(compareHub.getAllCastsByUser(user)).resolves.toEqual(casts);
    const follows = await sourceHub.getAllFollowsByUser(user);
    await expect(compareHub.getAllFollowsByUser(user)).resolves.toEqual(follows);
    const reactions = await sourceHub.getAllReactionsByUser(user);
    await expect(compareHub.getAllReactionsByUser(user)).resolves.toEqual(reactions);
    const verifications = await sourceHub.getAllVerificationsByUser(user);
    await expect(compareHub.getAllVerificationsByUser(user)).resolves.toEqual(verifications);
  }
};

const tearDownHub = async (hub: Hub) => {
  await hub.stop();
  await hub.destroyDB();
};

describe('Hub tests', () => {
  beforeEach(async () => {
    hub = new Hub(opts);
    await hub.start();
    await sleep(1_000);
  });

  afterEach(async () => {
    await tearDownHub(hub);
  });

  test('Run a Hub and send it a message', async () => {
    expect(hub.rpcAddress).toBeTruthy();

    const rpcClient = new RPCClient(hub.rpcAddress as AddressInfo);

    // simulate custody events for alice
    const aliceFid = Faker.datatype.number();
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
    'Bootstrap one Hub off of another',
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
          secondHub.addListener('syncComplete', (success) => {
            expect(success).toBeTruthy();
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
    TEST_TIMEOUT
  );

  const testMessage = async (message: Message) => {
    const gossipMessage: GossipMessage<Content> = {
      content: {
        message,
        root: '',
        count: 0,
      },
      topics: [NETWORK_TOPIC_PRIMARY],
    };
    const result = await hub.handleGossipMessage(gossipMessage);
    expect(result.isOk()).toBeTruthy();
  };

  test('Hub handles various valid gossip messages', async () => {
    const aliceFid = Faker.datatype.number();
    const aliceInfo = await generateUserInfo(aliceFid);
    const IDRegistryEvent: GossipMessage<Content> = {
      content: {
        message: await getIDRegistryEvent(aliceInfo),
        root: '',
        count: 0,
      },
      topics: [NETWORK_TOPIC_PRIMARY],
    };
    const idRegistryResult = await hub.handleGossipMessage(IDRegistryEvent);
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

  test('Invalid messages fail', async () => {
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
});
