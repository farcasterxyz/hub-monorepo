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
