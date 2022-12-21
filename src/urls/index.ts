import { err, ok, Result } from 'neverthrow';
import { parse as rawUriParse, URIComponents } from 'uri-js';
import { FarcasterURL, UnrecognizedURL, URL } from '~/urls/baseUrl';
import { CastURL } from '~/urls/castUrl';
import { ChainAccountURL } from '~/urls/chainAccountUrl';
import { ChainURL } from '~/urls/chainUrl';
import { UserURL } from '~/urls/userUrl';
import { Web2URL } from '~/urls/web2Url';
import { BadRequestError, FarcasterError } from '~/utils/errors';

export const parseUrl = (
  url: string,
  { allowUnrecognized = true }: { allowUnrecognized?: boolean } = {}
): Result<URL, FarcasterError> => {
  // extract scheme
  let baseURI: URIComponents;
  try {
    baseURI = rawUriParse(url);
  } catch (e) {
    return err(new BadRequestError(`parseUrl: invalid URL string`));
  }

  // try URL subtypes based on the scheme
  switch (baseURI.scheme) {
    case undefined:
      return err(new BadRequestError('parseUrl: URL is missing scheme'));

    case FarcasterURL.SCHEME:
      return UserURL.parse(url).orElse(() => CastURL.parse(url));

    case ChainURL.SCHEME:
      return ChainURL.parse(url).orElse(() => ChainAccountURL.parse(url));

    case Web2URL.HTTP_SCHEME:
    case Web2URL.HTTPS_SCHEME:
      return ok(new Web2URL(baseURI.scheme, url));

    default:
      if (!baseURI.scheme) {
        return err(new BadRequestError(`parseUrl: Missing URI scheme'`));
      }

      if (!allowUnrecognized) {
        return err(new BadRequestError(`parseUrl: Unrecognized scheme '${baseURI.scheme}'`));
      }

      return ok(new UnrecognizedURL(baseURI.scheme, url));
  }
};

export * from '~/urls/baseUrl';
export * from '~/urls/castUrl';
export * from '~/urls/chainAccountUrl';
export * from '~/urls/chainUrl';
export * from '~/urls/userUrl';
export * from '~/urls/web2Url';
