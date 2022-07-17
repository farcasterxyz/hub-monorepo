import { Result, ok, err } from 'neverthrow';
import { blake2BHash } from '~/utils';

export interface SignerAdd {
  message: {
    body: {
      parentKey: string;
      childKey: string;
      schema: string;
    };
    account: number;
  };
  envelope: {
    hash: string;
    hashType: HashAlgorithm;
    parentSignature: string;
    parentSignatureType: SignatureAlgorithm;
    parentSignerPubkey: string;
    childSignature: string;
    childSignatureType: SignatureAlgorithm;
    childSignerPubkey: string;
  };
}

export interface SignerRemove {
  message: {
    body: {
      childKey: string;
      schema: string;
    };
    account: number;
  };
  envelope: {
    hash: string;
    hashType: HashAlgorithm;
    parentSignature: string;
    parentSignatureType: SignatureAlgorithm;
    parentSignerPubkey: string;
  };
}

export enum SignatureAlgorithm {
  EcdsaSecp256k1 = 'ecdsa-secp256k1',
  Ed25519 = 'ed25519',
}

export enum HashAlgorithm {
  Keccak256 = 'keccak256',
  Blake2b = 'blake2b',
}

/*   
  SignerSet manages the account's associated custody addresses authorized 
  for Signing and their corresponding delegates.
*/
class SignerSet {
  // new code
  /* adds is a Map of (delegatePubkey, SignerAdd) */
  private adds: Map<string, SignerAdd>;
  /* revoked is a Map of (delegatePubkey, SignerRemove) */
  private revoked: Map<string, SignerRemove>;
  /* edges is a Map of (parentPubkey (delegate or custody signer), Set<childPubkey>) */
  private edges: Map<string, Set<string>>;
  /* custodySigners is a set of custody signer pubkey values */
  private custodySigners: Set<string>;

  constructor() {
    this.adds = new Map<string, SignerAdd>();
    this.revoked = new Map<string, SignerRemove>();
    this.edges = new Map<string, Set<string>>();
    this.custodySigners = new Set<string>();
  }

  /* addCustody adds a custody signer  */
  public addCustody(custodySignerPubkey: string): Result<void, string> {
    if (this._nodeWithPubkeyExists(custodySignerPubkey)) {
      return err(`${custodySignerPubkey} already exists`);
    }

    this.custodySigners.add(custodySignerPubkey);
    this.edges.set(custodySignerPubkey, new Set<string>());
    return ok(undefined);
  }

  /* addDelegate adds the proposed delegate signer if possible under the proposed parent */
  public addDelegate(delegateAddition: SignerAdd): Result<void, string> {
    const delegate = delegateAddition.envelope.childSignerPubkey;
    const proposedParentPubkey = delegateAddition.envelope.parentSignerPubkey;
    const existingSignerAdd = this.adds.get(delegate);

    // check if proposed Delegate is in this.revoked
    if (this.revoked.has(delegate)) {
      return err(`delegate key has been revoked for this account: ${delegateAddition.envelope.childSignerPubkey}`);
    }

    // check if Delegate is in add set
    if (this.adds.has(delegate)) {
      return err(`delegate ${delegate} has been added already`);
    }

    // check if proposed parent pubkey is not in revoked and exists
    // either as a delegate or custody signer
    if (
      this.revoked.has(proposedParentPubkey) ||
      (!this.adds.has(proposedParentPubkey) && !this.custodySigners.has(proposedParentPubkey))
    ) {
      return err(`unable to use ${proposedParentPubkey}`);
    }

    // Concurrent Edge Case handling for when the delegate exists under a different parent
    // See the "Conflicting Parents" section in https://farcasterxyz.notion.site/Signer-Set-85706ad04aea4bb6a3ac4e30f07bcd09
    if (existingSignerAdd !== undefined && existingSignerAdd.envelope.parentSignerPubkey !== proposedParentPubkey) {
      // check if current edge has a higher lexicographical hash than the proposed edge
      const existingParentPubkey = existingSignerAdd.envelope.parentSignerPubkey;
      // compute hash of existing parentPubkey + childPubkey edge
      const existingEdgeHash = blake2BHash(`${existingParentPubkey}${delegate}`);
      const proposedEdgeHash = blake2BHash(`${proposedParentPubkey}${delegate}`);

      if (existingEdgeHash < proposedEdgeHash) {
        // remove subtree
        const subtreeRemoved = this._removeSubtree(delegate);
        if (!subtreeRemoved) {
          return err(`could not remove delegate subtree ${delegate}`);
        }

        // remove delegate edge from existing parent
        const removed = this._removeDelegateEdge(existingParentPubkey, delegate);
        if (!removed) {
          return err(`could not remove delegate ${delegate} from ${existingParentPubkey}`);
        }

        // add delegate edge to proposed parent
        const added = this._addDelegateEdge(proposedParentPubkey, delegate);
        if (!added) {
          return err(`could not add delegate ${delegate} to parent ${proposedParentPubkey}`);
        }

        // replace existing add with new SignerAdd structure
        this.adds.set(delegate, delegateAddition);
        return ok(undefined);
      } else {
        // do not do anything since the existing edge hash is lexicographically higher
        // than the proposed edge hash
        return err(`delegate ${delegate} already exists under ${existingParentPubkey}`);
      }
    } else {
      const added = this._addDelegateEdge(proposedParentPubkey, delegate);
      if (!added) {
        return err(`could not add delegate ${delegate} to parent ${proposedParentPubkey}`);
      }

      // replace existing add with new SignerAdd structure
      this.adds.set(delegate, delegateAddition);
      return ok(undefined);
    }
  }

