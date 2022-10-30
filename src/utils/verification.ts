import { ethers } from 'ethers';
import { arrayify } from 'ethers/lib/utils';
import { VerificationEthAddressClaim } from '~/storage/flatbuffers/types';

const EIP_712_DOMAIN = {
  name: 'Farcaster Verify Ethereum Address',
  version: '2.0.0',
  // fixed salt to minimize collisions
  salt: '0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558',
};

const EIP_712_TYPES = {
  VerificationClaim: [
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
  ],
};

export const signVerificationEthAddressClaim = async (
  claim: VerificationEthAddressClaim,
  wallet: ethers.Wallet
): Promise<Uint8Array> => {
  return arrayify(await wallet._signTypedData(EIP_712_DOMAIN, EIP_712_TYPES, claim));
};

export const verifyVerificationEthAddressClaimSignature = (
  claim: VerificationEthAddressClaim,
  signature: Uint8Array
): Uint8Array => {
  return arrayify(ethers.utils.verifyTypedData(EIP_712_DOMAIN, EIP_712_TYPES, claim, signature));
};
