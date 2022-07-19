import { Result, ok, err } from 'neverthrow';
import { EdgeMsg, SignerAdd, SignerEdge, SignerMessage, SignerRemove } from '~/types';
import { isSignerAdd, isSignerRemove } from '~/types/typeguards';
import { hashCompare } from '~/utils';

/*   
  SignerSet manages the account's associated custody addresses authorized 
  for Signing and their corresponding delegates.
*/
class SignerSet {
  private _adds: Set<string>;
  private _removes: Set<string>;
  private _edges: Array<EdgeMsg>;
  private _tree: Map<string, Set<string>>;
  private _custodySigners: Set<string>;

  constructor() {
    this._adds = new Set<string>();
    this._removes = new Set<string>();
    this._tree = new Map<string, Set<string>>();
    this._edges = new Array<EdgeMsg>();
    this._custodySigners = new Set<string>();
  }

  merge(message: SignerMessage): Result<void, string> {
    if (isSignerRemove(message)) {
      return this.removeDelegate(message);
    }

    if (isSignerAdd(message)) {
      return this.addDelegate(message);
    }

    return err('SignerSet.merge: invalid message format');
  }

  /* addCustody adds a custody signer  */
  public addCustody(custodySignerPubkey: string): Result<void, string> {
    if (this._nodeWithPubkeyExists(custodySignerPubkey)) {
      // idempotent
      return ok(undefined);
    }

    this._custodySigners.add(custodySignerPubkey);
    this._tree.set(custodySignerPubkey, new Set<string>());
    return ok(undefined);
  }

  /* addDelegate adds the proposed delegate signer if possible under the proposed parent */
  public addDelegate(delegateAddition: SignerAdd): Result<void, string> {
    const child = delegateAddition.data.body.childKey;
    const newParent = delegateAddition.signer;
    const edge = <EdgeMsg>{
      childPubkey: child,
      parentPubkey: newParent,
      hash: delegateAddition.hash,
      type: 'SignerAdd',
    };

    if (this._adds.has(newParent) || this._custodySigners.has(newParent)) {
      if (this._adds.has(child)) {
        const existingEdge = this._getEdgeFromChild(child, 'SignerAdd');
        if (existingEdge === undefined) {
          return err(`edge with delegate ${child} does not exist`);
        }
        this._addEdgeIfNotExists(edge);

        const hashVal = hashCompare(existingEdge.hash, edge.hash);
        // new edge won
        if (hashVal < 0) {
          this._moveChildToNewParent(existingEdge.parentPubkey, child, edge.hash);
        } else if (hashVal > 0) {
          return err(`existing edge with parent ${existingEdge.parentPubkey} preserves delegate`);
        }
        return ok(undefined);
      }

      if (this._removes.has(child)) {
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
          this._removes.delete(child);
          this._adds.add(child);
          this._moveChildToNewParent(existingEdge.parentPubkey, child, edge.hash);
          // move all descendants in subtree including child to add set from _removes
          this._unremoveDelegateSubtree(child);
        } else if (hashVal > 0) {
          return err(`revoked parent ${existingEdge.parentPubkey} preserves delegate ${child}`);
        }
        return ok(undefined);
      }

      this._adds.add(child);
      this._addEdgeIfNotExists(edge);
      this._addChildToParent(newParent, child);
      this._tree.set(child, new Set<string>());
      return ok(undefined);
    }

    if (this._removes.has(newParent)) {
      if (this._removes.has(child)) {
        this._removeEdgeIfExists(edge);
        return ok(undefined);
      }

      if (this._adds.has(child)) {
        this._adds.delete(child);
        this._removes.add(child);
        this._addEdgeIfNotExists(edge);

        this._removeDelegateSubtree(child);
        return ok(undefined);
      }

      // child does not exist in any set
      this._removes.add(child);
      this._addEdgeIfNotExists(edge);
      return ok(undefined);
    }

