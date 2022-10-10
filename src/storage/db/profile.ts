import { ResultAsync } from 'neverthrow';
import { Transaction } from '~/storage/db/rocksdb';
import { MessageType, ProfileMeta, ProfileMetaType } from '~/types';
import MessageDB from '~/storage/db/message';

/**
 * ProfileDB extends MessageDB and provides methods for getting and putting ProfileMeta messages
 * from a RocksDB instance.
 *
 * Profile metadata are stored in this schema:
 * - <extends message schema>
 * - fid!<fid>!profile!<profile meta type>: <ProfileMeta hash>
 */
class ProfileDB extends MessageDB {
  async getProfileMeta(fid: number, type: ProfileMetaType): Promise<ProfileMeta> {
    const messageHash = await this._db.get(this.profileMetaKey(fid, type));
    return this.getMessage<ProfileMeta>(messageHash);
  }

  async getProfileMetaByUser(fid: number): Promise<ProfileMeta[]> {
    const hashes = await this.getMessageHashesByPrefix(this.profileMetaPrefix(fid));
    return this.getMessages<ProfileMeta>(hashes);
  }

  async deleteAllProfileMessagesBySigner(fid: number, signer: string): Promise<void> {
    const tsx = await this._deleteAllProfileMessagesBySigner(this._db.transaction(), fid, signer);
    return this._db.commit(tsx);
  }

  async putProfileMeta(message: ProfileMeta): Promise<void> {
    const tsx = await this._putProfileMeta(this._db.transaction(), message);
    return this._db.commit(tsx);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Private Key Methods                            */
  /* -------------------------------------------------------------------------- */

  private profileMetaPrefix(fid: number) {
    return `fid!${fid}!profile!`;
  }

  private profileMetaKey(fid: number, type: ProfileMetaType) {
    return `${this.profileMetaPrefix(fid)}${type}`;
  }

  /* -------------------------------------------------------------------------- */
  /*                         Private Transaction Methods                        */
  /* -------------------------------------------------------------------------- */

  private async _putProfileMeta(tsx: Transaction, message: ProfileMeta): Promise<Transaction> {
    tsx = this._putMessage(tsx, message);

    // If an existing message exists, delete it
    const existingMeta = await ResultAsync.fromPromise(
      this.getProfileMeta(message.data.fid, message.data.body.type),
      () => undefined
    );
    if (existingMeta.isOk()) {
      tsx = this._deleteMessage(tsx, existingMeta.value);
    }

    tsx = tsx.put(this.profileMetaKey(message.data.fid, message.data.body.type), message.hash);

    return tsx;
  }

  private _deleteProfileMeta(tsx: Transaction, message: ProfileMeta): Transaction {
    tsx = tsx.del(this.profileMetaKey(message.data.fid, message.data.body.type));

    return this._deleteMessage(tsx, message);
  }

  private async _deleteAllProfileMessagesBySigner(tsx: Transaction, fid: number, signer: string): Promise<Transaction> {
    const messages = await this.getMessagesBySigner<ProfileMeta>(fid, signer, MessageType.ProfileMeta);
    for (const message of messages) {
      tsx = this._deleteProfileMeta(tsx, message);
    }
    return tsx;
  }
}

export default ProfileDB;
