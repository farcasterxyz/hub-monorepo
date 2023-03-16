import * as protobufs from '@farcaster/protobufs';
import { bytesCompare, HubAsyncResult, HubError, HubResult, utf8StringToBytes, validations } from '@farcaster/utils';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import { SyncId } from '~/network/sync/syncId';
import { getManyMessages, typeToSetPostfix } from '~/storage/db/message';
import RocksDB from '~/storage/db/rocksdb';
import { FID_BYTES, RootPrefix, TSHASH_LENGTH, UserPostfix } from '~/storage/db/types';
import CastStore from '~/storage/stores/castStore';
import ReactionStore from '~/storage/stores/reactionStore';
import SignerStore from '~/storage/stores/signerStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import { MessagesPage, PageOptions } from '~/storage/stores/types';
import UserDataStore from '~/storage/stores/userDataStore';
import VerificationStore from '~/storage/stores/verificationStore';
import { logger } from '~/utils/logger';

const log = logger.child({
  component: 'Engine',
});

class Engine {
  public eventHandler: StoreEventHandler;

  private _db: RocksDB;
  private _network: protobufs.FarcasterNetwork;

  private _reactionStore: ReactionStore;
  private _signerStore: SignerStore;
  private _castStore: CastStore;
  private _userDataStore: UserDataStore;
  private _verificationStore: VerificationStore;

  constructor(db: RocksDB, network: protobufs.FarcasterNetwork) {
    this._db = db;
    this._network = network;

    this.eventHandler = new StoreEventHandler(db);

    this._reactionStore = new ReactionStore(db, this.eventHandler);
    this._signerStore = new SignerStore(db, this.eventHandler);
    this._castStore = new CastStore(db, this.eventHandler);
    this._userDataStore = new UserDataStore(db, this.eventHandler);
    this._verificationStore = new VerificationStore(db, this.eventHandler);
  }

  async mergeMessages(messages: protobufs.Message[]): Promise<Array<HubResult<number>>> {
    return Promise.all(messages.map((message) => this.mergeMessage(message)));
  }

