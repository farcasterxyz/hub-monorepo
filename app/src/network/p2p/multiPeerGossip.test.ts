import { Factories } from '@hub/utils';
import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import { Multiaddr } from '@multiformats/multiaddr';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import { SignerAddModel } from '~/flatbuffers/models/types';
import { Hub } from '~/hub';
import HubRpcClient from '~/rpc/client';
import Engine from '~/storage/engine';
import { sleep } from '~/utils/crypto';

const TEST_TIMEOUT_LONG = 60 * 60 * 1000;
const PROPAGATION_DELAY = 3 * 1000; // between 2 and 3 full heartbeat ticks

const fid = Factories.FID.build();
const ethSigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();

let custodyEvent: IdRegistryEventModel;
let signerAdd: SignerAddModel;

beforeAll(async () => {
  custodyEvent = new IdRegistryEventModel(
    await Factories.IdRegistryEvent.create({ to: Array.from(ethSigner.signerKey), fid: Array.from(fid) })
  );

  const signerAddData = await Factories.SignerAddData.create({
    body: Factories.SignerBody.build({ signer: Array.from(signer.signerKey) }),
    fid: Array.from(fid),
  });
  signerAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { ethSigner } })
  ) as SignerAddModel;
});

describe('Multi peer gossip', () => {
  const getRootHashFromClient = async (client: HubRpcClient): Promise<string> => {
    return (await client.getSyncTrieNodeSnapshotByPrefix(''))._unsafeUnwrap().rootHash;
  };

  const addMessagesWithTimestamps = async (engine: Engine, timestamps: number[]) => {
    return await Promise.all(
      timestamps.map(async (t) => {
        const addData = await Factories.CastAddData.create({ fid: Array.from(fid), timestamp: t });
        const addMessage = await Factories.Message.create(
          { data: Array.from(addData.bb?.bytes() ?? []) },
          { transient: { signer } }
        );
        const addMessageModel = new MessageModel(addMessage);

        const result = await engine.mergeMessage(addMessageModel);
        expect(result.isOk()).toBeTruthy();
        return Promise.resolve(addMessageModel);
      })
    );
  };

  // Engine 1 is where we add events, and see if engine 2 will sync them
  let peerId1, peerId2;
  let hub1: Hub;
  let hub2: Hub;

  let clientForServer1: HubRpcClient;
  let clientForServer2: HubRpcClient;

  beforeEach(async () => {
    peerId1 = await createEd25519PeerId();
    peerId2 = await createEd25519PeerId();

    const hubOptions1 = {
      peerId: peerId1,
      localIpAddrsOnly: true,
    };

    hub1 = new Hub(hubOptions1);
    await hub1.start();
    clientForServer1 = new HubRpcClient(hub1.rpcAddress._unsafeUnwrap());

    const hubOptions2 = {
      peerId: peerId2,
      localIpAddrsOnly: true,
    };

    hub2 = new Hub(hubOptions2);
    await hub2.start();
    clientForServer2 = new HubRpcClient(hub2.rpcAddress._unsafeUnwrap());
  });

  afterEach(async () => {
    // Cleanup
    clientForServer1.close();
    clientForServer2.close();

    await hub1.stop();
    await hub2.stop();
  });

  test(
    'peers should gossip messages',
    async () => {
      // Connect the two hubs
      expect((await hub1.connectAddress(hub2.gossipAddresses[0] as Multiaddr)).isOk).toBeTruthy();
      await sleep(PROPAGATION_DELAY);

      // Add a custody event to both hub1 and hub2, to simulate both hubs having custody of the same event
      await hub1.submitIdRegistryEvent(custodyEvent);
      await hub2.submitIdRegistryEvent(custodyEvent);

      expect(await getRootHashFromClient(clientForServer1)).toEqual('');
      expect(await getRootHashFromClient(clientForServer2)).toEqual('');

      // Submit signer add, which shouls be gossiped to hub2
      await hub1.submitMessage(signerAdd);

      // sleep 5 heartbeat ticks
      await sleep(PROPAGATION_DELAY);

      // Make sure root hash is same
      expect(await getRootHashFromClient(clientForServer2)).toEqual(await getRootHashFromClient(clientForServer1));

      // Now add cast messages
      await addMessagesWithTimestamps(hub1.engine, [30662167, 30662169, 30662172]);

      // sleep 5 heartbeat ticks
      await sleep(PROPAGATION_DELAY);

      // Make sure root hash is same after adding messages
      expect(await getRootHashFromClient(clientForServer2)).toEqual(await getRootHashFromClient(clientForServer1));
    },
    TEST_TIMEOUT_LONG
  );
});
