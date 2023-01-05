import { faker } from '@faker-js/faker';
import { hexStringToBytes } from '@hub/bytes';
import { HubError } from '@hub/errors';
import * as message_generated from '@hub/flatbuffers';
import { bytesToBigNumber } from '~/eth/utils';
import Factories from '~/flatbuffers/factories';
import MessageModel from '~/flatbuffers/models/messageModel';
import * as types from '~/flatbuffers/models/types';
import * as validations from '~/flatbuffers/models/validations';
import { getFarcasterTime } from '~/flatbuffers/utils/time';

const ethSigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();

describe('validateMessage', () => {
  test('succeeds with Ed25519 signer', async () => {
    const message = new MessageModel(await Factories.Message.create({}, { transient: { signer } }));
    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrap()).toEqual(message);
  });

  test('succeeds with EIP712 signer', async () => {
    const signerAddData = await Factories.SignerAddData.create();
    const message = new MessageModel(
      await Factories.Message.create(
        { data: Array.from(signerAddData.bb?.bytes() ?? []) },
        { transient: { ethSigner } }
      )
    );
    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrap()).toEqual(message);
  });

  test('fails with EIP712 signer and non-signer message type', async () => {
    // Default message type is CastAdd
    const message = new MessageModel(await Factories.Message.create({}, { transient: { ethSigner } }));
    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'invalid signatureScheme')
    );
  });

  test('fails with Ed25519 signer and signer message type', async () => {
    const signerAddData = await Factories.SignerAddData.create();
    const message = new MessageModel(
      await Factories.Message.create({ data: Array.from(signerAddData.bb?.bytes() ?? []) }, { transient: { signer } })
    );
    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'invalid signatureScheme')
    );
  });

  test('fails with invalid hashScheme', async () => {
    const message = new MessageModel(
      await Factories.Message.create({ hashScheme: 10 as unknown as message_generated.HashScheme.Blake3 })
    );
    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid hashScheme'));
  });

  test('fails with invalid hash', async () => {
    const message = new MessageModel(
      await Factories.Message.create({
        hash: Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 8 }))._unsafeUnwrap()),
      })
    );
    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid hash'));
  });

  test('fails with invalid signatureScheme', async () => {
    const message = new MessageModel(
      await Factories.Message.create({ signatureScheme: 10 as unknown as message_generated.SignatureScheme.Ed25519 })
    );
    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'invalid signatureScheme')
    );
  });

  test('fails with invalid signature', async () => {
    const message = new MessageModel(
      await Factories.Message.create({
        signature: Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 128 }))._unsafeUnwrap()),
        signer: Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 64 }))._unsafeUnwrap()),
      })
    );
    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid signature'));
  });

  test('fails with timestamp more than 10 mins in the future', async () => {
    const data = await Factories.MessageData.create({
      timestamp: getFarcasterTime() + validations.ALLOWED_CLOCK_SKEW_SECONDS + 1,
    });
    const message = new MessageModel(await Factories.Message.create({ data: Array.from(data.bb?.bytes() ?? []) }));
    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'timestamp more than 10 mins in the future')
    );
  });
});

describe('validateFid', () => {
  test('succeeds', () => {
    const fid = Factories.FID.build();
    expect(validations.validateFid(fid)._unsafeUnwrap()).toEqual(fid);
  });

  test('fails with empty array', () => {
    expect(validations.validateFid(new Uint8Array())._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'fid is missing')
    );
  });

  test('fails when greater than 32 bytes', () => {
    const fid = Factories.Bytes.build({}, { transient: { length: 33 } });
    expect(validations.validateFid(fid)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'fid > 32 bytes')
    );
  });

  test('fails when undefined', () => {
    expect(validations.validateFid(undefined)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'fid is missing')
    );
  });

  test('fails with padded little endian byte array', () => {
    expect(validations.validateFid(new Uint8Array([1, 0]))._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'fid is padded')
    );
  });
});

