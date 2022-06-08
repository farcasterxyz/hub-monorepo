import { ChainURL, parseUrl } from '~/urls';

const chainURLPrefix = ChainURL.SCHEME + '://';

interface ParserTestCase {
  given: string;
  expectParsable: boolean;
  expectChainId?: string;
}

type PositiveTestCase = Required<Omit<ParserTestCase, 'expectParsable'>>;

const testCases = new Array<ParserTestCase>();

const positiveTestCases: Array<PositiveTestCase> = [
  {
    given: chainURLPrefix + 'eip155:1',
    expectChainId: 'eip155:1',
  },
  {
    given: chainURLPrefix + 'bip122:000000000019d6689c085ae165831e93',
    expectChainId: 'bip122:000000000019d6689c085ae165831e93',
  },
  {
    // Litecoin
    given: chainURLPrefix + 'bip122:12a765e31ffd4059bada1e25190f6e98',
    expectChainId: 'bip122:12a765e31ffd4059bada1e25190f6e98',
  },
  {
    // Feathercoin (Litecoin fork)
    given: chainURLPrefix + 'bip122:fdbe99b90c90bae7505796461471d89a',
    expectChainId: 'bip122:fdbe99b90c90bae7505796461471d89a',
  },
  {
    // Cosmos Hub (Tendermint + Cosmos SDK)
    given: chainURLPrefix + 'cosmos:cosmoshub-2',
    expectChainId: 'cosmos:cosmoshub-2',
  },
  {
    // Cosmos Hub (Tendermint + Cosmos SDK)
    given: chainURLPrefix + 'cosmos:cosmoshub-3',
    expectChainId: 'cosmos:cosmoshub-3',
  },
  {
    // Binance chain (Tendermint + Cosmos SDK; see https://dataseed5.defibit.io/genesis)
    given: chainURLPrefix + 'cosmos:Binance-Chain-Tigris',
    expectChainId: 'cosmos:Binance-Chain-Tigris',
  },
  {
    // IOV Mainnet (Tendermint + weave)
    given: chainURLPrefix + 'cosmos:iov-mainnet',
    expectChainId: 'cosmos:iov-mainnet',
  },
  {
    // Lisk Mainnet (LIP-0009; see https://github.com/LiskHQ/lips/blob/master/proposals/lip-0009.md)
    given: chainURLPrefix + 'lip9:9ee11e9df416b18b',
    expectChainId: 'lip9:9ee11e9df416b18b',
  },
  {
    // Dummy max length (8+1+32 = 41 chars/bytes)
    given: chainURLPrefix + 'chainstd:8c3444cf8970a9e41a706fab93e7a6c4',
    expectChainId: 'chainstd:8c3444cf8970a9e41a706fab93e7a6c4',
  },
];

testCases.push(
  ...positiveTestCases.map((testCase) => ({
    ...testCase,
    expectParsable: true,
  }))
);

const negativeTestCases: Array<ParserTestCase> = [
  // missing scheme
  'eip155:1',

  // wrong scheme
  'http://eip155:1',

  // invalid prefix before scheme
  'prefix/' + chainURLPrefix + 'eip155:1',
  'prefix:' + chainURLPrefix + 'eip155:1',
  'prefix-' + chainURLPrefix + 'eip155:1',
  'prefix' + chainURLPrefix + 'eip155:1',

  // invalid extra data before chain ID
  chainURLPrefix + 'eip155: 1',
  chainURLPrefix + 'eip155:.1',

  // invalid extra data after chain ID
  chainURLPrefix + 'eip155:1:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
  chainURLPrefix + 'eip155:1/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',

  // missing value
  chainURLPrefix + 'eip155:',
  chainURLPrefix + 'eip155',

  // missing namespace
  chainURLPrefix + '1',
  chainURLPrefix + ':1',

  // missing separator
  chainURLPrefix + 'eip1551',

  // invalid trailing slash
  chainURLPrefix + 'eip155:1/',
].map((given) => ({
  given,
  expectParsable: false,
}));

testCases.push(...negativeTestCases);

describe('ChainURL', function () {
  test.each(testCases)('$given', function ({ given, expectParsable, expectChainId }) {
    const result = ChainURL.parse(given);

    if (expectParsable) {
      const chainURL = result._unsafeUnwrap();
      expect(chainURL.chainId.toString()).toEqual(expectChainId);

      // check that it serializes back to the same original string
      expect(chainURL.toString()).toEqual(given);

      // check that parsing indirectly from `parseUrl` also works
      expect(parseUrl(given)).toEqual(result);
    } else {
      expect(result.isErr()).toEqual(true);
    }
  });
});
