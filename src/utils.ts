import { Message } from '~/types';
import { utils } from 'ethers';
import canonicalize from 'canonicalize';

export const hashMessage = (item: Message): string => {
  return hashFCObject(item.data);
};

/**
 * Calculates a unique hash for an object according to the Farcaster spec.
 *
 * The object is canonicalized before hashing, and all properties that start with an underscore are removed,
 * after which the string is passed to keccak256.
 */
export const hashFCObject = (object: Record<string, any>): string => {
  // Remove any keys that start with _ before hashing, as these are intended to be unhashed.
  const objectCopy = JSON.parse(JSON.stringify(object));
  removeProps(objectCopy);

  // Canonicalize the object according to JCS: https://datatracker.ietf.org/doc/html/rfc8785
  const canonicalizedObject = canonicalize(objectCopy) || '';

  return hashString(canonicalizedObject);
};

/** Calculates the keccak256 hash for a string*/
export const hashString = (str: string): string => {
  return utils.keccak256(utils.toUtf8Bytes(str));
};

export const sign = (text: string, key: utils.SigningKey): string => {
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
    Object.getOwnPropertyNames(obj).forEach(function (key) {
      if (key[0] === '_') {
        delete obj[key];
      } else {
        removeProps(obj[key]);
      }
    });
  }
};

export const lexicographicalCompare = (a: string, b: string): number => {
  const asciiA = a.charCodeAt(0);
  const asciiB = b.charCodeAt(0);

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
      return lexicographicalCompare(a.slice(1), b.slice(1));
    }
  }
};
