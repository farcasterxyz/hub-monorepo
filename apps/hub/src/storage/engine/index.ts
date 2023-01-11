import * as flatbuffers from '@farcaster/flatbuffers';
import { bytesCompare, bytesToNumber, HubAsyncResult, HubError, HubResult, validations } from '@farcaster/utils';
import { err, errAsync, ok, ResultAsync } from 'neverthrow';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel, { FID_BYTES } from '~/flatbuffers/models/messageModel';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';
import { isSignerAdd, isSignerRemove, isUserDataAdd } from '~/flatbuffers/models/typeguards';
import * as types from '~/flatbuffers/models/types';
import { RootPrefix } from '~/flatbuffers/models/types';
import { SyncId } from '~/network/sync/syncId';
import RocksDB from '~/storage/db/rocksdb';
import AmpStore from '~/storage/stores/ampStore';
import CastStore from '~/storage/stores/castStore';
import ReactionStore from '~/storage/stores/reactionStore';
import SignerStore from '~/storage/stores/signerStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import UserDataStore from '~/storage/stores/userDataStore';
import VerificationStore from '~/storage/stores/verificationStore';

class Engine {
  public eventHandler: StoreEventHandler;

  private _db: RocksDB;
  private _castStore: CastStore;
  private _signerStore: SignerStore;
  private _ampStore: AmpStore;
  private _reactionStore: ReactionStore;
  private _verificationStore: VerificationStore;
  private _userDataStore: UserDataStore;

  constructor(db: RocksDB) {
    this.eventHandler = new StoreEventHandler();

    this._db = db;
    this._castStore = new CastStore(db, this.eventHandler);
    this._signerStore = new SignerStore(db, this.eventHandler);
    this._ampStore = new AmpStore(db, this.eventHandler);
    this._reactionStore = new ReactionStore(db, this.eventHandler);
    this._verificationStore = new VerificationStore(db, this.eventHandler);
    this._userDataStore = new UserDataStore(db, this.eventHandler);
  }

  async mergeMessages(messages: MessageModel[]): Promise<Array<HubResult<void>>> {
    return Promise.all(messages.map((message) => this.mergeMessage(message)));
  }

  async mergeMessage(message: MessageModel): HubAsyncResult<void> {
    const validatedMessage = await this.validateMessage(message);
    if (validatedMessage.isErr()) {
      return err(validatedMessage.error);
    }

    if (message.setPostfix() === types.UserPostfix.CastMessage) {
      return ResultAsync.fromPromise(this._castStore.merge(message), (e) => e as HubError);
    } else if (message.setPostfix() === types.UserPostfix.AmpMessage) {
      return ResultAsync.fromPromise(this._ampStore.merge(message), (e) => e as HubError);
    } else if (message.setPostfix() === types.UserPostfix.ReactionMessage) {
      return ResultAsync.fromPromise(this._reactionStore.merge(message), (e) => e as HubError);
    } else if (message.setPostfix() === types.UserPostfix.SignerMessage) {
      return ResultAsync.fromPromise(this._signerStore.merge(message), (e) => e as HubError);
    } else if (message.setPostfix() === types.UserPostfix.VerificationMessage) {
      return ResultAsync.fromPromise(this._verificationStore.merge(message), (e) => e as HubError);
    } else if (message.setPostfix() === types.UserPostfix.UserDataMessage) {
      return ResultAsync.fromPromise(this._userDataStore.merge(message), (e) => e as HubError);
    } else {
      return err(new HubError('bad_request.validation_failure', 'invalid message type'));
    }
  }

  async mergeIdRegistryEvent(event: IdRegistryEventModel): HubAsyncResult<void> {
    if (
      event.type() === flatbuffers.IdRegistryEventType.IdRegistryRegister ||
      event.type() === flatbuffers.IdRegistryEventType.IdRegistryTransfer
    ) {
      return ResultAsync.fromPromise(this._signerStore.mergeIdRegistryEvent(event), (e) => e as HubError);
    } else {
      return err(new HubError('bad_request.validation_failure', 'invalid event type'));
    }
  }

  async mergeNameRegistryEvent(event: NameRegistryEventModel): HubAsyncResult<void> {
    if (
      event.type() === flatbuffers.NameRegistryEventType.NameRegistryTransfer ||
      event.type() === flatbuffers.NameRegistryEventType.NameRegistryRenew
    ) {
      return ResultAsync.fromPromise(this._userDataStore.mergeNameRegistryEvent(event), (e) => e as HubError);
    }

    return err(new HubError('bad_request.validation_failure', 'invalid event type'));
  }

