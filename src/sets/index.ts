import { Result, ok, err } from 'neverthrow';
import DB from '~/db';
import { Message } from '~/types';

abstract class BaseSet {
  protected _db: DB;

  constructor(db: DB) {
    this._db = db;
  }

  protected async getMessage(hash: string): Promise<Result<Message, string>> {
    try {
      const message = await this._db.messages.get(hash);
      return ok(message);
    } catch (e) {
      return err('message not found');
    }
  }

  protected async getMessages(hashes: string[]): Promise<Message[]> {
    return await this._db.messages.getMany(hashes);
  }

  protected async putMessage(message: Message): Promise<Result<void, string>> {
    try {
      await this._db.messages.put(message.hash, message);

      // Index by message signer, type
      await this._db.messagesBySigner(message.signer, message.data.type).put(message.hash, message.hash);

      return ok(undefined);
    } catch (e) {
      return err('putMessage error');
    }
  }

  protected async deleteMessage(hash: string): Promise<Result<void, string>> {
    try {
      const message = await this.getMessage(hash);

      // If not present, no-op
      if (message.isErr()) return ok(undefined);

      // Delete from signer index
      await this._db.messagesBySigner(message.value.signer, message.value.data.type).del(hash);

      // Delete message
      await this._db.messages.del(hash);

      return ok(undefined);
    } catch (e) {
      return err('deleteMessage error');
    }
  }
}

export default BaseSet;
