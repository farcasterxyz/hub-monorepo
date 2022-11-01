import {
  Cast,
  Message,
  Reaction,
  Verification,
  VerificationEthereumAddress,
  VerificationEthereumAddressClaim,
  SignatureAlgorithm,
  SignerMessage,
  HashAlgorithm,
  IdRegistryEvent,
  Follow,
  CastShort,
  CastRecast,
  CastRemove,
  MessageType,
} from '~/types';
import { hashMessage, hashFCObject } from '~/utils/crypto';
import * as ed from '@noble/ed25519';
import { hexToBytes } from 'ethereum-cryptography/utils';
import { ok, err, Result, ResultAsync } from 'neverthrow';
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
import CastSet from '~/storage/sets/castSet';
import ReactionSet from '~/storage/sets/reactionSet';
import VerificationSet from '~/storage/sets/verificationSet';
import SignerSet from '~/storage/sets/signerSet';
import FollowSet from '~/storage/sets/followSet';
import { CastURL, ChainAccountURL, parseUrl, UserURL } from '~/urls';
import { Web2URL } from '~/urls/web2Url';
import IdRegistryProvider from '~/storage/provider/idRegistryProvider';
import { CastHash } from '~/urls/castUrl';
import RocksDB from '~/storage/db/rocksdb';
import { BadRequestError, FarcasterError, ServerError } from '~/utils/errors';
import { TypedEmitter } from 'tiny-typed-emitter';
import MessageDB from '~/storage/db/message';

export type EngineEvents = {
  /**
   * messageMerged is emitted whenever the engine successfully merges a message
   */
  messageMerged: (fid: number, type: MessageType, message: Message) => void;
};

/** The Engine receives messages and determines the current state of the Farcaster network */
class Engine extends TypedEmitter<EngineEvents> {
  private _db: RocksDB;
  private _messageDB: MessageDB;
  private _castSet: CastSet;
  private _signerSet: SignerSet;
  private _followSet: FollowSet;
  private _reactionSet: ReactionSet;
  private _verificationSet: VerificationSet;

  private _IdRegistryProvider?: IdRegistryProvider;

  private _supportedChainIDs = new Set(['eip155:1']);

  constructor(db: RocksDB, networkUrl?: string, IdRegistryAddress?: string) {
    super();
    this._db = db;
    this._messageDB = new MessageDB(db);
    this._castSet = new CastSet(db);
    this._signerSet = new SignerSet(db);
    this._followSet = new FollowSet(db);
    this._reactionSet = new ReactionSet(db);
    this._verificationSet = new VerificationSet(db);

    // Subscribe to events in order to revoke messages when signers are removed
    this._signerSet.on(
      'removeSigner',
      async (fid: number, signerKey: string) => await this.revokeSigner(fid, signerKey)
    );

    /** Optionally, initialize ID Registry provider */
    if (networkUrl && IdRegistryAddress) {
      this._IdRegistryProvider = new IdRegistryProvider(networkUrl, IdRegistryAddress);
      this._IdRegistryProvider.on('confirm', (event: IdRegistryEvent) => this.mergeIdRegistryEvent(event));
    }
  }

  /**
   * User Methods
   */

