import {
  fromFarcasterTime,
  HubResult,
  HubRpcClient,
  OnChainEvent,
  OnChainEventResponse,
  OnChainEventType,
} from "@farcaster/hub-nodejs";
import { err, ok } from "neverthrow";
import { pino } from "pino";
import { extendStackTrace } from "../utils";
import { DB, OnChainEventRow } from "./db";

const MAX_PAGE_SIZE = 500;

// The set of on-chain event types `OnChainEventReconciliation` knows how to fetch from
// the hub. Constraining the public `types` parameter to this list turns "I forgot a
// case in the type-switch" into a compile-time error.
export const RECONCILABLE_ONCHAIN_EVENT_TYPES = [
  OnChainEventType.EVENT_TYPE_ID_REGISTER,
  OnChainEventType.EVENT_TYPE_SIGNER,
  OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED,
  OnChainEventType.EVENT_TYPE_STORAGE_RENT,
  OnChainEventType.EVENT_TYPE_TIER_PURCHASE,
] as const;

export type ReconcilableOnChainEventType = typeof RECONCILABLE_ONCHAIN_EVENT_TYPES[number];

export type DBOnChainEvent = OnChainEventRow;

type EventKeySource = Pick<OnChainEvent | DBOnChainEvent, "chainId" | "blockNumber" | "logIndex">;

export type OnDbOnChainEventCallback = (event: DBOnChainEvent, missingInOnChain: boolean) => Promise<void>;

// Public options for `reconcileOnChainEventsForFid`. An options object is used (rather
// than positional parameters) so that the optional `onDbOnChainEvent` callback isn't a
// landmine sitting between the FID-level callback and the time-window arguments.
//
// `startTimestamp` / `stopTimestamp` are Farcaster timestamps (matching
// `MessageReconciliation`); they're internally converted to absolute Dates and compared
// against each event's `blockTimestamp` (Unix seconds), so callers can use the same
// units across both reconciliation APIs.
export type ReconcileOnChainEventsOptions = {
  startTimestamp?: number;
  stopTimestamp?: number;
  types?: ReconcilableOnChainEventType[];
  onDbOnChainEvent?: OnDbOnChainEventCallback;
};

export type ReconcileOnChainEventsOfTypeOptions = {
  startTimestamp?: number;
  stopTimestamp?: number;
  onDbOnChainEvent?: OnDbOnChainEventCallback;
};

