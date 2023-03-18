import { recoverAddress, Signer, TypedDataEncoder } from 'ethers';
import { bytesToHexString, hexStringToBytes } from '../bytes';
import { VerificationEthAddressClaim } from '../verifications';

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
  signer: Signer
): Promise<Uint8Array> => {
  const hexSignature = await signer.signTypedData(
    EIP_712_FARCASTER_DOMAIN,
    { VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM },
    claim
  );
  const bytes = hexStringToBytes(hexSignature);
  if (bytes.isErr()) throw bytes.error;
  return bytes.value;
};

export const verifyVerificationEthAddressClaimSignature = (
  claim: VerificationEthAddressClaim,
  signature: Uint8Array
): Uint8Array => {
  const signatureHexResult = bytesToHexString(signature);
  if (signatureHexResult.isErr()) throw signatureHexResult.error;

  // Recover address from signature
  const recoveredHexAddress = recoverAddress(
    TypedDataEncoder.hash(EIP_712_FARCASTER_DOMAIN, { VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM }, claim),

    signatureHexResult.value
  );

  const bytes = hexStringToBytes(recoveredHexAddress);
  if (bytes.isErr()) throw bytes.error;
  return bytes.value;
};

export const signMessageHash = async (hash: Uint8Array, signer: Signer): Promise<Uint8Array> => {
  const hexSignature = await signer.signTypedData(
    EIP_712_FARCASTER_DOMAIN,
    { MessageData: EIP_712_FARCASTER_MESSAGE_DATA },
    { hash }
  );

  // Convert hex signature to bytes
  const bytes = hexStringToBytes(hexSignature);
  if (bytes.isErr()) throw bytes.error;
  return bytes.value;
};

export const verifyMessageHashSignature = (hash: Uint8Array, signature: Uint8Array): Uint8Array => {
  const signatureHexResult = bytesToHexString(signature);
  if (signatureHexResult.isErr()) throw signatureHexResult.error;

  // Recover address from signature
  const recoveredHexAddress = recoverAddress(
    TypedDataEncoder.hash(EIP_712_FARCASTER_DOMAIN, { MessageData: EIP_712_FARCASTER_MESSAGE_DATA }, { hash }),
    signatureHexResult.value
  );

  const bytes = hexStringToBytes(recoveredHexAddress);
  if (bytes.isErr()) throw bytes.error;
  return bytes.value;
};
