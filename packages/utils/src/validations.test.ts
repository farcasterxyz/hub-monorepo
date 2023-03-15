import { faker } from '@faker-js/faker';
import * as protobufs from '@farcaster/protobufs';
import { err, ok } from 'neverthrow';
import { bytesToUtf8String } from './bytes';
import { HubError } from './errors';
import { Factories } from './factories';
import { getFarcasterTime } from './time';
import * as validations from './validations';
import { makeVerificationEthAddressClaim } from './verifications';

const ethSigner = Factories.Eip712Signer.build();
const signer = Factories.Ed25519Signer.build();

describe('validateFid', () => {
  test('succeeds', () => {
    const fid = Factories.Fid.build();
    expect(validations.validateFid(fid)).toEqual(ok(fid));
  });

  test('fails with 0', () => {
    expect(validations.validateFid(0)).toEqual(err(new HubError('bad_request.validation_failure', 'fid is missing')));
  });

  test('fails with negative number', () => {
    expect(validations.validateFid(-1)).toEqual(
      err(new HubError('bad_request.validation_failure', 'fid must be positive'))
    );
  });

  test('fails when undefined', () => {
    expect(validations.validateFid(undefined)).toEqual(
      err(new HubError('bad_request.validation_failure', 'fid is missing'))
    );
  });

  test('fails with non-integer number', () => {
    expect(validations.validateFid(1.5)).toEqual(
      err(new HubError('bad_request.validation_failure', 'fid must be an integer'))
    );
  });
});

describe('validateFname', () => {
  test('succeeds with valid byte array input', () => {
    const fname = Factories.Fname.build();
    expect(validations.validateFname(fname)).toEqual(ok(fname));
  });

  test('succeeds with valid string inpt', () => {
    const fname = bytesToUtf8String(Factories.Fname.build())._unsafeUnwrap();
    expect(validations.validateFname(fname)).toEqual(ok(fname));
  });

  test('fails when greater than 16 characters', () => {
    const fname = faker.random.alpha(17);
    expect(validations.validateFname(fname)).toEqual(
      err(new HubError('bad_request.validation_failure', `fname "${fname}" > 16 characters`))
    );
  });

  test('fails with an empty string', () => {
    const fname = '';
    expect(validations.validateFname(fname)).toEqual(
      err(new HubError('bad_request.validation_failure', 'fname is missing'))
    );
  });

  test('fails when undefined', () => {
    expect(validations.validateFname(undefined)).toEqual(
      err(new HubError('bad_request.validation_failure', 'fname is missing'))
    );
  });

  test('fails with invalid characters', () => {
    const fname = '@fname';
    expect(validations.validateFname(fname)).toEqual(
      err(new HubError('bad_request.validation_failure', `fname "${fname}" doesn't match ${validations.FNAME_REGEX}`))
    );
  });
});

describe('validateCastId', () => {
  test('succeeds', async () => {
    const castId = Factories.CastId.build();
    expect(validations.validateCastId(castId)).toEqual(ok(castId));
  });

  test('fails when fid is invalid', async () => {
    const castId = await Factories.CastId.build({ fid: 0 });
    expect(validations.validateCastId(castId)).toEqual(
      err(new HubError('bad_request.validation_failure', 'fid is missing'))
    );
  });

  test('fails when hash is invalid', async () => {
    const castId = await Factories.CastId.build({ hash: new Uint8Array() });
    expect(validations.validateCastId(castId)).toEqual(
      err(new HubError('bad_request.validation_failure', 'hash is missing'))
    );
  });

  test('fails when both fid and tsHash are invalid', async () => {
    const castId = await Factories.CastId.build({ fid: undefined, hash: undefined });
    expect(validations.validateCastId(castId)).toEqual(
      err(new HubError('bad_request.validation_failure', 'fid is missing, hash is missing'))
    );
  });
});

