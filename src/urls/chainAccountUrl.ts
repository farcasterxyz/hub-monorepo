import { AccountId } from 'caip';
import { ethers } from 'ethers';
import { err, ok, Result } from 'neverthrow';
import { BadRequestError, FarcasterError, ServerError } from '~/utils/errors';
import { BaseChainURL, ChainURL } from '~/urls/chainUrl';

/**
 * ChainAccountURL is a URL with the scheme `chain://` followed by a
 * [CAIP-10](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md)
 * account ID
 */
export class ChainAccountURL extends ChainURL {
  public readonly address: string;

  public static override parse(url: string): Result<ChainAccountURL, FarcasterError> {
    const schemePrefix = this.SCHEME + '://';

    if (!url.startsWith(schemePrefix)) {
      return err(new BadRequestError(`URL missing 'chain' scheme`));
    }

    const remainder = url.substring(url.indexOf(schemePrefix) + schemePrefix.length);

    try {
      const accountIdParams = AccountId.parse(remainder);
      const accountId = new AccountId(accountIdParams);

      // caip-js alone is not enough to catch invalid URLs
      // e.g. `eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb`
      const namespaceParam = AccountId.spec.parameters.values[0]; // namespace (e.g. `eip155`)
      if (namespaceParam === undefined) {
        return err(new BadRequestError(`ChainAccountURL.parse: missing 'namespace' parameter`));
      }
      const referenceParam = AccountId.spec.parameters.values[1]; // reference (e.g. `1`)
      if (referenceParam === undefined) {
        return err(new BadRequestError(`ChainAccountURL.parse: missing 'reference' parameter`));
      }
      const addressParam = AccountId.spec.parameters.values[2]; // address (e.g. `0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb`)
      if (addressParam === undefined) {
        return err(new BadRequestError(`ChainAccountURL.parse: missing 'address' parameter`));
      }

      const regexBody = [namespaceParam.regex, referenceParam.regex, addressParam.regex].join(
        AccountId.spec.parameters.delimiter
      );
      // eslint-disable-next-line security/detect-non-literal-regexp
      const referenceRegex = new RegExp('^' + regexBody + '$');
      if (!referenceRegex.test(remainder)) {
        return err(new BadRequestError(`ChainAccountURL.parse: invalid AccountID`));
      }

      // validate address
      if (accountId.chainId.namespace === 'eip155') {
        try {
          ethers.utils.getAddress(accountId.address);
        } catch {
          return err(new BadRequestError(`ChainAccountURL.parse: invalid Ethereum address provided`));
        }
      }

      return ok(new ChainAccountURL(accountId));
    } catch (e) {
      return err(new ServerError(`ChainAccountURL.parse: unable to parse '${url}'`));
    }
  }

  public constructor(accountId: AccountId) {
    super(accountId.chainId);
    this.address = accountId.address;
  }

  public override toString(): string {
    const accountId = new AccountId({ address: this.address, chainId: this.chainId });
    return BaseChainURL.SCHEME + '://' + accountId.toString();
  }
}
