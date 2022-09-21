import { ok, err, Result } from 'neverthrow';
import DB from '~/db/rocksdb';
import { Message } from '~/types';
import { isMessage } from '~/types/typeguards';

const DB_NAME_DEFAULT = 'farcaster';

/**
 * Farcaster DB structure:
 *
 * messages!<message hash>: Message
 * signer!<signer key>!<message type>!<message hash>: hash
 */

class FarcasterDB extends DB {
  constructor(name?: string) {
    super(name ?? DB_NAME_DEFAULT);
  }

  async getMessage(hash: string): Promise<Result<Message, string>> {
    const result = await this.get(`messages!${hash}`);

    if (result.isErr()) return err(result.error);

    const json = JSON.parse(result.value);

    if (!isMessage(json)) return err('malformed value');

    return ok(json);
  }

  async getMessages(hashes: string[]): Promise<Result<Message[], string>> {
    const messageKeys = hashes.map((hash) => `messages!${hash}`);
    const result = await this.getMany(messageKeys);

    if (result.isErr()) return err(result.error);

    const json = result.value.reduce((acc: Message[], value: string) => {
      return value ? [...acc, JSON.parse(value)] : acc;
    }, []);

    return ok(json);
  }

  async putMessage(message: Message): Promise<Result<void, string>> {
    // Save message
    const putResult = await this.put(`messages!${message.hash}`, JSON.stringify(message));
    if (putResult.isErr()) return err(putResult.error);

    // Index message by signer and type
    const signerIndexResult = await this.put(
      `signer!${message.signer}!${message.data.type}!${message.hash}`,
      message.hash
    );
    if (signerIndexResult.isErr()) return err(signerIndexResult.error);

    return ok(undefined);
  }

  async deleteMessage(hash: string): Promise<Result<void, string>> {
    const message = await this.getMessage(hash);

    // If not present, no-op
    if (message.isErr()) return ok(undefined);

    // Delete from signer index
    const delIndexResult = await this.del(
      `signer!${message.value.signer}!${message.value.data.type}!${message.value.hash}`
    );
    if (delIndexResult.isErr()) return err(delIndexResult.error);

    // Delete message
    return this.del(`messages!${hash}`);
  }
}

export default FarcasterDB;
