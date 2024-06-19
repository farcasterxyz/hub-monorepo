import {
  Metadata,
  getInsecureHubRpcClient,
  getSSLHubRpcClient,
  toFarcasterTime,
  TrieNodePrefix,
  HubResult,
  HubRpcClient,
  TrieNodeMetadataResponse,
} from "@farcaster/hub-nodejs";

import { addressInfoFromGossip, addressInfoToString } from "./p2p.js";

import { timestampToPaddedTimestampPrefix } from "../network/sync/syncId.js";
import { err, ok } from "neverthrow";

class SyncHealthStats {
  primaryNumMessages: number;
  peerNumMessages: number;

  constructor(primaryNumMessages: number, peerNumMessages: number) {
    this.primaryNumMessages = primaryNumMessages;
    this.peerNumMessages = peerNumMessages;
  }

  computeDiff = () => {
    return this.primaryNumMessages - this.peerNumMessages;
  };

  computeDiffPercentage = () => {
    return this.computeDiff() / this.primaryNumMessages;
  };
}

const RPC_TIMEOUT_SECONDS = 2;

const getTimePrefix = (time: number) => {
  return toFarcasterTime(time).map((farcasterTime) => {
    return Buffer.from(timestampToPaddedTimestampPrefix(farcasterTime));
  });
};

const getMetadata = (timePrefix: Buffer, rpcClient: HubRpcClient): Promise<HubResult<TrieNodeMetadataResponse>> => {
  return rpcClient.getSyncMetadataByPrefix(TrieNodePrefix.create({ prefix: timePrefix }), new Metadata(), {
    deadline: Date.now() + RPC_TIMEOUT_SECONDS * 1000,
  });
};

const getCommonPrefix = (prefix1: Buffer, prefix2: Buffer): Buffer => {
  const commonPrefix = [];
  for (let i = 0; i < Math.min(prefix1.length, prefix2.length); i++) {
    const startValue = prefix1[i];
    const stopValue = prefix2[i];
    if (startValue !== undefined && startValue === stopValue) {
      commonPrefix.push(startValue);
    } else {
      break;
    }
  }
  return Buffer.from(commonPrefix);
};

const isPrefix = (prefix1: Buffer, prefix2: Buffer): boolean => {
  return prefix1.toString().startsWith(prefix2.toString());
};

// Currently unused but will be useful for understanding where diffs are coming from. It's also an alternate way to get message counts and can replace traverseRange
const traverseSubtree = async (
  node: TrieNodeMetadataResponse,
  startTimePrefix: Buffer,
  stopTimePrefix: Buffer,
  rpcClient: HubRpcClient,
  f: (node: TrieNodeMetadataResponse) => undefined,
) => {
  const metadata = await getMetadata(Buffer.from(node.prefix), rpcClient);

  if (metadata.isErr()) {
    return err(metadata.error);
  }

  f(metadata.value);

  for (const child of metadata.value.children) {
    const childValue = Buffer.from(child.prefix);
    const notBeforeStart = Buffer.compare(childValue, startTimePrefix) !== -1;
    const notAfterStop = Buffer.compare(childValue, stopTimePrefix) !== 1;
    const onStartPath = isPrefix(startTimePrefix, childValue);
    if ((onStartPath || notBeforeStart) && notAfterStop) {
      await traverseSubtree(child, startTimePrefix, stopTimePrefix, rpcClient, f);
    }
  }

  return ok(undefined);
};

const traverseRange = async (
  node: TrieNodeMetadataResponse,
  startTimePrefix: Buffer,
  stopTimePrefix: Buffer,
  rpcClient: HubRpcClient,
  f: (node: TrieNodeMetadataResponse) => undefined,
) => {
  const metadata = await getMetadata(Buffer.from(node.prefix), rpcClient);

  if (metadata.isErr()) {
    return err(metadata.error);
  }

  for (const child of metadata.value.children) {
    const childValue = Buffer.from(child.prefix);
    if (Buffer.compare(childValue, startTimePrefix) === 0) {
      f(child);
    } else if (isPrefix(startTimePrefix, childValue) || isPrefix(stopTimePrefix, childValue)) {
      await traverseRange(child, startTimePrefix, stopTimePrefix, rpcClient, f);
    } else if (Buffer.compare(childValue, startTimePrefix) === 1 && Buffer.compare(childValue, stopTimePrefix) === -1) {
      f(child);
    }
  }

  return ok(undefined);
};

// Queries for the number of messages between the start time and stop time and is efficient with respect to the number of rpcs to the peer. It only queries down along the start prefix and stop prefix starting at the common prefix.

const getNumMessagesInSpanOptimized = async (rpcClient: HubRpcClient, startTime: number, stopTime: number) => {
  const startTimePrefix = getTimePrefix(startTime);
  if (startTimePrefix.isErr()) {
    return err(startTimePrefix.error);
  }

  const stopTimePrefix = getTimePrefix(stopTime);

  if (stopTimePrefix.isErr()) {
    return err(stopTimePrefix.error);
  }

  const commonPrefix = getCommonPrefix(startTimePrefix.value, stopTimePrefix.value);

  const commonPrefixMetadata = await getMetadata(Buffer.from(commonPrefix), rpcClient);

  if (commonPrefixMetadata.isErr()) {
    return err(commonPrefixMetadata.error);
  }

  let numMessages = 0;
  const result = await traverseRange(
    commonPrefixMetadata.value,
    startTimePrefix.value,
    stopTimePrefix.value,
    rpcClient,
    (node: TrieNodeMetadataResponse) => {
      numMessages += node.numMessages;
    },
  );

  if (result.isErr()) {
    return err(result.error);
  }

  return ok(numMessages);
};