describe('validateEthAddress', () => {
  const address = ethSigner.signerKey;

  test('succeeds', () => {
    expect(validations.validateEthAddress(address)).toEqual(ok(address));
  });

  test('fails with longer address', () => {
    const longAddress = Factories.Bytes.build({}, { transient: { length: 21 } });
    expect(validations.validateEthAddress(longAddress)).toEqual(
      err(new HubError('bad_request.validation_failure', 'address must be 20 bytes'))
    );
  });

  test('fails with shorter address', () => {
    const shortAddress = address.subarray(0, -1);
    expect(validations.validateEthAddress(shortAddress)).toEqual(
      err(new HubError('bad_request.validation_failure', 'address must be 20 bytes'))
    );
  });
});

describe('validateEthBlockHash', () => {
  test('succeeds', () => {
    const blockHash = Factories.Bytes.build({}, { transient: { length: 32 } });
    expect(validations.validateEthBlockHash(blockHash)).toEqual(ok(blockHash));
  });

  test('fails when greater than 32 bytes', () => {
    const blockHash = Factories.Bytes.build({}, { transient: { length: 33 } });
    expect(validations.validateEthBlockHash(blockHash)).toEqual(
      err(new HubError('bad_request.validation_failure', 'blockHash must be 32 bytes'))
    );
  });

  test('fails when less than 32 bytes', () => {
    const blockHash = Factories.Bytes.build({}, { transient: { length: 31 } });
    expect(validations.validateEthBlockHash(blockHash)).toEqual(
      err(new HubError('bad_request.validation_failure', 'blockHash must be 32 bytes'))
    );
  });

  test('fails when undefined', () => {
    expect(validations.validateEthBlockHash(undefined)).toEqual(
      err(new HubError('bad_request.validation_failure', 'blockHash is missing'))
    );
  });
});

describe('validateEd25519PublicKey', () => {
  const publicKey = signer.signerKey;

  test('succeeds', () => {
    expect(validations.validateEd25519PublicKey(publicKey)).toEqual(ok(publicKey));
  });

  test('fails with longer key', () => {
    const longKey = Factories.Bytes.build({}, { transient: { length: 33 } });
    expect(validations.validateEd25519PublicKey(longKey)).toEqual(
      err(new HubError('bad_request.validation_failure', 'publicKey must be 32 bytes'))
    );
  });

  test('fails with shorter key', () => {
    const shortKey = publicKey.subarray(0, -1);
    expect(validations.validateEd25519PublicKey(shortKey)).toEqual(
      err(new HubError('bad_request.validation_failure', 'publicKey must be 32 bytes'))
    );
  });
});

