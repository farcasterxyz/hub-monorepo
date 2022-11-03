import { ResultAsync } from 'neverthrow';
import CastStore from '~/storage/sets/flatbuffers/castStore';
import RocksDB from '~/storage/db/binaryrocksdb';
import { BadRequestError, ValidationError } from '~/utils/errors';
import SignerStore from '~/storage/sets/flatbuffers/signerStore';
import FollowStore from '~/storage/sets/flatbuffers/followStore';
import ReactionStore from '~/storage/sets/flatbuffers/reactionStore';
import VerificationStore from '~/storage/sets/flatbuffers/verificationStore';
import UserDataStore from '~/storage/sets/flatbuffers/userDataStore';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { UserPostfix } from '~/storage/flatbuffers/types';
import ContractEventModel from '~/storage/flatbuffers/contractEventModel';
import { ContractEventType } from '~/utils/generated/contract_event_generated';
import { isSignerAdd, isSignerRemove } from '~/storage/flatbuffers/typeguards';
import { validateMessage } from '~/storage/flatbuffers/validations';

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

  mergeMessages(messages: MessageModel[]): Array<Promise<void>> {
    const results = messages.map((value) => {
      return this.mergeMessage(value);
    });
    return results;
  }

  async mergeMessage(message: MessageModel): Promise<void> {
    await this.validateMessage(message);

    if (message.setPostfix() === UserPostfix.CastMessage) {
      return this._castStore.merge(message);
    } else if (message.setPostfix() === UserPostfix.FollowMessage) {
      return this._followStore.merge(message);
    } else if (message.setPostfix() === UserPostfix.ReactionMessage) {
      return this._reactionStore.merge(message);
    } else if (message.setPostfix() === UserPostfix.SignerMessage) {
      return this._signerStore.merge(message);
    } else if (message.setPostfix() === UserPostfix.VerificationMessage) {
      return this._verificationStore.merge(message);
    } else if (message.setPostfix() === UserPostfix.UserDataMessage) {
      return this._userDataStore.merge(message);
    } else {
      throw new BadRequestError('invalid message type');
    }
  }

  async mergeIdRegistryEvent(event: ContractEventModel): Promise<void> {
    if (
      event.type() === ContractEventType.IDRegistryRegister ||
      event.type() === ContractEventType.IDRegistryTransfer
    ) {
      return this._signerStore.mergeIDRegistryEvent(event);
    } else {
      throw new BadRequestError('invalid event type');
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async validateMessage(message: MessageModel): Promise<MessageModel> {
    // 1. Check that the user has a custody address
    const custodyAddress = await ResultAsync.fromPromise(
      this._signerStore.getCustodyAddress(message.fid()),
      () => undefined
    );
    if (custodyAddress.isErr()) {
      throw new ValidationError('unknown user');
    }

    // 2. Check that the signer is valid if message is not a signer message
    if (!isSignerAdd(message) && !isSignerRemove(message)) {
      const signerResult = await ResultAsync.fromPromise(
        this._signerStore.getSignerAdd(message.fid(), message.signer()),
        () => undefined
      );
      if (signerResult.isErr()) {
        throw new ValidationError('invalid signer');
      }
    }

    // 3. Check message body and envelope (will throw ValidationError if invalid)
    return validateMessage(message);
  }
}

export default Engine;
