import { Result, err, ok } from 'neverthrow';
import { CastId, UserId } from '~/urls/identifiers';
import { parse as rawUriParse, URIComponents } from 'uri-js';

export function parseUrl(url: string, allowUnrecognized = true): Result<URL, string> {
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
    default:
      if (!allowUnrecognized) {
        return err(`parseUrl: Unrecognized scheme '${baseURI.scheme}'`);
      }
      return ok(new UnrecognizedURL(baseURI.scheme, url));
  }
}

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
  public readonly userId: UserId;

  public static parse(_url: string): Result<UserURL, string> {
    const schemePrefix = this.SCHEME + '://';

    if (!_url.startsWith(schemePrefix)) {
      return err(`URL missing 'farcaster' scheme`);
    }

    const remainder = _url.substring(_url.indexOf(schemePrefix) + schemePrefix.length);

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

export class CastURL extends FarcasterURL {
  public readonly castId: CastId;

  public static parse(_url: string): Result<CastURL, string> {
    const schemePrefix = this.SCHEME + '://';

    if (!_url.startsWith(schemePrefix)) {
      return err(`URL missing 'farcaster' scheme`);
    }

    const remainder = _url.substring(_url.indexOf(schemePrefix) + schemePrefix.length);

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
