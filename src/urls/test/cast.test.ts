import { parseUrl, CastURL, FarcasterURL } from '~/urls';

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
    given:
      farcasterURLPrefix +
      'fid:1/cast:0x8f18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce',
    expectUserId: '1',
    expectCastId:
      '0x8f18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce',
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
  'fid:1/cast:0x8f18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce',

  // wrong scheme
  'http://fid:1/cast:0x8f18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce',

  // missing cast hash
  farcasterURLPrefix + 'fid:1/cast:',
  farcasterURLPrefix + 'fid:1/cast',

  // hash is missing leading 0x
  farcasterURLPrefix +
    'fid:1/cast:8f18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce',
  farcasterURLPrefix +
    'fid:1/cast:008f18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce',

  // missing `cast` namespace
  farcasterURLPrefix +
    'fid:1/0x8f18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce',
  farcasterURLPrefix +
    'fid:1/:0x8f18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce',

  // missing separator
  farcasterURLPrefix +
    'fid:1cast:0x8f18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce',

  // incorrect namespace
  farcasterURLPrefix +
    'fid:1/wrongidentifier:0x8f18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce',

  // superfluous prefix
  farcasterURLPrefix +
    'fid:1/prefixcast:0x8f18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce',
  farcasterURLPrefix +
    'fid:1/cast:prefix0x8f18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce',

  // invalid characters in ID
  farcasterURLPrefix +
    'fid:1/cast:0xxxxxfe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce',
  farcasterURLPrefix +
    'fid:1/cast:0x8-18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce',
  farcasterURLPrefix +
    'fid:1/cast:0x8 18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce',

  // invalid trailing slash
  farcasterURLPrefix +
    'fid:1/cast:0x8f18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce/',

  // too long
  farcasterURLPrefix +
    'fid:1/cast:0x8f18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bce0',

  // too short
  farcasterURLPrefix +
    'fid:1/cast:0x8f18fe5e070ad4227899fbdb7440b3e7fa4edd7a0fc71c9817c9611c01cc12b3cd65206d73debffb3a4e9722c4f32fb172b5cff20d723b2dcb72c03873cb0bc',
].map((given) => ({
  given,
  expectParsable: false,
}));

testCases.push(...negativeTestCases);

describe('CastURL', () => {
  test.each(testCases)('$given', ({ given, expectParsable, expectUserId, expectCastId }) => {
    const result = CastURL.parse(given);

    if (expectParsable) {
      expect(result.isOk()).toBe(true);
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
