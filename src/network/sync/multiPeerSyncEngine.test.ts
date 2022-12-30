import { KeyPair } from '@chainsafe/libp2p-noise/dist/src/@types/libp2p';
import { utils, Wallet } from 'ethers';
import Factories from '~/flatbuffers/factories';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import { SignerAddModel } from '~/flatbuffers/models/types';
import Client from '~/rpc/client';
import Server from '~/rpc/server';
import { jestRocksDB } from '~/storage/db/jestUtils';
import Engine from '~/storage/engine';
import { MockHub } from '~/test/mocks';
import { generateEd25519KeyPair } from '~/utils/crypto';
import { addressInfoFromParts } from '~/utils/p2p';
import SyncEngine from './syncEngine';

const TEST_TIMEOUT_LONG = 60 * 1000;

const testDb1 = jestRocksDB(`engine1.peersyncEngine.test`);
const testDb2 = jestRocksDB(`engine2.peersyncEngine.test`);

const fid = Factories.FID.build();
const wallet = new Wallet(utils.randomBytes(32));

let custodyEvent: IdRegistryEventModel;
let signer: KeyPair;
let signerAdd: SignerAddModel;

beforeAll(async () => {
  custodyEvent = new IdRegistryEventModel(
    await Factories.IdRegistryEvent.create(
      { to: Array.from(utils.arrayify(wallet.address)), fid: Array.from(fid) },
      { transient: { wallet } }
    )
  );

  signer = await generateEd25519KeyPair();
  const signerAddData = await Factories.SignerAddData.create({
    body: Factories.SignerBody.build({ signer: Array.from(signer.publicKey) }),
    fid: Array.from(fid),
  });
  signerAdd = new MessageModel(
    await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { wallet } })
  ) as SignerAddModel;
});

describe('Multi peer sync engine', () => {
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
  let engine1: Engine;
  let hub1;
  let syncEngine1: SyncEngine;
  let server1: Server;
  let port1;
  let clientForServer1: Client;

  beforeEach(async () => {
    // Engine 1 is where we add events, and see if engine 2 will sync them
    engine1 = new Engine(testDb1);
    hub1 = new MockHub(testDb1, engine1);
    syncEngine1 = new SyncEngine(engine1);
    server1 = new Server(hub1, engine1, syncEngine1);
    port1 = await server1.start();
    clientForServer1 = new Client(addressInfoFromParts('127.0.0.1', port1)._unsafeUnwrap());
  });

  afterEach(async () => {
    // Cleanup
    clientForServer1.close();
    await server1.stop();
  });

  test('toBytes test', async () => {
    // Add signer custody event to engine 1
    await engine1.mergeIdRegistryEvent(custodyEvent);
    await engine1.mergeMessage(signerAdd);

    // Fetch the signerAdd message from engine 1
    const rpcResult = await clientForServer1.getAllSignerMessagesByFid(fid);
    expect(rpcResult.isOk()).toBeTruthy();
    expect(rpcResult._unsafeUnwrap().length).toEqual(1);
    const rpcSignerAdd = rpcResult._unsafeUnwrap()[0];

    // Construct the message model from the rpc message bytes.
    const mm = MessageModel.from(rpcSignerAdd!.toBuffer());

    expect(signerAdd?.toBuffer().toString('hex')).toEqual(rpcSignerAdd?.toBuffer().toString('hex'));
    expect(mm.fid()).toEqual(signerAdd.fid());
  });

  test(
    'two peers should sync',
    async () => {
      // Add signer custody event to engine 1
      await engine1.mergeIdRegistryEvent(custodyEvent);
      await engine1.mergeMessage(signerAdd);

      // Add messages to engine 1
      await addMessagesWithTimestamps(engine1, [30662167, 30662169, 30662172]);

      const engine2 = new Engine(testDb2);
      const syncEngine2 = new SyncEngine(engine2);

      // Engine 2 should sync with no excluded hashes
      expect(syncEngine2.shouldSync([])).toBeTruthy();

      // Sync engine 2 with engine 1
      await syncEngine2.performSync([], clientForServer1);

      // Make sure snapshots match
      expect(syncEngine1.snapshot.excludedHashes).toEqual(syncEngine2.snapshot.excludedHashes);
      expect(syncEngine1.snapshot.numMessages).toEqual(syncEngine2.snapshot.numMessages);

      // Should sync should now be false with the new excluded hashes
      expect(syncEngine2.shouldSync(syncEngine1.snapshot.excludedHashes)).toBeFalsy();

      // Add more messages
      await addMessagesWithTimestamps(engine1, [30663167, 30663169, 30663172]);

      // Should sync should now be true
      const newSnapshot = syncEngine1.snapshot.excludedHashes;
      expect(syncEngine2.shouldSync(newSnapshot)).toBeTruthy();

      // Do the sync again
      await syncEngine2.performSync(newSnapshot, clientForServer1);

      // Make sure snapshots match
      expect(syncEngine1.snapshot.excludedHashes).toEqual(syncEngine2.snapshot.excludedHashes);
      expect(syncEngine1.snapshot.numMessages).toEqual(syncEngine2.snapshot.numMessages);
    },
    TEST_TIMEOUT_LONG
  );

  xtest(
    'loads of messages',
    async () => {
      // Add signer custody event to engine 1
      await engine1.mergeIdRegistryEvent(custodyEvent);
      await engine1.mergeMessage(signerAdd);

      // Add loads of messages to engine 1
      let startTime = 30662167;
      const batchSize = 100;
      const numBatches = 20;
      for (let i = 0; i < numBatches; i++) {
        const timestamps = [];
        for (let j = 0; j < batchSize; j++) {
          timestamps.push(startTime + i * batchSize + j);
        }
        // console.log('adding batch', i, ' of ', numBatches);
        await addMessagesWithTimestamps(engine1, timestamps);
        startTime += batchSize;
      }

      const engine2 = new Engine(testDb2);
      const syncEngine2 = new SyncEngine(engine2);

      // Engine 2 should sync with no excluded hashes
      expect(syncEngine2.shouldSync([])).toBeTruthy();

      await engine2.mergeIdRegistryEvent(custodyEvent);
      await engine2.mergeMessage(signerAdd);

      // Sync engine 2 with engine 1, and measure the time taken
      const start = Date.now();
      await syncEngine2.performSync([], clientForServer1);
      const end = Date.now();

      const totalTime = (end - start) / 1000;
      expect(totalTime).toBeGreaterThan(0);
      // console.log('total time', totalTime, 'seconds. Casts per second:', (numBatches * batchSize) / totalTime);

      expect(syncEngine1.snapshot.excludedHashes).toEqual(syncEngine2.snapshot.excludedHashes);
      expect(syncEngine1.snapshot.numMessages).toEqual(syncEngine2.snapshot.numMessages);
    },
    TEST_TIMEOUT_LONG
  );
});
