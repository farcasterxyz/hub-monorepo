import {
  bytesToHexString,
  fromFarcasterTime,
  IdRegistryEvent,
  Message,
  MessageType,
  NameRegistryEvent,
  OnChainEvent,
  onChainEventTypeToJSON,
  UserNameProof,
} from "@farcaster/hub-nodejs";
import pino, { Bindings } from "pino";

/**
 * Logging Guidelines
 *
 * 1. Use a child instance per module
 *
 * const log = logger.child({ component: 'P2PEngine' })
 *
 * 2. Structure logs so that they can be queried easily
 *
 * Good: log.info({ function: 'PerformSync', peerId: peerId.toString() }, 'connected to peers');
 * Bad: log.info('Hub connected to peers over P2P with id', peerId.toString());
 *
 * 3. Use the appropriate level with log.<level> (e.g. logger.info):
 *
 * logger.fatal() - when the application crashes
 * logger.error() - when logging an Error object
 * logger.warn() - when logging something unexpected
 * logger.info() - when logging information (most common use case)
 * logger.debug() - when logging something that is temporarily added in for debugging
 * logger.trace() - not currently used
 *
 * 3. When logging an error, include the error object as the first argument to preserve stack traces
 *
 * Good: log.error(error, "additional context")
 * Bad: log.error("additional context", error.message)
 *
 * More info on best practices:
 * https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-pino-to-log-node-js-applications/
 */
const defaultOptions: pino.LoggerOptions = {};

const MAX_BUFFERLOG_SIZE = 1_000_000;

// Disable logging in tests and CI to reduce noise
if (process.env["NODE_ENV"] === "test" || process.env["CI"]) {
  // defaultOptions.level = 'debug';
  defaultOptions.level = "silent";
} else if (process.env["LOG_LEVEL"]) {
  defaultOptions.level = process.env["LOG_LEVEL"];
}

type ProxiedLogger = { $: BufferedLogger } & Logger;

class BufferedLogger {
  // rome-ignore lint/suspicious/noExplicitAny: <explanation>
  private buffer: { method: string; args: any[] }[] = [];
  private buffering = false;
  private logger: Logger;

  constructor() {
    this.logger = pino.pino(defaultOptions);
  }

  createProxy(loggerInstance: Logger = this.logger): ProxiedLogger {
    return new Proxy(loggerInstance, {
      // rome-ignore lint/suspicious/noExplicitAny: <explanation>
      get: (target: any, prop: string) => {
        // We don't intercept "fatal" because it's a special case that we don't want to buffer
        if (["info", "error", "debug", "warn", "trace"].includes(prop)) {
          // rome-ignore lint/suspicious/noExplicitAny: <explanation>
          return (...args: any[]) => {
            if (!this.buffering || loggerInstance.level === "silent") {
              target[prop](...args);
            } else {
              // Handle the common case of ignoring debug logs if the log level is info
              if (loggerInstance.level === "info" && prop === "debug") {
                return;
              } else {
                this.buffer.push({ method: prop, args });

                if (this.buffer.length > MAX_BUFFERLOG_SIZE) {
                  this.finishBuffering();
                }
              }
            }
          };
        } else if (prop === "child") {
          return (bindings: Bindings) => {
            const childLogger = target.child(bindings);
            return this.createProxy(childLogger);
          };
        } else if (prop === "flush") {
          this.finishBuffering();
          return target[prop];
        } else if (prop === "$") {
          return this;
        } else {
          return target[prop];
        }
      },
    });
  }

  startBuffering(): void {
    this.buffering = true;
    this.buffer = [];
  }

  finishBuffering(): void {
    if (!this.buffering) return;

    this.buffering = false;

    // And then in an async function, flush the buffer so that we don't block the main thread
    (async () => {
      for (const log of this.buffer) {
        // rome-ignore lint/suspicious/noExplicitAny: <explanation>
        (this.logger as any)[log.method](...log.args);
      }
      this.buffer = [];
    })();
  }
}

export const logger = new BufferedLogger().createProxy();
export type Logger = pino.Logger;

export const messageTypeToName = (type?: MessageType) => {
  if (!type) return "";
  return (MessageType[type] as string).replace("MESSAGE_TYPE_", "");
};

export const messageToLog = (message: Message) => {
  return {
    timestamp: fromFarcasterTime(message.data?.timestamp || 0)._unsafeUnwrap(),
    hash: bytesToHexString(message.hash)._unsafeUnwrap(),
    fid: message.data?.fid,
    type: message.data?.type,
  };
};

export const idRegistryEventToLog = (event: IdRegistryEvent) => {
  return {
    blockNumber: event.blockNumber,
    fid: event.fid,
    to: bytesToHexString(event.to)._unsafeUnwrap(),
  };
};

export const nameRegistryEventToLog = (event: NameRegistryEvent) => {
  return {
    blockNumber: event.blockNumber,
    fname: Buffer.from(event.fname).toString("utf-8").replace(/\0/g, ""),
    to: bytesToHexString(event.to)._unsafeUnwrap(),
  };
};

export const onChainEventToLog = (event: OnChainEvent) => {
  return {
    blockNumber: event.blockNumber,
    blockHash: bytesToHexString(event.blockHash)._unsafeUnwrap(),
    fid: event.fid,
    type: onChainEventTypeToJSON(event.type),
  };
};

export const usernameProofToLog = (usernameProof: UserNameProof) => {
  return {
    timestamp: usernameProof.timestamp,
    name: Buffer.from(usernameProof.name).toString("utf-8").replace(/\0/g, ""),
    owner: bytesToHexString(usernameProof.owner)._unsafeUnwrap(),
  };
};
