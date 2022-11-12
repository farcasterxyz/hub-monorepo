import { Wallet, utils } from 'ethers';
import { generateEd25519KeyPair } from '~/utils/crypto';
import {
  ALLOWED_CLOCK_SKEW_SECONDS,
  validateCastAddMessage,
  validateCastId,
  validateCastRemoveMessage,
  validateEd25519PublicKey,
  validateEthAddress,
  validateEthBlockHash,
  validateFid,
  validateFollowMessage,
  validateMessage,
  validateReactionMessage,
  validateSignerMessage,
  validateTsHash,
  validateUserDataAddMessage,
  validateVerificationAddEthAddressMessage,
  validateVerificationRemoveMessage,
} from '~/storage/flatbuffers/validations';
import Factories from '~/test/factories/flatbuffer';
import MessageModel from './messageModel';
import {
  CastAddBodyT,
  FarcasterNetwork,
  FollowBodyT,
  HashScheme,
  ReactionBodyT,
  ReactionType,
  SignatureScheme,
  SignerBodyT,
  UserDataBodyT,
  UserDataType,
  UserIdT,
  VerificationAddEthAddressBodyT,
  VerificationRemoveBodyT,
} from '~/utils/generated/message_generated';
import { faker } from '@faker-js/faker';
import { getFarcasterTime } from './utils';
import { KeyPair } from '~/types';
import {
  CastAddModel,
  CastRemoveModel,
  FollowAddModel,
  FollowRemoveModel,
  ReactionAddModel,
  ReactionRemoveModel,
  SignerAddModel,
  SignerRemoveModel,
  UserDataAddModel,
  VerificationAddEthAddressModel,
  VerificationEthAddressClaim,
  VerificationRemoveModel,
} from '~/storage/flatbuffers/types';
import { signVerificationEthAddressClaim } from '~/utils/eip712';
import { arrayify } from 'ethers/lib/utils';
import { HubError } from '~/utils/hubErrors';

let wallet: Wallet;
let signer: KeyPair;

beforeAll(async () => {
  wallet = Wallet.createRandom();
  signer = await generateEd25519KeyPair();
});

describe('validateMessage', () => {
  test('succeeds with Ed25519 signer', async () => {
    const message = new MessageModel(await Factories.Message.create({}, { transient: { signer } }));
    const result = await validateMessage(message);
    expect(result._unsafeUnwrap()).toEqual(message);
  });

  test('succeeds with EIP712 signer', async () => {
    const signerAddData = await Factories.SignerAddData.create();
    const message = new MessageModel(
      await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { wallet } })
    );
    const result = await validateMessage(message);
    expect(result._unsafeUnwrap()).toEqual(message);
  });

  test('fails with EIP712 signer and non-signer message type', async () => {
    // Default message type is CastAdd
    const message = new MessageModel(await Factories.Message.create({}, { transient: { wallet } }));
    const result = await validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'invalid signatureScheme')
    );
  });

  test('fails with Ed25519 signer and signer message type', async () => {
    const signerAddData = await Factories.SignerAddData.create();
    const message = new MessageModel(
      await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { signer } })
    );
    const result = await validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'invalid signatureScheme')
    );
  });

  test('fails with invalid hashScheme', async () => {
    const message = new MessageModel(
      await Factories.Message.create({ hashScheme: 10 as unknown as HashScheme.Blake3 })
    );
    const result = await validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid hashScheme'));
  });

  test('fails with invalid hash', async () => {
    const message = new MessageModel(
      await Factories.Message.create({ hash: Array.from(utils.arrayify(faker.datatype.hexadecimal({ length: 8 }))) })
    );
    const result = await validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid hash'));
  });

  test('fails with invalid signatureScheme', async () => {
    const message = new MessageModel(
      await Factories.Message.create({ signatureScheme: 10 as unknown as SignatureScheme.Ed25519 })
    );
    const result = await validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'invalid signatureScheme')
    );
  });

  test('fails with invalid signature', async () => {
    const message = new MessageModel(
      await Factories.Message.create({
        signature: Array.from(utils.arrayify(faker.datatype.hexadecimal({ length: 128 }))),
        signer: Array.from(utils.arrayify(faker.datatype.hexadecimal({ length: 64 }))),
      })
    );
    const result = await validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid signature'));
  });

  test('fails with timestamp more than 10 mins in the future', async () => {
    const data = await Factories.MessageData.create({ timestamp: getFarcasterTime() + ALLOWED_CLOCK_SKEW_SECONDS + 1 });
    const message = new MessageModel(await Factories.Message.create({ data: Array.from(data.bb?.bytes() ?? []) }));
    const result = await validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'timestamp more than 10 mins in the future')
    );
  });
});

