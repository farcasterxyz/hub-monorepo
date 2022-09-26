import { IdentifierSpec } from 'caip/dist/types';
import { Result, err, ok } from 'neverthrow';
import { isValidId, getParams, joinParams } from '~/urls/utils';
import { FarcasterURL } from '~/urls/baseUrl';
import { BadRequestError, FarcasterError } from '~/errors';

export const UserIdSpec: IdentifierSpec = {
  name: 'userId',
  regex: 'fid:[1-9][0-9]{0,77}',
  parameters: {
    delimiter: ':',
    values: {
      0: {
        name: 'namespace',
        regex: '^fid$',
      },
      1: {
        name: 'value',
        regex: '^[1-9][0-9]{0,77}$',
      },
    },
  },
};

export interface UserIdParams {
  namespace: 'fid';
  value: string;
}

export type UserIdConstructorArgs = Omit<UserIdParams, 'namespace'>;

export class UserId {
  public static spec = UserIdSpec;

  public static parse(fid: string): Result<UserIdParams, FarcasterError> {
    if (!isValidId(fid, this.spec)) {
      return err(new BadRequestError(`Invalid ${this.spec.name} provided: ${fid}`));
    }
    return ok(new UserId(getParams<UserIdParams>(fid, this.spec)).toJSON());
  }

  public static format(params: UserIdParams): string {
    return joinParams(params as any, this.spec);
  }

  private readonly namespace = 'fid' as const;
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

export class UserURL extends FarcasterURL {
  public readonly userId: UserId;

  public static parse(url: string): Result<UserURL, FarcasterError> {
    const schemePrefix = this.SCHEME + '://';

    if (!url.startsWith(schemePrefix)) {
      return err(new BadRequestError(`URL missing 'farcaster' scheme`));
    }

    const remainder = url.substring(url.indexOf(schemePrefix) + schemePrefix.length);

    const maybeUserIdParams = UserId.parse(remainder);
    return maybeUserIdParams.map((userIdParams) => {
      const userId = new UserId(userIdParams);
      return new UserURL(userId);
    });
  }

  public constructor(userId: UserId) {
    super();
    this.userId = userId;
  }

  public toString(): string {
    return FarcasterURL.SCHEME + '://' + this.userId.toString();
  }
}