// Reconciles on-chain events between the hub and the local database for a given FID.
// Mirrors the structure of `MessageReconciliation`: the hub-side pass is always run, and
// the DB-side pass is only run when an `onDbOnChainEvent` callback is provided.
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
    options: ReconcileOnChainEventsOptions = {},
  ) {
    const window = this.resolveTimeWindow(options.startTimestamp, options.stopTimestamp);
    if (window.isErr()) {
      this.log.error(
        { fid, startTimestamp: options.startTimestamp, stopTimestamp: options.stopTimestamp },
        "Invalid time range provided to reconciliation",
      );
      return;
    }

    for (const type of options.types ?? RECONCILABLE_ONCHAIN_EVENT_TYPES) {
      this.log.debug({ fid, type }, "Reconciling on-chain events for FID");
      await this.reconcileOnChainEventsOfTypeForFidInternal(
        fid,
        type,
        onHubOnChainEvent,
        options.onDbOnChainEvent,
        window.value,
      );
    }
  }

  async reconcileOnChainEventsOfTypeForFid(
    fid: number,
    type: ReconcilableOnChainEventType,
    onHubOnChainEvent: (event: OnChainEvent, missingInDb: boolean) => Promise<void>,
    options: ReconcileOnChainEventsOfTypeOptions = {},
  ) {
    const window = this.resolveTimeWindow(options.startTimestamp, options.stopTimestamp);
    if (window.isErr()) {
      this.log.error(
        { fid, type, startTimestamp: options.startTimestamp, stopTimestamp: options.stopTimestamp },
        "Invalid time range provided to reconciliation",
      );
      return;
    }
    await this.reconcileOnChainEventsOfTypeForFidInternal(
      fid,
      type,
      onHubOnChainEvent,
      options.onDbOnChainEvent,
      window.value,
    );
  }

  private async reconcileOnChainEventsOfTypeForFidInternal(
    fid: number,
    type: ReconcilableOnChainEventType,
    onHubOnChainEvent: (event: OnChainEvent, missingInDb: boolean) => Promise<void>,
    onDbOnChainEvent: OnDbOnChainEventCallback | undefined,
    window: { startDate?: Date; stopDate?: Date },
  ) {
    // Only build the hub-side key map when the DB-side pass will actually consume it.
    const trackHubEvents = onDbOnChainEvent !== undefined;
    const onChainEventsByKey = new Map<string, OnChainEvent>();

    // First, reconcile events that are on the hub but not in the database
    for await (const events of this.allHubOnChainEventsOfTypeForFid(fid, type, window.startDate, window.stopDate)) {
      if (events.length === 0) {
        this.log.debug({ fid, type }, "No on-chain events found");
        continue;
      }

      const dbEvents = await this.dbEventsMatchingOnChainEvents(fid, type, events);

      const dbEventsByKey = new Map<string, DBOnChainEvent>();
      for (const event of dbEvents) {
        dbEventsByKey.set(this.getEventKey(event), event);
      }

      for (const event of events) {
        const eventKey = this.getEventKey(event);
        if (trackHubEvents) onChainEventsByKey.set(eventKey, event);

        const dbEvent = dbEventsByKey.get(eventKey);
        await onHubOnChainEvent(event, dbEvent === undefined);
      }
    }

    // Next, reconcile on-chain events that are in the database but not on the hub
    if (onDbOnChainEvent) {
      const dbEvents = await this.allActiveDbOnChainEventsOfTypeForFid(fid, type, window.startDate, window.stopDate);
      if (dbEvents.isErr()) {
        this.log.error(
          { fid, type, startDate: window.startDate?.toISOString(), stopDate: window.stopDate?.toISOString() },
          "Failed to query DB on-chain events for reconciliation",
        );
        return;
      }

      for (const dbEvent of dbEvents.value) {
        const key = this.getEventKey(dbEvent);
        await onDbOnChainEvent(dbEvent, !onChainEventsByKey.has(key));
      }
    }
  }

  private resolveTimeWindow(
    startTimestamp: number | undefined,
    stopTimestamp: number | undefined,
  ): HubResult<{ startDate?: Date; stopDate?: Date }> {
    let startDate: Date | undefined;
    if (startTimestamp !== undefined) {
      const r = fromFarcasterTime(startTimestamp);
      if (r.isErr()) return err(r.error);
      startDate = new Date(r.value);
    }

    let stopDate: Date | undefined;
    if (stopTimestamp !== undefined) {
      const r = fromFarcasterTime(stopTimestamp);
      if (r.isErr()) return err(r.error);
      stopDate = new Date(r.value);
    }

    return ok({ startDate, stopDate });
  }

  private async *allHubOnChainEventsOfTypeForFid(
    fid: number,
    type: ReconcilableOnChainEventType,
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

      // Hub does not support time-range filtering for on-chain events, so filter client-side.
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
    type: ReconcilableOnChainEventType,
    startDate?: Date,
    stopDate?: Date,
  ) {
    let query = this.db
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

    if (startDate) query = query.where("blockTimestamp", ">=", startDate);
    if (stopDate) query = query.where("blockTimestamp", "<=", stopDate);

    try {
      return ok(await query.execute());
    } catch (e) {
      // Maintain the same error-shape contract as MessageReconciliation: never throw,
      // return an err result so the caller can decide how to react.
      return err(extendStackTrace(e, new Error(), query));
    }
  }

  private async dbEventsMatchingOnChainEvents(
    fid: number,
    type: ReconcilableOnChainEventType,
    onChainEvents: OnChainEvent[],
  ) {
    if (onChainEvents.length === 0) {
      return [];
    }

    // `chainId` / `blockNumber` are typed as `number` (matching the int8→number pg
    // parser), so build the IN-list as numbers, not BigInts.
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
        onChainEvents.map((e) => e.chainId),
      )
      .where(
        "blockNumber",
        "in",
        onChainEvents.map((e) => e.blockNumber),
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
