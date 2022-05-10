import { Cast, Root, RootMessageBody, Message, Reaction } from '~/types';
import { hashMessage, hashCompare } from '~/utils';
import { utils } from 'ethers';
import { ok, err, Result } from 'neverthrow';
import { isCast, isCastDelete, isCastShort, isCastRecast, isRoot, isReaction } from '~/types/typeguards';
import CastSet from '~/castSet';
import ReactionSet from '~/reactionSet';

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

/** The Engine receives messages and determines the current state Farcaster network */
class Engine {
  private _users: Map<string, Signer[]>;
  private _roots: Map<string, Message<RootMessageBody>>;
  private _casts: Map<string, CastSet>;
  private _reactions: Map<string, ReactionSet>;

  constructor() {
    this._casts = new Map();
    this._reactions = new Map();
    this._users = new Map();
    this._roots = new Map();
  }

  getSigners(username: string): Signer[] {
    return this._users.get(username) || [];
  }

  /**
   * Root Methods
   */

  getRoot(username: string): Message<RootMessageBody> | undefined {
    return this._roots.get(username);
  }

  /** Add a new root for a username, if valid */
  addRoot(root: Root): Result<void, string> {
    if (!isRoot(root)) {
      return err('addRoot: invalid root');
    }

    // TODO: verify that the block and hash are from a valid ethereum block.

    const validation = this.validateMessage(root);
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
      return err('addRoot: provided root was older (lower block)');
    } else {
      const hashCmp = hashCompare(root.hash, currentRoot.hash);
      if (hashCmp < 0) {
        this._roots.set(username, root);
        this._casts.set(username, new CastSet());
        return ok(undefined);
      } else if (hashCmp >= 1) {
        return err('addRoot: provided root was older (higher hash)');
      } else {
        return err('addRoot: provided root was a duplicate');
      }
    }
  }

  /**
   * Cast Methods
   */

  getCast(username: string, hash: string): Cast | undefined {
    const castSet = this._casts.get(username);
    return castSet ? castSet.get(hash) : undefined;
  }

  getCastAdds(username: string): Cast[] {
    const castSet = this._casts.get(username);
    return castSet ? castSet._getAdds() : [];
  }

  getCastDeletes(username: string): Cast[] {
    const castSet = this._casts.get(username);
    return castSet ? castSet._getDeletes() : [];
  }

  getCastAddsHashes(username: string): string[] {
    const castSet = this._casts.get(username);
    return castSet ? castSet.getAddsHashes() : [];
  }

  getCastDeletesHashes(username: string): string[] {
    const castSet = this._casts.get(username);
    return castSet ? castSet.getDeletesHashes() : [];
  }

  /** Add a new Cast into the CastSet if valid */
  addCast(cast: Cast): Result<void, string> {
    try {
      const username = cast.data.username;

      const signerChanges = this._users.get(username);
      if (!signerChanges) {
        return err('addCast: unknown user');
      }

      if (!this.validateMessage(cast).isOk()) {
        return this.validateMessage(cast);
      }

      let castSet = this._casts.get(username);
      if (!castSet) {
        castSet = new CastSet();
        this._casts.set(username, castSet);
      }

      if (isCastDelete(cast)) {
        return castSet.delete(cast);
      }

      if (isCastShort(cast) || isCastRecast(cast)) {
        return castSet.add(cast);
      }

      return err('engine.addCast: unknown cast type');
    } catch (e: any) {
      return err('addCast: unexpected error');
    }
  }

  /**
   * Reaction Methods
   */

  getReaction(username: string, hash: string): Reaction | undefined {
    const reactionSet = this._reactions.get(username);
    return reactionSet ? reactionSet.get(hash) : undefined;
  }

  getReactionHashes(username: string): string[] {
    const reactionSet = this._reactions.get(username);
    return reactionSet ? reactionSet.getHashes() : [];
  }

  /** Add a new Cast into the CastSet if valid */
  addReaction(reaction: Reaction): Result<void, string> {
    try {
      const username = reaction.data.username;

      const signerChanges = this._users.get(username);
      if (!signerChanges) {
        return err('addReaction: unknown user');
      }

      if (!this.validateMessage(reaction).isOk()) {
        return this.validateMessage(reaction);
      }

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

  /**
   * Internal Methods
   *
   * Public methods used only for testing, or private methods
   */

  _reset(): void {
    this._resetCasts();
    this._resetSigners();
    this._resetRoots();
  }

  _resetCasts(): void {
    this._casts = new Map();
  }

  _resetSigners(): void {
    this._users = new Map();
  }

  _resetRoots(): void {
    this._roots = new Map();
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

  private validateMessage(message: Message): Result<void, string> {
    // 1. Check that the signer was valid for the block in question.
    const expectedSigner = this.signerForBlock(message.data.username, message.data.rootBlock);
    if (!expectedSigner || expectedSigner !== message.signer) {
      return err('validateMessage: invalid signer');
    }

    // 2. Check that the hash value of the message was computed correctly.
    const computedHash = hashMessage(message);
    if (message.hash !== computedHash) {
      return err('validateMessage: invalid hash');
    }

    // 3. Check that the signature is valid
    const recoveredAddress = utils.recoverAddress(message.hash, message.signature);
    if (recoveredAddress !== message.signer) {
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
      return this.validateReaction(message);
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

    // TODO: For delete cast, validate hash length.

    return ok(undefined);
  }

  private validateReaction(reaction: Reaction): Result<void, string> {
    // TODO: validate targetUri, schema
    if (reaction.data.body.type !== 'like') {
      return err('validateReaction: invalid type');
    }
    return ok(undefined);
  }
}

export default Engine;
