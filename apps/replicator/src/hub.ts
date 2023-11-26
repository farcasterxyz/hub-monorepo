import {
  HubRpcClient,
  IdRegisterEventType,
  OnChainEvent,
  OnChainEventType,
  SignerEventType,
  getInsecureHubRpcClient,
  getSSLHubRpcClient,
  isIdRegisterOnChainEvent,
  isSignerOnChainEvent,
} from "@farcaster/hub-nodejs";
import { AssertionError } from "./error.js";
import { exhaustiveGuard } from "./util.js";

export function getHubClient(host: string, { ssl }: { ssl?: boolean }) {
  const hub = ssl ? getSSLHubRpcClient(host) : getInsecureHubRpcClient(host);
  return hub;
}

export async function* getOnChainEventsByFidInBatchesOf(
  hub: HubRpcClient,
  {
    fid,
    pageSize,
    eventTypes,
    signerEventTypes,
    idRegisterEventTypes,
  }: {
    fid: number;
    pageSize: number;
    eventTypes: OnChainEventType[];
    signerEventTypes?: SignerEventType[];
    idRegisterEventTypes?: IdRegisterEventType[];
  },
) {
  const hasSubTypeFilter = signerEventTypes?.length || idRegisterEventTypes?.length;

  for (const eventType of eventTypes) {
    let result = await hub.getOnChainEvents({ pageSize, fid, eventType });
    for (;;) {
      if (result.isErr()) {
        throw new Error("Unable to backfill", { cause: result.error });
      }

      const { events, nextPageToken: pageToken } = result.value;

      if (hasSubTypeFilter) {
        const filteredEvents = filterEvents(events, signerEventTypes, idRegisterEventTypes);
        if (filteredEvents.length) yield filteredEvents;
      } else {
        yield events;
      }

      if (!pageToken?.length) break;
      result = await hub.getOnChainEvents({ pageSize, pageToken, fid, eventType });
    }
  }
}

export function filterEvents(
  events: OnChainEvent[],
  signerEventTypes?: SignerEventType[],
  idRegisterEventTypes?: IdRegisterEventType[],
) {
  return events.filter((event) => {
    switch (event.type) {
      case OnChainEventType.EVENT_TYPE_SIGNER:
        if (!isSignerOnChainEvent(event)) throw new AssertionError(`Invalid SignerOnChainEvent: ${event}`);
        return signerEventTypes === undefined || signerEventTypes.includes(event.signerEventBody.eventType);
      case OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED:
        return true; // No filtering possible since no subtypes
      case OnChainEventType.EVENT_TYPE_ID_REGISTER:
        if (!isIdRegisterOnChainEvent(event)) throw new AssertionError(`Invalid IdRegisterOnChainEvent: ${event}`);
        return idRegisterEventTypes === undefined || idRegisterEventTypes.includes(event.idRegisterEventBody.eventType);
      case OnChainEventType.EVENT_TYPE_STORAGE_RENT:
        return true; // No filtering possible since no subtypes
      case OnChainEventType.EVENT_TYPE_NONE:
        throw new AssertionError(`Invalid OnChainEventType: ${event.type}`);
      default:
        // If we're getting a type error on the line below, it means we've missed a case above.
        // Did we add a new event type?
        exhaustiveGuard(event.type);
    }
  });
}

export async function getUserNameProofsByFid(hub: HubRpcClient, fid: number) {
  const result = await hub.getUserNameProofsByFid({ fid });
  if (result.isErr()) {
    throw new Error("Unable to backfill", { cause: result.error });
  }
  return result.value.proofs;
}

export async function* getCastsByFidInBatchesOf(hub: HubRpcClient, fid: number, pageSize: number) {
  let result = await hub.getCastsByFid({ pageSize, fid });
  for (;;) {
    if (result.isErr()) {
      throw new Error("Unable to backfill", { cause: result.error });
    }

    const { messages, nextPageToken: pageToken } = result.value;

    yield messages;

    if (!pageToken?.length) break;
    result = await hub.getCastsByFid({ pageSize, pageToken, fid });
  }
}

export async function* getReactionsByFidInBatchesOf(hub: HubRpcClient, fid: number, pageSize: number) {
  let result = await hub.getReactionsByFid({ pageSize, fid });
  for (;;) {
    if (result.isErr()) {
      throw new Error(`Unable to fetch Reaction messages for FID ${fid}`, { cause: result.error });
    }

    const { messages, nextPageToken: pageToken } = result.value;

    yield messages;

    if (!pageToken?.length) break;
    result = await hub.getReactionsByFid({ pageSize, pageToken, fid });
  }
}

export async function* getLinksByFidInBatchesOf(hub: HubRpcClient, fid: number, pageSize: number) {
  let result = await hub.getLinksByFid({ pageSize, fid });
  for (;;) {
    if (result.isErr()) {
      throw new Error(`Unable to fetch Link messages for FID ${fid}`, { cause: result.error });
    }

    const { messages, nextPageToken: pageToken } = result.value;

    yield messages;

    if (!pageToken?.length) break;
    result = await hub.getLinksByFid({ pageSize, pageToken, fid });
  }
}

export async function* getVerificationsByFidInBatchesOf(hub: HubRpcClient, fid: number, pageSize: number) {
  let result = await hub.getVerificationsByFid({ pageSize, fid });
  for (;;) {
    if (result.isErr()) {
      throw new Error(`Unable to fetch Verification messages for FID ${fid}`, { cause: result.error });
    }

    const { messages, nextPageToken: pageToken } = result.value;

    yield messages;

    if (!pageToken?.length) break;
    result = await hub.getVerificationsByFid({ pageSize, pageToken, fid });
  }
}

export async function* getUserDataByFidInBatchesOf(hub: HubRpcClient, fid: number, pageSize: number) {
  let result = await hub.getUserDataByFid({ pageSize, fid });
  for (;;) {
    if (result.isErr()) {
      throw new Error(`Unable to fetch UserData messages for FID ${fid}`, { cause: result.error });
    }

    const { messages, nextPageToken: pageToken } = result.value;

    yield messages;

    if (!pageToken?.length) break;
    result = await hub.getUserDataByFid({ pageSize, pageToken, fid });
  }
}
