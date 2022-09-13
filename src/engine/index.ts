import { Level } from 'level';
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
  CastRemove,
  SignerAdd,
  MessageType,
} from '~/types';
import { hashMessage, hashFCObject } from '~/utils';
import * as ed from '@noble/ed25519';
import { hexToBytes } from 'ethereum-cryptography/utils';
import { ok, err, Result } from 'neverthrow';
import { ethers, utils } from 'ethers';
import {
  isCastShort,
  isReaction,
  isVerificationEthereumAddress,
  isVerificationRemove,
  isSignerMessage,
  isFollow,
  isCastRecast,
  isCastRemove,
  isCast,
  isVerification,
} from '~/types/typeguards';
import CastSet from '~/sets/castSet';
import ReactionSet from '~/sets/reactionSet';
import VerificationSet from '~/sets/verificationSet';
import SignerSet from '~/sets/signerSet';
import FollowSet from '~/sets/followSet';
import { CastURL, ChainAccountURL, ChainURL, parseUrl, UserURL } from '~/urls';
import { Web2URL } from '~/urls/web2Url';
import IDRegistryProvider from '~/provider/idRegistryProvider';
import { CastHash } from '~/urls/castUrl';
import { RPCHandler } from '~/network/rpc';
import DB from '~/db';

/** The Engine receives messages and determines the current state of the Farcaster network */
class Engine implements RPCHandler {
  private _db: DB;
  private _castSet: CastSet;

  /** Maps of sets, indexed by fid */
  private _reactions: Map<number, ReactionSet>;
  private _verifications: Map<number, VerificationSet>;
  private _signers: Map<number, SignerSet>;
  private _follows: Map<number, FollowSet>;

  private _IDRegistryProvider?: IDRegistryProvider;

  private _supportedChainIDs = new Set(['eip155:1']);

  constructor(db: DB, networkUrl?: string, IDRegistryAddress?: string) {
    this._db = db;
    this._castSet = new CastSet(db);

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
   * User Methods
   */

  /** Get a Set of all the FIDs known */
  async getUsers(): Promise<Set<number>> {
    console.log('getusers', this._signers.keys());
    return new Set([...this._signers.keys()]);
  }

  /**
   * Message Methods
   */

  /** Merge a message into the correct set based on its type */
  async mergeMessage(message: Message): Promise<Result<void, string>> {
    const isMessageValidresult = await this.validateMessage(message);
    if (isMessageValidresult.isErr()) return isMessageValidresult;

    if (isCast(message)) {
      return this.mergeCast(message);
    }
    if (isFollow(message)) {
      return this.mergeFollow(message);
    }
    if (isReaction(message)) {
      return this.mergeReaction(message);
    }
    if (isSignerMessage(message)) {
      return this.mergeSignerMessage(message);
    }
    if (isVerification(message)) {
      return this.mergeVerification(message);
    }

    return err('mergeMessage: unexpected error');
  }

  /**
   * Cast Methods
   */

  /** Get a cast for an fid by its hash */
  async getCast(fid: number, hash: string): Promise<Result<Cast, string>> {
    return await this._castSet.getCast(fid, hash);
  }

  /** Get added casts (not removed ones) for an fid */
  async getCastsByUser(fid: number): Promise<Set<CastShort | CastRecast>> {
    return await this._castSet.getCastsByUser(fid);
  }

  /** Get all casts (added and removed) for an fid */
  async getAllCastsByUser(fid: number): Promise<Set<Cast>> {
    return await this._castSet.getAllCastsByUser(fid);
  }

  /**
   * Reaction Methods
   */

  /** Get a reaction for an fid by target URI */
  getReaction(fid: number, targetURI: URI): Reaction | undefined {
    const reactionSet = this._reactions.get(fid);
    return reactionSet ? reactionSet.getReaction(targetURI) : undefined;
  }

  async getReactionsByUser(fid: number): Promise<Set<ReactionAdd>> {
    const reactionSet = this._reactions.get(fid);
    return reactionSet ? reactionSet.getReactions() : new Set();
  }

  /** Get all reactions (added and removed) for an fid */
  async getAllReactionsByUser(fid: number): Promise<Set<Reaction>> {
    const reactionSet = this._reactions.get(fid);
    return reactionSet ? reactionSet.getAllMessages() : new Set();
  }

  /**
   * Follow Methods
   */

  /** Get a follow for an fid by target URI */
  getFollow(fid: number, targetURI: string): FollowAdd | undefined {
    const followSet = this._follows.get(fid);
    return followSet ? followSet.getFollow(targetURI) : undefined;
  }

  async getFollowsByUser(fid: number): Promise<Set<FollowAdd>> {
    const followSet = this._follows.get(fid);
    return followSet ? followSet.getFollows() : new Set();
  }

  async getAllFollowsByUser(fid: number): Promise<Set<Follow>> {
    const followSet = this._follows.get(fid);
    return followSet ? followSet.getAllMessages() : new Set();
  }

  /**
   * Verification methods
   */

  /** Get a verification for an fid by claimHash */
  getVerification(fid: number, claimHash: string): Verification | undefined {
    const verificationSet = this._verifications.get(fid);
    return verificationSet ? verificationSet.get(claimHash) : undefined;
  }

  async getVerificationsByUser(fid: number): Promise<Set<VerificationEthereumAddress>> {
    const verificationSet = this._verifications.get(fid);
    return verificationSet ? verificationSet.getVerifications() : new Set();
  }

  async getAllVerificationsByUser(fid: number): Promise<Set<Verification>> {
    const verifications = this._verifications.get(fid);
    if (verifications) {
      return verifications.getAllMessages();
    }
    return new Set();
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
      signerSet.on('removeSigner', async (signerKey) => await this.revokeSigner(fid, signerKey));

      this._signers.set(fid, signerSet);
    }

    return signerSet.mergeIDRegistryEvent(event);
  }

