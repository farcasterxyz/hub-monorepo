import { Result, ok, err } from 'neverthrow';
import { SignerAdd, SignerMessage, SignerRemove } from '~/types';
import { isSignerAdd, isSignerRemove } from '~/types/typeguards';
import { hashCompare } from '~/utils';

/*   
  SignerSet manages the account's associated custody addresses authorized 
  for Signing and their corresponding delegates.

  Read more about the SignerSet in the protocol docs: https://github.com/farcasterxyz/protocol#45-signer-authorizations

  This implementation uses a modified 2P2P set. There are four sets in total:

  (1) vertexAdds: add set for vertices
  (2) vertexRemoves: remove set for vertices
  (3) edgeAdds: add set for edges
  (4) edgeremoves: remove set for edges
  
  The design diverges from a conventional 2P2P set in two ways:

  (1) Vertices and edges are moved between sets, so a given vertex or edge can only exist in 
      its respective adds or removes set 
  (2) The edges set store the edge tuple (parentKey, childKey) as well as the hash of the SignerAdd
      message that added that edge to the graph

  In practice, there is a constraint that the edges add set is a tree and the edges 
  remove set is a rooted directed graph. But that constraint is only a bi-product of the add
  and remove methods, and it is not enforced by the data structure. This implementation 
  favors keeping the edgeAdds and edgeRemoves data structure the same, which makes the sets
  easier to compare. But this decision has two downsides:

  (1) Tree and edge traversal is not as efficient as it could be. See the getEdgesByChild 
      and getEdgesbyParent methods which filter keys in the edges maps by the child or parent 
      members of the tuple.
  (2) At points in the code where we need to get the parent of a vertex b in edgeAdds, we
      loop through edges in edgeAdds where (*,b) even though practically we know there is only
      one edge that fits that criteria. See the removeSubtree method for an example.
*/
class SignerSet {
  private _custodyAdds: Set<string>; // custody address
  private _custodyRemoves: Set<string>; // custody address
  private _vertexAdds: Set<string>; // pubKey
  private _vertexRemoves: Set<string>; // pubKey
  private _edgeAdds: Map<string, string>; // <parentKey, childKey>, hash
  private _edgeRemoves: Map<string, string>; // <parentKey, childKey>, hash
  private _messages: Map<string, SignerMessage>; // message hash => SignerAdd | SignerRemove

  constructor() {
    this._custodyAdds = new Set();
    this._custodyRemoves = new Set();
    this._vertexAdds = new Set();
    this._vertexRemoves = new Set();
    this._edgeAdds = new Map();
    this._edgeRemoves = new Map();
    this._messages = new Map();
  }

  // TODO: add more helper functions as we integrate signer set into engine

  getCustodyAddresses(): Set<string> {
    return this._custodyAdds;
  }

  getDelegateSigners(): Set<string> {
    return this._vertexAdds;
  }

  getAllSigners(): Set<string> {
    return new Set([...this._custodyAdds, ...this._vertexAdds]);
  }

  isValidSigner(signerKey: string) {
    return this.isValidDelegateSigner(signerKey) || this.isValidCustodySigner(signerKey);
  }

  isValidCustodySigner(custodyAddress: string) {
    return this._custodyAdds.has(this.sanitizeKey(custodyAddress));
  }

  isValidDelegateSigner(signerKey: string) {
    return this._vertexAdds.has(this.sanitizeKey(signerKey));
  }

  sanitizeKey(key: string): string {
    return key.toLowerCase();
  }

  constructEdgeKey(parentKey: string, childKey: string): string {
    return [this.sanitizeKey(parentKey), this.sanitizeKey(childKey)].toString();
  }

