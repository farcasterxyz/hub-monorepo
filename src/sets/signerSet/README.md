**This is really just being treated as a scratchpad at the moment**

### Notes:

from https://farcasterxyz.notion.site/Signer-Set-85706ad04aea4bb6a3ac4e30f07bcd09 - a bi-directional, tree data structure that tracks public keys that can sign messages for an account - The root node is set to the custody address keypair's public key - The root node can authorize other keypairs to sign messages on its behalf - Authorized keypairs are known as "Delegates". Delegate public key is added as a child node in the tree. - assumption: each level of depth can have n nodes since a parent can create as many imediate Delegates as they want - user can change custody address which creates new, parallel tree structure - older structure remains valid until user explicitly revokes them, I assume by revoking root node signing authorization - SignerSet is used by other sets [should this Hub? Why does validation need to happen from within another Set? Because a signature is required to signal validation has passed?] for validating new messages - validation passes only if the message is signed by a key inside this set - when a key is revoked, all messages must be deleted - reason: messages coming in are unordered so impossible to tell if a message is created from an Attacker or Owner - all prior custody keys remain valid - signerSet is set of Signer tree structures - nuke message that lets you nuke all prior messages - what creates a new signer (v2) - registering a new account id --> register event - calling transfer function --> transfer event - https://github.com/farcasterxyz/protocol#46-root-signer-revocations (optional but would be good to get in if possible) - 1-1 account id <-> custody address - prior custody address can auth a delegate that signs messages

Questions: - is parentKey in https://github.com/merkle-manufactory/backend/blob/be593d2d54ebeeb7353cb9ae3c60fc62a92e790d/src/util/shared/types/backendApi.ts#L944 the publicKey string representation of the keypair? - I assume child key pairs of depth = n can only be authorized by parent key pairs of depth = n -1 - However, keypairs of depth = n can be revoked by any parent of depth <= n-1 -- WRONG. Only the immediate parent can revoke its chil
d. - why do we care about whether a key to be added was removed in the past? as seen in https://farcasterxyz.notion.site/Signer-Set-85706ad04aea4bb6a3ac4e30f07bcd09 - for removeKey, does the parent need to be childKeyDepth - 1 strictly or anything <= childKeyDepth - 1?

- will the message be associated with a public key such that the Hub that is doing the validation can query for the SignerSet that contains the public key? Will that be part of the implementation?

### Synthesis:

```
SignerSet {
constructor(custodyAddressPublicKey: string)

      addKey(parentKeyPublicKey string, childKeyPublicKey string): boolean
      addSigner(): boolean

      addDelegate(signerAddition)
      removeDelegate(parentKeyPublicKey string, childKeyPublicKey string): boolean
      removePriorSigners(): boolean
    }
```

### AddDelegate

inputs: SignerAddition
assumptions: validation has already been done by engine and we just need to insert if possible

Naive solution:

- iterate through all Signers
- for each Signer, traverse the entire tree and check if a parent key is found. Once the parent key is found, return the parent key
- Check if the parent key has a child with the pubkey value

Pros:

- doesn't require changing/ adding data structures

Cons:

- can get slow as more delegates \* signers are added

consider: adding a parentKeyIndex

### Saturday Plan

Remaining SignerSet implementation work:

- **Core logic**

1. A delegate with a key value that has been removed in the past can still be added today. We need to add logic to prevent delegates from being added if they have been removed in the past.
2. Optional: revoke past signers

- **Edge cases**

1. Two nodes concurrently add the same child in the same tree. Resolve this by invalidating one of the children. The one to keep is the one with the highest lexicographical hash.
2. Concurrently add a child and remove a subtree that contains the child. We must ensure that the child is permanently revoked and new edge is not added into tree.
3. Concurrently add child into two separate trees. Remove one of the edges or ensure a revocation is global i.e. applies across all Signers.

- **Cleanup work**

1. Change Spec to be up-to-date with implementation in terms of terminology, for SignerSet scoped content. (e.g. Accounts are written "Usernames" in spec)
2. Inline code docs
3. README.md should be a usage doc and this scratchpad should be moved to a .scratch.md file.

- **Hub integration**

Presupposition: these operations are run through the simulator.

1. Network observes register event and makes a request to add a Signer to SignerSet for an account id.
2. Network observes transfer event and makes a request to add a Signer to SignerSet for an account id.
3. Hub processes an `addDelegate` request from client.
4. Hub processes a `removeDelegate` request from client.
5. Bonus: test concurrency edge cases

- **Questions for Varun + Shane**

1. We talked about opportunistically removing notion of Root as I'm working on SignerSet implementation. Why is the notion of Root outdated?
2. Why exactly do we want to prevent past removed Delegates from being added in the future to any of the Signers?
