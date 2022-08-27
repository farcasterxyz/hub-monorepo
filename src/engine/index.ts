import {
  Cast,
  Message,
  Reaction,
  Verification,
  VerificationEthereumAddress,
  VerificationRemove,
  VerificationEthereumAddressClaim,
  SignatureAlgorithm,
  SignerMessage,
  HashAlgorithm,
  IDRegistryEvent,
  Follow,
  URI,
  ReactionAdd,
  FollowAdd,
  CastShort,
  CastRecast,
} from '~/types';
import { hashMessage, hashFCObject } from '~/utils';
import * as ed from '@noble/ed25519';
import { hexToBytes } from 'ethereum-cryptography/utils';
import { ok, err, Result } from 'neverthrow';
import { ethers, utils } from 'ethers';
import {
  isCast,
  isCastShort,
  isReaction,
  isVerificationEthereumAddress,
  isVerificationRemove,
  isSignerMessage,
  isFollow,
} from '~/types/typeguards';
import CastSet from '~/sets/castSet';
import ReactionSet from '~/sets/reactionSet';
import VerificationSet from '~/sets/verificationSet';
import SignerSet from '~/sets/signerSet';
import FollowSet from '~/sets/followSet';
import IDRegistryProvider from '~/provider/idRegistryProvider';

/** The Engine receives messages and determines the current state of the Farcaster network */
class Engine {
  /** Maps of sets, indexed by fid */
  private _casts: Map<number, CastSet>;
  private _reactions: Map<number, ReactionSet>;
  private _verifications: Map<number, VerificationSet>;
  private _signers: Map<number, SignerSet>;
  private _follows: Map<number, FollowSet>;

  private _IDRegistryProvider?: IDRegistryProvider;

  constructor(networkUrl?: string, IDRegistryAddress?: string) {
    this._casts = new Map();
    this._reactions = new Map();
    this._verifications = new Map();
    this._signers = new Map();
    this._follows = new Map();

    /** Optionally, initialize ID Registry provider */
    if (networkUrl && IDRegistryAddress) {
      this._IDRegistryProvider = new IDRegistryProvider(networkUrl, IDRegistryAddress);
      this._IDRegistryProvider.on('confirm', (event: IDRegistryEvent) => this.mergeIDRegistryEvent(event));
    }
  }

  /**
   * Cast Methods
   */

  /** Get a cast for an fid by its hash */
  getCast(fid: number, hash: string): Cast | undefined {
    const castSet = this._casts.get(fid);
    return castSet ? castSet.get(hash) : undefined;
  }

  /** Merge a cast into the set */
  async mergeCast(cast: Cast): Promise<Result<void, string>> {
    try {
      const isCastValidResult = await this.validateMessage(cast);
      if (isCastValidResult.isErr()) return isCastValidResult;

      const { fid } = cast.data;
      let castSet = this._casts.get(fid);
      if (!castSet) {
        castSet = new CastSet();
        this._casts.set(fid, castSet);
      }

      return castSet.merge(cast);
    } catch (e: any) {
      return err('mergeCast: unexpected error');
    }
  }

  /**
   * Reaction Methods
   */

  /** Get a reaction for an fid by target URI */
  getReaction(fid: number, targetURI: URI): Reaction | undefined {
    const reactionSet = this._reactions.get(fid);
    return reactionSet ? reactionSet.get(targetURI) : undefined;
  }

  /** Merge a reaction into the set  */
  async mergeReaction(reaction: Reaction): Promise<Result<void, string>> {
    try {
      const isReactionValidResult = await this.validateMessage(reaction);
      if (isReactionValidResult.isErr()) return isReactionValidResult;

      const { fid } = reaction.data;
      let reactionSet = this._reactions.get(fid);
      if (!reactionSet) {
        reactionSet = new ReactionSet();
        this._reactions.set(fid, reactionSet);
      }

      return reactionSet.merge(reaction);
    } catch (e: any) {
      return err('mergeReaction: unexpected error');
    }
  }

  /**
   * Follow Methods
   */

  /** Get a follow for an fid by target URI */
  getFollow(fid: number, targetURI: string): Follow | undefined {
    const followSet = this._follows.get(fid);
    return followSet ? followSet.get(targetURI) : undefined;
  }

  /** Merge a follow into the set  */
  async mergeFollow(follow: Follow): Promise<Result<void, string>> {
    try {
      const isFollowValidResult = await this.validateMessage(follow);
      if (isFollowValidResult.isErr()) return isFollowValidResult;

      const { fid } = follow.data;
      let followSet = this._follows.get(fid);
      if (!followSet) {
        followSet = new FollowSet();
        this._follows.set(fid, followSet);
      }

      return followSet.merge(follow);
    } catch (e: any) {
      return err('mergeFollow: unexpected error');
    }
  }

