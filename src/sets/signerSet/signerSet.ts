import { Result, ok, err } from 'neverthrow';
import { hashCompare } from '~/utils';

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

type EdgeMsg = {
  hash: string;
  parentPubkey: string;
  childPubkey: string;
  type: 'SignerAdd' | 'SignerRemove';
};

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
  /* new code */
  private adds: Set<string>;
  private removed: Set<string>;
  private edges: Array<EdgeMsg>;
  private tree: Map<string, Set<string>>;

  /* custodySigners is a set of custody signer pubkey values */
  private custodySigners: Set<string>;

  constructor() {
    this.adds = new Set<string>();
    this.removed = new Set<string>();
    this.tree = new Map<string, Set<string>>();
    this.edges = new Array<EdgeMsg>();
    this.custodySigners = new Set<string>();
  }

  /* addCustody adds a custody signer  */
  public addCustody(custodySignerPubkey: string): Result<void, string> {
    if (this._nodeWithPubkeyExists(custodySignerPubkey)) {
      // idempotent
      return ok(undefined);
    }

    this.custodySigners.add(custodySignerPubkey);
    this.tree.set(custodySignerPubkey, new Set<string>());
    return ok(undefined);
  }

  /* addDelegate adds the proposed delegate signer if possible under the proposed parent */
  public addDelegate(delegateAddition: SignerAdd): Result<void, string> {
    const child = delegateAddition.envelope.childSignerPubkey;
    const newParent = delegateAddition.envelope.parentSignerPubkey;
    const edge = <EdgeMsg>{
      childPubkey: child,
      parentPubkey: newParent,
      hash: delegateAddition.envelope.hash,
      type: 'SignerAdd',
    };

    if (this.adds.has(newParent) || this.custodySigners.has(newParent)) {
      if (this.adds.has(child)) {
        this._addEdgeIfNotExists(edge);
        const existingEdge = this._getEdgeFromChild(child, 'SignerAdd');
        if (existingEdge === undefined) {
          return err(`edge with delegate ${child} does not exist`);
        }

        const hashVal = hashCompare(existingEdge.hash, edge.hash);
        // new edge won
        if (hashVal < 0) {
          this._moveChildToNewParent(existingEdge.parentPubkey, child, edge.hash);
        } else if (hashVal > 0) {
          return err(`existing edge with parent ${existingEdge.parentPubkey} preserves delegate`);
        }
        return ok(undefined);
      }

      if (this.removed.has(child)) {
        // handles concurrent edge case of conflicting rem-add
        // get edge of parent and check if new parent wins hash competition
        const existingEdge = this._getEdgeFromChild(child, 'SignerAdd');
        if (existingEdge === undefined) {
          return err(`edge with delegate ${child} does not exist`);
        }
        this._addEdgeIfNotExists(edge);

        const hashVal = hashCompare(existingEdge.hash, edge.hash);
        // new edge won
        if (hashVal < 0) {
          this.removed.delete(child);
          this.adds.add(child);
          this._moveChildToNewParent(existingEdge.parentPubkey, child, edge.hash);
          // move all descendants in subtree including child to add set from removed
          this._unremoveDelegateSubtree(child);
        } else if (hashVal > 0) {
          return err(`existing edge with parent ${existingEdge.parentPubkey} preserves delegate`);
        }
        return ok(undefined);
      }

      this.adds.add(child);
      this._addEdgeIfNotExists(edge);
      this._addChildToParent(newParent, child);
      this.tree.set(child, new Set<string>());
      return ok(undefined);
    }

    if (this.removed.has(newParent)) {
      if (this.removed.has(child)) {
        this._removeEdgeIfExists(edge);
        return ok(undefined);
      }

      if (this.adds.has(child)) {
        this.adds.delete(child);
        this.removed.add(child);
        this._addEdgeIfNotExists(edge);

        this._removeDelegateSubtree(child);
        return ok(undefined);
      }

      // child does not exist in any set
      this.removed.add(child);
      this._addEdgeIfNotExists(edge);
      return ok(undefined);
    }

    return err(`${newParent} does not exist in adds or removed`);
  }

  // removeDelegate searches through signers for which parent key to add the key to
  public removeDelegate(removeMsg: SignerRemove): Result<void, string> {
    const child = removeMsg.message.body.childKey;
    const parent = removeMsg.envelope.parentSignerPubkey;
    const edge = <EdgeMsg>{
      parentPubkey: parent,
      childPubkey: child,
      hash: removeMsg.envelope.hash,
      type: 'SignerRemove',
    };

    // not in pseudocode
    if (!this.tree.get(parent)?.has(child)) {
      return err(`${parent} is not parent of ${child}`);
    }

    if (this.adds.has(parent) || this.custodySigners.has(parent)) {
      if (this.adds.has(child)) {
        this.adds.delete(child);
        this.removed.add(child);
        this._removeEdgeIfExists(<EdgeMsg>{
          parentPubkey: parent,
          childPubkey: child,
          type: 'SignerAdd',
        });

        this._addEdgeIfNotExists(edge);
        this._removeDelegateSubtree(child);

        return ok(undefined);
      }

      if (this.removed.has(child)) {
        // TODO: do we do the same thing in adds-removed as removed-removed? (look below)
        return ok(undefined); // no-op
      }

      // child is neither in adds or removed
      this.removed.add(child);
      this._addEdgeIfNotExists(edge);
    }

    if (this.removed.has(parent)) {
      if (this.removed.has(child)) {
        // remove SignerAdd edge if exists
        const addEdge = edge;
        addEdge.type = 'SignerAdd';
        this._removeEdgeIfExists(addEdge);
        // add SignerRemove edge msg if not exists
        this._addEdgeIfNotExists(edge);
      }

      // logically, this case should never happen
      if (this.adds.has(child)) {
        return err(`${parent} is in removed but child ${child} is in adds`);
      }
    }

    return ok(undefined);
  }

  /* used for testing purposes */
  public _numSigners(): number {
    return this.custodySigners.size;
  }

  private _moveChildToNewParent(
    parentPubkey: string,
    childPubkey: string,
    newParentPubkey: string
  ): Result<void, string> {
    // remove child from parent
    const children = this.tree.get(parentPubkey);
    if (children === undefined) {
      return err(`${parentPubkey} has an empty children set in tree`);
    }

    children.delete(childPubkey);
    this.tree.set(parentPubkey, children);

    // add child to new parent
    this._addChildToParent(newParentPubkey, childPubkey);
    return ok(undefined);
  }

  private _removeEdgeIfExists(msg: EdgeMsg): Result<void, string> {
    for (let edgeIdx = 0; edgeIdx < this.edges.length; edgeIdx++) {
      const edge = this.edges[edgeIdx];
      if (edge.parentPubkey === msg.parentPubkey && edge.childPubkey === msg.childPubkey && edge.type === msg.type) {
        this.edges.splice(edgeIdx, 1);
        return ok(undefined);
      }
    }

    return err(`${msg.parentPubkey}-${msg.childPubkey} not found`);
  }

  private _addChildToParent(parent: string, child: string): Result<void, string> {
    let children = this.tree.get(parent);
    if (children === undefined) {
      return err(`${parent} node has a null children set`);
    }

    children = children.add(child);
    this.tree.set(parent, children);
    return ok(undefined);
  }

  // TODO: convert to Result<EdgeMsg, string> type
  private _getEdgeFromChild(child: string, type: string): EdgeMsg | undefined {
    for (let edgeIdx = 0; edgeIdx < this.edges.length; edgeIdx++) {
      const edge = this.edges[edgeIdx];
      if (edge.childPubkey === child && edge.type === type) {
        return edge;
      }
    }

    return undefined;
  }

  private _addEdgeIfNotExists(msg: EdgeMsg): Result<void, string> {
    let edgeExists = false;
    for (let edgeIdx = 0; edgeIdx < this.edges.length; edgeIdx++) {
      const edge = this.edges[edgeIdx];
      if (edge.parentPubkey === msg.parentPubkey && edge.childPubkey === msg.childPubkey && edge.type === msg.type) {
        edgeExists = true;
      }
    }

    if (edgeExists) {
      return err(`${msg.parentPubkey}-${msg.childPubkey}-${msg.type} edge exists`);
    }

    this.edges.push(msg);
    return ok(undefined);
  }

  /* 
    _removeDelegateSubtree removes the delegatePubkey subtree recursively 
    and adds to remove set if removeMsg is not null 

    @param delegatePubkey the pubkey of the subtree root
    @param removeMsg an optional message in the case this is used for delegate signer revocations
    @returns true if the deletion process was successful 
  */
  private _removeDelegateSubtree(delegatePubkey: string): Result<void, string> {
    this.adds.delete(delegatePubkey);
    this.removed.add(delegatePubkey);

    const children = this.tree.get(delegatePubkey);
    if (children === undefined) {
      return err(`${delegatePubkey} has a null children set`);
    }

    children.forEach((child) => {
      this._removeDelegateSubtree(child);
    });

    return ok(undefined);
  }

  private _unremoveDelegateSubtree(delegatePubkey: string): Result<void, string> {
    this.removed.delete(delegatePubkey);
    this.adds.add(delegatePubkey);

    const children = this.tree.get(delegatePubkey);
    if (children === undefined) {
      return err(`${delegatePubkey} has a null children set`);
    }

    children.forEach((child) => {
      this._unremoveDelegateSubtree(child);
    });

    return ok(undefined);
  }

  private _nodeWithPubkeyExists(pubkey: string): boolean {
    return (this.adds.has(pubkey) || this.custodySigners.has(pubkey)) && !this.removed.has(pubkey);
  }
}

export default SignerSet;
