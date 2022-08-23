import { ChainURL, parseUrl } from '~/urls';
import { ChainAccountURL } from '~/urls/chainAccountUrl';

const chainURLPrefix = ChainURL.SCHEME + '://';

interface ParserTestCase {
  given: string;
  expectParsable: boolean;
  expectChainId?: string;
  expectAddress?: string;
}

type PositiveTestCase = Required<Omit<ParserTestCase, 'expectParsable'>>;

const testCases = new Array<ParserTestCase>();

const positiveTestCases: Array<PositiveTestCase> = [
  // Ethereum mainnet
  {
    given: chainURLPrefix + 'eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
    expectChainId: 'eip155:1',
    expectAddress: '0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
  },
  // Ethereum mainnet mixed case
  {
    given: chainURLPrefix + 'eip155:1:0xab16a96D359eC26a11e2C2b3d8f8B8942d5Bfcdb',
    expectChainId: 'eip155:1',
    expectAddress: '0xab16a96D359eC26a11e2C2b3d8f8B8942d5Bfcdb',
  },
  // Bitcoin mainnet
  {
    given: chainURLPrefix + 'bip122:000000000019d6689c085ae165831e93:128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
    expectChainId: 'bip122:000000000019d6689c085ae165831e93',
    expectAddress: '128Lkh3S7CkDTBZ8W7BbpsN3YYizJMp8p6',
  },
  {
    // Cosmos Hub (Tendermint + Cosmos SDK)
    given: chainURLPrefix + 'cosmos:cosmoshub-3:cosmos1t2uflqwqe0fsj0shcfkrvpukewcw40yjj6hdc0',
    expectChainId: 'cosmos:cosmoshub-3',
    expectAddress: 'cosmos1t2uflqwqe0fsj0shcfkrvpukewcw40yjj6hdc0',
  },
  {
    // Kusama Network
    given:
      chainURLPrefix + 'polkadot:b0a8d493285c2df73290dfb7e61f870f:5hmuyxw9xdgbpptgypokw4thfyoe3ryenebr381z9iaegmfy',
    expectChainId: 'polkadot:b0a8d493285c2df73290dfb7e61f870f',
    expectAddress: '5hmuyxw9xdgbpptgypokw4thfyoe3ryenebr381z9iaegmfy',
  },
  {
    // Dummy max length (64+1+8+1+32 = 106 chars/bytes)
    given:
      chainURLPrefix +
      'chainstd:8c3444cf8970a9e41a706fab93e7a6c4:6d9b0b4b9994e8a6afbd3dc3ed983cd51c755afb27cd1dc7825ef59c134a39f7',
    expectChainId: 'chainstd:8c3444cf8970a9e41a706fab93e7a6c4',
    expectAddress: '6d9b0b4b9994e8a6afbd3dc3ed983cd51c755afb27cd1dc7825ef59c134a39f7',
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
  'eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',

  // wrong scheme
  'http://eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',

  // invalid prefix before scheme
  'prefix/' + chainURLPrefix + 'eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
  'prefix:' + chainURLPrefix + 'eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
  'prefix-' + chainURLPrefix + 'eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
  'prefix' + chainURLPrefix + 'eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',

  // invalid extra data before chain ID
  chainURLPrefix + 'eip155: 1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
  chainURLPrefix + 'eip155:.1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',

  // invalid extra data after chain ID
  chainURLPrefix + 'eip155:1/:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',

  // invalid extra data before address
  chainURLPrefix + 'eip155:1: 0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
  chainURLPrefix + 'eip155:1:.0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',

  // invalid extra data after address
  chainURLPrefix + 'eip155:1:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2:foo',
  chainURLPrefix + 'eip155:1:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/',

  // missing address
  chainURLPrefix + 'eip155:1:',
  chainURLPrefix + 'eip155:1',

  // missing namespace
  chainURLPrefix + '1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',
  chainURLPrefix + ':1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',

  // missing separator
  chainURLPrefix + 'eip15510xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdb',

  // invalid Ethereum address
  chainURLPrefix + 'eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcd', // too short
  chainURLPrefix + 'eip155:1:0xab16a96d359ec26a11e2c2b3d8f8b8942d5bfcdba', // too long
  chainURLPrefix + 'eip155:1:0xzzzza96d359ec26a11e2c2b3d8f8b8942d5bfcdb', // invalid `z` characters
  chainURLPrefix + 'eip155:1:0x8Ba1f109551bD432803012645Ac136ddd64DBA72', // incorrect checksum
].map((given) => ({
  given,
  expectParsable: false,
}));

testCases.push(...negativeTestCases);

describe('ChainAccountURL', () => {
  test.each(testCases)('$given', ({ given, expectParsable, expectChainId, expectAddress }) => {
    const result = ChainAccountURL.parse(given);

    if (expectParsable) {
      const chainAccountURL = result._unsafeUnwrap();
      expect(chainAccountURL.chainId.toString()).toEqual(expectChainId);
      expect(chainAccountURL.address.toString()).toEqual(expectAddress);

      // check that it serializes back to the same original string
      expect(chainAccountURL.toString()).toEqual(given);

      // check that parsing indirectly from `parseUrl` also works
      expect(parseUrl(given)).toEqual(result);
    } else {
      expect(result.isErr()).toEqual(true);
    }
  });
});