describe('validateCastAddBody', () => {
  test('succeeds', () => {
    const body = Factories.CastAddBody.build();
    expect(validations.validateCastAddBody(body)).toEqual(ok(body));
  });

  test('when text is empty', () => {
    const body = Factories.CastAddBody.build({ text: '', mentions: [], mentionsPositions: [] });
    expect(validations.validateCastAddBody(body)).toEqual(ok(body));
  });

  test('with repeated mentionsPositions', () => {
    const body = Factories.CastAddBody.build({
      text: 'Hello ',
      mentions: [Factories.Fid.build(), Factories.Fid.build()],
      mentionsPositions: [6, 6],
    });
    expect(validations.validateCastAddBody(body)).toEqual(ok(body));
  });

  describe('fails', () => {
    let body: protobufs.CastAddBody;
    let hubErrorMessage: string;

    afterEach(() => {
      expect(validations.validateCastAddBody(body)).toEqual(
        err(new HubError('bad_request.validation_failure', hubErrorMessage))
      );
    });

    test('when text is undefined', () => {
      body = Factories.CastAddBody.build({ text: undefined });
      hubErrorMessage = 'text is missing';
    });

    test('when text is null', () => {
      body = Factories.CastAddBody.build({ text: null as unknown as undefined });
      hubErrorMessage = 'text is missing';
    });

    test('when text is longer than 320 ASCII characters', () => {
      body = Factories.CastAddBody.build({ text: faker.random.alphaNumeric(321) });
      hubErrorMessage = 'text > 320 bytes';
    });

    test('when text is longer than 320 bytes', () => {
      const text = faker.random.alphaNumeric(318) + '🤓';
      expect(text.length).toEqual(320);
      body = Factories.CastAddBody.build({ text });
      hubErrorMessage = 'text > 320 bytes';
    });

    test('with more than 2 embeds', () => {
      body = Factories.CastAddBody.build({
        embeds: [faker.internet.url(), faker.internet.url(), faker.internet.url()],
      });
      hubErrorMessage = 'embeds > 2';
    });

    test('with an empty embed string', () => {
      body = Factories.CastAddBody.build({
        embeds: [''],
      });
      hubErrorMessage = 'embed < 1 byte';
    });

    test('with an embed string over 256 ASCII characters', () => {
      body = Factories.CastAddBody.build({
        embeds: [faker.random.alphaNumeric(257)],
      });
      hubErrorMessage = 'embed > 256 bytes';
    });

    test('with an embed string over 256 bytes', () => {
      body = Factories.CastAddBody.build({
        embeds: [faker.random.alphaNumeric(254) + '🤓'],
      });
      hubErrorMessage = 'embed > 256 bytes';
    });

    test('when parent fid is missing', () => {
      body = Factories.CastAddBody.build({
        parentCastId: Factories.CastId.build({ fid: undefined }),
      });
      hubErrorMessage = 'fid is missing';
    });

    test('when parent hash is missing', () => {
      body = Factories.CastAddBody.build({ parentCastId: Factories.CastId.build({ hash: undefined }) });
      hubErrorMessage = 'hash is missing';
    });

    test('with up to 10 mentions', () => {
      const body = Factories.CastAddBody.build({
        text: '',
        mentions: [
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
        ],
        mentionsPositions: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      });
      expect(validations.validateCastAddBody(body)).toEqual(ok(body));
    });

    test('with more than 10 mentions', () => {
      body = Factories.CastAddBody.build({
        mentions: [
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
          Factories.Fid.build(),
        ],
      });
      hubErrorMessage = 'mentions > 10';
    });

    test('with more mentions than mentionsPositions', () => {
      body = Factories.CastAddBody.build({
        mentions: [Factories.Fid.build(), Factories.Fid.build()],
        mentionsPositions: [0],
      });
      hubErrorMessage = 'mentions and mentionsPositions must match';
    });

    test('with out of range mentionsPositions', () => {
      body = Factories.CastAddBody.build({
        text: 'a',
        mentions: [Factories.Fid.build()],
        mentionsPositions: [2],
      });
      hubErrorMessage = 'mentionsPositions must be a position in text';
    });

    test('with mentionsPositions within byte length of text', () => {
      const body = Factories.CastAddBody.build({
        text: '🤓', // 4 bytes in utf8
        mentions: [Factories.Fid.build()],
        mentionsPositions: [4],
      });
      expect(validations.validateCastAddBody(body)).toEqual(ok(body));
    });

    test('with mentionsPositions out of range of byte length of text', () => {
      body = Factories.CastAddBody.build({
        text: '🤓', // 4 bytes in utf8
        mentions: [Factories.Fid.build()],
        mentionsPositions: [5],
      });
      hubErrorMessage = 'mentionsPositions must be a position in text';
    });

    test('with non-integer mentionsPositions', () => {
      body = Factories.CastAddBody.build({ mentions: [Factories.Fid.build()], mentionsPositions: [1.5] });
      hubErrorMessage = 'mentionsPositions must be integers';
    });

    test('with out of order mentionsPositions', () => {
      body = Factories.CastAddBody.build({
        mentions: [Factories.Fid.build(), Factories.Fid.build()],
        mentionsPositions: [2, 1],
      });
      hubErrorMessage = 'mentionsPositions must be sorted in ascending order';
    });
  });
});

describe('validateCastRemoveBody', () => {
  test('succeeds', async () => {
    const body = await Factories.CastRemoveBody.build();
    expect(validations.validateCastRemoveBody(body)._unsafeUnwrap()).toEqual(body);
  });

  test('fails when targetHash is missing', async () => {
    const body = await Factories.CastRemoveBody.build({ targetHash: undefined });
    expect(validations.validateCastRemoveBody(body)._unsafeUnwrapErr()).toEqual(
      new HubError('bad_request.validation_failure', 'hash is missing')
    );
  });
});