  deconstructEdgeKey(edgeKey: string): { parentKey: string; childKey: string } {
    const [parentKey, childKey] = edgeKey.split(',');
    return { parentKey, childKey };
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

  /**
   * addCustody adds a custody address to custodyAdds set.
   *
   * @param custodyAddress - custody address to add to custodyAdds set
   */
  addCustody(custodyAddress: string): Result<void, string> {
    const sanitizedAddress = this.sanitizeKey(custodyAddress);

    // No-op if address already exists in custodyAdds
    if (this._custodyAdds.has(sanitizedAddress)) return ok(undefined);

    // Fail if address already exists as a delegate
    if (this._vertices.has(sanitizedAddress))
      return err('SignerSet.addCustody: custodyAddress already exists as a delegate');

    // Fail if address has already been removed
    if (this._custodyRemoves.has(sanitizedAddress)) return err('SignerSet.addCustody: custodyAddress has been removed');

    // Add address to custodyAdds set
    this._custodyAdds.add(sanitizedAddress);
    return ok(undefined);
  }

  /**
   * removeCustody moves a custody address from the custodyAdds set to the custodyRemoves set.
   *
   * @param custodyAddress - custody address to move to custodyRemoves set
   */
  removeCustody(custodyAddress: string): Result<void, string> {
    const sanitizedAddress = this.sanitizeKey(custodyAddress);

    // No-op if address already exists in custodyRemoves
    if (this._custodyRemoves.has(sanitizedAddress)) return ok(undefined);

    // Fail if address does not exist in custodyAdds
    if (!this._custodyAdds.has(sanitizedAddress)) return err('SignerSet.removeCustody: custodyAddress does not exist');

    // For each edge (custody, *), remove subtree
    for (const edgeKey of this._edgeAddsByParent.get(sanitizedAddress) || new Set()) {
      const { childKey } = this.deconstructEdgeKey(edgeKey);
      const res = this.removeSubtree(childKey);
      if (res.isErr()) return res;
    }

    // Move address from custodyAdds to custodyRemoves
    this._custodyAdds.delete(sanitizedAddress);
    this._custodyRemoves.add(sanitizedAddress);
    return ok(undefined);
  }

  /**
   * Private Methods
   */

  private get _vertices() {
    return new Set([...this._vertexAdds, ...this._vertexRemoves]);
  }

  private get _edges() {
    return new Map([...this._edgeAdds, ...this._edgeRemoves]);
  }

  private get _custodyAddresses() {
    return new Set([...this._custodyAdds, ...this._custodyRemoves]);
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

  /**
   * getEdgesByChild returns a Map where each key is a child vertex in the input edges set, and each value
   * is a set of edges (as edge tuple strings) that contain the childKey as the child.
   *
   * For example, getEdgesByChild({"parentA,childB" => "hashC"}) => {"childB" => Set(["parentA,childB"])}
   *
   * @param edges - a map of (parent, child) tuple strings to message hashes (i.e. _edgeAdds, _edgeRemoves, _edges)
   */
  private getEdgesByChild(edges: Map<string, string>) {
    const byChildMap = new Map<string, Set<string>>();
    for (const edgeKey of edges.keys()) {
      const { childKey } = this.deconstructEdgeKey(edgeKey);
      const existingSet = byChildMap.get(childKey) || new Set();
      existingSet.add(edgeKey);
      byChildMap.set(childKey, existingSet);
    }
    return byChildMap;
  }

  /**
   * getEdgesByParent returns a Map where each key is a parent vertex in the input edges set, and each value
   * is a set of edges (as edge tuple strings) that contain the parentKey as the parent.
   *
   * For example, getEdgesByParent({"parentA,childB" => "hashC"}) => {"parentA" => Set(["parentA,childB"])}
   *
   * @param edges - a map of (parent, child) tuple strings to message hashes (i.e. _edgeAdds, _edgeRemoves, _edges)
   */
  private getEdgesByParent(edges: Map<string, string>) {
    const byParentMap = new Map<string, Set<string>>();
    for (const edgeKey of edges.keys()) {
      const { parentKey } = this.deconstructEdgeKey(edgeKey);
      const existingSet = byParentMap.get(parentKey) || new Set();
      existingSet.add(edgeKey);
      byParentMap.set(parentKey, existingSet);
    }
    return byParentMap;
  }

  /**
   * mergeSignerAdd calls add using the contents of the supplied SignerAdd message and adds message
   * to the messages map if add was successful
   *
   * @param message - a SignerAdd message
   */
  private mergeSignerAdd(message: SignerAdd): Result<void, string> {
    const parentKey = this.sanitizeKey(message.signer);
    const childKey = this.sanitizeKey(message.data.body.childKey);

    const res = this.add(parentKey, childKey, message.hash);
    if (res.isErr()) return res;

    this._messages.set(message.hash, message);
    return ok(undefined);
  }

  /**
   * mergeSignerRemove calls remove using the contents of the supplied SignerRemove message and adds message
   * to the messages map if remove was successful
   *
   * @param message - a SignerRemove message
   */
  private mergeSignerRemove(message: SignerRemove): Result<void, string> {
    const parentKey = this.sanitizeKey(message.signer);
    const childKey = this.sanitizeKey(message.data.body.childKey);

    const res = this.remove(parentKey, childKey);
    if (res.isErr()) return res;

    this._messages.set(message.hash, message);
    return ok(undefined);
  }

  /**
   * add attemps to add childKey as a delegate of parentKey. See inline comments for detailed behavior.
   *
   * @param parentKey - sanitized parent key (either custody address or delegate public key)
   * @param childKey - sanitized child public key
   * @param hash - relevant SignerAdd message hash
   */
  private add(parentKey: string, childKey: string, hash: string): Result<void, string> {
    const edgeKey = this.constructEdgeKey(parentKey, childKey);

    // If parent is missing
    if (!this._vertices.has(parentKey) && !this._custodyAddresses.has(parentKey)) {
      return err('SignerSet.add: parent does not exist in graph');
    }

    // If parent and child are the same
    if (parentKey === childKey) return err('SignerSet.add: parent and child must be different');

    // If child is a custody address
    if (this._custodyAddresses.has(childKey)) return err('SignerSet.add: child cannot be a custody signer');

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

    // If parent exists in vAdds or custodyAdds
    if (this._vertexAdds.has(parentKey) || this._custodyAdds.has(parentKey)) {
      // If child does not exist in vertices
      if (!this._vertices.has(childKey)) {
        // Add child to vAdds and (a,b) to eAdds
        this._vertexAdds.add(childKey);
        this._edgeAdds.set(edgeKey, hash);

        return ok(undefined);
      }

      // If child exists in vAdds
      else if (this._vertexAdds.has(childKey)) {
        // For each edge (*, child) in edgeAdds (though there should be only one parent)
        const parentEdges = this._edgeAddsByChild.get(childKey) || new Set();
        for (const existingEdgeKey of parentEdges) {
          const existingEdgeHash = this._edgeAdds.get(existingEdgeKey);
          if (!existingEdgeHash) return err('SignerSet.add: unexpected state');

          // If existing message wins
          if (hashCompare(existingEdgeHash, hash) > 0) {
            // Add (parent, child) to eRems
            this._edgeRemoves.set(edgeKey, hash);
          }

          // If new message wins
          else {
            /**
             * Get all ascendents of parentKey in edgeAdds in order to prevent the new edge from
             * creating a cycle in edgeAdds. The new edge (parentKey, childKey) will create
             * a cycle if childKey already exists in the ascendents of parentKey.
             */
            const parentsOfParent: string[] = [];
            let parentEdgesToTraverse = this._edgeAddsByChild.get(parentKey) || new Set();
            while (parentEdgesToTraverse.size > 0) {
              const newParentEdgesToTraverse = new Set<string>();
              parentEdgesToTraverse.forEach((edgeKey) => {
                const { parentKey } = this.deconstructEdgeKey(edgeKey);
                parentsOfParent.push(parentKey);
                // Stop traversal once a custody signer is found
                if (!this._custodyAddresses.has(parentKey)) {
                  (this._edgeAddsByChild.get(parentKey) || new Set()).forEach((parentEdgeKey) =>
                    newParentEdgesToTraverse.add(parentEdgeKey)
                  );
                }
              });
              parentEdgesToTraverse = newParentEdgesToTraverse;
            }

            // If parents of parentKey includes childKey (i.e. a cycle)
            if (parentsOfParent.includes(childKey)) return err('SignerSet.add: cycle detected');

            // Move existing edge to eRems
            this._edgeAdds.delete(existingEdgeKey);
            this._edgeRemoves.set(existingEdgeKey, existingEdgeHash);
            // Add (parent, child) to eAdds
            this._edgeAdds.set(edgeKey, hash);
          }
        }

        return ok(undefined);
      }

      // If child exists in vRems
      else if (this._vertexRemoves.has(childKey)) {
        // Add (parent, child) to eRems
        this._edgeRemoves.set(edgeKey, hash);
        return ok(undefined);
      }
    }

    // If parent exists in vRems or custodyRems
    else if (this._vertexRemoves.has(parentKey) || this._custodyRemoves.has(parentKey)) {
      // If child does not exist in vertices
      if (!this._vertices.has(childKey)) {
        // Add child to vRems
        this._vertexRemoves.add(childKey);
        // Add (parent, child) to eRems
        this._edgeRemoves.set(edgeKey, hash);
        return ok(undefined);
      }

      // If child exists in vAdds
      else if (this._vertexAdds.has(childKey)) {
        // Add (parent, child) to eRems
        this._edgeRemoves.set(edgeKey, hash);

        // For all (child,*) in edges, remove subtree (child and all children vertices and edges)
        this.removeSubtree(childKey);

        return ok(undefined);
      }

      // If child exists in vRems
      else if (this._vertexRemoves.has(childKey)) {
        // Add (parent,child) to eRems
        this._edgeRemoves.set(edgeKey, hash);

        return ok(undefined);
      }
    }

    return ok(undefined);
  }

  /**
   * remove attempts to remove childKey as a delegate of parentKey. See inline comments for detailed behavior.
   *
   * @param parentKey - sanitized parent key (either custody address or delegate public key)
   * @param childKey - sanitized child public key
   */
  private remove(parentKey: string, childKey: string): Result<void, string> {
    const edgeKey = this.constructEdgeKey(parentKey, childKey);

    // If (parent, child) does not exist in graph
    if (!this._edges.has(edgeKey)) return err('SignerSet.remove: edge does not exist');

    // If child exists in vAdds
    if (this._vertexAdds.has(childKey)) {
      // Remove subtree
      const res = this.removeSubtree(childKey);
      if (res.isErr()) return res;

      // For all (child,*) in edges, remove edge
      (this._edgesByParent.get(childKey) || new Set()).forEach((edgeKey) => {
        this.removeEdge(edgeKey);
      });

      return ok(undefined);
    }

    // If child exists in vRems
    if (this._vertexRemoves.has(childKey)) {
      return ok(undefined);
    }

    return ok(undefined);
  }

  /**
   * removeEdge calls remove, pulling the parentKey and childKey arguments
   * from the supplied edgeKey, which is a (parent, child) tuple string
   */
  private removeEdge(edgeKey: string): Result<void, string> {
    const { parentKey, childKey } = this.deconstructEdgeKey(edgeKey);
    return this.remove(parentKey, childKey);
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
    this._custodyAdds = new Set();
    this._custodyRemoves = new Set();
    this._vertexAdds = new Set();
    this._vertexRemoves = new Set();
    this._edgeAdds = new Map();
    this._edgeRemoves = new Map();
    this._messages = new Map();
  }

  _getCustodyAddresses() {
    return this._custodyAddresses;
  }

  _getCustodyAdds() {
    return this._custodyAdds;
  }

  _getCustodyRemoves() {
    return this._custodyRemoves;
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
