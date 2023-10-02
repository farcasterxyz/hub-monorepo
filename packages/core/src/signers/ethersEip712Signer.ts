import { ResultAsync } from "neverthrow";
import type { Signer } from "ethers";
import { HubAsyncResult, HubError } from "../errors";
import { VerificationEthAddressClaim } from "../verifications";
import { UserNameProofClaim } from "../userNameProof";
import { Eip712Signer } from "./eip712Signer";
import { hexStringToBytes } from "../bytes";
import {
  EIP_712_FARCASTER_DOMAIN,
  EIP_712_FARCASTER_MESSAGE_DATA,
  EIP_712_FARCASTER_VERIFICATION_CLAIM,
  EIP_712_USERNAME_DOMAIN,
  EIP_712_USERNAME_PROOF,
} from "../crypto/eip712";

export type MinimalEthersSigner = Pick<Signer, "signTypedData" | "getAddress">;

export class EthersEip712Signer extends Eip712Signer {
  private readonly _ethersSigner: MinimalEthersSigner;

  constructor(signer: MinimalEthersSigner) {
    super();
    this._ethersSigner = signer;
  }

  public async getSignerKey(): HubAsyncResult<Uint8Array> {
    return ResultAsync.fromPromise(this._ethersSigner.getAddress(), (e) => new HubError("unknown", e as Error)).andThen(
      hexStringToBytes,
    );
  }

  public async signMessageHash(hash: Uint8Array): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._ethersSigner.signTypedData(
        EIP_712_FARCASTER_DOMAIN,
        { MessageData: [...EIP_712_FARCASTER_MESSAGE_DATA] },
        { hash },
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );

    // Convert hex signature to bytes
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signVerificationEthAddressClaim(
    claim: VerificationEthAddressClaim,
    chainId = 0,
  ): HubAsyncResult<Uint8Array> {
    const domain = chainId === 0 ? EIP_712_FARCASTER_DOMAIN : { ...EIP_712_FARCASTER_DOMAIN, chainId };
    const hexSignature = await ResultAsync.fromPromise(
      this._ethersSigner.signTypedData(domain, { VerificationClaim: [...EIP_712_FARCASTER_VERIFICATION_CLAIM] }, claim),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );

    // Convert hex signature to bytes
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }

  public async signUserNameProofClaim(userNameProof: UserNameProofClaim): HubAsyncResult<Uint8Array> {
    const hexSignature = await ResultAsync.fromPromise(
      this._ethersSigner.signTypedData(
        EIP_712_USERNAME_DOMAIN,
        { UserNameProof: [...EIP_712_USERNAME_PROOF] },
        userNameProof,
      ),
      (e) => new HubError("bad_request.invalid_param", e as Error),
    );

    // Convert hex signature to bytes
    return hexSignature.andThen((hex) => hexStringToBytes(hex));
  }
}
