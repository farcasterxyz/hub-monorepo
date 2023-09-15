import {
  bytesCompare,
  bytesToHexString,
  bytesToUtf8String,
  CastAddMessage,
  CastId,
  CastRemoveMessage,
  FarcasterNetwork,
  getStoreLimits,
  hexStringToBytes,
  HubAsyncResult,
  HubError,
  HubEvent,
  HubResult,
  isSignerOnChainEvent,
  isUserDataAddMessage,
  isUsernameProofMessage,
  LinkAddMessage,
  LinkRemoveMessage,
  MergeOnChainEventHubEvent,
  MergeUsernameProofHubEvent,
  Message,
  OnChainEvent,
  OnChainEventResponse,
  OnChainEventType,
  ReactionAddMessage,
  ReactionRemoveMessage,
  ReactionType,
  RevokeMessagesBySignerJobPayload,
  SignerEventType,
  SignerOnChainEvent,
  StorageLimitsResponse,
  UserDataAddMessage,
  UserDataType,
  UserNameProof,
  UserNameType,
  utf8StringToBytes,
  validations,
  VerificationAddEthAddressMessage,
  VerificationRemoveMessage,
} from "@farcaster/hub-nodejs";
import { err, ok, ResultAsync } from "neverthrow";
import fs from "fs";
import { Worker } from "worker_threads";
import { getMessage, getMessagesBySignerIterator, typeToSetPostfix } from "../db/message.js";
import RocksDB from "../db/rocksdb.js";
import { TSHASH_LENGTH, UserPostfix } from "../db/types.js";
import CastStore from "../stores/castStore.js";
import LinkStore from "../stores/linkStore.js";
import ReactionStore from "../stores/reactionStore.js";
import StoreEventHandler from "../stores/storeEventHandler.js";
import { MessagesPage, PageOptions } from "../stores/types.js";
import UserDataStore from "../stores/userDataStore.js";
import VerificationStore from "../stores/verificationStore.js";
import { logger } from "../../utils/logger.js";
import { RevokeMessagesBySignerJobQueue, RevokeMessagesBySignerJobWorker } from "../jobs/revokeMessagesBySignerJob.js";
import { ensureAboveTargetFarcasterVersion } from "../../utils/versions.js";
import { PublicClient } from "viem";
import { normalize } from "viem/ens";
import UsernameProofStore from "../stores/usernameProofStore.js";
import OnChainEventStore from "../stores/onChainEventStore.js";
import { isRateLimitedByKey, consumeRateLimitByKey, getRateLimiterForTotalMessages } from "../../utils/rateLimits.js";
import { nativeValidationMethods } from "../../rustfunctions.js";
import { RateLimiterAbstract } from "rate-limiter-flexible";

const log = logger.child({
  component: "Engine",
});

class Engine {
  public eventHandler: StoreEventHandler;

  private _db: RocksDB;
  private _network: FarcasterNetwork;
  private _publicClient: PublicClient | undefined;

  private _linkStore: LinkStore;
  private _reactionStore: ReactionStore;
  private _castStore: CastStore;
  private _userDataStore: UserDataStore;
  private _verificationStore: VerificationStore;
  private _onchainEventsStore: OnChainEventStore;
  private _usernameProofStore: UsernameProofStore;

  private _validationWorker: Worker | undefined;

  private _validationWorkerJobId = 0;
  private _validationWorkerPromiseMap = new Map<number, (resolve: HubResult<Message>) => void>();

  private _revokeSignerQueue: RevokeMessagesBySignerJobQueue;
  private _revokeSignerWorker: RevokeMessagesBySignerJobWorker;

  private _totalPruneSize: number;

  constructor(db: RocksDB, network: FarcasterNetwork, eventHandler?: StoreEventHandler, publicClient?: PublicClient) {
    this._db = db;
    this._network = network;
    this._publicClient = publicClient;

    this.eventHandler = eventHandler ?? new StoreEventHandler(db);

    this._linkStore = new LinkStore(db, this.eventHandler);
    this._reactionStore = new ReactionStore(db, this.eventHandler);
    this._castStore = new CastStore(db, this.eventHandler);
    this._userDataStore = new UserDataStore(db, this.eventHandler);
    this._verificationStore = new VerificationStore(db, this.eventHandler);
    this._onchainEventsStore = new OnChainEventStore(db, this.eventHandler);
    this._usernameProofStore = new UsernameProofStore(db, this.eventHandler);

    // Calculate total storage available per unit of store. Note that OnChainEventStore
    // is not included in this calculation because it is not pruned.
    this._totalPruneSize =
      this._linkStore.pruneSizeLimit +
      this._reactionStore.pruneSizeLimit +
      this._castStore.pruneSizeLimit +
      this._userDataStore.pruneSizeLimit +
      this._verificationStore.pruneSizeLimit +
      this._usernameProofStore.pruneSizeLimit;

    log.info({ totalPruneSize: this._totalPruneSize }, "total default storage limit size");

    this._revokeSignerQueue = new RevokeMessagesBySignerJobQueue(db);
    this._revokeSignerWorker = new RevokeMessagesBySignerJobWorker(this._revokeSignerQueue, db, this);

    this.handleMergeUsernameProofEvent = this.handleMergeUsernameProofEvent.bind(this);
    this.handleMergeOnChainEvent = this.handleMergeOnChainEvent.bind(this);
  }

