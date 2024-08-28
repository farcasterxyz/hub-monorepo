import { err, ok } from "neverthrow";

import {
  CallOptions,
  ClientDuplexStream,
  HubError,
  HubResult,
  MessagesResponse,
  Metadata,
  StreamSyncRequest,
  StreamSyncResponse,
  SyncIds,
  TrieNodeMetadataResponse,
  TrieNodePrefix,
} from "@farcaster/hub-nodejs";

import Engine from "../../storage/engine/index.js";
import { NodeMetadata } from "./merkleTrie.js";
import SyncEngine from "./syncEngine.js";
import { SyncId } from "./syncId.js";

export class MockRpcClient {
  engine: Engine;
  syncEngine: SyncEngine;

  // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
  getSyncMetadataByPrefixCalls: Array<any> = [];
  // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
  getAllSyncIdsByPrefixCalls: Array<any> = [];
  // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
  getAllMessagesBySyncIdsCalls: Array<any> = [];
  getAllMessagesBySyncIdsReturns = 0;

  constructor(engine: Engine, syncEngine: SyncEngine) {
    this.engine = engine;
    this.syncEngine = syncEngine;
  }

  async streamSync(
    metadata?: Metadata,
    options?: Partial<CallOptions>,
  ): Promise<HubResult<ClientDuplexStream<StreamSyncRequest, StreamSyncResponse>>> {
    return err(new HubError("unavailable", "unavailable"));
  }

  async getSyncMetadataByPrefix(request: TrieNodePrefix): Promise<HubResult<TrieNodeMetadataResponse>> {
    this.getSyncMetadataByPrefixCalls.push(request);
    const toTrieNodeMetadataResponse = (metadata?: NodeMetadata): TrieNodeMetadataResponse => {
      const childrenTrie = [];

      if (!metadata) {
        return TrieNodeMetadataResponse.create({});
      }

      if (metadata.children) {
        for (const [, child] of metadata.children) {
          childrenTrie.push(
            TrieNodeMetadataResponse.create({
              prefix: child.prefix,
              numMessages: child.numMessages,
              hash: child.hash,
              children: [],
            }),
          );
        }
      }

      const metadataResponse = TrieNodeMetadataResponse.create({
        prefix: metadata.prefix,
        numMessages: metadata.numMessages,
        hash: metadata.hash,
        children: childrenTrie,
      });

      return metadataResponse;
    };

    const metadata = await this.syncEngine.getTrieNodeMetadata(request.prefix);
    return ok(toTrieNodeMetadataResponse(metadata));
  }

  async getAllSyncIdsByPrefix(request: TrieNodePrefix): Promise<HubResult<SyncIds>> {
    this.getAllSyncIdsByPrefixCalls.push(request);
    const syncIds = await this.syncEngine.getAllSyncIdsByPrefix(request.prefix);
    return ok(
      SyncIds.create({
        syncIds,
      }),
    );
  }

  async getAllMessagesBySyncIds(request: SyncIds): Promise<HubResult<MessagesResponse>> {
    this.getAllMessagesBySyncIdsCalls.push(request);
    const messagesResult = await this.syncEngine.getAllMessagesBySyncIds(
      request.syncIds.map((s) => SyncId.fromBytes(s)),
    );
    return messagesResult.map((messages) => {
      this.getAllMessagesBySyncIdsReturns += messages.length;
      return MessagesResponse.create({ messages: messages ?? [] });
    });
  }

  stats() {
    return {
      getSyncMetadataByPrefixCalls: this.getSyncMetadataByPrefixCalls.length,
      getAllSyncIdsByPrefixCalls: this.getAllSyncIdsByPrefixCalls.length,
      getAllMessagesBySyncIdsCalls: this.getAllMessagesBySyncIdsCalls.length,
      getAllMessagesBySyncIdsReturns: this.getAllMessagesBySyncIdsReturns,
    };
  }
}
