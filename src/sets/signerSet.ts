import { TypedEmitter } from 'tiny-typed-emitter';
import { Result, ok, err } from 'neverthrow';
import { CustodyRemoveAll, IDRegistryEvent, SignerAdd, SignerMessage, SignerRemove } from '~/types';
import { isCustodyRemoveAll, isSignerAdd, isSignerRemove } from '~/types/typeguards';
import { hashCompare, sanitizeSigner } from '~/utils';

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
  addCustody: (custodyAddress: string, event: IDRegistryEvent) => void;
  removeCustody: (custodyAddress: string, message: CustodyRemoveAll) => void;
  // addSigner and removeSigner have optional messages, because when a signer is revoked
  // there is not a relevant SignerAdd or SignerRemove message to share
  addSigner: (signerKey: string, message?: SignerAdd) => void;
  removeSigner: (signerKey: string, message?: SignerRemove) => void;
};

class SignerSet extends TypedEmitter<SignerSetEvents> {
  private _custodyAdds: Map<string, IDRegistryEvent>;
  private _custodyRemoves: Map<string, CustodyRemoveAll>;
  private _signerAdds: Map<string, SignerAdd>;
  private _signerRemoves: Map<string, SignerRemove>;

  constructor() {
    super();
    this._custodyAdds = new Map();
    this._custodyRemoves = new Map();
    this._signerAdds = new Map();
    this._signerRemoves = new Map();
  }

  getCustodyAddresses(): Set<string> {
    return new Set([...this._custodyAdds.keys()]);
  }

  getDelegateSigners(): Set<string> {
    return new Set([...this._signerAdds.keys()]);
  }

  getAllSigners(): Set<string> {
    return new Set([...this.getCustodyAddresses(), ...this.getDelegateSigners()]);
  }

  get(signer: string) {
    return this.getCustody(signer) || this.getSigner(signer);
  }

  getCustody(custodyAddress: string) {
    return this._custodyAdds.get(custodyAddress);
  }

  getSigner(signer: string) {
    return this._signerAdds.get(signer);
  }

  merge(message: SignerMessage): Result<void, string> {
    if (isCustodyRemoveAll(message)) {
      return this.mergeCustodyRemoveAll(message);
    }

    if (isSignerRemove(message)) {
      return this.mergeSignerRemove(message);
    }

    if (isSignerAdd(message)) {
      return this.mergeSignerAdd(message);
    }

    return err('SignerSet.merge: invalid message format');
  }

