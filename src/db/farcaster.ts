import { ok, err, Result } from 'neverthrow';
import { AbstractBatch } from '~/abstract-leveldown';
import DB from '~/db/rocksdb';
import { CastRecast, CastRemove, CastShort, Message, MessageType } from '~/types';
import { isCastRecast, isCastShort, isMessage } from '~/types/typeguards';

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
    const result = await this.get(this.messagesKey(hash));

    if (result.isErr()) return err(result.error);

    const json = JSON.parse(result.value);

    if (!isMessage(json)) return err('malformed value');

    return ok(json);
  }

  async getMessages(hashes: string[]): Promise<Result<Message[], string>> {
    const messageKeys = hashes.map((hash) => this.messagesKey(hash));
    const result = await this.getMany(messageKeys);

    if (result.isErr()) return err(result.error);

    const json = result.value.reduce((acc: Message[], value: string) => {
      return value ? [...acc, JSON.parse(value)] : acc;
    }, []);

    return ok(json);
  }

  async putMessage(message: Message): Promise<Result<void, string>> {
    return this.batch([
      { type: 'put', key: this.messagesKey(message.hash), value: JSON.stringify(message) },
      {
        type: 'put',
        key: this.signersKey(message.signer, message.data.type, message.hash),
        value: message.hash,
      },
    ]);
  }

  async deleteMessage(hash: string): Promise<Result<void, string>> {
    const message = await this.getMessage(hash);

    // If not present, no-op
    if (message.isErr()) return ok(undefined);

    return this.batch([
      { type: 'del', key: this.signersKey(message.value.signer, message.value.data.type, message.value.hash) },
      { type: 'del', key: this.messagesKey(hash) },
    ]);
  }

  async getMessagesBySigner(signer: string, type?: MessageType): Promise<Result<Message[], string>> {
    const hashes: string[] = [];
    for await (const [, value] of this.iteratorByPrefix(this.signersKey(signer, type), {
      keys: false,
      valueAsBuffer: false,
    })) {
      hashes.push(value);
    }
    return this.getMessages(hashes);
  }

  /** Cast methods */

  async getCastAdd(fid: number, hash: string): Promise<Result<CastShort | CastRecast, string>> {
    const messageHash = await this.get(this.castAddsKey(fid, hash));
    if (messageHash.isErr()) return err('cast not found');
    const messageResult = await this.getMessage(messageHash.value);
    return messageResult as Result<CastShort | CastRecast, string>;
  }

  async getCastRemove(fid: number, hash: string): Promise<Result<CastRemove, string>> {
    const messageHash = await this.get(this.castRemovesKey(fid, hash));
    if (messageHash.isErr()) return err('cast not found');
    const messageResult = await this.getMessage(messageHash.value);
    return messageResult as Result<CastRemove, string>;
  }

  async getCastAddsByUser(fid: number): Promise<Result<(CastShort | CastRecast)[], string>> {
    const hashes: string[] = [];
    for await (const [, value] of this.iteratorByPrefix(this.castAddsKey(fid), {
      keys: false,
      valueAsBuffer: false,
    })) {
      hashes.push(value);
    }
    const addsResult = await this.getMessages(hashes);
    return addsResult as Result<(CastShort | CastRecast)[], string>;
  }

  async getCastRemovesByUser(fid: number): Promise<Result<CastRemove[], string>> {
    const hashes: string[] = [];
    for await (const [, value] of this.iteratorByPrefix(this.castRemovesKey(fid), {
      keys: false,
      valueAsBuffer: false,
    })) {
      hashes.push(value);
    }
    const removesResult = await this.getMessages(hashes);
    return removesResult as Result<CastRemove[], string>;
  }

  async putCastAdd(cast: CastShort | CastRecast): Promise<Result<void, string>> {
    const messageResult = await this.putMessage(cast);
    if (messageResult.isErr()) return err(messageResult.error);

    const operations: AbstractBatch<string, string>[] = [
      { type: 'put', key: this.castAddsKey(cast.data.fid, cast.hash), value: cast.hash },
    ];

    // Index CastShort by target
    if (isCastShort(cast) && cast.data.body.targetUri) {
      operations.push({
        type: 'put',
        key: this.castShortsByTargetKey(cast.data.body.targetUri, cast.hash),
        value: cast.hash,
      });
    }

    // Index CastRecast by target
    if (isCastRecast(cast)) {
      operations.push({
        type: 'put',
        key: this.castRecastsByTargetKey(cast.data.body.targetCastUri, cast.hash),
        value: cast.hash,
      });
    }

    return this.batch(operations);
  }

  async deleteCastAdd(fid: number, hash: string): Promise<Result<void, string>> {
    const addResult = await this.getCastAdd(fid, hash);

    // If message does not exist, no-op
    if (addResult.isErr()) return ok(undefined);

    const cast = addResult.value;

    const operations: AbstractBatch<string, string>[] = [{ type: 'del', key: this.castAddsKey(fid, hash) }];

    // If cast is CastShort, delete from castShortAddsByTarget index
    if (isCastShort(cast) && cast.data.body.targetUri) {
      operations.push({ type: 'del', key: this.castShortsByTargetKey(cast.data.body.targetUri, cast.hash) });
    }

    // If cast is CastRecast, delete from castRecastAddsByTarget index
    if (isCastRecast(cast)) {
      operations.push({ type: 'del', key: this.castRecastsByTargetKey(cast.data.body.targetCastUri, cast.hash) });
    }

    const deleteResult = await this.batch(operations);
    if (deleteResult.isErr()) return err(deleteResult.error);

    // Delete from messages db
    return this.deleteMessage(cast.hash);
  }

  async putCastRemove(cast: CastRemove): Promise<Result<void, string>> {
    const messageResult = await this.putMessage(cast);
    if (messageResult.isErr()) return err(messageResult.error);

    // Add to castRemoves
    return this.put(this.castRemovesKey(cast.data.fid, cast.data.body.targetHash), cast.hash);
  }

  async deleteCastRemove(fid: number, hash: string): Promise<Result<void, string>> {
    const removeResult = await this.getCastRemove(fid, hash);

    if (removeResult.isErr()) return ok(undefined);

    const castRemove = removeResult.value;

    // Delete from castRemoves
    const deleteResult = await this.del(this.castRemovesKey(fid, hash));
    if (deleteResult.isErr()) return err(deleteResult.error);

    // Delete from messages
    return this.deleteMessage(castRemove.hash);
  }

  async getCastShortsByTarget(target: string): Promise<Result<CastShort[], string>> {
    const hashes: string[] = [];
    for await (const [, value] of this.iteratorByPrefix(this.castShortsByTargetKey(target), {
      keys: false,
      valueAsBuffer: false,
    })) {
      hashes.push(value);
    }
    const messagesResult = await this.getMessages(hashes);
    return messagesResult as Result<CastShort[], string>;
  }

  async getCastRecastsByTarget(target: string): Promise<Result<CastRecast[], string>> {
    const hashes: string[] = [];
    for await (const [, value] of this.iteratorByPrefix(this.castRecastsByTargetKey(target), {
      keys: false,
      valueAsBuffer: false,
    })) {
      hashes.push(value);
    }
    const messagesResult = await this.getMessages(hashes);
    return messagesResult as Result<CastRecast[], string>;
  }

  /** Private methods */

  private messagesKey(hash?: string) {
    return `messages!${hash ?? ''}`;
  }

  private signersKey(signer: string, type?: MessageType, hash?: string) {
    // TODO: fix hack by creating separate methods for prefixes and keys
    return `signer!${signer}!${type ? type + '!' : ''}${hash ?? ''}`;
  }

  private castAddsKey(fid: number, hash?: string) {
    return `fid!${fid}!castAdds!${hash ?? ''}`;
  }

  private castRemovesKey(fid: number, hash?: string) {
    return `fid!${fid}!castRemoves!${hash ?? ''}`;
  }

  private castShortsByTargetKey(target: string, hash?: string) {
    return `castShortsByTarget!${target}!${hash ?? ''}`;
  }

  private castRecastsByTargetKey(target: string, hash?: string) {
    return `castRecastsByTarget!${target}!${hash ?? ''}`;
  }
}

export default FarcasterDB;
