import { TypedEmitter } from 'tiny-typed-emitter';
import { ResultAsync } from 'neverthrow';
import { IDRegistryEvent, SignerAdd, SignerMessage, SignerRemove } from '~/types';
import { isSignerAdd, isSignerRemove } from '~/types/typeguards';
import { hashCompare, sanitizeSigner } from '~/utils';
import RocksDB from '~/db/rocksdb';
import SignerDB from '~/db/signer';

export type SignerSetEvents = {
  /**
   * changeCustody is emitted when custody address changes by merging a new Register or Transfer event
   * from the Farcaster ID Registry
   */
  changeCustody: (fid: number, custodyAddress: string, event: IDRegistryEvent) => void;

  /**
   * addSigner is emitted when a delegate signer becomes valid which can happen in two ways:
   * 1. A SignerAdd message is merged which adds a new delegate signer for the current custody address
   * 2. The custody address changes, and a SignerAdd message that was previously merged from the new custody
   *    address becomes valid
   *
   * Note: addSigner is NOT emitted when a SignerAdd message is merged that was signed by any custody
   * address other than the current one
   */
  addSigner: (fid: number, signerKey: string, message: SignerAdd) => void;

  /**
   * removesSigner is emitted when a delegate signer becomes invalid which can happen in two ways:
   * 1. A SignerRemove message is merged which removes a delegate signer for the current custody address
   * 2. The custody address changes, and a delegate signer has not had a SignerAdd message merged from the
   *    new custody address, so it is no longer valid
   *
   * Note: the message parameter in removeSigner is optional, because in case (2) above we don't have
   * a relevant SignerRemove message to share
   */
  removeSigner: (fid: number, signerKey: string, message?: SignerRemove) => void;
};

/**
 * The SignerSet manages custody addresses and delegate signers. Custody addresses are changed via events from
 * the Farcaster IDRegistry contract, and delegate signers are added and removed via SignerAdd and SignerRemove
 * messages respectively, which are signed by custody addresses.
 *
 * Read more in the Farcaster protocol docs: https://github.com/farcasterxyz/protocol#45-signer-authorizations
 *
 * This implementation is a modified LWW set that stores and fetches delegate signers for each custody address,
 * even addresses that the IDRegistry contract hasn't seen yet or that have been overwritten. IDRegistryEvent objects
 * and SignerAdd and SignerRemove messages are stored in the SignerDB.
 *
 * For a given custody address, conflicts between signer messages are resolved in this order:
 * 1. Message with a later timestamp wins
 * 2. If messages have the same timestamp, SignerRemove message wins
 * 3. If both messages have the same type, message with higher lexicographic hash wins
 */
class SignerSet extends TypedEmitter<SignerSetEvents> {
  private _db: SignerDB;

  constructor(db: RocksDB) {
    super();
    this._db = new SignerDB(db);
  }

  async getUsers(): Promise<Set<number>> {
    const fids = await this._db.getUsers();
    return new Set(fids);
  }

  async getCustodyAddress(fid: number): Promise<string> {
    const event = await this.getCustodyEvent(fid);
    return sanitizeSigner(event.args.to);
  }

  async getCustodyEvent(fid: number): Promise<IDRegistryEvent> {
    return this._db.getCustodyEvent(fid);
  }

  /** getSigners returns the set of valid delegate signers for the current custody address */
  async getSigners(fid: number): Promise<Set<SignerAdd>> {
    const custodyAddress = await this.getCustodyAddress(fid);
    const signerAdds = await this._db.getSignerAddsByUser(fid, custodyAddress);
    return new Set(signerAdds);
  }

  /** getSigner returns the SignerAdd message for a delegate signer if the signer is valid */
  async getSigner(fid: number, signerKey: string): Promise<SignerAdd> {
    const custodyAddress = await this.getCustodyAddress(fid);
    return this._db.getSignerAdd(fid, custodyAddress, sanitizeSigner(signerKey));
  }

  async getAllSignerMessagesByUser(fid: number): Promise<Set<SignerMessage>> {
    const messages = await this._db.getAllSignerMessagesByUser(fid);
    return new Set(messages);
  }

