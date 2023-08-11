import {
  HubAsyncResult,
  HubError,
  HubEventType,
  isUsernameProofMessage,
  MessageType,
  UserNameProof,
  UsernameProofMessage,
  UserNameType,
} from "@farcaster/hub-nodejs";
import { err, ok, ResultAsync } from "neverthrow";
import { RootPrefix, UserMessagePostfix, UserPostfix } from "../db/types.js";
import { Store } from "./store.js";
import { Transaction } from "../db/rocksdb.js";
import { makeFidKey, makeTsHash, makeUserKey, readFidKey } from "../db/message.js";
import { HubEventArgs } from "./storeEventHandler.js";

const PRUNE_SIZE_LIMIT_DEFAULT = 10;

/**
 * Generates a unique key used to store a UsernameProof Message
 *
 * @param fid the fid of the user who created the link
 * @param name
 * @returns RocksDB index key of the form <RootPrefix>:<fid?>:<tsHash?>
 */
const makeUserNameProofByFidKey = (fid: number, name: Uint8Array): Buffer => {
  return Buffer.concat([makeUserKey(fid), Buffer.from([UserPostfix.UserNameProofAdds]), Buffer.from(name)]);
};

const makeUserNameProofByNameKey = (name: Uint8Array): Buffer => {
  return Buffer.concat([Buffer.from([RootPrefix.UserNameProofByName]), Buffer.from(name)]);
};

class UsernameProofStore extends Store<UsernameProofMessage, never> {
  override _postfix: UserMessagePostfix = UserPostfix.UsernameProofMessage;

  override makeAddKey(msg: UsernameProofMessage) {
    return makeUserNameProofByFidKey(msg.data.fid, msg.data.usernameProofBody.name) as Buffer;
  }

  override makeRemoveKey(_: never): Buffer {
    throw new Error("removes not supported");
  }

  override async findMergeAddConflicts(_message: UsernameProofMessage): HubAsyncResult<void> {
    return ok(undefined);
  }

  override async findMergeRemoveConflicts(_message: never): HubAsyncResult<void> {
    throw new Error("removes not supported");
  }

  override _isAddType = isUsernameProofMessage;
  override _isRemoveType = undefined;
  override _addMessageType = MessageType.USERNAME_PROOF;
  override _removeMessageType = undefined;

  protected override get PRUNE_SIZE_LIMIT_DEFAULT() {
    return PRUNE_SIZE_LIMIT_DEFAULT;
  }

  /**
   * Finds a UserNameProof Message by checking the adds set index
   *
   * @returns the UsernameProof message if it exists, undefined otherwise
   * @param name the name to find
   * @param type the type of the name to find (fname or ens)
   */
  async getUsernameProof(name: Uint8Array, type: UserNameType): Promise<UsernameProofMessage> {
    if (type === UserNameType.USERNAME_TYPE_ENS_L1) {
      const byNameKey = makeUserNameProofByNameKey(name);
      const fid = readFidKey(await this._db.get(byNameKey));
      if (fid === undefined) {
        throw new HubError("not_found", `username proof not found for name: ${name.toString()}`);
      }
      return this.getAdd({ data: { fid, usernameProofBody: { name: name } } });
    }
    throw new HubError("bad_request", `unsupported username type: ${type}`);
  }

  /** Finds all UserNameProof messages for an fid */
  async getUsernameProofsByFid(fid: number): Promise<UserNameProof[]> {
    const proofMessages = await this.getAddsByFid({ data: { fid } }, { pageSize: 25 });
    const result: UserNameProof[] = [];
    for (const proofMessage of proofMessages.messages) {
      result.push(proofMessage.data.usernameProofBody);
    }
    return result;
  }

