import { Result, err, ok } from 'neverthrow';
import { CastId, FarcasterId } from '~/urls/identifiers';
import { parse as rawUriParse, URIComponents } from 'uri-js';
import { ChainId } from 'caip';

export const parseUrl = (url: string, allowUnrecognized = true): Result<URL, string> => {
  // extract scheme
  let baseURI: URIComponents;
  try {
    baseURI = rawUriParse(url);
  } catch (e) {
    return err(`parseUrl: invalid URL string`);
  }

  // try URL subtypes based on the scheme
  switch (baseURI.scheme) {
    case undefined:
      return err('parseUrl: URL is missing scheme');

    case FarcasterURL.SCHEME:
      return UserURL.parse(url).orElse(() => CastURL.parse(url));

    case ChainURL.SCHEME:
      return ChainURL.parse(url);

    default:
      if (!allowUnrecognized) {
        return err(`parseUrl: Unrecognized scheme '${baseURI.scheme}'`);
      }
      return ok(new UnrecognizedURL(baseURI.scheme, url));
  }
};

export abstract class URL {
  public abstract readonly scheme: string;

  public abstract toString(): string;
}

export class UnrecognizedURL extends URL {
  public constructor(public readonly scheme: string, public readonly fullURL: string) {
    super();
  }

  public toString() {
    return this.fullURL;
  }
}

export abstract class FarcasterURL extends URL {
  public static readonly SCHEME = 'farcaster';
  public readonly scheme = FarcasterURL.SCHEME;
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

export class CastURL extends FarcasterURL {
  public readonly castId: CastId;

  public static parse(url: string): Result<CastURL, string> {
    const schemePrefix = this.SCHEME + '://';

    if (!url.startsWith(schemePrefix)) {
      return err(`URL missing 'farcaster' scheme`);
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

export abstract class BaseChainURL extends URL {
  public static readonly SCHEME = 'chain';
  public readonly scheme = ChainURL.SCHEME;
}

export class ChainURL extends BaseChainURL {
  public readonly chainId: ChainId;

  public static parse(url: string): Result<ChainURL, string> {
    const schemePrefix = this.SCHEME + '://';

    if (!url.startsWith(schemePrefix)) {
      return err(`URL missing 'chain' scheme`);
    }

    const remainder = url.substring(url.indexOf(schemePrefix) + schemePrefix.length);

    try {
      const chainIdParams = ChainId.parse(remainder);
      const chainId = new ChainId(chainIdParams);

      // check for extra invalid data before or after the chain ID
      const referenceRegex = new RegExp('^' + ChainId.spec.parameters.values[1].regex + '$');
      if (!referenceRegex.test(chainId.reference)) {
        return err(`ChainURL.parse: invalid extra data after ChainId: '${remainder}`);
      }
      return ok(new ChainURL(chainId));
    } catch (e) {
      return err(`ChainURL.parse: unable to parse '${url}`);
    }
  }

  public constructor(chainId: ChainId) {
    super();
    this.chainId = chainId;
  }

  public toString(): string {
    return BaseChainURL.SCHEME + '://' + this.chainId.toString();
  }
}
