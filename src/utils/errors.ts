/**
 * WARNING: this file is being deprecated do not extend
 */

export class FarcasterError extends Error {
  public readonly statusCode: number = 500;

  constructor(e: string | Error) {
    super(typeof e === 'string' ? e : e.message);
  }
}

export class UnknownUserError extends FarcasterError {
  public override readonly statusCode = 412; // Precondition Failed
}

export class BadRequestError extends FarcasterError {
  public override readonly statusCode = 400;
}

export class ServerError extends FarcasterError {
  public override readonly statusCode = 500;
}
