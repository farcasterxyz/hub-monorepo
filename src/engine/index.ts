import {
  Cast,
  Root,
  Message,
  Reaction,
  Verification,
  VerificationAdd,
  VerificationRemove,
  VerificationClaim,
  SignerRemove,
  SignerAdd,
  SignatureAlgorithm,
  SignerEdge,
  SignerMessage,
} from '~/types';
import { hashMessage, hashCompare, hashFCObject } from '~/utils';
import * as ed from '@noble/ed25519';
import { hexToBytes } from 'ethereum-cryptography/utils';
import { ok, err, Result } from 'neverthrow';
import { utils } from 'ethers';
import {
  isCast,
  isCastShort,
  isRoot,
  isReaction,
  isVerificationAdd,
  isVerificationRemove,
  isSignerAdd,
  isSignerRemove,
} from '~/types/typeguards';
import CastSet from '~/sets/castSet';
import ReactionSet from '~/sets/reactionSet';
import VerificationSet from '~/sets/verificationSet';
import SignerSet from '~/sets/signerSet';

export interface getUserFingerprint {
  rootBlockNum: number;
  rootBlockHash: string;
  lastMessageIndex: number | undefined;
  lastMessageHash: string | undefined;
}

export interface Signer {
  address: string;
  blockHash: string;
  blockNumber: number;
  logIndex: number;
}

/** The Engine receives messages and determines the current state of the Farcaster network */
class Engine {
  private _casts: Map<string, CastSet>;
  private _reactions: Map<string, ReactionSet>;
  private _roots: Map<string, Root>;
  private _users: Map<string, Signer[]>;
  private _verifications: Map<string, VerificationSet>;
  private _signers: Map<string, SignerSet>;

  constructor() {
    this._casts = new Map();
    this._reactions = new Map();
    this._roots = new Map();
    this._users = new Map();
    this._verifications = new Map();
    this._signers = new Map();
  }

  getSigners(username: string): Signer[] {
    return this._users.get(username) || [];
  }

  /**
   * Root Methods
   */

  getRoot(username: string): Root | undefined {
    return this._roots.get(username);
  }

  /** Add a new root for a username, if valid */
  async mergeRoot(root: Root): Promise<Result<void, string>> {
    if (!isRoot(root)) {
      return err('mergeRoot: invalid root');
    }

    // TODO: verify that the block and hash are from a valid ethereum block.

    const validation = await this.validateMessage(root);
    if (!validation.isOk()) {
      return validation;
    }

    const username = root.data.username;
    const currentRoot = this._roots.get(username);

    if (!currentRoot) {
      this._roots.set(username, root);
      return ok(undefined);
    }

    if (currentRoot.data.rootBlock < root.data.rootBlock) {
      this._roots.set(username, root);
      this._casts.set(username, new CastSet());
      return ok(undefined);
    } else if (currentRoot.data.rootBlock > root.data.rootBlock) {
      return err('mergeRoot: provided root was older (lower block)');
    } else {
      const hashCmp = hashCompare(currentRoot.hash, root.hash);
      if (hashCmp < 0) {
        this._roots.set(username, root);
        this._casts.set(username, new CastSet());
        return ok(undefined);
      } else if (hashCmp >= 1) {
        return err('mergeRoot: newer root was present (lexicographically higher hash)');
      } else {
        return err('mergeRoot: provided root was a duplicate');
      }
    }
  }

  /**
   * Cast Methods
   */

  /** Get a cast for a username by its hash */
  getCast(username: string, hash: string): Cast | undefined {
    const castSet = this._casts.get(username);
    return castSet ? castSet.get(hash) : undefined;
  }

  /** Get hashes of unremoved cast messages for a username */
  getCastHashes(username: string): string[] {
    const castSet = this._casts.get(username);
    return castSet ? castSet.getHashes() : [];
  }

  /** Get hashes of all cast messages for a username */
  getAllCastHashes(username: string): string[] {
    const castSet = this._casts.get(username);
    return castSet ? castSet.getAllHashes() : [];
  }

  /** Merge a cast into the set */
  async mergeCast(cast: Cast): Promise<Result<void, string>> {
    try {
      const username = cast.data.username;

      const signerChanges = this._users.get(username);
      if (!signerChanges) {
        return err('mergeCast: unknown user');
      }

      const isCastValidResult = await this.validateMessage(cast);
      if (isCastValidResult.isErr()) return isCastValidResult;

      let castSet = this._casts.get(username);
      if (!castSet) {
        castSet = new CastSet();
        this._casts.set(username, castSet);
      }
      return castSet.merge(cast);
    } catch (e: any) {
      return err('mergeCast: unexpected error');
    }
  }

  /**
   * Reaction Methods
   */

  /** Get a reaction for a username by hash */
  getReaction(username: string, hash: string): Reaction | undefined {
    const reactionSet = this._reactions.get(username);
    return reactionSet ? reactionSet.get(hash) : undefined;
  }

  /** Get hashes of all known reactions for a username */
  getReactionHashes(username: string): string[] {
    const reactionSet = this._reactions.get(username);
    return reactionSet ? reactionSet.getHashes() : [];
  }

