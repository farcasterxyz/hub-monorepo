export type StandardError = StandardLightError | StandardFullError;

export type StandardErrorReason = "fid_not_registered" | "missing_message" | "assertion_failed" | "unknown";

interface StandardErrorProperties {
  /** Class name of this error */
  name: string;

  /** Human-readable error message */
  message: string;

  /** Whether this error should be shown in a UI */
  presentable: boolean;

  /** Whether this error should be reported to an error tracker */
  reportable: boolean;

  /** Whether this error should be logged at the time it occurs */
  loggable: boolean;

  /** Machine-readable error code identifying the reason for this error */
  reason: StandardErrorReason;

  /** Used to identify standard errors (i.e. those following a specified format) at runtime */
  isStandardError: true;
}

export const isStandardError = (e: unknown): e is StandardError =>
  typeof e === "object" && e !== null && "isStandardError" in e;

type StandardErrorOptions =
  | {
      message: string;
      cause?: Error;
      report?: boolean;
      log?: boolean;
      reason?: StandardErrorReason;
    }
  | {
      message?: string;
      cause: Error;
      report?: boolean;
      log?: boolean;
      reason?: StandardErrorReason;
    };

/**
 * Full version of standard error that includes a stacktrace and is chainable.
 */
abstract class StandardFullError extends Error implements StandardErrorProperties {
  public readonly isStandardError = true as const;

  // Assume by default any error is not safe to share with an end-user.
  public readonly presentable: boolean = false;

  // Assume by default any error should be reported to an error tracker.
  public readonly reportable: boolean = true;

  // Assume by default any error should be logged
  public readonly loggable: boolean = true;

  // By default the reason is unknown.
  // Must override in subclasses or specify at time of creation.
  public reason: StandardErrorReason = "unknown";

  /**
   * Constructor that allows us to create an error from another error.
   *
   * Provides a way to chain errors to aid with debugging.
   */
  constructor(options: StandardErrorOptions) {
    super(options.message ?? options.cause?.message, {
      cause: options.cause,
    });

    if (options.report !== undefined) {
      this.reportable = options.report;
    }

    if (options.log !== undefined) {
      this.loggable = options.log;
    }

    if (options.reason !== undefined) {
      this.reason = options.reason;
    }

    // override the name property with the class name
    this.name = this.constructor.name;
  }
}

/**
 * Light version of standard error that doesn't include a stacktrace.
 */
abstract class StandardLightError implements StandardErrorProperties {
  public isStandardError = true as const;

  public readonly name: string;
  public readonly message!: string;

  // Assume by default any error is not safe to share with an end-user.
  public readonly presentable: boolean = false;

  // Assume by default any error should be reported to Sentry.
  public readonly reportable: boolean = true;

  // Assume by default any error should be logged
  public readonly loggable: boolean = true;

  // By default the reason is unknown.
  // Must override in subclasses or specify at time of creation.
  public reason: StandardErrorReason = "unknown";

  constructor(options: StandardErrorOptions | string) {
    if (typeof options === "string") {
      this.message = options;
    } else {
      this.message = options.message ?? options.cause?.message ?? "Unknown error";
      if (options.report !== undefined) this.reportable = options.report;
      if (options.log !== undefined) this.loggable = options.log;
      if (options.reason !== undefined) this.reason = options.reason;
    }

    // override the name property with the class name
    this.name = this.constructor.name;
  }

  toString() {
    return `${this.name}: ${this.message}`;
  }
}

/**
 * An error that shouldn't ever happen, but we throw for sake of type safety.
 */
export class AssertionError extends StandardFullError {
  constructor(message: string) {
    super({ message: `Assertion failed: ${message}`, reason: "assertion_failed" });
  }
}

/**
 * Any error that is safe to present to the client because it is something the
 * client is reponsible for (incorrect parameters, lack of permissions, etc.)
 */
export class ClientError extends StandardLightError {
  // Client errors are safe to show to the client.
  public override readonly presentable: boolean = true;

  // Client errors do not need to be reported
  public override readonly reportable: boolean = false;
}

/**
 * An known error that occurs during hub event processing, indicating the
 * underlying event cannot be processed until something else is unblocked.
 */
export class HubEventProcessingBlockedError extends StandardLightError {
  public readonly blockedOnHash?: Uint8Array;
  public readonly blockedOnFid?: number;

  constructor(message: string, options: { blockedOnHash: Uint8Array } | { blockedOnFid: number }) {
    super({ message });
    if ("blockedOnFid" in options) {
      this.blockedOnFid = options.blockedOnFid;
      this.reason = "fid_not_registered";
    } else if ("blockedOnHash" in options) {
      this.blockedOnHash = options.blockedOnHash;
      this.reason = "missing_message";
    }
  }
}