describe('validateFid', () => {
  test('succeeds', () => {
    const fid = Factories.FID.build();
    expect(validateFid(fid)._unsafeUnwrap()).toEqual(fid);
  });

  test('fails with empty array', () => {
    expect(validateFid(new Uint8Array())._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'fid is missing')
    );
  });

  test('fails when greater than 32 bytes', () => {
    const fid = Factories.Bytes.build({}, { transient: { length: 33 } });
    expect(validateFid(fid)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'fid > 32 bytes')
    );
  });

  test('fails when undefined', () => {
    expect(validateFid(undefined)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'fid is missing')
    );
  });
});

describe('validateTsHash', () => {
  test('succeeds', () => {
    const tsHash = Factories.TsHash.build();
    expect(validateTsHash(tsHash)._unsafeUnwrap()).toEqual(tsHash);
  });

  test('fails with empty array', () => {
    expect(validateTsHash(new Uint8Array())._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'tsHash is missing')
    );
  });

  test('fails when greater than 20 bytes', () => {
    const tsHash = Factories.Bytes.build({}, { transient: { length: 21 } });
    expect(validateTsHash(tsHash)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'tsHash must be 20 bytes')
    );
  });

  test('fails when less than 20 bytes', () => {
    const tsHash = Factories.Bytes.build({}, { transient: { length: 19 } });
    expect(validateTsHash(tsHash)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'tsHash must be 20 bytes')
    );
  });

  test('fails when undefined', () => {
    expect(validateTsHash(undefined)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'tsHash is missing')
    );
  });
});

describe('validateCastId', () => {
  test('succeeds', async () => {
    const castId = await Factories.CastId.create();
    expect(validateCastId(castId)._unsafeUnwrap()).toEqual(castId);
  });

  test('fails when fid is invalid', async () => {
    const castId = await Factories.CastId.create({ fid: [] });
    expect(validateCastId(castId)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'fid is missing')
    );
  });

  test('fails when tsHash is invalid', async () => {
    const castId = await Factories.CastId.create({ tsHash: [] });
    expect(validateCastId(castId)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'tsHash is missing')
    );
  });

  test('fails when both fid and tsHash are invalid', async () => {
    const castId = await Factories.CastId.create({ fid: [], tsHash: [] });
    expect(validateCastId(castId)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'fid is missing, tsHash is missing')
    );
  });
});

describe('validateEthAddress', () => {
  let address: Uint8Array;

  beforeAll(async () => {
    const wallet = Wallet.createRandom();
    address = utils.arrayify(wallet.address);
  });

  test('succeeds', () => {
    expect(validateEthAddress(address)._unsafeUnwrap()).toEqual(address);
  });

  test('fails with longer address', () => {
    const invalidAddress = new Uint8Array([...address, 1]);
    expect(validateEthAddress(invalidAddress)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'address must be 20 bytes')
    );
  });

  test('fails with shorter address', () => {
    const invalidAddress = address.slice(0, -1);
    expect(validateEthAddress(invalidAddress)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'address must be 20 bytes')
    );
  });
});

describe('validateEthBlockHash', () => {
  test('succeeds', () => {
    const blockHash = Factories.Bytes.build({}, { transient: { length: 32 } });
    expect(validateEthBlockHash(blockHash)._unsafeUnwrap()).toEqual(blockHash);
  });

  test('fails when greater than 32 bytes', () => {
    const blockHash = Factories.Bytes.build({}, { transient: { length: 33 } });
    expect(validateEthBlockHash(blockHash)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'blockHash must be 32 bytes')
    );
  });

  test('fails when less than 32 bytes', () => {
    const blockHash = Factories.Bytes.build({}, { transient: { length: 31 } });
    expect(validateEthBlockHash(blockHash)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'blockHash must be 32 bytes')
    );
  });

  test('fails when undefined', () => {
    expect(validateEthBlockHash(undefined)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'blockHash is missing')
    );
  });
});

describe('validateEd25519PublicKey', () => {
  let publicKey: Uint8Array;

  beforeAll(async () => {
    const keyPair = await generateEd25519KeyPair();
    publicKey = keyPair.publicKey;
  });

  test('succeeds', () => {
    expect(validateEd25519PublicKey(publicKey)._unsafeUnwrap()).toEqual(publicKey);
  });

  test('fails with longer key', () => {
    const invalidKey = new Uint8Array([...publicKey, 1]);
    expect(validateEd25519PublicKey(invalidKey)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'publicKey must be 32 bytes')
    );
  });

  test('fails with shorter key', () => {
    const invalidKey = publicKey.slice(0, -1);
    expect(validateEd25519PublicKey(invalidKey)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'publicKey must be 32 bytes')
    );
  });
});

