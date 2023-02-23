import {
  HubEvent,
  HubEventType,
  IdRegistryEvent,
  isMergeIdRegistryEventHubEvent,
  isMergeMessageHubEvent,
  isMergeNameRegistryEventHubEvent,
  isPruneMessageHubEvent,
  isRevokeMessageHubEvent,
  MergeIdRegistryEventHubEvent,
  MergeMessageHubEvent,
  MergeNameRegistryEventHubEvent,
  Message,
  NameRegistryEvent,
  PruneMessageHubEvent,
  RevokeMessageHubEvent,
} from '@farcaster/protobufs';
import { bytesIncrement, FARCASTER_EPOCH, HubAsyncResult, HubError, HubResult } from '@farcaster/utils';
import { err, ok, ResultAsync } from 'neverthrow';
import AbstractRocksDB from 'rocksdb';
import { TypedEmitter } from 'tiny-typed-emitter';
import RocksDB, { Transaction } from '~/storage/db/rocksdb';
import { RootPrefix } from '~/storage/db/types';

export type StoreEvents = {
  /**
   * mergeMessage is emitted when a message is merged into one of the stores. If
   * messages are deleted as part of the merge transaction (i.e. due to conflicts between
   * messages), they are emitted as part of the deletedMessages argument.
   */
  mergeMessage: (event: MergeMessageHubEvent) => void;

  /**
   * pruneMessage is emitted when a message is pruned from a store due to size
   * or time-based limits.
   */
  pruneMessage: (event: PruneMessageHubEvent) => void;

  /**
   * revokeMessage is emitted when a message is deleted because its signer has been
   * removed. Signers are removed when SignerRemove messages are merged or an fid changes
   * custody address.
   */
  revokeMessage: (event: RevokeMessageHubEvent) => void;

  /**
   * mergeIdRegistryEvent is emitted when an event from the ID Registry contract is
   * merged into the SignerStore.
   */
  mergeIdRegistryEvent: (event: MergeIdRegistryEventHubEvent) => void;

  /**
   * mergeNameRegistryEvent is emitted when an event from the Name Registry contract
   * is merged into the UserDataStore.
   */
  mergeNameRegistryEvent: (event: MergeNameRegistryEventHubEvent) => void;
};

// Chosen to keep number under Number.MAX_SAFE_INTEGER
const TIMESTAMP_BITS = 41;
const SEQUENCE_BITS = 12;

export class HubEventIdGenerator {
  private _lastTimestamp: number; // ms since epoch
  private _lastSeq: number;
  private _epoch: number;

  constructor(options: { epoch?: number; lastTimestamp?: 0; lastIndex?: 0 } = {}) {
    this._epoch = options.epoch ?? 0;
    this._lastTimestamp = options.lastTimestamp ?? 0;
    this._lastSeq = options.lastIndex ?? 0;
  }

  generateId(): HubResult<number> {
    const timestamp = Date.now() - this._epoch;

    if (timestamp === this._lastTimestamp) {
      this._lastSeq = this._lastSeq + 1;
    } else {
      this._lastTimestamp = timestamp;
      this._lastSeq = 0;
    }

    if (this._lastTimestamp > 2 ** TIMESTAMP_BITS) {
      return err(new HubError('bad_request.invalid_param', `timestamp > ${TIMESTAMP_BITS} bits`));
    }

    if (this._lastSeq > 2 ** SEQUENCE_BITS) {
      return err(new HubError('bad_request.invalid_param', `sequence > ${SEQUENCE_BITS} bits`));
    }

    const binaryTimestamp = this._lastTimestamp.toString(2);
    let binaryIndex = this._lastSeq.toString(2);
    if (binaryIndex.length)
      while (binaryIndex.length < SEQUENCE_BITS) {
        binaryIndex = '0' + binaryIndex;
      }

    return ok(parseInt(binaryTimestamp + binaryIndex, 2));
  }
}

const makeEventKey = (id?: number): Buffer => {
  const buffer = Buffer.alloc(1 + (id ? 8 : 0));
  buffer.writeUint8(RootPrefix.HubEvents, 0);
  if (id) {
    buffer.writeBigUint64BE(BigInt(id), 1);
  }
  return buffer;
};

export const putEventTransaction = (txn: Transaction, event: HubEvent): Transaction => {
  const key = makeEventKey(event.id);
  const value = Buffer.from(HubEvent.encode(event).finish());
  return txn.put(key, value);
};

class StoreEventHandler extends TypedEmitter<StoreEvents> {
  private _db: RocksDB;
  private _generator: HubEventIdGenerator;

  constructor(db: RocksDB) {
    super();

    this._db = db;
    this._generator = new HubEventIdGenerator({ epoch: FARCASTER_EPOCH });
  }

