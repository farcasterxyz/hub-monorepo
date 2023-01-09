import { faker } from '@faker-js/faker';
import * as flatbuffers from '@farcaster/flatbuffers';
import { Builder, ByteBuffer } from 'flatbuffers';
import { hexStringToBytes } from './bytes';
import { HubError } from './errors';
import { Factories } from './factories';
import { getFarcasterTime } from './time';
import * as validations from './validations';
import { makeVerificationEthAddressClaim } from './verifications';

const ethSigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();

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

describe('validateCastAddBody', () => {
  test('succeeds', async () => {
    const body = await Factories.CastAddBody.create();
    expect(validations.validateCastAddBody(body)._unsafeUnwrap()).toEqual(body);
  });

  describe('fails', () => {
    let body: flatbuffers.CastAddBody;
    let hubErrorMessage: string;

    afterEach(async () => {
      expect(validations.validateCastAddBody(body)._unsafeUnwrapErr()).toEqual(
        new HubError('bad_request.validation_failure', hubErrorMessage)
      );
    });

    test('when text is missing', async () => {
      body = await Factories.CastAddBody.create({ text: '' });
      hubErrorMessage = 'text is missing';
    });

    test('when text is longer than 320 characters', async () => {
      body = await Factories.CastAddBody.create({ text: faker.random.alphaNumeric(321) });
      hubErrorMessage = 'text > 320 chars';
    });

    test('with more than 2 embeds', async () => {
      body = await Factories.CastAddBody.create({
        embeds: [faker.internet.url(), faker.internet.url(), faker.internet.url()],
      });
      hubErrorMessage = 'embeds > 2';
    });

    test('when parent fid is missing', async () => {
      body = await Factories.CastAddBody.create({
        parent: Factories.CastId.build({ fid: [] }),
      });
      hubErrorMessage = 'fid is missing';
    });

    test('when parent tsHash is missing', async () => {
      body = await Factories.CastAddBody.create({ parent: Factories.CastId.build({ tsHash: [] }) });
      hubErrorMessage = 'tsHash is missing';
    });

    test('with more than 5 mentions', async () => {
      body = await Factories.CastAddBody.create({
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

describe('validateCastRemoveBody', () => {
  test('succeeds', async () => {
    const body = await Factories.CastRemoveBody.create();
    expect(validations.validateCastRemoveBody(body)._unsafeUnwrap()).toEqual(body);
  });

  test('fails when tsHash is missing', async () => {
    const body = await Factories.CastRemoveBody.create({ targetTsHash: [] });
    expect(validations.validateCastRemoveBody(body)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'tsHash is missing')
    );
  });
});

describe('validateReactionBody', () => {
  test('succeeds', async () => {
    const body = await Factories.ReactionBody.create();
    expect(validations.validateReactionBody(body)._unsafeUnwrap()).toEqual(body);
  });

  describe('fails', () => {
    let body: flatbuffers.ReactionBody;
    let hubErrorMessage: string;

    afterEach(async () => {
      expect(validations.validateReactionBody(body)._unsafeUnwrapErr()).toEqual(
        new HubError('bad_request.validation_failure', hubErrorMessage)
      );
    });

    test('with invalid reaction type', async () => {
      body = await Factories.ReactionBody.create({ type: 100 as unknown as flatbuffers.ReactionType });
      hubErrorMessage = 'invalid reaction type';
    });

    test('when cast fid is missing', async () => {
      body = await Factories.ReactionBody.create({
        target: Factories.CastId.build({ fid: [] }),
      });
      hubErrorMessage = 'fid is missing';
    });

    test('when cast tsHash is missing', async () => {
      body = await Factories.ReactionBody.create({
        target: Factories.CastId.build({ tsHash: [] }),
      });
      hubErrorMessage = 'tsHash is missing';
    });
  });
});

describe('validateVerificationAddEthAddressBody', () => {
  test('succeeds', async () => {
    const body = await Factories.VerificationAddEthAddressBody.create();
    const result = await validations.validateVerificationAddEthAddressBody(body);
    expect(result._unsafeUnwrap()).toEqual(body);
  });

  describe('fails', () => {
    let body: flatbuffers.VerificationAddEthAddressBodyT;
    let hubErrorMessage: string;

    afterEach(async () => {
      // TODO: improve VerificationAddEthAddressBody factory so that it doesn't always try to generate ethSignature
      const builder = new Builder(1);
      builder.finish(body.pack(builder));
      const fbb = flatbuffers.VerificationAddEthAddressBody.getRootAsVerificationAddEthAddressBody(
        new ByteBuffer(builder.asUint8Array())
      );

      const result = await validations.validateVerificationAddEthAddressBody(fbb);
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

    test('with missing block hash', async () => {
      body = Factories.VerificationAddEthAddressBody.build({ blockHash: [] });
      hubErrorMessage = 'blockHash is missing';
    });

    test('with block hash larger than 32 bytes', () => {
      body = Factories.VerificationAddEthAddressBody.build({
        blockHash: Array.from(Factories.Bytes.build({}, { transient: { length: 33 } })),
      });
      hubErrorMessage = 'blockHash > 32 bytes';
    });
  });
});

describe('validateVerificationAddEthAddressSignature', () => {
  test('succeeds', async () => {
    const fid = Factories.FID.build();
    const network = flatbuffers.FarcasterNetwork.Testnet;
    const body = await Factories.VerificationAddEthAddressBody.create({}, { transient: { fid, network } });
    const result = validations.validateVerificationAddEthAddressSignature(body, fid, network);
    expect(result.isOk()).toBeTruthy();
  });

  test('fails with invalid eth signature', async () => {
    const fid = Factories.FID.build();
    const network = flatbuffers.FarcasterNetwork.Testnet;
    const claim = makeVerificationEthAddressClaim(
      fid,
      Factories.Bytes.build({}, { transient: { length: 20 } }),
      network,
      Factories.Bytes.build({}, { transient: { length: 32 } })
    )._unsafeUnwrap();
    const signature = await ethSigner.signVerificationEthAddressClaim(claim);

    const bodyT = new flatbuffers.VerificationAddEthAddressBodyT(
      Array.from(ethSigner.signerKey),
      Array.from(signature._unsafeUnwrap()),
      Array.from(hexStringToBytes(claim.blockHash)._unsafeUnwrap())
    );

    // TODO: improve VerificationAddEthAddressBody factory so that it doesn't always try to generate ethSignature
    const builder = new Builder(1);
    builder.finish(bodyT.pack(builder));
    const body = flatbuffers.VerificationAddEthAddressBody.getRootAsVerificationAddEthAddressBody(
      new ByteBuffer(builder.asUint8Array())
    );

    const result = validations.validateVerificationAddEthAddressSignature(body, fid, network);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'ethSignature does not match address')
    );
  });
});

describe('validateVerificationRemoveBody', () => {
  test('succeeds', async () => {
    const body = await Factories.VerificationRemoveBody.create();
    expect(validations.validateVerificationRemoveBody(body)._unsafeUnwrap()).toEqual(body);
  });

  describe('fails', () => {
    let body: flatbuffers.VerificationRemoveBody;
    let hubErrorMessage: string;

    afterEach(async () => {
      expect(validations.validateVerificationRemoveBody(body)._unsafeUnwrapErr()).toEqual(
        new HubError('bad_request.validation_failure', hubErrorMessage)
      );
    });

    test('when address is missing', async () => {
      body = await Factories.VerificationRemoveBody.create({
        address: [],
      });
      hubErrorMessage = 'address is missing';
    });

    test('with invalid address', async () => {
      body = await Factories.VerificationRemoveBody.create({
        address: Array.from(Factories.Bytes.build({}, { transient: { length: 21 } })),
      });
      hubErrorMessage = 'address > 20 bytes';
    });
  });
});

describe('validateSignerBody', () => {
  test('succeeds', async () => {
    const body = await Factories.SignerBody.create();
    expect(validations.validateSignerBody(body)._unsafeUnwrap()).toEqual(body);
  });

  describe('fails', () => {
    let body: flatbuffers.SignerBody;
    let hubErrorMessage: string;

    afterEach(async () => {
      expect(validations.validateSignerBody(body)._unsafeUnwrapErr()).toEqual(
        new HubError('bad_request.validation_failure', hubErrorMessage)
      );
    });

    test('when signer is missing', async () => {
      body = await Factories.SignerBody.create({
        signer: [],
      });
      hubErrorMessage = 'publicKey is missing';
    });

    test('with invalid signer', async () => {
      body = await Factories.SignerBody.create({
        signer: Array.from(Factories.Bytes.build({}, { transient: { length: 33 } })),
      });
      hubErrorMessage = 'publicKey > 32 bytes';
    });
  });
});

describe('validateAmpBody', () => {
  test('succeeds', async () => {
    const body = await Factories.AmpBody.create();
    expect(validations.validateAmpBody(body)._unsafeUnwrap()).toEqual(body);
  });

  describe('fails', () => {
    let body: flatbuffers.AmpBody;
    let hubErrorMessage: string;

    afterEach(async () => {
      expect(validations.validateAmpBody(body)._unsafeUnwrapErr()).toEqual(
        new HubError('bad_request.validation_failure', hubErrorMessage)
      );
    });

    test('when user fid is missing', async () => {
      body = await Factories.AmpBody.create({
        user: new flatbuffers.UserIdT([]),
      });
      hubErrorMessage = 'fid is missing';
    });

    test('with invalid user fid', async () => {
      body = await Factories.AmpBody.create({
        user: new flatbuffers.UserIdT(Array.from(Factories.Bytes.build({}, { transient: { length: 33 } }))),
      });
      hubErrorMessage = 'fid > 32 bytes';
    });
  });
});

describe('validateUserDataAddBody', () => {
  test('succeeds', async () => {
    const body = await Factories.UserDataBody.create();
    expect(validations.validateUserDataAddBody(body)._unsafeUnwrap()).toEqual(body);
  });

  describe('fails', () => {
    let body: flatbuffers.UserDataBody;
    let hubErrorMessage: string;

    afterEach(async () => {
      expect(validations.validateUserDataAddBody(body)._unsafeUnwrapErr()).toEqual(
        new HubError('bad_request.validation_failure', hubErrorMessage)
      );
    });

    test('when pfp > 256', async () => {
      body = await Factories.UserDataBody.create({
        type: flatbuffers.UserDataType.Pfp,
        value: faker.random.alphaNumeric(257),
      });
      hubErrorMessage = 'pfp value > 256';
    });

    test('when display > 32', async () => {
      body = await Factories.UserDataBody.create({
        type: flatbuffers.UserDataType.Display,
        value: faker.random.alphaNumeric(33),
      });
      hubErrorMessage = 'display value > 32';
    });

    test('when bio > 256', async () => {
      body = await Factories.UserDataBody.create({
        type: flatbuffers.UserDataType.Bio,
        value: faker.random.alphaNumeric(257),
      });
      hubErrorMessage = 'bio value > 256';
    });

    test('when location > 32', async () => {
      body = await Factories.UserDataBody.create({
        type: flatbuffers.UserDataType.Location,
        value: faker.random.alphaNumeric(33),
      });
      hubErrorMessage = 'location value > 32';
    });

    test('when url > 256', async () => {
      body = await Factories.UserDataBody.create({
        type: flatbuffers.UserDataType.Url,
        value: faker.random.alphaNumeric(257),
      });
      hubErrorMessage = 'url value > 256';
    });
  });
});

describe('validateMessage', () => {
  test('succeeds with Ed25519 signer', async () => {
    const message = await Factories.Message.create({}, { transient: { signer } });
    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrap()).toEqual(message);
  });

  test('succeeds with EIP712 signer', async () => {
    const signerAddData = await Factories.SignerAddData.create();
    const message = await Factories.Message.create(
      { data: Array.from(signerAddData.bb?.bytes() ?? []) },
      { transient: { ethSigner } }
    );

    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrap()).toEqual(message);
  });

  test('fails with EIP712 signer and non-signer message type', async () => {
    // Default message type is CastAdd
    const message = await Factories.Message.create({}, { transient: { ethSigner } });
    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'invalid signatureScheme')
    );
  });

  test('fails with Ed25519 signer and signer message type', async () => {
    const signerAddData = await Factories.SignerAddData.create();
    const message = await Factories.Message.create(
      { data: Array.from(signerAddData.bb?.bytes() ?? []) },
      { transient: { signer } }
    );

    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'invalid signatureScheme')
    );
  });

  test('fails with invalid hashScheme', async () => {
    const message = await Factories.Message.create({
      hashScheme: 10 as unknown as flatbuffers.HashScheme.Blake3,
    });

    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid hashScheme'));
  });

  test('fails with invalid hash', async () => {
    const message = await Factories.Message.create({
      hash: Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 8 }))._unsafeUnwrap()),
    });

    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid hash'));
  });

  test('fails with invalid signatureScheme', async () => {
    const message = await Factories.Message.create({
      signatureScheme: 10 as unknown as flatbuffers.SignatureScheme.Ed25519,
    });

    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'invalid signatureScheme')
    );
  });

  test('fails with invalid signature', async () => {
    const message = await Factories.Message.create({
      signature: Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 128 }))._unsafeUnwrap()),
      signer: Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 64 }))._unsafeUnwrap()),
    });

    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrapErr()).toEqual(new HubError('bad_request.validation_failure', 'invalid signature'));
  });
});

describe('validateMessageData', () => {
  test('fails with timestamp more than 10 mins in the future', async () => {
    const data = await Factories.MessageData.create({
      timestamp: getFarcasterTime() + validations.ALLOWED_CLOCK_SKEW_SECONDS + 1,
    });
    const result = await validations.validateMessageData(data);
    expect(result._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'timestamp more than 10 mins in the future')
    );
  });
});
