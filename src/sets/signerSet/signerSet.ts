import { Result, ok, err } from 'neverthrow';
import { EdgeMsg, SignerAdd, SignerEdge, SignerMessage, SignerRemove } from '~/types';
import { isSignerAdd, isSignerRemove } from '~/types/typeguards';
import { hashCompare } from '~/utils';

/*   
  SignerSet manages the account's associated custody addresses authorized 
  for Signing and their corresponding delegates.
*/
class SignerSet {
  private _vertexAdds: Set<string>; // pubKey
  private _vertexRemoves: Set<string>; // pubKey
  private _edgeAdds: Map<string, string>; // <parentKey, childKey> => SignerAdd hash
  private _edgeRemoves: Map<string, string>; // <parentKey, childKey> => SignerAdd hash
  private _messages: Map<string, SignerMessage>; // message hash => SignerAdd | SignerRemove

  private _adds: Set<string>;
  private _removes: Set<string>;
  private _edges: Array<EdgeMsg>;
  private _tree: Map<string, Set<string>>;
  private _custodySigners: Set<string>;

  constructor() {
    // Old
    this._adds = new Set<string>();
    this._removes = new Set<string>();
    this._tree = new Map<string, Set<string>>();
    this._edges = new Array<EdgeMsg>();
    this._custodySigners = new Set<string>();
    // New
    this._vertexAdds = new Set();
    this._vertexRemoves = new Set();
    this._edgeAdds = new Map();
    this._edgeRemoves = new Map();
    this._messages = new Map();
  }

  // TODO: rename this to _vertices
  private get vertices() {
    return new Set([...this._vertexAdds, ...this._vertexRemoves]);
  }

  // TODO: rename this to _edges
  private get edges() {
    return new Map([...this._edgeAdds, ...this._edgeRemoves]);
  }

  private get _edgeAddsByChild() {
    const byChild = new Map<string, Set<string>>();
    for (const edgeKey of this._edgeAdds.keys()) {
      const { childPubKey } = this.getPubKeysFromEdgeKey(edgeKey);
      const existingSet = byChild.get(childPubKey) || new Set();
      existingSet.add(edgeKey);
      byChild.set(childPubKey, existingSet);
    }
    return byChild;
  }

  private get _edgeRemovesByChild() {
    const byChild = new Map<string, Set<string>>();
    for (const edgeKey of this._edgeRemoves.keys()) {
      const { childPubKey } = this.getPubKeysFromEdgeKey(edgeKey);
      const existingSet = byChild.get(childPubKey) || new Set();
      existingSet.add(edgeKey);
      byChild.set(childPubKey, existingSet);
    }
    return byChild;
  }

  private get _edgesByChild() {
    return new Map([...this._edgeAddsByChild, ...this._edgeRemovesByChild]);
  }

  private get _edgesByParent() {
    const byParent = new Map<string, Set<string>>();
    for (const edgeKey of this.edges.keys()) {
      const { parentPubKey } = this.getPubKeysFromEdgeKey(edgeKey);
      const existingSet = byParent.get(parentPubKey) || new Set();
      existingSet.add(edgeKey);
      byParent.set(parentPubKey, existingSet);
    }
    return byParent;
  }

  getEdgeAddsParentPubKeyOfChild(childKey: string) {
    for (const edgeKey of this._edgeAdds.keys()) {
      const { parentPubKey, childPubKey } = this.getPubKeysFromEdgeKey(edgeKey);
      if (childPubKey === childKey) return parentPubKey;
    }
    return null;
  }

  getEdgeKey(parentPubKey: string, childPubKey: string): string {
    return [parentPubKey, childPubKey].toString();
  }

  getPubKeysFromEdgeKey(edgeKey: string): { parentPubKey: string; childPubKey: string } {
    const [parentPubKey, childPubKey] = edgeKey.split(',');
    return { parentPubKey, childPubKey };
  }

