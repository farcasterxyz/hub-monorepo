import { Result, ok, err } from 'neverthrow';
import { Cast, CastDelete, CastRecast, CastShort } from '~/types';
import { isCastDelete, isCastRecast, isCastShort } from '~/types/typeguards';

class CastSet {
  private _adds: Map<string, CastShort | CastRecast>;
  private _deletes: Map<string, CastDelete>;

  constructor() {
    this._adds = new Map();
    this._deletes = new Map();
  }

  /** Get a cast by its hash */
  get(hash: string): CastShort | CastRecast | CastDelete | undefined {
    return this._adds.get(hash) || this._deletes.get(hash);
  }

  /** Get hashes of all active casts */
  getHashes(): string[] {
    return Array.from(this._adds.keys());
  }

  /** Get hashes of all casts */
  getAllHashes(): string[] {
    const keys = this.getHashes();
    keys.push(...Array.from(this._deletes.keys()));
    return keys;
  }

  merge(cast: Cast): Result<void, string> {
    if (isCastDelete(cast)) {
      return this.delete(cast);
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

    if (this._deletes.get(message.hash)) {
      return err('CastSet.add: message was deleted');
    }

    if (this._adds.get(message.hash)) {
      return err('CastSet.add: message is already present');
    }

    this._adds.set(message.hash, message);
    return ok(undefined);
  }

  private delete(message: CastDelete): Result<void, string> {
    // TODO: runtime type checks.

    const targetHash = message.data.body.targetHash;
    if (this._deletes.get(targetHash)) {
      return err('CastSet.delete: delete is already present');
    }

    if (this._adds.get(targetHash)) {
      this._adds.delete(targetHash);
    }

    this._deletes.set(targetHash, message);
    return ok(undefined);
  }

  /**
   * Testing Methods
   */

  _getAdds(): (CastShort | CastRecast)[] {
    return Array.from(this._adds.values());
  }

  _getDeletes(): CastDelete[] {
    return Array.from(this._deletes.values());
  }

  _reset(): void {
    this._adds = new Map();
    this._deletes = new Map();
  }
}

export default CastSet;
