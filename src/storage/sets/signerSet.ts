import { TypedEmitter } from 'tiny-typed-emitter';
import { ResultAsync } from 'neverthrow';
import { IdRegistryEvent, SignerAdd, SignerMessage, SignerRemove } from '~/types';
import { isSignerAdd, isSignerRemove } from '~/types/typeguards';
import { hashCompare, sanitizeSigner } from '~/utils/crypto';
import RocksDB from '~/storage/db/rocksdb';
import SignerDB from '~/storage/db/signer';

export type SignerSetEvents = {
  /** Emitted when a new Register or Transfer event is received from the Farcaster ID Registry */
  changeCustody: (fid: number, custodyAddress: string, event: IdRegistryEvent) => void;

  /**
   * Emitted when a delegate signer becomes valid which happens when:
   *
   * 1. A SignerAdd message is merged, adding a valid delegate signer for current custody address
   * 2. The custody address changes and a previously merged, invalid SignerAdd message becomes valid
   */
  addSigner: (fid: number, signerKey: string, message: SignerAdd) => void;

  /**
   * Emitted when a valid delegate signer becomes invalid which happens when:
   *
   * 1. A SignerRemove message is merged, removing a delegate signer for the current custody address
   * 2. The custody address changes and a previously active delegate signer is deactivated
   *
   * Note: message is an optional param, because in case (2) there is no SignerRemove message that causes the event
   */
  removeSigner: (fid: number, signerKey: string, message?: SignerRemove) => void;
};

/**
 * A CRDT that keeps track of custody addresses and valid delegate signers for an fid.
 *
 * A Delegate Signer is an EdDSA key-pair that is authorized to sign Messages on behalf of an fid by its custody
 * address. A custody address can submit a SignerAdd to authorize a new key-pair and a SignerRemove to revoke a
 * key-pair. A Signer should only be revoked when a compromise is suspected, and the Hub will purge all messages
 * signed by the Signer across all sets.
 *
 * The SignerDB keeps track of SignerAdds and SignerRemoves in two separate sets per custody address. Conflicts
 * may arise between Signer Messages when received in different orders, which are handled with these rules:
 *
 * 1. Last-Write-Wins - a message with a higher timestamp supersedes one with a lower timestamp
 * 2. Remove-Wins - a remove message always supersedes an add message
 * 3. Lexicographical Ordering - a message with a higher hash supersedes one with a lower hash
 *
 * The validity of a Delegate Signer depends on the validity of the custody address that signed the SignerAdd message.
 * A previously valid custody address can become invalid if the `transfer` function is called on the FIR to move the
 * fid to a new address. When a custody address becomes invalid, the SignerSet must also mark its delegates as invalid.
 */
class SignerSet extends TypedEmitter<SignerSetEvents> {
  private _db: SignerDB;

  constructor(db: RocksDB) {
    super();
    this._db = new SignerDB(db);
  }

  /** Return the set of known fids */
  async getUsers(): Promise<Set<number>> {
    const fids = await this._db.getUsers();
    return new Set(fids);
  }

  /** Return the currently valid custody address for an fid */
  async getCustodyAddress(fid: number): Promise<string> {
    const event = await this.getCustodyEvent(fid);
    return sanitizeSigner(event.args.to);
  }

  async getCustodyEvent(fid: number): Promise<IdRegistryEvent> {
    return this._db.getCustodyEvent(fid);
  }

  /** Return all currently valid Delegate Signers for the fid */
  async getSigners(fid: number): Promise<Set<SignerAdd>> {
    const custodyAddress = await this.getCustodyAddress(fid);
    const signerAdds = await this._db.getSignerAddsByUser(fid, custodyAddress);
    return new Set(signerAdds);
  }

  /** Return the SignerAdd message for a Delegate Signer, if the Signer is valid */
  async getSigner(fid: number, signerKey: string): Promise<SignerAdd> {
    const custodyAddress = await this.getCustodyAddress(fid);
    return this._db.getSignerAdd(fid, custodyAddress, sanitizeSigner(signerKey));
  }

  /** Returns all known SignerMessages for an fid */
  async getAllSignerMessagesByUser(fid: number): Promise<Set<SignerMessage>> {
    const messages = await this._db.getAllSignerMessagesByUser(fid);
    return new Set(messages);
  }

