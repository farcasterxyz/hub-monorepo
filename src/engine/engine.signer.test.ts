import Engine, { Signer } from '~/engine';
import Faker from 'faker';

const engine = new Engine();

describe('addSignerChange', () => {
  // Change @charlie's signer at block 100.
  const signerChange: Signer = {
    address: Faker.datatype.hexaDecimal(40).toLowerCase(),
    blockHash: Faker.datatype.hexaDecimal(64).toLowerCase(),
    blockNumber: 100,
    logIndex: 12,
  };

  // Change charlie's signer at block 200.
  const signerChange200 = JSON.parse(JSON.stringify(signerChange)) as Signer;
  signerChange200.blockHash = Faker.datatype.hexaDecimal(64).toLowerCase();
  signerChange200.blockNumber = signerChange.blockNumber + 100;

  // Change charlie's signer at block 50.
  const signerChange50A = JSON.parse(JSON.stringify(signerChange)) as Signer;
  signerChange50A.blockHash = Faker.datatype.hexaDecimal(64).toLowerCase();
  signerChange50A.blockNumber = signerChange.blockNumber - 10;

  // Change charlie's signer at block 50, at a higher index.
  const signerChange50B = JSON.parse(JSON.stringify(signerChange50A)) as Signer;
  signerChange50B.logIndex = signerChange.logIndex + 1;

  const duplicateSignerChange50B = JSON.parse(JSON.stringify(signerChange50B)) as Signer;

  const username = 'charlie';
  const subject = () => engine.getSigners(username);

  test('signer changes are added correctly', async () => {
    const result = engine.addSignerChange(username, signerChange);
    expect(result.isOk()).toBe(true);
    expect(subject()).toEqual([signerChange]);
  });

  test('signer changes from later blocks are added after current blocks', async () => {
    const result = engine.addSignerChange(username, signerChange200);
    expect(result.isOk()).toBe(true);
    expect(subject()).toEqual([signerChange, signerChange200]);
  });

  test('signer changes from earlier blocks are before current blocks', async () => {
    const result = engine.addSignerChange(username, signerChange50A);
    expect(result.isOk()).toBe(true);
    expect(subject()).toEqual([signerChange50A, signerChange, signerChange200]);
  });

  test('signer changes in the same block are ordered by index', async () => {
    const result = engine.addSignerChange(username, signerChange50B);
    expect(result.isOk()).toBe(true);
    expect(subject()).toEqual([signerChange50A, signerChange50B, signerChange, signerChange200]);
  });

  test('adding a duplicate signer change fails', async () => {
    const result = engine.addSignerChange(username, duplicateSignerChange50B);
    expect(result.isOk()).toBe(false);
    expect(result._unsafeUnwrapErr()).toBe(
      `addSignerChange: duplicate signer change ${signerChange50B.blockHash}:${signerChange50B.logIndex}`
    );
    expect(subject()).toEqual([signerChange50A, signerChange50B, signerChange, signerChange200]);
  });
});
