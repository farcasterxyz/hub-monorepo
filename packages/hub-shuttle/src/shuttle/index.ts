import { Message } from "@farcaster/hub-nodejs";
import { DB } from "./db";

export * from "./db";
export * from "./redis";
export * from "./hub";
export * from "./hubSubscriber";
export * from "./hubEventProcessor";
export * from "./messageProcessor";
export * from "./messageReconciliation";
export * from "./eventStream";

export type StoreMessageOperation = "merge" | "delete" | "revoke" | "prune";

export type ProcessResult = {
  skipped: boolean;
};

// Implement this interface in your app to handle messages. The package currently provides the following gurantees:
// - Messages can be assumed to be processes in the same order as they were recieved by the hub as long as wasMissed in false
// - if wasMissed is true, then the package provides no guarantees about the ordering (it is possible to receive an add
//      after a remove, your app needs to handle the CRDT resolution). We will provide a way to handle this in the future.
// - The package will not process the same message twice

export interface MessageHandler {
  handleMessageMerge(
    message: Message,
    txn: DB,
    operation: StoreMessageOperation,
    isNew: boolean,
    wasMissed: boolean,
  ): Promise<void>;
}