  merge(message: SignerMessage): Result<void, string> {
    if (this._messages.get(message.hash)) return ok(undefined); // Duplicate message

    if (isSignerRemove(message)) {
      return this.mergeSignerRemove(message);
    }

    if (isSignerAdd(message)) {
      return this.add(message);
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

  add(message: SignerAdd): Result<void, string> {
    const parentPubKey = message.signer;
    const childPubKey = message.data.body.childKey;
    const edgeKey = this.getEdgeKey(parentPubKey, childPubKey);

    if (!this.vertices.has(parentPubKey) && !this._custodySigners.has(parentPubKey)) {
      return err('SignerSet.add: parent does not exist in graph');
    }

    // If (a,b) exists in eAdds, TODO
    const existingEdgeAddsHash = this._edgeAdds.get(edgeKey);
    if (existingEdgeAddsHash) {
      // Update eAdds with higher order hash
      if (hashCompare(existingEdgeAddsHash, message.hash) < 0) {
        this._edgeAdds.set(edgeKey, message.hash);
      }
      return ok(undefined);
    }

    // If (a,b) exists in eRems, TODO
    const existingEdgeRemovesHash = this._edgeRemoves.get(edgeKey);
    if (existingEdgeRemovesHash) {
      // Update eRems with higher order hash
      if (hashCompare(existingEdgeRemovesHash, message.hash) < 0) {
        this._edgeRemoves.set(edgeKey, message.hash);
      }
      return ok(undefined);
    }

    // If parent exists in vAdds or custody
    if (this._vertexAdds.has(parentPubKey) || this._custodySigners.has(parentPubKey)) {
      // If child does not exist in vertices
      if (!this.vertices.has(childPubKey)) {
        // Add child to vAdds and (a,b) to eAdds
        this._vertexAdds.add(childPubKey);
        this._edgeAdds.set(edgeKey, message.hash);
        // Add message to store and return
        this._messages.set(message.hash, message);
        return ok(undefined);
      }

      // If child exists in vAdds
      else if (this._vertexAdds.has(childPubKey)) {
        // TODO: make this nicer

        const [existingEdgeKey] = this._edgeAddsByChild.get(childPubKey) || new Set();
        if (!existingEdgeKey) {
          return err('SignerSet.add: edgeAdds is in bad state');
        }
        const existingEdgeHash = this._edgeAdds.get(existingEdgeKey)!;
        const existingHashIsGreater = hashCompare(existingEdgeHash, message.hash);

        // If existing message wins
        if (existingHashIsGreater > 0) {
          // Add (parent, child) to eRems
          this._edgeRemoves.set(edgeKey, message.hash);

          // Add message to store and return
          this._messages.set(message.hash, message);
          return ok(undefined);
        }

        // If new message wins
        else if (existingHashIsGreater < 0) {
          // Move existing edge to eRems
          this._edgeAdds.delete(existingEdgeKey);
          this._edgeRemoves.set(existingEdgeKey, existingEdgeHash);
          // Add (parent, child) to eAdds
          this._edgeAdds.set(edgeKey, message.hash);

          // Add message to store and return
          this._messages.set(message.hash, message);
          return ok(undefined);
        }
      }

      // If child exists in vRems
      else if (this._vertexRemoves.has(childPubKey)) {
        // Add (parent, child) to eRems
        this._edgeRemoves.set(edgeKey, message.hash);

        // Add message to store and return
        this._messages.set(message.hash, message);
        return ok(undefined);
      }
    }

    // If parent exists in vRems
    else if (this._vertexRemoves.has(parentPubKey)) {
      // If child does not exist in vertices
      if (!this.vertices.has(childPubKey)) {
        // Add child to vRems and add (a,b) to eRems
        this._vertexRemoves.add(childPubKey);
        this._edgeRemoves.set(edgeKey, message.hash);

        // Add message to store and return
        this._messages.set(message.hash, message);
        return ok(undefined);
      }

      // If child exists in vAdds
      else if (this._vertexAdds.has(childPubKey)) {
        // Move child to vRems
        this._vertexAdds.delete(childPubKey);
        this._vertexRemoves.add(childPubKey);
        // Add (parent, child) to eRems
        this._edgeRemoves.set(edgeKey, message.hash);

        // TODO: clean this up
        const existingParentKey = this.getEdgeAddsParentPubKeyOfChild(childPubKey);
        if (!existingParentKey) return err('SignerSet.add: existing parent seems to be missing');
        const existingEdgeKey = this.getEdgeKey(existingParentKey, childPubKey);
        const existingEdgeHash = this._edgeAdds.get(existingEdgeKey) as string; // TODO: remove as string
        const existingHashIsGreater = hashCompare(existingEdgeHash, message.hash);

        // For all (b,*) in edges
        const parentEdges = this._edgesByParent.get(childPubKey) as Set<string>; // TODO: remove as Set<string>
        parentEdges.forEach((edgeKey) => {
          const { parentPubKey, childPubKey } = this.getPubKeysFromEdgeKey(edgeKey);
          this.remove(parentPubKey, childPubKey);
        });

        // Add message to store and return
        this._messages.set(message.hash, message);
        return ok(undefined);
      }

      // If child exists in vRems
      else if (this._vertexRemoves.has(childPubKey)) {
        // Add (parent,child) to eRems
        this._edgeRemoves.set(edgeKey, message.hash);

        // Add message to store and return
        this._messages.set(message.hash, message);
        return ok(undefined);
      }
    }

    // TODO: do we ever get here?
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

  private mergeSignerRemove(message: SignerRemove): Result<void, string> {
    const parentPubKey = message.signer;
    const childPubKey = message.data.body.childKey;
    const edgeKey = this.getEdgeKey(parentPubKey, childPubKey);

    const res = this.remove(parentPubKey, childPubKey); // TODO: return anything from this?
    if (res.isErr()) return res;
    // Add message to store and return
    this._messages.set(message.hash, message);
    return ok(undefined);
  }

  private removeEdge(edgeKey: string): Result<void, string> {
    const { parentPubKey, childPubKey } = this.getPubKeysFromEdgeKey(edgeKey);
    return this.remove(parentPubKey, childPubKey);
  }

  private remove(parentPubKey: string, childPubKey: string): Result<void, string> {
    const edgeKey = this.getEdgeKey(parentPubKey, childPubKey);

    // If (parent, child) does not exist in graph
    if (!this.edges.has(edgeKey)) return err('SignerSet.remove: edge does not exist');

    // If child exists in vAdds
    if (this._vertexAdds.has(childPubKey)) {
      // Move child to vRems
      this._vertexAdds.delete(childPubKey);
      this._vertexRemoves.add(childPubKey);

      // For all (*,child) in eAdds, move to eRems
      (this._edgeAddsByChild.get(childPubKey) || new Set()).forEach((edgeKey) => {
        const existingHash = this._edgeAdds.get(edgeKey)!;
        this._edgeAdds.delete(edgeKey);
        this._edgeRemoves.set(edgeKey, existingHash);
      });

      // For all (child,*) in edges, remove edge
      (this._edgesByParent.get(childPubKey) || new Set()).forEach((edgeKey) => {
        this.removeEdge(edgeKey);
      });

      return ok(undefined);
    }

    // If child exists in vRems
    if (this._vertexRemoves.has(childPubKey)) {
      return ok(undefined);
    }

    return ok(undefined);
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

  private _removeSubtree(parentPubKey: string, childPubKey: string): Result<void, string> {
    // TODO
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

    this._vertexAdds = new Set();
    this._vertexRemoves = new Set();
    this._edgeAdds = new Map();
    this._edgeRemoves = new Map();
    this._messages = new Map();
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

  _getVertexAdds() {
    return this._vertexAdds;
  }

  _getVertexRemoves() {
    return this._vertexRemoves;
  }

  _getEdgeAdds() {
    return this._edgeAdds;
  }

  _getEdgeRemoves() {
    return this._edgeRemoves;
  }
}

export default SignerSet;
