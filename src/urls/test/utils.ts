// eslint-disable-next-line prefer-arrow-functions/prefer-arrow-functions
export function expectInstanceOf<T>(obj: any, Klass: new (...args: any[]) => T): asserts obj is T {
  expect(obj).toBeInstanceOf(Klass);
}
