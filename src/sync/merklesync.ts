import { Message } from '~/types';
import { MerkleTrie, SyncId } from '~/sync/merkletrie';
import Engine from '~/engine';

export class MerkleSync {
  private _trie: MerkleTrie;
  private engine: Engine;

  constructor(engine: Engine) {
    this._trie = new MerkleTrie();
    this.engine = engine;

    this.engine.on('messageMerged', async (fid, type, message) => {
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
