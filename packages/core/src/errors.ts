import { Result } from "neverthrow";

interface HubErrorOpts {
  message: string;
  cause: Error | HubError;
  presentable: boolean;
}

// biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
export const isHubError = (e: any): e is HubError => {
  return typeof e.errCode !== "undefined";
};

/**
 * HubError should be used to construct all types exceptions in the Hub.
 *
 * A HubError is instantiated with a HubErrorCode that classifies the error, a context object that
 * provides additional information about the error. The context object can be a string, an Error,
 * or both and also accepts additional parameters to classify the HubError. HubErrors should never
 * be thrown directly and always be returned using neverthrow's Result type.
 */
export class HubError extends Error {
  /* Hub classification of error types */
  public readonly errCode: HubErrorCode;

  /* Indicates if if error message can be presented to the user */
  public readonly presentable: boolean = false;

  /**
   * @param errCode - the HubError code for this message
   * @param context - a message, another Error, or a HubErrorOpts
   */
  constructor(errCode: HubErrorCode, context: Partial<HubErrorOpts> | string | Error) {
    let parsedContext: string | Error | Partial<HubErrorOpts>;

    if (typeof context === "string") {
      parsedContext = { message: context };
    } else if (context instanceof Error) {
      parsedContext = { cause: context, message: context.message };
    } else {
      parsedContext = context;
    }

    if (!parsedContext.message) {
      parsedContext.message = parsedContext.cause?.message || "";
    }

    super(parsedContext.message, { cause: parsedContext.cause });

    this.name = "HubError";
    this.errCode = errCode;
  }
}

/**
 * HubErrorCode defines all the types of errors that can be raised in the Hub.
 *
 * A string union type is chosen over an enumeration since TS enums are unusual types that generate
 * javascript code and may cause downstream issues. See:
 * https://www.executeprogram.com/blog/typescript-features-to-avoid
 */
export type HubErrorCode =
  /* The request did not have valid authentication credentials, retry with credentials  */
  | "unauthenticated"
  /* The authenticated request did not have the authority to perform this action  */
  | "unauthorized"
  /* The request cannot be completed as constructed, do not retry */
  | "bad_request"
  | "bad_request.parse_failure"
  | "bad_request.invalid_param"
  | "bad_request.validation_failure"
  | "bad_request.unknown_signer"
  | "bad_request.duplicate"
  | "bad_request.conflict"
  | "bad_request.prunable"
  | "bad_request.no_storage"
  | "bad_request.unknown_fid"
  /* The requested resource could not be found */
  | "not_found"
  /* The request could not be completed because the operation is not executable */
  | "not_implemented"
  | "not_implemented.deprecated"
  /* The request could not be completed, it may or may not be safe to retry */
  | "unavailable"
  | "unavailable.network_failure"
  | "unavailable.storage_failure"
  /* An unknown error was encountered */
  | "unknown";

/** Type alias for shorthand when handling errors */
export type HubResult<T> = Result<T, HubError>;
export type HubAsyncResult<T> = Promise<HubResult<T>>;
