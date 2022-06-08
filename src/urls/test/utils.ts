export function expectInstanceOf<T>(obj: any, Klass: new (...args: any[]) => T): asserts obj is T {
  expect(obj).toBeInstanceOf(Klass);
}