  getSigner(fid: number, signerKey: string): SignerAdd | undefined {
    const signerSet = this._signers.get(fid);
    return signerSet ? signerSet.getSigner(signerKey) : undefined;
  }

  async getSignersbyUser(fid: number): Promise<Set<SignerAdd>> {
    const signerSet = this._signers.get(fid);
    return signerSet ? signerSet.getSigners() : new Set();
  }

  /** Get the entire set of signers for an Fid */
  async getAllSignerMessagesByUser(fid: number): Promise<Set<SignerMessage>> {
    const signerSet = this._signers.get(fid);
    if (signerSet) {
      return signerSet.getAllMessages();
    }
    return new Set();
  }

  /**
   * Private Methods
   */

  /** Merge a cast into the set */
  private async mergeCast(cast: Cast): Promise<Result<void, string>> {
    return await this._castSet.merge(cast);
  }

  /** Merge a reaction into the set  */
  private async mergeReaction(reaction: Reaction): Promise<Result<void, string>> {
    try {
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

  /** Merge a follow into the set  */
  private async mergeFollow(follow: Follow): Promise<Result<void, string>> {
    try {
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

  /** Merge verification message into the set */
  private async mergeVerification(verification: Verification): Promise<Result<void, string>> {
    const { fid } = verification.data;
    let verificationSet = this._verifications.get(fid);
    if (!verificationSet) {
      verificationSet = new VerificationSet();
      this._verifications.set(fid, verificationSet);
    }

    return verificationSet.merge(verification);
  }

  /** Merge signer message into the set */
  private async mergeSignerMessage(message: SignerMessage): Promise<Result<void, string>> {
    const { fid } = message.data;
    const signerSet = this._signers.get(fid);
    if (!signerSet) return err('mergeSignerMessage: unknown user');
    return signerSet.merge(message);
  }

  private async revokeSigner(fid: number, signer: string): Promise<Result<void, string>> {
    // Delete cast messages
    for (const type of [MessageType.CastShort, MessageType.CastRecast, MessageType.CastRemove]) {
      for await (const messageHash of this._db.messagesBySigner(signer, type).values()) {
        await this._castSet.deleteCast(messageHash);
      }
    }

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
    const isValidSigner = isSignerMessage(message) || signerSet.getSigner(message.signer);
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

    if (isCastShort(message)) {
      return this.validateCastShort(message);
    }

    if (isCastRecast(message)) {
      return this.validateCastRecast(message);
    }

    if (isCastRemove(message)) {
      return this.validateCastRemove(message);
    }

    if (isReaction(message)) {
      return this.validateReaction(message);
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
      return this.validateFollow(message);
    }

    return err('validateMessage: unknown message');
  }

  private validateCastShort(cast: CastShort): Result<void, string> {
    const { text, embed, targetUri } = cast.data.body;

    if (text && text.length > 280) {
      return err('validateCastShort: text > 280 chars');
    }

    if (embed && embed.items.length > 2) {
      return err('validateCastShort: embeds > 2');
    }

    if (targetUri) {
      const parseTarget = CastURL.parse(targetUri);
      if (parseTarget.isErr()) {
        return err('validateCastShort: targetUri must be a valid Cast URL');
      }
    }

    return ok(undefined);
  }

  private validateCastRecast(cast: CastRecast): Result<void, string> {
    const { targetCastUri } = cast.data.body;

    const parseTarget = CastURL.parse(targetCastUri);
    if (parseTarget.isErr()) {
      return err('validateCastRecast: targetCastUri must be a valid Cast URL');
    }

    return ok(undefined);
  }

  private validateCastRemove(cast: CastRemove): Result<void, string> {
    const { targetHash } = cast.data.body;

    const parseCastHash = CastHash.parse('cast:' + targetHash);
    if (parseCastHash.isErr()) {
      return err('validateCastRemove: targetHash must be a valid Cast hash');
    }

    return ok(undefined);
  }

  private validateReaction(message: Reaction): Result<void, string> {
    const parsedURLResult = parseUrl(message.data.body.targetUri, { allowUnrecognized: false });
    return parsedURLResult
      .mapErr(() => 'validateReaction: invalid URL for reaction target')
      .andThen((parsedUrl) => {
        switch (true) {
          case parsedUrl instanceof CastURL:
          case parsedUrl instanceof Web2URL:
            return ok(undefined);
          // TODO: support chain-data URLs
          default:
            return err('validateReaction: invalid URL for reaction target');
        }
      });

    // TODO: validate schema
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

    const chainAccountURLResult = this.validateChainAccountURL(externalUri);
    if (chainAccountURLResult.isErr()) return chainAccountURLResult.map(() => undefined);
    const chainAccountURL = chainAccountURLResult.value;

    try {
      const verifiedExternalAddress = utils.verifyMessage(claimHash, externalSignature);
      if (verifiedExternalAddress.toLowerCase() !== chainAccountURL.address.toLowerCase()) {
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

  private validateChainURL(chainURL: string): Result<void, string> {
    const result = ChainURL.parse(chainURL);
    return result.andThen((chainUrlParsed) => {
      const chainId = chainUrlParsed.chainId.toString();
      if (!this._supportedChainIDs.has(chainId)) {
        return err(`validateChainURL: unsupported chainID ${chainId}`);
      }
      return ok(undefined);
    });
  }

  private validateChainAccountURL(chainAccountURL: string): Result<ChainAccountURL, string> {
    const result = ChainAccountURL.parse(chainAccountURL);
    return result.andThen((chainAccountURLParsed) => {
      const chainId = chainAccountURLParsed.chainId.toString();
      if (!this._supportedChainIDs.has(chainId)) {
        return err(`validateChainAccountURL: unsupported chainID ${chainId}`);
      }
      return result;
    });
  }

  private async validateFollow(message: Follow): Promise<Result<void, string>> {
    const result = UserURL.parse(message.data.body.targetUri);
    return result
      .map(() => {
        return undefined;
      })
      .mapErr(() => 'validateFollow: targetUri must be valid FarcasterID');

    // TODO: any Follow custom validation?
    return ok(undefined);
  }

  /**
   * Testing Methods
   */

  async _reset() {
    await this._db.clear();
    this._resetSigners();
    this._resetReactions();
    this._resetVerifications();
    this._resetFollows();
  }

  _revokeSigner(fid: number, signer: string) {
    return this.revokeSigner(fid, signer);
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

  async _getCastAdds(fid: number): Promise<Set<CastShort | CastRecast>> {
    return await this._castSet._getAdds(fid);
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
    const signerAdds: SignerAdd[] = signerSet ? [...signerSet.getSigners()] : [];
    return new Set(signerAdds.map((msg: SignerAdd) => msg.data.body.delegate));
  }
}

export default Engine;