  async start(): Promise<void> {
    log.info("starting engine");

    this._revokeSignerWorker.start();

    if (!this._validationWorker) {
      const workerPath = "./build/storage/engine/validation.worker.js";
      try {
        if (fs.existsSync(workerPath)) {
          this._validationWorker = new Worker(workerPath);
          log.info({ workerPath }, "created validation worker thread");

          this._validationWorker.on("message", (data) => {
            const { id, message, errCode, errMessage } = data;
            const resolve = this._validationWorkerPromiseMap.get(id);

            if (resolve) {
              this._validationWorkerPromiseMap.delete(id);
              if (message) {
                resolve(ok(message));
              } else {
                resolve(err(new HubError(errCode, errMessage)));
              }
            } else {
              log.warn({ id }, "validation worker promise.response not found");
            }
          });
        } else {
          log.warn({ workerPath }, "validation.worker.js not found, falling back to main thread");
        }
      } catch (e) {
        log.warn({ workerPath, e }, "failed to create validation worker, falling back to main thread");
      }
    }

    this.eventHandler.on("mergeUsernameProofEvent", this.handleMergeUsernameProofEvent);
    this.eventHandler.on("mergeOnChainEvent", this.handleMergeOnChainEvent);

    await this.eventHandler.syncCache();
    log.info("engine started");
  }

  async stop(): Promise<void> {
    log.info("stopping engine");
    this.eventHandler.off("mergeUsernameProofEvent", this.handleMergeUsernameProofEvent);
    this.eventHandler.off("mergeOnChainEvent", this.handleMergeOnChainEvent);

    this._revokeSignerWorker.start();

    if (this._validationWorker) {
      await this._validationWorker.terminate();
      this._validationWorker = undefined;
      log.info("validation worker thread terminated");
    }
    log.info("engine stopped");
  }

  getDb(): RocksDB {
    return this._db;
  }

  async mergeMessages(messages: Message[]): Promise<Array<HubResult<number>>> {
    return Promise.all(messages.map((message) => this.mergeMessage(message)));
  }

  async mergeMessage(message: Message): HubAsyncResult<number> {
    const validatedMessage = await this.validateMessage(message);
    if (validatedMessage.isErr()) {
      return err(validatedMessage.error);
    }

    // Extract the FID that this message was signed by
    const fid = message.data?.fid ?? 0;
    const storageUnits = await this.eventHandler.getCurrentStorageUnitsForFid(fid);
    let limiter: RateLimiterAbstract | undefined;

    if (storageUnits.isOk()) {
      if (storageUnits.value === 0) {
        return err(new HubError("bad_request.prunable", "no storage"));
      }
      // We rate limit the number of messages that can be merged per FID
      limiter = getRateLimiterForTotalMessages(storageUnits.value * this._totalPruneSize);
      const isRateLimited = await isRateLimitedByKey(`${fid}`, limiter);
      if (isRateLimited) {
        log.warn({ fid }, "rate limit exceeded for FID");
        return err(new HubError("unavailable", `rate limit exceeded for FID ${fid}`));
      }
    }

    const mergeResult = await this.mergeMessageToStore(message);
    if (mergeResult.isOk() && limiter) {
      consumeRateLimitByKey(`${fid}`, limiter);
    }

    return mergeResult;
  }

