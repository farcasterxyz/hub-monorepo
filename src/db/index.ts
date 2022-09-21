import { Level } from 'level';
import { err, ok, Result } from 'neverthrow';
import { IDRegistryEvent, Message, MessageType } from '~/types';

const DB_PREFIX = '.level';
const DB_NAME_DEFAULT = 'farcaster';

class DB {
  _db: Level<string, any>;

  constructor(name?: string) {
    this._db = new Level<string, any>(`${DB_PREFIX}/${name ?? DB_NAME_DEFAULT}`, { valueEncoding: 'json' });
  }

  open() {
    return this._db.open();
  }

  close() {
    return this._db.close();
  }

  clear() {
    return this._db.clear();
  }

  async getUsers(): Promise<Set<number>> {
    // const fids = new Set<number>();
    // for await (const fid of this.custodyEvents.keys()) {
    //   fids.add(parseInt(fid));
    // }
    // return fids;
    // return new Set(await this.custodyEvents.keys().all());
    const fids = new Set<number>();
    for await (const userKey of this._db.keys({ gte: '!fid:', lte: String.fromCharCode('!fid:'.charCodeAt(0) + 1) })) {
      fids.add(parseInt(userKey.replace('!fid:', '')));
    }
    return fids;
  }

  async getMessage(hash: string): Promise<Result<Message, string>> {
    try {
      const message = await this.messages.get(hash);
      return ok(message);
    } catch (e) {
      return err('message not found');
    }
  }

  async getMessages(hashes: string[]): Promise<Message[]> {
    return await this.messages.getMany(hashes);
  }

  async putMessage(message: Message): Promise<Result<void, string>> {
    try {
      await this.messages.put(message.hash, message);

      // Index by message signer, type
      await this.messagesBySigner(message.signer, message.data.type).put(message.hash, message.hash);

      return ok(undefined);
    } catch (e) {
      return err('unexpected error');
    }
  }

  async deleteMessage(hash: string): Promise<Result<void, string>> {
    try {
      const message = await this.getMessage(hash);

      // If not present, no-op
      if (message.isErr()) return ok(undefined);

      // Delete from signer index
      await this.messagesBySigner(message.value.signer, message.value.data.type).del(hash);

      // Delete message
      await this.messages.del(hash);

      return ok(undefined);
    } catch (e) {
      return err('unexpected error');
    }
  }

  get messages() {
    return this._db.sublevel<string, Message>('messages', { valueEncoding: 'json' });
  }

  user(fid: number) {
    return this._db.sublevel<string, any>(`fid:${fid}`, { valueEncoding: 'json' });
  }

  messagesBySigner(signerKey: string, type?: MessageType) {
    const db = this._db.sublevel<string, string>(`signer:${signerKey}`, { valueEncoding: 'json' });
    return type ? db.sublevel<string, string>(`type:${type}`, { valueEncoding: 'json' }) : db;
  }

  /** Cast sublevels */

  castAdds(fid: number) {
    return this.user(fid).sublevel<string, string>('castAdds', { valueEncoding: 'json' });
  }

  castRemoves(fid: number) {
    return this.user(fid).sublevel<string, string>('castRemoves', { valueEncoding: 'json' });
  }

  castShortsByTarget(target: string) {
    return this._db.sublevel<string, string>(`castShortsByTarget:${target}`, { valueEncoding: 'json' });
  }

  castRecastsByTarget(target: string) {
    return this._db.sublevel<string, string>(`castRecastsByTarget:${target}`, { valueEncoding: 'json' });
  }

  /** Signer sublevels */

  get custodyEvents() {
    return this._db.sublevel<string, IDRegistryEvent>('custodyEvents', { valueEncoding: 'json' });
  }

  signerAdds(fid: number, custodyAddress: string) {
    return this.user(fid)
      .sublevel<string, string>(`custody:${custodyAddress}`, { valueEncoding: 'json' })
      .sublevel<string, string>('signerAdds', { valueEncoding: 'json' });
  }

  signerRemoves(fid: number, custodyAddress: string) {
    return this.user(fid)
      .sublevel<string, string>(`custody:${custodyAddress}`, { valueEncoding: 'json' })
      .sublevel<string, string>('signerRemoves', { valueEncoding: 'json' });
  }
}

export default DB;
