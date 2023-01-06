import { bytesCompare } from './bytes';
import { Factories } from './factories';
import { toFarcasterTime } from './time';
import { toTsHash } from './tsHash';

test('stores timestamp in big-endian order', () => {
  const time = toFarcasterTime(Date.now());
  const hash = Factories.Bytes.build({}, { transient: { length: 16 } });
  const a = toTsHash(time, hash);
  const b = toTsHash(time + 1, hash);
  expect(bytesCompare(a, b)).toEqual(-1);
});

test('is fixed size, even with small timestamp', () => {
  const hash = Factories.Bytes.build({}, { transient: { length: 16 } });
  const tsHash = toTsHash(1, hash);
  expect(tsHash.length).toEqual(20);
});