describe('validateReactionBody', () => {
  test('succeeds', async () => {
    const body = await Factories.ReactionBody.build();
    expect(validations.validateReactionBody(body)._unsafeUnwrap()).toEqual(body);
  });

  describe('fails', () => {
    let body: protobufs.ReactionBody;
    let hubErrorMessage: string;

    afterEach(async () => {
      expect(validations.validateReactionBody(body)._unsafeUnwrapErr()).toEqual(
        new HubError('bad_request.validation_failure', hubErrorMessage)
      );
    });

    test('with invalid reaction type', async () => {
      body = await Factories.ReactionBody.build({ type: 100 as unknown as protobufs.ReactionType });
      hubErrorMessage = 'invalid reaction type';
    });

    test('when cast fid is missing', async () => {
      body = await Factories.ReactionBody.build({
        targetCastId: Factories.CastId.build({ fid: undefined }),
      });
      hubErrorMessage = 'fid is missing';
    });

    test('when cast hash is missing', async () => {
      body = Factories.ReactionBody.build({
        targetCastId: Factories.CastId.build({ hash: undefined }),
      });
      hubErrorMessage = 'hash is missing';
    });
  });
});

describe('validateVerificationAddEthAddressBody', () => {
  test('succeeds', async () => {
    const body = await Factories.VerificationAddEthAddressBody.build();
    const result = await validations.validateVerificationAddEthAddressBody(body);
    expect(result).toEqual(ok(body));
  });

  describe('fails', () => {
    let body: protobufs.VerificationAddEthAddressBody;
    let hubErrorMessage: string;

    afterEach(async () => {
      // TODO: improve VerificationAddEthAddressBody factory so that it doesn't always try to generate ethSignature
      const result = await validations.validateVerificationAddEthAddressBody(body);
      expect(result).toEqual(err(new HubError('bad_request.validation_failure', hubErrorMessage)));
    });

    test('with missing eth address', async () => {
      body = await Factories.VerificationAddEthAddressBody.create({ address: undefined });
      hubErrorMessage = 'address is missing';
    });

    test('with eth address larger than 20 bytes', async () => {
      body = await Factories.VerificationAddEthAddressBody.create({
        address: Factories.Bytes.build({}, { transient: { length: 21 } }),
      });
      hubErrorMessage = 'address must be 20 bytes';
    });

    test('with missing block hash', async () => {
      body = await Factories.VerificationAddEthAddressBody.create({ blockHash: undefined });
      hubErrorMessage = 'blockHash is missing';
    });

    test('with block hash larger than 32 bytes', async () => {
      body = await Factories.VerificationAddEthAddressBody.create({
        blockHash: Factories.Bytes.build({}, { transient: { length: 33 } }),
      });
      hubErrorMessage = 'blockHash must be 32 bytes';
    });
  });
});

describe('validateVerificationAddEthAddressSignature', () => {
  const fid = Factories.Fid.build();
  const network = Factories.FarcasterNetwork.build();

  test('succeeds', async () => {
    const body = await Factories.VerificationAddEthAddressBody.create({}, { transient: { fid, network } });
    const result = validations.validateVerificationAddEthAddressSignature(body, fid, network);
    expect(result.isOk()).toBeTruthy();
  });

  test('fails with invalid eth signature', async () => {
    const body = await Factories.VerificationAddEthAddressBody.create({
      ethSignature: Factories.Bytes.build({}, { transient: { length: 1 } }),
    });
    const result = validations.validateVerificationAddEthAddressSignature(body, fid, network);
    expect(result).toEqual(err(new HubError('bad_request.validation_failure', 'invalid ethSignature')));
  });

  test('fails with eth signature from different address', async () => {
    const blockHash = Factories.BlockHash.build();
    const claim = makeVerificationEthAddressClaim(fid, ethSigner.signerKey, network, blockHash)._unsafeUnwrap();
    const ethSignature = await ethSigner.signVerificationEthAddressClaim(claim);
    expect(ethSignature.isOk()).toBeTruthy();
    const body = await Factories.VerificationAddEthAddressBody.create({
      ethSignature: ethSignature._unsafeUnwrap(),
      blockHash,
      address: Factories.EthAddress.build(),
    });
    const result = validations.validateVerificationAddEthAddressSignature(body, fid, network);
    expect(result).toEqual(err(new HubError('bad_request.validation_failure', 'ethSignature does not match address')));
  });
});

