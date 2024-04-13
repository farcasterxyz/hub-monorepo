import {
  getInsecureHubRpcClient,
  getSSLHubRpcClient,
  HubEvent,
  HubRpcClient,
  isMergeOnChainHubEvent,
  isMergeUsernameProofHubEvent,
  isPruneMessageHubEvent,
  isRevokeMessageHubEvent,
  isMergeMessageHubEvent,
} from "@farcaster/hub-nodejs";
import { bytesToHex } from "../utils";

export type HubClient = {
  host: string;
  client: HubRpcClient;
};

export function getHubClient(host: string, { ssl }: { ssl?: boolean }) {
  const hub = ssl ? getSSLHubRpcClient(host) : getInsecureHubRpcClient(host);
  return { host, client: hub };
}

export const getHubEventCacheKey = (event: HubEvent): string => {
  if (isMergeMessageHubEvent(event)) {
    const hash = bytesToHex(event.mergeMessageBody.message.hash);
    const deletedHashes = event.mergeMessageBody.deletedMessages.map((message) => bytesToHex(message.hash));
    return `hub:evt:merge:${[hash, ...deletedHashes].join(":")}`;
  } else if (isRevokeMessageHubEvent(event)) {
    const hash = bytesToHex(event.revokeMessageBody.message.hash);
    return `hub:evt:revoke:${hash}`;
  } else if (isPruneMessageHubEvent(event)) {
    const hash = bytesToHex(event.pruneMessageBody.message.hash);
    return `hub:evt:prune:${hash}`;
  } else if (isMergeUsernameProofHubEvent(event)) {
    if (event.mergeUsernameProofBody.deletedUsernameProof) {
      if (event.mergeUsernameProofBody.deletedUsernameProofMessage) {
        const hash = bytesToHex(event.mergeUsernameProofBody.deletedUsernameProofMessage.hash);
        return `hub:evt:revoke:${hash}`;
      }

      const signature = bytesToHex(event.mergeUsernameProofBody.deletedUsernameProof.signature);
      return `hub:evt:username:delete:${signature}`;
    }

    if (event.mergeUsernameProofBody.usernameProof) {
      if (event.mergeUsernameProofBody.usernameProofMessage) {
        const hash = bytesToHex(event.mergeUsernameProofBody.usernameProofMessage.hash);
        return `hub:evt:merge:${hash}`;
      }

      const signature = bytesToHex(event.mergeUsernameProofBody.usernameProof.signature);
      return `hub:evt:username:merge:${signature}`;
    }
  } else if (isMergeOnChainHubEvent(event)) {
    const hash = bytesToHex(event.mergeOnChainEventBody.onChainEvent.transactionHash);
    const { logIndex } = event.mergeOnChainEventBody.onChainEvent;
    return `hub:evt:onchain:${hash}:${event.mergeOnChainEventBody.onChainEvent.type}:${logIndex}`;
  }

  // we should never reach here, appease the compiler
  throw new Error("Hub event is missing cache key");
};