  async mergeMessageToStore(message: Message): HubAsyncResult<number> {
    // biome-ignore lint/style/noNonNullAssertion: legacy code, avoid using ignore for new code
    const setPostfix = typeToSetPostfix(message.data!.type);

    switch (setPostfix) {
      case UserPostfix.LinkMessage: {
        const versionCheck = ensureAboveTargetFarcasterVersion("2023.4.19");
        if (versionCheck.isErr()) {
          return err(versionCheck.error);
        }

        return ResultAsync.fromPromise(this._linkStore.merge(message), (e) => e as HubError);
      }
      case UserPostfix.ReactionMessage: {
        return ResultAsync.fromPromise(this._reactionStore.merge(message), (e) => e as HubError);
      }
      case UserPostfix.CastMessage: {
        return ResultAsync.fromPromise(this._castStore.merge(message), (e) => e as HubError);
      }
      case UserPostfix.UserDataMessage: {
        return ResultAsync.fromPromise(this._userDataStore.merge(message), (e) => e as HubError);
      }
      case UserPostfix.VerificationMessage: {
        return ResultAsync.fromPromise(this._verificationStore.merge(message), (e) => e as HubError);
      }
      case UserPostfix.UsernameProofMessage: {
        return ResultAsync.fromPromise(this._usernameProofStore.merge(message), (e) => e as HubError);
      }
      default: {
        return err(new HubError("bad_request.validation_failure", "invalid message type"));
      }
    }
  }

  async mergeOnChainEvent(event: OnChainEvent): HubAsyncResult<number> {
    const eventResult = await this.validateOnChainEvent(event);
    if (eventResult.isErr()) {
      return err(eventResult.error);
    }
    const mergeResult = await ResultAsync.fromPromise(
      this._onchainEventsStore.mergeOnChainEvent(event),
      (e) => e as HubError,
    );
    return mergeResult;
  }

  async mergeUserNameProof(usernameProof: UserNameProof): HubAsyncResult<number> {
    // TODO: Validate signature here instead of the fname event provider
    return ResultAsync.fromPromise(this._userDataStore.mergeUserNameProof(usernameProof), (e) => e as HubError);
  }

  async revokeMessagesBySigner(fid: number, signer: Uint8Array): HubAsyncResult<void> {
    const signerHex = bytesToHexString(signer);
    if (signerHex.isErr()) {
      return err(signerHex.error);
    }

    let revokedCount = 0;

    const iterator = getMessagesBySignerIterator(this._db, fid, signer);

    const revokeMessageByKey = async (key: Buffer): HubAsyncResult<number | undefined> => {
      const length = key.length;
      const type = key.readUint8(length - TSHASH_LENGTH - 1);
      const setPostfix = typeToSetPostfix(type);
      const tsHash = Uint8Array.from(key.subarray(length - TSHASH_LENGTH));
      const message = await ResultAsync.fromPromise(
        getMessage(this._db, fid, setPostfix, tsHash),
        (e) => e as HubError,
      );
      if (message.isErr()) {
        return err(message.error);
      }

      switch (setPostfix) {
        case UserPostfix.LinkMessage: {
          return this._linkStore.revoke(message.value);
        }
        case UserPostfix.ReactionMessage: {
          return this._reactionStore.revoke(message.value);
        }
        case UserPostfix.CastMessage: {
          return this._castStore.revoke(message.value);
        }
        case UserPostfix.UserDataMessage: {
          return this._userDataStore.revoke(message.value);
        }
        case UserPostfix.VerificationMessage: {
          return this._verificationStore.revoke(message.value);
        }
        case UserPostfix.UsernameProofMessage: {
          return this._usernameProofStore.revoke(message.value);
        }
        default: {
          return err(new HubError("bad_request.invalid_param", "invalid message type"));
        }
      }
    };

    for await (const [key] of iterator) {
      const revokeResult = await revokeMessageByKey(key as Buffer);
      revokeResult.match(
        () => {
          revokedCount += 1;
        },
        (e) => {
          log.error(
            { errCode: e.errCode },
            `error revoking message from signer ${signerHex.value} and fid ${fid}: ${e.message}`,
          );
        },
      );
    }

    if (revokedCount > 0) {
      log.info(`revoked ${revokedCount} messages from ${signerHex.value} and fid ${fid}`);
    }

    return ok(undefined);
  }

  async pruneMessages(fid: number): HubAsyncResult<void> {
    const logPruneResult = (result: HubResult<number[]>, store: string): void => {
      result.match(
        (ids) => {
          if (ids.length > 0) {
            log.info(`pruned ${ids.length} ${store} messages for fid ${fid}`);
          }
        },
        (e) => {
          log.error({ errCode: e.errCode }, `error pruning ${store} messages for fid ${fid}: ${e.message}`);
        },
      );
    };

    const castResult = await this._castStore.pruneMessages(fid);
    logPruneResult(castResult, "cast");

    const reactionResult = await this._reactionStore.pruneMessages(fid);
    logPruneResult(reactionResult, "reaction");

    const verificationResult = await this._verificationStore.pruneMessages(fid);
    logPruneResult(verificationResult, "verification");

    const userDataResult = await this._userDataStore.pruneMessages(fid);
    logPruneResult(userDataResult, "user data");

    const linkResult = await this._linkStore.pruneMessages(fid);
    logPruneResult(linkResult, "link");

    return ok(undefined);
  }

