import { Wallet, utils } from 'ethers';
import { generateEd25519KeyPair } from '~/utils/crypto';
import { ValidationError } from '~/utils/errors';
import {
  ALLOWED_CLOCK_SKEW,
  validateEd25519PublicKey,
  validateEthAddress,
  validateMessage,
} from '~/storage/flatbuffers/validations';
import Factories from '~/test/factories/flatbuffer';
import MessageModel from './messageModel';
import { HashScheme, Message, SignatureScheme } from '~/utils/generated/message_generated';
import { faker } from '@faker-js/faker';

describe('validateMessage', () => {
  test('succeeds', async () => {
    const message = new MessageModel(await Factories.Message.create());
    await expect(validateMessage(message)).resolves.toEqual(message);
  });

  test('fails with invalid hashScheme', async () => {
    const message = new MessageModel(
      await Factories.Message.create({ hashScheme: 10 as unknown as HashScheme.Blake2b })
    );
    await expect(validateMessage(message)).rejects.toThrow(new ValidationError('invalid hashScheme'));
  });

  test('fails with invalid hash', async () => {
    const message = new MessageModel(
      await Factories.Message.create({ hash: Array.from(utils.arrayify(faker.datatype.hexadecimal({ length: 8 }))) })
    );
    await expect(validateMessage(message)).rejects.toThrow(new ValidationError('invalid hash'));
  });

  test('fails with invalid signatureScheme', async () => {
    const message = new MessageModel(
      await Factories.Message.create({ signatureScheme: 10 as unknown as SignatureScheme.Ed25519 })
    );
    await expect(validateMessage(message)).rejects.toThrow(new ValidationError('invalid signatureScheme'));
  });

  test('fails with invalid signature', async () => {
    const message = new MessageModel(
      await Factories.Message.create({
        signature: Array.from(utils.arrayify(faker.datatype.hexadecimal({ length: 128 }))),
        signer: Array.from(utils.arrayify(faker.datatype.hexadecimal({ length: 64 }))),
      })
    );
    await expect(validateMessage(message)).rejects.toThrow(new ValidationError('invalid signature'));
  });

  test('fails with timestamp more than 10 mins in the future', async () => {
    const data = await Factories.MessageData.create({ timestamp: faker.date.soon().getTime() + ALLOWED_CLOCK_SKEW });
    const message = new MessageModel(await Factories.Message.create({ data: Array.from(data.bb?.bytes() ?? []) }));
    await expect(validateMessage(message)).rejects.toThrow(
      new ValidationError('timestamp more than 10 mins in the future')
    );
  });
});

describe('validateFid', () => {
  // TODO: above 256 bits
  // TODO: missing
});

describe('validateTsHash', () => {
  // TODO: missing
  // TODO: 8 bytes
});

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

describe('validateEthBlockHash', () => {
  // TODO
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
