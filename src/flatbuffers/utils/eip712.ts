import { utils, Wallet } from 'ethers';
import { arrayify } from 'ethers/lib/utils';
import { VerificationEthAddressClaim } from '~/flatbuffers/models/types';

const EIP_712_FARCASTER_DOMAIN = {
  name: 'Farcaster Verify Ethereum Address',
  version: '2.0.0',
  // fixed salt to minimize collisions
  salt: '0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558',
};

const EIP_712_FARCASTER_VERIFICATION_CLAIM = [
  {
    name: 'fid',
    type: 'uint256',
  },
  {
    name: 'address',
    type: 'address',
  },
  {
    name: 'blockHash',
    type: 'bytes32',
  },
  {
    name: 'network',
    type: 'uint8',
  },
];

const EIP_712_FARCASTER_MESSAGE_DATA = [
  {
    name: 'hash',
    type: 'bytes',
  },
];

export const signVerificationEthAddressClaim = async (
  claim: VerificationEthAddressClaim,
  wallet: Wallet
): Promise<Uint8Array> => {
  return arrayify(
    await wallet._signTypedData(
      EIP_712_FARCASTER_DOMAIN,
      { VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM },
      claim
    )
  );
};

export const verifyVerificationEthAddressClaimSignature = (
  claim: VerificationEthAddressClaim,
  signature: Uint8Array
): Uint8Array => {
  return arrayify(
    utils.verifyTypedData(
      EIP_712_FARCASTER_DOMAIN,
      { VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM },
      claim,
      signature
    )
  );
};

export const signMessageHash = async (hash: Uint8Array, wallet: Wallet): Promise<Uint8Array> => {
  return arrayify(
    await wallet._signTypedData(EIP_712_FARCASTER_DOMAIN, { MessageData: EIP_712_FARCASTER_MESSAGE_DATA }, { hash })
  );
};

export const verifyMessageHashSignature = (hash: Uint8Array, signature: Uint8Array): Uint8Array => {
  return arrayify(
    utils.verifyTypedData(
      EIP_712_FARCASTER_DOMAIN,
      { MessageData: EIP_712_FARCASTER_MESSAGE_DATA },
      { hash },
      signature
    )
  );
};
