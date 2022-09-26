import { ResultAsync } from 'neverthrow';
import { Transaction } from '~/db/rocksdb';
import { IDRegistryEvent, SignerAdd, SignerMessage, SignerRemove } from '~/types';
import { isIDRegistryEvent } from '~/types/typeguards';
import { sanitizeSigner } from '~/utils';
import MessageDB from '~/db/message';

class SignerDB extends MessageDB {
  /** Custody event methods */

  async getUsers(): Promise<number[]> {
    const fids: number[] = [];
    const prefix = this.custodyEventKey();
    for await (const [key] of this._db.iteratorByPrefix(prefix, {
      values: false,
      keyAsBuffer: false,
    })) {
      const fid = parseInt(key.replace(prefix, ''));
      fids.push(fid);
    }
    return fids;
  }

  async getCustodyEvent(fid: number): Promise<IDRegistryEvent> {
    const value = await this._db.get(this.custodyEventKey(fid));

    const json = JSON.parse(value);

    if (!isIDRegistryEvent(json)) throw new Error('malformed value');

    return json;
  }

  async putCustodyEvent(event: IDRegistryEvent): Promise<void> {
    const tsx = this._putCustodyEvent(this._db.transaction(), event);
    return this._db.commit(tsx);
  }

  /** Signer methods */

  async getAllSignerMessagesByUser(fid: number): Promise<SignerMessage[]> {
    const prefix = `fid!${fid}!custody!`;
    const hashes = await this.getMessageHashesByPrefix(prefix);
    return this.getMessages<SignerMessage>(hashes);
  }

  async getSignerAdd(fid: number, custodyAddress: string, signer: string): Promise<SignerAdd> {
    const messageHash = await this._db.get(this.signerAddsKey(fid, custodyAddress, signer));
    return this.getMessage<SignerAdd>(messageHash);
  }

  async getSignerRemove(fid: number, custodyAddress: string, signer: string): Promise<SignerRemove> {
    const messageHash = await this._db.get(this.signerRemovesKey(fid, custodyAddress, signer));
    return this.getMessage<SignerRemove>(messageHash);
  }

  async getSignerAddsByUser(fid: number, custodyAddress: string): Promise<SignerAdd[]> {
    const hashes = await this.getMessageHashesByPrefix(this.signerAddsKey(fid, custodyAddress));
    return this.getMessages<SignerAdd>(hashes);
  }

  async getSignerRemovesByUser(fid: number, custodyAddress: string): Promise<SignerRemove[]> {
    const hashes = await this.getMessageHashesByPrefix(this.signerRemovesKey(fid, custodyAddress));
    return this.getMessages<SignerRemove>(hashes);
  }

  async putSignerAdd(signerAdd: SignerAdd): Promise<void> {
    const tsx = await this._putSignerAdd(this._db.transaction(), signerAdd);
    return this._db.commit(tsx);
  }

  async deleteSignerAdd(fid: number, custodyAddress: string, signer: string): Promise<void> {
    const signerAdd = await ResultAsync.fromPromise(this.getSignerAdd(fid, custodyAddress, signer), () => undefined);
    if (signerAdd.isErr()) return undefined;

    const tsx = this._deleteSignerAdd(this._db.transaction(), signerAdd.value);
    return this._db.commit(tsx);
  }

  async putSignerRemove(signerRemove: SignerRemove): Promise<void> {
    const tsx = await this._putSignerRemove(this._db.transaction(), signerRemove);
    return this._db.commit(tsx);
  }

  async deleteSignerRemove(fid: number, custodyAddress: string, signer: string): Promise<void> {
    const signerRemove = await ResultAsync.fromPromise(
      this.getSignerRemove(fid, custodyAddress, signer),
      () => undefined
    );
    if (signerRemove.isErr()) return undefined;

    const tsx = this._deleteSignerRemove(this._db.transaction(), signerRemove.value);
    return this._db.commit(tsx);
  }

  /** Private key methods */

  private custodyEventKey(fid?: number) {
    return `custodyEvents!${fid ?? ''}`;
  }

  private signerAddsKey(fid: number, custodyAddress: string, signer?: string) {
    return `fid!${fid}!custody!${sanitizeSigner(custodyAddress)}!signerAdds!${sanitizeSigner(signer ?? '')}`;
  }

  private signerRemovesKey(fid: number, custodyAddress: string, signer?: string) {
    return `fid!${fid}!custody!${sanitizeSigner(custodyAddress)}!signerRemoves!${sanitizeSigner(signer ?? '')}`;
  }

  /** Private transaction methods */

  private _putCustodyEvent(tsx: Transaction, event: IDRegistryEvent): Transaction {
    return tsx.put(this.custodyEventKey(event.args.id), JSON.stringify(event));
  }

  private async _putSignerAdd(tsx: Transaction, signerAdd: SignerAdd): Promise<Transaction> {
    tsx = this._putMessage(tsx, signerAdd);

    const signerRemove = await ResultAsync.fromPromise(
      this.getSignerRemove(signerAdd.data.fid, signerAdd.signer, signerAdd.data.body.delegate),
      () => undefined
    );
    if (signerRemove.isOk()) {
      tsx = this._deleteSignerRemove(tsx, signerRemove.value);
    }

    return tsx.put(
      this.signerAddsKey(signerAdd.data.fid, signerAdd.signer, signerAdd.data.body.delegate),
      signerAdd.hash
    );
  }

  private _deleteSignerAdd(tsx: Transaction, signerAdd: SignerAdd): Transaction {
    // Delete from signerAdds
    tsx = tsx.del(this.signerAddsKey(signerAdd.data.fid, signerAdd.signer, signerAdd.data.body.delegate));

    // Delete from messages
    return this._deleteMessage(tsx, signerAdd);
  }

  private async _putSignerRemove(tsx: Transaction, signerRemove: SignerRemove): Promise<Transaction> {
    tsx = this._putMessage(tsx, signerRemove);

    const signerAdd = await ResultAsync.fromPromise(
      this.getSignerAdd(signerRemove.data.fid, signerRemove.signer, signerRemove.data.body.delegate),
      () => undefined
    );
    if (signerAdd.isOk()) {
      tsx = this._deleteSignerAdd(tsx, signerAdd.value);
    }

    return tsx.put(
      this.signerRemovesKey(signerRemove.data.fid, signerRemove.signer, signerRemove.data.body.delegate),
      signerRemove.hash
    );
  }

  private _deleteSignerRemove(tsx: Transaction, signerRemove: SignerRemove): Transaction {
    // Delete from signerRemoves
    tsx = tsx.del(this.signerRemovesKey(signerRemove.data.fid, signerRemove.signer, signerRemove.data.body.delegate));

    // Delete from messages
    return this._deleteMessage(tsx, signerRemove);
  }
}

export default SignerDB;