describe('validateTsHash', () => {
  test('succeeds', () => {
    const tsHash = Factories.TsHash.build();
    expect(validations.validateTsHash(tsHash)._unsafeUnwrap()).toEqual(tsHash);
  });

  test('fails with empty array', () => {
    expect(validations.validateTsHash(new Uint8Array())._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'tsHash is missing')
    );
  });

  test('fails when greater than 20 bytes', () => {
    const tsHash = Factories.Bytes.build({}, { transient: { length: 21 } });
    expect(validations.validateTsHash(tsHash)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'tsHash must be 20 bytes')
    );
  });

  test('fails when less than 20 bytes', () => {
    const tsHash = Factories.Bytes.build({}, { transient: { length: 19 } });
    expect(validations.validateTsHash(tsHash)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'tsHash must be 20 bytes')
    );
  });

  test('fails when undefined', () => {
    expect(validations.validateTsHash(undefined)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'tsHash is missing')
    );
  });
});

describe('validateCastId', () => {
  test('succeeds', async () => {
    const castId = await Factories.CastId.create();
    expect(validations.validateCastId(castId)._unsafeUnwrap()).toEqual(castId);
  });

  test('fails when fid is invalid', async () => {
    const castId = await Factories.CastId.create({ fid: [] });
    expect(validations.validateCastId(castId)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'fid is missing')
    );
  });

  test('fails when tsHash is invalid', async () => {
    const castId = await Factories.CastId.create({ tsHash: [] });
    expect(validations.validateCastId(castId)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'tsHash is missing')
    );
  });

  test('fails when both fid and tsHash are invalid', async () => {
    const castId = await Factories.CastId.create({ fid: [], tsHash: [] });
    expect(validations.validateCastId(castId)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'fid is missing, tsHash is missing')
    );
  });
});

describe('validateEthAddress', () => {
  const address = ethSigner.signerKey;

  test('succeeds', () => {
    expect(validations.validateEthAddress(address)._unsafeUnwrap()).toEqual(address);
  });

  test('fails with longer address', () => {
    const longAddress = Factories.Bytes.build({}, { transient: { length: 21 } });
    expect(validations.validateEthAddress(longAddress)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'address > 20 bytes')
    );
  });

  test('succeeds with shorter address', () => {
    const shortAddress = address.subarray(0, -1);
    expect(validations.validateEthAddress(shortAddress)._unsafeUnwrap()).toEqual(shortAddress);
  });
});

describe('validateEthBlockHash', () => {
  test('succeeds', () => {
    const blockHash = Factories.Bytes.build({}, { transient: { length: 32 } });
    expect(validations.validateEthBlockHash(blockHash)._unsafeUnwrap()).toEqual(blockHash);
  });

  test('fails when greater than 32 bytes', () => {
    const blockHash = Factories.Bytes.build({}, { transient: { length: 33 } });
    expect(validations.validateEthBlockHash(blockHash)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'blockHash > 32 bytes')
    );
  });

  test('succeeds when less than 32 bytes', () => {
    const blockHash = Factories.Bytes.build({}, { transient: { length: 31 } });
    expect(validations.validateEthBlockHash(blockHash)._unsafeUnwrap()).toEqual(blockHash);
  });

  test('fails when padded', () => {
    const blockHash = Factories.Bytes.build({}, { transient: { length: 31 } });
    expect(validations.validateEthBlockHash(new Uint8Array([...blockHash, 0]))._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'blockHash is padded')
    );
  });

  test('fails when undefined', () => {
    expect(validations.validateEthBlockHash(undefined)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'blockHash is missing')
    );
  });
});

describe('validateEd25519PublicKey', () => {
  const publicKey = signer.signerKey;

  test('succeeds', () => {
    expect(validations.validateEd25519PublicKey(publicKey)._unsafeUnwrap()).toEqual(publicKey);
  });

  test('fails with longer key', () => {
    const longKey = Factories.Bytes.build({}, { transient: { length: 33 } });
    expect(validations.validateEd25519PublicKey(longKey)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'publicKey > 32 bytes')
    );
  });

  test('succeeds with shorter key', () => {
    const shortKey = publicKey.subarray(0, -1);
    expect(validations.validateEd25519PublicKey(shortKey)._unsafeUnwrap()).toEqual(shortKey);
  });
});

