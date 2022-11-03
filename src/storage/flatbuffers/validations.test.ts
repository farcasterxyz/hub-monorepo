import { Wallet, utils } from 'ethers';
import { generateEd25519KeyPair } from '~/utils/crypto';
import { ValidationError } from '~/utils/errors';
import {
  ALLOWED_CLOCK_SKEW_SECONDS,
  validateCastAddMessage,
  validateCastRemoveMessage,
  validateEd25519PublicKey,
  validateEthAddress,
  validateEthBlockHash,
  validateFid,
  validateMessage,
  validateReactionMessage,
  validateTsHash,
  validateVerificationAddEthAddressMessage,
  validateVerificationRemoveMessage,
} from '~/storage/flatbuffers/validations';
import Factories from '~/test/factories/flatbuffer';
import MessageModel from './messageModel';
import {
  CastAddBodyT,
  FarcasterNetwork,
  HashScheme,
  ReactionBodyT,
  ReactionType,
  SignatureScheme,
  VerificationAddEthAddressBody,
  VerificationAddEthAddressBodyT,
  VerificationRemoveBodyT,
} from '~/utils/generated/message_generated';
import { faker } from '@faker-js/faker';
import { getFarcasterTime } from './utils';
import { KeyPair } from '~/types';
import {
  CastAddModel,
  CastRemoveModel,
  ReactionAddModel,
  ReactionRemoveModel,
  VerificationAddEthAddressModel,
  VerificationEthAddressClaim,
  VerificationRemoveModel,
} from '~/storage/flatbuffers/types';
import { signVerificationEthAddressClaim } from '~/utils/eip712';
import { arrayify } from 'ethers/lib/utils';

let wallet: Wallet;
let signer: KeyPair;

beforeAll(async () => {
  wallet = Wallet.createRandom();
  signer = await generateEd25519KeyPair();
});

describe('validateMessage', () => {
  test('succeeds with Ed25519 signer', async () => {
    const message = new MessageModel(await Factories.Message.create({}, { transient: { signer } }));
    await expect(validateMessage(message)).resolves.toEqual(message);
  });

  test('succeeds with EIP712 signer', async () => {
    const signerAddData = await Factories.SignerAddData.create();
    const message = new MessageModel(
      await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { wallet } })
    );
    await expect(validateMessage(message)).resolves.toEqual(message);
  });

  test('fails with EIP712 signer and non-signer message type', async () => {
    // Default message type is CastAdd
    const message = new MessageModel(await Factories.Message.create({}, { transient: { wallet } }));
    await expect(validateMessage(message)).rejects.toThrow(new ValidationError('invalid signatureScheme'));
  });

  test('fails with Ed25519 signer and signer message type', async () => {
    const signerAddData = await Factories.SignerAddData.create();
    const message = new MessageModel(
      await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { signer } })
    );
    await expect(validateMessage(message)).rejects.toThrow(new ValidationError('invalid signatureScheme'));
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
    const data = await Factories.MessageData.create({ timestamp: getFarcasterTime() + ALLOWED_CLOCK_SKEW_SECONDS + 1 });
    const message = new MessageModel(await Factories.Message.create({ data: Array.from(data.bb?.bytes() ?? []) }));
    await expect(validateMessage(message)).rejects.toThrow(
      new ValidationError('timestamp more than 10 mins in the future')
    );
  });
});

describe('validateFid', () => {
  test('succeeds', () => {
    const fid = Factories.FID.build();
    expect(validateFid(fid)).toEqual(fid);
  });

  test('fails with empty array', () => {
    expect(() => validateFid(new Uint8Array())).toThrow(new ValidationError('fid is missing'));
  });

  test('fails when greater than 32 bytes', () => {
    const fid = Factories.Bytes.build({}, { transient: { length: 33 } });
    expect(() => validateFid(fid)).toThrow(new ValidationError('fid > 32 bytes'));
  });

  test('fails when undefined', () => {
    expect(() => validateFid(undefined)).toThrow(new ValidationError('fid is missing'));
  });
});

