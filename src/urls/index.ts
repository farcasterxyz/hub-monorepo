import { Result, err, ok } from 'neverthrow';
import { parse as rawUriParse, URIComponents } from 'uri-js';
import { FarcasterURL, UnrecognizedURL } from '~/urls/baseUrl';
import { CastURL } from '~/urls/castUrl';
import { ChainURL } from '~/urls/chainUrl';
import { UserURL } from '~/urls/userUrl';
import { URL } from '~/urls/baseUrl';

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

export { URL } from '~/urls/baseUrl';
export { CastURL } from '~/urls/castUrl';
export { ChainURL } from '~/urls/chainUrl';
export { UserURL } from '~/urls/userUrl';
