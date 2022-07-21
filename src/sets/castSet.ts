import { Result, ok, err } from 'neverthrow';
import { Cast, CastRemove, CastRecast, CastShort } from '~/types';
import { isCastRemove, isCastRecast, isCastShort } from '~/types/typeguards';

class CastSet {
  private _adds: Map<string, CastShort | CastRecast>;
  private _removes: Map<string, CastRemove>;

  constructor() {
    this._adds = new Map();
    this._removes = new Map();
  }

  /** Get a cast by its hash */
  get(hash: string): CastShort | CastRecast | CastRemove | undefined {
    return this._adds.get(hash) || this._removes.get(hash);
  }

  /** Get hashes of all active casts */
  getHashes(): string[] {
    return Array.from(this._adds.keys());
  }

  /** Get hashes of all casts */
  getAllHashes(): string[] {
    const keys = this.getHashes();
    keys.push(...Array.from(this._removes.keys()));
    return keys;
  }

  merge(cast: Cast): Result<void, string> {
    if (isCastRemove(cast)) {
      return this.remove(cast);
    }

    if (isCastRecast(cast) || isCastShort(cast)) {
      return this.add(cast);
    }
    return err('CastSet.merge: invalid cast');
  }

  /**
   * Private Methods
   */

  private add(message: CastShort | CastRecast): Result<void, string> {
    // TODO: Validate the type of message.

    if (this._removes.get(message.hash)) {
      return err('CastSet.add: message was removed');
    }

    if (this._adds.get(message.hash)) {
      return err('CastSet.add: message is already present');
    }

    this._adds.set(message.hash, message);
    return ok(undefined);
  }

  private remove(message: CastRemove): Result<void, string> {
    // TODO: runtime type checks.

    const targetHash = message.data.body.targetHash;
    if (this._removes.get(targetHash)) {
      return err('CastSet.remove: remove is already present');
    }

    if (this._adds.get(targetHash)) {
      this._adds.delete(targetHash);
    }

    this._removes.set(targetHash, message);
    return ok(undefined);
  }

  /**
   * Testing Methods
   */

  _getAdds(): (CastShort | CastRecast)[] {
    return Array.from(this._adds.values());
  }

  _getRemoves(): CastRemove[] {
    return Array.from(this._removes.values());
  }

  _reset(): void {
    this._adds = new Map();
    this._removes = new Map();
  }
}

export default CastSet;
