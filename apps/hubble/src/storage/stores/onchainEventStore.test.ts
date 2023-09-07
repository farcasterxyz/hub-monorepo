import { jestRocksDB } from "../db/jestUtils.js";
import OnChainEventStore from "./onChainEventStore.js";
import StoreEventHandler from "./storeEventHandler.js";
import {
  Factories,
  HubState,
  IdRegisterEventType,
  MergeOnChainEventHubEvent,
  OnChainEvent,
  OnChainEventType,
  SignerEventType,
} from "@farcaster/hub-nodejs";
import { ok } from "neverthrow";
import { getHubState, putHubState } from "../db/hubState.js";

const db = jestRocksDB("protobufs.onChainEventStore.test");
const eventHandler = new StoreEventHandler(db);
const set = new OnChainEventStore(db, eventHandler);

describe("OnChainEventStore", () => {
  describe("mergeOnChainEvent", () => {
    test("should merge event", async () => {
      const onChainEvent = Factories.SignerOnChainEvent.build();
      await set.mergeOnChainEvent(onChainEvent);
      expect(await set.getOnChainEvents(OnChainEventType.EVENT_TYPE_SIGNER, onChainEvent.fid)).toEqual([onChainEvent]);
    });

    test("does not merge duplicate events", async () => {
      const onChainEvent = Factories.SignerOnChainEvent.build();
      await set.mergeOnChainEvent(onChainEvent);
      await expect(set.mergeOnChainEvent(onChainEvent)).rejects.toThrow("already exists");
    });

    describe("signers", () => {
      test("can add same signer for multiple fids", async () => {
        const firstSigner = Factories.SignerOnChainEvent.build();
        const secondSigner = Factories.SignerOnChainEvent.build({
          fid: firstSigner.fid + 1,
          signerEventBody: Factories.SignerEventBody.build({
            key: firstSigner.signerEventBody.key,
          }),
        });

        await set.mergeOnChainEvent(firstSigner);
        await set.mergeOnChainEvent(secondSigner);
      });
      test("does not allow re-adding removed keys", async () => {
        const signer = Factories.SignerOnChainEvent.build();
        const signerRemoved = Factories.SignerOnChainEvent.build({
          fid: signer.fid,
          blockNumber: signer.blockNumber + 1,
          signerEventBody: Factories.SignerEventBody.build({
            eventType: SignerEventType.REMOVE,
            key: signer.signerEventBody.key,
          }),
        });

        await set.mergeOnChainEvent(signer);
        await set.mergeOnChainEvent(signerRemoved);

        const signerReAdd = Factories.SignerOnChainEvent.build({
          fid: signer.fid,
          blockNumber: signerRemoved.blockNumber + 1,
          signerEventBody: Factories.SignerEventBody.build({
            eventType: SignerEventType.ADD,
            key: signer.signerEventBody.key,
          }),
        });
        await expect(set.mergeOnChainEvent(signerReAdd)).rejects.toThrow("re-add removed key");
      });

      test("does not fail on admin reset of non-existing signer", async () => {
        const reset = Factories.SignerOnChainEvent.build({
          signerEventBody: Factories.SignerEventBody.build({
            eventType: SignerEventType.ADMIN_RESET,
          }),
        });

        await expect(set.mergeOnChainEvent(reset)).resolves.toBeDefined();
        await expect(set.getActiveSigner(reset.fid, reset.signerEventBody.key)).rejects.toThrow("active signer");
      });
    });

    describe("transfers", () => {
      test("updates the custody address on transfer", async () => {
        const register = Factories.IdRegistryOnChainEvent.build();
        const transfer = Factories.IdRegistryOnChainEvent.build({
          fid: register.fid,
          blockNumber: register.blockNumber + 1,
          idRegisterEventBody: Factories.IdRegistryEventBody.build({
            eventType: IdRegisterEventType.TRANSFER,
          }),
        });
        await set.mergeOnChainEvent(register);
        await set.mergeOnChainEvent(transfer);

        await expect(set.getIdRegisterEventByFid(transfer.fid)).resolves.toEqual(transfer);
        await expect(set.getIdRegisterEventByCustodyAddress(transfer.idRegisterEventBody.to)).resolves.toEqual(
          transfer,
        );
      });
      test("does not update secondary indexes for recovery event", async () => {
        const register = Factories.IdRegistryOnChainEvent.build();
        const recovery = Factories.IdRegistryOnChainEvent.build({
          fid: register.fid,
          blockNumber: register.blockNumber + 1,
          idRegisterEventBody: Factories.IdRegistryEventBody.build({
            eventType: IdRegisterEventType.CHANGE_RECOVERY,
          }),
        });
        await set.mergeOnChainEvent(register);
        await set.mergeOnChainEvent(recovery);

        await expect(
          set.getOnChainEvents(OnChainEventType.EVENT_TYPE_ID_REGISTER, register.fid),
        ).resolves.toContainEqual(recovery);
        await expect(set.getIdRegisterEventByFid(register.fid)).resolves.toEqual(register);
        await expect(set.getIdRegisterEventByCustodyAddress(register.idRegisterEventBody.to)).resolves.toEqual(
          register,
        );
      });
      test("secondary index has the latest transfer regardless of order of merge", async () => {
        const register = Factories.IdRegistryOnChainEvent.build();
        const transfer = Factories.IdRegistryOnChainEvent.build({
          fid: register.fid,
          blockNumber: register.blockNumber + 1,
          idRegisterEventBody: Factories.IdRegistryEventBody.build({
            eventType: IdRegisterEventType.TRANSFER,
          }),
        });
        const secondTransfer = Factories.IdRegistryOnChainEvent.build({
          fid: register.fid,
          blockNumber: transfer.blockNumber + 1,
          idRegisterEventBody: Factories.IdRegistryEventBody.build({
            eventType: IdRegisterEventType.TRANSFER,
          }),
        });

        await set.mergeOnChainEvent(secondTransfer);
        await set.mergeOnChainEvent(transfer);
        await set.mergeOnChainEvent(register);

        await expect(set.getIdRegisterEventByFid(transfer.fid)).resolves.toEqual(secondTransfer);
        await expect(set.getIdRegisterEventByCustodyAddress(transfer.idRegisterEventBody.to)).resolves.toEqual(
          secondTransfer,
        );
      });
    });
  });

  describe("getSignerMigratedAt", () => {
    test("returns timestamp of signer migrated event", async () => {
      const event = Factories.SignerMigratedOnChainEvent.build();
      await set.mergeOnChainEvent(event);
      const result = await set.getSignerMigratedAt();
      expect(result).toEqual(ok(event.signerMigratedEventBody.migratedAt));
    });

    test("returns 0 if not migrated", async () => {
      const result = await set.getSignerMigratedAt();
      expect(result).toEqual(ok(0));
    });
  });

  describe("getOnChainEvents", () => {
    test("returns onchain events by type and fid", async () => {
      const keyRegistryEvent = Factories.SignerOnChainEvent.build();
      const keyRegistryEvent2 = Factories.SignerOnChainEvent.build({
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
      const signer = Factories.SignerOnChainEvent.build();
      await set.mergeOnChainEvent(signer);
      await expect(set.getActiveSigner(signer.fid, signer.signerEventBody.key)).resolves.toEqual(signer);
    });

    test("does not return signer if it's removed", async () => {
      const signer = Factories.SignerOnChainEvent.build();
      const signerRemoved = Factories.SignerOnChainEvent.build({
        fid: signer.fid,
        blockNumber: signer.blockNumber + 1,
        signerEventBody: Factories.SignerEventBody.build({
          eventType: SignerEventType.REMOVE,
          key: signer.signerEventBody.key,
        }),
      });

      await set.mergeOnChainEvent(signer);
      await set.mergeOnChainEvent(signerRemoved);

      await expect(set.getActiveSigner(signer.fid, signer.signerEventBody.key)).rejects.toThrow("active signer");
    });

    test("does not return signer if unsupported scheme", async () => {
      const signer = Factories.SignerOnChainEvent.build({
        signerEventBody: Factories.SignerEventBody.build({
          eventType: SignerEventType.ADD,
          keyType: 2,
        }),
      });
      await set.mergeOnChainEvent(signer);

      await expect(set.getActiveSigner(signer.fid, signer.signerEventBody.key)).rejects.toThrow("active signer");
    });

    test("return the signer if removal is admin reset", async () => {
      const signer = Factories.SignerOnChainEvent.build();
      const signerRemoved = Factories.SignerOnChainEvent.build({
        fid: signer.fid,
        blockNumber: signer.blockNumber + 1,
        signerEventBody: Factories.SignerEventBody.build({
          eventType: SignerEventType.REMOVE,
          key: signer.signerEventBody.key,
        }),
      });
      const adminReset = Factories.SignerOnChainEvent.build({
        fid: signer.fid,
        blockNumber: signerRemoved.blockNumber + 1,
        signerEventBody: Factories.SignerEventBody.build({
          eventType: SignerEventType.ADMIN_RESET,
          key: signer.signerEventBody.key,
        }),
      });

      await set.mergeOnChainEvent(signer);
      await set.mergeOnChainEvent(signerRemoved);
      await set.mergeOnChainEvent(adminReset);

      await expect(set.getActiveSigner(signer.fid, signer.signerEventBody.key)).resolves.toEqual(signer);
    });

    test("does not return signer even if events are merged out of order", async () => {
      const signer = Factories.SignerOnChainEvent.build();
      const signerRemoved = Factories.SignerOnChainEvent.build({
        fid: signer.fid,
        blockNumber: signer.blockNumber + 1,
        signerEventBody: Factories.SignerEventBody.build({
          eventType: SignerEventType.REMOVE,
          key: signer.signerEventBody.key,
        }),
      });

      await set.mergeOnChainEvent(signerRemoved);
      await set.mergeOnChainEvent(signer);

      await expect(set.getActiveSigner(signer.fid, signer.signerEventBody.key)).rejects.toThrow("active signer");
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

  describe("getSignersByFid", () => {
    test("succeeds", async () => {
      const firstSigner = Factories.SignerOnChainEvent.build();
      const secondSigner = Factories.SignerOnChainEvent.build({
        fid: firstSigner.fid,
      });

      await set.mergeOnChainEvent(firstSigner);
      await set.mergeOnChainEvent(secondSigner);
      const events = (await set.getSignersByFid(firstSigner.fid)).events;
      expect(events.length).toEqual(2);
      expect(events).toContainEqual(firstSigner);
      expect(events).toContainEqual(secondSigner);
    });
    test("only returns active signers", async () => {
      const firstSigner = Factories.SignerOnChainEvent.build();
      const secondSigner = Factories.SignerOnChainEvent.build({
        fid: firstSigner.fid + 1,
        signerEventBody: Factories.SignerEventBody.build({
          key: firstSigner.signerEventBody.key,
        }),
      });
      const secondSignerRemoval = Factories.SignerOnChainEvent.build({
        fid: firstSigner.fid + 1,
        signerEventBody: Factories.SignerEventBody.build({
          eventType: SignerEventType.REMOVE,
          key: firstSigner.signerEventBody.key,
        }),
      });

      await set.mergeOnChainEvent(firstSigner);
      await set.mergeOnChainEvent(secondSigner);
      await set.mergeOnChainEvent(secondSignerRemoval);
      expect((await set.getSignersByFid(firstSigner.fid)).events).toEqual([firstSigner]);
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
      const keyRegistryEvent = Factories.SignerOnChainEvent.build();
      const signerMigratedEvent = Factories.SignerMigratedOnChainEvent.build();
      await set.mergeOnChainEvent(idRegisterEvent);
      await set.mergeOnChainEvent(keyRegistryEvent);
      await set.mergeOnChainEvent(signerMigratedEvent);
      expect(onChainHubEvents).toEqual([idRegisterEvent, keyRegistryEvent, signerMigratedEvent]);
    });
  });

  describe("clearEvents", () => {
    test("clears all events and resets hub state", async () => {
      const idEvent = Factories.IdRegistryOnChainEvent.build();
      const signerEvent = Factories.SignerOnChainEvent.build();
      const storageEvent = Factories.StorageRentOnChainEvent.build();
      const migratedEvent = Factories.SignerMigratedOnChainEvent.build();
      await set.mergeOnChainEvent(idEvent);
      await set.mergeOnChainEvent(signerEvent);
      await set.mergeOnChainEvent(storageEvent);
      await set.mergeOnChainEvent(migratedEvent);

      await putHubState(db, HubState.create({ lastL2Block: 12345 }));

      await OnChainEventStore.clearEvents(db);

      expect(await set.getOnChainEvents(OnChainEventType.EVENT_TYPE_ID_REGISTER, idEvent.fid)).toEqual([]);
      expect(await set.getOnChainEvents(OnChainEventType.EVENT_TYPE_SIGNER, idEvent.fid)).toEqual([]);
      expect(await set.getOnChainEvents(OnChainEventType.EVENT_TYPE_STORAGE_RENT, idEvent.fid)).toEqual([]);
      expect(await set.getOnChainEvents(OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED, idEvent.fid)).toEqual([]);
      await expect(set.getActiveSigner(signerEvent.fid, signerEvent.signerEventBody.key)).rejects.toThrow("NotFound");
      expect(await getHubState(db)).toEqual(HubState.create({ lastL2Block: 0 }));
    });
  });
});
