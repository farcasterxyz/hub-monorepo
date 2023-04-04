import { AdminRpcClient, Empty } from '@farcaster/hub-nodejs';
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
        const result = await this.adminClient.rebuildSyncTrie(Empty.create());
        return result.match(
          () => '',
          (e) => `Error: ${e}`
        );
      },

      deleteAllMessagesFromDb: async () => {
        const result = await this.adminClient.deleteAllMessagesFromDb(Empty.create());
        return result.match(
          () => '',
          (e) => `Error: ${e}`
        );
      },
    };
  }
}
