import { recoverAddress, TypedDataEncoder, Signer, TypedDataDomain, TypedDataField } from 'ethers';
import { err, Result, ResultAsync } from 'neverthrow';
import { bytesToHexString, hexStringToBytes } from '../bytes';
import { HubAsyncResult, HubError, HubResult } from '../errors';
import { VerificationEthAddressClaim } from '../verifications';

export type MinimalEthersSigner = Pick<Signer, 'signTypedData' | 'getAddress'>;

export const EIP_712_FARCASTER_DOMAIN = {
  name: 'Farcaster Verify Ethereum Address',
  version: '2.0.0',
  // fixed salt to minimize collisions
  salt: '0xf2d857f4a3edcb9b78b4d503bfe733db1e3f6cdc2b7971ee739626c97e86a558' as `0x${string}`, // Type cast for viem compatibility
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

export const EIP_712_USERNAME_DOMAIN = {
  name: 'Farcaster name verification',
  version: '1',
  chainId: 1,
  verifyingContract: '0xe3be01d99baa8db9905b33a3ca391238234b79d1', // name registry contract, will be the farcaster ENS CCIP contract later
};

export const EIP_712_USERNAME_PROOF = [
  { name: 'name', type: 'string' },
  { name: 'timestamp', type: 'uint256' },
  { name: 'owner', type: 'address' },
];

export const getSignerKey = async (signer: MinimalEthersSigner): HubAsyncResult<Uint8Array> => {
  return ResultAsync.fromPromise(signer.getAddress(), (e) => new HubError('unknown', e as Error)).andThen(
    hexStringToBytes
  );
};

export const signVerificationEthAddressClaim = async (
  claim: VerificationEthAddressClaim,
  signer: MinimalEthersSigner
): HubAsyncResult<Uint8Array> => {
  const hexSignature = await ResultAsync.fromPromise(
    signer.signTypedData(EIP_712_FARCASTER_DOMAIN, { VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM }, claim),
    (e) => new HubError('bad_request.invalid_param', e as Error)
  );

  // Convert hex signature to bytes
  return hexSignature.andThen((hex) => hexStringToBytes(hex));
};

export const verifyVerificationEthAddressClaimSignature = (
  claim: VerificationEthAddressClaim,
  signature: Uint8Array
): HubResult<Uint8Array> => {
  return recoverSignature(
    EIP_712_FARCASTER_DOMAIN,
    { VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM },
    claim,
    signature
  );
};

export type UserNameProofClaim = {
  name: string;
  timestamp: number;
  owner: string; // hex address
};

export const verifyUserNameProof = (nameProof: UserNameProofClaim, signature: Uint8Array): HubResult<Uint8Array> => {
  return recoverSignature(EIP_712_USERNAME_DOMAIN, { UserNameProof: EIP_712_USERNAME_PROOF }, nameProof, signature);
};

export const signMessageHash = async (hash: Uint8Array, signer: MinimalEthersSigner): HubAsyncResult<Uint8Array> => {
  const hexSignature = await ResultAsync.fromPromise(
    signer.signTypedData(EIP_712_FARCASTER_DOMAIN, { MessageData: EIP_712_FARCASTER_MESSAGE_DATA }, { hash }),
    (e) => new HubError('bad_request.invalid_param', e as Error)
  );

  // Convert hex signature to bytes
  return hexSignature.andThen((hex) => hexStringToBytes(hex));
};

export const verifyMessageHashSignature = (hash: Uint8Array, signature: Uint8Array): HubResult<Uint8Array> => {
  return recoverSignature(
    EIP_712_FARCASTER_DOMAIN,
    { MessageData: EIP_712_FARCASTER_MESSAGE_DATA },
    { hash },
    signature
  );
};

const recoverSignature = (
  domain: TypedDataDomain,
  types: Record<string, Array<TypedDataField>>,
  claim: Record<string, any>,
  signature: Uint8Array
): HubResult<Uint8Array> => {
  const signatureHexResult = bytesToHexString(signature);
  if (signatureHexResult.isErr()) {
    return err(signatureHexResult.error);
  }

  // Recover address from signature
  const recoveredHexAddress = Result.fromThrowable(
    () => recoverAddress(TypedDataEncoder.hash(domain, types, claim), signatureHexResult.value),
    (e) => new HubError('bad_request.invalid_param', e as Error)
  )();

  // Convert hex recovered address to bytes
  return recoveredHexAddress.andThen((hex) => hexStringToBytes(hex));
};