// Queries for the number of messages between the start time and stop time and is very simple. It queries once per second and works if the time span is short.
const getNumMessagesInSpan = async (rpcClient: HubRpcClient, startTime: number, stopTime: number) => {
  let numMessages = 0;

  for (let i = startTime; i < stopTime; i += 1000) {
    const timePrefix = getTimePrefix(i);

    if (timePrefix.isErr()) {
      return err(timePrefix.error);
    }

    const metadata = await getMetadata(timePrefix.value, rpcClient);

    if (metadata.isErr()) {
      return err(metadata.error);
    }

    numMessages += metadata.value.numMessages;
  }

  return ok(numMessages);
};

const computeSyncHealthStats = async (
  startTime: number,
  stopTime: number,
  primaryRpcClient: HubRpcClient,
  peer2RpcClient: HubRpcClient,
  getNumMessagesInSpan: (rpcClient: HubRpcClient, startTime: number, stopTime: number) => Promise<HubResult<number>>,
) => {
  const numMessagesPrimary = await getNumMessagesInSpan(primaryRpcClient, startTime, stopTime);
  const numMessagesPeer = await getNumMessagesInSpan(peer2RpcClient, startTime, stopTime);

  if (numMessagesPrimary.isErr()) {
    return err(numMessagesPrimary.error);
  }

  if (numMessagesPeer.isErr()) {
    return err(numMessagesPeer.error);
  }

  console.log("Primary node num messages", numMessagesPrimary.value);
  console.log("Peer num messages", numMessagesPeer.value);

  return ok(new SyncHealthStats(numMessagesPrimary.value, numMessagesPeer.value));
};

const pickPeers = async (rpcClient: HubRpcClient, count: number): Promise<HubResult<(string | undefined)[]>> => {
  const peers = await rpcClient.getCurrentPeers({});
  return peers.map((peers) => {
    // Shuffle peers then pick [count]
    return peers.contacts
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value)
      .slice(0, count)
      .map((peer) => {
        if (peer.rpcAddress) {
          const addrInfo = addressInfoFromGossip(peer.rpcAddress);
          if (addrInfo.isOk()) {
            return addressInfoToString(addrInfo.value);
          }
        }
        return;
      });
  });
};

export const printSyncHealth = async (
  rangeStartSecondsAgo: number,
  rangeSpanSeconds: number,
  maxNumPeers: number,
  primaryNode: string,
) => {
  const startTime = Math.floor((Date.now() - rangeStartSecondsAgo * 1000) / 1000) * 1000;
  const stopTime = startTime + rangeSpanSeconds * 1000;
  console.log("Start time: %d, Stop time: %d", startTime, stopTime);
  const node1RpcClient = getSSLHubRpcClient(primaryNode);

  let numErrors = 0;
  let numSuccess = 0;
  let sumScores = 0;

  node1RpcClient.$.waitForReady(Date.now() + RPC_TIMEOUT_SECONDS * 1000, async (err) => {
    if (err) {
      console.log("Primary rpc client not ready", err);
      throw Error();
    } else {
      const peers = await pickPeers(node1RpcClient, maxNumPeers);
      if (peers.isErr()) {
        console.log("Error querying peers");
        return;
      }

      for (const peer of peers.value) {
        if (peer === undefined) {
          continue;
        }
        let peerRpcClient;

        try {
          // Most hubs seem to work with the insecure one
          peerRpcClient = getInsecureHubRpcClient(peer);

          peerRpcClient.$.waitForReady(Date.now() + RPC_TIMEOUT_SECONDS * 1000, (err) => {
            if (err) {
              peerRpcClient = getSSLHubRpcClient(peer);
            }
          });
        } catch (e) {
          peerRpcClient = getSSLHubRpcClient(peer);
        }

        try {
          const syncHealthStats = await computeSyncHealthStats(
            startTime,
            stopTime,
            node1RpcClient,
            peerRpcClient,
            // getNumMessagesInSpan, keeping this in here so it's easy to flip which computation we use. This one is simpler.
            getNumMessagesInSpanOptimized,
          );
          if (syncHealthStats.isOk()) {
            // Sync health is us relative to peer. If the sync health is high, means we have more messages. If it's low, we have less.
            const score = syncHealthStats.value.computeDiff();
            console.log("Peer:", peer);
            console.log("Message count diff: %d", score);
            console.log("Message count diff percentage: %d", syncHealthStats.value.computeDiffPercentage());
            console.log();
            numSuccess++;
            sumScores += score;
          } else {
            numErrors++;
          }
          peerRpcClient.close();
        } catch (err) {
          numErrors += 1;
        }
      }
    }

    console.log("Error count: %d", numErrors);
    console.log("Average health: %d", sumScores / numSuccess);

    node1RpcClient.close();
  });
};
