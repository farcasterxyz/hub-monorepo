import { stringify } from 'querystring';
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
    // new code
    this.adds = new Map<string, SignerAdd>();
    this.revoked = new Map<string, SignerRemove>();
    this.edges = new Map<string, Set<string>>();
    this.custodySigners = new Set<string>();
  }

  // Verification is done by the Ethereum blockchain i.e. the on-chain register/transfer event
  // that triggers the addition of a Signer is proof the custody address being added owns the associated
  // account id
  public addSigner(custodyAddressPubkey: string): boolean {
    if (this._nodeWithPubkeyExists(custodyAddressPubkey)) {
      console.error('node with key value already exists in SignerSet');
      return false;
    }

    this.custodySigners.add(custodyAddressPubkey);
    this.edges.set(custodyAddressPubkey, new Set<string>());
    return true;
  }

  /* addDelegate adds the proposed delegate if possible under the proposed parent */
  public addDelegate(delegateAddition: SignerAdd): boolean {
    const delegate = delegateAddition.envelope.childSignerPubkey;
    const proposedParentPubkey = delegateAddition.envelope.parentSignerPubkey;
    const existingSignerAdd = this.adds.get(delegate);

    // check if proposed Delegate is in this.revoked
    if (this.revoked.has(delegate)) {
      console.error(`delegate key has been revoked for this account: ${delegateAddition.envelope.childSignerPubkey}`);
      return false;
    }

    // check if Delegate is in add set
    if (this.adds.has(delegate)) {
      console.error(`delegate ${delegate} has been added already`);
      return false;
    }

    // check if proposed parent pubkey is not in revoked and exists
    // either as a delegate or custody signer
    if (
      this.revoked.has(proposedParentPubkey) ||
      (!this.adds.has(proposedParentPubkey) && !this.custodySigners.has(proposedParentPubkey))
    ) {
      console.error(`unable to use ${proposedParentPubkey}`);
      return false;
    }

    // check if there is an existing edge with the proposed delegate under a different parent
    if (existingSignerAdd !== undefined && existingSignerAdd.envelope.parentSignerPubkey !== proposedParentPubkey) {
      // check if delegate exists in signer set under a different parent pubkey
      // if it does, check if current edge has a higher lexicographical hash than the proposed edge
      const existingParentPubkey = existingSignerAdd.envelope.parentSignerPubkey;
      // compute hash of existing parentPubkey + childPubkey edge
      const existingEdgeHash = blake2BHash(`${existingParentPubkey}${delegate}`);
      const proposedEdgeHash = blake2BHash(`${proposedParentPubkey}${delegate}`);

      if (existingEdgeHash < proposedEdgeHash) {
        // remove delegate edge from existing parent
        const removed = this._removeDelegateEdge(existingParentPubkey, delegate);
        if (!removed) {
          console.error(`could not remove delegate ${delegate} from ${existingParentPubkey}`);
          return false;
        }

        // add delegate edge to proposed parent
        const added = this._addDelegateEdge(proposedParentPubkey, delegate);
        if (!added) {
          console.error(`could not add delegate ${delegate} to parent ${proposedParentPubkey}`);
          return false;
        }

        // replace existing add with new SignerAdd structure
        this.adds.set(delegate, delegateAddition);
        return true;
      } else {
        // do not do anything since the existing edge hash is lexicographically higher
        // than the proposed edge hash
        return false;
      }
    } else {
      const added = this._addDelegateEdge(proposedParentPubkey, delegate);
      if (!added) {
        console.error(`could not add delegate ${delegate} to parent ${proposedParentPubkey}`);
        return false;
      }

      // replace existing add with new SignerAdd structure
      this.adds.set(delegate, delegateAddition);

      return true;
    }
  }

  // removeDelegate searches through signers for which parent key to add the key to
  public removeDelegate(removeMsg: SignerRemove): boolean {
    /* new code */
    const delegate = removeMsg.message.body.childKey;
    const parent = removeMsg.envelope.parentSignerPubkey;

    // check that delegate nor parent are in revoked set
    if (this.revoked.has(delegate) || this.revoked.has(parent)) {
      console.error(`delegate ${delegate} or ${parent} has already been revoked in this account`);
      return false;
    }

    // check that delegate exists and maps to proposed parent
    const existingSignerAdd = this.adds.get(delegate);
    if (existingSignerAdd === undefined) {
      console.error(`${delegate} does not exist in adds set`);
      return false;
    }

    // get parent edge if exists
    const parentEdge = this.edges.get(parent);
    if (parentEdge === undefined) {
      console.error(`no edges found for ${parent}`);
      return false;
    }

    // confirm parent has delegate
    if (!parentEdge.has(delegate)) {
      console.error(`${delegate} not a child of ${parent}`);
      return false;
    }

    const subtreeRemoved = this._removeSubtree(delegate);
    if (!subtreeRemoved) {
      console.error(`${delegate} subtree could not be removed`);
      return false;
    }

    const removed = this._removeDelegateEdge(parent, delegate);
    if (!removed) {
      console.error(`${delegate} could not be removed from ${parent}`);
      return false;
    }

    this.revoked.set(delegate, removeMsg);
    return true;
  }

  // TODO - optional
  public revokePastSigners(): boolean {
    return false;
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
