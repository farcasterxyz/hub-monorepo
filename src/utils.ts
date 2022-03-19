import { SignedMessage } from '~/types';
import { utils } from 'ethers';

export const hashMessage = (item: SignedMessage): string => {
  const stringifiedProps = JSON.stringify(item.message);
  return utils.keccak256(utils.toUtf8Bytes(stringifiedProps));
};

export const sign = (text: string, key: utils.SigningKey): string => {
  return utils.joinSignature(key.signDigest(text));
};