  /**
   * Verification methods
   */

  /** Get a verification for an fid by claimHash */
  getVerification(fid: number, claimHash: string): Verification | undefined {
    const verificationSet = this._verifications.get(fid);
    return verificationSet ? verificationSet.get(claimHash) : undefined;
  }

  /** Merge verification message into the set */
  async mergeVerification(verification: Verification): Promise<Result<void, string>> {
    const isVerificationValidResult = await this.validateMessage(verification);
    if (isVerificationValidResult.isErr()) return isVerificationValidResult;

    const { fid } = verification.data;
    let verificationSet = this._verifications.get(fid);
    if (!verificationSet) {
      verificationSet = new VerificationSet();
      this._verifications.set(fid, verificationSet);
    }

    return verificationSet.merge(verification);
  }

  /**
   * Signer Methods
   */

  async mergeIDRegistryEvent(event: IDRegistryEvent): Promise<Result<void, string>> {
    if (this._IDRegistryProvider) {
      const isEventValidResult = await this._IDRegistryProvider.validateIDRegistryEvent(event);
      if (isEventValidResult.isErr()) return isEventValidResult;
    }

    const fid = event.args.id;
    let signerSet = this._signers.get(fid);
    if (!signerSet) {
      signerSet = new SignerSet();

      // Subscribe to events in order to revoke messages when signers are removed
      signerSet.on('removeSigner', (signerKey) => this.revokeSigner(fid, signerKey));

      this._signers.set(fid, signerSet);
    }

    return signerSet.mergeIDRegistryEvent(event);
  }

  /** Merge signer message into the set */
  async mergeSignerMessage(message: SignerMessage): Promise<Result<void, string>> {
    const isMessageValidResult = await this.validateMessage(message);
    if (isMessageValidResult.isErr()) return isMessageValidResult;

    const { fid } = message.data;
    const signerSet = this._signers.get(fid);
    if (!signerSet) return err('mergeSignerMessage: unknown user');
    return signerSet.merge(message);
  }

  /**
   * Private Methods
   */

  private revokeSigner(fid: number, signer: string): Result<void, string> {
    // Revoke casts
    const castSet = this._casts.get(fid);
    if (castSet) castSet.revokeSigner(signer);

    // Revoke reactions
    const reactionSet = this._reactions.get(fid);
    if (reactionSet) reactionSet.revokeSigner(signer);

    // Revoke verifications
    const verificationSet = this._verifications.get(fid);
    if (verificationSet) verificationSet.revokeSigner(signer);

    // Revoke follows
    const followSet = this._follows.get(fid);
    if (followSet) followSet.revokeSigner(signer);

    return ok(undefined);
  }

  private async validateMessage(message: Message): Promise<Result<void, string>> {
    // 1. Check that the fid has been registered
    const signerSet = this._signers.get(message.data.fid);
    if (!signerSet) return err('validateMessage: unknown user');

    // 2. Check that the signer is valid
    const isValidSigner = isSignerMessage(message) || signerSet.get(message.signer);
    if (!isValidSigner) return err('validateMessage: invalid signer');

    // 3. Check that the hashType and hash are valid
    if (message.hashType === HashAlgorithm.Blake2b) {
      const computedHash = await hashMessage(message);
      if (message.hash !== computedHash) {
        return err('validateMessage: invalid hash');
      }
    } else {
      return err('validateMessage: invalid hashType');
    }

    // 4. Check that the signatureType and signature are valid.
    if (message.signatureType === SignatureAlgorithm.EthereumPersonalSign) {
      try {
        const recoveredSigner = ethers.utils.verifyMessage(message.hash, message.signature);
        if (recoveredSigner.toLowerCase() !== message.signer.toLowerCase()) {
          return err('validateMessage: invalid signature');
        }
      } catch (e: any) {
        return err('validateMessage: invalid signature');
      }
    } else if (message.signatureType === SignatureAlgorithm.Ed25519) {
      try {
        const signatureIsValid = await ed.verify(
          hexToBytes(message.signature),
          hexToBytes(message.hash),
          hexToBytes(message.signer)
        );
        if (!signatureIsValid) {
          return err('validateMessage: invalid signature');
        }
      } catch (e: any) {
        return err('validateMessage: invalid signature');
      }
    } else {
      return err('validateMessage: invalid signatureType');
    }

    // 5. Verify that the timestamp is not too far in the future.
    const tenMinutes = 10 * 60 * 1000;
    if (message.data.signedAt - Date.now() > tenMinutes) {
      return err('validateMessage: signedAt more than 10 mins in the future');
    }

    if (isCast(message)) {
      return this.validateCast(message);
    }

    if (isReaction(message)) {
      return this.validateReaction();
    }

    if (isVerificationEthereumAddress(message)) {
      return this.validateVerificationEthereumAddress(message);
    }

    if (isVerificationRemove(message)) {
      return this.validateVerificationRemove();
    }

    if (isSignerMessage(message)) {
      return this.validateSignerMessage(message);
    }

    if (isFollow(message)) {
      return this.validateFollow();
    }

    return err('validateMessage: unknown message');
  }

