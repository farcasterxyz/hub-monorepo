import {
  bytesCompare,
  bytesToHexString,
  bytesToUtf8String,
  CastAddMessage,
  CastId,
  CastRemoveMessage,
  Factories,
  FarcasterNetwork,
  fromFarcasterTime,
  getDefaultStoreLimit,
  getStoreLimits,
  hexStringToBytes,
  HubAsyncResult,
  HubError,
  HubErrorCode,
  HubEvent,
  HubResult,
  isLinkCompactStateMessage,
  isSignerOnChainEvent,
  isUserDataAddMessage,
  isUsernameProofMessage,
  isVerificationAddAddressMessage,
  LinkAddMessage,
  LinkCompactStateMessage,
  LinkRemoveMessage,
  MergeOnChainEventHubEvent,
  MergeUsernameProofHubEvent,
  Message,
  MessageType,
  OnChainEvent,
  OnChainEventResponse,
  OnChainEventType,
  Protocol,
  ReactionAddMessage,
  ReactionRemoveMessage,
  ReactionType,
  RevokeMessagesBySignerJobPayload,
  SignerEventType,
  SignerOnChainEvent,
  StorageLimit,
  StorageLimitsResponse,
  StorageUnitType,
  StoreType,
  toFarcasterTime,
  UserDataAddMessage,
  UserDataType,
  UserNameProof,
  UserNameType,
  utf8StringToBytes,
  validations,
  VerificationAddAddressMessage,
  VerificationRemoveMessage,
} from "@farcaster/hub-nodejs";
import { err, ok, ResultAsync } from "neverthrow";
import fs from "fs";
import { Worker } from "worker_threads";
import { forEachMessageBySigner, typeToSetPostfix } from "../db/message.js";
import RocksDB from "../db/rocksdb.js";
import { UserPostfix } from "../db/types.js";
import CastStore from "../stores/castStore.js";
import LinkStore from "../stores/linkStore.js";
import ReactionStore from "../stores/reactionStore.js";
import StoreEventHandler from "../stores/storeEventHandler.js";
import { DEFAULT_PAGE_SIZE, MessagesPage, PageOptions } from "../stores/types.js";
import UserDataStore from "../stores/userDataStore.js";
import VerificationStore from "../stores/verificationStore.js";
import { logger } from "../../utils/logger.js";
import { RevokeMessagesBySignerJobQueue, RevokeMessagesBySignerJobWorker } from "../jobs/revokeMessagesBySignerJob.js";
import { ensureAboveTargetFarcasterVersion } from "../../utils/versions.js";
import { type PublicClient } from "viem";
import { normalize } from "viem/ens";
import UsernameProofStore from "../stores/usernameProofStore.js";
import OnChainEventStore from "../stores/onChainEventStore.js";
import { consumeRateLimitByKey, getRateLimiterForTotalMessages, isRateLimitedByKey } from "../../utils/rateLimits.js";
import { rsValidationMethods } from "../../rustfunctions.js";
import { RateLimiterAbstract, RateLimiterMemory } from "rate-limiter-flexible";
import { TypedEmitter } from "tiny-typed-emitter";
import { FNameRegistryEventsProvider } from "../../eth/fnameRegistryEventsProvider.js";
import { statsd } from "../../utils/statsd.js";
import { L2EventsProvider } from "eth/l2EventsProvider.js";
export interface ValidationWorkerMessageWithMessage {
  id: number;
  message: Message;
  errCode?: never;
  errMessage?: never;
}

export interface ValidationWorkerMessageWithError {
  id: number;
  message?: never;
  errCode: HubErrorCode;
  errMessage: string;
}

export interface ValidationWorkerData {
  l2RpcUrl: string;
  ethMainnetRpcUrl: string;
}

const getWorkerData = (): ValidationWorkerData => {
  return {
    ethMainnetRpcUrl:
      "https://eth-mainnet.g.alchemy.com/v2/sTNOcFDFkXuc1UTyR4tdXpyOaqjPF2yp,https://mainnet.infura.io/v3/498b3446c70b4e4d8d979f4272422df2",
    l2RpcUrl:
      "https://opt-mainnet.g.alchemy.com/v2/7XraarGJevWyyHCqKA49GIW50Fw4-3qt,https://optimism-mainnet.infura.io/v3/498b3446c70b4e4d8d979f4272422df2",
  };
};

// The type of response that the worker sends back to the main thread
export type ValidationWorkerMessage = ValidationWorkerMessageWithMessage | ValidationWorkerMessageWithError;

const repro = async () => {
  const workerPath = "./build/storage/engine/validation.worker.js";
  let validationWorker;
  try {
    const validationWorkerHandler = (data: ValidationWorkerMessage) => {
      const { id, message, errCode, errMessage } = data;

      if (message) {
        ok(message);
      } else {
        err(new HubError(errCode, errMessage));
      }
    };

    const workerData = getWorkerData();
    validationWorker = new Worker(workerPath, {
      workerData,
      execArgv: [`--inspect-port=${9231}`],
    });
    validationWorker.on("message", validationWorkerHandler);
  } catch (e) {
    console.log("Error", e);
  }

  for (let i = 0; i < 10_000; i++) {
    validationWorker?.postMessage({ id: i, message: await Factories.Message.create() });
  }
};

repro().catch((e) => {
  console.log(e);
});
