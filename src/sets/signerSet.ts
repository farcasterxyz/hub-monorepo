import { TypedEmitter } from 'tiny-typed-emitter';
import { Result, ok, err } from 'neverthrow';
import { CustodyAddEvent, CustodyRemoveAll, SignerAdd, SignerMessage, SignerRemove } from '~/types';
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

  Each message is signed by a custody address that was added at a particular block number.
  Conflicts are resolved in this order:
  - Higher custody block number wins
  - If custody block numbers are the same
    - Removes win
    - If two messages have the same type (i.e. both adds)
      - Custody address with the higher lexicographical order wins
      - If custody addresses have the same order (i.e. they are identical)
        - Message with higher lexicographical hash wins
*/

export type SignerSetEvents = {
  addCustody: (custodyAddress: string) => void;
  removeCustody: (custodyAddress: string) => void;
  addSigner: (signerKey: string) => void;
  removeSigner: (signerKey: string) => void;
};

class SignerSet extends TypedEmitter<SignerSetEvents> {
  private _custodyAdds: Map<string, CustodyAddEvent>;
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

  lookup(signer: string) {
    return this.lookupCustody(signer) || this.lookupSigner(signer);
  }

  lookupCustody(custodyAddress: string) {
    return this._custodyAdds.get(custodyAddress);
  }

  lookupSigner(signer: string) {
    return this._signerAdds.get(signer);
  }

