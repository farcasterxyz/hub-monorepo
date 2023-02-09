import * as protobufs from '@farcaster/protobufs';
import { bytesToHexString, fromFarcasterTime } from '@farcaster/utils';
import { default as Pino } from 'pino';

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
const defaultOptions: Pino.LoggerOptions = {};

// Disable logging in tests and CI to reduce noise
if (process.env['NODE_ENV'] === 'test' || process.env['CI']) {
  // defaultOptions.level = 'debug';
  defaultOptions.level = 'silent';
}

export const logger = Pino(defaultOptions);

export const messageTypeToName = (type?: protobufs.MessageType) => {
  if (!type) return '';
  return (protobufs.MessageType[type] as string).replace('MESSAGE_TYPE_', '');
};

export const messageToLog = (message: protobufs.Message) => {
  return {
    timestamp: fromFarcasterTime(message.data?.timestamp || 0),
    hash: bytesToHexString(message.hash)._unsafeUnwrap(),
    fid: message.data?.fid,
    type: message.data?.type,
  };
};

export const idRegistryEventToLog = (event: protobufs.IdRegistryEvent) => {
  return {
    blockNumber: event.blockNumber,
    fid: event.fid,
    to: bytesToHexString(event.to)._unsafeUnwrap(),
  };
};

export const nameRegistryEventToLog = (event: protobufs.NameRegistryEvent) => {
  return {
    blockNumber: event.blockNumber,
    fname: Buffer.from(event.fname).toString('utf-8').replace(/\0/g, ''),
    to: bytesToHexString(event.to)._unsafeUnwrap(),
  };
};
