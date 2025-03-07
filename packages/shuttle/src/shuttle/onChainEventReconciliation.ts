import {
  ClientDuplexStream,
  HubRpcClient,
  OnChainEvent,
  OnChainEventType,
  IdRegisterEventBody,
  SignerEventBody,
  StorageRentEventBody,
} from "@farcaster/hub-nodejs";
import { type DB } from "./db";
import { pino } from "pino";
import { ok } from "neverthrow";
import { extendStackTrace } from "../utils";

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
  body: IdRegisterEventBody | SignerEventBody | StorageRentEventBody;
};

type EventKeySource = Pick<OnChainEvent | DBOnChainEvent, "chainId" | "blockNumber" | "logIndex">;

export class OnChainEventReconciliation {
  private client: HubRpcClient;
  private stream: ClientDuplexStream<OnChainEvent, OnChainEvent> | undefined;
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

  close() {
    if (this.stream) {
      this.stream.cancel();
      this.stream = undefined;
    }
  }

  async reconcileEventsForFid(
    fid: number,
    onChainEvent: (event: OnChainEvent, missingInDb: boolean) => Promise<void>,
    onDbEvent?: (event: DBOnChainEvent, missingInOnChain: boolean) => Promise<void>,
    startTimestamp?: number,
    stopTimestamp?: number,
    types?: OnChainEventType[],
  ) {
    for (const type of types ?? [
      OnChainEventType.EVENT_TYPE_ID_REGISTER,
      OnChainEventType.EVENT_TYPE_SIGNER,
      OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED,
      OnChainEventType.EVENT_TYPE_STORAGE_RENT,
    ]) {
      this.log.debug({ fid, type }, "Reconciling on-chain events for FID");
      await this.reconcileEventsOfTypeForFid(fid, type, onChainEvent, onDbEvent, startTimestamp, stopTimestamp);
    }
  }

  async reconcileEventsOfTypeForFid(
    fid: number,
    type: OnChainEventType,
    onChainEvent: (event: OnChainEvent, missingInDb: boolean) => Promise<void>,
    onDbEvent?: (event: DBOnChainEvent, missingInOnChain: boolean) => Promise<void>,
    startTimestamp?: number,
    stopTimestamp?: number,
  ) {
    const onChainEventsByKey: Record<string, OnChainEvent> = {};
    // First, reconcile events that are in the on-chain but not in the database
    for await (const events of this.allOnChainEventsOfTypeForFid(fid, type, startTimestamp, stopTimestamp)) {
      const eventKeys = events.map((event: OnChainEvent) => this.getEventKey(event));

      if (eventKeys.length === 0) {
        this.log.debug({ fid, type }, "No on-chain events found");
        continue;
      }

      const dbEvents = await this.dbEventsMatchingOnChainEvents(fid, type, events);

      const dbEventsByKey = dbEvents.reduce((acc, event) => {
        const key = this.getEventKey(event);
        acc[key] = event;
        return acc;
      }, {} as Record<string, DBOnChainEvent>);

      for (const event of events) {
        const eventKey = this.getEventKey(event);
        onChainEventsByKey[eventKey] = event;

        const dbEvent = dbEventsByKey[eventKey];
        if (dbEvent === undefined) {
          await onChainEvent(event, true);
        }
      }
    }

    // Next, reconcile events that are in the database but not in the on-chain
    if (onDbEvent) {
      const dbEvents = await this.allActiveDbEventsOfTypeForFid(fid, type, startTimestamp, stopTimestamp);
      if (dbEvents.isErr()) {
        this.log.error({ fid, type, startTimestamp, stopTimestamp }, "Invalid time range provided to reconciliation");
        return;
      }

      for (const dbEvent of dbEvents.value) {
        const key = this.getEventKey(dbEvent);
        await onDbEvent(dbEvent, !onChainEventsByKey[key]);
      }
    }
  }

  private async *allOnChainEventsOfTypeForFid(
    fid: number,
    type: OnChainEventType,
    startTimestamp?: number,
    stopTimestamp?: number,
  ) {
    let result = await this.client.getOnChainEvents({
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
        if (startTimestamp && event.blockTimestamp < startTimestamp) return false;
        if (stopTimestamp && event.blockTimestamp > stopTimestamp) return false;
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

  private async allActiveDbEventsOfTypeForFid(
    fid: number,
    type: OnChainEventType,
    startTimestamp?: number,
    stopTimestamp?: number,
  ) {
    let startDate: Date | undefined;
    if (startTimestamp) {
      startDate = new Date(startTimestamp * 1000);
    }

    let stopDate: Date | undefined;
    if (stopTimestamp) {
      stopDate = new Date(stopTimestamp * 1000);
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
