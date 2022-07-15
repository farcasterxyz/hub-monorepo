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
    - when a key is revoked, all messages must be deleted
      - reason: messages coming in are unordered so impossible to tell if a message is created from an Attacker or Owner
    - all prior custody keys remain valid
    - signerSet is set of Signer tree structures
    - nuke message that lets you nuke all prior messages 
    - what creates a new signer (v2)
      - registering a new account id --> register event 
      - calling transfer function --> transfer event
    - https://github.com/farcasterxyz/protocol#46-root-signer-revocations (optional but would be good to get in if possible)
    - 1-1 account id <-> custody address
    - prior custody address can auth a delegate that signs messages
  
  Questions:
    - is parentKey in https://github.com/merkle-manufactory/backend/blob/be593d2d54ebeeb7353cb9ae3c60fc62a92e790d/src/util/shared/types/backendApi.ts#L944 the publicKey string representation of the keypair?
    - I assume child key pairs of depth = n can only be authorized by parent key pairs of depth = n -1
    - However, keypairs of depth = n can be revoked by any parent of depth <= n-1 -- WRONG. Only the immediate parent can revoke its chil
    d.
    - why do we care about whether a key to be added was removed in the past? as seen in https://farcasterxyz.notion.site/Signer-Set-85706ad04aea4bb6a3ac4e30f07bcd09
    - for removeKey, does the parent need to be childKeyDepth - 1 strictly or anything <= childKeyDepth - 1?  
    - will the message be associated with a public key such that the Hub that is doing the validation can query for the SignerSet that contains the public key? Will that be part of the implementation?    

  Synthesis:
    SignerSet {
      constructor(custodyAddressPublicKey: string)

      addKey(parentKeyPublicKey string, childKeyPublicKey string): boolean
      addSigner(): boolean      

      removeKey(parentKeyPublicKey string, childKeyPublicKey string): boolean 
      removePriorSigners(): boolean
    }
*/

import { Signature } from 'ethers';

export interface SignerAddition {
  message: {
    body: {
      parentKey: string;
      childKey: string;
      schema: string;
    };
    address: string;
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

export enum SignatureAlgorithm {
  EcdsaSecp256k1 = 'ecdsa-secp256k1',
  Ed25519 = 'ed25519',
}

export enum HashAlgorithm {
  Keccak256 = 'keccak256',
  Blake2b = 'blake2b',
}

class SignerNode {
  public pubkey: string;
  public delegates: SignerNode[];

  constructor(pubkey: string) {
    this.pubkey = pubkey;
    this.delegates = [];
  }

  addChild(child: SignerNode) {
    this.delegates.push(child);
  }
}

class Signer {
  public custodyAddressRoot: SignerNode;
  constructor(custodyAddressPubkey: string, firstChildPubkey: string) {
    this.custodyAddressRoot = new SignerNode(custodyAddressPubkey);

    const childSignerNode = new SignerNode(firstChildPubkey);
    this.custodyAddressRoot.addChild(childSignerNode);
  }

  // TODO
  public addKey(parentKeyPublicKey: string, childKeyPublicKey: string): boolean {
    console.log(parentKeyPublicKey, childKeyPublicKey);
    return false;
  }

  // TODO
  public removeKey(parentKeyPublicKey: string, childKeyPublicKey: string): boolean {
    console.log(parentKeyPublicKey, childKeyPublicKey);
    return false;
  }
}

class SignerSet {
  private signers: Signer[];

  constructor(signerAddition: SignerAddition) {
    this.signers = [];
    this.signers.push(this._newSigner(signerAddition));
  }

  public addSigner(signerAddition: SignerAddition): boolean {
    this.signers.push(this._newSigner(signerAddition));
    return true;
  }

  // TODO
  public addKey(signerKeyAddition: SignerAddition): boolean {
    // search through signers for which parent key to add the key to
    return true;
  }

  // TODO - optional
  public revokePastSigners(): boolean {
    return false;
  }

  private _newSigner(signerAddition: SignerAddition) {
    return new Signer(signerAddition.envelope.parentSignerPubkey, signerAddition.envelope.childSignerPubkey);
  }
}

export default SignerSet;