describe('validateTsHash', () => {
  test('succeeds', () => {
    const tsHash = Factories.TsHash.build();
    expect(validateTsHash(tsHash)).toEqual(tsHash);
  });

  test('fails with empty array', () => {
    expect(() => validateTsHash(new Uint8Array())).toThrow(new ValidationError('tsHash is missing'));
  });

  test('fails when greater than 8 bytes', () => {
    const tsHash = Factories.Bytes.build({}, { transient: { length: 9 } });
    expect(() => validateTsHash(tsHash)).toThrow(new ValidationError('tsHash must be 8 bytes'));
  });

  test('fails when less than 8 bytes', () => {
    const tsHash = Factories.Bytes.build({}, { transient: { length: 7 } });
    expect(() => validateTsHash(tsHash)).toThrow(new ValidationError('tsHash must be 8 bytes'));
  });

  test('fails when undefined', () => {
    expect(() => validateTsHash(undefined)).toThrow(new ValidationError('tsHash is missing'));
  });
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
  test('succeeds', () => {
    const blockHash = Factories.Bytes.build({}, { transient: { length: 32 } });
    expect(validateEthBlockHash(blockHash)).toEqual(blockHash);
  });

  test('fails when greater than 32 bytes', () => {
    const blockHash = Factories.Bytes.build({}, { transient: { length: 33 } });
    expect(() => validateEthBlockHash(blockHash)).toThrow(new ValidationError('block hash must be 32 bytes'));
  });

  test('fails when less than 32 bytes', () => {
    const blockHash = Factories.Bytes.build({}, { transient: { length: 31 } });
    expect(() => validateEthBlockHash(blockHash)).toThrow(new ValidationError('block hash must be 32 bytes'));
  });

  test('fails when undefined', () => {
    expect(() => validateEthBlockHash(undefined)).toThrow(new ValidationError('block hash is missing'));
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

describe('validateCastAddMessage', () => {
  test('succeeds', async () => {
    const castAddData = await Factories.CastAddData.create();
    const castAdd = new MessageModel(
      await Factories.Message.create({ data: Array.from(castAddData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as CastAddModel;
    expect(validateCastAddMessage(castAdd)).toEqual(castAdd);
  });

  describe('fails', () => {
    let body: CastAddBodyT;
    let validationErrorMessage: string;

    afterEach(async () => {
      const castAddData = await Factories.CastAddData.create({ body });
      const castAdd = new MessageModel(
        await Factories.Message.create({ data: Array.from(castAddData.bb?.bytes() ?? []) }, { transient: { signer } })
      ) as CastAddModel;
      expect(() => validateCastAddMessage(castAdd)).toThrow(new ValidationError(validationErrorMessage));
    });

    test('when text is missing', () => {
      body = Factories.CastAddBody.build({ text: '' });
      validationErrorMessage = 'text is missing';
    });

    test('when text is longer than 320 characters', () => {
      body = Factories.CastAddBody.build({ text: faker.random.alphaNumeric(321) });
      validationErrorMessage = 'text > 320 chars';
    });

    test('with more than 2 embeds', () => {
      body = Factories.CastAddBody.build({
        embeds: [faker.internet.url(), faker.internet.url(), faker.internet.url()],
      });
      validationErrorMessage = 'embeds > 2';
    });

    test('when parent fid is missing', () => {
      body = Factories.CastAddBody.build({
        parent: Factories.CastId.build({ fid: [] }),
      });
      validationErrorMessage = 'fid is missing';
    });

    test('when parent tsHash is missing', () => {
      body = Factories.CastAddBody.build({ parent: Factories.CastId.build({ tsHash: [] }) });
      validationErrorMessage = 'tsHash is missing';
    });

    test('with more than 5 mentions', () => {
      body = Factories.CastAddBody.build({
        mentions: [
          Factories.UserId.build(),
          Factories.UserId.build(),
          Factories.UserId.build(),
          Factories.UserId.build(),
          Factories.UserId.build(),
          Factories.UserId.build(),
        ],
      });
      validationErrorMessage = 'mentions > 5';
    });
  });
});

describe('validateCastRemoveMessage', () => {
  test('succeeds', async () => {
    const castRemoveData = await Factories.CastRemoveData.create();
    const castRemove = new MessageModel(
      await Factories.Message.create({ data: Array.from(castRemoveData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as CastRemoveModel;
    expect(validateCastRemoveMessage(castRemove)).toEqual(castRemove);
  });

  test('fails when tsHash is missing', async () => {
    const castRemoveData = await Factories.CastRemoveData.create({
      body: Factories.CastRemoveBody.build({ targetTsHash: [] }),
    });
    const castRemove = new MessageModel(
      await Factories.Message.create({ data: Array.from(castRemoveData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as CastRemoveModel;
    expect(() => validateCastRemoveMessage(castRemove)).toThrow(new ValidationError('tsHash is missing'));
  });
});

describe('validateReactionMessage', () => {
  test('succeeds with ReactionAdd', async () => {
    const reactionAddData = await Factories.ReactionAddData.create();
    const reactionAdd = new MessageModel(
      await Factories.Message.create({ data: Array.from(reactionAddData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as ReactionAddModel;
    expect(validateReactionMessage(reactionAdd)).toEqual(reactionAdd);
  });

  test('succeeds with ReactionRemove', async () => {
    const reactionRemoveData = await Factories.ReactionRemoveData.create();
    const reactionRemove = new MessageModel(
      await Factories.Message.create(
        { data: Array.from(reactionRemoveData.bb?.bytes() ?? []) },
        { transient: { signer } }
      )
    ) as ReactionRemoveModel;
    expect(validateReactionMessage(reactionRemove)).toEqual(reactionRemove);
  });

  describe('fails', () => {
    let body: ReactionBodyT;
    let validationErrorMessage: string;

    afterEach(async () => {
      const reactionAddData = await Factories.ReactionAddData.create({ body });
      const reactionAdd = new MessageModel(
        await Factories.Message.create(
          { data: Array.from(reactionAddData.bb?.bytes() ?? []) },
          { transient: { signer } }
        )
      ) as ReactionAddModel;
      expect(() => validateReactionMessage(reactionAdd)).toThrow(new ValidationError(validationErrorMessage));
    });

    test('with invalid reaction type', () => {
      body = Factories.ReactionBody.build({ type: 100 as unknown as ReactionType });
      validationErrorMessage = 'invalid reaction type';
    });

    test('when cast fid is missing', () => {
      body = Factories.ReactionBody.build({
        cast: Factories.CastId.build({ fid: [] }),
      });
      validationErrorMessage = 'fid is missing';
    });

    test('when cast tsHash is missing', () => {
      body = Factories.ReactionBody.build({
        cast: Factories.CastId.build({ tsHash: [] }),
      });
      validationErrorMessage = 'tsHash is missing';
    });
  });
});

describe('validateVerificationAddEthAddressMessage', () => {
  test('succeeds', async () => {
    const fid = Factories.FID.build();
    const verificationAddBody = await Factories.VerificationAddEthAddressBody.create({}, { transient: { fid } });
    const verificationAddData = await Factories.VerificationAddEthAddressData.create({
      body: verificationAddBody.unpack(),
      fid: Array.from(fid),
    });
    const verificationAdd = new MessageModel(
      await Factories.Message.create(
        { data: Array.from(verificationAddData.bb?.bytes() ?? []) },
        { transient: { signer } }
      )
    ) as VerificationAddEthAddressModel;
    await expect(validateVerificationAddEthAddressMessage(verificationAdd)).resolves.toEqual(verificationAdd);
  });

  describe('fails', () => {
    const fid = Factories.FID.build();

    let body: VerificationAddEthAddressBodyT;
    let validationErrorMessage: string;

    afterEach(async () => {
      const verificationAddData = await Factories.VerificationAddEthAddressData.create({
        body,
        fid: Array.from(fid),
      });
      const verificationAdd = new MessageModel(
        await Factories.Message.create(
          { data: Array.from(verificationAddData.bb?.bytes() ?? []) },
          { transient: { signer } }
        )
      ) as VerificationAddEthAddressModel;
      await expect(validateVerificationAddEthAddressMessage(verificationAdd)).rejects.toThrow(
        new ValidationError(validationErrorMessage)
      );
    });

    test('with missing eth address', () => {
      body = Factories.VerificationAddEthAddressBody.build({ address: [] });
      validationErrorMessage = 'address is missing';
    });

    test('with invalid eth address', () => {
      body = Factories.VerificationAddEthAddressBody.build({
        address: Array.from(Factories.Bytes.build({}, { transient: { length: 10 } })),
      });
      validationErrorMessage = 'address must be 20 bytes';
    });

    test('with missing block hash', () => {
      body = Factories.VerificationAddEthAddressBody.build({ blockHash: [] });
      validationErrorMessage = 'block hash is missing';
    });

    test('with invalid block hash', () => {
      body = Factories.VerificationAddEthAddressBody.build({
        blockHash: Array.from(Factories.Bytes.build({}, { transient: { length: 10 } })),
      });
      validationErrorMessage = 'block hash must be 32 bytes';
    });

    test('with invalid eth signature', async () => {
      const claim: VerificationEthAddressClaim = {
        fid,
        address: faker.datatype.hexadecimal({ length: 40, case: 'lower' }), // mismatched address
        network: FarcasterNetwork.Testnet,
        blockHash: utils.arrayify(faker.datatype.hexadecimal({ length: 64, case: 'lower' })),
      };
      const signature = await signVerificationEthAddressClaim(claim, wallet);
      body = new VerificationAddEthAddressBodyT(
        Array.from(arrayify(wallet.address)),
        Array.from(signature),
        Array.from(claim.blockHash)
      );
      validationErrorMessage = 'invalid eth signature';
    });
  });
});

describe('validateVerificationRemoveMessage', () => {
  test('succeeds', async () => {
    const verificationRemoveData = await Factories.VerificationRemoveData.create();
    const verificationRemove = new MessageModel(
      await Factories.Message.create(
        { data: Array.from(verificationRemoveData.bb?.bytes() ?? []) },
        { transient: { signer } }
      )
    ) as VerificationRemoveModel;
    expect(validateVerificationRemoveMessage(verificationRemove)).toEqual(verificationRemove);
  });

  describe('fails', () => {
    let body: VerificationRemoveBodyT;
    let validationErrorMessage: string;

    afterEach(async () => {
      const verificationRemoveData = await Factories.VerificationRemoveData.create({ body });
      const verificationRemove = new MessageModel(
        await Factories.Message.create(
          { data: Array.from(verificationRemoveData.bb?.bytes() ?? []) },
          { transient: { signer } }
        )
      ) as VerificationRemoveModel;
      expect(() => validateVerificationRemoveMessage(verificationRemove)).toThrow(
        new ValidationError(validationErrorMessage)
      );
    });

    test('when address is missing', () => {
      body = Factories.VerificationRemoveBody.build({
        address: [],
      });
      validationErrorMessage = 'address is missing';
    });

    test('with invalid address', () => {
      body = Factories.VerificationRemoveBody.build({
        address: Array.from(Factories.Bytes.build({}, { transient: { length: 10 } })),
      });
      validationErrorMessage = 'address must be 20 bytes';
    });
  });
});

describe('validateSignerMessage', () => {
  // TODO
});

describe('validateFollowMessage', () => {
  // TODO
});
