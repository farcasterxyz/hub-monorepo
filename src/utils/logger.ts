import { default as Pino } from 'pino';

/**
 * Logging Guidelines
 *
 *
 * 1. Use the appropriate level with log.<level> (e.g. logger.info)
 *
 * Fatal - when the application crashes
 * Error - when logging an Error object
 * Warn - when logging something unexpected
 * Info - when logging information (most common use case)
 * Debug - when logging something that is temporarily added in for debugging
 * Trace - not currently used
 *
 *
 * 2. Log the entire Error object when logging an error and only add context via the second string parameter
 *
 * log.error(Error, "additional context")
 *
 * More info on best practices:
 * https://betterstack.com/community/guides/logging/how-to-install-setup-and-use-pino-to-log-node-js-applications/
 */

export const logger = Pino();
