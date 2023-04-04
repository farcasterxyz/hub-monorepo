import { HubAsyncResult, HubError, HubState, IdRegistryEvent, Message, NameRegistryEvent } from '@farcaster/hub-nodejs';
import { err } from 'neverthrow';
import { HubInterface } from '~/hubble';
import RocksDB from '~/storage/db/rocksdb';
import Engine from '~/storage/engine';

export class MockHub implements HubInterface {
  public db: RocksDB;
  public engine: Engine;

  constructor(db: RocksDB, engine: Engine) {
    this.db = db;
    this.engine = engine;
  }

  async submitMessage(message: Message): HubAsyncResult<number> {
    return this.engine.mergeMessage(message);
  }

  async submitIdRegistryEvent(event: IdRegistryEvent): HubAsyncResult<number> {
    return this.engine.mergeIdRegistryEvent(event);
  }

  async submitNameRegistryEvent(event: NameRegistryEvent): HubAsyncResult<number> {
    return this.engine.mergeNameRegistryEvent(event);
  }

  async getHubState(): HubAsyncResult<HubState> {
    // return ResultAsync.fromPromise(HubState.get(this.db), (e) => e as HubError);
    return err(new HubError('unavailable', 'Not implemented'));
  }

  async putHubState(_hubState: HubState): HubAsyncResult<void> {
    // const txn = this.db.transaction();
    // HubStateModel.putTransaction(txn, hubState);
    // return await ResultAsync.fromPromise(this.db.commit(txn), (e) => e as HubError);
    return err(new HubError('unavailable', 'Not implemented'));
  }
}
