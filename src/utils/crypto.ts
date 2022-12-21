import * as ed from '@noble/ed25519';
import canonicalize from 'canonicalize';
import { blake2b } from 'ethereum-cryptography/blake2b';
import { hexToBytes, utf8ToBytes } from 'ethereum-cryptography/utils';
import { ethers, utils } from 'ethers';
import { Ed25519Signer, EthereumSigner, KeyPair, Message, SignatureAlgorithm } from '~/types';

export const hashMessage = async (item: Message): Promise<string> => {
  return await hashFCObject(item.data);
};

/**
 * Calculates a unique hash for an object according to the Farcaster spec.
 *
 * The object is canonicalized before hashing, and all properties that start with an underscore are removed,
 * after which the string is passed to blake2b.
 */
export const hashFCObject = async (object: Record<string, any>): Promise<string> => {
  // Remove any keys that start with _ before hashing, as these are intended to be unhashed.
  const objectCopy = JSON.parse(JSON.stringify(object));
  removeProps(objectCopy);

  // Canonicalize the object according to JCS: https://datatracker.ietf.org/doc/html/rfc8785
  const canonicalizedObject = canonicalize(objectCopy) || '';
  return await blake2BHash(canonicalizedObject);
};

/** Calculates the blake2b hash for a string*/
export const blake2BHash = async (str: string): Promise<string> => {
  // Double conversion is ugly but necessary to work with both hashing and signing libraries
  return convertToHex(blake2b(utf8ToBytes(str)));
};

/** Signs message with ed25519 elliptic curve */
export const signEd25519 = async (text: string, key: Uint8Array): Promise<string> => {
  const message: Uint8Array = hexToBytes(text);
  const signature = await ed.sign(message, key);
  return convertToHex(signature);
};

/** Signs message with secp256k1 elliptic curve */
export const signSecp256k1 = (text: string, key: utils.SigningKey): string => {
  return utils.joinSignature(key.signDigest(text));
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const removeProps = (obj: Record<string, any>): void => {
  // Recursively remove any properties whose key starts with an _
  if (typeof obj === 'object' && obj != null) {
    Object.getOwnPropertyNames(obj).forEach((key) => {
      if (key[0] === '_') {
        delete obj[key];
      } else {
        removeProps(obj[key]);
      }
    });
  }
};

/**
 * Compares the lexicographical order of two hashes using their UTF-16 character values.
 * Returns negative values if a < b, 0 if a = b and positive values if a > b.
 **/
export const hashCompare = (a: string, b: string): number => {
  const asciiA = a?.charCodeAt(0);
  const asciiB = b?.charCodeAt(0);

  if (!asciiA && !asciiB) {
    return 0;
  } else if (!asciiA) {
    return -1;
  } else if (!asciiB) {
    return 1;
  } else {
    const diff = asciiA - asciiB;

    if (diff != 0) {
      return diff;
    } else {
      return hashCompare(a.slice(1), b.slice(1));
    }
  }
};

export const generateEd25519KeyPair = async (): Promise<KeyPair> => {
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKey(privateKey);

  const newKeyPair: KeyPair = {
    privateKey: privateKey,
    publicKey: publicKey,
  };
  return newKeyPair;
};

export const convertToHex = async (text: Uint8Array): Promise<string> => {
  return '0x' + ed.utils.bytesToHex(text);
};

/**
 * generateEd25519Signer creates a MessageSigner with an Ed25519 private key,
 * public key as signerKey, and Ed25519 signature type.
 *
 * Messages can be signed using ed.sign() and verified using ed.verify()
 */
export const generateEd25519Signer = async (): Promise<Ed25519Signer> => {
  const { privateKey, publicKey } = await generateEd25519KeyPair();
  const signerKey = await convertToHex(publicKey);
  return { privateKey, signerKey, type: SignatureAlgorithm.Ed25519 };
};

/**
 * Creates an EthereumSigner which contains an ethers wallet, lowercased wallet address and
 * signature type. Messages can be signed with wallet.signMessage(), which creates an EIP 191
 * version 0x45 compliant signature, and verified using wallet.verifyMessage().
 */
export const generateEthereumSigner = async (): Promise<EthereumSigner> => {
  const wallet = new ethers.Wallet(ethers.utils.randomBytes(32));
  const signerKey = wallet.address.toLowerCase();
  return { wallet, signerKey, type: SignatureAlgorithm.EthereumPersonalSign };
};

export const sanitizeSigner = (signer: string): string => {
  return signer.toLowerCase();
};
