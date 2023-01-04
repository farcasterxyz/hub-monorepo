import { HubAsyncResult, HubError } from '@hub/errors';
import { ResultAsync } from 'neverthrow';
import HubStateModel from '~/flatbuffers/models/hubStateModel';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import NameRegistryEventModel from '~/flatbuffers/models/nameRegistryEventModel';
import { HubInterface } from '~/flatbuffers/models/types';
import RocksDB from '~/storage/db/rocksdb';
import Engine from '~/storage/engine';

export class MockHub implements HubInterface {
  public db: RocksDB;
  public engine: Engine;

  constructor(db: RocksDB, engine: Engine) {
    this.db = db;
    this.engine = engine ?? new Engine(db);
  }

  async submitMessage(message: MessageModel): HubAsyncResult<void> {
    return this.engine.mergeMessage(message);
  }

  async submitIdRegistryEvent(event: IdRegistryEventModel): HubAsyncResult<void> {
    return this.engine.mergeIdRegistryEvent(event);
  }

  async submitNameRegistryEvent(event: NameRegistryEventModel): HubAsyncResult<void> {
    return this.engine.mergeNameRegistryEvent(event);
  }

  async getHubState(): HubAsyncResult<HubStateModel> {
    return ResultAsync.fromPromise(HubStateModel.get(this.db), (e) => e as HubError);
  }

  async putHubState(hubState: HubStateModel): HubAsyncResult<void> {
    const txn = this.db.transaction();
    HubStateModel.putTransaction(txn, hubState);
    return await ResultAsync.fromPromise(this.db.commit(txn), (e) => e as HubError);
  }
}
