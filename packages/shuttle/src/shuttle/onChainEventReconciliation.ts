import {
  type HubRpcClient,
  type OnChainEvent,
  OnChainEventType,
  type IdRegisterEventBody,
  type SignerEventBody,
  type StorageRentEventBody,
  type SignerMigratedEventBody,
  fromFarcasterTime,
  type HubResult,
  type OnChainEventResponse,
  type TierPurchaseBody,
} from "@farcaster/hub-nodejs";
import type { DB } from "./db.ts";
import type { pino } from "pino";
import { err, ok } from "neverthrow";
import { extendStackTrace } from "../utils.ts";

const MAX_PAGE_SIZE = 500;

export type DBOnChainEvent = {
  id: string;
  chainId: bigint;
  createdAt: Date;
  updatedAt: Date;
  blockTimestamp: Date;
  fid: number;
  blockNumber: bigint;
  logIndex: number;
  type: OnChainEventType;
  txHash: Uint8Array;
  body: IdRegisterEventBody | SignerEventBody | StorageRentEventBody | SignerMigratedEventBody | TierPurchaseBody;
};

type EventKeySource = Pick<OnChainEvent | DBOnChainEvent, "chainId" | "blockNumber" | "logIndex">;

export class OnChainEventReconciliation {
  private client: HubRpcClient;
  private db: DB;
  private log: pino.Logger;

  constructor(client: HubRpcClient, db: DB, log: pino.Logger) {
    this.client = client;
    this.db = db;
    this.log = log;
  }

  private getEventKey(event: EventKeySource): string {
    return `${event.chainId}-${event.blockNumber}-${event.logIndex}`;
  }

  async reconcileOnChainEventsForFid(
    fid: number,
    onHubOnChainEvent: (event: OnChainEvent, missingInDb: boolean) => Promise<void>,
    onDbOnChainEvent?: (event: DBOnChainEvent, missingInOnChain: boolean) => Promise<void>,
    startTimestamp?: number,
    stopTimestamp?: number,
    types?: OnChainEventType[],
  ) {
    let startDate: Date | undefined;
    if (startTimestamp) {
      const startUnixTimestampResult = fromFarcasterTime(startTimestamp);
      if (startUnixTimestampResult.isErr()) {
        this.log.error({ fid, types, startTimestamp, stopTimestamp }, "Invalid time range provided to reconciliation");
        return;
      }

      startDate = new Date(startUnixTimestampResult.value);
    }

    let stopDate: Date | undefined;
    if (stopTimestamp) {
      const stopUnixTimestampResult = fromFarcasterTime(stopTimestamp);
      if (stopUnixTimestampResult.isErr()) {
        this.log.error({ fid, types, startTimestamp, stopTimestamp }, "Invalid time range provided to reconciliation");
        return;
      }

      stopDate = new Date(stopUnixTimestampResult.value);
    }

    for (const type of types ?? [
      OnChainEventType.EVENT_TYPE_ID_REGISTER,
      OnChainEventType.EVENT_TYPE_SIGNER,
      OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED,
      OnChainEventType.EVENT_TYPE_STORAGE_RENT,
      OnChainEventType.EVENT_TYPE_TIER_PURCHASE,
    ]) {
      this.log.debug({ fid, type }, "Reconciling on-chain events for FID");
      await this.reconcileOnChainEventsOfTypeForFid(
        fid,
        type,
        onHubOnChainEvent,
        onDbOnChainEvent,
        startDate,
        stopDate,
      );
    }
  }

