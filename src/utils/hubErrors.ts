import { Result } from 'neverthrow';

interface HubErrorOpts {
  message: string;
  cause: Error | HubError;
  presentable: boolean;
}

/**
 * HubError is the only class that should be used to raise exceptions in the Hub.
 *
 * Error context is provided with an error code and a message which are easily serializable
 * over network calls. Sub-classing should be avoided for this reason. Stack traces are included
 * by default thanks to the Error super class.
 *
 * Errors should never be thrown and must be returned from functions using neverthrow's Return.
 * It ensures that readers can easily determine if functions are safe, and that callers are forced
 * to handle all error cases by the type system leading to fewer unhandled exceptions.
 */
export class HubError extends Error {
  /* Hub classification of error types */
  public readonly errCode: HubErrorCode;

  /* Indicates if if error message can be presented to the user */
  public readonly presentable: boolean = false;

  constructor(errCode: HubErrorCode, options: Partial<HubErrorOpts> | string) {
    if (typeof options === 'string') {
      options = { message: options };
    }

    if (!options.message) {
      options.message = options.cause?.message || '';
    }

    super(options.message, { cause: options.cause });

    this.name = 'HubError';
    this.errCode = errCode;
  }
}

/**
 * HubErrorCode defines all the types of errors that can be raised in the Hub.
 *
 * A string union type is chosen over an enumeration since TS enums are unusual types that generate
 * javascript code and may cause downstream issues. See:
 * https://www.executeprogram.com/blog/typescript-features-to-avoid
 *
 * TODO: Sub-divided into fine grained errors like "unauthorized.invalid_signature"
 */
type HubErrorCode =
  /* The request did not have valid authentication credentials, retry with credentials  */
  | 'unauthenticated'
  /* The authenticated request did not have the authority to perform this action  */
  | 'unauthorized'
  /* The request cannot be completed as constructed, do not retry */
  | 'bad_request'
  | 'bad_request.parse_failure'
  | 'bad_request.validation_failure'
  /* The requested resource could not be found */
  | 'not_found'
  /* TBD */
  | 'db_error'
  /* The request could not be completed, it may or may not be safe to retry */
  | 'unavailable'
  | 'unavailable.network_failure'
  | 'unavailable.storage_failure'
  /* An unknown error was encountered */
  | 'unknown';

// TODO: move elsewhere
export type HubResult<T> = Result<T, HubError>;