  merge(message: SignerMessage | CustodyRemoveAll): Result<void, string> {
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

  /**
   * mergeCustodyEvent adds a custody address to custodyAdds set. The method follows this high-level logic:
   * - If the new address has never been seen before, add it
   * - If the new address is already in custodyAdds, keep the entry with a higher block number
   * - If the new address is in custodyRemoves, find the block number of the address that removed it
   *   and move the address to custodyAdds if the new entry has a higher block number
   *
   * @param event - event from Farcaster ID Registry
   */
  mergeCustodyEvent(event: CustodyAddEvent): Result<void, string> {
    const sanitizedAddress = sanitizeSigner(event.custodyAddress);

    // Check custodyAdds for the new custody address
    // If it is already added via an event in the same block or a later one, no-op
    const existingCustodyAdd = this._custodyAdds.get(sanitizedAddress);
    if (existingCustodyAdd && existingCustodyAdd.blockNumber >= event.blockNumber) return ok(undefined);

    // Check custodyRemoves for the new custody address
    const existingCustodyRemove = this._custodyRemoves.get(sanitizedAddress);
    if (existingCustodyRemove) {
      // If it has been removed, check the removing address (custody address that signed the relevant CustodyRemoveAll message)
      const existingCustodyAddEvent = this._custodyAdds.get(sanitizeSigner(existingCustodyRemove.signer));
      if (existingCustodyAddEvent) {
        // If the removing address was added in the same block or a later one, no-op
        if (existingCustodyAddEvent.blockNumber >= event.blockNumber) return ok(undefined);
        // If the removing address was added in an earlier block, over-write the remove by dropping it
        if (existingCustodyAddEvent.blockNumber < event.blockNumber) {
          this._custodyRemoves.delete(sanitizedAddress);
        }
      }
    }

    // Add the new custody address and emit an addCustody event
    this._custodyAdds.set(sanitizedAddress, event);
    this.emit('addCustody', sanitizedAddress);
    return ok(undefined);
  }

  /**
   * Private Methods
   */

  /**
   * mergeCustodyRemoveAll moves all address in custodyAdds with a block number before the
   * signer of the CustodyRemoveAll message to custodyRemoves.
   *
   * Custody addresses that were added in the same block as the signer of the CustodyRemoveAll
   * message will not be removed.
   *
   * @param message - CustodyRemoveAll message
   */
  private mergeCustodyRemoveAll(message: CustodyRemoveAll): Result<void, string> {
    const sanitizedAddress = sanitizeSigner(message.signer);

    // If custodyAddress exists in custodyRemoves, no-op
    if (this._custodyRemoves.has(sanitizedAddress)) return ok(undefined);

    // If custodyAddress does not exist in custodyAdds, fail
    const custodyAddEvent = this._custodyAdds.get(sanitizedAddress);
    if (!custodyAddEvent) return err('SignerSet.mergeCustodyRemoveAll: custodyAddress does not exist');

    // For each custody address, remove if block number is before signer
    for (const [address, addEvent] of this._custodyAdds) {
      if (addEvent.blockNumber < custodyAddEvent.blockNumber) {
        // Before we remove the custody address, we should revoke the signer by dropping all messages signed
        // by that custody address from the set

        // Drop all SignerAdd messages signed by the custody address being removed
        for (const [signerKey, signerAdd] of this._signerAdds) {
          if (sanitizeSigner(signerAdd.signer) === address) {
            this._signerAdds.delete(signerKey);
            this.emit('removeSigner', signerKey);
          }
        }

        // Drop all SignerRemove messages signed by the custody address being removed
        for (const [signerKey, signerRemove] of this._signerRemoves) {
          if (sanitizeSigner(signerRemove.signer) === address) {
            this._signerRemoves.delete(signerKey);
          }
        }

        // Drop all CustodyRemoveAll messages signed by the custody address being removed
        for (const [custodyAddress, custodyRemoveAll] of this._custodyRemoves) {
          if (sanitizeSigner(custodyRemoveAll.signer) === address) {
            this._custodyRemoves.delete(custodyAddress);
          }
        }

        // Once the messages signed by the custody address have been dropped, remove the custody address
        this._custodyAdds.delete(address);
        this._custodyRemoves.set(address, message);
        this.emit('removeCustody', address);
      }
    }

    return ok(undefined);
  }

  /**
   * mergeSignerAdd tries to add a new signer with a SignerAdd message. The method follows this high-level logic:
   * - If the new signer has never been seen, add it
   * - If the new signer is already in signerAdds, keep the entry that was signed by a custody address with a higher block number
   * - If the new signer is in signerRemoves, find the block number of the address that removed it and move the address
   *   to signerAdds if the new entry was signed by an address with a higher block number
   *
   * @param message - a SignerAdd message
   */
  private mergeSignerAdd(message: SignerAdd): Result<void, string> {
    const custodyAddress = sanitizeSigner(message.signer);
    const signerKey = sanitizeSigner(message.data.body.delegate);

    // If custody address has been removed, no-op
    if (this._custodyRemoves.has(custodyAddress)) return ok(undefined);

    // If custody address is missing, fail
    const custodyAddEvent = this._custodyAdds.get(custodyAddress);
    if (!custodyAddEvent) return err('SignerSet.mergeSignerAdd: custodyAddress does not exist');

    // If signer add exists
    const existingSignerAdd = this._signerAdds.get(signerKey);
    if (existingSignerAdd) {
      const existingCustodyAddEvent = this._custodyAdds.get(sanitizeSigner(existingSignerAdd.signer));

      if (existingCustodyAddEvent) {
        // If existing block number wins, no-op
        if (existingCustodyAddEvent.blockNumber > custodyAddEvent.blockNumber) return ok(undefined);

        // If block numbers are the same
        if (existingCustodyAddEvent.blockNumber === custodyAddEvent.blockNumber) {
          // If the custody addresses are the same and existing signer add has the same or higher hash, no-op
          if (
            existingCustodyAddEvent.custodyAddress === custodyAddEvent.custodyAddress &&
            hashCompare(existingSignerAdd.hash, message.hash) >= 0
          ) {
            return ok(undefined);
          }

          // If the custody addreses are different and existing custody address has a higher order, no-op
          if (
            existingCustodyAddEvent.custodyAddress !== custodyAddEvent.custodyAddress &&
            hashCompare(existingCustodyAddEvent.custodyAddress, custodyAddress) >= 0
          ) {
            return ok(undefined);
          }
        }
      }
    }

    // If signer remove exists
    const existingSignerRemove = this._signerRemoves.get(signerKey);
    if (existingSignerRemove) {
      const existingCustodyAddEvent = this._custodyAdds.get(sanitizeSigner(existingSignerRemove.signer));

      if (existingCustodyAddEvent) {
        // If existing block number wins (same block number or greater), no-op
        if (existingCustodyAddEvent.blockNumber >= custodyAddEvent.blockNumber) return ok(undefined);

        // If new block number wins, remove signer from removes
        if (existingCustodyAddEvent.blockNumber < custodyAddEvent.blockNumber) {
          this._signerRemoves.delete(signerKey);
        }
      }
    }

    this._signerAdds.set(signerKey, message);
    this.emit('addSigner', signerKey);
    return ok(undefined);
  }

  /**
   * mergeSignerRemove tries to remove a signer with a SignerRemove message. The method follows this high-level logic:
   * - If the new signer has never been seen, add it to signerRemoves as a tombstone
   * - If the new signer is already in signerRemoves, keep the entry that was signed by a custody address with a higher block number
   * - If the new signer is in signerAdds, find the block number of the address that added it and move the address to
   *   signerRemoves if the new entry was signed by an address with a higher block number
   *
   * @param message - a SignerRemove message
   */
  private mergeSignerRemove(message: SignerRemove): Result<void, string> {
    const custodyAddress = sanitizeSigner(message.signer);
    const signerKey = sanitizeSigner(message.data.body.delegate);

    // If custody address has been removed, no-op
    if (this._custodyRemoves.has(custodyAddress)) return ok(undefined);

    // If custody address is missing, fail
    const custodyAddEvent = this._custodyAdds.get(custodyAddress);
    if (!custodyAddEvent) return err('SignerSet.mergeSignerRemove: custodyAddress does not exist');

    // If signer remove exists
    const existingSignerRemove = this._signerRemoves.get(signerKey);
    if (existingSignerRemove) {
      const existingCustodyAddEvent = this._custodyAdds.get(sanitizeSigner(existingSignerRemove.signer));

      if (existingCustodyAddEvent) {
        // If existing block number wins, no-op
        if (existingCustodyAddEvent.blockNumber > custodyAddEvent.blockNumber) return ok(undefined);

        // If block numbers are the same
        if (existingCustodyAddEvent.blockNumber === custodyAddEvent.blockNumber) {
          // If the custody addresses are the same and existing signer remove has the same or higher hash, no-op
          if (
            existingCustodyAddEvent.custodyAddress === custodyAddEvent.custodyAddress &&
            hashCompare(existingSignerRemove.hash, message.hash) >= 0
          ) {
            return ok(undefined);
          }

          // If the custody addreses are different and existing custody address has a higher order, no-op
          if (
            existingCustodyAddEvent.custodyAddress !== custodyAddEvent.custodyAddress &&
            hashCompare(existingCustodyAddEvent.custodyAddress, custodyAddress) >= 0
          ) {
            return ok(undefined);
          }
        }
      }
    }

    // If signer add exists
    const existingSignerAdd = this._signerAdds.get(signerKey);
    if (existingSignerAdd) {
      const existingCustodyAddEvent = this._custodyAdds.get(sanitizeSigner(existingSignerAdd.signer));

      if (existingCustodyAddEvent) {
        // If existing block number wins (greater only), no-op
        if (existingCustodyAddEvent.blockNumber > custodyAddEvent.blockNumber) return ok(undefined);

        // If new block number wins (same block number or greater), remove signer from adds
        if (existingCustodyAddEvent.blockNumber <= custodyAddEvent.blockNumber) {
          this._signerAdds.delete(signerKey);
        }
      }
    }

    // Remove signer and emit removeSigner event
    this._signerRemoves.set(signerKey, message);
    this.emit('removeSigner', signerKey);
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
