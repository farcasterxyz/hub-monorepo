import { HubError } from '~/../../../packages/utils/dist';
import HubRpcClient from '~/rpc/client';

export class SyncTrieCommand {
  constructor(private readonly rpcClient: HubRpcClient) {}

  rootHash = async () => {
    const result = await this.rpcClient.getSyncTrieNodeSnapshotByPrefix('');
    return result.match(
      (snapshot) => {
        return snapshot.rootHash;
      },
      (err: HubError) => {
        return `${err}`;
      }
    );
  };

  snapshot = async (prefix?: string) => {
    const result = await this.rpcClient.getSyncTrieNodeSnapshotByPrefix(prefix ?? '');
    return result.match(
      (snapshot) => {
        return JSON.stringify(snapshot.snapshot, null, 2);
      },
      (err: HubError) => {
        return `${err}`;
      }
    );
  };

  metadata = async (prefix?: string) => {
    const result = await this.rpcClient.getSyncMetadataByPrefix(prefix ?? '');
    return result.match(
      (metadata) => {
        return JSON.stringify(metadata, null, 2);
      },
      (err: HubError) => {
        return `${err}`;
      }
    );
  };

  syncIds = async (prefix?: string) => {
    const result = await this.rpcClient.getSyncIdsByPrefix(prefix ?? '');
    return result.match(
      (syncIds) => {
        return JSON.stringify(syncIds, null, 2);
      },
      (err: HubError) => {
        return `${err}`;
      }
    );
  };
}
