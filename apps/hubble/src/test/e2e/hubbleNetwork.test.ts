import { bytesToHexString, Factories, FarcasterNetwork, Message } from "@farcaster/hub-nodejs";
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

        // This should trigger a gossip message to hub2, where it should be merged
        await sleepWhile(async () => (await (hub2 as Hub).engine.getCast(fid, castAdd.hash)).isErr(), 2000);

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
      } finally {
        await hub1?.stop(HubShutdownReason.SELF_TERMINATED);
        await hub2?.stop(HubShutdownReason.SELF_TERMINATED);
      }
    },
    100 * TEST_TIMEOUT_SHORT,
  );
});
