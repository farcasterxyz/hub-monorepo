import { default as Pino } from 'pino';
import IdRegistryEventModel from '~/storage/flatbuffers/idRegistryEventModel';
import MessageModel from '~/storage/flatbuffers/messageModel';
import NameRegistryEventModel from '~/storage/flatbuffers/nameRegistryEventModel';

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
  defaultOptions.level = 'silent';
}

export const logger = Pino(defaultOptions);

export const messageToLog = (message: MessageModel) => {
  return {
    tsHash: message.tsHash(),
    fid: message.fid(),
    type: message.typeName(),
  };
};

export const idRegistryEventToLog = (event: IdRegistryEventModel) => {
  return {
    blockNumber: event.blockNumber(),
    transactionHash: event.transactionHash(),
    fid: event.fid(),
    to: event.to(),
    type: event.typeName(),
  };
};

export const nameRegistryEventToLog = (event: NameRegistryEventModel) => {
  return {
    blockNumber: event.blockNumber(),
    transactionHash: event.transactionHash(),
    fname: event.fname(),
    to: event.to(),
    type: event.typeName(),
  };
};
