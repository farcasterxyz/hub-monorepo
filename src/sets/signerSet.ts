import { TypedEmitter } from 'tiny-typed-emitter';
import { Result, ok, err } from 'neverthrow';
import { CustodyAddEvent, CustodyRemoveAll, SignerAdd, SignerMessage, SignerRemove } from '~/types';
import { isCustodyRemoveAll, isSignerAdd, isSignerRemove } from '~/types/typeguards';
import { hashCompare } from '~/utils';

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

  sanitizeKey(key: string): string {
    return key.toLowerCase();
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
   * addCustody adds a custody address to custodyAdds set.
   *
   * @param event - event from Farcaster ID Registry
   */
  addCustody(event: CustodyAddEvent): Result<void, string> {
    const sanitizedAddress = this.sanitizeKey(event.custodyAddress);

    // If custody exists in custodyAdds
    const existingCustodyAdd = this._custodyAdds.get(sanitizedAddress);
    if (existingCustodyAdd) {
      // If existing block number wins (greater or equal), no-op
      if (existingCustodyAdd.blockNumber >= event.blockNumber) return ok(undefined);
    }

    // If custody exists in custodyRemoves
    const existingCustodyRemove = this._custodyRemoves.get(sanitizedAddress);
    if (existingCustodyRemove) {
      const existingCustodyAddEvent = this._custodyAdds.get(this.sanitizeKey(existingCustodyRemove.signer));

      if (existingCustodyAddEvent) {
        // If existing block number wins (same or greater block), no-op
        if (existingCustodyAddEvent.blockNumber > event.blockNumber) return ok(undefined);

        // If new block number wins, remove address from removes
        if (existingCustodyAddEvent.blockNumber < event.blockNumber) {
          this._custodyRemoves.delete(sanitizedAddress);
        }
      }
    }

    this._custodyAdds.set(sanitizedAddress, event);
    this.emit('addCustody', sanitizedAddress);
    return ok(undefined);
  }

  /**
   * Private Methods
   */

  /**
   * mergeCustodyRemoveAll moves all address in custodyAdds with a block number before the
   * signer of the CustodyRemoveAll message to custodyRemoves
   *
   * @param message - CustodyRemoveAll message
   */
  private mergeCustodyRemoveAll(message: CustodyRemoveAll): Result<void, string> {
    const sanitizedAddress = this.sanitizeKey(message.signer);

    // If custodyAddress exists in custodyRemoves, no-op
    if (this._custodyRemoves.has(sanitizedAddress)) return ok(undefined);

    // If custodyAddress does not exist in custodyAdds, fail
    const custodyAddEvent = this._custodyAdds.get(sanitizedAddress);
    if (!custodyAddEvent) return err('SignerSet.mergeCustodyRemoveAll: custodyAddress does not exist');

    // For each custody address, remove if block number is before signer
    for (const [address, addEvent] of this._custodyAdds) {
      if (addEvent.blockNumber < custodyAddEvent.blockNumber) {
        // Look through signerAdds
        for (const [signerKey, signerAdd] of this._signerAdds) {
          if (this.sanitizeKey(signerAdd.signer) === address) {
            this._signerAdds.delete(signerKey);
            this.emit('removeSigner', signerKey);
          }
        }

        // Look through signerRemoves
        for (const [signerKey, signerRemove] of this._signerRemoves) {
          if (this.sanitizeKey(signerRemove.signer) === address) {
            this._signerRemoves.delete(signerKey);
          }
        }

        // Look through custodyRemoves
        for (const [custodyAddress, custodyRemoveAll] of this._custodyRemoves) {
          if (this.sanitizeKey(custodyRemoveAll.signer) === address) {
            this._custodyRemoves.delete(custodyAddress);
          }
        }

        this._custodyAdds.delete(address);
        this._custodyRemoves.set(address, message);
        this.emit('removeCustody', address);
      }
    }

    return ok(undefined);
  }

  /**
   * mergeSignerAdd tries to add a new signer with a SignerAdd message
   *
   * @param message - a SignerAdd message
   */
  private mergeSignerAdd(message: SignerAdd): Result<void, string> {
    const custodyAddress = this.sanitizeKey(message.signer);
    const signerKey = this.sanitizeKey(message.data.body.childKey);

    // If custody address has been removed, no-op
    if (this._custodyRemoves.has(custodyAddress)) return ok(undefined);

    // If custody address is missing, fail
    const custodyAddEvent = this._custodyAdds.get(custodyAddress);
    if (!custodyAddEvent) return err('SignerSet.mergeSignerAdd: custodyAddress does not exist');

    // If signer add exists
    const existingSignerAdd = this._signerAdds.get(signerKey);
    if (existingSignerAdd) {
      const existingCustodyAddEvent = this._custodyAdds.get(this.sanitizeKey(existingSignerAdd.signer));

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
      const existingCustodyAddEvent = this._custodyAdds.get(this.sanitizeKey(existingSignerRemove.signer));

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
   * mergeSignerRemove tries to remove a signer with a SignerRemove message
   *
   * @param message - a SignerRemove message
   */
  private mergeSignerRemove(message: SignerRemove): Result<void, string> {
    const custodyAddress = this.sanitizeKey(message.signer);
    const signerKey = this.sanitizeKey(message.data.body.childKey);

    // If custody address has been removed, no-op
    if (this._custodyRemoves.has(custodyAddress)) return ok(undefined);

    // If custody address is missing, fail
    const custodyAddEvent = this._custodyAdds.get(custodyAddress);
    if (!custodyAddEvent) return err('SignerSet.mergeSignerRemove: custodyAddress does not exist');

    // If signer remove exists
    const existingSignerRemove = this._signerRemoves.get(signerKey);
    if (existingSignerRemove) {
      const existingCustodyAddEvent = this._custodyAdds.get(this.sanitizeKey(existingSignerRemove.signer));

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
      const existingCustodyAddEvent = this._custodyAdds.get(this.sanitizeKey(existingSignerAdd.signer));

      if (existingCustodyAddEvent) {
        // If existing block number wins (greater only), no-op
        if (existingCustodyAddEvent.blockNumber > custodyAddEvent.blockNumber) return ok(undefined);

        // If new block number wins (same block number or greater), remove signer from adds
        if (existingCustodyAddEvent.blockNumber <= custodyAddEvent.blockNumber) {
          this._signerAdds.delete(signerKey);
        }
      }
    }

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
