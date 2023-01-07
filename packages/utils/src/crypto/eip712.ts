import { Signer, TypedDataDomain, TypedDataField, utils } from 'ethers';
import { err } from 'neverthrow';
import { bytesToHexString, hexStringToBytes } from '../bytes';
import { HubAsyncResult, HubError, HubResult } from '../errors';
import { VerificationEthAddressClaim } from '../types';

/**
 * _signTypedData is an experimental feature and sub-classes may not implement
 * the function.
 *
 * @see https://docs.ethers.org/v5/single-page/#/v5/api/signer/-%23-Signer-signTypedData
 */
type MaybeTypedDataSigner = Signer & {
  _signTypedData?: (
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    value: Record<string, any>
  ) => Promise<string>;
};

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
  signer: MaybeTypedDataSigner
): HubAsyncResult<Uint8Array> => {
  if (signer._signTypedData === undefined) {
    return err(new HubError('bad_request', 'Provided Signer does not implement _signTypedData'));
  }

  const hexSignature = await signer._signTypedData(
    EIP_712_FARCASTER_DOMAIN,
    { VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM },
    claim
  );
  return hexStringToBytes(hexSignature);
};

export const verifyVerificationEthAddressClaimSignature = (
  claim: VerificationEthAddressClaim,
  signature: Uint8Array
): HubResult<Uint8Array> => {
  // Convert little endian signature to hex
  const hexSignature = bytesToHexString(signature, { endianness: 'little', size: 130 });
  if (hexSignature.isErr()) {
    return err(hexSignature.error);
  }

  // Recover address from signature
  const recoveredHexAddress = utils.verifyTypedData(
    EIP_712_FARCASTER_DOMAIN,
    { VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM },
    claim,
    hexSignature.value
  );

  // Convert hex recovered address to little endian bytes
  return hexStringToBytes(recoveredHexAddress, { endianness: 'little' });
};

export const signMessageHash = async (hash: Uint8Array, signer: MaybeTypedDataSigner): HubAsyncResult<Uint8Array> => {
  if (signer._signTypedData === undefined) {
    return err(new HubError('bad_request', 'Provided Signer does not implement _signTypedData'));
  }

  const hexSignature = await signer._signTypedData(
    EIP_712_FARCASTER_DOMAIN,
    { MessageData: EIP_712_FARCASTER_MESSAGE_DATA },
    { hash }
  );
  return hexStringToBytes(hexSignature);
};

export const verifyMessageHashSignature = (hash: Uint8Array, signature: Uint8Array): HubResult<Uint8Array> => {
  // Convert little endian signature to fixed size hex string
  const hexSignature = bytesToHexString(signature, { endianness: 'little', size: 130 });
  if (hexSignature.isErr()) {
    return err(hexSignature.error);
  }

  // Recover address from signature
  const recoveredHexAddress = utils.verifyTypedData(
    EIP_712_FARCASTER_DOMAIN,
    { MessageData: EIP_712_FARCASTER_MESSAGE_DATA },
    { hash },
    hexSignature.value
  );

  // Convert hex address to little endian bytes
  return hexStringToBytes(recoveredHexAddress, { endianness: 'little' });
};