describe('validateCastAddMessage', () => {
  test('succeeds', async () => {
    const castAddData = await Factories.CastAddData.create();
    const castAdd = new MessageModel(
      await Factories.Message.create({ data: Array.from(castAddData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as types.CastAddModel;
    expect(validations.validateCastAddMessage(castAdd)._unsafeUnwrap()).toEqual(castAdd);
  });

  describe('fails', () => {
    let body: message_generated.CastAddBodyT;
    let hubErrorMessage: string;

    afterEach(async () => {
      const castAddData = await Factories.CastAddData.create({ body });
      const castAdd = new MessageModel(
        await Factories.Message.create({ data: Array.from(castAddData.bb?.bytes() ?? []) }, { transient: { signer } })
      ) as types.CastAddModel;
      expect(validations.validateCastAddMessage(castAdd)._unsafeUnwrapErr()).toEqual(
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
    ) as types.CastRemoveModel;
    expect(validations.validateCastRemoveMessage(castRemove)._unsafeUnwrap()).toEqual(castRemove);
  });

  test('fails when tsHash is missing', async () => {
    const castRemoveData = await Factories.CastRemoveData.create({
      body: Factories.CastRemoveBody.build({ targetTsHash: [] }),
    });
    const castRemove = new MessageModel(
      await Factories.Message.create({ data: Array.from(castRemoveData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as types.CastRemoveModel;
    expect(validations.validateCastRemoveMessage(castRemove)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'tsHash is missing')
    );
  });
});

describe('validateReactionMessage', () => {
  test('succeeds with ReactionAdd', async () => {
    const reactionAddData = await Factories.ReactionAddData.create();
    const reactionAdd = new MessageModel(
      await Factories.Message.create({ data: Array.from(reactionAddData.bb?.bytes() ?? []) }, { transient: { signer } })
    ) as types.ReactionAddModel;
    expect(validations.validateReactionMessage(reactionAdd)._unsafeUnwrap()).toEqual(reactionAdd);
  });

  test('succeeds with ReactionRemove', async () => {
    const reactionRemoveData = await Factories.ReactionRemoveData.create();
    const reactionRemove = new MessageModel(
      await Factories.Message.create(
        { data: Array.from(reactionRemoveData.bb?.bytes() ?? []) },
        { transient: { signer } }
      )
    ) as types.ReactionRemoveModel;
    expect(validations.validateReactionMessage(reactionRemove)._unsafeUnwrap()).toEqual(reactionRemove);
  });

  describe('fails', () => {
    let body: message_generated.ReactionBodyT;
    let hubErrorMessage: string;

    afterEach(async () => {
      const reactionAddData = await Factories.ReactionAddData.create({ body });
      const reactionAdd = new MessageModel(
        await Factories.Message.create(
          { data: Array.from(reactionAddData.bb?.bytes() ?? []) },
          { transient: { signer } }
        )
      ) as types.ReactionAddModel;
      expect(validations.validateReactionMessage(reactionAdd)._unsafeUnwrapErr()).toEqual(
        new HubError('bad_request.validation_failure', hubErrorMessage)
      );
    });

    test('with invalid reaction type', () => {
      body = Factories.ReactionBody.build({ type: 100 as unknown as message_generated.ReactionType });
      hubErrorMessage = 'invalid reaction type';
    });

    test('when cast fid is missing', () => {
      body = Factories.ReactionBody.build({
        target: Factories.CastId.build({ fid: [] }),
      });
      hubErrorMessage = 'fid is missing';
    });

    test('when cast tsHash is missing', () => {
      body = Factories.ReactionBody.build({
        target: Factories.CastId.build({ tsHash: [] }),
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
    ) as types.VerificationAddEthAddressModel;
    const result = await validations.validateVerificationAddEthAddressMessage(verificationAdd);
    expect(result._unsafeUnwrap()).toEqual(verificationAdd);
  });

  describe('fails', () => {
    const fid = Factories.FID.build();

    let body: message_generated.VerificationAddEthAddressBodyT;
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
      ) as types.VerificationAddEthAddressModel;
      const result = await validations.validateVerificationAddEthAddressMessage(verificationAdd);
      expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', hubErrorMessage));
    });

    test('with missing eth address', () => {
      body = Factories.VerificationAddEthAddressBody.build({ address: [] });
      hubErrorMessage = 'address is missing';
    });

    test('with eth address larger than 20 bytes', () => {
      body = Factories.VerificationAddEthAddressBody.build({
        address: Array.from(Factories.Bytes.build({}, { transient: { length: 21 } })),
      });
      hubErrorMessage = 'address > 20 bytes';
    });

    test('with missing block hash', () => {
      body = Factories.VerificationAddEthAddressBody.build({ blockHash: [] });
      hubErrorMessage = 'blockHash is missing';
    });

    test('with block hash larger than 32 bytes', () => {
      body = Factories.VerificationAddEthAddressBody.build({
        blockHash: Array.from(Factories.Bytes.build({}, { transient: { length: 33 } })),
      });
      hubErrorMessage = 'blockHash > 32 bytes';
    });

    test('with invalid eth signature', async () => {
      const claim: types.VerificationEthAddressClaim = {
        fid: bytesToBigNumber(fid)._unsafeUnwrap(),
        address: faker.datatype.hexadecimal({ length: 40, case: 'lower' }), // mismatched address
        network: message_generated.FarcasterNetwork.Testnet,
        blockHash: Factories.BlockHash.build(),
      };
      const signature = await ethSigner.signVerificationEthAddressClaim(claim);
      body = new message_generated.VerificationAddEthAddressBodyT(
        Array.from(ethSigner.signerKey),
        Array.from(signature._unsafeUnwrap()),
        Array.from(hexStringToBytes(claim.blockHash)._unsafeUnwrap())
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
    ) as types.VerificationRemoveModel;
    expect(validations.validateVerificationRemoveMessage(verificationRemove)._unsafeUnwrap()).toEqual(
      verificationRemove
    );
  });

  describe('fails', () => {
    let body: message_generated.VerificationRemoveBodyT;
    let hubErrorMessage: string;

    afterEach(async () => {
      const verificationRemoveData = await Factories.VerificationRemoveData.create({ body });
      const verificationRemove = new MessageModel(
        await Factories.Message.create(
          { data: Array.from(verificationRemoveData.bb?.bytes() ?? []) },
          { transient: { signer } }
        )
      ) as types.VerificationRemoveModel;
      expect(validations.validateVerificationRemoveMessage(verificationRemove)._unsafeUnwrapErr()).toEqual(
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
        address: Array.from(Factories.Bytes.build({}, { transient: { length: 21 } })),
      });
      hubErrorMessage = 'address > 20 bytes';
    });
  });
});

describe('validateSignerMessage', () => {
  test('succeeds with SignerAdd', async () => {
    const signerAddData = await Factories.SignerAddData.create();
    const signerAdd = new MessageModel(
      await Factories.Message.create(
        { data: Array.from(signerAddData.bb?.bytes() ?? []) },
        { transient: { ethSigner } }
      )
    ) as types.SignerAddModel;
    expect(validations.validateSignerMessage(signerAdd)._unsafeUnwrap()).toEqual(signerAdd);
  });

  test('succeeds with SignerRemove', async () => {
    const SignerRemoveData = await Factories.SignerRemoveData.create();
    const signerRemove = new MessageModel(
      await Factories.Message.create(
        { data: Array.from(SignerRemoveData.bb?.bytes() ?? []) },
        { transient: { ethSigner } }
      )
    ) as types.SignerRemoveModel;
    expect(validations.validateSignerMessage(signerRemove)._unsafeUnwrap()).toEqual(signerRemove);
  });

  describe('fails', () => {
    let body: message_generated.SignerBodyT;
    let hubErrorMessage: string;

    afterEach(async () => {
      const signerAddData = await Factories.SignerAddData.create({ body });
      const signerAdd = new MessageModel(
        await Factories.Message.create(
          { data: Array.from(signerAddData.bb?.bytes() ?? []) },
          { transient: { ethSigner } }
        )
      ) as types.SignerAddModel;
      expect(validations.validateSignerMessage(signerAdd)._unsafeUnwrapErr()).toEqual(
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
        signer: Array.from(Factories.Bytes.build({}, { transient: { length: 33 } })),
      });
      hubErrorMessage = 'publicKey > 32 bytes';
    });
  });
});

describe('validateAmpMessage', () => {
  test('succeeds with AmpAdd', async () => {
    const ampAddData = await Factories.AmpAddData.create();
    const ampAdd = new MessageModel(
      await Factories.Message.create({ data: Array.from(ampAddData.bb?.bytes() ?? []) }, { transient: { ethSigner } })
    ) as types.AmpAddModel;
    expect(validations.validateAmpMessage(ampAdd)._unsafeUnwrap()).toEqual(ampAdd);
  });

  test('succeeds with AmpRemove', async () => {
    const ampRemoveData = await Factories.AmpRemoveData.create();
    const ampRemove = new MessageModel(
      await Factories.Message.create(
        { data: Array.from(ampRemoveData.bb?.bytes() ?? []) },
        { transient: { ethSigner } }
      )
    ) as types.AmpRemoveModel;
    expect(validations.validateAmpMessage(ampRemove)._unsafeUnwrap()).toEqual(ampRemove);
  });

  describe('fails', () => {
    let body: message_generated.AmpBodyT;
    let hubErrorMessage: string;

    afterEach(async () => {
      const ampAddData = await Factories.AmpAddData.create({ body });
      const ampAdd = new MessageModel(
        await Factories.Message.create({ data: Array.from(ampAddData.bb?.bytes() ?? []) }, { transient: { ethSigner } })
      ) as types.AmpAddModel;
      expect(validations.validateAmpMessage(ampAdd)._unsafeUnwrapErr()).toEqual(
        new HubError('bad_request.validation_failure', hubErrorMessage)
      );
    });

    test('when user fid is missing', () => {
      body = Factories.AmpBody.build({
        user: new message_generated.UserIdT([]),
      });
      hubErrorMessage = 'fid is missing';
    });

    test('with invalid user fid', () => {
      body = Factories.AmpBody.build({
        user: new message_generated.UserIdT(Array.from(Factories.Bytes.build({}, { transient: { length: 33 } }))),
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
    ) as types.UserDataAddModel;
    expect(validations.validateUserDataAddMessage(userDataAdd)._unsafeUnwrap()).toEqual(userDataAdd);
  });

  describe('fails', () => {
    let body: message_generated.UserDataBodyT;
    let hubErrorMessage: string;

    afterEach(async () => {
      const userDataAddData = await Factories.UserDataAddData.create({ body });
      const userDataAdd = new MessageModel(
        await Factories.Message.create(
          { data: Array.from(userDataAddData.bb?.bytes() ?? []) },
          { transient: { signer } }
        )
      ) as types.UserDataAddModel;
      expect(validations.validateUserDataAddMessage(userDataAdd)._unsafeUnwrapErr()).toEqual(
        new HubError('bad_request.validation_failure', hubErrorMessage)
      );
    });

    test('when pfp > 256', () => {
      body = Factories.UserDataBody.build({
        type: message_generated.UserDataType.Pfp,
        value: faker.random.alphaNumeric(257),
      });
      hubErrorMessage = 'pfp value > 256';
    });

    test('when display > 32', () => {
      body = Factories.UserDataBody.build({
        type: message_generated.UserDataType.Display,
        value: faker.random.alphaNumeric(33),
      });
      hubErrorMessage = 'display value > 32';
    });

    test('when bio > 256', () => {
      body = Factories.UserDataBody.build({
        type: message_generated.UserDataType.Bio,
        value: faker.random.alphaNumeric(257),
      });
      hubErrorMessage = 'bio value > 256';
    });

    test('when location > 32', () => {
      body = Factories.UserDataBody.build({
        type: message_generated.UserDataType.Location,
        value: faker.random.alphaNumeric(33),
      });
      hubErrorMessage = 'location value > 32';
    });

    test('when url > 256', () => {
      body = Factories.UserDataBody.build({
        type: message_generated.UserDataType.Url,
        value: faker.random.alphaNumeric(257),
      });
      hubErrorMessage = 'url value > 256';
    });
  });
});
