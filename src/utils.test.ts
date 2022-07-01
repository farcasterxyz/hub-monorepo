import { hashFCObject, hashCompare } from '~/utils';

describe('hashFCObject', () => {
  const blake2bEmptyObject =
    '0x9327a492264ecac0806b031b780241d86cabe38348fe49c4c5a610ee584cfbaaefd3fdffd1b1b54c9ee225820433a7f902c688b2e123181a56c73b9cbf9cd13f';

  const simpleObject = {
    cat: {
      name: 'Fluffy',
      age: 3,
    },
    dog: {
      name: 'Fido',
      age: 2,
    },
  };

  const blake2bSimpleObject =
    '0x664ea872832e83efb1a907a2d1d7e817cf181ff40084109c917e8199302b7d0612b278c5ff35b0c783f6f8c06b506a5c3edbae54a3f4dbc1b1218cf4a1a1c646';

  test('hashes empty object correctly', async () => {
    const hash = await hashFCObject({});

    expect(hash).toEqual(blake2bEmptyObject);
  });

  test('hashes ordered objects correctly', async () => {
    const hash = await hashFCObject(simpleObject);
    expect(hash).toEqual(blake2bSimpleObject);
  });

  test('re-orders objects before hashing them', async () => {
    const reorderedObject = {
      dog: {
        age: 2,
        name: 'Fido',
      },
      cat: {
        name: 'Fluffy',
        age: 3,
      },
    };

    const hash = await hashFCObject(reorderedObject);
    expect(hash).toEqual(blake2bSimpleObject);
  });

  test('removes underscore keys before hashing objects', async () => {
    const underscoredObject = {
      _mouse: {
        name: 'Mickey',
      },
      cat: {
        _color: 'black',
        name: 'Fluffy',
        age: 3,
      },
      dog: {
        age: 2,
        name: 'Fido',
      },
    };
    const hash = await hashFCObject(underscoredObject);
    expect(hash).toEqual(blake2bSimpleObject);
  });
});

describe('hashCompare', () => {
  test('compare strings of the same length, lower one first', async () => {
    const cmp = hashCompare('hello', 'world');
    expect(cmp).toBeLessThan(0);
  });

  test('compare strings of the same length, higher one first', async () => {
    const cmp = hashCompare('world', 'hello');
    expect(cmp).toBeGreaterThan(0);
  });

  test('compare strings of the same length, equal', async () => {
    const cmp = hashCompare('hello', 'hello');
    expect(cmp).toEqual(0);
  });

  test('compare strings first input is null', async () => {
    const cmp = hashCompare('', 'world');
    expect(cmp).toBeLessThan(0);
  });

  test('compare strings second input is null', async () => {
    const cmp = hashCompare('hello', '');
    expect(cmp).toBeGreaterThan(0);
  });

  test('compare strings first input has additional char', async () => {
    const cmp = hashCompare('helloa', 'hello');
    expect(cmp).toBeGreaterThan(0);
  });

  test('compare strings second input has additional char', async () => {
    const cmp = hashCompare('hello', 'helloa');
    expect(cmp).toBeLessThan(0);
  });

  test('compare strings second input has additional char', async () => {
    const cmp = hashCompare('a', 'A');
    expect(cmp).toBeGreaterThan(0);
  });

  test('compare strings first input is uppercase second input is lower case', async () => {
    const cmp = hashCompare('A', 'a');
    expect(cmp).toBeLessThan(0);
  });
});