  async revokeMessagesBySigner(fid: Uint8Array, signer: Uint8Array): HubAsyncResult<void> {
    await this._castStore.revokeMessagesBySigner(fid, signer);
    await this._ampStore.revokeMessagesBySigner(fid, signer);
    await this._reactionStore.revokeMessagesBySigner(fid, signer);
    await this._verificationStore.revokeMessagesBySigner(fid, signer);
    await this._userDataStore.revokeMessagesBySigner(fid, signer);
    await this._signerStore.revokeMessagesBySigner(fid, signer);

    return ok(undefined);
  }

  async pruneMessages(fid: Uint8Array): HubAsyncResult<void> {
    await this._castStore.pruneMessages(fid);
    await this._ampStore.pruneMessages(fid);
    await this._reactionStore.pruneMessages(fid);
    await this._verificationStore.pruneMessages(fid);
    await this._userDataStore.pruneMessages(fid);
    await this._signerStore.pruneMessages(fid);

    return ok(undefined);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Cast Store Methods                             */
  /* -------------------------------------------------------------------------- */

  async getCast(fid: Uint8Array, tsHash: Uint8Array): HubAsyncResult<types.CastAddModel> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    const validatedTsHash = validations.validateTsHash(tsHash);
    if (validatedTsHash.isErr()) {
      return err(validatedTsHash.error);
    }

    return ResultAsync.fromPromise(this._castStore.getCastAdd(fid, tsHash), (e) => e as HubError);
  }

  async getCastsByFid(fid: Uint8Array): HubAsyncResult<types.CastAddModel[]> {
    return validations.validateFid(fid).match(
      (validatedFid: Uint8Array) => {
        return ResultAsync.fromPromise(this._castStore.getCastAddsByUser(validatedFid), (e) => e as HubError);
      },
      (e) => {
        return errAsync(e);
      }
    );
  }

