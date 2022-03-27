import { SignedMessage } from '~/types';
import { utils } from 'ethers';

export const hashMessage = (item: SignedMessage): string => {
  return hashFCObject(item.message);
};

// TODO: Add unit tests for removal of props and canonicalization.
// TODO: Add documentation to these methods
export const hashFCObject = (object: Record<string, any>): string => {
  // Remove any keys that start with an underscore, which are not supposed to be hashed
  // according to the farcaster spec.
  const objectCopy = JSON.parse(JSON.stringify(object));
  removeProps(objectCopy);

  // recursively canonicalize the object
  return hashString(JSON.stringify(objectCopy));
};

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
