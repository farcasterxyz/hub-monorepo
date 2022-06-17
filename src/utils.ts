import { Message } from '~/types';
import canonicalize from 'canonicalize';
import * as ed from '@noble/ed25519';
import { blake2b } from 'ethereum-cryptography/blake2b';
import { hexToBytes, utf8ToBytes } from 'ethereum-cryptography/utils';

export const hashMessage = async (item: Message): Promise<string> => {
  return await hashFCObject(item.data);
};

/**
 * Calculates a unique hash for an object according to the Farcaster spec.
 *
 * The object is canonicalized before hashing, and all properties that start with an underscore are removed,
 * after which the string is passed to keccak256.
 */
export const hashFCObject = async (object: Record<string, any>): Promise<string> => {
  // Remove any keys that start with _ before hashing, as these are intended to be unhashed.
  const objectCopy = JSON.parse(JSON.stringify(object));
  removeProps(objectCopy);

  // Canonicalize the object according to JCS: https://datatracker.ietf.org/doc/html/rfc8785
  const canonicalizedObject = canonicalize(objectCopy) || '';
  return await hashString(canonicalizedObject);
};

/** Calculates the blake2b hash for a string*/
export const hashString = async (str: string): Promise<string> => {
  // Double conversion is ugly but necessary to work with both hashing and signing libraries
  return convertToHex(blake2b(utf8ToBytes(str)));
};

export const sign = async (text: string, key: Uint8Array): Promise<string> => {
  const message: Uint8Array = hexToBytes(text);
  const signature = await ed.sign(message, key);
  return convertToHex(signature);
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

const removeProps = (obj: Record<string, any>): void => {
  // Recursively remove any properties whose key starts with an _
  if (typeof obj === 'object' && obj != null) {
    Object.getOwnPropertyNames(obj).forEach(function (key) {
      if (key[0] === '_') {
        delete obj[key];
      } else {
        removeProps(obj[key]);
      }
    });
  }
};

/**
 * Compares the lexiocographical order of two hashes using their UTF-16 character values.
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

export const generatePublicPrivateKeys = async (
  instanceNames: string[]
): Promise<Map<string, Map<string, Uint8Array>>> => {
  const publicPrivateKeys = new Map<string, Map<string, Uint8Array>>();

  for (const instanceName of instanceNames) {
    const name = new Map<string, Uint8Array>();
    const privateKey = ed.utils.randomPrivateKey();
    const publicKey = await ed.getPublicKey(privateKey);

    name.set('privateKey', privateKey);
    name.set('publicKey', publicKey);
    publicPrivateKeys.set(instanceName, name);
  }

  return publicPrivateKeys;
};

export const convertToHex = async (text: Uint8Array): Promise<string> => {
  return '0x' + ed.utils.bytesToHex(text);
};
