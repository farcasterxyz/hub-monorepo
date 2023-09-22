import { DBTransaction } from "./db.js";
import { StoreMessageOperation } from "./util.js";

export type EventConflictRule = "last-write-wins" | "last-write-wins-remove-trumps";

type MaybeSoftDeletable = { deletedAt?: Date | null; [key: string]: unknown };

export type ProcessEventFn<THubEvent> = (
  event: THubEvent,
  operation: StoreMessageOperation,
  trx: DBTransaction,
  skipSideEffects?: boolean,
) => Promise<void>;

type HandleDerivedDataAddFn<TDerivedData extends MaybeSoftDeletable> = (params: {
  data: TDerivedData;
  trx: DBTransaction;
  /** Indicates that a derived row is now being created (nothing was returned by getDerivedRow()) */
  isCreate: boolean;
}) => Promise<void>;

type HandleDerivedDataRemoveFn<TDerivedData extends MaybeSoftDeletable> = (params: {
  data: TDerivedData;
  trx: DBTransaction;
}) => Promise<void>;

type BuildAddRemoveEventProcessorOptions<THubAddEvent, THubRemoveEvent, TDerivedData extends MaybeSoftDeletable> = {
  /**
   * Determines whether deleteDerivedRow() will be called when no derived data exists (getDerivedRow() returned nothing).
   * Setting this to true is only useful if we need to record in the derived data the first time we see an event, and
   * it's a deletion
   */
  callDeleteWhenNoDerivedDataPresent: boolean;

  /**
   * Returns true if there exists a conflicting event that is higher than the event being processed.
   * eventType is allows the function to differentiate between add and remove events when the actual event type is the same,
   * e.g. with username proofs
   */
  hasHigherEvent: (params: {
    event: THubAddEvent | THubRemoveEvent;
    eventType: "add" | "remove";
    lookingForType: "add" | "remove" | "add_or_remove";
    trx: DBTransaction;
  }) => Promise<boolean>;

  /**
   * Returns the derived data for a given event, or undefined if it does not exist
   */
  getDerivedRow: (params: {
    event: THubAddEvent | THubRemoveEvent;
    trx: DBTransaction;
  }) => Promise<MaybeSoftDeletable | undefined>;

  /**
   * Create, update, or delete derived data for a given add event. If the `isDelete` parameter is specified
   * the merge MUST soft or hard delete the derived row. The affected row MUST be returned, whether it was updated,
   * soft deleted or hard deleted.
   */
  mergeDerivedRow: (params: {
    event: THubAddEvent;
    isDelete: boolean;
    trx: DBTransaction;
  }) => Promise<TDerivedData | undefined>;

  /**
   * Delete derived data for a given remove event. If a row was deleted it MUST be returned.
   */
  deleteDerivedRow: (params: {
    event: THubRemoveEvent;
    trx: DBTransaction;
  }) => Promise<TDerivedData | undefined>;

  /**
   * Called when derived data has either been created or undeleted.
   */
  onAdd: HandleDerivedDataAddFn<TDerivedData>;

  /**
   * Called when derived data has been deleted.
   */
  onRemove: HandleDerivedDataRemoveFn<TDerivedData>;
};

/**
 * This higher order functions build an add and remove processor for a set of
 * given event types.
 */
export function buildAddRemoveEventProcessor<THubAddEvent, THubRemoveEvent, TDerivedData extends MaybeSoftDeletable>(
  options: BuildAddRemoveEventProcessorOptions<THubAddEvent, THubRemoveEvent, TDerivedData>,
): {
  processAdd: ProcessEventFn<THubAddEvent>;
  processRemove: ProcessEventFn<THubRemoveEvent>;
} {
  return {
    processAdd: buildAddEventProcessor(options),
    processRemove: buildRemoveEventProcessor(options),
  };
}

const buildAddEventProcessor = <THubAddEvent, THubRemoveEvent, TDerivedData extends MaybeSoftDeletable>(
  options: BuildAddRemoveEventProcessorOptions<THubAddEvent, THubRemoveEvent, TDerivedData>,
): ProcessEventFn<THubAddEvent> => {
  return async (event, operation, trx) => {
    const hasHigherAdd = await options.hasHigherEvent({
      event,
      eventType: "add",
      lookingForType: "add",
      trx,
    });

    // Do nothing if there is a higher add event
    if (hasHigherAdd) return;

    // Flag for deletion if this is an add event being pruned, revoked, or deleted, or a higher remove exists
    const hasHigherRemove = await options.hasHigherEvent({
      event,
      eventType: "add",
      lookingForType: "remove",
      trx,
    });
    const isDelete = operation !== "merge" || hasHigherRemove;

    // Get current derived row before mutating it
    const existingDerivedRow = await options.getDerivedRow({ event, trx });

    const newDerivedRow = await options.mergeDerivedRow({
      event,
      isDelete,
      trx,
    });

    // Skip downstream effects if there was no row inserted/updated
    if (!newDerivedRow) return;

    if (isDelete) {
      // Skip downstream remove effects if the row was already deleted
      if (!existingDerivedRow || existingDerivedRow.deletedAt) return;

      await options.onRemove({ data: newDerivedRow, trx });
    } else {
      // Skip downstream add effects if the row already existed and was not deleted
      if (existingDerivedRow && !existingDerivedRow.deletedAt) return;

      await options.onAdd({
        data: newDerivedRow,
        isCreate: !existingDerivedRow,
        trx,
      });
    }
  };
};

const buildRemoveEventProcessor = <THubAddEvent, THubRemoveEvent, TDerivedData extends MaybeSoftDeletable>(
  options: BuildAddRemoveEventProcessorOptions<THubAddEvent, THubRemoveEvent, TDerivedData>,
): ProcessEventFn<THubRemoveEvent> => {
  return async (event, operation, trx) => {
    // Do nothing if the remove event is being revoked, pruned, or deleted
    if (operation !== "merge") return;

    const hasHigherEvent = await options.hasHigherEvent({
      event,
      eventType: "remove",
      lookingForType: "add_or_remove",
      trx,
    });

    // Do nothing if there is a higher message
    if (hasHigherEvent) return;

    const existingDerivedRow = await options.getDerivedRow({ event, trx });

    if (existingDerivedRow?.deletedAt) {
      // Do nothing as derived row is present and already flagged as deleted
      return;
    }

    if (!existingDerivedRow && !options.callDeleteWhenNoDerivedDataPresent) {
      // Do nothing as derived data doesn't exist and we don't want to call deleteDerivedRow
      return;
    }

    const derivedRow = await options.deleteDerivedRow({ event, trx });

    // Skip downstream effects if no row
    if (!derivedRow) return;

    await options.onRemove({
      data: derivedRow,
      trx,
    });
  };
};
