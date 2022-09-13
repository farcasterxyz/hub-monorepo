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

/** The Engine receives messages and determines the current state of the Farcaster network */
class Engine implements RPCHandler {
  /** Maps of sets, indexed by fid */
  private _casts: Map<number, CastSet>;
  private _reactions: Map<number, ReactionSet>;
  private _verifications: Map<number, VerificationSet>;
  private _signers: Map<number, SignerSet>;
  private _follows: Map<number, FollowSet>;

  private _IDRegistryProvider?: IDRegistryProvider;

  private _supportedChainIDs = new Set(['eip155:1']);

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
   * FID Methods
   */

  /** Get a Set of all the FIDs known */
  async getUsers(): Promise<Set<number>> {
    return new Set(Array.from(this._signers.keys()));
  }

  /**
   * Message Methods
   */

  /**
   * Merge a list of messages
   *
   * @param messages A list of Messages to merge
   * @returns An array of Results
   */
  mergeMessages(messages: Message[]): Array<Promise<Result<void, string>>> {
    const results = messages.map((value) => {
      return this.mergeMessage(value);
    });
    return results;
  }

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
  getCast(fid: number, hash: string): Cast | undefined {
    const castSet = this._casts.get(fid);
    return castSet ? castSet.get(hash) : undefined;
  }

  /** Get all the casts */
  async allCasts(): Promise<Map<number, CastSet>> {
    return this._casts;
  }

  /** Get the entire cast set for an fid */
  async getAllCastsByUser(fid: number): Promise<Set<Cast>> {
    const casts = this._casts.get(fid);
    if (casts) {
      return casts.getAllMessages();
    }
    return new Set();
  }

  /**
   * Reaction Methods
   */

  /** Get a reaction for an fid by target URI */
  getReaction(fid: number, targetURI: URI): Reaction | undefined {
    const reactionSet = this._reactions.get(fid);
    return reactionSet ? reactionSet.get(targetURI) : undefined;
  }

  /** Get te entire reaction set for an fid */
  async getAllReactionsByUser(fid: number): Promise<Set<Reaction>> {
    const reactions = this._reactions.get(fid);
    if (reactions) {
      return reactions.getAllMessages();
    }
    return new Set();
  }

  /**
   * Follow Methods
   */

  /** Get a follow for an fid by target URI */
  getFollow(fid: number, targetURI: string): Follow | undefined {
    const followSet = this._follows.get(fid);
    return followSet ? followSet.get(targetURI) : undefined;
  }

  async getAllFollowsByUser(fid: number): Promise<Set<Follow>> {
    const follows = this._follows.get(fid);
    if (follows) {
      return follows.getAllMessages();
    }
    return new Set();
  }

  /**
   * Verification methods
   */

  /** Get a verification for an fid by claimHash */
  getVerification(fid: number, claimHash: string): Verification | undefined {
    const verificationSet = this._verifications.get(fid);
    return verificationSet ? verificationSet.get(claimHash) : undefined;
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
      signerSet.on('removeSigner', (signerKey) => this.revokeSigner(fid, signerKey));

      this._signers.set(fid, signerSet);
    }

    return signerSet.mergeIDRegistryEvent(event);
  }

  /** Get the entire set of signers for an Fid */
  async getAllSignerMessagesByUser(fid: number): Promise<Set<SignerMessage>> {
    const signerSet = this._signers.get(fid);
    if (signerSet) {
      return signerSet.getAllMessages();
    }
    return new Set();
  }

  async getCustodyEventByUser(fid: number): Promise<IDRegistryEvent | undefined> {
    const signerSet = this._signers.get(fid);
    if (signerSet) {
      return signerSet.getCustodyAddressEvent();
    }
    return undefined;
  }

  /**
   * Private Methods
   */

  /** Merge a cast into the set */
  private async mergeCast(cast: Cast): Promise<Result<void, string>> {
    try {
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