  /** Get hashes of all known reactions for a username */
  getAllReactionHashes(username: string): string[] {
    const reactionSet = this._reactions.get(username);
    return reactionSet ? reactionSet.getAllHashes() : [];
  }

  /** Merge a reaction into the set  */
  async mergeReaction(reaction: Reaction): Promise<Result<void, string>> {
    try {
      const username = reaction.data.username;

      const signerChanges = this._users.get(username);
      if (!signerChanges) {
        return err('mergeReaction: unknown user');
      }

      const isReactionValidResult = await this.validateMessage(reaction);
      if (isReactionValidResult.isErr()) return isReactionValidResult;

      let reactionSet = this._reactions.get(username);
      if (!reactionSet) {
        reactionSet = new ReactionSet();
        this._reactions.set(username, reactionSet);
      }

      return reactionSet.merge(reaction);
    } catch (e: any) {
      return err('addCast: unexpected error');
    }
  }

  /**
   * Verification methods
   */

  /** Get a verification for a username by claimHash */
  getVerification(username: string, claimHash: string): Verification | undefined {
    const verificationSet = this._verifications.get(username);
    return verificationSet ? verificationSet.get(claimHash) : undefined;
  }

  /** Get claimHashes of known active verifications for a username */
  getVerificationClaimHashes(username: string): string[] {
    const verificationSet = this._verifications.get(username);
    return verificationSet ? verificationSet.getClaimHashes() : [];
  }

  /** Get claimHashes of all known verifications for a username */
  getAllVerificationClaimHashes(username: string): string[] {
    const verificationSet = this._verifications.get(username);
    return verificationSet ? verificationSet.getAllHashes() : [];
  }

  /** Merge verification message into the set */
  async mergeVerification(verification: Verification): Promise<Result<void, string>> {
    try {
      const username = verification.data.username;
      const signerChanges = this._users.get(username);
      if (!signerChanges) {
        return err('mergeVerification: unknown user');
      }
      const isVerificationValidResult = await this.validateMessage(verification);
      if (isVerificationValidResult.isErr()) return isVerificationValidResult;

      let verificationSet = this._verifications.get(username);
      if (!verificationSet) {
        verificationSet = new VerificationSet();
        this._verifications.set(username, verificationSet);
      }

      return verificationSet.merge(verification);
    } catch (e: any) {
      return err('mergeVerification: unexpected error');
    }
  }

  /**
   * Signer Methods
   */

  /** Add a new SignerChange event into the user's Signer Change array  */
  addSignerChange(username: string, newSignerChange: Signer): Result<void, string> {
    const signerChanges = this._users.get(username);

    if (!signerChanges) {
      this._users.set(username, [newSignerChange]);
      return ok(undefined);
    }

    let signerIdx = 0;

    // Insert the SignerChange into the array such that the array maintains ascending order
    // of blockNumbers, followed by logIndex (for changes that occur within the same block).
    for (const sc of signerChanges) {
      if (sc.blockNumber < newSignerChange.blockNumber) {
        signerIdx++;
      } else if (sc.blockNumber === newSignerChange.blockNumber) {
        if (sc.logIndex < newSignerChange.logIndex) {
          signerIdx++;
        } else if (sc.logIndex === newSignerChange.logIndex) {
          return err(`addSignerChange: duplicate signer change ${sc.blockHash}:${sc.logIndex}`);
        }
      }
    }

    signerChanges.splice(signerIdx, 0, newSignerChange);
    return ok(undefined);
  }

  addCustody(username: string, custodyPubKey: string): Result<void, string> {
    let signerSet = this._signers.get(username);
    if (!signerSet) {
      signerSet = new SignerSet();
      this._signers.set(username, signerSet);
    }
    return signerSet.addCustody(custodyPubKey);
  }

  /** Merge signer message into the set */
  async mergeSignerMessage(message: SignerMessage): Promise<Result<void, string>> {
    const username = message.data.username;
    const signerChanges = this._users.get(username);
    if (!signerChanges) {
      return err('mergeSignerMessage: unknown user');
    }
    const isMessageValidResult = await this.validateMessage(message);
    if (isMessageValidResult.isErr()) return isMessageValidResult;

    let signerSet = this._signers.get(username);
    if (!signerSet) {
      signerSet = new SignerSet();
      this._signers.set(username, signerSet);
    }

    return signerSet.merge(message);
  }

  /**
   * Internal Methods
   *
   * Public methods used only for testing, or private methods
   */

  _reset(): void {
    this._resetCasts();
    this._resetUsers();
    this._resetSigners();
    this._resetRoots();
    this._resetReactions();
    this._resetVerifications();
  }

  _resetCasts(): void {
    this._casts = new Map();
  }

  _resetSigners(): void {
    this._signers = new Map();
  }

  _resetUsers(): void {
    this._users = new Map();
  }

  _resetRoots(): void {
    this._roots = new Map();
  }

  _resetReactions(): void {
    this._reactions = new Map();
  }

  _resetVerifications(): void {
    this._verifications = new Map();
  }