  async mergeMessage(message: protobufs.Message): HubAsyncResult<number> {
    const validatedMessage = await this.validateMessage(message);
    if (validatedMessage.isErr()) {
      return err(validatedMessage.error);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const setPostfix = typeToSetPostfix(message.data!.type);

    if (setPostfix === UserPostfix.ReactionMessage) {
      return ResultAsync.fromPromise(this._reactionStore.merge(message), (e) => e as HubError);
    } else if (setPostfix === UserPostfix.SignerMessage) {
      return ResultAsync.fromPromise(this._signerStore.merge(message), (e) => e as HubError);
    } else if (setPostfix === UserPostfix.CastMessage) {
      return ResultAsync.fromPromise(this._castStore.merge(message), (e) => e as HubError);
    } else if (setPostfix === UserPostfix.UserDataMessage) {
      return ResultAsync.fromPromise(this._userDataStore.merge(message), (e) => e as HubError);
    } else if (setPostfix === UserPostfix.VerificationMessage) {
      return ResultAsync.fromPromise(this._verificationStore.merge(message), (e) => e as HubError);
    } else {
      return err(new HubError('bad_request.validation_failure', 'invalid message type'));
    }
  }

  async mergeIdRegistryEvent(event: protobufs.IdRegistryEvent): HubAsyncResult<number> {
    // TODO: validate event
    if (
      event.type === protobufs.IdRegistryEventType.REGISTER ||
      event.type === protobufs.IdRegistryEventType.TRANSFER
    ) {
      return ResultAsync.fromPromise(this._signerStore.mergeIdRegistryEvent(event), (e) => e as HubError);
    } else {
      return err(new HubError('bad_request.validation_failure', 'invalid event type'));
    }
  }

  async mergeNameRegistryEvent(event: protobufs.NameRegistryEvent): HubAsyncResult<number> {
    // TODO: validate event
    if (
      event.type === protobufs.NameRegistryEventType.TRANSFER ||
      event.type === protobufs.NameRegistryEventType.RENEW
    ) {
      return ResultAsync.fromPromise(this._userDataStore.mergeNameRegistryEvent(event), (e) => e as HubError);
    }

    return err(new HubError('bad_request.validation_failure', 'invalid event type'));
  }

  async revokeMessagesBySigner(fid: number, signer: Uint8Array): HubAsyncResult<void> {
    await this._castStore.revokeMessagesBySigner(fid, signer);
    await this._reactionStore.revokeMessagesBySigner(fid, signer);
    await this._verificationStore.revokeMessagesBySigner(fid, signer);
    await this._userDataStore.revokeMessagesBySigner(fid, signer);
    await this._signerStore.revokeMessagesBySigner(fid, signer);

    return ok(undefined);
  }

  async pruneMessages(fid: number): HubAsyncResult<void> {
    const logPruneResult = (result: HubResult<number[]>, store: string): void => {
      result.match(
        (ids) => {
          if (ids.length > 0) {
            log.info(`Pruned ${ids.length} ${store} messages for fid ${fid}`);
          }
        },
        (e) => {
          log.error(`Error pruning ${store} messages for fid ${fid}`, e);
        }
      );
    };

    const castResult = await this._castStore.pruneMessages(fid);
    logPruneResult(castResult, 'cast');

    const reactionResult = await this._reactionStore.pruneMessages(fid);
    logPruneResult(reactionResult, 'reaction');

    const verificationResult = await this._verificationStore.pruneMessages(fid);
    logPruneResult(verificationResult, 'verification');

    const userDataResult = await this._userDataStore.pruneMessages(fid);
    logPruneResult(userDataResult, 'user data');

    const signerResult = await this._signerStore.pruneMessages(fid);
    logPruneResult(signerResult, 'signer');

    return ok(undefined);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Event Methods                                  */
  /* -------------------------------------------------------------------------- */

  async getEvent(id: number): HubAsyncResult<protobufs.HubEvent> {
    return this.eventHandler.getEvent(id);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Sync Methods                                   */
  /* -------------------------------------------------------------------------- */

  async forEachMessage(callback: (message: protobufs.Message, key: Buffer) => Promise<boolean | void>): Promise<void> {
    const allUserPrefix = Buffer.from([RootPrefix.User]);

    for await (const [key, value] of this._db.iteratorByPrefix(allUserPrefix, { keys: true, valueAsBuffer: true })) {
      if (key.length !== 1 + FID_BYTES + 1 + TSHASH_LENGTH) {
        // Not a message key, so we can skip it.
        continue;
      }

      // Get the UserMessagePostfix from the key, which is the 1 + 32 bytes from the start
      const postfix = key.slice(1 + FID_BYTES, 1 + FID_BYTES + 1)[0];
      if (
        postfix !== UserPostfix.CastMessage &&
        postfix !== UserPostfix.AmpMessage &&
        postfix !== UserPostfix.ReactionMessage &&
        postfix !== UserPostfix.VerificationMessage &&
        postfix !== UserPostfix.SignerMessage &&
        postfix !== UserPostfix.UserDataMessage
      ) {
        // Not a message key, so we can skip it.
        continue;
      }

      const message = Result.fromThrowable(
        () => protobufs.Message.decode(new Uint8Array(value)),
        (e) => e as HubError
      )();

      if (message.isOk()) {
        const done = await callback(message.value, key);
        if (done) {
          break;
        }
      }
    }
  }
  async getAllMessagesBySyncIds(syncIds: Uint8Array[]): HubAsyncResult<protobufs.Message[]> {
    const hashesBuf = syncIds.map((syncIdHash) => SyncId.pkFromSyncId(syncIdHash));
    const messages = await ResultAsync.fromPromise(getManyMessages(this._db, hashesBuf), (e) => e as HubError);

    return messages;
  }

  /* -------------------------------------------------------------------------- */
  /*                             Cast Store Methods                             */
  /* -------------------------------------------------------------------------- */

  async getCast(fid: number, hash: Uint8Array): HubAsyncResult<protobufs.CastAddMessage> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._castStore.getCastAdd(fid, hash), (e) => e as HubError);
  }

  async getCastsByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): HubAsyncResult<MessagesPage<protobufs.CastAddMessage>> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._castStore.getCastAddsByFid(fid, pageOptions), (e) => e as HubError);
  }

  async getCastsByParent(
    parentId: protobufs.CastId,
    pageOptions: PageOptions = {}
  ): HubAsyncResult<MessagesPage<protobufs.CastAddMessage>> {
    const validatedCastId = validations.validateCastId(parentId);
    if (validatedCastId.isErr()) {
      return err(validatedCastId.error);
    }

    return ResultAsync.fromPromise(this._castStore.getCastsByParent(parentId, pageOptions), (e) => e as HubError);
  }

  async getCastsByMention(
    mentionFid: number,
    pageOptions: PageOptions = {}
  ): HubAsyncResult<MessagesPage<protobufs.CastAddMessage>> {
    const validatedFid = validations.validateFid(mentionFid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._castStore.getCastsByMention(mentionFid, pageOptions), (e) => e as HubError);
  }

  async getAllCastMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): HubAsyncResult<MessagesPage<protobufs.CastAddMessage | protobufs.CastRemoveMessage>> {
    return ResultAsync.fromPromise(this._castStore.getAllCastMessagesByFid(fid, pageOptions), (e) => e as HubError);
  }

  /* -------------------------------------------------------------------------- */
  /*                            Reaction Store Methods                          */
  /* -------------------------------------------------------------------------- */

  async getReaction(
    fid: number,
    type: protobufs.ReactionType,
    cast: protobufs.CastId
  ): HubAsyncResult<protobufs.ReactionAddMessage> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    const validatedCastId = validations.validateCastId(cast);
    if (validatedCastId.isErr()) {
      return err(validatedCastId.error);
    }

    return ResultAsync.fromPromise(this._reactionStore.getReactionAdd(fid, type, cast), (e) => e as HubError);
  }

  async getReactionsByFid(
    fid: number,
    type?: protobufs.ReactionType,
    pageOptions: PageOptions = {}
  ): HubAsyncResult<MessagesPage<protobufs.ReactionAddMessage>> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(
      this._reactionStore.getReactionAddsByFid(fid, type, pageOptions),
      (e) => e as HubError
    );
  }

  async getReactionsByCast(
    castId: protobufs.CastId,
    type?: protobufs.ReactionType,
    pageOptions: PageOptions = {}
  ): HubAsyncResult<MessagesPage<protobufs.ReactionAddMessage>> {
    const validatedCastId = validations.validateCastId(castId);
    if (validatedCastId.isErr()) {
      return err(validatedCastId.error);
    }

    return ResultAsync.fromPromise(
      this._reactionStore.getReactionsByTargetCast(castId, type, pageOptions),
      (e) => e as HubError
    );
  }

  async getAllReactionMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): HubAsyncResult<MessagesPage<protobufs.ReactionAddMessage | protobufs.ReactionRemoveMessage>> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(
      this._reactionStore.getAllReactionMessagesByFid(fid, pageOptions),
      (e) => e as HubError
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                          Verification Store Methods                        */
  /* -------------------------------------------------------------------------- */

  async getVerification(fid: number, address: Uint8Array): HubAsyncResult<protobufs.VerificationAddEthAddressMessage> {
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

  async getVerificationsByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): HubAsyncResult<MessagesPage<protobufs.VerificationAddEthAddressMessage>> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(
      this._verificationStore.getVerificationAddsByFid(fid, pageOptions),
      (e) => e as HubError
    );
  }

  async getAllVerificationMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): HubAsyncResult<MessagesPage<protobufs.VerificationAddEthAddressMessage | protobufs.VerificationRemoveMessage>> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(
      this._verificationStore.getAllVerificationMessagesByFid(fid, pageOptions),
      (e) => e as HubError
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                              Signer Store Methods                          */
  /* -------------------------------------------------------------------------- */

  async getSigner(fid: number, signerPubKey: Uint8Array): HubAsyncResult<protobufs.SignerAddMessage> {
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

  async getSignersByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): HubAsyncResult<MessagesPage<protobufs.SignerAddMessage>> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._signerStore.getSignerAddsByFid(fid, pageOptions), (e) => e as HubError);
  }

  async getIdRegistryEvent(fid: number): HubAsyncResult<protobufs.IdRegistryEvent> {
    return ResultAsync.fromPromise(this._signerStore.getIdRegistryEvent(fid), (e) => e as HubError);
  }

  async getFids(pageOptions: PageOptions = {}): HubAsyncResult<{
    fids: number[];
    nextPageToken: Uint8Array | undefined;
  }> {
    return ResultAsync.fromPromise(this._signerStore.getFids(pageOptions), (e) => e as HubError);
  }

  async getAllSignerMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): HubAsyncResult<MessagesPage<protobufs.SignerAddMessage | protobufs.SignerRemoveMessage>> {
    return ResultAsync.fromPromise(this._signerStore.getAllSignerMessagesByFid(fid, pageOptions), (e) => e as HubError);
  }

  /* -------------------------------------------------------------------------- */
  /*                           User Data Store Methods                          */
  /* -------------------------------------------------------------------------- */

  async getUserData(fid: number, type: protobufs.UserDataType): HubAsyncResult<protobufs.UserDataAddMessage> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._userDataStore.getUserDataAdd(fid, type), (e) => e as HubError);
  }

  async getUserDataByFid(
    fid: number,
    pageOptions: PageOptions = {}
  ): HubAsyncResult<MessagesPage<protobufs.UserDataAddMessage>> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._userDataStore.getUserDataAddsByFid(fid, pageOptions), (e) => e as HubError);
  }

  async getNameRegistryEvent(fname: Uint8Array): HubAsyncResult<protobufs.NameRegistryEvent> {
    const validatedFname = validations.validateFname(fname);
    if (validatedFname.isErr()) {
      return err(validatedFname.error);
    }

    return ResultAsync.fromPromise(this._userDataStore.getNameRegistryEvent(fname), (e) => e as HubError);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async validateMessage(message: protobufs.Message): HubAsyncResult<protobufs.Message> {
    // 1. Ensure message data is present
    if (!message || !message.data) {
      return err(new HubError('bad_request.validation_failure', 'message data is missing'));
    }

    // 2. Check the network
    if (message.data.network !== this._network) {
      return err(
        new HubError(
          'bad_request.validation_failure',
          `incorrect network: ${message.data.network} (expected: ${this._network})`
        )
      );
    }

    // 3. Check that the user has a custody address
    const custodyEvent = await this.getIdRegistryEvent(message.data.fid);

    if (custodyEvent.isErr()) {
      return err(new HubError('bad_request.validation_failure', `unknown fid: ${message.data.fid}`));
    }

    // 4. Check that the signer is valid
    if (protobufs.isSignerAddMessage(message) || protobufs.isSignerRemoveMessage(message)) {
      if (bytesCompare(message.signer, custodyEvent.value.to) !== 0) {
        return err(new HubError('bad_request.validation_failure', 'invalid signer'));
      }
    } else {
      const signerResult = await ResultAsync.fromPromise(
        this._signerStore.getSignerAdd(message.data.fid, message.signer),
        (e) => e
      );
      if (signerResult.isErr()) {
        return err(new HubError('bad_request.validation_failure', 'invalid signer'));
      }
    }

    // 5. For fname add UserDataAdd messages, check that the user actually owns the fname
    if (protobufs.isUserDataAddMessage(message) && message.data.userDataBody.type === protobufs.UserDataType.FNAME) {
      // For fname messages, check if the user actually owns the fname.
      const fnameBytes = utf8StringToBytes(message.data.userDataBody.value);
      if (fnameBytes.isErr()) {
        return err(fnameBytes.error);
      }

      // Users are allowed to set fname = '' to remove their fname, so check to see if fname is set
      // before validating the custody address
      if (fnameBytes.value.length > 0) {
        // Get the NameRegistryEvent for the fname
        const fnameEvent = (await this.getNameRegistryEvent(fnameBytes.value)).mapErr((e) =>
          e.errCode === 'not_found' ? new HubError('bad_request.validation_failure', 'fname is not registered') : e
        );
        if (fnameEvent.isErr()) {
          return err(fnameEvent.error);
        }

        // Check that the custody address for the fname and fid are the same
        if (bytesCompare(custodyEvent.value.to, fnameEvent.value.to) !== 0) {
          return err(
            new HubError('bad_request.validation_failure', 'fname custody address does not match fid custody address')
          );
        }
      }
    }

    // 6. Check message body and envelope
    return validations.validateMessage(message);
  }
}

export default Engine;
