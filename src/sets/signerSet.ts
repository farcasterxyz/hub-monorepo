/* 
  Notes:
    from https://farcasterxyz.notion.site/Signer-Set-85706ad04aea4bb6a3ac4e30f07bcd09
    - a bi-directional, tree data structure that tracks public keys that can sign messages for an account
    - The root node is set to the custody address keypair's public key
      - The root node can authorize other keypairs to sign messages on its behalf
      - Authorized keypairs are known as "Delegates". Delegate public key is added as a child node in the tree. 
    - assumption: each level of depth can have n nodes since a parent can create as many imediate Delegates as they want
    - user can change custody address which creates new, parallel tree structure
      - older structure remains valid until user explicitly revokes them, I assume by revoking root node signing authorization
    - SignerSet is used by other sets [should this Hub? Why does validation need to happen from within another Set? Because a signature is required to signal validation has passed?] for validating new messages
      - validation passes only if the message is signed by a key inside this set
      - question: will the message be associated with a public key such that the Hub that is doing the validation can query for the SignerSet that contains the public key? Will that be part of the implementation?
    - when a key is revoked, all messages must be deleted
      - reason: messages coming in are unordered so impossible to tell if a message is created from an Attacker or Owner
    - 

  Synthesis:
    SignerSet {
      constructor(custodyAddressPublicKey: string)

      addKey(parentKeyPublicKey string, childKeyPublicKey string): boolean
      removeKey(parentKeyPublicKey string, childKeyPublicKey string): boolean 
    }
*/
class SignerSet {}
