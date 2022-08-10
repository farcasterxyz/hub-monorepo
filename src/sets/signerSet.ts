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
*/
class SignerSet {
  private _custodyAdds: Map<string, CustodyAddEvent>;
  private _custodyRemoves: Map<string, CustodyRemoveAll>;
  private _signerAdds: Map<string, SignerAdd>;
  private _signerRemoves: Map<string, SignerRemove>;

  constructor() {
    this._custodyAdds = new Map();
    this._custodyRemoves = new Map();
    this._signerAdds = new Map();
    this._signerRemoves = new Map();
  }

  // TODO: add more helper functions as we integrate signer set into engine

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

    const existingCustodyAdd = this._custodyAdds.get(sanitizedAddress);
    if (existingCustodyAdd) {
      // If existing block number wins
      if (existingCustodyAdd.blockNumber > event.blockNumber) {
        return ok(undefined); // No-op
      }

      // If new block number wins, let through

      // If block number is the same
      // TODO
    }

    const existingCustodyRemove = this._custodyRemoves.get(sanitizedAddress);
    if (existingCustodyRemove) {
      // Get custody add event for signer of CustodyRemove message
      const sanitizedCompetingAddress = this.sanitizeKey(existingCustodyRemove.signer);
      const competingCustodyAddEvent = this._custodyAdds.get(sanitizedCompetingAddress);
      if (competingCustodyAddEvent) {
        // If existing block number wins
        if (competingCustodyAddEvent.blockNumber > event.blockNumber) {
          return ok(undefined); // No-op
        }

        // If new block number wins
        if (competingCustodyAddEvent.blockNumber < event.blockNumber) {
          this._custodyRemoves.delete(sanitizedAddress);
        }

        // If block number is the same
        // TODO
      }
    }

    this._custodyAdds.set(sanitizedAddress, event);
    return ok(undefined); // Success
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
    const removedCustodyAddresses = [];
    for (const [address, addEvent] of this._custodyAdds) {
      if (addEvent.blockNumber < custodyAddEvent.blockNumber) {
        this._custodyAdds.delete(address);
        this._custodyRemoves.set(address, message);
        removedCustodyAddresses.push(address);
      }
    }

    // Revoke removed custody addresses
    for (const custodyAddress of removedCustodyAddresses) {
      // TODO: revoke
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

    // If custody address has been removed
    if (this._custodyRemoves.has(custodyAddress)) return ok(undefined); // No-op
    // return err('SignerSet.mergeSignerAdd: custodyAddress has been removed');

    // If custody address is missing
    const custodyAddEvent = this._custodyAdds.get(custodyAddress);
    if (!custodyAddEvent) return err('SignerSet.mergeSignerAdd: custodyAddress does not exist');

    const existingSignerAdd = this._signerAdds.get(signerKey);
    if (existingSignerAdd) {
      const existingCustodyAddEvent = this._custodyAdds.get(this.sanitizeKey(existingSignerAdd.signer));

      if (existingCustodyAddEvent) {
        // If existing block number wins
        if (existingCustodyAddEvent.blockNumber > custodyAddEvent.blockNumber) {
          return ok(undefined); // No-op
        }

        // If new block number wins, continue execution

        // If block numbers are the same
        if (existingCustodyAddEvent.blockNumber === custodyAddEvent.blockNumber) {
          if (existingCustodyAddEvent.custodyAddress === custodyAddEvent.custodyAddress) {
            // Keep higher hash
            if (hashCompare(existingSignerAdd.hash, message.hash) >= 0) {
              return ok(undefined); // No-op
            }
          }

          // TODO
        }
      }
    }

    const existingSignerRemove = this._signerRemoves.get(signerKey);
    if (existingSignerRemove) {
      const existingCustodyAddEvent = this._custodyAdds.get(this.sanitizeKey(existingSignerRemove.signer));

      if (existingCustodyAddEvent) {
        // If existing block number wins
        if (existingCustodyAddEvent.blockNumber >= custodyAddEvent.blockNumber) {
          return ok(undefined); // No-op
        }

        // If new block number wins, remove signer from removes
        if (existingCustodyAddEvent.blockNumber < custodyAddEvent.blockNumber) {
          this._signerRemoves.delete(signerKey);
        }

        // If block numbers are the same
        // TODO
      }
    }

    this._signerAdds.set(signerKey, message);
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

    // If custody address has been removed
    if (this._custodyRemoves.has(custodyAddress)) return ok(undefined); // No-op
    // return err('SignerSet.mergeSignerAdd: custodyAddress has been removed');

    // If custody address is missing
    const custodyAddEvent = this._custodyAdds.get(custodyAddress);
    if (!custodyAddEvent) return err('SignerSet.mergeSignerRemove: custodyAddress does not exist');

    const existingSignerRemove = this._signerRemoves.get(signerKey);
    if (existingSignerRemove) {
      const existingCustodyAddEvent = this._custodyAdds.get(this.sanitizeKey(existingSignerRemove.signer));

      if (existingCustodyAddEvent) {
        // If existing block number wins
        if (existingCustodyAddEvent.blockNumber > custodyAddEvent.blockNumber) {
          return ok(undefined); // No-op
        }

        // If new block number wins, continue execution

        // If block numbers are the same
        if (existingCustodyAddEvent.blockNumber === custodyAddEvent.blockNumber) {
          if (existingCustodyAddEvent.custodyAddress === custodyAddEvent.custodyAddress) {
            // Keep higher hash
            if (hashCompare(existingSignerRemove.hash, message.hash) >= 0) {
              return ok(undefined); // No-op
            }
          }

          // TODO
        }
      }
    }

    const existingSignerAdd = this._signerAdds.get(signerKey);
    if (existingSignerAdd) {
      const existingCustodyAddEvent = this._custodyAdds.get(this.sanitizeKey(existingSignerAdd.signer));

      if (existingCustodyAddEvent) {
        // If existing block number wins
        if (existingCustodyAddEvent.blockNumber > custodyAddEvent.blockNumber) {
          return ok(undefined); // No-op
        }

        // If new block number wins, continue execution
        if (existingCustodyAddEvent.blockNumber <= custodyAddEvent.blockNumber) {
          this._signerAdds.delete(signerKey);
        }

        // If block numbers are the same
        // TODO
      }
    }

    this._signerRemoves.set(signerKey, message);
    // TODO: revoke signerKey
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
