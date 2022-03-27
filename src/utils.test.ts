import { hashFCObject } from '~/utils';

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