describe('validateVerificationRemoveBody', () => {
  test('succeeds', () => {
    const body = Factories.VerificationRemoveBody.build();
    expect(validations.validateVerificationRemoveBody(body)).toEqual(ok(body));
  });

  describe('fails', () => {
    let body: protobufs.VerificationRemoveBody;
    let hubErrorMessage: string;

    afterEach(async () => {
      expect(validations.validateVerificationRemoveBody(body)).toEqual(
        err(new HubError('bad_request.validation_failure', hubErrorMessage))
      );
    });

    test('when address is missing', async () => {
      body = Factories.VerificationRemoveBody.build({
        address: undefined,
      });
      hubErrorMessage = 'address is missing';
    });

    test('with invalid address', async () => {
      body = Factories.VerificationRemoveBody.build({
        address: Factories.Bytes.build({}, { transient: { length: 21 } }),
      });
      hubErrorMessage = 'address must be 20 bytes';
    });
  });
});

describe('validateSignerAddBody', () => {
  test('succeeds', async () => {
    const body = Factories.SignerAddBody.build();
    expect(validations.validateSignerAddBody(body)).toEqual(ok(body));
  });

  describe('fails', () => {
    let body: protobufs.SignerAddBody;
    let hubErrorMessage: string;

    afterEach(() => {
      expect(validations.validateSignerAddBody(body)).toEqual(
        err(new HubError('bad_request.validation_failure', hubErrorMessage))
      );
    });

    test('when signer is missing', () => {
      body = Factories.SignerAddBody.build({
        signer: undefined,
      });
      hubErrorMessage = 'publicKey is missing';
    });

    test('with invalid signer', () => {
      body = Factories.SignerAddBody.build({
        signer: Factories.Bytes.build({}, { transient: { length: 33 } }),
      });
      hubErrorMessage = 'publicKey must be 32 bytes';
    });

    test('with name as empty string', () => {
      body = Factories.SignerAddBody.build({ name: '' });
      hubErrorMessage = 'name cannot be empty string';
    });

    test('with name > 32 chars', () => {
      body = Factories.SignerAddBody.build({ name: faker.random.alphaNumeric(33) });
      hubErrorMessage = 'name > 32 bytes';
    });

    test('with name > 32 bytes', () => {
      let name = '';
      for (let i = 0; i < 10; i++) {
        name = name + '🔥';
      }
      body = Factories.SignerAddBody.build({ name });
    });
  });
});

describe('validateSignerRemoveBody', () => {
  test('succeeds', async () => {
    const body = Factories.SignerRemoveBody.build();
    expect(validations.validateSignerRemoveBody(body)).toEqual(ok(body));
  });

  describe('fails', () => {
    let body: protobufs.SignerRemoveBody;
    let hubErrorMessage: string;

    afterEach(() => {
      expect(validations.validateSignerRemoveBody(body)).toEqual(
        err(new HubError('bad_request.validation_failure', hubErrorMessage))
      );
    });

    test('when signer is missing', () => {
      body = Factories.SignerRemoveBody.build({
        signer: undefined,
      });
      hubErrorMessage = 'publicKey is missing';
    });

    test('with invalid signer', () => {
      body = Factories.SignerRemoveBody.build({
        signer: Factories.Bytes.build({}, { transient: { length: 33 } }),
      });
      hubErrorMessage = 'publicKey must be 32 bytes';
    });
  });
});