  /** revoke message if it is not valid */
  async validateOrRevokeMessage(message: Message): HubAsyncResult<number | undefined> {
    const isValid = await this.validateMessage(message);

    if (isValid.isErr() && message.data) {
      const setPostfix = typeToSetPostfix(message.data.type);

      switch (setPostfix) {
        case UserPostfix.LinkMessage: {
          return this._linkStore.revoke(message);
        }
        case UserPostfix.ReactionMessage: {
          return this._reactionStore.revoke(message);
        }
        case UserPostfix.CastMessage: {
          return this._castStore.revoke(message);
        }
        case UserPostfix.UserDataMessage: {
          return this._userDataStore.revoke(message);
        }
        case UserPostfix.VerificationMessage: {
          return this._verificationStore.revoke(message);
        }
        case UserPostfix.UsernameProofMessage: {
          if (isValid.error.errCode === "unavailable.network_failure") {
            return err(isValid.error);
          } else {
            return this._usernameProofStore.revoke(message);
          }
        }
        default: {
          return err(new HubError("bad_request.invalid_param", "invalid message type"));
        }
      }
    }

    return ok(undefined);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Event Methods                                  */
  /* -------------------------------------------------------------------------- */

  async getEvent(id: number): HubAsyncResult<HubEvent> {
    return this.eventHandler.getEvent(id);
  }

  /* -------------------------------------------------------------------------- */
  /*                             Cast Store Methods                             */
  /* -------------------------------------------------------------------------- */

  async getCast(fid: number, hash: Uint8Array): HubAsyncResult<CastAddMessage> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._castStore.getCastAdd(fid, hash), (e) => e as HubError);
  }

  async getCastsByFid(fid: number, pageOptions: PageOptions = {}): HubAsyncResult<MessagesPage<CastAddMessage>> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._castStore.getCastAddsByFid(fid, pageOptions), (e) => e as HubError);
  }

  async getCastsByParent(
    parent: CastId | string,
    pageOptions: PageOptions = {},
  ): HubAsyncResult<MessagesPage<CastAddMessage>> {
    const validatedParent = validations.validateParent(parent);
    if (validatedParent.isErr()) {
      return err(validatedParent.error);
    }

    return ResultAsync.fromPromise(this._castStore.getCastsByParent(parent, pageOptions), (e) => e as HubError);
  }

  async getCastsByMention(
    mentionFid: number,
    pageOptions: PageOptions = {},
  ): HubAsyncResult<MessagesPage<CastAddMessage>> {
    const validatedFid = validations.validateFid(mentionFid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._castStore.getCastsByMention(mentionFid, pageOptions), (e) => e as HubError);
  }

  async getAllCastMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {},
  ): HubAsyncResult<MessagesPage<CastAddMessage | CastRemoveMessage>> {
    return ResultAsync.fromPromise(this._castStore.getAllCastMessagesByFid(fid, pageOptions), (e) => e as HubError);
  }

  /* -------------------------------------------------------------------------- */
  /*                            Reaction Store Methods                          */
  /* -------------------------------------------------------------------------- */

  async getReaction(fid: number, type: ReactionType, target: CastId | string): HubAsyncResult<ReactionAddMessage> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    const validatedTarget = validations.validateTarget(target);
    if (validatedTarget.isErr()) {
      return err(validatedTarget.error);
    }

    return ResultAsync.fromPromise(this._reactionStore.getReactionAdd(fid, type, target), (e) => e as HubError);
  }

  async getReactionsByFid(
    fid: number,
    type?: ReactionType,
    pageOptions: PageOptions = {},
  ): HubAsyncResult<MessagesPage<ReactionAddMessage>> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(
      this._reactionStore.getReactionAddsByFid(fid, type, pageOptions),
      (e) => e as HubError,
    );
  }

  async getReactionsByTarget(
    target: CastId | string,
    type?: ReactionType,
    pageOptions: PageOptions = {},
  ): HubAsyncResult<MessagesPage<ReactionAddMessage>> {
    if (typeof target !== "string") {
      const validatedCastId = validations.validateCastId(target);
      if (validatedCastId.isErr()) {
        return err(validatedCastId.error);
      }
    }

    return ResultAsync.fromPromise(
      this._reactionStore.getReactionsByTarget(target, type, pageOptions),
      (e) => e as HubError,
    );
  }

  async getAllReactionMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {},
  ): HubAsyncResult<MessagesPage<ReactionAddMessage | ReactionRemoveMessage>> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(
      this._reactionStore.getAllReactionMessagesByFid(fid, pageOptions),
      (e) => e as HubError,
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                          Verification Store Methods                        */
  /* -------------------------------------------------------------------------- */

  async getVerification(fid: number, address: Uint8Array): HubAsyncResult<VerificationAddEthAddressMessage> {
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
    pageOptions: PageOptions = {},
  ): HubAsyncResult<MessagesPage<VerificationAddEthAddressMessage>> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(
      this._verificationStore.getVerificationAddsByFid(fid, pageOptions),
      (e) => e as HubError,
    );
  }

  async getAllVerificationMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {},
  ): HubAsyncResult<MessagesPage<VerificationAddEthAddressMessage | VerificationRemoveMessage>> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(
      this._verificationStore.getAllVerificationMessagesByFid(fid, pageOptions),
      (e) => e as HubError,
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                              Signer Store Methods                          */
  /* -------------------------------------------------------------------------- */

  async getActiveSigner(fid: number, signerPubKey: Uint8Array): HubAsyncResult<SignerOnChainEvent> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    const validatedPubKey = validations.validateEd25519PublicKey(signerPubKey);
    if (validatedPubKey.isErr()) {
      return err(validatedPubKey.error);
    }

    return ResultAsync.fromPromise(this._onchainEventsStore.getActiveSigner(fid, signerPubKey), (e) => e as HubError);
  }

  async getOnChainSignersByFid(fid: number, pageOptions: PageOptions = {}): HubAsyncResult<OnChainEventResponse> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._onchainEventsStore.getSignersByFid(fid, pageOptions), (e) => e as HubError);
  }

  async getIdRegistryOnChainEvent(fid: number): HubAsyncResult<OnChainEvent> {
    return ResultAsync.fromPromise(this._onchainEventsStore.getIdRegisterEventByFid(fid), (e) => e as HubError);
  }

  async getIdRegistryOnChainEventByAddress(address: Uint8Array): HubAsyncResult<OnChainEvent> {
    return ResultAsync.fromPromise(
      this._onchainEventsStore.getIdRegisterEventByCustodyAddress(address),
      (e) => e as HubError,
    );
  }

  async getFids(pageOptions: PageOptions = {}): HubAsyncResult<{
    fids: number[];
    nextPageToken: Uint8Array | undefined;
  }> {
    return ResultAsync.fromPromise(this._onchainEventsStore.getFids(pageOptions), (e) => e as HubError);
  }

  /* -------------------------------------------------------------------------- */
  /*                           User Data Store Methods                          */
  /* -------------------------------------------------------------------------- */

  async getUserData(fid: number, type: UserDataType): HubAsyncResult<UserDataAddMessage> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._userDataStore.getUserDataAdd(fid, type), (e) => e as HubError);
  }

  async getUserDataByFid(fid: number, pageOptions: PageOptions = {}): HubAsyncResult<MessagesPage<UserDataAddMessage>> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._userDataStore.getUserDataAddsByFid(fid, pageOptions), (e) => e as HubError);
  }

  async getOnChainEvents(type: OnChainEventType, fid: number): HubAsyncResult<OnChainEventResponse> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._onchainEventsStore.getOnChainEvents(type, fid), (e) => e as HubError).map(
      (events) => OnChainEventResponse.create({ events }),
    );
  }

  async getCurrentStorageLimitsByFid(fid: number): HubAsyncResult<StorageLimitsResponse> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    const units = await this.eventHandler.getCurrentStorageUnitsForFid(fid);

    if (units.isErr()) {
      return err(units.error);
    }

    return ok({
      limits: getStoreLimits(units.value),
    });
  }

  async getUserNameProof(name: Uint8Array): HubAsyncResult<UserNameProof> {
    const nameString = bytesToUtf8String(name);
    if (nameString.isErr()) {
      return err(nameString.error);
    }
    if (nameString.value.endsWith(".eth")) {
      const validatedEnsName = validations.validateEnsName(name);
      if (validatedEnsName.isErr()) {
        return err(validatedEnsName.error);
      }
      return ResultAsync.fromPromise(
        this._usernameProofStore.getUsernameProof(name, UserNameType.USERNAME_TYPE_ENS_L1).then((proof) => {
          return proof.data.usernameProofBody;
        }),
        (e) => e as HubError,
      );
    } else {
      const validatedFname = validations.validateFname(name);
      if (validatedFname.isErr()) {
        return err(validatedFname.error);
      }

      return ResultAsync.fromPromise(this._userDataStore.getUserNameProof(name), (e) => e as HubError);
    }
  }

  async getUserNameProofsByFid(fid: number): HubAsyncResult<UserNameProof[]> {
    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }
    const proofs: UserNameProof[] = [];
    const fnameProof = await ResultAsync.fromPromise(
      this._userDataStore.getUserNameProofByFid(fid),
      (e) => e as HubError,
    );
    if (fnameProof.isOk()) {
      proofs.push(fnameProof.value);
    }
    const ensProofs = await ResultAsync.fromPromise(
      this._usernameProofStore.getUsernameProofsByFid(fid),
      (e) => e as HubError,
    );
    if (ensProofs.isOk()) {
      proofs.push(...ensProofs.value);
    }
    return ok(proofs);
  }

  /* -------------------------------------------------------------------------- */
  /*                              Link Store Methods                            */
  /* -------------------------------------------------------------------------- */

  async getLink(fid: number, type: string, target: number): HubAsyncResult<LinkAddMessage> {
    const versionCheck = ensureAboveTargetFarcasterVersion("2023.4.19");
    if (versionCheck.isErr()) {
      return err(versionCheck.error);
    }

    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    const validatedTarget = validations.validateFid(target);
    if (validatedTarget.isErr()) {
      return err(validatedTarget.error);
    }

    return ResultAsync.fromPromise(this._linkStore.getLinkAdd(fid, type, target), (e) => e as HubError);
  }

  async getLinksByFid(
    fid: number,
    type?: string,
    pageOptions: PageOptions = {},
  ): HubAsyncResult<MessagesPage<LinkAddMessage>> {
    const versionCheck = ensureAboveTargetFarcasterVersion("2023.4.19");
    if (versionCheck.isErr()) {
      return err(versionCheck.error);
    }

    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._linkStore.getLinkAddsByFid(fid, type, pageOptions), (e) => e as HubError);
  }

  async getLinksByTarget(
    target: number,
    type?: string,
    pageOptions: PageOptions = {},
  ): HubAsyncResult<MessagesPage<LinkAddMessage>> {
    const versionCheck = ensureAboveTargetFarcasterVersion("2023.4.19");
    if (versionCheck.isErr()) {
      return err(versionCheck.error);
    }

    if (typeof target !== "string") {
      const validatedTargetId = validations.validateFid(target);
      if (validatedTargetId.isErr()) {
        return err(validatedTargetId.error);
      }
    }

    return ResultAsync.fromPromise(this._linkStore.getLinksByTarget(target, type, pageOptions), (e) => e as HubError);
  }

  async getAllLinkMessagesByFid(
    fid: number,
    pageOptions: PageOptions = {},
  ): HubAsyncResult<MessagesPage<LinkAddMessage | LinkRemoveMessage>> {
    const versionCheck = ensureAboveTargetFarcasterVersion("2023.4.19");
    if (versionCheck.isErr()) {
      return err(versionCheck.error);
    }

    const validatedFid = validations.validateFid(fid);
    if (validatedFid.isErr()) {
      return err(validatedFid.error);
    }

    return ResultAsync.fromPromise(this._linkStore.getAllLinkMessagesByFid(fid, pageOptions), (e) => e as HubError);
  }

  /* -------------------------------------------------------------------------- */
  /*                               Private Methods                              */
  /* -------------------------------------------------------------------------- */

  private async validateOnChainEvent(event: OnChainEvent): HubAsyncResult<OnChainEvent> {
    if (!event) {
      return err(new HubError("bad_request.validation_failure", "event is missing"));
    }

    if (
      !(
        event.type === OnChainEventType.EVENT_TYPE_SIGNER ||
        event.type === OnChainEventType.EVENT_TYPE_SIGNER_MIGRATED ||
        event.type === OnChainEventType.EVENT_TYPE_ID_REGISTER ||
        event.type === OnChainEventType.EVENT_TYPE_STORAGE_RENT
      )
    ) {
      return err(new HubError("bad_request.validation_failure", "invalid event type"));
    }
    return ok(event);
  }

  private async validateMessage(message: Message): HubAsyncResult<Message> {
    // 1. Ensure message data is present
    if (!message || !message.data) {
      return err(new HubError("bad_request.validation_failure", "message data is missing"));
    }

    // 2. Check the network
    if (message.data.network !== this._network) {
      return err(
        new HubError(
          "bad_request.validation_failure",
          `incorrect network: ${message.data.network} (expected: ${this._network})`,
        ),
      );
    }

    // 3. Check that the user has a custody address
    let custodyAddress: Uint8Array | undefined;
    const custodyEvent = await ResultAsync.fromPromise(
      this._onchainEventsStore.getIdRegisterEventByFid(message.data.fid),
      (e) => e as HubError,
    );
    if (custodyEvent.isErr()) {
      log.error(
        { errCode: custodyEvent.error.errCode, errMessage: custodyEvent.error.message },
        `failed to get v2 custody event for ${message.data.fid}`,
      );
    } else {
      custodyAddress = custodyEvent.value.idRegisterEventBody.to;
    }

    if (!custodyAddress) {
      return err(new HubError("bad_request.validation_failure", `unknown fid: ${message.data.fid}`));
    }

    // 4. Check that the signer is valid
    const result = await ResultAsync.fromPromise(
      this._onchainEventsStore.getActiveSigner(message.data.fid, message.signer),
      (e) => e,
    );
    const signerExists = result.isOk();
    if (!signerExists) {
      const hex = bytesToHexString(message.signer);
      return hex.andThen((signerHex) => {
        return err(
          new HubError(
            "bad_request.validation_failure",
            `invalid signer: signer ${signerHex} not found for fid ${message.data?.fid}`,
          ),
        );
      });
    }

    // 5. For fname add UserDataAdd messages, check that the user actually owns the fname
    if (isUserDataAddMessage(message) && message.data.userDataBody.type === UserDataType.USERNAME) {
      // For fname messages, check if the user actually owns the fname.
      const nameBytes = utf8StringToBytes(message.data.userDataBody.value);
      if (nameBytes.isErr()) {
        return err(nameBytes.error);
      }

      // Users are allowed to set fname = '' to remove their fname, so check to see if fname is set
      // before validating the custody address
      if (nameBytes.value.length > 0) {
        // Get the NameRegistryEvent for the fname
        const nameProof = (await this.getUserNameProof(nameBytes.value)).mapErr((e) =>
          e.errCode === "not_found"
            ? new HubError(
                "bad_request.validation_failure",
                `name ${message.data.userDataBody.value} is not registered`,
              )
            : e,
        );
        if (nameProof.isErr()) {
          return err(nameProof.error);
        }

        if (nameProof.value.type === UserNameType.USERNAME_TYPE_FNAME) {
          // Check that the fid for the fname and message are the same
          if (nameProof.value.fid !== message.data.fid) {
            return err(
              new HubError(
                "bad_request.validation_failure",
                `fname fid ${nameProof.value.fid} does not match message fid ${message.data.fid}`,
              ),
            );
          }
        } else if (nameProof.value.type === UserNameType.USERNAME_TYPE_ENS_L1) {
          const result = await this.validateEnsUsernameProof(nameProof.value, custodyAddress);
          if (result.isErr()) {
            return err(result.error);
          }
        } else {
          return err(new HubError("bad_request.validation_failure", "invalid username type"));
        }
      }
    }

    // For username proof messages, make sure the name resolves to the users custody address or a connected address actually owns the ens name
    if (isUsernameProofMessage(message) && message.data.usernameProofBody.type === UserNameType.USERNAME_TYPE_ENS_L1) {
      const result = await this.validateEnsUsernameProof(message.data.usernameProofBody, custodyAddress);
      if (result.isErr()) {
        return err(result.error);
      }
    }

    // 6. Check message body and envelope
    if (this._validationWorker) {
      const worker = this._validationWorker;
      return new Promise<HubResult<Message>>((resolve) => {
        const id = this._validationWorkerJobId++;
        this._validationWorkerPromiseMap.set(id, resolve);

        worker.postMessage({ id, message });
      });
    } else {
      return validations.validateMessage(message, nativeValidationMethods);
    }
  }

  private async validateEnsUsernameProof(
    nameProof: UserNameProof,
    custodyAddress: Uint8Array,
  ): HubAsyncResult<undefined> {
    const nameResult = bytesToUtf8String(nameProof.name);
    if (nameResult.isErr() || !nameResult.value.endsWith(".eth")) {
      return err(new HubError("bad_request.validation_failure", `invalid ens name: ${nameProof.name}`));
    }
    let resolvedAddress;
    let resolvedAddressString;
    try {
      resolvedAddressString = await this._publicClient?.getEnsAddress({ name: normalize(nameResult.value) });
      const resolvedAddressBytes = hexStringToBytes(resolvedAddressString || "");
      if (resolvedAddressBytes.isErr() || resolvedAddressBytes.value.length === 0) {
        return err(new HubError("bad_request.validation_failure", `no valid address for ${nameResult.value}`));
      }
      resolvedAddress = resolvedAddressBytes.value;
    } catch (e) {
      return err(new HubError("unavailable.network_failure", `failed to resolve ens name ${nameResult.value}: ${e}`));
    }

    if (bytesCompare(resolvedAddress, nameProof.owner) !== 0) {
      return err(
        new HubError(
          "bad_request.validation_failure",
          `resolved address ${resolvedAddressString} does not match proof`,
        ),
      );
    }
    // If resolved address does not match custody address then check if we have an eth verification for it
    if (bytesCompare(resolvedAddress, custodyAddress) !== 0) {
      const verificationResult = await this.getVerification(nameProof.fid, resolvedAddress);
      if (verificationResult.isErr()) {
        return err(new HubError("bad_request.validation_failure", `ens name does not belong to fid: ${nameProof.fid}`));
      }
    }
    return ok(undefined);
  }

  private async handleMergeUsernameProofEvent(event: MergeUsernameProofHubEvent): HubAsyncResult<void> {
    const { deletedUsernameProof, usernameProof } = event.mergeUsernameProofBody;

    // When there is a UserNameProof, we need to check if we need to revoke UserDataAdd messages from the
    // previous owner of the name.
    if (deletedUsernameProof && deletedUsernameProof.owner.length > 0) {
      // If the name and the fid are the same (proof just has a newer timestamp or different owner address) then we don't need to revoke
      if (
        usernameProof &&
        bytesCompare(deletedUsernameProof.name, usernameProof.name) === 0 &&
        deletedUsernameProof.fid === usernameProof.fid
      ) {
        return ok(undefined);
      }
      const fid = deletedUsernameProof.fid;

      // Check if this fid assigned the name with a UserDataAdd message
      const usernameAdd = await ResultAsync.fromPromise(
        this._userDataStore.getUserDataAdd(fid, UserDataType.USERNAME),
        () => undefined,
      );
      if (usernameAdd.isOk()) {
        const nameBytes = utf8StringToBytes(usernameAdd.value.data.userDataBody.value);
        if (!nameBytes.isOk()) {
          log.error(
            `failed to convert username add message ${bytesToHexString(
              usernameAdd.value.hash,
            )} for fid ${fid} to utf8 string`,
          );
          return err(nameBytes.error);
        }
        if (bytesCompare(nameBytes.value, deletedUsernameProof.name) !== 0) {
          log.debug(`deleted name proof for ${fid} does not match current user name, skipping revoke`);
          return ok(undefined);
        }

        const revokeResult = await this._userDataStore.revoke(usernameAdd.value);
        const usernameAddHex = bytesToHexString(usernameAdd.value.hash);
        revokeResult.match(
          () =>
            log.info(`revoked message ${usernameAddHex._unsafeUnwrap()} for fid ${fid} due to name proof invalidation`),
          (e) =>
            log.error(
              { errCode: e.errCode },
              `failed to revoke message ${usernameAddHex._unsafeUnwrap()} for fid ${fid} due to name proof invalidation: ${
                e.message
              }`,
            ),
        );
      }
    }

    return ok(undefined);
  }

  private async handleMergeOnChainEvent(event: MergeOnChainEventHubEvent): HubAsyncResult<void> {
    const onChainEvent = event.mergeOnChainEventBody.onChainEvent;

    if (
      onChainEvent &&
      isSignerOnChainEvent(onChainEvent) &&
      onChainEvent.signerEventBody.eventType === SignerEventType.REMOVE
    ) {
      const payload = RevokeMessagesBySignerJobPayload.create({
        fid: onChainEvent.fid,
        signer: onChainEvent.signerEventBody.key,
      });
      const enqueueRevoke = await this._revokeSignerQueue.enqueueJob(payload);
      if (enqueueRevoke.isErr()) {
        log.error(
          { errCode: enqueueRevoke.error.errCode },
          `failed to enqueue revoke signer job: ${enqueueRevoke.error.message}`,
        );
      }
    }

    return ok(undefined);
  }
}

export default Engine;