  /** Get a Set of all the FIDs known */
  getUsers(): Promise<Set<number>> {
    return this._signerSet.getUsers();
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
  mergeMessages(messages: Message[]): Array<Promise<Result<void, FarcasterError>>> {
    // TODO: consider returning a single Promise.all instance rather than an array of promises
    const results = messages.map((value) => {
      return this.mergeMessage(value);
    });
    return results;
  }

  /** Merge a message into the correct set based on its type */
  async mergeMessage(message: Message): Promise<Result<void, FarcasterError>> {
    const isMessageValidresult = await this.validateMessage(message);
    if (isMessageValidresult.isErr()) return err(isMessageValidresult.error);

    let result;

    if (isCast(message)) {
      result = this.mergeCast(message);
    } else if (isFollow(message)) {
      result = this.mergeFollow(message);
    } else if (isReaction(message)) {
      result = this.mergeReaction(message);
    } else if (isSignerMessage(message)) {
      result = this.mergeSignerMessage(message);
    } else if (isVerification(message)) {
      result = this.mergeVerification(message);
    } else {
      return err(new ServerError('mergeMessage: unexpected error'));
    }

    return result.then((res) => {
      this.emit('messageMerged', message.data.fid, message.data.type, message);
      return res;
    });
  }

  public async getMessagesByHashes(hashes: string[]): Promise<Message[]> {
    return this._messageDB.getMessages(hashes);
  }

  /* -------------------------------------------------------------------------- */
  /*                                Cast Methods                                */
  /* -------------------------------------------------------------------------- */

  async getAllCastsByUser(fid: number): Promise<Set<Cast>> {
    return this._castSet.getAllCastsByUser(fid);
  }

  /* -------------------------------------------------------------------------- */
  /*                              Reaction Methods                              */
  /* -------------------------------------------------------------------------- */

  /** Get all reactions (added and removed) for an fid */
  async getAllReactionsByUser(fid: number): Promise<Set<Reaction>> {
    return this._reactionSet.getAllReactionMessagesByUser(fid);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Follow Methods                               */
  /* -------------------------------------------------------------------------- */

  async getAllFollowsByUser(fid: number): Promise<Set<Follow>> {
    return this._followSet.getAllFollowMessagesByUser(fid);
  }

  /* -------------------------------------------------------------------------- */
  /*                            Verification Methods                            */
  /* -------------------------------------------------------------------------- */

  async getVerificationsByUser(fid: number): Promise<Set<VerificationEthereumAddress>> {
    return this._verificationSet.getVerificationsByUser(fid);
  }

  async getAllVerificationsByUser(fid: number): Promise<Set<Verification>> {
    return this._verificationSet.getAllVerificationMessagesByUser(fid);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Signer Methods                               */
  /* -------------------------------------------------------------------------- */

  async mergeIdRegistryEvent(event: IdRegistryEvent): Promise<Result<void, FarcasterError>> {
    if (this._IdRegistryProvider) {
      const isEventValidResult = await this._IdRegistryProvider.validateIdRegistryEvent(event);
      if (isEventValidResult.isErr()) return err(isEventValidResult.error);
    }

    return ResultAsync.fromPromise(this._signerSet.mergeIdRegistryEvent(event), (e) => e as FarcasterError);
  }

  /** Get the entire set of signers for an Fid */
  async getAllSignerMessagesByUser(fid: number): Promise<Set<SignerMessage>> {
    return this._signerSet.getAllSignerMessagesByUser(fid);
  }

  // async getCustodyEventByUser(fid: number): Promise<IdRegistryEvent> {
  async getCustodyEventByUser(fid: number): Promise<Result<IdRegistryEvent, FarcasterError>> {
    return ResultAsync.fromPromise(this._signerSet.getCustodyEvent(fid), (e) => e as FarcasterError);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  /** Merge a cast into the set */
  private async mergeCast(cast: Cast): Promise<Result<void, FarcasterError>> {
    return await ResultAsync.fromPromise(this._castSet.merge(cast), (e) => e as FarcasterError);
  }

  /** Merge a reaction into the set  */
  private async mergeReaction(reaction: Reaction): Promise<Result<void, FarcasterError>> {
    return await ResultAsync.fromPromise(this._reactionSet.merge(reaction), (e) => e as FarcasterError);
  }

  /** Merge a follow into the set  */
  private async mergeFollow(follow: Follow): Promise<Result<void, FarcasterError>> {
    return await ResultAsync.fromPromise(this._followSet.merge(follow), (e) => e as FarcasterError);
  }

  /** Merge verification message into the set */
  private async mergeVerification(verification: Verification): Promise<Result<void, FarcasterError>> {
    return await ResultAsync.fromPromise(this._verificationSet.merge(verification), (e) => e as FarcasterError);
  }

  /** Merge signer message into the set */
  private async mergeSignerMessage(message: SignerMessage): Promise<Result<void, FarcasterError>> {
    return await ResultAsync.fromPromise(this._signerSet.merge(message), (e: any) => e as FarcasterError);
  }

  private async revokeSigner(fid: number, signer: string): Promise<Result<void, FarcasterError>> {
    try {
      // Delete casts
      await this._castSet.revokeSigner(fid, signer);

      // Delete follows
      await this._followSet.revokeSigner(fid, signer);

      // Delete reactions
      await this._reactionSet.revokeSigner(fid, signer);

      // Delete verifications
      await this._verificationSet.revokeSigner(fid, signer);
    } catch (e) {
      return err(e as FarcasterError);
    }

    return ok(undefined);
  }

  private async validateMessage(message: Message): Promise<Result<void, FarcasterError>> {
    // 1. Check that the user has a custody address
    const custodyEvent = await ResultAsync.fromPromise(
      this._signerSet.getCustodyAddress(message.data.fid),
      () => undefined
    );
    if (custodyEvent.isErr()) return err(new BadRequestError('validateMessage: unknown user'));

    // 2. Check that the signer is valid if message is not a signer message
    if (!isSignerMessage(message)) {
      const isValidSigner = await ResultAsync.fromPromise(
        this._signerSet.getSigner(message.data.fid, message.signer),
        () => undefined
      );
      if (isValidSigner.isErr()) return err(new BadRequestError('validateMessage: invalid signer'));
    }

    // 3. Check that the hashType and hash are valid
    if (message.hashType === HashAlgorithm.Blake2b) {
      const computedHash = await hashMessage(message);
      if (message.hash !== computedHash) {
        return err(new BadRequestError('validateMessage: invalid hash'));
      }
    } else {
      return err(new BadRequestError('validateMessage: invalid hashType'));
    }

    // 4. Check that the signatureType and signature are valid.
    if (message.signatureType === SignatureAlgorithm.EthereumPersonalSign) {
      try {
        const recoveredSigner = ethers.utils.verifyMessage(message.hash, message.signature);
        if (recoveredSigner.toLowerCase() !== message.signer.toLowerCase()) {
          return err(new BadRequestError('validateMessage: invalid signature'));
        }
      } catch (e: any) {
        return err(new BadRequestError('validateMessage: invalid signature'));
      }
    } else if (message.signatureType === SignatureAlgorithm.Ed25519) {
      try {
        const signatureIsValid = await ed.verify(
          hexToBytes(message.signature),
          hexToBytes(message.hash),
          hexToBytes(message.signer)
        );
        if (!signatureIsValid) {
          return err(new BadRequestError('validateMessage: invalid signature'));
        }
      } catch (e: any) {
        return err(new BadRequestError('validateMessage: invalid signature'));
      }
    } else {
      return err(new BadRequestError('validateMessage: invalid signatureType'));
    }

    // 5. Verify that the timestamp is not too far in the future.
    const tenMinutes = 10 * 60 * 1000;
    if (message.data.signedAt - Date.now() > tenMinutes) {
      return err(new BadRequestError('validateMessage: signedAt more than 10 mins in the future'));
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

    return err(new BadRequestError('validateMessage: unknown message'));
  }

  private validateCastShort(cast: CastShort): Result<void, FarcasterError> {
    const { text, embeds, mentions, meta, parent } = cast.data.body;

    if (text.length > 320) {
      return err(new BadRequestError('validateCastShort: text > 320 chars'));
    }

    if (embeds && embeds.length > 2) {
      return err(new BadRequestError('validateCastShort: embeds > 2'));
    }

    if (parent) {
      const parseTarget = CastURL.parse(parent);
      if (parseTarget.isErr()) {
        return err(new BadRequestError('validateCastShort: parent must be a valid Cast URL'));
      }
    }

    if (mentions && mentions.length > 5) {
      return err(new BadRequestError('validateCastShort: mentions > 5'));
    }

    if (meta && meta.length > 256) {
      return err(new BadRequestError('validateCastShort: meta > 256 chars'));
    }

    return ok(undefined);
  }

  private validateCastRecast(cast: CastRecast): Result<void, FarcasterError> {
    const { targetCastUri } = cast.data.body;

    const parseTarget = CastURL.parse(targetCastUri);
    if (parseTarget.isErr()) {
      return err(new BadRequestError('validateCastRecast: targetCastUri must be a valid Cast URL'));
    }

    return ok(undefined);
  }

  private validateCastRemove(cast: CastRemove): Result<void, FarcasterError> {
    const { targetHash } = cast.data.body;

    const parseCastHash = CastHash.parse('cast:' + targetHash);
    if (parseCastHash.isErr()) {
      return err(new BadRequestError('validateCastRemove: targetHash must be a valid Cast hash'));
    }

    return ok(undefined);
  }

  private validateReaction(message: Reaction): Result<void, FarcasterError> {
    const parsedURLResult = parseUrl(message.data.body.targetUri, { allowUnrecognized: false });
    return parsedURLResult
      .mapErr(() => new BadRequestError('validateReaction: invalid URL for reaction target'))
      .andThen((parsedUrl) => {
        switch (true) {
          case parsedUrl instanceof CastURL:
          case parsedUrl instanceof Web2URL:
            return ok(undefined);
          // TODO: support chain-data URLs
          default:
            return err(new BadRequestError('validateReaction: invalid URL for reaction target'));
        }
      });

    // TODO: validate schema
  }

  private async validateVerificationEthereumAddress(
    message: VerificationEthereumAddress
  ): Promise<Result<void, FarcasterError>> {
    const { externalUri, externalSignature, externalSignatureType, claimHash } = message.data.body;

    if (externalSignatureType !== SignatureAlgorithm.EthereumPersonalSign)
      return err(new BadRequestError('validateVerificationEthereumAddress: invalid externalSignatureType'));

    const verificationClaim: VerificationEthereumAddressClaim = {
      fid: message.data.fid,
      externalUri: message.data.body.externalUri,
      blockHash: message.data.body.blockHash,
    };
    const reconstructedClaimHash = await hashFCObject(verificationClaim);
    if (reconstructedClaimHash !== claimHash) {
      return err(new BadRequestError('validateVerificationEthereumAddress: invalid claimHash'));
    }

    const chainAccountURLResult = this.validateChainAccountURL(externalUri);
    if (chainAccountURLResult.isErr()) return chainAccountURLResult.map(() => undefined);
    const chainAccountURL = chainAccountURLResult.value;

    try {
      const verifiedExternalAddress = utils.verifyMessage(claimHash, externalSignature);
      if (verifiedExternalAddress.toLowerCase() !== chainAccountURL.address.toLowerCase()) {
        return err(
          new BadRequestError('validateVerificationEthereumAddress: externalSignature does not match externalUri')
        );
      }
    } catch (e: any) {
      // TODO: pass through more helpful errors from Ethers
      return err(new BadRequestError('validateVerificationEthereumAddress: invalid externalSignature'));
    }

    return ok(undefined);
  }

  private async validateVerificationRemove(): Promise<Result<void, FarcasterError>> {
    // TODO: validate claimHash is a real hash
    return ok(undefined);
  }

  private validateSignerMessage(message: SignerMessage): Result<void, FarcasterError> {
    if (message.signer.length !== 42) {
      return err(new BadRequestError('validateSignerMessage: signer must be a custody address'));
    }

    if (message.data.body.delegate.length !== 66) {
      return err(new BadRequestError('validateSignerMessage: delegate must be an EdDSA public key'));
    }

    return ok(undefined);
  }

  // TODO: Reconsider when refactoring URLs
  //
  // private validateChainURL(chainURL: string): Result<void, FarcasterError> {
  //   const result = ChainURL.parse(chainURL);
  //   return result.andThen((chainUrlParsed) => {
  //     const chainId = chainUrlParsed.chainId.toString();
  //     if (!this._supportedChainIDs.has(chainId)) {
  //       return err(new BadRequestError(`validateChainURL: unsupported chainID ${chainId}`));
  //     }
  //     return ok(undefined);
  //   });
  // }

  private validateChainAccountURL(chainAccountURL: string): Result<ChainAccountURL, FarcasterError> {
    const result = ChainAccountURL.parse(chainAccountURL);
    return result.andThen((chainAccountURLParsed) => {
      const chainId = chainAccountURLParsed.chainId.toString();
      if (!this._supportedChainIDs.has(chainId)) {
        return err(new BadRequestError(`validateChainAccountURL: unsupported chainID ${chainId}`));
      }
      return result;
    });
  }

  private async validateFollow(message: Follow): Promise<Result<void, FarcasterError>> {
    const result = UserURL.parse(message.data.body.targetUri);
    return result
      .map(() => {
        return undefined;
      })
      .mapErr(() => new BadRequestError('validateFollow: targetUri must be valid FarcasterID'));

    // TODO: any Follow custom validation?
  }

  /**
   * Testing Methods
   */

  async _reset() {
    await this._db.clear();
  }

  _revokeSigner(fid: number, signer: string) {
    return this.revokeSigner(fid, signer);
  }
}

export default Engine;
