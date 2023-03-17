import { ok } from 'neverthrow';

import * as protobufs from '@farcaster/rpc';
import { HubResult } from '@farcaster/utils';

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

  async getSyncMetadataByPrefix(
    request: protobufs.TrieNodePrefix
  ): Promise<HubResult<protobufs.TrieNodeMetadataResponse>> {
    this.getSyncMetadataByPrefixCalls.push(request);
    const toTrieNodeMetadataResponse = (metadata?: NodeMetadata): protobufs.TrieNodeMetadataResponse => {
      const childrenTrie = [];

      if (!metadata) {
        return protobufs.TrieNodeMetadataResponse.create({});
      }

      if (metadata.children) {
        for (const [, child] of metadata.children) {
          childrenTrie.push(
            protobufs.TrieNodeMetadataResponse.create({
              prefix: child.prefix,
              numMessages: child.numMessages,
              hash: child.hash,
              children: [],
            })
          );
        }
      }

      const metadataResponse = protobufs.TrieNodeMetadataResponse.create({
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

  async getAllSyncIdsByPrefix(request: protobufs.TrieNodePrefix): Promise<HubResult<protobufs.SyncIds>> {
    this.getAllSyncIdsByPrefixCalls.push(request);
    const syncIds = await this.syncEngine.getAllSyncIdsByPrefix(request.prefix);
    return ok(
      protobufs.SyncIds.create({
        syncIds,
      })
    );
  }

  async getAllMessagesBySyncIds(request: protobufs.SyncIds): Promise<HubResult<protobufs.MessagesResponse>> {
    this.getAllMessagesBySyncIdsCalls.push(request);
    const messagesResult = await this.engine.getAllMessagesBySyncIds(request.syncIds);
    return messagesResult.map((messages) => {
      this.getAllMessagesBySyncIdsReturns += messages.length;
      return protobufs.MessagesResponse.create({ messages: messages ?? [] });
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
