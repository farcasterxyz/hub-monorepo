import { err, errAsync, ResultAsync } from 'neverthrow';
import CastStore from '~/storage/sets/flatbuffers/castStore';
import RocksDB from '~/storage/db/binaryrocksdb';
import SignerStore from '~/storage/sets/flatbuffers/signerStore';
import FollowStore from '~/storage/sets/flatbuffers/followStore';
import ReactionStore from '~/storage/sets/flatbuffers/reactionStore';
import VerificationStore from '~/storage/sets/flatbuffers/verificationStore';
import UserDataStore from '~/storage/sets/flatbuffers/userDataStore';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { CastAddModel, FollowAddModel, ReactionAddModel, UserPostfix } from '~/storage/flatbuffers/types';
import ContractEventModel from '~/storage/flatbuffers/contractEventModel';
import { ContractEventType } from '~/utils/generated/contract_event_generated';
import { isSignerAdd, isSignerRemove } from '~/storage/flatbuffers/typeguards';
import {
  validateCastId,
  ValidatedCastId,
  ValidatedUserId,
  validateFid,
  validateMessage,
  validateTsHash,
  validateUserId,
} from '~/storage/flatbuffers/validations';
import { CastId, ReactionType, UserId } from '~/utils/generated/message_generated';
import { HubAsyncResult, HubError } from '~/utils/hubErrors';

class Engine {
  private _castStore: CastStore;
  private _signerStore: SignerStore;
  private _followStore: FollowStore;
  private _reactionStore: ReactionStore;
  private _verificationStore: VerificationStore;
  private _userDataStore: UserDataStore;

  // TODO: add ID Registry connection

  constructor(db: RocksDB) {
    this._castStore = new CastStore(db);
    this._signerStore = new SignerStore(db);
    this._followStore = new FollowStore(db);
    this._reactionStore = new ReactionStore(db);
    this._verificationStore = new VerificationStore(db);
    this._userDataStore = new UserDataStore(db);
  }

  // TODO: add mergeMessages

  async mergeMessage(message: MessageModel): HubAsyncResult<void> {
    const validatedMessage = await this.validateMessage(message);
    if (validatedMessage.isErr()) {
      return err(validatedMessage.error);
    }

    if (message.setPostfix() === UserPostfix.CastMessage) {
      return ResultAsync.fromPromise(this._castStore.merge(message), (e) => e as HubError);
    } else if (message.setPostfix() === UserPostfix.FollowMessage) {
      return ResultAsync.fromPromise(this._followStore.merge(message), (e) => e as HubError);
    } else if (message.setPostfix() === UserPostfix.ReactionMessage) {
      return ResultAsync.fromPromise(this._reactionStore.merge(message), (e) => e as HubError);
    } else if (message.setPostfix() === UserPostfix.SignerMessage) {
      return ResultAsync.fromPromise(this._signerStore.merge(message), (e) => e as HubError);
    } else if (message.setPostfix() === UserPostfix.VerificationMessage) {
      return ResultAsync.fromPromise(this._verificationStore.merge(message), (e) => e as HubError);
    } else if (message.setPostfix() === UserPostfix.UserDataMessage) {
      return ResultAsync.fromPromise(this._userDataStore.merge(message), (e) => e as HubError);
    } else {
      return err(new HubError('bad_request.validation_failure', 'invalid message type'));
    }
  }

