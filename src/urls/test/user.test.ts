import { FarcasterURL, UserURL, parseUrl } from '~/urls';

const farcasterURLPrefix = FarcasterURL.SCHEME + '://';

interface ParserTestCase {
  given: string;
  expectParsable: boolean;
  expectUserId?: string;
}

const positiveTestCases: Array<ParserTestCase> = [
  {
    given: farcasterURLPrefix + 'id:1',
    expectUserId: '1',
  },
  {
    given: farcasterURLPrefix + 'id:8789213729',
    expectUserId: '8789213729',
  },
  {
    // Uint256Max as User ID
    given: farcasterURLPrefix + 'id:115792089237316195423570985008687907853269984665640564039457584007913129639935',
    expectUserId: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
  },
].map((testCase) => ({
  ...testCase,
  expectParsable: true,
}));

const negativeTestCases: Array<ParserTestCase> = [
  // missing scheme
  'id:1',

  // wrong scheme
  'http://id:1',

  // missing value
  farcasterURLPrefix + 'id:',
  farcasterURLPrefix + 'id',

  // leading zeroes not permitted
  farcasterURLPrefix + 'id:01',

  // zero ID not allowed
  farcasterURLPrefix + 'id:0',

  // missing `id` namespace
  farcasterURLPrefix + '1',

  // missing separator
  farcasterURLPrefix + 'id1',

  // incorrect namespace
  farcasterURLPrefix + 'identifier:1',

  // superfluous suffix
  farcasterURLPrefix + 'id:123suffix',

  // superfluous prefix
  farcasterURLPrefix + 'prefixid:1',

  // invalid characters in ID
  farcasterURLPrefix + 'id:123a123',
  farcasterURLPrefix + 'id:123-123',
  farcasterURLPrefix + 'id:123 123',
  farcasterURLPrefix + 'id:-1',

  // invalid trailing slash
  farcasterURLPrefix + 'id:1/',

  // too long
  farcasterURLPrefix + 'id:1157920892373161954235709850086879078532699846656405640394575840079131296399350',
].map((given) => ({
  given,
  expectParsable: false,
}));

const testCases = [...positiveTestCases, ...negativeTestCases];

describe('UserURL', () => {
  test.each(testCases)('$given', ({ given, expectParsable, expectUserId }) => {
    const result = UserURL.parse(given);

    if (expectParsable) {
      const userURL = result._unsafeUnwrap();
      expect(userURL.farcasterId.value).toEqual(expectUserId);

      // check that it serializes back to the same original string
      expect(userURL.toString()).toEqual(given);

      // check that parsing indirectly from `parseUrl` also works
      expect(parseUrl(given)).toEqual(result);
    } else {
      expect(result.isErr()).toEqual(true);
    }
  });
});
