import { Result, ok, err } from 'neverthrow';
import { SignerAdd, SignerMessage, SignerRemove } from '~/types';
import { isSignerAdd, isSignerRemove } from '~/types/typeguards';
import { hashCompare } from '~/utils';

/*   
  SignerSet manages the account's associated custody addresses authorized 
  for Signing and their corresponding delegates.
*/
class SignerSet {
  private _custodySigners: Set<string>; // custodyPubKey
  private _vertexAdds: Set<string>; // pubKey
  private _vertexRemoves: Set<string>; // pubKey
  private _edgeAdds: Map<string, string>; // <parentKey, childKey>, hash
  private _edgeRemoves: Map<string, string>; // <parentKey, childKey>, hash
  private _messages: Map<string, SignerMessage>; // message hash => SignerAdd | SignerRemove

  constructor() {
    this._custodySigners = new Set();
    this._vertexAdds = new Set();
    this._vertexRemoves = new Set();
    this._edgeAdds = new Map();
    this._edgeRemoves = new Map();
    this._messages = new Map();
  }

  private get _vertices() {
    return new Set([...this._vertexAdds, ...this._vertexRemoves]);
  }

  private get _edges() {
    return new Map([...this._edgeAdds, ...this._edgeRemoves]);
  }

  private get _edgeAddsByChild() {
    return this.getEdgesByChild(this._edgeAdds);
  }

  private get _edgeRemovesByChild() {
    return this.getEdgesByChild(this._edgeRemoves);
  }

  private get _edgesByChild() {
    return this.getEdgesByChild(this._edges);
  }

  private get _edgeAddsByParent() {
    return this.getEdgesByParent(this._edgeAdds);
  }

  private get _edgeRemovesByParent() {
    return this.getEdgesByParent(this._edgeRemoves);
  }

  private get _edgesByParent() {
    return this.getEdgesByParent(this._edges);
  }

  // TODO: add more helper functions as we integrate signer set into engine

  getDelegates(): string[] {
    return Array.from(this._vertexAdds);
  }

  getAllDelegates(): string[] {
    return Array.from(this._vertices);
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
      return this.mergeSignerAdd(message);
    }