  async getCastsByParent(parent: flatbuffers.CastId): HubAsyncResult<types.CastAddModel[]> {
    return validations.validateCastId(parent).match(
      (validatedParent: validations.ValidatedCastId) => {
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

  async getCastsByMention(user: flatbuffers.UserId): HubAsyncResult<types.CastAddModel[]> {
    return validations.validateUserId(user).match(
      (validatedUserId: validations.ValidatedUserId) => {
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
  /*                             All Messages                                   */
  /* -------------------------------------------------------------------------- */
  async forEachMessage(callback: (message: MessageModel) => void): Promise<void> {
    const allUserPrefix = Buffer.from([RootPrefix.User]);

    for await (const [key, value] of this._db.iteratorByPrefix(allUserPrefix, { keys: true, valueAsBuffer: true })) {
      if (key.length < 2 + FID_BYTES) {
        // Not a message key, so we can skip it.
        continue;
      }

      // Get the UserMessagePostfix from the key, which is the 1 + 32 bytes from the start
      const postfix = key.slice(1 + FID_BYTES, 1 + FID_BYTES + 1)[0];
      if (
        postfix !== types.UserPostfix.CastMessage &&
        postfix !== types.UserPostfix.AmpMessage &&
        postfix !== types.UserPostfix.ReactionMessage &&
        postfix !== types.UserPostfix.VerificationMessage &&
        postfix !== types.UserPostfix.SignerMessage &&
        postfix !== types.UserPostfix.UserDataMessage
      ) {
        // Not a message key, so we can skip it.
        continue;
      }

      if (!value || value.length <= 20) {
        // This is a hash and not a message, we need to skip it.
        continue;
      }

      callback(MessageModel.from(new Uint8Array(value)));
    }
  }

  async getAllMessagesBySyncIds(syncIds: string[]): HubAsyncResult<MessageModel[]> {
    const hashesBuf = syncIds.map((syncIdHash) => SyncId.pkFromIdString(syncIdHash));
    const messages = await ResultAsync.fromPromise(MessageModel.getMany(this._db, hashesBuf), (e) => e as HubError);

    return messages;
  }

  async getAllCastMessagesByFid(fid: Uint8Array): HubAsyncResult<(types.CastAddModel | types.CastRemoveModel)[]> {
    const adds = await ResultAsync.fromPromise(this._castStore.getCastAddsByUser(fid), (e) => e as HubError);
    if (adds.isErr()) {
      return err(adds.error);
    }

    const removes = await ResultAsync.fromPromise(this._castStore.getCastRemovesByUser(fid), (e) => e as HubError);
    if (removes.isErr()) {
      return err(removes.error);
    }

    return ok([...adds.value, ...removes.value]);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Amp Store Methods                           */
  /* -------------------------------------------------------------------------- */

  async getAmp(fid: Uint8Array, user: flatbuffers.UserId): HubAsyncResult<types.AmpAddModel> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    const validatedUser = validations.validateUserId(user);
    if (validatedUser.isErr()) {
      return err(validatedUser.error);
    }

    return ResultAsync.fromPromise(this._ampStore.getAmpAdd(fid, validatedUser.value.fidArray()), (e) => e as HubError);
  }

  async getAmpsByFid(fid: Uint8Array): HubAsyncResult<types.AmpAddModel[]> {
    return validations.validateFid(fid).match(
      (validatedFid: Uint8Array) => {
        return ResultAsync.fromPromise(this._ampStore.getAmpAddsByUser(validatedFid), (e) => e as HubError);
      },
      (e) => {
        return errAsync(e);
      }
    );
  }

  async getAmpsByUser(user: flatbuffers.UserId): HubAsyncResult<types.AmpAddModel[]> {
    return validations.validateUserId(user).match(
      (validatedUserId: validations.ValidatedUserId) => {
        return ResultAsync.fromPromise(
          this._ampStore.getAmpsByTargetUser(validatedUserId.fidArray()),
          (e) => e as HubError
        );
      },
      (e) => {
        return errAsync(e);
      }
    );
  }

  async getAllAmpMessagesByFid(fid: Uint8Array): HubAsyncResult<(types.AmpAddModel | types.AmpRemoveModel)[]> {
    const adds = await ResultAsync.fromPromise(this._ampStore.getAmpAddsByUser(fid), (e) => e as HubError);
    if (adds.isErr()) {
      return err(adds.error);
    }

    const removes = await ResultAsync.fromPromise(this._ampStore.getAmpRemovesByUser(fid), (e) => e as HubError);
    if (removes.isErr()) {
      return err(removes.error);
    }

    return ok([...adds.value, ...removes.value]);
  }

  /* -------------------------------------------------------------------------- */
  /*                            Reaction Store Methods                          */
  /* -------------------------------------------------------------------------- */

  async getReaction(
    fid: Uint8Array,
    type: flatbuffers.ReactionType,
    cast: flatbuffers.CastId
  ): HubAsyncResult<types.ReactionAddModel> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    const validatedReactionType = validations.validateReactionType(type);
    if (validatedReactionType.isErr()) {
      return err(validatedReactionType.error);
    }

    const validatedCast = validations.validateCastId(cast);
    if (validatedCast.isErr()) {
      return err(validatedCast.error);
    }

    return ResultAsync.fromPromise(this._reactionStore.getReactionAdd(fid, type, cast), (e) => e as HubError);
  }

  async getReactionsByFid(fid: Uint8Array, type?: flatbuffers.ReactionType): HubAsyncResult<types.ReactionAddModel[]> {
    return validations.validateFid(fid).match(
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

  async getReactionsByCast(
    cast: flatbuffers.CastId,
    type?: flatbuffers.ReactionType
  ): HubAsyncResult<types.ReactionAddModel[]> {
    return validations.validateCastId(cast).match(
      (validatedCastId: validations.ValidatedCastId) => {
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

  async getAllReactionMessagesByFid(
    fid: Uint8Array
  ): HubAsyncResult<(types.ReactionAddModel | types.ReactionRemoveModel)[]> {
    const adds = await ResultAsync.fromPromise(this._reactionStore.getReactionAddsByUser(fid), (e) => e as HubError);
    if (adds.isErr()) {
      return err(adds.error);
    }

    const removes = await ResultAsync.fromPromise(
      this._reactionStore.getReactionRemovesByUser(fid),
      (e) => e as HubError
    );
    if (removes.isErr()) {
      return err(removes.error);
    }

    return ok([...adds.value, ...removes.value]);
  }

  /* -------------------------------------------------------------------------- */
  /*                          Verification Store Methods                        */
  /* -------------------------------------------------------------------------- */

  async getVerification(fid: Uint8Array, address: Uint8Array): HubAsyncResult<types.VerificationAddEthAddressModel> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    const validatedAddress = validations.validateEthAddress(address);
    if (validatedAddress.isErr()) {
      return err(validatedAddress.error);
    }

    return ResultAsync.fromPromise(this._verificationStore.getVerificationAdd(fid, address), (e) => e as HubError);
  }

  async getVerificationsByFid(fid: Uint8Array): HubAsyncResult<types.VerificationAddEthAddressModel[]> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._verificationStore.getVerificationAddsByUser(fid), (e) => e as HubError);
  }

  async getAllVerificationMessagesByFid(
    fid: Uint8Array
  ): HubAsyncResult<(types.VerificationAddEthAddressModel | types.VerificationRemoveModel)[]> {
    const adds = await ResultAsync.fromPromise(
      this._verificationStore.getVerificationAddsByUser(fid),
      (e) => e as HubError
    );
    if (adds.isErr()) {
      return err(adds.error);
    }

    const removes = await ResultAsync.fromPromise(
      this._verificationStore.getVerificationRemovesByUser(fid),
      (e) => e as HubError
    );
    if (removes.isErr()) {
      return err(removes.error);
    }

    return ok([...adds.value, ...removes.value]);
  }

  /* -------------------------------------------------------------------------- */
  /*                              Signer Store Methods                          */
  /* -------------------------------------------------------------------------- */

  async getSigner(fid: Uint8Array, signerPubKey: Uint8Array): HubAsyncResult<types.SignerAddModel> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    const validatedPubKey = validations.validateEd25519PublicKey(signerPubKey);
    if (validatedPubKey.isErr()) {
      return err(validatedPubKey.error);
    }

    return ResultAsync.fromPromise(this._signerStore.getSignerAdd(fid, signerPubKey), (e) => e as HubError);
  }

  async getSignersByFid(fid: Uint8Array): HubAsyncResult<types.SignerAddModel[]> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._signerStore.getSignerAddsByUser(fid), (e) => e as HubError);
  }

  async getCustodyEvent(fid: Uint8Array): HubAsyncResult<IdRegistryEventModel> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._signerStore.getCustodyEvent(fid), (e) => e as HubError);
  }

  async getFids(): HubAsyncResult<Uint8Array[]> {
    return ResultAsync.fromPromise(this._signerStore.getFids(), (e) => e as HubError);
  }

  async getAllSignerMessagesByFid(fid: Uint8Array): HubAsyncResult<(types.SignerAddModel | types.SignerRemoveModel)[]> {
    const adds = await ResultAsync.fromPromise(this._signerStore.getSignerAddsByUser(fid), (e) => e as HubError);
    if (adds.isErr()) {
      return err(adds.error);
    }

    const removes = await ResultAsync.fromPromise(this._signerStore.getSignerRemovesByUser(fid), (e) => e as HubError);
    if (removes.isErr()) {
      return err(removes.error);
    }

    return ok([...adds.value, ...removes.value]);
  }

  /* -------------------------------------------------------------------------- */
  /*                           User Data Store Methods                          */
  /* -------------------------------------------------------------------------- */

  async getUserData(fid: Uint8Array, type: flatbuffers.UserDataType): HubAsyncResult<types.UserDataAddModel> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._userDataStore.getUserDataAdd(fid, type), (e) => e as HubError);
  }

