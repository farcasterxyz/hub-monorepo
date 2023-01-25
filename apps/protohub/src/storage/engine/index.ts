import * as protobufs from '@farcaster/protobufs';
import { bytesCompare, HubAsyncResult, HubError, HubResult, validations } from '@farcaster/protoutils';
import { err, ok, ResultAsync } from 'neverthrow';
import { typeToSetPostfix } from '~/storage/db/message';
import RocksDB from '~/storage/db/rocksdb';
import { UserPostfix } from '~/storage/db/types';
import AmpStore from '~/storage/stores/ampStore';
import CastStore from '~/storage/stores/castStore';
import ReactionStore from '~/storage/stores/reactionStore';
import SignerStore from '~/storage/stores/signerStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';

class Engine {
  public eventHandler: StoreEventHandler;

  private _db: RocksDB;
  private _network: protobufs.FarcasterNetwork;

  private _reactionStore: ReactionStore;
  private _signerStore: SignerStore;
  private _castStore: CastStore;
  private _ampStore: AmpStore;

  constructor(db: RocksDB, network: protobufs.FarcasterNetwork) {
    this.eventHandler = new StoreEventHandler();

    this._db = db;
    this._network = network;

    this._reactionStore = new ReactionStore(db, this.eventHandler);
    this._signerStore = new SignerStore(db, this.eventHandler);
    this._castStore = new CastStore(db, this.eventHandler);
    this._ampStore = new AmpStore(db, this.eventHandler);
  }

  async mergeMessages(messages: protobufs.Message[]): Promise<Array<HubResult<void>>> {
    return Promise.all(messages.map((message) => this.mergeMessage(message)));
  }

