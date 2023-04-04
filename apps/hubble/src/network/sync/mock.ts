import { ok } from 'neverthrow';

import { HubResult, MessagesResponse, SyncIds, TrieNodeMetadataResponse, TrieNodePrefix } from '@farcaster/hub-nodejs';

import Engine from '~/storage/engine';
import { NodeMetadata } from './merkleTrie';
import SyncEngine from './syncEngine';

export class MockRpcClient {
  engine: Engine;
  syncEngine: SyncEngine;

  getSyncMetadataByPrefixCalls: Array<any> = [];
  getAllSyncIdsByPrefixCalls: Array<any> = [];
  getAllMessagesBySyncIdsCalls: Array<any> = [];
  getAllMessagesBySyncIdsReturns = 0;

  constructor(engine: Engine, syncEngine: SyncEngine) {
    this.engine = engine;
    this.syncEngine = syncEngine;
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
            })
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
      })
    );
  }

  async getAllMessagesBySyncIds(request: SyncIds): Promise<HubResult<MessagesResponse>> {
    this.getAllMessagesBySyncIdsCalls.push(request);
    const messagesResult = await this.engine.getAllMessagesBySyncIds(request.syncIds);
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