  async mergeIdRegistryEvent(event: ContractEventModel): HubAsyncResult<void> {
    if (
      event.type() === ContractEventType.IdRegistryRegister ||
      event.type() === ContractEventType.IdRegistryTransfer
    ) {
      return ResultAsync.fromPromise(this._signerStore.mergeIdRegistryEvent(event), (e) => e as HubError);
    } else {
      return err(new HubError('bad_request.validation_failure', 'invalid event type'));
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                             Cast Store Methods                             */
  /* -------------------------------------------------------------------------- */

  async getCast(fid: Uint8Array, tsHash: Uint8Array): HubAsyncResult<CastAddModel> {
    const validatedFid = validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    const validatedTsHash = validateTsHash(tsHash);
    if (validatedTsHash.isErr()) {
      return err(validatedTsHash.error);
    }

    return ResultAsync.fromPromise(this._castStore.getCastAdd(fid, tsHash), (e) => e as HubError);
  }

  async getCastsByFid(fid: Uint8Array): HubAsyncResult<CastAddModel[]> {
    return validateFid(fid).match(
      (validatedFid: Uint8Array) => {
        return ResultAsync.fromPromise(this._castStore.getCastAddsByUser(validatedFid), (e) => e as HubError);
      },
      (e) => {
        return errAsync(e);
      }
    );
  }

  async getCastsByParent(parent: CastId): HubAsyncResult<CastAddModel[]> {
    return validateCastId(parent).match(
      (validatedParent: ValidatedCastId) => {
        return ResultAsync.fromPromise(
          this._castStore.getCastsByParent(validatedParent.fidArray(), validatedParent.tsHashArray()),
          (e) => e as HubError
        );
      },
      (e) => {
        return errAsync(e);
      }
    );
  }

  async getCastsByMention(user: UserId): HubAsyncResult<CastAddModel[]> {
    return validateUserId(user).match(
      (validatedUserId: ValidatedUserId) => {
        return ResultAsync.fromPromise(
          this._castStore.getCastsByMention(validatedUserId.fidArray()),
          (e) => e as HubError
        );
      },
      (e) => {
        return errAsync(e);
      }
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                             Follow Store Methods                           */
  /* -------------------------------------------------------------------------- */

  async getFollow(fid: Uint8Array, user: UserId): HubAsyncResult<FollowAddModel> {
    const validatedFid = validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    const validatedUser = validateUserId(user);
    if (validatedUser.isErr()) {
      return err(validatedUser.error);
    }

    return ResultAsync.fromPromise(
      this._followStore.getFollowAdd(fid, validatedUser.value.fidArray()),
      (e) => e as HubError
    );
  }

  async getFollowsByFid(fid: Uint8Array): HubAsyncResult<FollowAddModel[]> {
    return validateFid(fid).match(
      (validatedFid: Uint8Array) => {
        return ResultAsync.fromPromise(this._followStore.getFollowAddsByUser(validatedFid), (e) => e as HubError);
      },
      (e) => {
        return errAsync(e);
      }
    );
  }

  async getFollowsByUser(user: UserId): HubAsyncResult<FollowAddModel[]> {
    return validateUserId(user).match(
      (validatedUserId: ValidatedUserId) => {
        return ResultAsync.fromPromise(
          this._followStore.getFollowsByTargetUser(validatedUserId.fidArray()),
          (e) => e as HubError
        );
      },
      (e) => {
        return errAsync(e);
      }
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                            Reaction Store Methods                          */
  /* -------------------------------------------------------------------------- */

  async getReaction(fid: Uint8Array, type: ReactionType, cast: CastId): HubAsyncResult<ReactionAddModel> {
    const validatedFid = validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    // TODO: validate reaction type

    const validatedCast = validateCastId(cast);
    if (validatedCast.isErr()) {
      return err(validatedCast.error);
    }

    return ResultAsync.fromPromise(this._reactionStore.getReactionAdd(fid, type, cast), (e) => e as HubError);
  }

  async getReactionsByFid(fid: Uint8Array, type?: ReactionType): HubAsyncResult<ReactionAddModel[]> {
    return validateFid(fid).match(
      (validatedFid: Uint8Array) => {
        return ResultAsync.fromPromise(
          this._reactionStore.getReactionAddsByUser(validatedFid, type),
          (e) => e as HubError
        );
      },
      (e) => {
        return errAsync(e);
      }
    );
  }

  async getReactionsByCast(cast: CastId, type?: ReactionType): HubAsyncResult<ReactionAddModel[]> {
    return validateCastId(cast).match(
      (validatedCastId: ValidatedCastId) => {
        return ResultAsync.fromPromise(
          this._reactionStore.getReactionsByTargetCast(validatedCastId, type),
          (e) => e as HubError
        );
      },
      (e) => {
        return errAsync(e);
      }
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async validateMessage(message: MessageModel): HubAsyncResult<MessageModel> {
    // 1. Check that the user has a custody address
    const custodyAddress = await ResultAsync.fromPromise(
      this._signerStore.getCustodyAddress(message.fid()),
      () => undefined
    );
    if (custodyAddress.isErr()) {
      return err(new HubError('bad_request.validation_failure', 'unknown user'));
    }

    // 2. Check that the signer is valid if message is not a signer message
    if (!isSignerAdd(message) && !isSignerRemove(message)) {
      const signerResult = await ResultAsync.fromPromise(
        this._signerStore.getSignerAdd(message.fid(), message.signer()),
        () => undefined
      );
      if (signerResult.isErr()) {
        return err(new HubError('bad_request.validation_failure', 'invalid signer'));
      }
    }

    // 3. Check message body and envelope (will throw HubError if invalid)
    return validateMessage(message);
  }
}

export default Engine;
