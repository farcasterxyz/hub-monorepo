import { Wallet, utils } from 'ethers';
import { generateEd25519KeyPair } from '~/utils/crypto';
import { ValidationError } from '~/utils/errors';
import { validateEd25519PublicKey, validateEthAddress } from '~/storage/flatbuffers/validations';

describe('validateEthAddress', () => {
  let address: Uint8Array;

  beforeAll(async () => {
    const wallet = Wallet.createRandom();
    address = utils.arrayify(wallet.address);
  });

  test('succeeds', () => {
    expect(validateEthAddress(address)).toEqual(address);
  });

  test('fails with longer address', () => {
    const invalidAddress = new Uint8Array([...address, 1]);
    expect(() => validateEthAddress(invalidAddress)).toThrow(ValidationError);
  });

  test('fails with shorter address', () => {
    const invalidAddress = address.slice(0, -1);
    expect(() => validateEthAddress(invalidAddress)).toThrow(ValidationError);
  });
});

describe('validateEd25519PublicKey', () => {
  let publicKey: Uint8Array;

  beforeAll(async () => {
    const keyPair = await generateEd25519KeyPair();
    publicKey = keyPair.publicKey;
  });

  test('succeeds', () => {
    expect(validateEd25519PublicKey(publicKey)).toEqual(publicKey);
  });

  test('fails with longer key', () => {
    const invalidKey = new Uint8Array([...publicKey, 1]);
    expect(() => validateEd25519PublicKey(invalidKey)).toThrow(ValidationError);
  });

  test('fails with shorter key', () => {
    const invalidKey = publicKey.slice(0, -1);
    expect(() => validateEd25519PublicKey(invalidKey)).toThrow(ValidationError);
  });
});
