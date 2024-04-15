import { bytesToHexString, Factories, FarcasterNetwork, Message, MessageBundle } from "@farcaster/hub-nodejs";
import { deployStorageRegistry } from "../utils.js";
import { Hub, HubOptions, HubShutdownReason, randomDbName } from "../../hubble.js";
import { localHttpUrl } from "../constants.js";
import { sleep, sleepWhile } from "../../utils/crypto.js";
import { DB_DIRECTORY } from "../../storage/db/rocksdb.js";
import fs from "fs";
import { TestFNameRegistryServer } from "./testFnameRegistryServer.js";
import { Multiaddr } from "@multiformats/multiaddr";

const TEST_TIMEOUT_SHORT = 10_000;

let storageRegistryAddress: `0x${string}`;
let keyRegistryAddress: `0x${string}`;
let idRegistryAddress: `0x${string}`;

let fnameServerUrl: string;
let fnameServer: TestFNameRegistryServer;
let rocksDBName1: string;
let rocksDBName2: string;

let hubOptions: HubOptions;

describe("hubble gossip and sync tests", () => {
  beforeEach(async () => {
    const { contractAddress: storageAddr } = await deployStorageRegistry();
    if (!storageAddr) throw new Error("Failed to deploy StorageRegistry contract");
    storageRegistryAddress = storageAddr;

    idRegistryAddress = bytesToHexString(Factories.EthAddress.build())._unsafeUnwrap();
    keyRegistryAddress = bytesToHexString(Factories.EthAddress.build())._unsafeUnwrap();

    fnameServer = new TestFNameRegistryServer();
    fnameServerUrl = await fnameServer.start();

    rocksDBName1 = randomDbName();
    rocksDBName2 = randomDbName();

    hubOptions = {
      network: FarcasterNetwork.DEVNET,
      l2StorageRegistryAddress: storageRegistryAddress,
      l2IdRegistryAddress: idRegistryAddress,
      l2KeyRegistryAddress: keyRegistryAddress,
      l2RpcUrl: localHttpUrl,
      ethMainnetRpcUrl: localHttpUrl,
      fnameServerUrl,
      announceIp: "127.0.0.1",
      disableSnapshotSync: true,
    };
  });

  afterEach(async () => {
    await fnameServer.stop();

    // rm -rf the rocksdb directory
    fs.rm(`${DB_DIRECTORY}/${rocksDBName1}`, { recursive: true }, (err) => {});
    fs.rm(`${DB_DIRECTORY}/${rocksDBName2}`, { recursive: true }, (err) => {});
  });

  test(
    "Two hubbles gossip + sync",
    async () => {
      let hub1: Hub | undefined = undefined;
      let hub2: Hub | undefined = undefined;

      try {
        hub1 = new Hub({ ...hubOptions, rocksDBName: rocksDBName1 });
        hub2 = new Hub({ ...hubOptions, rocksDBName: rocksDBName2 });

        await Promise.all([hub1.start(), hub2.start()]);

        // check that the two hubs are synced
        const hub1Info = await hub1.getHubState();
        const hub2Info = await hub2.getHubState();
        expect(hub1Info).toEqual(hub2Info);

        // Connect the 2 hubs over gossip
        await hub1.connectAddress(hub2.gossipAddresses[0] as Multiaddr);
        await sleep(1000);

        const fid = Factories.Fid.build();

        const signer = Factories.Ed25519Signer.build();
        const custodySigner = Factories.Eip712Signer.build();

        const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
        const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
        const custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid }, { transient: { to: custodySignerKey } });
        const signerEvent = Factories.SignerOnChainEvent.build({ fid }, { transient: { signer: signerKey } });
        const storageEvent = Factories.StorageRentOnChainEvent.build({ fid });

        expect(await hub1.engine.mergeOnChainEvent(custodyEvent)).toBeTruthy();
        expect(await hub1.engine.mergeOnChainEvent(signerEvent)).toBeTruthy();
        expect(await hub1.engine.mergeOnChainEvent(storageEvent)).toBeTruthy();

        expect(await hub2.engine.mergeOnChainEvent(custodyEvent)).toBeTruthy();
        expect(await hub2.engine.mergeOnChainEvent(signerEvent)).toBeTruthy();
        expect(await hub2.engine.mergeOnChainEvent(storageEvent)).toBeTruthy();

        // Create a cast message and merge it into hub1
        const castAdd = await Factories.CastAddMessage.create(
          { data: { fid, network: FarcasterNetwork.DEVNET } },
          { transient: { signer } },
        );

        // Submit the message to hub1 via rpc, so it is gossip'd to hub2
        expect(await hub1.submitMessage(castAdd, "rpc")).toBeTruthy();

        // Submitting it again (via gossip) should return false, as it is already in the db
        const errResult = await hub1.submitMessage(castAdd, "gossip");
        expect(errResult.isErr()).toBeTruthy();
        expect(errResult._unsafeUnwrapErr().errCode).toEqual("bad_request.duplicate");

        // Wait for the message to show up in hub2
        await sleepWhile(async () => (await (hub2 as Hub).engine.getCast(fid, castAdd.hash)).isErr(), 200000);

        const result = await hub2.engine.getCast(fid, castAdd.hash);
        expect(result.isOk()).toBeTruthy();
        expect(Message.toJSON(result._unsafeUnwrap())).toEqual(Message.toJSON(castAdd));

        // Create a second cast message, and merge it into hub2 via "sync", so it doesn't trigger a gossip message
        const castAdd2 = await Factories.CastAddMessage.create(
          { data: { fid, network: FarcasterNetwork.DEVNET } },
          { transient: { signer } },
        );
        expect(await hub2.submitMessage(castAdd2, "sync")).toBeTruthy();

        // Get hub2 to sync with Hub1
        await hub2.syncWithPeerId(hub1.identity);

        // Check that the cast message was merged into hub2
        const result2 = await hub2.engine.getCast(fid, castAdd2.hash);
        expect(result2.isOk()).toBeTruthy();

        // Now try to send a message bundle from hub1 -> hub2
        const castAddMessages: Message[] = [];
        for (let i = 0; i < 5; i++) {
          castAddMessages.push(
            await Factories.CastAddMessage.create(
              { data: { fid, network: FarcasterNetwork.DEVNET } },
              { transient: { signer } },
            ),
          );
        }
        const messageBundle = MessageBundle.create({
          hash: new Uint8Array([1, 2, 3, 4, 5]),
          messages: castAddMessages,
        });
        // Submit it to hub1 via rpc so it gets gossiped
        const bundleMergeResult = await hub1.submitMessageBundle(messageBundle, "rpc");
        expect(bundleMergeResult.length).toEqual(5);
        for (let i = 0; i < 5; i++) {
          expect(bundleMergeResult[i]?.isOk()).toBeTruthy();
        }

        // Wait for the message bundle to show up in hub2
        await sleepWhile(
          async () => (await (hub2 as Hub).engine.getCast(fid, castAddMessages[4]?.hash as Uint8Array)).isErr(),
          2000,
        );

        // Make sure all the messages in the bundle are in the db
        for (let i = 0; i < 5; i++) {
          const result = await hub2.engine.getCast(fid, castAddMessages[i]?.hash as Uint8Array);
          expect(result.isOk()).toBeTruthy();
          expect(Message.toJSON(result._unsafeUnwrap())).toEqual(Message.toJSON(castAddMessages[i] as Message));
        }

        // Submitting the same bundle again should result in a duplicate error if we submit via gossip
        const errResult2 = await hub1.submitMessageBundle(messageBundle, "gossip");
        // Expect all the messages to be duplicates
        for (let i = 0; i < 5; i++) {
          expect(errResult2[i]?.isErr()).toBeTruthy();
          expect(errResult2[i]?._unsafeUnwrapErr().errCode).toEqual("bad_request.duplicate");
        }

        // Submitting a different bundle but with some of the same messages should result in a duplicate error
        // only for those
        const castAddMessages2: Message[] = [];
        for (let i = 0; i < 5; i++) {
          castAddMessages2.push(
            await Factories.CastAddMessage.create(
              { data: { fid, network: FarcasterNetwork.DEVNET } },
              { transient: { signer } },
            ),
          );
        }
        // Replacing some of the messages with messages from the previous bundle
        castAddMessages2[1] = castAddMessages[0] as Message;
        castAddMessages2[3] = castAddMessages[1] as Message;

        const messageBundle2 = MessageBundle.create({
          hash: new Uint8Array([0, 1, 2, 1, 2]),
          messages: castAddMessages2,
        });
        const errResult3 = await hub1.submitMessageBundle(messageBundle2, "gossip");
        expect(errResult3.length).toEqual(5);
        expect(errResult3[0]?.isOk()).toBeTruthy();
        expect(errResult3[1]?.isErr()).toBeTruthy();
        expect(errResult3[1]?._unsafeUnwrapErr().errCode).toEqual("bad_request.duplicate");
        expect(errResult3[2]?.isOk()).toBeTruthy();
        expect(errResult3[3]?.isErr()).toBeTruthy();
        expect(errResult3[3]?._unsafeUnwrapErr().errCode).toEqual("bad_request.duplicate");
        expect(errResult3[4]?.isOk()).toBeTruthy();
      } finally {
        await hub1?.stop(HubShutdownReason.SELF_TERMINATED);
        await hub2?.stop(HubShutdownReason.SELF_TERMINATED);
      }
    },
    100 * TEST_TIMEOUT_SHORT,
  );
});
