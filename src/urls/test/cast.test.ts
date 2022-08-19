import { parseUrl, CastURL } from '~/urls';
import { FarcasterURL } from '~/urls/baseUrl';

const farcasterURLPrefix = FarcasterURL.SCHEME + '://';

interface ParserTestCase {
  given: string;
  expectParsable: boolean;
  expectUserId?: string;
  expectCastId?: string;
}

type PositiveTestCase = Required<Omit<ParserTestCase, 'expectParsable'>>;

const testCases = new Array<ParserTestCase>();

const positiveTestCases: Array<PositiveTestCase> = [
  {
    given: farcasterURLPrefix + 'fid:1/cast:0x508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982',
    expectUserId: '1',
    expectCastId: '0x508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982',
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
  'fid:1/cast:0x508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982',

  // wrong scheme
  'http://fid:1/cast:0x508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982',

  // missing cast hash
  farcasterURLPrefix + 'fid:1/cast:',
  farcasterURLPrefix + 'fid:1/cast',

  // hash is missing leading 0x
  farcasterURLPrefix + 'fid:1/cast:508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982',
  farcasterURLPrefix + 'fid:1/cast:00508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982',

  // missing `cast` namespace
  farcasterURLPrefix + 'fid:1/0x508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982',
  farcasterURLPrefix + 'fid:1/:0x508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982',

  // missing separator
  farcasterURLPrefix + 'fid:1cast:0x508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982',

  // incorrect namespace
  farcasterURLPrefix + 'fid:1/wrongidentifier:0x508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982',

  // superfluous prefix
  farcasterURLPrefix + 'fid:1/prefixcast:0x508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c866759821',
  farcasterURLPrefix + 'fid:1/cast:prefix0x508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c866759821',

  // invalid characters in ID
  farcasterURLPrefix + 'fid:1/cast:0xxxxxxxxx327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982',
  farcasterURLPrefix + 'fid:1/cast:0x5-8c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982',
  farcasterURLPrefix + 'fid:1/cast:0x5 8c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982',

  // invalid trailing slash
  farcasterURLPrefix + 'fid:1/cast:0x508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c86675982/',

  // too long
  farcasterURLPrefix + 'fid:1/cast:0x508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c866759820',

  // too short
  farcasterURLPrefix + 'fid:1/cast:0x508c5e8c327c14e2e1a72ba34eeb452f37458b209ed63a294d999b4c8667598',
].map((given) => ({
  given,
  expectParsable: false,
}));

testCases.push(...negativeTestCases);

describe('CastURL', () => {
  test.each(testCases)('$given', ({ given, expectParsable, expectUserId, expectCastId }) => {
    const result = CastURL.parse(given);

    if (expectParsable) {
      const castURL = result._unsafeUnwrap();
      expect(castURL.castId.userId.value).toEqual(expectUserId);
      expect(castURL.castId.castHash.value).toEqual(expectCastId);

      // check that it serializes back to the same original string
      expect(castURL.toString()).toEqual(given);

      // check that parsing indirectly from `parseUrl` also works
      expect(parseUrl(given)).toEqual(result);
    } else {
      expect(result.isErr()).toEqual(true);
    }
  });
});
