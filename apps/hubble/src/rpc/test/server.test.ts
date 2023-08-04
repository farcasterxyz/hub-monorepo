import { jestRocksDB } from "../../storage/db/jestUtils.js";
import {
  Factories,
  FarcasterNetwork,
  FidRequest,
  getInsecureHubRpcClient,
  HubResult,
  HubRpcClient,
  IdRegistryEvent,
  OnChainEvent,
  OnChainEventRequest,
  OnChainEventResponse,
  OnChainEventType,
  SignerAddMessage,
  StorageLimit,
  StorageLimitsResponse,
  StoreType,
} from "@farcaster/hub-nodejs";
import Engine from "../../storage/engine/index.js";
import { MockHub } from "../../test/mocks.js";
import Server from "../server.js";
import SyncEngine from "../../network/sync/syncEngine.js";
import { Ok } from "neverthrow";
import { CAST_PRUNE_SIZE_LIMIT_DEFAULT } from "../../storage/stores/castStore.js";
import { REACTION_PRUNE_SIZE_LIMIT_DEFAULT } from "../../storage/stores/reactionStore.js";
import { LINK_PRUNE_SIZE_LIMIT_DEFAULT } from "../../storage/stores/linkStore.js";
import { USER_DATA_PRUNE_SIZE_LIMIT_DEFAULT } from "../../storage/stores/userDataStore.js";
import { VERIFICATION_PRUNE_SIZE_LIMIT_DEFAULT } from "../../storage/stores/verificationStore.js";

const db = jestRocksDB("protobufs.rpc.server.test");
const network = FarcasterNetwork.TESTNET;
const engine = new Engine(db, network);
const hub = new MockHub(db, engine);

let server: Server;
let client: HubRpcClient;

beforeAll(async () => {
  server = new Server(hub, engine, new SyncEngine(hub, db));
  const port = await server.start();
  client = getInsecureHubRpcClient(`127.0.0.1:${port}`);
});

afterAll(async () => {
  client.close();
  await server.stop();
  await engine.stop();
});

const fid = Factories.Fid.build();
const signer = Factories.Ed25519Signer.build();
const custodySigner = Factories.Eip712Signer.build();

let custodyEvent: IdRegistryEvent;
let signerAdd: SignerAddMessage;

beforeAll(async () => {
  const signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  const custodySignerKey = (await custodySigner.getSignerKey())._unsafeUnwrap();
  custodyEvent = Factories.IdRegistryEvent.build({ fid, to: custodySignerKey });

  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, network, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custodySigner } },
  );
});

