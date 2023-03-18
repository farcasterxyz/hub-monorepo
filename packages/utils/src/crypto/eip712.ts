import { recoverAddress, Signer, TypedDataEncoder } from 'ethers';
import { err, Result, ResultAsync } from 'neverthrow';
import { bytesToHexString, hexStringToBytes } from '../bytes';
import { HubAsyncResult, HubError, HubResult } from '../errors';
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
  const signatureHexResult = bytesToHexString(signature);

  if (signatureHexResult.isErr()) {
    return err(signatureHexResult.error);
  }

  // Recover address from signature
  const recoveredHexAddress = Result.fromThrowable(
    () =>
      recoverAddress(
        TypedDataEncoder.hash(
          EIP_712_FARCASTER_DOMAIN,
          { VerificationClaim: EIP_712_FARCASTER_VERIFICATION_CLAIM },
          claim
        ),

        signatureHexResult.value
      ),
    (e) => new HubError('bad_request.invalid_param', e as Error)
  )();

  // Convert hex recovered address to bytes
  return recoveredHexAddress.andThen((hex) => hexStringToBytes(hex));
};

export const signMessageHash = async (hash: Uint8Array, signer: Signer): HubAsyncResult<Uint8Array> => {
  const hexSignature = await ResultAsync.fromPromise(
    signer.signTypedData(EIP_712_FARCASTER_DOMAIN, { MessageData: EIP_712_FARCASTER_MESSAGE_DATA }, { hash }),
    (e) => new HubError('bad_request.invalid_param', e as Error)
  );

  // Convert hex signature to bytes
  return hexSignature.andThen((hex) => hexStringToBytes(hex));
};

export const verifyMessageHashSignature = (hash: Uint8Array, signature: Uint8Array): HubResult<Uint8Array> => {
  const signatureHexResult = bytesToHexString(signature);

  if (signatureHexResult.isErr()) {
    return err(signatureHexResult.error);
  }

  // Recover address from signature
  const recoveredHexAddress = Result.fromThrowable(
    () =>
      recoverAddress(
        TypedDataEncoder.hash(EIP_712_FARCASTER_DOMAIN, { MessageData: EIP_712_FARCASTER_MESSAGE_DATA }, { hash }),
        signatureHexResult.value
      ),
    (e) => new HubError('bad_request.invalid_param', e as Error)
  )();

  // Convert hex recovered address to bytes
  return recoveredHexAddress.andThen((hex) => hexStringToBytes(hex));
};