  mergeIDRegistryEvent(event: IDRegistryEvent) {
    const sanitizedAddress = sanitizeSigner(event.args.to);

    // Check custodyAdds for the new custody address
    // If it is already added via the same event or a later one, no-op
    const existingCustodyAdd = this._custodyAdds.get(sanitizedAddress);
    if (existingCustodyAdd && this.eventCompare(existingCustodyAdd, event) >= 0) return ok(undefined);

    // Check custodyRemoves for the new custody address
    const existingCustodyRemove = this._custodyRemoves.get(sanitizedAddress);
    if (existingCustodyRemove) {
      // If it has been removed, check the removing address (custody address that signed the relevant CustodyRemoveAll message)
      const existingRegistryEvent = this._custodyAdds.get(sanitizeSigner(existingCustodyRemove.signer));
      if (existingRegistryEvent) {
        // If the removing address was added at the same time or later than the new event, no-op
        if (this.eventCompare(existingRegistryEvent, event) >= 0) return ok(undefined);
        // If the removing address was added before the new event, over-write the remove by dropping it
        this._custodyRemoves.delete(sanitizedAddress);
      } else {
        return err('SignerSet.mergeCustodyEvent: unexpected state');
      }
    }

    // Add the new custody address and emit an addCustody event
    this._custodyAdds.set(sanitizedAddress, event);
    this.emit('addCustody', sanitizedAddress, event);
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

  /**
   * mergeCustodyRemoveAll moves all addresses in custodyAdds to custodyRemoves that were added to the ID Registry
   * before the signer (custody address) of the new CustodyRemoveAll message.
   */
  private mergeCustodyRemoveAll(message: CustodyRemoveAll): Result<void, string> {
    const sanitizedAddress = sanitizeSigner(message.signer);

    // If the signer (custody address) of the remove message has already been removed, it means
    // a remove message from a later block has already been accepted and the new one is redundant
    if (this._custodyRemoves.has(sanitizedAddress)) return ok(undefined);

    // If the signer (custody address) of the remove message has not been added, fail, because
    // we need the add event to tell us what block number we should remove addresses up to
    const custodyRegistryEvent = this._custodyAdds.get(sanitizedAddress);
    if (!custodyRegistryEvent) return err('SignerSet.mergeCustodyRemoveAll: custodyAddress does not exist');

    // For each custody address, compare the event in which it was added to ID Registry to the remove message signer
    // If it was added before the remove message signer was added, drop or over-write all messages signed by
    // that address and remove it
    for (const [address, registryEvent] of this._custodyAdds) {
      if (this.eventCompare(registryEvent, custodyRegistryEvent) < 0) {
        // Drop all SignerAdd messages signed by the custody address being removed, because once the signer is
        // removed these messages would not have been accepted by the set if we received them now
        for (const [signerKey, signerAdd] of this._signerAdds) {
          if (sanitizeSigner(signerAdd.signer) === address) {
            this._signerAdds.delete(signerKey);
            this.emit('removeSigner', signerKey);
          }
        }

        // Drop all SignerRemove messages signed by the custody address being removed, because once the signer is
        // removed these messages would not have been accepted by the set if we received them now
        for (const [signerKey, signerRemove] of this._signerRemoves) {
          if (sanitizeSigner(signerRemove.signer) === address) {
            this._signerRemoves.delete(signerKey);
          }
        }

        // Over-write all custody remove messages signed by the custody address being removed. These messages
        // are not dropped because we need to preserve the tombstones of previously removed custody addresses.
        for (const [custodyAddress, custodyRemoveAll] of this._custodyRemoves) {
          if (sanitizeSigner(custodyRemoveAll.signer) === address) {
            this._custodyRemoves.set(custodyAddress, message);
            // Re-emit removeCustody event for this address so that subscribers know the custody address
            // responsible for the removal has changed
            this.emit('removeCustody', custodyAddress, message);
          }
        }

        // Once the messages signed by the custody address have been dropped or over-written, remove the custody address
        this._custodyAdds.delete(address);
        this._custodyRemoves.set(address, message);
        this.emit('removeCustody', address, message);
      }
    }

    return ok(undefined);
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

    // If the signer (custody address) of the add message has been removed, no-op
    if (this._custodyRemoves.has(custodyAddress)) return ok(undefined);

    // If the signer (custody address) of the add message has not been added, fail, because
    // we need the signer's block number to resolve conflicts
    const custodyRegistryEvent = this._custodyAdds.get(custodyAddress);
    if (!custodyRegistryEvent) return err('SignerSet.mergeSignerAdd: custodyAddress does not exist');

    // Check if the new signer has already been added. If so, lookup the custody address that signed the add message.
    const existingSignerAdd = this._signerAdds.get(signerKey);
    if (existingSignerAdd) {
      const existingRegistryEvent = this._custodyAdds.get(sanitizeSigner(existingSignerAdd.signer));
      if (existingRegistryEvent) {
        const eventOrder = this.eventCompare(existingRegistryEvent, custodyRegistryEvent);

        // If the signer (custody address) of the existing add message was added after the signer of the
        // new message, no-op
        if (eventOrder > 0) return ok(undefined);

        // If the custody addresses are the same (they were added in the same event) and the existing add message
        // has a hash with a higher lexicographical than the new one, no-op
        if (eventOrder === 0 && hashCompare(existingSignerAdd.hash, message.hash) >= 0) {
          return ok(undefined);
        }
      } else {
        return err('SignerSet.mergeSignerAdd: unexpected state');
      }
    }

    // Check if the new signer has already been removed. If so, lookup the custody address that signed the remove message.
    const existingSignerRemove = this._signerRemoves.get(signerKey);
    if (existingSignerRemove) {
      const existingRegistryEvent = this._custodyAdds.get(sanitizeSigner(existingSignerRemove.signer));
      if (existingRegistryEvent) {
        // If the signer (custody address) of the existing remove message was added at the same time or after the signer of the
        // new add message, no-op
        if (this.eventCompare(existingRegistryEvent, custodyRegistryEvent) >= 0) return ok(undefined);

        // If the signer (custody address) of the existing remove message was added before the signer (custody address)
        // of the new add message, over-write the remove message
        this._signerRemoves.delete(signerKey);
      } else {
        return err('SignerSet.mergeSignerAdd: unexpected state');
      }
    }

    // Add the new signer and emit an addSigner event
    // Note that when we are over-writing an existing add message with a new one for the same signer,
    // an addSigner event is still emitted, indicating that the message responsible for the addition has changed
    this._signerAdds.set(signerKey, message);
    this.emit('addSigner', signerKey, message);
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

    // If the signer (custody address) of the remove message has been removed, no-op
    if (this._custodyRemoves.has(custodyAddress)) return ok(undefined);

    // If the signer (custody address) of the remove message has not been added, fail, because
    // we need the signer's block number to resolve conflicts
    const custodyRegistryEvent = this._custodyAdds.get(custodyAddress);
    if (!custodyRegistryEvent) return err('SignerSet.mergeSignerRemove: custodyAddress does not exist');

    // Check if the new signer has already been removed. If so, lookup the custody address that signed the remove message.
    const existingSignerRemove = this._signerRemoves.get(signerKey);
    if (existingSignerRemove) {
      const existingRegistryEvent = this._custodyAdds.get(sanitizeSigner(existingSignerRemove.signer));
      if (existingRegistryEvent) {
        const eventOrder = this.eventCompare(existingRegistryEvent, custodyRegistryEvent);

        // If the signer (custody address) of the existing remove message was added after the signer of the
        // new message, no-op
        if (eventOrder > 0) return ok(undefined);

        // If the custody addresses are the same (they were added in the same event) and the existing remove message
        // has a hash with a higher lexicographical than the new one, no-op
        if (eventOrder === 0 && hashCompare(existingSignerRemove.hash, message.hash) >= 0) {
          return ok(undefined);
        }
      } else {
        return err('SignerSet.mergeSignerRemove: unexpected state');
      }
    }

    // Check if the new signer has already been added. If so, lookup the custody address that signed the add message.
    const existingSignerAdd = this._signerAdds.get(signerKey);
    if (existingSignerAdd) {
      const existingRegistryEvent = this._custodyAdds.get(sanitizeSigner(existingSignerAdd.signer));
      if (existingRegistryEvent) {
        // If the signer (custody address) of the existing add message was added after the signer (custody address)
        // of the new remove message, no-op
        if (this.eventCompare(existingRegistryEvent, custodyRegistryEvent) > 0) return ok(undefined);

        // If the signer (custody address) of the existing add message was added at the same time or later than
        // signer (custody address) of the new remove message, over-write the add message
        this._signerAdds.delete(signerKey);
      } else {
        return err('SignerSet.mergeSignerRemove: unexpected state');
      }
    }

    // Remove the signer and emit a removeSigner event
    // Note that when we are over-writing an existing remove message with a new one for the same signer,
    // a removeSigner event is still emitted, indicating that the message responsible for the removal has changed
    this._signerRemoves.set(signerKey, message);
    this.emit('removeSigner', signerKey, message);
    return ok(undefined);
  }

  /**
   * Testing Methods
   */

  _reset(): void {
    this._custodyAdds = new Map();
    this._custodyRemoves = new Map();
    this._signerAdds = new Map();
    this._signerRemoves = new Map();
  }

  _getCustodyAdds() {
    return this._custodyAdds;
  }

  _getCustodyRemoves() {
    return this._custodyRemoves;
  }

  _getSignerAdds() {
    return this._signerAdds;
  }

  _getSignerRemoves() {
    return this._signerRemoves;
  }
}

export default SignerSet;