  async reconcileOnChainEventsOfTypeForFid(
    fid: number,
    type: OnChainEventType,
    onHubOnChainEvent: (event: OnChainEvent, missingInDb: boolean) => Promise<void>,
    onDbOnChainEvent?: (event: DBOnChainEvent, missingInOnChain: boolean) => Promise<void>,
    startDate?: Date,
    stopDate?: Date,
  ) {
    const onChainEventsByKey = new Map<string, OnChainEvent>();
    // First, reconcile events that are in the on-chain but not in the database
    for await (const events of this.allHubOnChainEventsOfTypeForFid(fid, type, startDate, stopDate)) {
      const eventKeys = events.map((event: OnChainEvent) => this.getEventKey(event));

      if (eventKeys.length === 0) {
        this.log.debug({ fid, type }, "No on-chain events found");
        continue;
      }

      const dbEvents = await this.dbEventsMatchingOnChainEvents(fid, type, events);

      const dbEventsByKey = new Map<string, DBOnChainEvent>();
      for (const event of dbEvents) {
        const key = this.getEventKey(event);
        dbEventsByKey.set(key, event);
      }

      for (const event of events) {
        const eventKey = this.getEventKey(event);
        onChainEventsByKey.set(eventKey, event);

        const dbEvent = dbEventsByKey.get(eventKey);
        await onHubOnChainEvent(event, dbEvent === undefined);
      }
    }

    // Next, reconcile on-chain events that are in the database but not on the hub
    if (onDbOnChainEvent) {
      const dbEvents = await this.allActiveDbOnChainEventsOfTypeForFid(fid, type, startDate, stopDate);
      if (dbEvents.isErr()) {
        this.log.error(
          { fid, type, startDate: startDate?.toISOString(), stopDate: stopDate?.toISOString() },
          "Invalid time range provided to reconciliation",
        );
        return;
      }

      for (const dbEvent of dbEvents.value) {
        const key = this.getEventKey(dbEvent);
        await onDbOnChainEvent(dbEvent, !onChainEventsByKey.has(key));
      }
    }
  }

  private async *allHubOnChainEventsOfTypeForFid(
    fid: number,
    type: OnChainEventType,
    startDate?: Date,
    stopDate?: Date,
  ) {
    let result: HubResult<OnChainEventResponse> = await this.client.getOnChainEvents({
      pageSize: MAX_PAGE_SIZE,
      fid,
      eventType: type,
    });

    for (;;) {
      if (result.isErr()) {
        throw new Error(`Unable to get all on-chain events for FID ${fid}: ${result.error?.message}`);
      }

      const { events, nextPageToken: pageToken } = result.value;

      // Filter events by timestamp if provided
      const filteredEvents = events.filter((event: OnChainEvent) => {
        if (startDate && event.blockTimestamp * 1000 < startDate.getTime()) return false;
        if (stopDate && event.blockTimestamp * 1000 > stopDate.getTime()) return false;
        return true;
      });

      yield filteredEvents;

      if (!pageToken?.length) break;

      result = await this.client.getOnChainEvents({
        pageSize: MAX_PAGE_SIZE,
        pageToken,
        fid,
        eventType: type,
      });
    }
  }

  private async allActiveDbOnChainEventsOfTypeForFid(
    fid: number,
    type: OnChainEventType,
    startDate?: Date,
    stopDate?: Date,
  ) {
    const query = this.db
      .selectFrom("onchain_events")
      .select([
        "id",
        "chainId",
        "createdAt",
        "updatedAt",
        "blockTimestamp",
        "fid",
        "blockNumber",
        "logIndex",
        "type",
        "txHash",
        "body",
      ])
      .where("fid", "=", fid)
      .where("type", "=", type);

    const queryWithStartTime = startDate ? query.where("blockTimestamp", ">=", startDate) : query;
    const queryWithStopTime = stopDate
      ? queryWithStartTime.where("blockTimestamp", "<=", stopDate)
      : queryWithStartTime;

    try {
      const result = await queryWithStopTime.execute();
      return ok(result);
    } catch (e) {
      throw extendStackTrace(e, new Error(), queryWithStopTime);
    }
  }

  private async dbEventsMatchingOnChainEvents(fid: number, type: OnChainEventType, onChainEvents: OnChainEvent[]) {
    if (onChainEvents.length === 0) {
      return [];
    }

    const query = this.db
      .selectFrom("onchain_events")
      .select([
        "id",
        "chainId",
        "createdAt",
        "updatedAt",
        "blockTimestamp",
        "fid",
        "blockNumber",
        "logIndex",
        "type",
        "txHash",
        "body",
      ])
      .where("fid", "=", fid)
      .where("type", "=", type)
      .where(
        "chainId",
        "in",
        onChainEvents.map((e) => BigInt(e.chainId)),
      )
      .where(
        "blockNumber",
        "in",
        onChainEvents.map((e) => BigInt(e.blockNumber)),
      )
      .where(
        "logIndex",
        "in",
        onChainEvents.map((e) => e.logIndex),
      );

    try {
      return await query.execute();
    } catch (e) {
      throw extendStackTrace(e, new Error(), query);
    }
  }
}
