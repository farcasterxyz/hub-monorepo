import {
  getDefaultStoreLimit,
  StoreType,
  UserNameProof,
  UsernameProofMessage,
  UserNameType,
} from "@farcaster/hub-nodejs";
import { ResultAsync } from "neverthrow";
import { UserPostfix } from "../db/types.js";
import {
  rsCreateUsernameProofStore,
  rsGetUsernameProof,
  rsGetUsernameProofByFidAndName,
  rsGetUsernameProofsByFid,
  rustErrorToHubError,
} from "../../rustfunctions.js";
import StoreEventHandler from "./storeEventHandler.js";
import { StorePruneOptions } from "./types.js";
import RocksDB from "storage/db/rocksdb.js";
import { RustStoreBase } from "./rustStoreBase.js";
import { messageDecode } from "../../storage/db/message.js";

class UsernameProofStore extends RustStoreBase<UsernameProofMessage, never> {
  constructor(db: RocksDB, eventHandler: StoreEventHandler, options: StorePruneOptions = {}) {
    const pruneSizeLimit = options.pruneSizeLimit ?? getDefaultStoreLimit(StoreType.USERNAME_PROOFS);
    const rustUsernameProofStore = rsCreateUsernameProofStore(
      db.rustDb,
      eventHandler.getRustStoreEventHandler(),
      pruneSizeLimit,
    );

    super(db, rustUsernameProofStore, UserPostfix.UsernameProofMessage, eventHandler, pruneSizeLimit);
  }

  /**
   * Finds a UserNameProof Message by checking the adds set index
   *
   * @returns the UsernameProof message if it exists, undefined otherwise
   * @param name the name to find
   * @param type the type of the name to find (fname or ens)
   */
  async getUsernameProof(name: Uint8Array, type: UserNameType): Promise<UsernameProofMessage> {
    const result = await ResultAsync.fromPromise(rsGetUsernameProof(this._rustStore, name, type), rustErrorToHubError);
    if (result.isErr()) {
      throw result.error;
    }
    return messageDecode(new Uint8Array(result.value)) as UsernameProofMessage;
  }

  /** Finds all UserNameProof messages for an fid */
  async getUsernameProofsByFid(fid: number): Promise<UserNameProof[]> {
    const messages_page = await rsGetUsernameProofsByFid(this._rustStore, fid, {});

    const messages =
      messages_page.messageBytes?.map((messageBytes) => {
        return messageDecode(new Uint8Array(messageBytes)) as UsernameProofMessage;
      }) ?? [];

    return messages.map((message) => message.data.usernameProofBody);
  }

  async getUsernameProofByFidAndName(fid: number, name: Uint8Array): Promise<UsernameProofMessage> {
    const result = await ResultAsync.fromPromise(
      rsGetUsernameProofByFidAndName(this._rustStore, fid, name),
      rustErrorToHubError,
    );
    if (result.isErr()) {
      throw result.error;
    }
    return messageDecode(new Uint8Array(result.value)) as UsernameProofMessage;
  }
}

export default UsernameProofStore;
