import { Result, ok, err } from 'neverthrow';
import { CastDeleteMessageBody, CastRecastMessageBody, CastShortMessageBody, Message } from '~/types';

type SetAddType = CastRecastMessageBody | CastShortMessageBody;
type SetDeleteType = CastDeleteMessageBody;

class CastSet {
  private _adds: Map<string, Message<SetAddType>>;
  private _deletes: Map<string, Message<SetDeleteType>>;

  constructor() {
    this._adds = new Map();
    this._deletes = new Map();
  }

  get(hash: string): Message<SetAddType | SetDeleteType> | undefined {
    return this._adds.get(hash) || this._deletes.get(hash);
  }

  getAddsHashes(): string[] {
    return Array.from(this._adds.keys());
  }

  getDeletesHashes(): string[] {
    return Array.from(this._deletes.keys());
  }

  add(message: Message<SetAddType>): Result<void, string> {
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

  delete(message: Message<SetDeleteType>): Result<void, string> {
    // TODO: runtime type checks.

    const targetHash = message.data.body.targetHash;
    if (this._deletes.get(targetHash)) {
      return err('CastSet.add: delete is already present');
    }

    if (this._adds.get(targetHash)) {
      this._adds.delete(targetHash);
    }

    this._deletes.set(targetHash, message);
    return ok(undefined);
  }

  _getAdds(): Message<any>[] {
    return Array.from(this._adds.values());
  }

  _getDeletes(): Message<any>[] {
    return Array.from(this._deletes.values());
  }

  _reset(): void {
    this._adds = new Map();
    this._deletes = new Map();
  }
}

export default CastSet;
