import { hashFCObject, hashCompare } from '~/utils';

describe('hashFCObject', () => {
  const keccakEmptyObject = '0xb48d38f93eaa084033fc5970bf96e559c33c4cdc07d889ab00b4d63f9590739d';

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

  const keccakSimpleObject = '0xe65bac56b00ed02f3672b7f1e0ed5e77f7f0a56d51c0fbdf1af696ae140006fa';

  test('hashes empty object correctly', async () => {
    const hash = hashFCObject({});

    expect(hash).toEqual(keccakEmptyObject);
  });

  test('hashes ordered objects correctly', async () => {
    const hash = hashFCObject(simpleObject);
    expect(hash).toEqual(keccakSimpleObject);
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

    const hash = hashFCObject(reorderedObject);
    expect(hash).toEqual(keccakSimpleObject);
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
    const hash = hashFCObject(underscoredObject);
    expect(hash).toEqual(keccakSimpleObject);
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