  /** Merge a SignerMessage into the SignerSet */
  async merge(message: SignerMessage): Promise<void> {
    if (isSignerRemove(message)) {
      return this.mergeSignerRemove(message);
    }

    if (isSignerAdd(message)) {
      return this.mergeSignerAdd(message);
    }

    throw new Error('SignerSet.merge: invalid message format');
  }

  /**
   * Merge a new event from the Farcaster ID Registry into the SignerSet.
   *
   * mergeIdRegistryEvent will update the custody address, validate or invalidate delegate signers and emit events.
   * The IdRegistryEvent must be accurate otherwise local state will diverge from blockchain state. If IdRegistryEvents
   * are received out of order, some events may not be emitted.
   */
  async mergeIdRegistryEvent(event: IdRegistryEvent): Promise<void> {
    const fid = event.args.id;

    // If new event is a duplicate or occurred before the existing custodyEvent, no-op
    const custodyEvent = await ResultAsync.fromPromise(this.getCustodyEvent(fid), () => undefined);
    if (custodyEvent.isOk() && this.eventCompare(event, custodyEvent.value) <= 0) {
      return undefined;
    }

    // Get LWW set of signers about to be removed
    const oldCustodyAddress = custodyEvent.isOk() ? sanitizeSigner(custodyEvent.value.args.to) : undefined;

    // Update custodyEvent and emit a changeCustody event
    const newCustodyAddress = sanitizeSigner(event.args.to);
    await this._db.putCustodyEvent(event);
    this.emit('changeCustody', fid, newCustodyAddress, event);

    const newSignerAdds = await this._db.getSignerAddsByUser(fid, newCustodyAddress);
    const newSignerKeys = newSignerAdds.map((signerAdd) => signerAdd.data.body.delegate);

    // Emit removeSigner events for all delegate signers that are no longer valid, meaning the set has not merged
    // a SignerAdd message for that delegate from the new custody address
    if (oldCustodyAddress) {
      const oldSignerAdds = await this._db.getSignerAddsByUser(fid, oldCustodyAddress);
      const oldSignerKeys = oldSignerAdds.map((signerAdd) => signerAdd.data.body.delegate);

      for (const oldSignerKey of oldSignerKeys) {
        if (!newSignerKeys.includes(oldSignerKey)) {
          this.emit('removeSigner', fid, oldSignerKey); // No SignerRemove message to include
        }
      }
    }

    // Emit addSigner events for all delegate signers that are now valid, even ones that already existed
    // in oldSigners.adds, because we want to make sure an addSigner event has been emitted with the
    // most up-to-date SignerAdd message for each delegate signer
    for (const newSignerAdd of newSignerAdds) {
      this.emit('addSigner', fid, newSignerAdd.data.body.delegate, newSignerAdd);
    }

    // TODO: asynchronously run cleanup that deletes all entries that are not for the new custody address

    return undefined;
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  /**
   * Return an order (1, 0, -1) by comparing two ID Registry Events a and b.
   *
   * Events are first compared by their block number, then by log index and finally by lexicographic order of
   * transactionHash. A value of -1 means a occurs before b, 1 means a occurs * after b, and 0 means a and b are the
   * same with identical block number, log index and transactionHash.
   */
  private eventCompare(a: IdRegistryEvent, b: IdRegistryEvent): number {
    // Compare blockNumber
    if (a.blockNumber < b.blockNumber) {
      return -1;
    } else if (a.blockNumber > b.blockNumber) {
      return 1;
    }
    // Compare logIndex
    if (a.logIndex < b.logIndex) {
      return -1;
    } else if (a.logIndex > b.logIndex) {
      return 1;
    }

    // Compare transactionHash (lexicographical order)
    return hashCompare(a.transactionHash, b.transactionHash);
  }

  /**
   * Return an order (-1, 0, 1) by comparing two SignerMessages a and b.
   *
   * Messages are first compared by their timestamps, then by types, and finally by lexicographical order of their
   * hashes. A value of -1 means a occurs before b, 1 means a occurs after b, and 0 means a and b are the same.
   */
  private signerMessageCompare(a: SignerMessage, b: SignerMessage): number {
    // If they are the same message, return 0
    if (a.hash === b.hash) return 0;

    // Compare signedAt timestamps
    if (a.data.signedAt > b.data.signedAt) {
      return 1;
    } else if (a.data.signedAt < b.data.signedAt) {
      return -1;
    }

    // Compare message types (SignerRemove > SignerAdd)
    if (isSignerRemove(a) && isSignerAdd(b)) {
      return 1;
    } else if (isSignerAdd(a) && isSignerRemove(b)) {
      return -1;
    }

    // Compare lexicographical order of hash
    return hashCompare(a.hash, b.hash);
  }

  /**
   * Merges a SignerAdd Message into the CRDT, updating state and emitting events. The high-level logic is: 
   
   * - If the Signer is unknown, place it in the the add-set
   * - If the Signer is in the add-set, keep the SignerAdd with the highest order (using signerMessageOrder)
   * - If the Signer is in the remove-set, move it to the add-set if the SignerAdd has the highest order 
   *   (using signerMessageOrder)
   */
  private async mergeSignerAdd(message: SignerAdd): Promise<void> {
    const { fid } = message.data;
    const custodyAddress = sanitizeSigner(message.signer);
    const signerKey = sanitizeSigner(message.data.body.delegate);

    if (custodyAddress === signerKey)
      throw new Error('SignerSet.mergeSignerAdd: signer and delegate must be different');

    // If the Signer is in the add-set and this SignerAdd does not have the highest order, no-op
    const existingSignerAdd = await ResultAsync.fromPromise(
      this._db.getSignerAdd(fid, custodyAddress, signerKey),
      () => undefined
    );
    if (existingSignerAdd.isOk()) {
      if (this.signerMessageCompare(message, existingSignerAdd.value) <= 0) {
        return undefined;
      }
    }

    // If the Signer is in the remove-set, and this SignerAdd does not have the highest order, no-op
    const existingSignerRemove = await ResultAsync.fromPromise(
      this._db.getSignerRemove(fid, custodyAddress, signerKey),
      () => undefined
    );
    if (existingSignerRemove.isOk()) {
      if (this.signerMessageCompare(message, existingSignerRemove.value) <= 0) {
        return undefined;
      }
    }

    // Add the Signer to the add-set
    await this._db.putSignerAdd(message);

    // Emit an AddSigner event if the Signer becomes valid when added (because its custody address is also valid)
    const currentCustodyAddress = await ResultAsync.fromPromise(this.getCustodyAddress(fid), () => undefined);
    if (currentCustodyAddress.isOk() && currentCustodyAddress.value === custodyAddress) {
      this.emit('addSigner', fid, signerKey, message);
    }

    return undefined;
  }

  /**
   * Merges a SignerRemove Message into the CRDT, updating state and emitting events. The high-level logic is:
   *
   * - If the signer is unknown, place it in the remove-set
   * - If the signer is in the remove-set, keep the SignerRemove higher order (using signerMessageOrder)
   * - If the signer in the add-set, move it to the remove-set if the SignerRemove has the highest order
   *   (using signerMessageOrder)
   */
  private async mergeSignerRemove(message: SignerRemove): Promise<void> {
    const { fid } = message.data;
    const custodyAddress = sanitizeSigner(message.signer);
    const signerKey = sanitizeSigner(message.data.body.delegate);

    if (custodyAddress === signerKey)
      throw new Error('SignerSet.mergeSignerRemove: signer and delegate must be different');

    // If the signer is in the remove-set and the SignerRemove has a higher order, do nothing
    const existingSignerRemove = await ResultAsync.fromPromise(
      this._db.getSignerRemove(fid, custodyAddress, signerKey),
      () => undefined
    );
    if (existingSignerRemove.isOk()) {
      if (this.signerMessageCompare(message, existingSignerRemove.value) <= 0) {
        return undefined;
      }
    }

    // If the signer is in the add-set and the SignerAdd has a higher order, do nothing
    const existingSignerAdd = await ResultAsync.fromPromise(
      this._db.getSignerAdd(fid, custodyAddress, signerKey),
      () => undefined
    );
    if (existingSignerAdd.isOk()) {
      if (this.signerMessageCompare(message, existingSignerAdd.value) <= 0) {
        return undefined;
      }
    }

    // Add the SignerRemove to the remove-set and remove SignerAdd if it exists
    await this._db.putSignerRemove(message);

    // Emit a RemoveSigner event if the removed Signer was currently valid
    const currentCustodyAddress = await ResultAsync.fromPromise(this.getCustodyAddress(fid), () => undefined);
    if (currentCustodyAddress.isOk() && currentCustodyAddress.value === custodyAddress) {
      this.emit('removeSigner', fid, signerKey, message);
    }

    return undefined;
  }
}

export default SignerSet;