  async mergeMessage(message: protobufs.Message): HubAsyncResult<void> {
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
    } else if (setPostfix === UserPostfix.AmpMessage) {
      return ResultAsync.fromPromise(this._ampStore.merge(message), (e) => e as HubError);
    } else {
      return err(new HubError('bad_request.validation_failure', 'invalid message type'));
    }
  }

  async mergeIdRegistryEvent(event: protobufs.IdRegistryEvent): HubAsyncResult<void> {
    // TODO: validate event
    if (
      event.type === protobufs.IdRegistryEventType.ID_REGISTRY_EVENT_TYPE_REGISTER ||
      event.type === protobufs.IdRegistryEventType.ID_REGISTRY_EVENT_TYPE_TRANSFER
    ) {
      return ResultAsync.fromPromise(this._signerStore.mergeIdRegistryEvent(event), (e) => e as HubError);
    } else {
      return err(new HubError('bad_request.validation_failure', 'invalid event type'));
    }
  }

  // async mergeNameRegistryEvent(event: NameRegistryEventModel): HubAsyncResult<void> {
  //   if (
  //     event.type() === flatbuffers.NameRegistryEventType.NameRegistryTransfer ||
  //     event.type() === flatbuffers.NameRegistryEventType.NameRegistryRenew
  //   ) {
  //     return ResultAsync.fromPromise(this._userDataStore.mergeNameRegistryEvent(event), (e) => e as HubError);
  //   }

  //   return err(new HubError('bad_request.validation_failure', 'invalid event type'));
  // }

  async revokeMessagesBySigner(fid: number, signer: Uint8Array): HubAsyncResult<void> {
    await this._castStore.revokeMessagesBySigner(fid, signer);
    await this._ampStore.revokeMessagesBySigner(fid, signer);
    await this._reactionStore.revokeMessagesBySigner(fid, signer);
    // await this._verificationStore.revokeMessagesBySigner(fid, signer);
    // await this._userDataStore.revokeMessagesBySigner(fid, signer);
    await this._signerStore.revokeMessagesBySigner(fid, signer);

    return ok(undefined);
  }

  async pruneMessages(fid: number): HubAsyncResult<void> {
    await this._castStore.pruneMessages(fid);
    await this._ampStore.pruneMessages(fid);
    await this._reactionStore.pruneMessages(fid);
    // await this._verificationStore.pruneMessages(fid);
    // await this._userDataStore.pruneMessages(fid);
    await this._signerStore.pruneMessages(fid);

    return ok(undefined);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Cast Store Methods                             */
  /* -------------------------------------------------------------------------- */

  async getCast(fid: number, hash: Uint8Array): HubAsyncResult<protobufs.CastAddMessage> {
    return ResultAsync.fromPromise(this._castStore.getCastAdd(fid, hash), (e) => e as HubError);
  }

  async getCastsByFid(fid: number): HubAsyncResult<protobufs.CastAddMessage[]> {
    return ResultAsync.fromPromise(this._castStore.getCastAddsByFid(fid), (e) => e as HubError);
  }

  async getCastsByParent(parentId: protobufs.CastId): HubAsyncResult<protobufs.CastAddMessage[]> {
    return ResultAsync.fromPromise(this._castStore.getCastsByParent(parentId), (e) => e as HubError);
  }

  async getCastsByMention(mentionFid: number): HubAsyncResult<protobufs.CastAddMessage[]> {
    return ResultAsync.fromPromise(this._castStore.getCastsByMention(mentionFid), (e) => e as HubError);
  }

  async getAllCastMessagesByFid(
    fid: number
  ): HubAsyncResult<(protobufs.CastAddMessage | protobufs.CastRemoveMessage)[]> {
    const adds = await ResultAsync.fromPromise(this._castStore.getCastAddsByFid(fid), (e) => e as HubError);
    if (adds.isErr()) {
      return err(adds.error);
    }

    const removes = await ResultAsync.fromPromise(this._castStore.getCastRemovesByFid(fid), (e) => e as HubError);
    if (removes.isErr()) {
      return err(removes.error);
    }

    return ok([...adds.value, ...removes.value]);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Amp Store Methods                           */
  /* -------------------------------------------------------------------------- */

  async getAmp(fid: number, targetFid: number): HubAsyncResult<protobufs.AmpAddMessage> {
    return ResultAsync.fromPromise(this._ampStore.getAmpAdd(fid, targetFid), (e) => e as HubError);
  }

  async getAmpsByFid(fid: number): HubAsyncResult<protobufs.AmpAddMessage[]> {
    return ResultAsync.fromPromise(this._ampStore.getAmpAddsByFid(fid), (e) => e as HubError);
  }

  async getAmpsByTargetFid(targetFid: number): HubAsyncResult<protobufs.AmpAddMessage[]> {
    return ResultAsync.fromPromise(this._ampStore.getAmpsByTargetFid(targetFid), (e) => e as HubError);
  }

  async getAllAmpMessagesByFid(fid: number): HubAsyncResult<(protobufs.AmpAddMessage | protobufs.AmpRemoveMessage)[]> {
    const adds = await ResultAsync.fromPromise(this._ampStore.getAmpAddsByFid(fid), (e) => e as HubError);
    if (adds.isErr()) {
      return err(adds.error);
    }

    const removes = await ResultAsync.fromPromise(this._ampStore.getAmpRemovesByFid(fid), (e) => e as HubError);
    if (removes.isErr()) {
      return err(removes.error);
    }

    return ok([...adds.value, ...removes.value]);
  }

  /* -------------------------------------------------------------------------- */
  /*                            Reaction Store Methods                          */
  /* -------------------------------------------------------------------------- */

  async getReaction(
    fid: number,
    type: protobufs.ReactionType,
    cast: protobufs.CastId
  ): HubAsyncResult<protobufs.ReactionAddMessage> {
    return ResultAsync.fromPromise(this._reactionStore.getReactionAdd(fid, type, cast), (e) => e as HubError);
  }

  async getReactionsByFid(fid: number, type?: protobufs.ReactionType): HubAsyncResult<protobufs.ReactionAddMessage[]> {
    return ResultAsync.fromPromise(this._reactionStore.getReactionAddsByFid(fid, type), (e) => e as HubError);
  }

  async getReactionsByCast(
    castId: protobufs.CastId,
    type?: protobufs.ReactionType
  ): HubAsyncResult<protobufs.ReactionAddMessage[]> {
    return ResultAsync.fromPromise(this._reactionStore.getReactionsByTargetCast(castId, type), (e) => e as HubError);
  }

  async getAllReactionMessagesByFid(
    fid: number
  ): HubAsyncResult<(protobufs.ReactionAddMessage | protobufs.ReactionRemoveMessage)[]> {
    const adds = await ResultAsync.fromPromise(this._reactionStore.getReactionAddsByFid(fid), (e) => e as HubError);
    if (adds.isErr()) {
      return err(adds.error);
    }

    const removes = await ResultAsync.fromPromise(
      this._reactionStore.getReactionRemovesByFid(fid),
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

  // async getVerification(fid: Uint8Array, address: Uint8Array): HubAsyncResult<types.VerificationAddEthAddressModel> {
  //   const validatedFid = validations.validateFid(fid);
  //   if (validatedFid.isErr()) {
  //     return err(validatedFid.error);
  //   }

  //   const validatedAddress = validations.validateEthAddress(address);
  //   if (validatedAddress.isErr()) {
  //     return err(validatedAddress.error);
  //   }

  //   return ResultAsync.fromPromise(this._verificationStore.getVerificationAdd(fid, address), (e) => e as HubError);
  // }

  // async getVerificationsByFid(fid: Uint8Array): HubAsyncResult<types.VerificationAddEthAddressModel[]> {
  //   const validatedFid = validations.validateFid(fid);
  //   if (validatedFid.isErr()) {
  //     return err(validatedFid.error);
  //   }

  //   return ResultAsync.fromPromise(this._verificationStore.getVerificationAddsByUser(fid), (e) => e as HubError);
  // }

  // async getAllVerificationMessagesByFid(
  //   fid: Uint8Array
  // ): HubAsyncResult<(types.VerificationAddEthAddressModel | types.VerificationRemoveModel)[]> {
  //   const adds = await ResultAsync.fromPromise(
  //     this._verificationStore.getVerificationAddsByUser(fid),
  //     (e) => e as HubError
  //   );
  //   if (adds.isErr()) {
  //     return err(adds.error);
  //   }

  //   const removes = await ResultAsync.fromPromise(
  //     this._verificationStore.getVerificationRemovesByUser(fid),
  //     (e) => e as HubError
  //   );
  //   if (removes.isErr()) {
  //     return err(removes.error);
  //   }

  //   return ok([...adds.value, ...removes.value]);
  // }

  /* -------------------------------------------------------------------------- */
  /*                              Signer Store Methods                          */
  /* -------------------------------------------------------------------------- */

  async getSigner(fid: number, signerPubKey: Uint8Array): HubAsyncResult<protobufs.SignerAddMessage> {
    return ResultAsync.fromPromise(this._signerStore.getSignerAdd(fid, signerPubKey), (e) => e as HubError);
  }

  async getSignersByFid(fid: number): HubAsyncResult<protobufs.SignerAddMessage[]> {
    return ResultAsync.fromPromise(this._signerStore.getSignerAddsByFid(fid), (e) => e as HubError);
  }

  async getIdRegistryEvent(fid: number): HubAsyncResult<protobufs.IdRegistryEvent> {
    return ResultAsync.fromPromise(this._signerStore.getIdRegistryEvent(fid), (e) => e as HubError);
  }

  async getFids(): HubAsyncResult<number[]> {
    return ResultAsync.fromPromise(this._signerStore.getFids(), (e) => e as HubError);
  }

  async getAllSignerMessagesByFid(
    fid: number
  ): HubAsyncResult<(protobufs.SignerAddMessage | protobufs.SignerRemoveMessage)[]> {
    const adds = await ResultAsync.fromPromise(this._signerStore.getSignerAddsByFid(fid), (e) => e as HubError);
    if (adds.isErr()) {
      return err(adds.error);
    }

    const removes = await ResultAsync.fromPromise(this._signerStore.getSignerRemovesByFid(fid), (e) => e as HubError);
    if (removes.isErr()) {
      return err(removes.error);
    }

    return ok([...adds.value, ...removes.value]);
  }

  /* -------------------------------------------------------------------------- */
  /*                           User Data Store Methods                          */
  /* -------------------------------------------------------------------------- */

  // async getUserData(fid: Uint8Array, type: flatbuffers.UserDataType): HubAsyncResult<types.UserDataAddModel> {
  //   const validatedFid = validations.validateFid(fid);
  //   if (validatedFid.isErr()) {
  //     return err(validatedFid.error);
  //   }

  //   return ResultAsync.fromPromise(this._userDataStore.getUserDataAdd(fid, type), (e) => e as HubError);
  // }

  // async getUserDataByFid(fid: Uint8Array): HubAsyncResult<types.UserDataAddModel[]> {
  //   const validatedFid = validations.validateFid(fid);
  //   if (validatedFid.isErr()) {
  //     return err(validatedFid.error);
  //   }

  //   return ResultAsync.fromPromise(this._userDataStore.getUserDataAddsByUser(fid), (e) => e as HubError);
  // }

  // async getNameRegistryEvent(fname: Uint8Array): HubAsyncResult<NameRegistryEventModel> {
  //   return ResultAsync.fromPromise(this._userDataStore.getNameRegistryEvent(fname), (e) => e as HubError);
  // }

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
    const custodyEvent = await ResultAsync.fromPromise(
      this._signerStore.getIdRegistryEvent(message.data.fid),
      () => undefined
    );

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
    // if (isUserDataAdd(message) && message.body().type() == flatbuffers.UserDataType.Fname) {
    //   // For fname messages, check if the user actually owns the fname.
    //   const fnameBytes = utf8StringToBytes(message.body().value() ?? '');
    //   if (fnameBytes.isErr()) {
    //     return err(fnameBytes.error);
    //   }

    //   // Users are allowed to set fname = '' to remove their fname, so check to see if fname is set
    //   // before validating the custody address
    //   if (fnameBytes.value.length > 0) {
    //     // The custody address of the fid and fname must be the same
    //     const fidCustodyAddress = await ResultAsync.fromPromise(
    //       IdRegistryEventModel.get(this._db, message.fid()).then((event) => event?.to()),
    //       (e) => e as HubError
    //     );
    //     if (fidCustodyAddress.isErr()) {
    //       return err(fidCustodyAddress.error);
    //     }

    //     const fnameCustodyAddress = await ResultAsync.fromPromise(
    //       NameRegistryEventModel.get(this._db, fnameBytes.value).then((event) => event?.to()),
    //       (e) => e as HubError
    //     ).mapErr((e) =>
    //       e.errCode === 'not_found' ? new HubError('bad_request.validation_failure', 'fname is not registered') : e
    //     );
    //     if (fnameCustodyAddress.isErr()) {
    //       return err(fnameCustodyAddress.error);
    //     }

    //     if (bytesCompare(fidCustodyAddress.value, fnameCustodyAddress.value) !== 0) {
    //       return err(
    //         new HubError('bad_request.validation_failure', 'fname custody address does not match fid custody address')
    //       );
    //     }
    //   }
    // }

    // 6. Check message body and envelope
    return validations.validateMessage(message);
  }
}

export default Engine;
