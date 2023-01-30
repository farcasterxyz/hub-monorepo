import { TrieNodePrefix } from '@farcaster/protobufs';
import { HubError, HubRpcClient } from '@farcaster/utils';
import { ConsoleCommandInterface } from './console';

export class SyncTrieCommand implements ConsoleCommandInterface {
  constructor(private readonly rpcClient: HubRpcClient) {}
  commandName(): string {
    return 'syncTrie';
  }
  shortHelp(): string {
    return 'Query the sync trie';
  }
  help(): string {
    return `Usage: syncTrie <command> <args>
    Commands:
      rootHash - Get the root hash of the sync trie
      snapshot <prefix> - Get the snapshot of the sync trie at the given prefix
      metadata <prefix> - Get the metadata of the sync trie  at the given prefix
      syncIds <prefix> - Get the sync ids of the sync trie at the given prefix`;
  }

  rootHash = async () => {
    const result = await this.rpcClient.getSyncSnapshotByPrefix(TrieNodePrefix.create({ prefix: new Uint8Array() }));
    return result.match(
      (snapshot) => {
        return snapshot.rootHash;
      },
      (err: HubError) => {
        return `${err}`;
      }
    );
  };

  snapshot = async (prefix?: Uint8Array) => {
    const result = await this.rpcClient.getSyncSnapshotByPrefix(
      TrieNodePrefix.create({ prefix: prefix ?? new Uint8Array() })
    );
    return result.match<any>(
      (snapshot) => {
        return snapshot;
      },
      (err: HubError) => {
        return err;
      }
    );
  };

  metadata = async (prefix?: Uint8Array) => {
    const result = await this.rpcClient.getSyncMetadataByPrefix(
      TrieNodePrefix.create({ prefix: prefix ?? new Uint8Array() })
    );
    return result.match<any>(
      (metadata) => {
        return metadata;
      },
      (err: HubError) => {
        return err;
      }
    );
  };

  syncIds = async (prefix?: Uint8Array) => {
    const result = await this.rpcClient.getAllSyncIdsByPrefix(
      TrieNodePrefix.create({ prefix: prefix ?? new Uint8Array() })
    );
    return result.match<any>(
      (syncIds) => {
        return syncIds;
      },
      (err: HubError) => {
        return err;
      }
    );
  };
}
