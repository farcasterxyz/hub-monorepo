import { TypedEmitter } from 'tiny-typed-emitter';
import { Result, ok, err } from 'neverthrow';
import { IDRegistryEvent, SignerAdd, SignerMessage, SignerRemove } from '~/types';
import { isSignerAdd, isSignerRemove } from '~/types/typeguards';
import { hashCompare, sanitizeSigner } from '~/utils';

/**
 * SignerSet manages the custody address and delegate signers for an fid. The custody address
 * is changed via events from the Farcaster ID Registry contract, and delegate signers are
 * added and removed via SignerAdd and SignerRemove messages, respectively.
 *
 * Read more in the Farcaster protocol docs: https://github.com/farcasterxyz/protocol#45-signer-authorizations
 *
 * This implementation stores a modified LWW set of delegate signers for each custody address, even addresses
 * that the class hasn't seen yet or that have been overwritten. For a given custody address, conflicts
 * between signer messages are resolved in this order:
 * 1. Message with a later timestamp wins
 * 2. If messages have the same timestamp, SignerRemove message wins
 * 3. If both messages have the same type, message with higher lexicographic hash wins
 */

export type SignerSetEvents = {
  /**
   * changeCustody is emitted when custody address changes by merging a new Register or Transfer event
   * from the Farcaster ID Registry
   */
  changeCustody: (custodyAddress: string, event: IDRegistryEvent) => void;

  /**
   * addSigner is emitted when a delegate signer becomes valid which can happen in two ways:
   * 1. A SignerAdd message is merged which adds a new delegate signer for the current custody address
   * 2. The custody address changes, and a SignerAdd message that was previously merged from the new custody
   *    address becomes valid
   *
   * Note: addSigner is NOT emitted when a SignerAdd message is merged that was signed by any custody
   * address other than the current one
   */
  addSigner: (signerKey: string, message: SignerAdd) => void;

  /**
   * removesSigner is emitted when a delegate signer becomes invalid which can happen in two ways:
   * 1. A SignerRemove message is merged which removes a delegate signer for the current custody address
   * 2. The custody address changes, and a delegate signer has not had a SignerAdd message merged from the
   *    new custody address, so it is no longer valid
   *
   * Note: the message parameter in removeSigner is optional, because in case (2) above we don't have
   * a relevant SignerRemove message to share
   */
  removeSigner: (signerKey: string, message?: SignerRemove) => void;
};

/** CustodySigners represents the structure of each the LWW sets inside signersByCustody */
type CustodySigners = { adds: Map<string, SignerAdd>; removes: Map<string, SignerRemove> };

class SignerSet extends TypedEmitter<SignerSetEvents> {
  private _custodyEvent?: IDRegistryEvent;
  private _signersByCustody: Map<string, CustodySigners>;

  constructor() {
    super();
    this._signersByCustody = new Map();
  }

  getCustodyAddress(): string | undefined {
    return this._custodyAddress;
  }

  getCustodyAddressEvent(): IDRegistryEvent | undefined {
    return this._custodyEvent;
  }

  /** getSigners returns the set of valid delegate signers for the current custody address */
  getSigners(): Set<string> {
    return this._custodySigners ? new Set([...this._custodySigners.adds.keys()]) : new Set();
  }

  /** get returns the SignerAdd message for a delegate signer if the signer is valid */
  get(signer: string): SignerAdd | undefined {
    return this._custodySigners ? this._custodySigners.adds.get(sanitizeSigner(signer)) : undefined;
  }

  /** merge tries to merge a SignerAdd or SignerRemove message into the set */
  merge(message: SignerMessage): Result<void, string> {
    if (isSignerRemove(message)) {
      return this.mergeSignerRemove(message);
    }

    if (isSignerAdd(message)) {
      return this.mergeSignerAdd(message);
    }

    return err('SignerSet.merge: invalid message format');
  }