  async getUserDataByFid(fid: Uint8Array): HubAsyncResult<types.UserDataAddModel[]> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._userDataStore.getUserDataAddsByUser(fid), (e) => e as HubError);
  }

  async getNameRegistryEvent(fname: Uint8Array): HubAsyncResult<NameRegistryEventModel> {
    return ResultAsync.fromPromise(this._userDataStore.getNameRegistryEvent(fname), (e) => e as HubError);
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
      return err(new HubError('bad_request.validation_failure', `unknown fid ${bytesToNumber(message.fid())}`));
    }

    // 2. Check that the signer is valid if message is not a signer message
    if (!isSignerAdd(message) && !isSignerRemove(message)) {
      const signerResult = await ResultAsync.fromPromise(
        this._signerStore.getSignerAdd(message.fid(), message.signer()),
        (e) => e
      );
      if (signerResult.isErr()) {
        return err(new HubError('bad_request.validation_failure', 'invalid signer'));
      }
    }

    // 3. For fname add UserDataAdd messages, check that the user actually owns the fname
    if (isUserDataAdd(message) && message.body().type() == flatbuffers.UserDataType.Fname) {
      // For fname messages, check if the user actually owns the fname.
      const fname = new TextEncoder().encode(message.body().value() ?? '');

      // Users are allowed to set fname = '' to remove their fname, so check to see if fname is set
      // before validating the custody address
      if (fname && fname.length > 0) {
        const fid = message.fid();

        // The custody address of the fid and fname must be the same
        const fidCustodyAddress = await IdRegistryEventModel.get(this._db, fid).then((event) => event?.to());
        const fnameCustodyAddress = await NameRegistryEventModel.get(this._db, fname).then((event) => event?.to());

        if (bytesCompare(fidCustodyAddress, fnameCustodyAddress) !== 0) {
          return err(
            new HubError('bad_request.validation_failure', 'fname custody address does not match fid custody address')
          );
        }
      }
    }

    // 4. Check message body and envelope (will throw HubError if invalid)
    const validMessage = await validations.validateMessage(message.message);

    return validMessage.map(() => message);
  }
}

export default Engine;
