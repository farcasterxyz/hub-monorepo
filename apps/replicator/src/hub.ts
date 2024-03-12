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
  HubResult,
} from "@farcaster/hub-nodejs";
import { AssertionError } from "./error.js";
import { exhaustiveGuard } from "./util.js";
import { log } from "./log";

export function getHubClient(host: string, { ssl }: { ssl?: boolean }) {
  const hub = ssl ? getSSLHubRpcClient(host) : getInsecureHubRpcClient(host);
  return hub;
}

async function retryHubCallWithExponentialBackoff<T>(
  fn: () => Promise<HubResult<T>>,
  attempt = 1,
  maxAttempts = 10,
  baseDelayMs = 100,
): Promise<HubResult<T>> {
  let currentAttempt = attempt;
  try {
    const result = await fn();
    if (result.isErr()) {
      throw new Error(`maybe retryable error : ${JSON.stringify(result.error)}`);
    }
    return result;
  } catch (error) {
    log.warn(error);
    if (currentAttempt >= maxAttempts) {
      throw error;
    }

    const delayMs = baseDelayMs * 2 ** currentAttempt;
    log.warn(`Error in backfill, attempt ${currentAttempt}/${maxAttempts}, retrying in ${delayMs}ms`);
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    currentAttempt++;
    return retryHubCallWithExponentialBackoff(fn, currentAttempt, maxAttempts, delayMs);
  }
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
    let result = await retryHubCallWithExponentialBackoff(() => hub.getOnChainEvents({ pageSize, fid, eventType }));
    for (;;) {
      if (result.isErr()) {
        throw new Error(`Unable to backfill events for FID ${fid} of type ${eventType}`, { cause: result.error });
      }

      const { events, nextPageToken: pageToken } = result.value;

      if (hasSubTypeFilter) {
        const filteredEvents = filterEvents(events, signerEventTypes, idRegisterEventTypes);
        if (filteredEvents.length) yield filteredEvents;
      } else {
        yield events;
      }

      if (!pageToken?.length) break;
      result = await retryHubCallWithExponentialBackoff(() =>
        hub.getOnChainEvents({ pageSize, pageToken, fid, eventType }),
      );
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
  const result = await retryHubCallWithExponentialBackoff(() => hub.getUserNameProofsByFid({ fid }));
  if (result.isErr()) {
    throw new Error(`Unable to backfill proofs for FID ${fid}`, { cause: result.error });
  }
  return result.value.proofs;
}

export async function* getCastsByFidInBatchesOf(hub: HubRpcClient, fid: number, pageSize: number) {
  let result = await retryHubCallWithExponentialBackoff(() => hub.getCastsByFid({ pageSize, fid }));
  for (;;) {
    if (result.isErr()) {
      throw new Error(`Unable to backfill casts for FID ${fid}`, { cause: result.error });
    }

    const { messages, nextPageToken: pageToken } = result.value;

    yield messages;

    if (!pageToken?.length) break;
    result = await retryHubCallWithExponentialBackoff(() => hub.getCastsByFid({ pageSize, pageToken, fid }));
  }
}

export async function* getReactionsByFidInBatchesOf(hub: HubRpcClient, fid: number, pageSize: number) {
  let result = await retryHubCallWithExponentialBackoff(() => hub.getReactionsByFid({ pageSize, fid }));
  for (;;) {
    if (result.isErr()) {
      throw new Error(`Unable to fetch Reaction messages for FID ${fid}`, { cause: result.error });
    }

    const { messages, nextPageToken: pageToken } = result.value;

    yield messages;

    if (!pageToken?.length) break;
    result = await retryHubCallWithExponentialBackoff(() => hub.getReactionsByFid({ pageSize, pageToken, fid }));
  }
}

export async function* getLinksByFidInBatchesOf(hub: HubRpcClient, fid: number, pageSize: number) {
  let result = await retryHubCallWithExponentialBackoff(() => hub.getLinksByFid({ pageSize, fid }));
  for (;;) {
    if (result.isErr()) {
      throw new Error(`Unable to fetch Link messages for FID ${fid}`, { cause: result.error });
    }

    const { messages, nextPageToken: pageToken } = result.value;

    yield messages;

    if (!pageToken?.length) break;
    result = await retryHubCallWithExponentialBackoff(() => hub.getLinksByFid({ pageSize, pageToken, fid }));
  }
}

export async function* getVerificationsByFidInBatchesOf(hub: HubRpcClient, fid: number, pageSize: number) {
  let result = await retryHubCallWithExponentialBackoff(() => hub.getVerificationsByFid({ pageSize, fid }));
  for (;;) {
    if (result.isErr()) {
      throw new Error(`Unable to fetch Verification messages for FID ${fid}`, { cause: result.error });
    }

    const { messages, nextPageToken: pageToken } = result.value;

    yield messages;

    if (!pageToken?.length) break;
    result = await retryHubCallWithExponentialBackoff(() => hub.getVerificationsByFid({ pageSize, pageToken, fid }));
  }
}

export async function* getUserDataByFidInBatchesOf(hub: HubRpcClient, fid: number, pageSize: number) {
  let result = await retryHubCallWithExponentialBackoff(() => hub.getUserDataByFid({ pageSize, fid }));
  for (;;) {
    if (result.isErr()) {
      throw new Error(`Unable to fetch UserData messages for FID ${fid}`, { cause: result.error });
    }

    const { messages, nextPageToken: pageToken } = result.value;

    yield messages;

    if (!pageToken?.length) break;
    result = await retryHubCallWithExponentialBackoff(() => hub.getUserDataByFid({ pageSize, pageToken, fid }));
  }
}
