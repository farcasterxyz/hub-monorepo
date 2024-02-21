import { MessageCacheEntry, IMessageCache, SeenCache } from "@chainsafe/libp2p-gossipsub";
import { RPC } from "@chainsafe/libp2p-gossipsub/message";
import { MessageId, MsgIdStr, MsgIdToStrFn, PeerIdStr } from "@chainsafe/libp2p-gossipsub/types";
import Rocksdb from "../storage/db/rocksdb.js";
export class HubMessageCache<T> implements SeenCache, IMessageCache {
  db: Rocksdb | undefined;
  notValidatedCount: number;
  size: number;

  constructor(gossip: number, historyCapacity: number, db?: Rocksdb) {
    this.notValidatedCount = 0;
    this.size = 0;
    this.db = db;
  }

  clear(): void {}

  get(key: string | number): T | undefined;
  get(msgId: Uint8Array): RPC.IMessage | undefined;
  get(key: string | number | Uint8Array): T | RPC.IMessage | undefined {
    return undefined;
  }

  getGossipIDs(topics: Set<string>): Map<string, Uint8Array[]> {
    return new Map<string, Uint8Array[]>();
  }

  getWithIWantCount(msgIdStr: string, p: string): { msg: RPC.IMessage; count: number } | null {
    return { msg: { topic: msgIdStr }, count: 0 };
  }

  has(key: string): boolean {
    return false;
  }

  observeDuplicate(msgId: MsgIdStr, fromPeerIdStr: PeerIdStr): void {}

  prune(): void {}

  put(key: string | number, value: T): boolean;
  put(messageId: MessageId, msg: RPC.IMessage, validated: boolean): boolean;
  put(key: string | number | MessageId, value: T | RPC.IMessage, validated?: boolean): boolean {
    return false;
  }

  remove(msgId: MsgIdStr): MessageCacheEntry | null {
    return undefined;
  }

  shift(): void {}

  validate(msgId: MsgIdStr): { message: RPC.IMessage; originatingPeers: Set<PeerIdStr> } | null {
    return { message: { topic: msgId }, originatingPeers: new Set<PeerIdStr>() };
  }
}