    return err('SignerSet.merge: invalid message format');
  }

  mergeSignerAdd(message: SignerAdd): Result<void, string> {
    const parentPubKey = message.signer;
    const childPubKey = message.data.body.childKey;

    const res = this.add(parentPubKey, childPubKey, message.hash);
    if (res.isErr()) return res;

    this._messages.set(message.hash, message);
    return ok(undefined);
  }

  mergeSignerRemove(message: SignerRemove): Result<void, string> {
    const parentPubKey = message.signer;
    const childPubKey = message.data.body.childKey;

    const res = this.remove(parentPubKey, childPubKey);
    if (res.isErr()) return res;

    this._messages.set(message.hash, message);
    return ok(undefined);
  }

  addCustody(custodySignerPubkey: string): Result<void, string> {
    if (this._custodySigners.has(custodySignerPubkey)) return ok(undefined);

    if (this._vertices.has(custodySignerPubkey)) {
      return err('SignerSet.addCustody: custodySignerPubkey already exists as a delegate');
    }

    this._custodySigners.add(custodySignerPubkey);
    return ok(undefined);
  }

  /**
   * Private Methods
   */

  private getEdgesByChild(edges: Map<string, string>) {
    const byChildMap = new Map<string, Set<string>>();
    for (const edgeKey of edges.keys()) {
      const { childPubKey } = this.getPubKeysFromEdgeKey(edgeKey);
      const existingSet = byChildMap.get(childPubKey) || new Set();
      existingSet.add(edgeKey);
      byChildMap.set(childPubKey, existingSet);
    }
    return byChildMap;
  }

  private getEdgesByParent(edges: Map<string, string>) {
    const byChildMap = new Map<string, Set<string>>();
    for (const edgeKey of edges.keys()) {
      const { parentPubKey } = this.getPubKeysFromEdgeKey(edgeKey);
      const existingSet = byChildMap.get(parentPubKey) || new Set();
      existingSet.add(edgeKey);
      byChildMap.set(parentPubKey, existingSet);
    }
    return byChildMap;
  }

  private add(parentPubKey: string, childPubKey: string, hash: string): Result<void, string> {
    const edgeKey = this.getEdgeKey(parentPubKey, childPubKey);

    // If parent is missing
    if (!this._vertices.has(parentPubKey) && !this._custodySigners.has(parentPubKey)) {
      return err('SignerSet.add: parent does not exist in graph');
    }

    // If parent and child are the same
    if (parentPubKey === childPubKey) {
      return err('SignerSet.add: parent and child must be different');
    }

    // If (parent, child) exists in eAdds
    const existingEdgeAddsHash = this._edgeAdds.get(edgeKey);
    if (existingEdgeAddsHash) {
      // Update eAdds with higher order hash
      if (hashCompare(existingEdgeAddsHash, hash) < 0) {
        this._edgeAdds.set(edgeKey, hash);
      }
      return ok(undefined);
    }

    // If (parent, child) exists in eRems
    const existingEdgeRemovesHash = this._edgeRemoves.get(edgeKey);
    if (existingEdgeRemovesHash) {
      // Update eRems with higher order hash
      if (hashCompare(existingEdgeRemovesHash, hash) < 0) {
        this._edgeRemoves.set(edgeKey, hash);
      }
      return ok(undefined);
    }

    // If parent exists in vAdds or custody
    if (this._vertexAdds.has(parentPubKey) || this._custodySigners.has(parentPubKey)) {
      // If child does not exist in vertices
      if (!this._vertices.has(childPubKey)) {
        // Add child to vAdds and (a,b) to eAdds
        this._vertexAdds.add(childPubKey);
        this._edgeAdds.set(edgeKey, hash);

        return ok(undefined);
      }

      // If child exists in vAdds
      else if (this._vertexAdds.has(childPubKey)) {
        // Get all parents of parentPubKey by traversing edgeAdds
        const parentsOfParent: string[] = [];
        let parentEdgesToTraverse = this._edgeAddsByChild.get(parentPubKey) || new Set();
        while (parentEdgesToTraverse.size > 0) {
          const newParentEdgesToTraverse = new Set<string>();
          parentEdgesToTraverse.forEach((edgeKey) => {
            const { parentPubKey } = this.getPubKeysFromEdgeKey(edgeKey);
            parentsOfParent.push(parentPubKey);
            // Stop traversal once a custody signer is found
            if (!this._custodySigners.has(parentPubKey)) {
              (this._edgeAddsByChild.get(parentPubKey) || new Set()).forEach((parentEdgeKey) =>
                newParentEdgesToTraverse.add(parentEdgeKey)
              );
            }
          });
          parentEdgesToTraverse = newParentEdgesToTraverse;
        }

        // If parents of parentPubKey includes childPubKey (i.e. a cycle)
        if (parentsOfParent.includes(childPubKey)) {
          // Add (parent, child) to edgeRemoves
          this._edgeRemoves.set(edgeKey, hash);
          return ok(undefined);
        }

        // For each edge (*, child) in edgeAdds (though there should be only one parent)
        (this._edgeAddsByChild.get(childPubKey) || new Set()).forEach((existingEdgeKey) => {
          const existingEdgeHash = this._edgeAdds.get(existingEdgeKey);
          if (!existingEdgeHash) return err('SignerSet.add: unexpected state');

          // If existing message wins
          if (hashCompare(existingEdgeHash, hash) > 0) {
            // Add (parent, child) to eRems
            this._edgeRemoves.set(edgeKey, hash);
          }

          // If new message wins
          else {
            // Move existing edge to eRems
            this._edgeAdds.delete(existingEdgeKey);
            this._edgeRemoves.set(existingEdgeKey, existingEdgeHash);
            // Add (parent, child) to eAdds
            this._edgeAdds.set(edgeKey, hash);
          }
        });

        return ok(undefined);
      }

      // If child exists in vRems
      else if (this._vertexRemoves.has(childPubKey)) {
        // Add (parent, child) to eRems
        this._edgeRemoves.set(edgeKey, hash);
        return ok(undefined);
      }
    }

    // If parent exists in vRems
    else if (this._vertexRemoves.has(parentPubKey)) {
      // If child does not exist in vertices
      if (!this._vertices.has(childPubKey)) {
        // Add child to vRems
        this._vertexRemoves.add(childPubKey);
        // Add (parent, child) to eRems
        this._edgeRemoves.set(edgeKey, hash);
        return ok(undefined);
      }

      // If child exists in vAdds
      else if (this._vertexAdds.has(childPubKey)) {
        // Add (parent, child) to eRems
        this._edgeRemoves.set(edgeKey, hash);

        // For all (child,*) in edges, remove subtree (child and all children vertices and edges)
        this.removeSubtree(childPubKey);

        return ok(undefined);
      }

      // If child exists in vRems
      else if (this._vertexRemoves.has(childPubKey)) {
        // Add (parent,child) to eRems
        this._edgeRemoves.set(edgeKey, hash);

        return ok(undefined);
      }
    }

    // TODO: do we ever get here?
    return ok(undefined);
  }

  private remove(parentPubKey: string, childPubKey: string): Result<void, string> {
    const edgeKey = this.getEdgeKey(parentPubKey, childPubKey);

    // If (parent, child) does not exist in graph
    if (!this._edges.has(edgeKey)) return err('SignerSet.remove: edge does not exist');

    // If child exists in vAdds
    if (this._vertexAdds.has(childPubKey)) {
      // Remove subtree
      const res = this.removeSubtree(childPubKey);
      if (res.isErr()) return res;

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

  private removeEdge(edgeKey: string): Result<void, string> {
    const { parentPubKey, childPubKey } = this.getPubKeysFromEdgeKey(edgeKey);
    return this.remove(parentPubKey, childPubKey);
  }

  /**
   * removeSubtree performs three operations given a public key (root of the subtree):
   * 1. Move parent edge (*,root) from eAdds to eRems
   * 2. Move root to vRems
   * 3. For all edges (root,*), run remove(root,*), recursively removing the descendents of root
   */
  private removeSubtree(rootPubKey: string): Result<void, string> {
    // For all (*,root) in eAdds, move to eRems
    (this._edgesByChild.get(rootPubKey) || new Set()).forEach((edgeKey) => {
      const existingHash = this._edgeAdds.get(edgeKey);
      if (!existingHash) return err('SignerSet.removeSubtree: unexpected state');

      this._edgeAdds.delete(edgeKey);
      this._edgeRemoves.set(edgeKey, existingHash);
    });

    // Move root to vRems
    this._vertexAdds.delete(rootPubKey);
    this._vertexRemoves.add(rootPubKey);

    // Remove all edges where rootPubKey is parent
    const parentEdges = this._edgesByParent.get(rootPubKey) || new Set();
    parentEdges.forEach((edgeKey) => {
      const res = this.removeEdge(edgeKey);
      if (res.isErr()) return res;
    });

    return ok(undefined);
  }

  /**
   * Testing Methods
   */

  _reset(): void {
    this._custodySigners = new Set();
    this._vertexAdds = new Set();
    this._vertexRemoves = new Set();
    this._edgeAdds = new Map();
    this._edgeRemoves = new Map();
    this._messages = new Map();
  }

  _numSigners(): number {
    return this._custodySigners.size;
  }

  _getCustodySigners() {
    return this._custodySigners;
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

  _getEdges() {
    return this._edges;
  }

  _getMessages() {
    return this._messages;
  }
}

export default SignerSet;
