import {
  MessageCache,
  MessageCacheEntry,
  IMessageCache,
  SeenCache,
  SimpleTimeCache,
} from "@chainsafe/libp2p-gossipsub";

import { RPC } from "@chainsafe/libp2p-gossipsub";
import { MessageId, MsgIdStr, PeerIdStr } from "@chainsafe/libp2p-gossipsub/types";
import Rocksdb from "../../storage/db/rocksdb.js";
import { GOSSIP_SEEN_TTL } from "./gossipNode.js";

import { toString as uint8ArrayToString } from "uint8arrays/to-string";

// Importing 'bloom-filters' as a whole due to ES6 import compatibility issues with CommonJS modules,
// then extracting 'ScalableBloomFilter'.
import bloom from "bloom-filters";
import { statsd, initializeStatsd, StatsDInitParams } from "../../utils/statsd.js";
import { StatsD } from "hot-shots";
const { ScalableBloomFilter } = bloom;

export class HubMessageCache<T> implements SeenCache, IMessageCache {
  seenCache: SimpleTimeCache<T>;
  messageCache: MessageCache;
  bloomFilter: bloom.ScalableBloomFilter;

  constructor(gossip: number, historyCapacity: number, statsdParams?: StatsDInitParams) {
    if (statsdParams) {
      initializeStatsd(statsdParams.host, statsdParams.port);
    }

    this.seenCache = new SimpleTimeCache<T>({ validityMs: GOSSIP_SEEN_TTL });
    // gossip parameter corresponds to constants.GossipsubHistoryGossip in js-libp2p-gossipsub
    // historyCapacity parameter corresponds to constants.GossipsubHistoryLength in js-libp2p-gossipsub
    this.messageCache = new MessageCache(gossip, historyCapacity, (msgId) => {
      return uint8ArrayToString(msgId, "base64");
    });

    const [initialSize, errorRate] = [262144, 0.001];
    this.bloomFilter = new ScalableBloomFilter(initialSize, errorRate);
  }

  get notValidatedCount(): number {
    return this.messageCache.notValidatedCount;
  }

  // Note: Unfortunately both the IMessageCache and SeenCache require a size attribute, and each cache
  // may have different storage values. Since the seen cache is more problematic at the moment, we expose its size value.
  // This would affect any prometheus metrics that rely on the size attribute. However, given that we do not expose
  // prometheus metrics for this, it should not affect us (yet).
  get size(): number {
    return this.seenCache.size;
  }

  // clear adheres to SeenCache interface
  clear(): void {
    this.seenCache.clear();
  }

  // get for string or number adheres to SeenCache interface
  get(key: string | number): T | undefined;
  // get for Uint8Array adheres to IMessageCache interface
  get(msgId: Uint8Array): RPC.IMessage | undefined;
  get(key: string | number | Uint8Array): T | RPC.IMessage | undefined {
    if (typeof key === "string" || typeof key === "number") {
      return this.seenCache.get(key);
    } else {
      return this.messageCache.get(key);
    }
  }

  // getGossipIDs adheres to IMessageCache interface
  getGossipIDs(topics: Set<string>): Map<string, Uint8Array[]> {
    return this.messageCache.getGossipIDs(topics);
  }

  // getWithIWantCount adheres to IMessageCache interface
  getWithIWantCount(msgIdStr: string, p: string): { msg: RPC.IMessage; count: number } | null {
    return this.messageCache.getWithIWantCount(msgIdStr, p);
  }

  // has adheres to SeenCache interface
  has(key: string): boolean {
    return this.bloomFilter.has(key) || this.seenCache.has(key);
  }

  // observeDuplicate adheres to IMessageCache interface
  observeDuplicate(msgId: MsgIdStr, fromPeerIdStr: PeerIdStr): void {
    this.messageCache.observeDuplicate(msgId, fromPeerIdStr);
  }

  // prune adheres to SeenCache interface
  prune(): void {
    this.seenCache.prune();
  }

  put(key: string | number, value: T): boolean;
  put(messageId: MessageId, msg: RPC.IMessage, validated: boolean): boolean;
  put(key: string | number | MessageId, value: T | RPC.IMessage, validated?: boolean): boolean {
    if (typeof key === "string" || typeof key === "number") {
      statsd().increment("gossip.cache.bloom_filter_adds");
      this.bloomFilter.add(key.toString());
      return this.seenCache.put(key, value as T);
    } else {
      return this.messageCache.put(key, value as RPC.IMessage, validated);
    }
  }

  // remove adheres to IMessageCache interface
  remove(msgId: MsgIdStr): MessageCacheEntry | null {
    return this.messageCache.remove(msgId);
  }

  // shift adheres to IMessageCache interface
  shift(): void {
    this.messageCache.shift();
  }

  // validate adheres to IMessageCache interface
  validate(msgId: MsgIdStr): { message: RPC.IMessage; originatingPeers: Set<PeerIdStr> } | null {
    return this.messageCache.validate(msgId);
  }
}
