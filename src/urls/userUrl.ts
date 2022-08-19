import { IdentifierSpec } from 'caip/dist/types';
import { Result, err, ok } from 'neverthrow';
import { isValidId, getParams, joinParams } from '~/urls/utils';
import { FarcasterURL } from '~/urls/baseUrl';

export const FarcasterIdSpec: IdentifierSpec = {
  name: 'farcasterId',
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

export interface FarcasterIdParams {
  namespace: 'fid';
  value: string;
}

export type FarcasterIdConstructorArgs = Omit<FarcasterIdParams, 'namespace'>;

export class FarcasterId {
  public static spec = FarcasterIdSpec;

  public static parse(fid: string): Result<FarcasterIdParams, string> {
    if (!isValidId(fid, this.spec)) {
      return err(`Invalid ${this.spec.name} provided: ${fid}`);
    }
    return ok(new FarcasterId(getParams<FarcasterIdParams>(fid, this.spec)).toJSON());
  }

  public static format(params: FarcasterIdParams): string {
    return joinParams(params as any, this.spec);
  }

  private readonly namespace: 'fid' = 'fid';
  public readonly value: string;

  constructor(params: FarcasterIdConstructorArgs | string) {
    if (typeof params === 'string') {
      const maybeParsed = FarcasterId.parse(params);
      if (maybeParsed.isErr()) {
        throw maybeParsed.error;
      }
      params = maybeParsed.value;
    } else {
      const userIdSpec = FarcasterId.spec.parameters.values[1];
      if (!RegExp(userIdSpec.regex).test(params.value)) {
        throw new Error(`Invalid ${userIdSpec.name} provided: ${params.value}`);
      }
    }

    this.value = params.value;
  }

  public toString(): string {
    return FarcasterId.format(this.toJSON());
  }

  public toJSON(): FarcasterIdParams {
    return {
      namespace: this.namespace,
      value: this.value,
    };
  }
}

export class UserURL extends FarcasterURL {
  public readonly farcasterId: FarcasterId;

  public static parse(url: string): Result<UserURL, string> {
    const schemePrefix = this.SCHEME + '://';

    if (!url.startsWith(schemePrefix)) {
      return err(`URL missing 'farcaster' scheme`);
    }

    const remainder = url.substring(url.indexOf(schemePrefix) + schemePrefix.length);

    const maybeFarcasterIdParams = FarcasterId.parse(remainder);
    return maybeFarcasterIdParams.map((userIdParams) => {
      const userId = new FarcasterId(userIdParams);
      return new UserURL(userId);
    });
  }

  public constructor(farcasterId: FarcasterId) {
    super();
    this.farcasterId = farcasterId;
  }

  public toString(): string {
    return FarcasterURL.SCHEME + '://' + this.farcasterId.toString();
  }
}
