import { parseUrl, UnrecognizedURL } from '~/urls';
import { expectInstanceOf } from '~/urls/test/utils';

describe('URLs', () => {
  test('Missing scheme', () => {
    const result = parseUrl('path/without/scheme');
    expect(result._unsafeUnwrapErr()).toContain('URL is missing scheme');
  });

  test('Unrecognized scheme', () => {
    const unrecognizedURLStr = 'mailto:johndoe@example.com';

    let result = parseUrl(unrecognizedURLStr, { allowUnrecognized: true });
    const unrecognizedUrl = result._unsafeUnwrap();
    expectInstanceOf(unrecognizedUrl, UnrecognizedURL);
    expect(unrecognizedUrl.scheme).toEqual('mailto');
    expect(unrecognizedUrl.fullURL).toEqual(unrecognizedURLStr);
    expect(unrecognizedUrl.toString()).toEqual(unrecognizedURLStr);

    result = parseUrl(unrecognizedURLStr, { allowUnrecognized: false });
    expect(result._unsafeUnwrapErr()).toContain('Unrecognized scheme');
  });
});
