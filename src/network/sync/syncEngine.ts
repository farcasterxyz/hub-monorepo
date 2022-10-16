import { Message } from '~/types';
import { MerkleTrie, TrieSnapshot } from '~/network/sync/merkleTrie';
import { SyncId } from '~/network/sync/syncId';
import Engine from '~/storage/engine';

// Number of seconds to wait for the network to "settle" before syncing. We will only
// attempt to sync messages that are older than this time.
const SYNC_THRESHOLD_IN_SECONDS = 10;

/**
 * SyncEngine handles the logic required to determine where and how two hubs differ
 * from each other and bring them into sync efficiently. See https://github.com/farcasterxyz/hub/issues/66
 * for more details on design of the sync algorithm.
 */
class SyncEngine {
  private readonly _trie: MerkleTrie;
  private readonly engine: Engine;

  constructor(engine: Engine) {
    this._trie = new MerkleTrie();
    this.engine = engine;

    this.engine.on('messageMerged', async (_fid, _type, message) => {
      this.addMessage(message);
    });
  }

  public addMessage(message: Message): void {
    this._trie.insert(new SyncId(message));
  }

  public get trie(): MerkleTrie {
    return this._trie;
  }

  public get snapshot(): TrieSnapshot {
    return this._trie.getSnapshot(this.snapshotTimestamp.toString());
  }

  // Returns the most recent timestamp that's within the sync threshold
  // (i.e. highest timestamp that's < current time and timestamp % sync_thershold == 0)
  public get snapshotTimestamp(): number {
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    return Math.floor(currentTimeInSeconds / SYNC_THRESHOLD_IN_SECONDS) * SYNC_THRESHOLD_IN_SECONDS;
  }
}

export { SyncEngine };
