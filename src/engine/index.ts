import {
  Cast,
  Message,
  Reaction,
  Verification,
  VerificationAdd,
  VerificationRemove,
  VerificationClaim,
  SignerAdd,
  SignatureAlgorithm,
  SignerEdge,
  SignerMessage,
  HashAlgorithm,
  IDRegistryEvent,
  Follow,
  URI,
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
  isVerificationAdd,
  isVerificationRemove,
  isSignerAdd,
  isSignerRemove,
  isSignerMessage,
  isCustodyRemoveAll,
  isFollow,
} from '~/types/typeguards';
import CastSet from '~/sets/castSet';
import ReactionSet from '~/sets/reactionSet';
import VerificationSet from '~/sets/verificationSet';
import SignerSet from '~/sets/signerSet';
import FollowSet from '~/sets/followSet';

/** The Engine receives messages and determines the current state of the Farcaster network */
class Engine {
  /** Maps of sets, indexed by fid */
  private _casts: Map<number, CastSet>;
  private _reactions: Map<number, ReactionSet>;
  private _verifications: Map<number, VerificationSet>;
  private _signers: Map<number, SignerSet>;
  private _follows: Map<number, FollowSet>;

  constructor() {
    this._casts = new Map();
    this._reactions = new Map();
    this._verifications = new Map();
    this._signers = new Map();
    this._follows = new Map();
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
      const { fid } = cast.data;

      if (!this._signers.get(fid)) {
        return err('mergeCast: unknown user');
      }

      const isCastValidResult = await this.validateMessage(cast);
      if (isCastValidResult.isErr()) return isCastValidResult;

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
      const { fid } = reaction.data;

      if (!this._signers.get(fid)) {
        return err('mergeReaction: unknown user');
      }

      const isReactionValidResult = await this.validateMessage(reaction);
      if (isReactionValidResult.isErr()) return isReactionValidResult;

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
      const { fid } = follow.data;

      if (!this._signers.get(fid)) {
        return err('mergeFollow: unknown user');
      }

      const isFollowValidResult = await this.validateMessage(follow);
      if (isFollowValidResult.isErr()) return isFollowValidResult;

      let followSet = this._follows.get(fid);
      if (!followSet) {
        followSet = new FollowSet();
        this._follows.set(fid, followSet);
      }

      return followSet.merge(follow);
    } catch (e: any) {
      console.log('error', e);
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
    const { fid } = verification.data;
    const signerSet = this._signers.get(fid);
    if (!signerSet) {
      return err('mergeVerification: unknown user');
    }
    const isVerificationValidResult = await this.validateMessage(verification);
    if (isVerificationValidResult.isErr()) return isVerificationValidResult;

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

  mergeIDRegistryEvent(fid: number, event: IDRegistryEvent): Result<void, string> {
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
    const { fid } = message.data;
    const signerSet = this._signers.get(fid);
    if (!signerSet) return err('mergeSignerMessage: unknown user');

    const isMessageValidResult = await this.validateMessage(message);
    if (isMessageValidResult.isErr()) return isMessageValidResult;

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
    // 1. Check that the signer is valid for the account
    const signerSet = this._signers.get(message.data.fid);
    if (!signerSet) return err('validateMessage: unknown user');

    // A signer message must be signed by a custody address. All other messages have to be signed by delegates.
    const isValidSigner =
      (isSignerMessage(message) && signerSet.getCustody(message.signer)) || signerSet.getSigner(message.signer);
    if (!isValidSigner) return err('validateMessage: invalid signer');

    // 2. Check that the hashType and hash are valid
    if (message.hashType === HashAlgorithm.Blake2b) {
      const computedHash = await hashMessage(message);
      if (message.hash !== computedHash) {
        return err('validateMessage: invalid hash');
      }
    } else {
      return err('validateMessage: invalid hashType');
    }

    // 3. Check that the signatureType and signature are valid.
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

    // 4. Verify that the timestamp is not too far in the future.
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

    if (isVerificationAdd(message)) {
      return this.validateVerificationAdd(message);
    }

    if (isVerificationRemove(message)) {
      return this.validateVerificationRemove();
    }

    if (isCustodyRemoveAll(message)) {
      return this.validateCustodyRemoveAll();
    }

    if (isSignerAdd(message)) {
      return this.validateSignerAdd(message);
    }

    if (isSignerRemove(message)) {
      return this.validateSignerRemove();
    }

    if (isFollow(message)) {
      return this.validateFollow();
    }

    // TODO: check that the schema is a valid and known schema
    // TODO: check that all required properties are present
    // TODO: check that fid is known to the registry
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

  private async validateVerificationAdd(message: VerificationAdd): Promise<Result<void, string>> {
    const { externalUri, externalSignature, externalSignatureType, claimHash } = message.data.body;

    if (externalSignatureType !== SignatureAlgorithm.EthereumPersonalSign)
      return err('validateVerificationAdd: invalid externalSignatureType');

    const verificationClaim: VerificationClaim = {
      fid: message.data.fid,
      externalUri: message.data.body.externalUri,
      blockHash: message.data.body.blockHash,
    };
    const reconstructedClaimHash = await hashFCObject(verificationClaim);
    if (reconstructedClaimHash !== claimHash) {
      return err('validateVerificationAdd: invalid claimHash');
    }

    try {
      const verifiedExternalAddress = utils.verifyMessage(claimHash, externalSignature);
      if (verifiedExternalAddress !== externalUri) {
        return err('validateVerificationAdd: externalSignature does not match externalUri');
      }
    } catch (e: any) {
      // TODO: pass through more helpful errors from Ethers
      return err('validateVerificationAdd: invalid externalSignature');
    }

    return ok(undefined);
  }

  private async validateVerificationRemove(): Promise<Result<void, string>> {
    // TODO: validate claimHash is a real hash
    return ok(undefined);
  }

  private async validateSignerAdd(message: SignerAdd): Promise<Result<void, string>> {
    const { delegateSignatureType, delegateSignature, delegate, edgeHash } = message.data.body;

    /** Validate delegateSignatureType */
    if (delegateSignatureType !== SignatureAlgorithm.Ed25519)
      return err('validateSignerAdd: invalid delegateSignatureType');

    /** Validate edgeHash */
    const signerEdge: SignerEdge = { delegate, custody: message.signer };
    const reconstructedEdgeHash = await hashFCObject(signerEdge);
    if (reconstructedEdgeHash !== edgeHash) return err('validateSignerAdd: invalid edgeHash');

    /** Validate delegateSignature */
    try {
      const delegateSignatureIsValid = await ed.verify(
        hexToBytes(delegateSignature),
        hexToBytes(edgeHash),
        hexToBytes(delegate)
      );
      if (!delegateSignatureIsValid) {
        return err('validateSignerAdd: delegateSignature does not match delegate');
      }
    } catch (e: any) {
      return err('validateSignerAdd: invalid delegateSignature');
    }

    return ok(undefined);
  }

  private async validateSignerRemove(): Promise<Result<void, string>> {
    // TODO: any SignerRemove custom validations?
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

  _getCastAdds(fid: number): Cast[] {
    const castSet = this._casts.get(fid);
    return castSet ? castSet._getAdds() : [];
  }

  _getActiveReactions(fid: number): Reaction[] {
    const reactionSet = this._reactions.get(fid);
    return reactionSet ? reactionSet._getActiveReactions() : [];
  }

  _getActiveFollows(fid: number): Set<Follow> {
    const followSet = this._follows.get(fid);
    return followSet ? followSet._getActiveFollows() : new Set();
  }

  _getVerificationAdds(fid: number): VerificationAdd[] {
    const verificationSet = this._verifications.get(fid);
    return verificationSet ? verificationSet._getAdds() : [];
  }

  _getVerificationRemoves(fid: number): VerificationRemove[] {
    const verificationSet = this._verifications.get(fid);
    return verificationSet ? verificationSet._getRemoves() : [];
  }

  _getAllSigners(fid: number): Set<string> {
    const signerSet = this._signers.get(fid);
    return signerSet ? signerSet.getAllSigners() : new Set();
  }

  _getCustodyAddresses(fid: number): Set<string> {
    const signerSet = this._signers.get(fid);
    return signerSet ? signerSet.getCustodyAddresses() : new Set();
  }

  _getDelegateSigners(fid: number): Set<string> {
    const signerSet = this._signers.get(fid);
    return signerSet ? signerSet.getDelegateSigners() : new Set();
  }
}

export default Engine;