  async getEvent(id: number): HubAsyncResult<HubEvent> {
    const key = makeEventKey(id);
    const result = await ResultAsync.fromPromise(this._db.get(key), (e) => e as HubError);
    return result.map((buffer) => HubEvent.decode(new Uint8Array(buffer as Buffer)));
  }

  getEventsIterator(fromId?: number): HubResult<AbstractRocksDB.Iterator> {
    const minKey = makeEventKey(fromId);
    const maxKey = bytesIncrement(Uint8Array.from(makeEventKey()));
    if (maxKey.isErr()) {
      return err(maxKey.error);
    }
    return ok(this._db.iterator({ gte: minKey, lt: Buffer.from(maxKey.value), keys: false, valueAsBuffer: true }));
  }

  async getEvents(): HubAsyncResult<HubEvent[]> {
    const events: HubEvent[] = [];
    const iterator = this.getEventsIterator();
    if (iterator.isErr()) {
      return err(iterator.error);
    }
    for await (const [, value] of iterator.value) {
      const event = HubEvent.decode(Uint8Array.from(value as Buffer));
      events.push(event);
    }
    return ok(events);
  }

  broadcastEvent(event: HubEvent): HubResult<void> {
    if (isMergeMessageHubEvent(event)) {
      this.emit('mergeMessage', event);
    } else if (isPruneMessageHubEvent(event)) {
      this.emit('pruneMessage', event);
    } else if (isRevokeMessageHubEvent(event)) {
      this.emit('revokeMessage', event);
    } else if (isMergeIdRegistryEventHubEvent(event)) {
      this.emit('mergeIdRegistryEvent', event);
    } else if (isMergeNameRegistryEventHubEvent(event)) {
      this.emit('mergeNameRegistryEvent', event);
    } else {
      return err(new HubError('bad_request.invalid_param', 'invalid event type'));
    }

    return ok(undefined);
  }

  broadcastEvents(events: HubEvent[]): Array<HubResult<void>> {
    return events.map((event) => this.broadcastEvent(event));
  }

  makeMergeMessage(message: Message, deletedMessages?: Message[]): HubResult<MergeMessageHubEvent> {
    return this._generator.generateId().andThen((id) => {
      const event = HubEvent.create({
        type: HubEventType.HUB_EVENT_TYPE_MERGE_MESSAGE,
        id,
        mergeMessageBody: {
          message,
          deletedMessages: deletedMessages ?? [],
        },
      }) as MergeMessageHubEvent;
      return ok(event);
    });
  }

  makePruneMessage(message: Message): HubResult<PruneMessageHubEvent> {
    return this._generator.generateId().andThen((id) => {
      const event = HubEvent.create({
        type: HubEventType.HUB_EVENT_TYPE_PRUNE_MESSAGE,
        id,
        pruneMessageBody: {
          message,
        },
      }) as PruneMessageHubEvent;
      return ok(event);
    });
  }

  makeRevokeMessage(message: Message): HubResult<RevokeMessageHubEvent> {
    return this._generator.generateId().andThen((id) => {
      const event = HubEvent.create({
        type: HubEventType.HUB_EVENT_TYPE_REVOKE_MESSAGE,
        id,
        revokeMessageBody: {
          message,
        },
      }) as RevokeMessageHubEvent;
      return ok(event);
    });
  }

  makeMergeIdRegistryEvent(idRegistryEvent: IdRegistryEvent): HubResult<MergeIdRegistryEventHubEvent> {
    return this._generator.generateId().andThen((id) => {
      const event = HubEvent.create({
        type: HubEventType.HUB_EVENT_TYPE_MERGE_ID_REGISTRY_EVENT,
        id,
        mergeIdRegistryEventBody: {
          idRegistryEvent,
        },
      }) as MergeIdRegistryEventHubEvent;
      return ok(event);
    });
  }

  makeMergeNameRegistryEvent(nameRegistryEvent: NameRegistryEvent): HubResult<MergeNameRegistryEventHubEvent> {
    return this._generator.generateId().andThen((id) => {
      const event = HubEvent.create({
        type: HubEventType.HUB_EVENT_TYPE_MERGE_NAME_REGISTRY_EVENT,
        id,
        mergeNameRegistryEventBody: {
          nameRegistryEvent,
        },
      }) as MergeNameRegistryEventHubEvent;
      return ok(event);
    });
  }

  async putEvent(event: HubEvent): HubAsyncResult<void> {
    const txn = putEventTransaction(this._db.transaction(), event);
    return ResultAsync.fromPromise(this._db.commit(txn), (e) => e as HubError);
  }
}

export default StoreEventHandler;
