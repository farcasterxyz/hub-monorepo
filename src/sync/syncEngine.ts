import { Message } from '~/types';
import { MerkleTrie } from '~/sync/merkleTrie';
import { SyncId } from '~/sync/syncId';
import Engine from '~/storage/engine';

/**
 * SyncEngine handles the logic required to determine where and how two hubs differ
 * from each other and bring them into sync efficiently. See https://github.com/farcasterxyz/hub/issues/66
 * for more details on design of the sync algorithm.
 */
class SyncEngine {
  private _trie: MerkleTrie;
  private engine: Engine;

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
}

export { SyncEngine };
