import * as protobufs from '@farcaster/protobufs';
import { Factories, getHubRpcClient, HubRpcClient } from '@farcaster/utils';
import { multiaddr } from '@multiformats/multiaddr/';
import { GossipNode } from '~/network/p2p/gossipNode';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';
import SyncEngine from '../sync/syncEngine';

const TEST_TIMEOUT_SHORT = 10 * 1000;

describe('GossipNode', () => {
  test('start fails with invalid bootstrap addresses', async () => {
    const node = new GossipNode();
    const error = (await node.start([multiaddr()]))._unsafeUnwrapErr();
    expect(error.errCode).toEqual('unavailable');
    expect(error.message).toContain('could not connect to any bootstrap nodes');
    await node.stop();
  });

  test('start fails if IpMultiAddr has port or transport addrs', async () => {
    const node = new GossipNode();
    const options = { ipMultiAddr: '/ip4/127.0.0.1/tcp/8080' };
    const error = (await node.start([], options))._unsafeUnwrapErr();

    expect(error.errCode).toEqual('unavailable');
    expect(error.message).toMatch('unexpected multiaddr transport/port information');
    expect(node.isStarted()).toBeFalsy();
    await node.stop();
  });

  test('start fails if multiaddr format is invalid', async () => {
    const node = new GossipNode();
    // an IPv6 being supplied as an IPv4
    const options = { ipMultiAddr: '/ip4/2600:1700:6cf0:990:2052:a166:fb35:830a' };
    expect((await node.start([], options))._unsafeUnwrapErr().errCode).toEqual('unavailable');
    const error = (await node.start([], options))._unsafeUnwrapErr();

    expect(error.errCode).toEqual('unavailable');
    expect(error.message).toMatch('invalid multiaddr');
    expect(node.isStarted()).toBeFalsy();
    await node.stop();
  });

  test('connect fails with a node that has not started', async () => {
    const node = new GossipNode();
    await node.start([]);

    let result = await node.connectAddress(multiaddr());
    expect(result.isErr()).toBeTruthy();

    const offlineNode = new GossipNode();
    result = await node.connect(offlineNode);
    expect(result.isErr()).toBeTruthy();

    await node.stop();
  });

  test(
    'connect fails with a node that is not in the allow list',
    async () => {
      const node1 = new GossipNode();
      await node1.start([]);

      const node2 = new GossipNode();
      await node2.start([]);

      // node 3 has node 1 in its allow list, but not node 2
      const node3 = new GossipNode();

      if (node1.peerId) {
        await node3.start([], { allowedPeerIdStrs: [node1.peerId.toString()] });
      } else {
        throw Error('Node1 not started, no peerId found');
      }

      try {
        let dialResult = await node1.connect(node3);
        expect(dialResult.isOk()).toBeTruthy();

        dialResult = await node2.connect(node3);
        expect(dialResult.isErr()).toBeTruthy();

        dialResult = await node3.connect(node2);
        expect(dialResult.isErr()).toBeTruthy();
      } finally {
        await node1.stop();
        await node2.stop();
        await node3.stop();
      }
    },
    TEST_TIMEOUT_SHORT
  );

  describe('gossip messages', () => {
    const db = jestRocksDB('protobufs.rpc.gossipMessageTest.test');
    const network = protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET;
    const engine = new Engine(db, network);
    const hub = new MockHub(db, engine);

    const fid = Factories.Fid.build();
    const custodySigner = Factories.Eip712Signer.build();
    const signer = Factories.Ed25519Signer.build();

    let server: Server;
    let client: HubRpcClient;

    let custodyEvent: protobufs.IdRegistryEvent;
    let signerAdd: protobufs.Message;
    let castAdd: protobufs.Message;

    beforeAll(async () => {
      custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySigner.signerKey });

      signerAdd = await Factories.SignerAddMessage.create(
        { data: { fid, network, signerBody: { signer: signer.signerKey } } },
        { transient: { signer: custodySigner } }
      );

      castAdd = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
    });

    test('gossip messages only from rpc', async () => {
      let numMessagesGossiped = 0;
      const mockGossipNode = {
        gossipMessage: (_msg: protobufs.Message) => {
          numMessagesGossiped += 1;
        },
      } as unknown as GossipNode;

      server = new Server(hub, engine, new SyncEngine(engine, db), mockGossipNode);
      const port = await server.start();
      client = getHubRpcClient(`127.0.0.1:${port}`);

      await client.submitIdRegistryEvent(custodyEvent);

      // Messages from rpc are gossiped
      await client.submitMessage(signerAdd);
      await client.submitMessage(castAdd);

      expect(numMessagesGossiped).toEqual(2);

      // Directly merged messages don't gossip
      const castAdd2 = await Factories.CastAddMessage.create({ data: { fid, network } }, { transient: { signer } });
      await hub.submitMessage(castAdd2);
      expect(numMessagesGossiped).toEqual(2);

      client.$.close();
      await server.stop();
    });
  });
});
