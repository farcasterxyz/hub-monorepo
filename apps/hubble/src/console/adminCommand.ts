import * as protobufs from '@farcaster/protobufs';
import { AdminRpcClient } from '@farcaster/utils';
import { ConsoleCommandInterface } from './console';

export class AdminCommand implements ConsoleCommandInterface {
  constructor(private readonly adminClient: AdminRpcClient) {}

  commandName(): string {
    return 'admin';
  }
  shortHelp(): string {
    return 'Admin commands';
  }
  help(): string {
    return `
        Usage: admin.rebuildSyncTrie()
            Rebuild the sync trie by deleteing the trie and reconstructing it from all the messages in the database.
            Be careful not to be connected to any other node or syncing while rebuilding the trie.
        `;
  }
  object() {
    return {
      rebuildSyncTrie: async () => {
        const result = await this.adminClient.rebuildSyncTrie(protobufs.Empty.create());
        return result.match(
          () => '',
          (e) => `Error: ${e}`
        );
      },

      deleteAllMessagesFromDb: async () => {
        const result = await this.adminClient.deleteAllMessagesFromDb(protobufs.Empty.create());
        return result.match(
          () => '',
          (e) => `Error: ${e}`
        );
      },
    };
  }
}
