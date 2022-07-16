import { Signature } from 'ethers';

export interface SignerAddition {
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

class SignerNode {
  public pubkey: string;
  public delegates: SignerNode[];

  constructor(pubkey: string) {
    this.pubkey = pubkey;
    this.delegates = [];
  }

  addDelegate(child: SignerNode) {
    this.delegates.push(child);
  }

  removeDelegate(pubkey: string): boolean {
    return false;
  }
}

class Signer {
  public custodyAddressRoot: SignerNode;
  constructor(custodyAddressPubkeyRoot: string) {
    this.custodyAddressRoot = new SignerNode(custodyAddressPubkeyRoot);
  }

  // addDelegate adds a delegate key to a parent key if possible.
  // returns true if so, else returns false
  public addDelegate(parentKeyPublicKey: string, childKeyPublicKey: string): boolean {
    // traverse tree until parent key is found
    const parentKeyNode = this.getNodeWithPubkey(parentKeyPublicKey, this.custodyAddressRoot);
    if (parentKeyNode === null) {
      return false;
    }

    // confirm child key does not exist
    const childKeyNode = this.getNodeWithPubkey(childKeyPublicKey, this.custodyAddressRoot);
    if (childKeyNode !== null) {
      return false;
    }

    // TODO: once we are tracking removed nodes, we must ensure child node is not found inside the removed set either

    const delegate = new SignerNode(childKeyPublicKey);
    parentKeyNode.addDelegate(delegate);

    return true;
  }

  // removeDelegate removes a delegate from a parent key and cascade removes all keys in the subtree
  // returns true if possible, else returns false
  public removeDelegate(parentKeyPublicKey: string, childKeyPublicKey: string): boolean {
    const parentKeyNode = this.getNodeWithPubkey(parentKeyPublicKey, this.custodyAddressRoot);
    if (parentKeyNode === null) {
      return false;
    }

    for (let delegateIdx = 0; delegateIdx < parentKeyNode.delegates.length; delegateIdx++) {
      const delegate = parentKeyNode.delegates[delegateIdx];
      if (delegate.pubkey === childKeyPublicKey) {
        parentKeyNode.delegates = parentKeyNode.delegates.splice(delegateIdx, delegateIdx);
        return true;
      }
    }

    return false;
  }

  public nodeWithPubkeyExists(pubkeyValue: string): boolean {
    const node = this.getNodeWithPubkey(pubkeyValue, this.custodyAddressRoot);
    if (node === null) {
      return false;
    } else {
      return true;
    }
  }

  private getNodeWithPubkey(pubkeyValue: string, root: SignerNode): SignerNode | null {
    if (root.pubkey === pubkeyValue) {
      return root;
    }

    for (let delegateIdx = 0; delegateIdx < root.delegates.length; delegateIdx++) {
      const delegate = root.delegates[delegateIdx];
      const node = this.getNodeWithPubkey(pubkeyValue, delegate);
      if (node !== null) {
        return node;
      }
    }

    return null;
  }
}

class SignerSet {
  private signers: Signer[];
  private revokedDelegates: Set<string>;

  constructor() {
    this.signers = [];
    this.revokedDelegates = new Set<string>();
  }

  // Verification is done by the Ethereum blockchain i.e. the on-chain register/transfer event
  // that triggers the addition of a Signer is proof the custody address being added owns the associated
  // account id
  public addSigner(custodyAddressPubkey: string): boolean {
    for (let signerIdx = 0; signerIdx < this.signers.length; signerIdx++) {
      const signer = this.signers[signerIdx];
      if (signer.nodeWithPubkeyExists(custodyAddressPubkey)) {
        console.error('node with key value already exists in SignerSet');
        return false;
      }
    }

    this.signers.push(this._newSigner(custodyAddressPubkey));
    return true;
  }

  // addDelegate searches through signers for which parent key to add the key to
  public addDelegate(delegateAddition: SignerAddition): boolean {
    // check if key is in removedNodes set
    if (this.revokedDelegates.has(delegateAddition.envelope.childSignerPubkey)) {
      console.error('delegate key has been revoked for this account: ' + delegateAddition.envelope.childSignerPubkey);
      return false;
    }

    // search through signers for which parent key to add the key to
    for (let signerIdx = 0; signerIdx < this.signers.length; signerIdx++) {
      const signer = this.signers[signerIdx];
      if (signer.addDelegate(delegateAddition.message.body.parentKey, delegateAddition.message.body.childKey)) {
        return true;
      }
    }

    return false;
  }

  // removeDelegate searches through signers for which parent key to add the key to
  public removeDelegate(delegateRemoval: SignerRemove): boolean {
    if (this.revokedDelegates.has(delegateRemoval.message.body.childKey)) {
      console.error('delegate key has already been revoked in this account');
      return false;
    }

    for (let signerIdx = 0; signerIdx < this.signers.length; signerIdx++) {
      const signer = this.signers[signerIdx];
      if (signer.removeDelegate(delegateRemoval.envelope.parentSignerPubkey, delegateRemoval.message.body.childKey)) {
        this.revokedDelegates.add(delegateRemoval.message.body.childKey);
        return true;
      }
    }

    return false;
  }

  // TODO - optional
  public revokePastSigners(): boolean {
    return false;
  }

  public numSigners(): number {
    return this.signers.length;
  }

  private _newSigner(custodyAddressPubkey: string) {
    return new Signer(custodyAddressPubkey);
  }
}

export default SignerSet;
