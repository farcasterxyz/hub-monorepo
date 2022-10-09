export class FarcasterError extends Error {
  public readonly statusCode: number = 500;

  constructor(e: string | Error) {
    super(typeof e === 'string' ? e : e.message);
  }
}

export class NotFoundError extends FarcasterError {
  public override readonly statusCode = 404;
}

export class BadRequestError extends FarcasterError {
  public override readonly statusCode = 400;
}

export class ServerError extends FarcasterError {
  public override readonly statusCode = 500;
}

export class RocksDBError extends FarcasterError {
  public override readonly statusCode = 500;
}