  _getCastAdds(username: string): Cast[] {
    const castSet = this._casts.get(username);
    return castSet ? castSet._getAdds() : [];
  }

  _getActiveReactions(username: string): Reaction[] {
    const reactionSet = this._reactions.get(username);
    return reactionSet ? reactionSet._getActiveReactions() : [];
  }

  _getVerificationAdds(username: string): VerificationAdd[] {
    const verificationSet = this._verifications.get(username);
    return verificationSet ? verificationSet._getAdds() : [];
  }

  _getVerificationRemoves(username: string): VerificationRemove[] {
    const verificationSet = this._verifications.get(username);
    return verificationSet ? verificationSet._getRemoves() : [];
  }

  _getSigners(username: string): string[] {
    const signerSet = this._signers.get(username);
    return signerSet ? Array.from(signerSet._getVertexAdds()) : [];
  }

  _getCustodySigners(username: string): string[] {
    const signerSet = this._signers.get(username);
    return signerSet ? Array.from(signerSet._getCustodySigners()) : [];
  }

  /** Determine the valid signer address for a username at a block */
  private signerForBlock(username: string, blockNumber: number): string | undefined {
    const signerChanges = this._users.get(username);
    if (!signerChanges) {
      return undefined;
    }

    let signer = undefined;

    for (const sc of signerChanges) {
      if (sc.blockNumber <= blockNumber) {
        signer = sc.address;
      }
    }
    return signer;
  }

  private async validateMessage(message: Message): Promise<Result<void, string>> {
    // 1. Check that the signer was valid for the block in question.
    const expectedSigner = this.signerForBlock(message.data.username, message.data.rootBlock);
    if (!expectedSigner || expectedSigner !== message.signer) {
      return err('validateMessage: invalid signer');
    }

    // 2. Check that the hash value of the message was computed correctly.
    const computedHash = await hashMessage(message);
    if (message.hash !== computedHash) {
      return err('validateMessage: invalid hash');
    }

    // 3. Check that the message is valid.
    // ed25519 library hates strings for some reason, so we need to convert to a buffer

    const recoveredAddress = await ed.verify(
      hexToBytes(message.signature),
      hexToBytes(message.hash),
      hexToBytes(message.signer)
    );
    if (!recoveredAddress) {
      return err('validateMessage: invalid signature');
    }

    // 4. Verify that the timestamp is not too far in the future.
    const tenMinutes = 10 * 60 * 1000;
    if (message.data.signedAt - Date.now() > tenMinutes) {
      return err('validateMessage: signedAt more than 10 mins in the future');
    }

    if (isRoot(message)) {
      return this.validateRoot(message);
    }

    const root = this._roots.get(message.data.username);
    if (!root) {
      return err('validateMessage: no root present');
    }

    if (root.data.rootBlock !== message.data.rootBlock) {
      return err('validateMessage: root block does not match');
    }

    if (root.data.signedAt >= message.data.signedAt) {
      return err('validateMessage: message timestamp was earlier than root');
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

    if (isSignerAdd(message)) {
      return this.validateSignerAdd(message);
    }

    if (isSignerRemove(message)) {
      return this.validateSignerRemove();
    }

    // TODO: check that the schema is a valid and known schema.
    // TODO: check that all required properties are present.
    // TODO: check that username is known to the registry
    // TODO: check that the signer is the owner of the username.
    return err('validateMessage: unknown message');
  }

  private validateRoot(root: Root): Result<void, string> {
    // TODO: Check that the blockHash is a real block and it's block matches rootBlock.
    if (root.data.body.blockHash.length !== 66) {
      return err('validateRoot: invalid eth block hash');
    }
    return ok(undefined);
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

    if (externalSignatureType !== 'eip-191-0x45') return err('validateVerificationAdd: invalid externalSignatureType');

    const verificationClaim: VerificationClaim = {
      username: message.data.username,
      externalUri: message.data.body.externalUri,
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
    const { childSignatureType, childSignature, childKey, edgeHash } = message.data.body;

    /** Validate childSignatureType */
    if (childSignatureType !== SignatureAlgorithm.Ed25519) return err('validateSignerAdd: invalid childSignatureType');

    /** Validate edgeHash */
    const signerEdge: SignerEdge = { childKey, parentKey: message.signer };
    const reconstructedEdgeHash = await hashFCObject(signerEdge);
    if (reconstructedEdgeHash !== edgeHash) return err('validateSignerAdd: invalid edgeHash');

    /** Validate childSignature */
    try {
      const childSignatureIsValid = await ed.verify(
        hexToBytes(childSignature),
        hexToBytes(edgeHash),
        hexToBytes(childKey)
      );
      if (!childSignatureIsValid) {
        return err('validateSignerAdd: childSignature does not match childKey');
      }
    } catch (e: any) {
      return err('validateSignerAdd: invalid childSignature');
    }

    return ok(undefined);
  }

  private async validateSignerRemove(): Promise<Result<void, string>> {
    // TODO: any SignerRemove custom validations?
    return ok(undefined);
  }
}

export default Engine;