describe("server rpc tests", () => {
  beforeEach(async () => {
    await engine.mergeIdRegistryEvent(custodyEvent);
    await engine.mergeMessage(signerAdd);
  });

  describe("getOnChainEvents", () => {
    const assertEventsMatchResult = (result: HubResult<OnChainEventResponse>, events: OnChainEvent[]) => {
      expect(result._unsafeUnwrap().events.map((e) => OnChainEvent.toJSON(e))).toEqual(
        events.map((e) => OnChainEvent.toJSON(e)),
      );
    };

    test("succeeds", async () => {
      const idRegistryEvent = Factories.IdRegistryOnChainEvent.build({ fid });
      const idRegistryEvent2 = Factories.IdRegistryOnChainEvent.build({ fid: fid + 1 });
      const signerEvent = Factories.SignerOnChainEvent.build({ fid });
      const signerEvent2 = Factories.SignerOnChainEvent.build({ blockNumber: signerEvent.blockNumber + 1, fid });
      await expect(engine.mergeOnChainEvent(idRegistryEvent)).resolves.toBeInstanceOf(Ok);
      await expect(engine.mergeOnChainEvent(idRegistryEvent2)).resolves.toBeInstanceOf(Ok);
      await expect(engine.mergeOnChainEvent(signerEvent)).resolves.toBeInstanceOf(Ok);
      await expect(engine.mergeOnChainEvent(signerEvent2)).resolves.toBeInstanceOf(Ok);

      const idResult = await client.getOnChainEvents(
        OnChainEventRequest.create({ eventType: OnChainEventType.EVENT_TYPE_ID_REGISTER, fid }),
      );
      assertEventsMatchResult(idResult, [idRegistryEvent]);

      const signerResult = await client.getOnChainEvents(
        OnChainEventRequest.create({ eventType: OnChainEventType.EVENT_TYPE_SIGNER, fid }),
      );
      assertEventsMatchResult(signerResult, [signerEvent, signerEvent2]);

      const emptyResult = await client.getOnChainEvents(
        OnChainEventRequest.create({ eventType: OnChainEventType.EVENT_TYPE_STORAGE_RENT, fid }),
      );
      expect(emptyResult._unsafeUnwrap().events.length).toEqual(0);
    });
  });

  describe("getCurrentStorageLimitsByFid", () => {
    test("succeeds for user with no storage", async () => {
      const result = await client.getCurrentStorageLimitsByFid(FidRequest.create({ fid }));
      // Default storage limits
      expect(result._unsafeUnwrap().limits.map((l) => l.limit)).toEqual([
        CAST_PRUNE_SIZE_LIMIT_DEFAULT,
        LINK_PRUNE_SIZE_LIMIT_DEFAULT,
        REACTION_PRUNE_SIZE_LIMIT_DEFAULT,
        USER_DATA_PRUNE_SIZE_LIMIT_DEFAULT,
        VERIFICATION_PRUNE_SIZE_LIMIT_DEFAULT,
      ]);
    });

    test("succeeds for user with storage", async () => {
      const rentEvent = Factories.StorageRentOnChainEvent.build({
        fid,
        storageRentEventBody: Factories.StorageRentEventBody.build({ units: 1 }),
      });
      await engine.mergeOnChainEvent(rentEvent);
      const result = await client.getCurrentStorageLimitsByFid(FidRequest.create({ fid }));
      const storageLimits = StorageLimitsResponse.fromJSON(result._unsafeUnwrap()).limits;
      expect(storageLimits).toContainEqual(
        StorageLimit.create({ limit: CAST_PRUNE_SIZE_LIMIT_DEFAULT, storeType: StoreType.CASTS }),
      );
      expect(storageLimits).toContainEqual(
        StorageLimit.create({ limit: REACTION_PRUNE_SIZE_LIMIT_DEFAULT, storeType: StoreType.REACTIONS }),
      );
      expect(storageLimits).toContainEqual(
        StorageLimit.create({ limit: LINK_PRUNE_SIZE_LIMIT_DEFAULT, storeType: StoreType.LINKS }),
      );
      expect(storageLimits).toContainEqual(
        StorageLimit.create({ limit: USER_DATA_PRUNE_SIZE_LIMIT_DEFAULT, storeType: StoreType.USER_DATA }),
      );
      expect(storageLimits).toContainEqual(
        StorageLimit.create({ limit: VERIFICATION_PRUNE_SIZE_LIMIT_DEFAULT, storeType: StoreType.VERIFICATIONS }),
      );

      // add 2 more units
      const rentEvent2 = Factories.StorageRentOnChainEvent.build({
        fid,
        storageRentEventBody: Factories.StorageRentEventBody.build({ units: 2 }),
      });
      await engine.mergeOnChainEvent(rentEvent2);
      const result2 = await client.getCurrentStorageLimitsByFid(FidRequest.create({ fid }));
      const newLimits = StorageLimitsResponse.fromJSON(result2._unsafeUnwrap()).limits;
      expect(newLimits).toContainEqual(
        StorageLimit.create({ limit: CAST_PRUNE_SIZE_LIMIT_DEFAULT * 3, storeType: StoreType.CASTS }),
      );
      expect(newLimits).toContainEqual(
        StorageLimit.create({ limit: REACTION_PRUNE_SIZE_LIMIT_DEFAULT * 3, storeType: StoreType.REACTIONS }),
      );
      expect(newLimits).toContainEqual(
        StorageLimit.create({ limit: LINK_PRUNE_SIZE_LIMIT_DEFAULT * 3, storeType: StoreType.LINKS }),
      );
      expect(newLimits).toContainEqual(
        StorageLimit.create({ limit: USER_DATA_PRUNE_SIZE_LIMIT_DEFAULT * 3, storeType: StoreType.USER_DATA }),
      );
      expect(newLimits).toContainEqual(
        StorageLimit.create({ limit: VERIFICATION_PRUNE_SIZE_LIMIT_DEFAULT * 3, storeType: StoreType.VERIFICATIONS }),
      );
    });
  });
});
