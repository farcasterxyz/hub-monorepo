import { joinParams, getParams, isValidId } from '~/urls/utils';
import { UserIdSpec, CastIdSpec, CastHashSpec } from '~/urls/specs';
import { err, ok, Result } from 'neverthrow';

export interface UserIdParams {
  namespace: 'id';
  value: string;
}

export type UserIdConstructorArgs = Omit<UserIdParams, 'namespace'>;

export class UserId {
  public static spec = UserIdSpec;

  public static parse(id: string): Result<UserIdParams, string> {
    if (!isValidId(id, this.spec)) {
      return err(`Invalid ${this.spec.name} provided: ${id}`);
    }
    return ok(new UserId(getParams<UserIdParams>(id, this.spec)).toJSON());
  }

  public static format(params: UserIdParams): string {
    return joinParams(params as any, this.spec);
  }

  private readonly namespace: 'id' = 'id';
  public readonly value: string;

  constructor(params: UserIdConstructorArgs | string) {
    if (typeof params === 'string') {
      const maybeParsed = UserId.parse(params);
      if (maybeParsed.isErr()) {
        throw maybeParsed.error;
      }
      params = maybeParsed.value;
    } else {
      const userIdSpec = UserId.spec.parameters.values[1];
      if (!RegExp(userIdSpec.regex).test(params.value)) {
        throw new Error(`Invalid ${userIdSpec.name} provided: ${params.value}`);
      }
    }

    this.value = params.value;
  }

  public toString(): string {
    return UserId.format(this.toJSON());
  }

  public toJSON(): UserIdParams {
    return {
      namespace: this.namespace,
      value: this.value,
    };
  }
}

export interface CastHashParams {
  messageType: 'cast';
  value: string;
}

type CastHashConstructorArgs = Omit<CastHashParams, 'messageType'>;

export class CastHash {
  public static spec = CastHashSpec;

  public static parse(id: string): Result<CastHashParams, string> {
    if (!isValidId(id, this.spec)) {
      return err(`Invalid ${this.spec.name} provided: ${id}`);
    }
    return ok(new CastHash(getParams<CastHashParams>(id, this.spec)).toJSON());
  }

  public static format(params: CastHashParams): string {
    return joinParams(params as any, this.spec);
  }

  private readonly messageType: 'cast' = 'cast';
  public readonly value: string;

  constructor(params: CastHashConstructorArgs | string) {
    if (typeof params === 'string') {
      const maybeParsed = CastHash.parse(params);
      if (maybeParsed.isErr()) {
        throw maybeParsed.error;
      }
      params = maybeParsed.value;
    } else {
      const castHashSpec = CastHash.spec.parameters.values[1];
      if (!RegExp(castHashSpec.regex).test(params.value)) {
        throw new Error(`Invalid ${castHashSpec.name} provided: ${params.value}`);
      }
    }

    this.value = params.value;
  }

  public toString(): string {
    return CastHash.format(this.toJSON());
  }

  public toJSON(): CastHashParams {
    return {
      messageType: this.messageType,
      value: this.value,
    };
  }
}

export interface CastIdParams {
  userId: string | UserIdParams;
  castHash: string | CastHashParams;
}

export type CastIdConstructorArgs = {
  userId: string | UserIdConstructorArgs;
  castHash: string | CastHashConstructorArgs;
};

export class CastId {
  public static spec = CastIdSpec;

  public static parse(id: string): Result<CastIdParams, string> {
    if (!isValidId(id, this.spec)) {
      return err(`Invalid ${this.spec.name} provided: ${id}`);
    }
    try {
      return ok(new CastId(getParams<CastIdParams>(id, this.spec)).toJSON());
    } catch (e) {
      return err('' + e);
    }
  }

  public static format(params: CastIdParams): string {
    return joinParams(params as any, this.spec);
  }

  private readonly messageType: 'cast' = 'cast';

  public readonly userId: UserId;
  public readonly castHash: CastHash;

  constructor(params: CastIdConstructorArgs | string) {
    if (typeof params === 'string') {
      const maybeParsed = CastId.parse(params);
      if (maybeParsed.isErr()) {
        throw maybeParsed.error;
      }
      params = maybeParsed.value;
    }

    this.userId = new UserId(params.userId);
    this.castHash = new CastHash(params.castHash);
  }

  public toString(): string {
    return CastId.format(this.toJSON());
  }

  public toJSON(): CastIdParams {
    return {
      userId: this.userId.toJSON(),
      castHash: this.castHash.toJSON(),
    };
  }
}
