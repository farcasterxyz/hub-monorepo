import { Factories, FarcasterNetwork } from "@farcaster/hub-nodejs";
import { jestRocksDB } from "../db/jestUtils.js";
import Engine from "../engine/index.js";
import { IdRegisterOnChainEvent } from "@farcaster/core";
import SyncEngine from "../../network/sync/syncEngine.js";
import { RemoveFidsWithNoStorageJobScheduler } from "./removeFidsWithNoStorageJob.js";
import { MockHub } from "../../test/mocks.js";
import { HubInterface } from "../../hubble.js";

const db = jestRocksDB("jobs.removeFidsWithNoStorage.test");
const network = FarcasterNetwork.TESTNET;
const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodyEvent: IdRegisterOnChainEvent;

let hub: HubInterface;
let engine: Engine;
let syncEngine: SyncEngine;
let scheduler: RemoveFidsWithNoStorageJobScheduler;

describe("RemoveFidsWithNoStorageJob", () => {
  beforeAll(async () => {
    engine = new Engine(db, FarcasterNetwork.TESTNET);
    hub = new MockHub(db, engine);
    syncEngine = new SyncEngine(hub, db);
    scheduler = new RemoveFidsWithNoStorageJobScheduler(engine, syncEngine);

    const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
    custodyEvent = Factories.IdRegistryOnChainEvent.build({ fid }, { transient: { to: custodySignerKey } });
  });

  afterAll(async () => {
    await syncEngine.stop();
    await engine.stop();
    scheduler.stop();
  });

  test("should remove fids with no storage", async () => {
    const rcustody = await engine.mergeOnChainEvent(custodyEvent);
    expect(rcustody.isOk()).toBeTruthy();

    // Make sure its in the engine and sync trie
    const custody = await engine.getIdRegistryOnChainEvent(fid);
    expect(custody.isOk()).toBeTruthy();
    expect(custody._unsafeUnwrap().fid).toEqual(fid);

    expect(await syncEngine.trie.items()).toBe(1);

    // Run the job
    await scheduler.doJobs();

    // Make sure its not in the engine and sync trie
    const custody2 = await engine.getIdRegistryOnChainEvent(fid);
    expect(custody2.isErr()).toBeTruthy();

    expect(await syncEngine.trie.items()).toBe(0);
  });
});