  override async buildSecondaryIndices(txn: Transaction, message: UsernameProofMessage): HubAsyncResult<void> {
    const tsHash = makeTsHash(message.data.timestamp, message.hash);

    if (tsHash.isErr()) {
      return err(tsHash.error);
    }

    const name = message.data.usernameProofBody.name;

    if (name.length === 0) {
      return err(new HubError("bad_request.invalid_param", "name empty"));
    }

    // Puts the fid into the byTarget index
    const byNameKey = makeUserNameProofByNameKey(name);
    txn.put(byNameKey, makeFidKey(message.data.fid));

    return ok(undefined);
  }
  override async deleteSecondaryIndices(txn: Transaction, message: UsernameProofMessage): HubAsyncResult<void> {
    const name = message.data.usernameProofBody.name;

    if (name.length === 0) {
      return err(new HubError("bad_request.invalid_param", "name empty"));
    }

    // Delete the message key from byName index
    const byNameKey = makeUserNameProofByNameKey(name);
    txn.del(byNameKey);

    return ok(undefined);
  }

  override async getMergeConflicts(message: UsernameProofMessage): HubAsyncResult<UsernameProofMessage[]> {
    const validateResult = await this.validateAdd(message);

    if (validateResult.isErr()) {
      return err(validateResult.error);
    }

    const checkResult = await this.findMergeAddConflicts(message);

    if (checkResult.isErr()) {
      return err(checkResult.error);
    }

    const conflicts: UsernameProofMessage[] = [];

    const byNameKey = makeUserNameProofByNameKey(message.data.usernameProofBody.name);
    const fidResult = await ResultAsync.fromPromise(this._db.get(byNameKey), () => undefined);
    if (fidResult.isOk()) {
      const fid = readFidKey(fidResult.value);
      if (fid !== undefined) {
        const existingMessage = await this.getAdd({
          data: {
            fid,
            usernameProofBody: { name: message.data.usernameProofBody.name },
          },
        });
        const tsHash = makeTsHash(message.data.timestamp, message.hash);
        const existingTsHash = makeTsHash(existingMessage.data.timestamp, existingMessage.hash);

        if (tsHash.isErr() || existingTsHash.isErr()) {
          throw new HubError("bad_request", "failed to make tsHash");
        }

        const messageCompare = this.messageCompare(
          this._addMessageType,
          existingTsHash.value,
          this._addMessageType,
          tsHash.value,
        );
        if (messageCompare > 0) {
          return err(new HubError("bad_request.conflict", "message conflicts with a more recent add"));
        } else if (messageCompare === 0) {
          return err(new HubError("bad_request.duplicate", "message has already been merged"));
        } else {
          conflicts.push(existingMessage);
        }
      }
    }
    return ok(conflicts);
  }

  protected override mergeEventArgs(
    mergedMessage: UsernameProofMessage,
    mergeConflicts: UsernameProofMessage[],
  ): HubEventArgs {
    return {
      type: HubEventType.MERGE_USERNAME_PROOF,
      mergeUsernameProofBody: {
        usernameProof: mergedMessage.data.usernameProofBody,
        deletedUsernameProof: mergeConflicts[0]?.data.usernameProofBody,
        usernameProofMessage: mergedMessage,
        deletedUsernameProofMessage: mergeConflicts[0],
      },
    };
  }

  protected override pruneEventArgs(prunedMessage: UsernameProofMessage): HubEventArgs {
    return {
      type: HubEventType.MERGE_USERNAME_PROOF,
      mergeUsernameProofBody: {
        usernameProof: undefined,
        deletedUsernameProof: prunedMessage.data.usernameProofBody,
        usernameProofMessage: undefined,
        deletedUsernameProofMessage: prunedMessage,
      },
    };
  }

  protected override revokeEventArgs(message: UsernameProofMessage): HubEventArgs {
    return {
      type: HubEventType.MERGE_USERNAME_PROOF,
      mergeUsernameProofBody: {
        usernameProof: undefined,
        deletedUsernameProof: message.data.usernameProofBody,
        usernameProofMessage: undefined,
        deletedUsernameProofMessage: message,
      },
    };
  }
}

export default UsernameProofStore;
