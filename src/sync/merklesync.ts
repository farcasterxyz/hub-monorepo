import { Message } from '~/types';
import { MerkleTrie, SyncId } from '~/sync/merkletrie';

export class MerkleSync {
  private _trie: MerkleTrie;

  constructor() {
    this._trie = new MerkleTrie();
  }

  public addMessage(message: Message): void {
    this._trie.insert(new SyncId(message));
  }
}
