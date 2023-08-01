import { jestRocksDB } from "../db/jestUtils.js";
import OnChainEventStore from "./onChainEventStore.js";
import StoreEventHandler from "./storeEventHandler.js";
import {
  Factories,
  MergeOnChainEventHubEvent,
  OnChainEvent,
  OnChainEventType,
  SignerEventType,
} from "@farcaster/hub-nodejs";
import { ok } from "neverthrow";

const db = jestRocksDB("protobufs.onChainEventStore.test");
const eventHandler = new StoreEventHandler(db);
const set = new OnChainEventStore(db, eventHandler);

describe("OnChainEventStore", () => {
  describe("mergeOnChainEvent", () => {
    test("should merge event", async () => {
      const onChainEvent = Factories.KeyRegistryOnChainEvent.build();
      await set.mergeOnChainEvent(onChainEvent);
      expect(await set.getOnChainEvents(OnChainEventType.EVENT_TYPE_SIGNER, onChainEvent.fid)).toEqual([onChainEvent]);
    });

    test("does not merge duplicate events", async () => {
      const onChainEvent = Factories.KeyRegistryOnChainEvent.build();
      await set.mergeOnChainEvent(onChainEvent);
      await expect(set.mergeOnChainEvent(onChainEvent)).rejects.toThrow("already exists");
    });

    describe("signers", () => {
      test("can add same signer for multiple fids", async () => {
        const firstSigner = Factories.KeyRegistryOnChainEvent.build();
        const secondSigner = Factories.KeyRegistryOnChainEvent.build({
          fid: firstSigner.fid + 1,
          signerEventBody: Factories.SignerEventBody.build({
            key: firstSigner.signerEventBody.key,
          }),
        });

        await set.mergeOnChainEvent(firstSigner);
        await set.mergeOnChainEvent(secondSigner);
      });
      test("does not allow re-adding removed keys", async () => {
        const signer = Factories.KeyRegistryOnChainEvent.build();
        const signerRemoved = Factories.KeyRegistryOnChainEvent.build({
          fid: signer.fid,
          signerEventBody: Factories.SignerEventBody.build({
            eventType: SignerEventType.REMOVE,
            key: signer.signerEventBody.key,
          }),
        });

        await set.mergeOnChainEvent(signer);
        await set.mergeOnChainEvent(signerRemoved);

        const signerReAdd = Factories.KeyRegistryOnChainEvent.build({
          fid: signer.fid,
          signerEventBody: Factories.SignerEventBody.build({
            eventType: SignerEventType.ADD,
            key: signer.signerEventBody.key,
          }),
        });
        await expect(set.mergeOnChainEvent(signerReAdd)).rejects.toThrow("re-add removed key");
      });
      test("handles out of order keys", async () => {});
    });
  });

  describe("isSignerMigrated", () => {
    test("returns true if signer migrated", async () => {
      await set.mergeOnChainEvent(Factories.SignerMigratedOnChainEvent.build());
      const result = await set.isSignerMigrated();
      expect(result).toEqual(ok(true));
    });

    test("returns false if not migrated", async () => {
      const result = await set.isSignerMigrated();
      expect(result).toEqual(ok(false));
    });
  });

  describe("getOnChainEvents", () => {
    test("returns onchain events by type and fid", async () => {
      const keyRegistryEvent = Factories.KeyRegistryOnChainEvent.build();
      const keyRegistryEvent2 = Factories.KeyRegistryOnChainEvent.build({
        fid: keyRegistryEvent.fid,
        blockNumber: keyRegistryEvent.blockNumber + 1,
      });
      const idRegistryEvent = Factories.IdRegistryOnChainEvent.build({ fid: keyRegistryEvent.fid });
      const anotherFidEvent = Factories.IdRegistryOnChainEvent.build({ fid: keyRegistryEvent.fid + 1 });
      await set.mergeOnChainEvent(keyRegistryEvent);
      await set.mergeOnChainEvent(keyRegistryEvent2);
      await set.mergeOnChainEvent(idRegistryEvent);
      await set.mergeOnChainEvent(anotherFidEvent);
      expect(await set.getOnChainEvents(OnChainEventType.EVENT_TYPE_SIGNER, keyRegistryEvent.fid)).toEqual([
        keyRegistryEvent,
        keyRegistryEvent2,
      ]);
      expect(await set.getOnChainEvents(OnChainEventType.EVENT_TYPE_ID_REGISTER, idRegistryEvent.fid)).toEqual([
        idRegistryEvent,
      ]);
    });
  });

  describe("getActiveSigner", () => {
    test("returns signer if it's not removed", async () => {
      const signer = Factories.KeyRegistryOnChainEvent.build();
      await set.mergeOnChainEvent(signer);
      await expect(set.getActiveSigner(signer.fid, signer.signerEventBody.key)).resolves.toEqual(signer);
    });

    test("does not return signer if it's removed", async () => {
      const signer = Factories.KeyRegistryOnChainEvent.build();
      const signerRemoved = Factories.KeyRegistryOnChainEvent.build({
        fid: signer.fid,
        signerEventBody: Factories.SignerEventBody.build({
          eventType: SignerEventType.REMOVE,
          key: signer.signerEventBody.key,
        }),
      });

      await set.mergeOnChainEvent(signer);
      await set.mergeOnChainEvent(signerRemoved);

      await expect(set.getActiveSigner(signer.fid, signer.signerEventBody.key)).rejects.toThrow("signer removed");
    });
  });

  describe("getIdRegisterEvent", () => {
    test("returns events by fid", async () => {
      const idRegistryEvent = Factories.IdRegistryOnChainEvent.build();
      await set.mergeOnChainEvent(idRegistryEvent);
      expect(await set.getIdRegisterEventByFid(idRegistryEvent.fid)).toEqual(idRegistryEvent);
    });
    test("returns events by custody address", async () => {
      const idRegistryEvent = Factories.IdRegistryOnChainEvent.build();
      await set.mergeOnChainEvent(idRegistryEvent);
      expect(await set.getIdRegisterEventByCustodyAddress(idRegistryEvent.idRegisterEventBody.to)).toEqual(
        idRegistryEvent,
      );
    });
  });

  describe("events", () => {
    let onChainHubEvents: OnChainEvent[];

    const onChainEventListener = (event: MergeOnChainEventHubEvent) => {
      if (event.mergeOnChainEventBody.onChainEvent) {
        onChainHubEvents.push(event.mergeOnChainEventBody.onChainEvent);
      }
    };

    beforeAll(() => {
      eventHandler.on("mergeOnChainEvent", onChainEventListener);
    });

    beforeEach(() => {
      onChainHubEvents = [];
    });

    afterAll(() => {
      eventHandler.off("mergeOnChainEvent", onChainEventListener);
    });

    test("emits events on merge", async () => {
      const idRegisterEvent = Factories.IdRegistryOnChainEvent.build();
      const keyRegistryEvent = Factories.KeyRegistryOnChainEvent.build();
      const signerMigratedEvent = Factories.SignerMigratedOnChainEvent.build();
      await set.mergeOnChainEvent(idRegisterEvent);
      await set.mergeOnChainEvent(keyRegistryEvent);
      await set.mergeOnChainEvent(signerMigratedEvent);
      expect(onChainHubEvents).toEqual([idRegisterEvent, keyRegistryEvent, signerMigratedEvent]);
    });
  });
});