describe('validateUserDataAddBody', () => {
  test('succeeds', async () => {
    const body = Factories.UserDataBody.build();
    expect(validations.validateUserDataAddBody(body)).toEqual(ok(body));
  });

  describe('fails', () => {
    let body: protobufs.UserDataBody;
    let hubErrorMessage: string;

    afterEach(() => {
      expect(validations.validateUserDataAddBody(body)).toEqual(
        err(new HubError('bad_request.validation_failure', hubErrorMessage))
      );
    });

    test('when pfp > 256', () => {
      body = Factories.UserDataBody.build({
        type: protobufs.UserDataType.PFP,
        value: faker.random.alphaNumeric(257),
      });
      hubErrorMessage = 'pfp value > 256';
    });

    test('when display > 32', () => {
      body = Factories.UserDataBody.build({
        type: protobufs.UserDataType.DISPLAY,
        value: faker.random.alphaNumeric(33),
      });
      hubErrorMessage = 'display value > 32';
    });

    test('when bio > 256', () => {
      body = Factories.UserDataBody.build({
        type: protobufs.UserDataType.BIO,
        value: faker.random.alphaNumeric(257),
      });
      hubErrorMessage = 'bio value > 256';
    });

    test('when url > 256', () => {
      body = Factories.UserDataBody.build({
        type: protobufs.UserDataType.URL,
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
    const message = await Factories.Message.create(
      { data: Factories.SignerAddData.build() },
      { transient: { signer: ethSigner } }
    );

    const result = await validations.validateMessage(message);
    expect(result._unsafeUnwrap()).toEqual(message);
  });

  test('fails with EIP712 signer and non-signer message type', async () => {
    // Default message type is CastAdd
    const message = await Factories.Message.create({}, { transient: { signer: ethSigner } });
    const result = await validations.validateMessage(message);
    expect(result).toEqual(err(new HubError('bad_request.validation_failure', 'invalid signatureScheme')));
  });

  test('fails with Ed25519 signer and signer message type', async () => {
    const message = await Factories.Message.create(
      { data: Factories.SignerAddData.build() },
      { transient: { signer } }
    );

    const result = await validations.validateMessage(message);
    expect(result).toEqual(err(new HubError('bad_request.validation_failure', 'invalid signatureScheme')));
  });

  test('fails with invalid hashScheme', async () => {
    const message = await Factories.Message.create({
      hashScheme: 10 as unknown as protobufs.HashScheme.BLAKE3,
    });

    const result = await validations.validateMessage(message);
    expect(result).toEqual(err(new HubError('bad_request.validation_failure', 'invalid hashScheme')));
  });

  test('fails with invalid hash', async () => {
    const message = await Factories.Message.create({
      hash: Factories.Bytes.build({}, { transient: { length: 1 } }),
    });

    const result = await validations.validateMessage(message);
    expect(result).toEqual(err(new HubError('bad_request.validation_failure', 'invalid hash')));
  });

  test('fails with invalid signatureScheme', async () => {
    const message = await Factories.Message.create({
      signatureScheme: 10 as unknown as protobufs.SignatureScheme.ED25519,
    });

    const result = await validations.validateMessage(message);
    expect(result).toEqual(err(new HubError('bad_request.validation_failure', 'invalid signatureScheme')));
  });

  test('fails with invalid signature', async () => {
    const message = await Factories.Message.create({
      signature: Factories.Ed25519Signature.build(),
      signer: Factories.Ed25519Signer.build().signerKey,
    });

    const result = await validations.validateMessage(message);
    expect(result).toEqual(err(new HubError('bad_request.validation_failure', 'invalid signature')));
  });
});

describe('validateMessageData', () => {
  test('fails with timestamp more than 10 mins in the future', async () => {
    const data = Factories.MessageData.build({
      timestamp: getFarcasterTime()._unsafeUnwrap() + validations.ALLOWED_CLOCK_SKEW_SECONDS + 1,
    });
    const result = validations.validateMessageData(data);
    expect(result).toEqual(
      err(new HubError('bad_request.validation_failure', 'timestamp more than 10 mins in the future'))
    );
  });
});
