import { ChainId } from 'caip';
import { Result, err, ok } from 'neverthrow';
import { URL } from '~/urls/baseUrl';

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