  /** mergeIDRegistryEvent tries to update the custody address with an event from the Farcaster ID Registry contract. */
  mergeIDRegistryEvent(event: IDRegistryEvent): Result<void, string> {
    // If new event is a duplicate or occured before the existing custodyEvent, no-op
    if (this._custodyEvent && this.eventCompare(event, this._custodyEvent) <= 0) {
      return ok(undefined);
    }

    // Get LWW set of signers about to be removed
    const oldSigners = this._custodySigners;

    // Update custodyEvent and emit a changeCustody event
    const newCustodyAddress = sanitizeSigner(event.args.to);
    this._custodyEvent = event;
    this.emit('changeCustody', newCustodyAddress, event);

    // Emit removeSigner events for all delegate signers that are no longer valid, meaning the set has not merged
    // a SignerAdd message for that delegate from the new custody address
    if (oldSigners) {
      for (const signer of oldSigners.adds.keys()) {
        if (!this._custodySigners || !this._custodySigners.adds.has(signer)) {
          this.emit('removeSigner', signer); // No SignerRemove message to include
        }
      }
    }

    // Emit addSigner events for all delegate signers that are now valid, even ones that already existed
    // in oldSigners.adds, because we want to make sure an addSigner event has been emitted with the
    // most up-to-date SignerAdd message for each delegate signer
    if (this._custodySigners) {
      for (const [signer, message] of this._custodySigners.adds) {
        this.emit('addSigner', signer, message);
      }
    }

    // Clean up signersByCustody object by deleting all entries that are not for the new custody address
    // TODO: consider running this cleanup asynchronously on some cadence rather than only when a transfer happens
    for (const custodyAddress of this._signersByCustody.keys()) {
      if (custodyAddress !== newCustodyAddress) {
        this._signersByCustody.delete(custodyAddress);
      }
    }

    return ok(undefined);
  }

  /**
   * Private Methods
   */

  /** Reurns the derived custody address from the current custody event, if defined */
  private get _custodyAddress(): string | undefined {
    return this._custodyEvent ? sanitizeSigner(this._custodyEvent.args.to) : undefined;
  }

  /** Returns the LWW set of signers for the current custody address, if defined */
  private get _custodySigners(): CustodySigners | undefined {
    return this._custodyAddress ? this._signersByCustody.get(this._custodyAddress) : undefined;
  }

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
  private mergeSignerAdd(message: SignerAdd): Result<void, string> {
    const custodyAddress = sanitizeSigner(message.signer);
    const signerKey = sanitizeSigner(message.data.body.delegate);

    if (custodyAddress === signerKey) return err('SignerSet.mergeSignerAdd: signer and delegate must be different');

    let signers = this._signersByCustody.get(custodyAddress);
    if (!signers) {
      signers = { adds: new Map(), removes: new Map() };
    }

    // Check if the new signer has already been added
    const existingSignerAdd = signers.adds.get(signerKey);
    if (existingSignerAdd && this.signerMessageCompare(message, existingSignerAdd) <= 0) {
      return ok(undefined);
    }

    // Check if the new signer has already been removed
    const existingSignerRemove = signers.removes.get(signerKey);
    if (existingSignerRemove) {
      if (this.signerMessageCompare(message, existingSignerRemove) <= 0) {
        return ok(undefined);
      }

      signers.removes.delete(signerKey);
    }

    // Add the new signer and update signersByCustody
    signers.adds.set(signerKey, message);
    this._signersByCustody.set(custodyAddress, signers);

    // If the signer of the new message is the current custody address, emit an addSigner event
    if (custodyAddress === this._custodyAddress) {
      this.emit('addSigner', signerKey, message);
    }

    return ok(undefined);
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
  private mergeSignerRemove(message: SignerRemove): Result<void, string> {
    const custodyAddress = sanitizeSigner(message.signer);
    const signerKey = sanitizeSigner(message.data.body.delegate);

    if (custodyAddress === signerKey) return err('SignerSet.mergeSignerRemove: signer and delegate must be different');

    let signers = this._signersByCustody.get(custodyAddress);
    if (!signers) {
      signers = { adds: new Map(), removes: new Map() };
    }

    // Check if the signer has already been removed
    const existingSignerRemove = signers.removes.get(signerKey);
    if (existingSignerRemove && this.signerMessageCompare(message, existingSignerRemove) <= 0) {
      return ok(undefined);
    }

    // Check if the signer has already been added
    const existingSignerAdd = signers.adds.get(signerKey);
    if (existingSignerAdd) {
      if (this.signerMessageCompare(message, existingSignerAdd) <= 0) {
        return ok(undefined);
      }

      signers.adds.delete(signerKey);
    }

    // Remove the signer and update signersByCustody
    signers.removes.set(signerKey, message);
    this._signersByCustody.set(custodyAddress, signers);

    // If the signer of the new message is the current custody address, emit a removeSigner event
    if (custodyAddress === this._custodyAddress) {
      this.emit('removeSigner', signerKey, message);
    }

    return ok(undefined);
  }

  /**
   * Testing Methods
   */

  _reset(): void {
    this._custodyEvent = undefined;
    this._signersByCustody = new Map();
  }

  _getSignersByCustody() {
    return this._signersByCustody;
  }

  _getCustodySigners() {
    return this._custodySigners;
  }
}

export default SignerSet;