    return err(`${newParent} does not exist in adds or removes`);
  }

  // removeDelegate searches through signers for which parent key to add the key to
  public removeDelegate(removeMsg: SignerRemove): Result<void, string> {
    const child = removeMsg.data.body.childKey;
    const parent = removeMsg.signer;
    const edge = <EdgeMsg>{
      parentPubkey: parent,
      childPubkey: child,
      hash: removeMsg.hash,
      type: 'SignerRemove',
    };

    // not in pseudocode
    if (!this._tree.get(parent)?.has(child)) {
      return err(`${parent} is not parent of ${child}`);
    }

    if (this._adds.has(parent) || this._custodySigners.has(parent)) {
      if (this._adds.has(child)) {
        this._adds.delete(child);
        this._removes.add(child);
        this._removeEdgeIfExists(<EdgeMsg>{
          parentPubkey: parent,
          childPubkey: child,
          type: 'SignerAdd',
        });

        this._addEdgeIfNotExists(edge);
        this._removeDelegateSubtree(child);

        return ok(undefined);
      }

      if (this._removes.has(child)) {
        return ok(undefined); // no-op
      }

      // child is neither in adds or removes
      this._removes.add(child);
      this._addEdgeIfNotExists(edge);
    }

    if (this._removes.has(parent)) {
      if (this._removes.has(child)) {
        return ok(undefined); // no-op
      }

      // logically, this case should never happen
      if (this._adds.has(child)) {
        return err(`${parent} is in _removes but child ${child} is in _adds`);
      }
    }

    return ok(undefined);
  }

  /* used for testing purposes */
  public _numSigners(): number {
    return this._custodySigners.size;
  }

  private _moveChildToNewParent(
    parentPubkey: string,
    childPubkey: string,
    newParentPubkey: string
  ): Result<void, string> {
    // remove child from parent
    const children = this._tree.get(parentPubkey);
    if (children === undefined) {
      return err(`${parentPubkey} has an empty children set in _tree`);
    }

    children.delete(childPubkey);
    this._tree.set(parentPubkey, children);

    // add child to new parent
    this._addChildToParent(newParentPubkey, childPubkey);
    return ok(undefined);
  }

  private _removeEdgeIfExists(msg: EdgeMsg): Result<void, string> {
    for (let edgeIdx = 0; edgeIdx < this._edges.length; edgeIdx++) {
      const edge = this._edges[edgeIdx];
      if (edge.parentPubkey === msg.parentPubkey && edge.childPubkey === msg.childPubkey && edge.type === msg.type) {
        this._edges.splice(edgeIdx, 1);
        return ok(undefined);
      }
    }

    return err(`${msg.parentPubkey}-${msg.childPubkey} not found`);
  }

  private _addChildToParent(parent: string, child: string): Result<void, string> {
    let children = this._tree.get(parent);
    if (children === undefined) {
      return err(`${parent} node has a null children set`);
    }

    children = children.add(child);
    this._tree.set(parent, children);
    return ok(undefined);
  }

  // TODO: convert to Result<EdgeMsg, string> type
  private _getEdgeFromChild(child: string, type: string): EdgeMsg | undefined {
    for (let edgeIdx = 0; edgeIdx < this._edges.length; edgeIdx++) {
      const edge = this._edges[edgeIdx];
      if (edge.childPubkey === child && edge.type === type) {
        return edge;
      }
    }

    return undefined;
  }

  private _addEdgeIfNotExists(msg: EdgeMsg): Result<void, string> {
    let edgeExists = false;
    for (let edgeIdx = 0; edgeIdx < this._edges.length; edgeIdx++) {
      const edge = this._edges[edgeIdx];
      if (edge.parentPubkey === msg.parentPubkey && edge.childPubkey === msg.childPubkey && edge.type === msg.type) {
        edgeExists = true;
      }
    }

    if (edgeExists) {
      return err(`${msg.parentPubkey}-${msg.childPubkey}-${msg.type} edge exists`);
    }

    this._edges.push(msg);
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
    this._adds.delete(delegatePubkey);
    this._removes.add(delegatePubkey);

    const children = this._tree.get(delegatePubkey);
    if (children === undefined) {
      return err(`${delegatePubkey} has a null children set`);
    }

    children.forEach((child) => {
      this._removeDelegateSubtree(child);
    });

    return ok(undefined);
  }

  private _unremoveDelegateSubtree(delegatePubkey: string): Result<void, string> {
    this._removes.delete(delegatePubkey);
    this._adds.add(delegatePubkey);

    const children = this._tree.get(delegatePubkey);
    if (children === undefined) {
      return err(`${delegatePubkey} has a null children set`);
    }

    children.forEach((child) => {
      this._unremoveDelegateSubtree(child);
    });

    return ok(undefined);
  }

  private _nodeWithPubkeyExists(pubkey: string): boolean {
    return (this._adds.has(pubkey) || this._custodySigners.has(pubkey)) && !this._removes.has(pubkey);
  }

  /**
   * Testing Methods
   */
  _reset(): void {
    this._adds = new Set();
    this._removes = new Set();
    this._tree = new Map();
    this._edges = [];
    this._custodySigners = new Set();
  }

  _getAdds(): string[] {
    return Array.from(this._adds.values());
  }

  _getRemoves(): string[] {
    return Array.from(this._removes.values());
  }

  _getEdges(): EdgeMsg[] {
    return this._edges;
  }
}

export default SignerSet;
