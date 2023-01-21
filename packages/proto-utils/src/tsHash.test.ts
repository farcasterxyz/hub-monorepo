import { bytesCompare } from './bytes';
import { HubError } from './errors';
import { Factories } from './factories';
import { toFarcasterTime } from './time';
import { makeTsHash } from './tsHash';

const farcasterTimeNow = toFarcasterTime(Date.now())._unsafeUnwrap();

test('stores timestamp in big-endian order', () => {
  const hash = Factories.Bytes.build({}, { transient: { length: 16 } });
  const a = makeTsHash(farcasterTimeNow, hash)._unsafeUnwrap();
  const b = makeTsHash(farcasterTimeNow + 1, hash)._unsafeUnwrap();
  expect(bytesCompare(a, b)).toEqual(-1);
});

test('is fixed size, even with small timestamp', () => {
  const hash = Factories.Bytes.build({}, { transient: { length: 16 } });
  const tsHash = makeTsHash(1, hash)._unsafeUnwrap();
  expect(tsHash.length).toEqual(20);
});

test('fails if timestamp cannot fit in 4 bytes', () => {
  const time = Date.now();
  const hash = Factories.Bytes.build({}, { transient: { length: 16 } });
  const tsHash = makeTsHash(time, hash);
  expect(tsHash._unsafeUnwrapErr()).toEqual(new HubError('bad_request.invalid_param', 'timestamp > 4 bytes'));
});
