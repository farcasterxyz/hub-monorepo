import { SignedMessage } from '~/types';
import { utils } from 'ethers';

// TODO: ignore hashing for _properties
export const hashMessage = (item: SignedMessage): string => {
  const stringifiedProps = JSON.stringify(item.message);
  return utils.keccak256(utils.toUtf8Bytes(stringifiedProps));
};

export const sign = (text: string, key: utils.SigningKey): string => {
  return utils.joinSignature(key.signDigest(text));
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
