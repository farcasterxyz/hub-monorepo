import { Message, MessageType } from "@farcaster/hub-nodejs";
import { ExpressionBuilder, Expression, SqlBool } from "kysely";
import { DBTransaction, Tables } from "./db.js";
import { ProcessEventFn, buildAddRemoveEventProcessor } from "./eventProcessor.js";

export type ConflictRule = "last-write-wins" | "last-write-wins-remove-trumps";

type MaybeSoftDeletable = { deletedAt?: Date | null; [key: string]: unknown };

type HandleDerivedDataChangeOptions<TDerivedData extends MaybeSoftDeletable> = (params: {
  data: TDerivedData;
  trx: DBTransaction;
  /** Indicates that the derived row was created */
  isCreate: boolean;
  /** Flag indicating that side-effects must be skipped */
  skipSideEffects: boolean;
}) => Promise<void>;

type BuildAddRemoveMessageProcessorOptions<
  TAddMessage extends Message,
  TRemoveMessage extends Message,
  TDerivedData extends MaybeSoftDeletable,
> = {
  addMessageType: MessageType;
  removeMessageType: MessageType;

  /**
   * Rule to resolve to resolve conflicts.
   *
   * last-write-win:
   *   1. If timestamps are distinct, retain the one with the highest timestamp.
   *   2. If one message is a remove and the other is an add, retain the remove and discard the add.
   *   3. If the timestamps are identical and both messages are of the same type, retain the message with the highest lexicographical hash.
   *
   * last-write-wins-remove-trumps:
   *   1. If one message is a remove and the other is an add, retain the remove and discard the add.
   *   2. If the messages are of the same time and the timestamps are distinct, retain the one with the highest timestamp.
   *   3. If the timestamps are identical and both messages are of the same type, retain the message with the highest lexicographical hash.
   */
  conflictRule: ConflictRule;

  /**
   * Given an add or remove message, return an expression that will filter to
   * only messages with the same conflict id
   */
  withConflictId: (
    message: TAddMessage | TRemoveMessage,
  ) => (eb: ExpressionBuilder<Tables, "messages">) => Expression<SqlBool>;

  /**
   * Returns the derived data for a given message, or undefined if it does not exist
   */
  getDerivedRow: (message: TAddMessage | TRemoveMessage, trx: DBTransaction) => Promise<MaybeSoftDeletable | undefined>;

  /**
   * Create, update, or delete derived data for a given add message. If the `delete` parameter is specified
   * the merge MUST be soft or hard delete the derived row. The derived row MUST be returned, in the case of
   * a hard delete the deleted row MUST be returned.
   */
  mergeDerivedRow: (message: TAddMessage, deleted: boolean, trx: DBTransaction) => Promise<TDerivedData | undefined>;

  /**
   * Delete derived data for a given remove message. If a row was deleted it MUST be returned.
   */
  deleteDerivedRow: (message: TRemoveMessage, trx: DBTransaction) => Promise<TDerivedData | undefined>;

  /**
   * Called when derived data has either been created or undeleted.
   */
  onAdd: HandleDerivedDataChangeOptions<TDerivedData>;

  /**
   * Called when derived data has been deleted.
   */
  onRemove: HandleDerivedDataChangeOptions<TDerivedData>;
};

/**
 * This higher order functions build an add and remove processor for a set of
 * given message types.
 */
export function buildAddRemoveMessageProcessor<
  TAddMessage extends Message,
  TRemoveMessage extends Message,
  TDerivedData extends MaybeSoftDeletable,
>(
  options: BuildAddRemoveMessageProcessorOptions<TAddMessage, TRemoveMessage, TDerivedData>,
): {
  processAdd: ProcessEventFn<TAddMessage>;
  processRemove: ProcessEventFn<TRemoveMessage>;
} {
  return buildAddRemoveEventProcessor<TAddMessage, TRemoveMessage, TDerivedData>({
    // We record remove messages in the messages table, so no need to record them also
    // in the derived tables
    callDeleteWhenNoDerivedDataPresent: false,

    hasHigherEvent: async ({ event, lookingForType, trx }) => {
      const messageTypes: MessageType[] = [];
      if (lookingForType === "add" || lookingForType === "add_or_remove") {
        messageTypes.push(options.addMessageType);
      }
      if (lookingForType === "remove" || lookingForType === "add_or_remove") {
        messageTypes.push(options.removeMessageType);
      }

      const highestMessage = await trx
        .selectFrom("messages")
        .select("hash")
        // Select this message as well as the eligible ones so we can check if this message
        // is the highest
        .where(({ or, eb }) => or([eb("type", "in", messageTypes), eb("hash", "=", event.hash)]))
        .where(options.withConflictId(event))
        // Message isn't deleted, revoked, or pruned
        .where("revokedAt", "is", null)
        .where("prunedAt", "is", null)
        .where("deletedAt", "is", null)
        .$if(options.conflictRule === "last-write-wins", (qb) =>
          // Prioritize last write, but then still prioritize removals higher than additions.
          // We assume that the numeric value of the remove message type
          // is higher than that of the add message type
          qb
            .orderBy("timestamp", "desc")
            .orderBy("type", "desc"),
        )
        .$if(options.conflictRule === "last-write-wins-remove-trumps", (qb) =>
          qb.orderBy("type", "desc").orderBy("timestamp", "desc"),
        )
        .orderBy("hash", "desc")
        .executeTakeFirst();

      if (highestMessage && Buffer.compare(highestMessage.hash, event.hash) !== 0) {
        // Highest message is not the current one
        return true;
      }

      return false;
    },
    getDerivedRow: ({ event, trx }) => options.getDerivedRow(event, trx),
    mergeDerivedRow: ({ event, isDelete, trx }) => options.mergeDerivedRow(event, isDelete, trx),
    deleteDerivedRow: ({ event, trx }) => options.deleteDerivedRow(event, trx),
    // We do not have a situation where we skip side effects in message processing, so hardcoding skipSideEffects to false
    onAdd: ({ data, trx, isCreate }) => options.onAdd({ data, trx, isCreate, skipSideEffects: false }),
    onRemove: ({ data, trx }) =>
      options.onRemove({
        data,
        trx,
        isCreate: false,
        skipSideEffects: false,
      }),
  });
}
