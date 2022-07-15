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
    console.log(parentKeyPublicKey, childKeyPublicKey);
    return false;
  }

  // removeDelegate removes a delegate from a parent key and cascade removes all keys in the subtree
  // returns true if possible, else returns false
  public removeDelegate(parentKeyPublicKey: string, childKeyPublicKey: string): boolean {
    console.log(parentKeyPublicKey, childKeyPublicKey);
    return false;
  }

  private getParent(parentKeyPublicKey: string): SignerNode | null {
    return null;
  }
}

class SignerSet {
  private signers: Signer[];

  constructor() {
    this.signers = [];
  }

  // Verification is done by the Ethereum blockchain i.e. the on-chain register/transfer event
  // that triggers the addition of a Signer is proof the custody address being added owns the associated
  // account id
  public addSigner(custodyAddressPubkey: string): boolean {
    this.signers.push(this._newSigner(custodyAddressPubkey));
    return true;
  }

  // addDelegate searches through signers for which parent key to add the key to
  public addDelegate(delegateAddition: SignerAddition): boolean {
    // search through signers for which parent key to add the key to
    return true;
  }

  // removeDelegate searches through signers for which parent key to add the key to
  public removeDelegate(delegatePubkey: string): boolean {
    // search through signers for which parent key to add the key to
    return true;
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
