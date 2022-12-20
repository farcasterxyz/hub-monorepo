import { ChainId } from 'caip';
import { Result, err, ok } from 'neverthrow';
import { URL } from '~/urls/baseUrl';
import { BadRequestError, FarcasterError, ServerError } from '~/utils/errors';

export abstract class BaseChainURL extends URL {
  public static readonly SCHEME = 'chain';
  public readonly scheme = ChainURL.SCHEME;
}

export class ChainURL extends BaseChainURL {
  public readonly chainId: ChainId;

  public static parse(url: string): Result<ChainURL, FarcasterError> {
    const schemePrefix = this.SCHEME + '://';

    if (!url.startsWith(schemePrefix)) {
      return err(new BadRequestError(`URL missing 'chain' scheme`));
    }

    const remainder = url.substring(url.indexOf(schemePrefix) + schemePrefix.length);

    try {
      const chainIdParams = ChainId.parse(remainder);
      const chainId = new ChainId(chainIdParams);

      const chainIdParam = ChainId.spec.parameters.values[1];
      if (chainIdParam === undefined) {
        return err(new BadRequestError('ChainURL.parse: missing chain ID'));
      }

      // check for extra invalid data before or after the chain ID
      const referenceRegex = new RegExp('^' + chainIdParam.regex + '$');
      if (!referenceRegex.test(chainId.reference)) {
        return err(new BadRequestError(`ChainURL.parse: invalid extra data after ChainId: '${remainder}`));
      }
      return ok(new ChainURL(chainId));
    } catch (e) {
      return err(new ServerError(`ChainURL.parse: unable to parse '${url}`));
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
