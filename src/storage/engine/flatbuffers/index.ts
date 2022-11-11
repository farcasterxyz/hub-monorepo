import { err, errAsync, ResultAsync } from 'neverthrow';
import CastStore from '~/storage/sets/flatbuffers/castStore';
import RocksDB from '~/storage/db/binaryrocksdb';
import { BadRequestError } from '~/utils/errors';
import SignerStore from '~/storage/sets/flatbuffers/signerStore';
import FollowStore from '~/storage/sets/flatbuffers/followStore';
import ReactionStore from '~/storage/sets/flatbuffers/reactionStore';
import VerificationStore from '~/storage/sets/flatbuffers/verificationStore';
import UserDataStore from '~/storage/sets/flatbuffers/userDataStore';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { CastAddModel, UserPostfix } from '~/storage/flatbuffers/types';
import ContractEventModel from '~/storage/flatbuffers/contractEventModel';
import { ContractEventType } from '~/utils/generated/contract_event_generated';
import { isSignerAdd, isSignerRemove } from '~/storage/flatbuffers/typeguards';
import {
  validateCastId,
  ValidatedCastId,
  ValidatedUserId,
  validateMessage,
  validateUserId,
} from '~/storage/flatbuffers/validations';
import { CastId, UserId } from '~/utils/generated/message_generated';
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
      return ResultAsync.fromPromise(
        this._castStore.merge(message),
        (e) => new HubError('unknown', { cause: e as Error })
      );
    } else if (message.setPostfix() === UserPostfix.FollowMessage) {
      return ResultAsync.fromPromise(
        this._followStore.merge(message),
        (e) => new HubError('unknown', { cause: e as Error })
      );
    } else if (message.setPostfix() === UserPostfix.ReactionMessage) {
      return ResultAsync.fromPromise(
        this._reactionStore.merge(message),
        (e) => new HubError('unknown', { cause: e as Error })
      );
    } else if (message.setPostfix() === UserPostfix.SignerMessage) {
      return ResultAsync.fromPromise(
        this._signerStore.merge(message),
        (e) => new HubError('unknown', { cause: e as Error })
      );
    } else if (message.setPostfix() === UserPostfix.VerificationMessage) {
      return ResultAsync.fromPromise(
        this._verificationStore.merge(message),
        (e) => new HubError('unknown', { cause: e as Error })
      );
    } else if (message.setPostfix() === UserPostfix.UserDataMessage) {
      return ResultAsync.fromPromise(
        this._userDataStore.merge(message),
        (e) => new HubError('unknown', { cause: e as Error })
      );
    } else {
      return err(new HubError('bad_request', 'invalid message type'));
    }
  }

  async mergeIdRegistryEvent(event: ContractEventModel): Promise<void> {
    if (
      event.type() === ContractEventType.IdRegistryRegister ||
      event.type() === ContractEventType.IdRegistryTransfer
    ) {
      return this._signerStore.mergeIdRegistryEvent(event);
    } else {
      throw new BadRequestError('invalid event type');
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                             Cast Store Methods                             */
  /* -------------------------------------------------------------------------- */

  async getCastsByUser(user: UserId): HubAsyncResult<CastAddModel[]> {
    return validateUserId(user).match(
      (validatedUserId: ValidatedUserId) => {
        return ResultAsync.fromPromise(
          this._castStore.getCastAddsByUser(validatedUserId.fidArray()),
          (e) => new HubError('unknown', { cause: e as Error })
        );
      },
      (e) => {
        return errAsync(e);
      }
    );
  }

  async getCast(cast: CastId): HubAsyncResult<CastAddModel> {
    return validateCastId(cast).match(
      (validatedCastId: ValidatedCastId) => {
        return ResultAsync.fromPromise(
          this._castStore.getCastAdd(validatedCastId.fidArray(), validatedCastId.tsHashArray()),
          (e) => new HubError('not_found', { cause: e as Error })
        );
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
          (e) => new HubError('unknown', { cause: e as Error })
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
          (e) => new HubError('unknown', { cause: e as Error })
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

    // 3. Check message body and envelope (will throw ValidationError if invalid)
    return validateMessage(message);
  }
}

export default Engine;