  // removeDelegate searches through signers for which parent key to add the key to
  public removeDelegate(removeMsg: SignerRemove): Result<void, string> {
    /* new code */
    const delegate = removeMsg.message.body.childKey;
    const parent = removeMsg.envelope.parentSignerPubkey;

    // check that delegate nor parent are in revoked set
    if (this.revoked.has(delegate) || this.revoked.has(parent)) {
      return err(`delegate ${delegate} or ${parent} has already been revoked in this account`);
    }

    // check that delegate exists and maps to proposed parent
    const existingSignerAdd = this.adds.get(delegate);
    if (existingSignerAdd === undefined) {
      return err(`${delegate} does not exist in adds set`);
    }

    // get parent edge if exists
    const parentEdge = this.edges.get(parent);
    if (parentEdge === undefined) {
      return err(`no edges found for ${parent}`);
    }

    // confirm parent has delegate
    if (!parentEdge.has(delegate)) {
      return err(`${delegate} not a child of ${parent}`);
    }

    const subtreeRemoved = this._removeSubtree(delegate);
    if (!subtreeRemoved) {
      return err(`${delegate} subtree could not be removed`);
    }

    const removed = this._removeDelegateEdge(parent, delegate);
    if (!removed) {
      return err(`${delegate} could not be removed from ${parent}`);
    }

    this.revoked.set(delegate, removeMsg);
    return ok(undefined);
  }

  public _numSigners(): number {
    return this.custodySigners.size;
  }

  private _addDelegateEdge(parentPubkey: string, delegate: string): boolean {
    const parentChildren = this.edges.get(parentPubkey);
    if (parentChildren === undefined) {
      console.error(`pubkey ${parentPubkey} exists in edges set, not in revoked but no corresponding edge`);
      return false;
    }

    parentChildren.add(delegate);
    this.edges.set(parentPubkey, parentChildren);
    const newParentChildren = this.edges.get(parentPubkey);
    if (newParentChildren !== undefined && !newParentChildren.has(delegate)) {
      return false;
    }

    this.edges.set(delegate, new Set<string>());
    if (this.edges.get(delegate) === undefined) {
      return false;
    }

    return true;
  }

  private _removeDelegateEdge(parentPubkey: string, delegate: string): boolean {
    const children = this.edges.get(parentPubkey);
    if (children === undefined) {
      console.error(`delegate ${delegate} exists in add set, not in revoked but no corresponding edge`);
      return false;
    }

    children.delete(delegate);
    this.edges.set(parentPubkey, children);

    const newChildren = this.edges.get(parentPubkey);
    if (newChildren !== undefined && newChildren.has(delegate)) {
      return false;
    }

    return true;
  }

  private _removeSubtree(pubkey: string): boolean {
    if (!this.edges.has(pubkey)) {
      return false;
    }

    return this.edges.delete(pubkey);
  }

  private _nodeWithPubkeyExists(pubkey: string): boolean {
    return (this.adds.has(pubkey) || this.custodySigners.has(pubkey)) && !this.revoked.has(pubkey);
  }
}

export default SignerSet;