describe('validateCastAddMessage', () => {
  test('succeeds', async () => {
    const castAddData = await Factories.CastAddData.create();
    const castAdd = new MessageModel(
      await Factories.Message.create({ data: Array.from(castAddData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as CastAddModel;
    expect(validateCastAddMessage(castAdd)._unsafeUnwrap()).toEqual(castAdd);
  });

  describe('fails', () => {
    let body: CastAddBodyT;
    let hubErrorMessage: string;

    afterEach(async () => {
      const castAddData = await Factories.CastAddData.create({ body });
      const castAdd = new MessageModel(
        await Factories.Message.create({ data: Array.from(castAddData.bb?.bytes() ?? []) }, { transient: { signer } })
      ) as CastAddModel;
      expect(validateCastAddMessage(castAdd)._unsafeUnwrapErr()).toEqual(
        new HubError('bad_request.validation_failure', hubErrorMessage)
      );
    });

    test('when text is missing', () => {
      body = Factories.CastAddBody.build({ text: '' });
      hubErrorMessage = 'text is missing';
    });

    test('when text is longer than 320 characters', () => {
      body = Factories.CastAddBody.build({ text: faker.random.alphaNumeric(321) });
      hubErrorMessage = 'text > 320 chars';
    });

    test('with more than 2 embeds', () => {
      body = Factories.CastAddBody.build({
        embeds: [faker.internet.url(), faker.internet.url(), faker.internet.url()],
      });
      hubErrorMessage = 'embeds > 2';
    });

    test('when parent fid is missing', () => {
      body = Factories.CastAddBody.build({
        parent: Factories.CastId.build({ fid: [] }),
      });
      hubErrorMessage = 'fid is missing';
    });

    test('when parent tsHash is missing', () => {
      body = Factories.CastAddBody.build({ parent: Factories.CastId.build({ tsHash: [] }) });
      hubErrorMessage = 'tsHash is missing';
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
      hubErrorMessage = 'mentions > 5';
    });
  });
});

describe('validateCastRemoveMessage', () => {
  test('succeeds', async () => {
    const castRemoveData = await Factories.CastRemoveData.create();
    const castRemove = new MessageModel(
      await Factories.Message.create({ data: Array.from(castRemoveData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as CastRemoveModel;
    expect(validateCastRemoveMessage(castRemove)._unsafeUnwrap()).toEqual(castRemove);
  });

  test('fails when tsHash is missing', async () => {
    const castRemoveData = await Factories.CastRemoveData.create({
      body: Factories.CastRemoveBody.build({ targetTsHash: [] }),
    });
    const castRemove = new MessageModel(
      await Factories.Message.create({ data: Array.from(castRemoveData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as CastRemoveModel;
    expect(validateCastRemoveMessage(castRemove)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'tsHash is missing')
    );
  });
});

describe('validateReactionMessage', () => {
  test('succeeds with ReactionAdd', async () => {
    const reactionAddData = await Factories.ReactionAddData.create();
    const reactionAdd = new MessageModel(
      await Factories.Message.create({ data: Array.from(reactionAddData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as ReactionAddModel;
    expect(validateReactionMessage(reactionAdd)._unsafeUnwrap()).toEqual(reactionAdd);
  });

  test('succeeds with ReactionRemove', async () => {
    const reactionRemoveData = await Factories.ReactionRemoveData.create();
    const reactionRemove = new MessageModel(
      await Factories.Message.create(
        { data: Array.from(reactionRemoveData.bb?.bytes() ?? []) },
        { transient: { signer } }
      )
    ) as ReactionRemoveModel;
    expect(validateReactionMessage(reactionRemove)._unsafeUnwrap()).toEqual(reactionRemove);
  });

  describe('fails', () => {
    let body: ReactionBodyT;
    let hubErrorMessage: string;

    afterEach(async () => {
      const reactionAddData = await Factories.ReactionAddData.create({ body });
      const reactionAdd = new MessageModel(
        await Factories.Message.create(
          { data: Array.from(reactionAddData.bb?.bytes() ?? []) },
          { transient: { signer } }
        )
      ) as ReactionAddModel;
      expect(validateReactionMessage(reactionAdd)._unsafeUnwrapErr()).toEqual(
        new HubError('bad_request.validation_failure', hubErrorMessage)
      );
    });

    test('with invalid reaction type', () => {
      body = Factories.ReactionBody.build({ type: 100 as unknown as ReactionType });
      hubErrorMessage = 'invalid reaction type';
    });

    test('when cast fid is missing', () => {
      body = Factories.ReactionBody.build({
        cast: Factories.CastId.build({ fid: [] }),
      });
      hubErrorMessage = 'fid is missing';
    });

    test('when cast tsHash is missing', () => {
      body = Factories.ReactionBody.build({
        cast: Factories.CastId.build({ tsHash: [] }),
      });
      hubErrorMessage = 'tsHash is missing';
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
    const result = await validateVerificationAddEthAddressMessage(verificationAdd);
    expect(result._unsafeUnwrap()).toEqual(verificationAdd);
  });

  describe('fails', () => {
    const fid = Factories.FID.build();

    let body: VerificationAddEthAddressBodyT;
    let hubErrorMessage: string;

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
      const result = await validateVerificationAddEthAddressMessage(verificationAdd);
      expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', hubErrorMessage));
    });

    test('with missing eth address', () => {
      body = Factories.VerificationAddEthAddressBody.build({ address: [] });
      hubErrorMessage = 'address is missing';
    });

    test('with invalid eth address', () => {
      body = Factories.VerificationAddEthAddressBody.build({
        address: Array.from(Factories.Bytes.build({}, { transient: { length: 10 } })),
      });
      hubErrorMessage = 'address must be 20 bytes';
    });

    test('with missing block hash', () => {
      body = Factories.VerificationAddEthAddressBody.build({ blockHash: [] });
      hubErrorMessage = 'blockHash is missing';
    });

    test('with invalid block hash', () => {
      body = Factories.VerificationAddEthAddressBody.build({
        blockHash: Array.from(Factories.Bytes.build({}, { transient: { length: 10 } })),
      });
      hubErrorMessage = 'blockHash must be 32 bytes';
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
      hubErrorMessage = 'ethSignature does not match address';
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
    expect(validateVerificationRemoveMessage(verificationRemove)._unsafeUnwrap()).toEqual(verificationRemove);
  });

  describe('fails', () => {
    let body: VerificationRemoveBodyT;
    let hubErrorMessage: string;

    afterEach(async () => {
      const verificationRemoveData = await Factories.VerificationRemoveData.create({ body });
      const verificationRemove = new MessageModel(
        await Factories.Message.create(
          { data: Array.from(verificationRemoveData.bb?.bytes() ?? []) },
          { transient: { signer } }
        )
      ) as VerificationRemoveModel;
      expect(validateVerificationRemoveMessage(verificationRemove)._unsafeUnwrapErr()).toEqual(
        new HubError('bad_request.validation_failure', hubErrorMessage)
      );
    });

    test('when address is missing', () => {
      body = Factories.VerificationRemoveBody.build({
        address: [],
      });
      hubErrorMessage = 'address is missing';
    });

    test('with invalid address', () => {
      body = Factories.VerificationRemoveBody.build({
        address: Array.from(Factories.Bytes.build({}, { transient: { length: 10 } })),
      });
      hubErrorMessage = 'address must be 20 bytes';
    });
  });
});

describe('validateSignerMessage', () => {
  test('succeeds with SignerAdd', async () => {
    const signerAddData = await Factories.SignerAddData.create();
    const signerAdd = new MessageModel(
      await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { wallet } })
    ) as SignerAddModel;
    expect(validateSignerMessage(signerAdd)._unsafeUnwrap()).toEqual(signerAdd);
  });

  test('succeeds with SignerRemove', async () => {
    const SignerRemoveData = await Factories.SignerRemoveData.create();
    const signerRemove = new MessageModel(
      await Factories.Message.create(
        { data: Array.from(SignerRemoveData.bb?.bytes() ?? []) },
        { transient: { wallet } }
      )
    ) as SignerRemoveModel;
    expect(validateSignerMessage(signerRemove)._unsafeUnwrap()).toEqual(signerRemove);
  });

  describe('fails', () => {
    let body: SignerBodyT;
    let hubErrorMessage: string;

    afterEach(async () => {
      const signerAddData = await Factories.SignerAddData.create({ body });
      const signerAdd = new MessageModel(
        await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { wallet } })
      ) as SignerAddModel;
      expect(validateSignerMessage(signerAdd)._unsafeUnwrapErr()).toEqual(
        new HubError('bad_request.validation_failure', hubErrorMessage)
      );
    });

    test('when signer is missing', () => {
      body = Factories.SignerBody.build({
        signer: [],
      });
      hubErrorMessage = 'publicKey is missing';
    });

    test('with invalid signer', () => {
      body = Factories.SignerBody.build({
        signer: Array.from(Factories.Bytes.build({}, { transient: { length: 10 } })),
      });
      hubErrorMessage = 'publicKey must be 32 bytes';
    });
  });
});

describe('validateFollowMessage', () => {
  test('succeeds with FollowAdd', async () => {
    const followAddData = await Factories.FollowAddData.create();
    const followAdd = new MessageModel(
      await Factories.Message.create({ data: Array.from(followAddData.bb?.bytes() ?? []) }, { transient: { wallet } })
    ) as FollowAddModel;
    expect(validateFollowMessage(followAdd)._unsafeUnwrap()).toEqual(followAdd);
  });

  test('succeeds with FollowRemove', async () => {
    const followRemoveData = await Factories.FollowRemoveData.create();
    const followRemove = new MessageModel(
      await Factories.Message.create(
        { data: Array.from(followRemoveData.bb?.bytes() ?? []) },
        { transient: { wallet } }
      )
    ) as FollowRemoveModel;
    expect(validateFollowMessage(followRemove)._unsafeUnwrap()).toEqual(followRemove);
  });

  describe('fails', () => {
    let body: FollowBodyT;
    let hubErrorMessage: string;

    afterEach(async () => {
      const followAddData = await Factories.FollowAddData.create({ body });
      const followAdd = new MessageModel(
        await Factories.Message.create({ data: Array.from(followAddData.bb?.bytes() ?? []) }, { transient: { wallet } })
      ) as FollowAddModel;
      expect(validateFollowMessage(followAdd)._unsafeUnwrapErr()).toEqual(
        new HubError('bad_request.validation_failure', hubErrorMessage)
      );
    });

    test('when user fid is missing', () => {
      body = Factories.FollowBody.build({
        user: new UserIdT([]),
      });
      hubErrorMessage = 'fid is missing';
    });

    test('with invalid user fid', () => {
      body = Factories.FollowBody.build({
        user: new UserIdT(Array.from(Factories.Bytes.build({}, { transient: { length: 33 } }))),
      });
      hubErrorMessage = 'fid > 32 bytes';
    });
  });
});

describe('validateUserDataAddMessage', () => {
  test('succeeds', async () => {
    const userDataAddData = await Factories.UserDataAddData.create();
    const userDataAdd = new MessageModel(
      await Factories.Message.create({ data: Array.from(userDataAddData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as UserDataAddModel;
    expect(validateUserDataAddMessage(userDataAdd)._unsafeUnwrap()).toEqual(userDataAdd);
  });

  describe('fails', () => {
    let body: UserDataBodyT;
    let hubErrorMessage: string;

    afterEach(async () => {
      const userDataAddData = await Factories.UserDataAddData.create({ body });
      const userDataAdd = new MessageModel(
        await Factories.Message.create(
          { data: Array.from(userDataAddData.bb?.bytes() ?? []) },
          { transient: { signer } }
        )
      ) as UserDataAddModel;
      expect(validateUserDataAddMessage(userDataAdd)._unsafeUnwrapErr()).toEqual(
        new HubError('bad_request.validation_failure', hubErrorMessage)
      );
    });

    test('when pfp > 256', () => {
      body = Factories.UserDataBody.build({
        type: UserDataType.Pfp,
        value: faker.random.alphaNumeric(257),
      });
      hubErrorMessage = 'pfp value > 256';
    });

    test('when display > 32', () => {
      body = Factories.UserDataBody.build({
        type: UserDataType.Display,
        value: faker.random.alphaNumeric(33),
      });
      hubErrorMessage = 'display value > 32';
    });

    test('when bio > 256', () => {
      body = Factories.UserDataBody.build({
        type: UserDataType.Bio,
        value: faker.random.alphaNumeric(257),
      });
      hubErrorMessage = 'bio value > 256';
    });

    test('when location > 32', () => {
      body = Factories.UserDataBody.build({
        type: UserDataType.Location,
        value: faker.random.alphaNumeric(33),
      });
      hubErrorMessage = 'location value > 32';
    });

    test('when url > 256', () => {
      body = Factories.UserDataBody.build({
        type: UserDataType.Url,
        value: faker.random.alphaNumeric(257),
      });
      hubErrorMessage = 'url value > 256';
    });
  });
});
