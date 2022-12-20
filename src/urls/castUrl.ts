import type { IdentifierSpec } from 'caip/dist/types';
import { Result, err, ok } from 'neverthrow';
import { FarcasterURL } from '~/urls/baseUrl';
import { UserId, UserIdConstructorArgs, UserIdParams, UserIdSpec } from '~/urls/userUrl';
import { isValidId, getParams, joinParams } from '~/urls/utils';
import { BadRequestError, FarcasterError, ServerError } from '~/utils/errors';

const REGEX_BLAKE2B_HASH = '0x[a-f0-9]{128}';

const CastHashSpec: IdentifierSpec = {
  name: 'castHash',
  regex: 'cast:' + REGEX_BLAKE2B_HASH,
  parameters: {
    delimiter: ':',
    values: {
      0: {
        name: 'messageType',
        regex: '^cast$',
      },
      1: {
        name: 'value',
        regex: '^' + REGEX_BLAKE2B_HASH + '$',
      },
    },
  },
};

const CastIdSpec: IdentifierSpec = {
  name: 'castId',
  regex: UserIdSpec.regex + '/' + CastHashSpec.regex,
  parameters: {
    delimiter: '/',
    values: {
      0: UserIdSpec,
      1: CastHashSpec,
    },
  },
};

export interface CastHashParams {
  messageType: 'cast';
  value: string;
}

export type CastHashConstructorArgs = Omit<CastHashParams, 'messageType'>;

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

  private readonly messageType = 'cast' as const;
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
      if (castHashSpec === undefined) {
        throw new Error(`URL missing cast hash`);
      }
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

  public static parse(id: string): Result<CastIdParams, FarcasterError> {
    if (!isValidId(id, this.spec)) {
      return err(new BadRequestError(`Invalid ${this.spec.name} provided: ${id}`));
    }
    try {
      return ok(new CastId(getParams<CastIdParams>(id, this.spec)).toJSON());
    } catch (e) {
      return err(new ServerError('' + e));
    }
  }

  public static format(params: CastIdParams): string {
    return joinParams(params as any, this.spec);
  }

  // TODO: Remove this while refactoring URLs
  // private readonly messageType = 'cast' as const;

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

export class CastURL extends FarcasterURL {
  public readonly castId: CastId;

  public static parse(url: string): Result<CastURL, FarcasterError> {
    const schemePrefix = this.SCHEME + '://';

    if (!url.startsWith(schemePrefix)) {
      return err(new BadRequestError(`URL missing 'farcaster' scheme`));
    }

    const remainder = url.substring(url.indexOf(schemePrefix) + schemePrefix.length);

    const maybeCastIdParams = CastId.parse(remainder);
    return maybeCastIdParams.map((castIdParams) => {
      const castId = new CastId(castIdParams);
      return new CastURL(castId);
    });
  }

  public constructor(castId: CastId) {
    super();
    this.castId = castId;
  }

  public toString(): string {
    return FarcasterURL.SCHEME + '://' + this.castId.toString();
  }
}
