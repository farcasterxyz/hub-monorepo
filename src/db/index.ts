import { Level } from 'level';
import { Message, MessageType } from '~/types';

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
}

export default DB;
