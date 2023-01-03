import { utils, Wallet } from 'ethers';
import { arrayify } from 'ethers/lib/utils';
import { VerificationEthAddressClaim } from '~/flatbuffers/models/types';
import { bytesToHexString, hexStringToBytes } from '~/flatbuffers/utils/bytes';

export const EIP_712_FARCASTER_DOMAIN = {
  name: 'Farcaster Verify Ethereum Address',
  version: '2.0.0',
  // fixed salt to minimize collisions
  salt: '0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558',
};

export const EIP_712_FARCASTER_VERIFICATION_CLAIM = [
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

export const EIP_712_FARCASTER_MESSAGE_DATA = [
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
  const signature = hexStringToBytes(
    await wallet._signTypedData(EIP_712_FARCASTER_DOMAIN, { MessageData: EIP_712_FARCASTER_MESSAGE_DATA }, { hash })
  );
  if (signature.isErr()) {
    throw signature.error;
  }
  return signature.value;
};

export const verifyMessageHashSignature = (hash: Uint8Array, signature: Uint8Array): Uint8Array => {
  // Convert little endian signature to hex
  const hexSignature = bytesToHexString(signature, { endianness: 'little' });
  if (hexSignature.isErr()) {
    throw hexSignature.error;
  }

  // Recover address from signature
  const recoveredHexAddress = utils.verifyTypedData(
    EIP_712_FARCASTER_DOMAIN,
    { MessageData: EIP_712_FARCASTER_MESSAGE_DATA },
    { hash },
    hexSignature.value
  );

  // Convert hex address to little endian bytes
  const recoveredAddress = hexStringToBytes(recoveredHexAddress, { endianness: 'little' });
  if (recoveredAddress.isErr()) {
    throw recoveredAddress.error;
  }
  return recoveredAddress.value;
};