  private validateCast(cast: Cast): Result<void, string> {
    if (isCastShort(cast)) {
      const text = cast.data.body.text;
      const embed = cast.data.body.embed;

      if (text && text.length > 280) {
        return err('validateCast: text > 280 chars');
      }

      if (embed && embed.items.length > 2) {
        return err('validateCast: embeds > 2');
      }
    }

    // TODO: For remove cast, validate hash length.

    return ok(undefined);
  }

  private validateReaction(): Result<void, string> {
    // TODO: validate targetUri, schema
    return ok(undefined);
  }

  private async validateVerificationEthereumAddress(
    message: VerificationEthereumAddress
  ): Promise<Result<void, string>> {
    const { externalUri, externalSignature, externalSignatureType, claimHash } = message.data.body;

    if (externalSignatureType !== SignatureAlgorithm.EthereumPersonalSign)
      return err('validateVerificationEthereumAddress: invalid externalSignatureType');

    const verificationClaim: VerificationEthereumAddressClaim = {
      fid: message.data.fid,
      externalUri: message.data.body.externalUri,
      blockHash: message.data.body.blockHash,
    };
    const reconstructedClaimHash = await hashFCObject(verificationClaim);
    if (reconstructedClaimHash !== claimHash) {
      return err('validateVerificationEthereumAddress: invalid claimHash');
    }

    try {
      const verifiedExternalAddress = utils.verifyMessage(claimHash, externalSignature);
      if (verifiedExternalAddress !== externalUri) {
        return err('validateVerificationEthereumAddress: externalSignature does not match externalUri');
      }
    } catch (e: any) {
      // TODO: pass through more helpful errors from Ethers
      return err('validateVerificationEthereumAddress: invalid externalSignature');
    }

    return ok(undefined);
  }

  private async validateVerificationRemove(): Promise<Result<void, string>> {
    // TODO: validate claimHash is a real hash
    return ok(undefined);
  }

  private validateSignerMessage(message: SignerMessage): Result<void, string> {
    if (message.signer.length !== 42) {
      return err('validateSignerMessage: signer must be a custody address');
    }

    if (message.data.body.delegate.length !== 66) {
      return err('validateSignerMessage: delegate must be an EdDSA public key');
    }

    return ok(undefined);
  }

  private async validateCustodyRemoveAll(): Promise<Result<void, string>> {
    // TODO: any CustodyRemoveAll custom validation?
    return ok(undefined);
  }

  private async validateFollow(): Promise<Result<void, string>> {
    // TODO: any Follow custom validation?
    return ok(undefined);
  }

  /**
   * Testing Methods
   */

  _reset(): void {
    this._resetCasts();
    this._resetSigners();
    this._resetReactions();
    this._resetVerifications();
    this._resetFollows();
  }

  _resetCasts(): void {
    this._casts = new Map();
  }

  _resetSigners(): void {
    this._signers = new Map();
  }

  _resetReactions(): void {
    this._reactions = new Map();
  }

  _resetVerifications(): void {
    this._verifications = new Map();
  }

  _resetFollows(): void {
    this._follows = new Map();
  }

  _getCastAdds(fid: number): Set<CastShort | CastRecast> {
    const castSet = this._casts.get(fid);
    return castSet ? castSet._getAdds() : new Set();
  }

  _getReactionAdds(fid: number): Set<ReactionAdd> {
    const reactionSet = this._reactions.get(fid);
    return reactionSet ? reactionSet._getAdds() : new Set();
  }

  _getFollowAdds(fid: number): Set<FollowAdd> {
    const followSet = this._follows.get(fid);
    return followSet ? followSet._getAdds() : new Set();
  }

  _getVerificationEthereumAddressAdds(fid: number): Set<VerificationEthereumAddress> {
    const verificationSet = this._verifications.get(fid);
    return verificationSet ? verificationSet._getAdds() : new Set();
  }

  _getVerificationRemoves(fid: number): Set<VerificationRemove> {
    const verificationSet = this._verifications.get(fid);
    return verificationSet ? verificationSet._getRemoves() : new Set();
  }

  _getCustodyAddress(fid: number): string | undefined {
    const signerSet = this._signers.get(fid);
    return signerSet ? signerSet.getCustodyAddress() : undefined;
  }

  _getSigners(fid: number): Set<string> {
    const signerSet = this._signers.get(fid);
    return signerSet ? signerSet.getSigners() : new Set();
  }
}

export default Engine;
