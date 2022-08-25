import { TypedEmitter } from 'tiny-typed-emitter';
import { Result, ok, err } from 'neverthrow';
import { IDRegistryEvent, SignerAdd, SignerMessage, SignerRemove } from '~/types';
import { isSignerAdd, isSignerRemove } from '~/types/typeguards';
import { hashCompare, sanitizeSigner } from '~/utils';

// TODO: update comments
/*   
  SignerSet manages the account's associated custody addresses authorized 
  for Signing and their corresponding delegates.

  Read more about the SignerSet in the protocol docs: https://github.com/farcasterxyz/protocol#45-signer-authorizations

  This implementation uses a modified 2P2P set. There are four sets in total:

  (1) custodyAdds: add set for custody addresses
  (2) custodyRemoves: remove set for custody addresses
  (3) signerAdds: add set for delegate signers
  (4) signerRemoves: remove set for delegate signers

  Each message is signed by a custody address that was added via a particular ID Registry event (Register or Transfer).
  Conflicts are resolved in this order:
  - Higher event order (block number + log index + transaction hash) wins
  - If event order is the same (i.e. the custody addresses are the same because they were added in the same event)
    - Removes win
    - If two messages have the same type (i.e. both adds)
      - Custody address with the higher lexicographical order wins
      - If custody addresses have the same order (i.e. they are identical)
        - Message with higher lexicographical hash wins
*/

export type SignerSetEvents = {
  changeCustody: (custodyAddress: string, event: IDRegistryEvent) => void;
  // addSigner and removeSigner have optional messages, because when a signer is revoked
  // there is not a relevant SignerAdd or SignerRemove message to share
  addSigner: (signerKey: string, message?: SignerAdd) => void;
  removeSigner: (signerKey: string, message?: SignerRemove) => void;
};

type CustodySigners = { adds: Map<string, SignerAdd>; removes: Map<string, SignerRemove> };

class SignerSet extends TypedEmitter<SignerSetEvents> {
  private _custodyEvent?: IDRegistryEvent;
  private _signersByCustody: Map<string, CustodySigners>;

  constructor() {
    super();
    this._signersByCustody = new Map();
  }

  private get _custodyAddress(): string | undefined {
    return this._custodyEvent ? sanitizeSigner(this._custodyEvent.args.to) : undefined;
  }

  private get _custodySigners(): CustodySigners | undefined {
    return this._custodyAddress ? this._signersByCustody.get(this._custodyAddress) : undefined;
  }

  getCustodyAddress(): string | undefined {
    return this._custodyAddress;
  }

  getCustodyAddressEvent(): IDRegistryEvent | undefined {
    return this._custodyEvent;
  }

  getSigners(): Set<string> {
    return this._custodySigners ? new Set([...this._custodySigners.adds.keys()]) : new Set();
  }

  get(signer: string): SignerAdd | undefined {
    return this._custodySigners ? this._custodySigners.adds.get(sanitizeSigner(signer)) : undefined;
  }

  merge(message: SignerMessage): Result<void, string> {
    if (isSignerRemove(message)) {
      return this.mergeSignerRemove(message);
    }

    if (isSignerAdd(message)) {
      return this.mergeSignerAdd(message);
    }

    return err('SignerSet.merge: invalid message format');
  }

  mergeIDRegistryEvent(event: IDRegistryEvent): Result<void, string> {
    // If new event is a duplicate or occured before the existing custodyEvent, no-op
    if (this._custodyEvent && this.eventCompare(event, this._custodyEvent) <= 0) {
      return ok(undefined);
    }

    // Get custody address and signers about to be removed
    const oldSigners = this._custodySigners;

    // Update custodyEvent and emit a changeCustody event
    const newCustodyAddress = sanitizeSigner(event.args.to);
    this._custodyEvent = event;
    this.emit('changeCustody', newCustodyAddress, event);

    // Emit removeSigner events for all signers that are no longer valid
    if (oldSigners) {
      for (const signer of oldSigners.adds.keys()) {
        if (!this._custodySigners || !this._custodySigners.adds.has(signer)) {
          this.emit('removeSigner', signer); // No SignerRemove message to include
        }
      }
    }

    // Emit addSigner events for all signers that are now valid, even ones that already existed
    // in oldSigners.adds, because we want to make sure an addSigner event has been emitted with the
    // relevant SignerAdd message
    if (this._custodySigners) {
      for (const [signer, message] of this._custodySigners.adds) {
        this.emit('addSigner', signer, message);
      }
    }

    // Clean up signersByCustody object
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
   * mergeSignerAdd tries to add a new signer with a SignerAdd message. The method follows this high-level logic:
   * - If the new signer has never been seen, add it
   * - If the new signer is already in signerAdds, keep the entry that was signed by a custody address with a higher event order
   * - If the new signer is in signerRemoves, find the custody address that removed it and compare that address with the signer
   *   (custody address) of the new SignerAdd message. If the signer of the new message was added later, move the signer to signerAdds.
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
   * mergeSignerRemove tries to remove a signer with a SignerRemove message. The method follows this high-level logic:
   * - If the new signer has never been seen, add it to signerRemoves as a tombstone
   * - If the new signer is already in signerRemoves, keep the entry that was signed by a more recent custody address
   * - If the new signer is in signerAdds, find the custody address that added it and compare that address with the signer (custody
   *   address) of the new SignerRemove message. If the signer of the new message was added later, move the signer to signerRemoves.
   */
  private mergeSignerRemove(message: SignerRemove): Result<void, string> {
    const custodyAddress = sanitizeSigner(message.signer);
    const signerKey = sanitizeSigner(message.data.body.delegate);

    if (custodyAddress === signerKey) return err('SignerSet.mergeSignerRemove: signer and delegate must be different');

    let signers = this._signersByCustody.get(custodyAddress);
    if (!signers) {
      signers = { adds: new Map(), removes: new Map() };
    }

    // Check if the new signer has already been removed
    const existingSignerRemove = signers.removes.get(signerKey);
    if (existingSignerRemove && this.signerMessageCompare(message, existingSignerRemove) <= 0) {
      return ok(undefined);
    }

    // Check if the new signer has already been added
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