  /** merge tries to merge a SignerAdd or SignerRemove message into the set */
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
   * mergeIDRegistryEvent will update the custody address, validate or invalidate delegate signers and emit events.
   * The IDRegistryEvent must be accurate otherwise local state will diverge from blockchain state. If IDRegistryEvents
   * are received out of order, some events may not be emitted.
   */
  async mergeIDRegistryEvent(event: IDRegistryEvent): Promise<void> {
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

  /**
   * Private Methods
   */

  /**
   * eventCompare returns an order (-1, 0, 1) for two ID Registry events (a and b). If a occurs before
   * b, return -1. If a occurs after b, return 1. If a and b are the same event, return 0.
   *
   * The method compares these attributes of the events (in order):
   * 1. blockNumber
   * 2. logIndex
   * 3. Lexicographic order of transactionHash
   *
   * Two events are identical if their transactionHash, logIndex, and blockNumber are the same
   */
  private eventCompare(a: IDRegistryEvent, b: IDRegistryEvent): number {
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
   * signerMessageCompare returns an order (-1, 0, 1) for two signer messages (a and b). If a occurs before
   * b, return -1. If a occurs after b, return 1. If a and b cannot be ordered (i.e. they are the same
   * message), return 0.
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
   * mergeSignerAdd tries to add a new delegate signer with a SignerAdd message. The method follows this high-level logic:
   * - If the new signer has never been seen, add it
   * - If the new signer has already been added, keep the add message with a higher order (using signerMessageOrder)
   * - If the new signer has already been removed, re-add the signer if the add message has a higher order than
   *   the relevant remove message (using signerMessageOrder)
   *
   * Note: Signer messages are only compared against other messages from the same custody address.
   */
  private async mergeSignerAdd(message: SignerAdd): Promise<void> {
    const { fid } = message.data;
    const custodyAddress = sanitizeSigner(message.signer);
    const signerKey = sanitizeSigner(message.data.body.delegate);

    if (custodyAddress === signerKey)
      throw new Error('SignerSet.mergeSignerAdd: signer and delegate must be different');

    // Check if the new signer has already been added
    const existingSignerAdd = await ResultAsync.fromPromise(
      this._db.getSignerAdd(fid, custodyAddress, signerKey),
      () => undefined
    );
    if (existingSignerAdd.isOk()) {
      if (this.signerMessageCompare(message, existingSignerAdd.value) <= 0) {
        return undefined;
      }
    }

    const existingSignerRemove = await ResultAsync.fromPromise(
      this._db.getSignerRemove(fid, custodyAddress, signerKey),
      () => undefined
    );
    if (existingSignerRemove.isOk()) {
      if (this.signerMessageCompare(message, existingSignerRemove.value) <= 0) {
        return undefined;
      }
    }

    // Add the new signer add message
    await this._db.putSignerAdd(message);

    // If the signer of the new message is the current custody address, emit an addSigner event
    const currentCustodyAddress = await ResultAsync.fromPromise(this.getCustodyAddress(fid), () => undefined);
    if (currentCustodyAddress.isOk() && currentCustodyAddress.value === custodyAddress) {
      this.emit('addSigner', fid, signerKey, message);
    }

    return undefined;
  }

  /**
   * mergeSignerRemove tries to remove a delegate signer with a SignerRemove message. The method follows this high-level logic:
   * - If the signer has never been seen, add it to removes as a tombstone
   * - If the signer has already been removed, keep the remove message with a higher order (using signerMessageOrder)
   * - If the signer has already been added, remove the signer if the remove message has a higher order than
   *   the relevant add message (using signerMessageOrder)
   *
   * Note: Signer messages are only compared against other messages from the same custody address.
   */
  private async mergeSignerRemove(message: SignerRemove): Promise<void> {
    const { fid } = message.data;
    const custodyAddress = sanitizeSigner(message.signer);
    const signerKey = sanitizeSigner(message.data.body.delegate);

    if (custodyAddress === signerKey)
      throw new Error('SignerSet.mergeSignerRemove: signer and delegate must be different');

    // Check if the signer has already been removed
    const existingSignerRemove = await ResultAsync.fromPromise(
      this._db.getSignerRemove(fid, custodyAddress, signerKey),
      () => undefined
    );
    if (existingSignerRemove.isOk()) {
      if (this.signerMessageCompare(message, existingSignerRemove.value) <= 0) {
        return undefined;
      }
    }

    // Check if the signer has already been added
    const existingSignerAdd = await ResultAsync.fromPromise(
      this._db.getSignerAdd(fid, custodyAddress, signerKey),
      () => undefined
    );
    if (existingSignerAdd.isOk()) {
      if (this.signerMessageCompare(message, existingSignerAdd.value) <= 0) {
        return undefined;
      }
    }

    // Add the new signer remove message
    await this._db.putSignerRemove(message);

    // If the signer of the new message is the current custody address, emit an addSigner event
    const currentCustodyAddress = await ResultAsync.fromPromise(this.getCustodyAddress(fid), () => undefined);
    if (currentCustodyAddress.isOk() && currentCustodyAddress.value === custodyAddress) {
      this.emit('removeSigner', fid, signerKey, message);
    }

    return undefined;
  }
}

export default SignerSet;
