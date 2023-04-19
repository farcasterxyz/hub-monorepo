import { faker } from '@faker-js/faker';
import * as protobufs from './protobufs';
import { Wallet } from 'ethers';
import { err, ok } from 'neverthrow';
import * as builders from './builders';
import { hexStringToBytes } from './bytes';
import { HubError } from './errors';
import { Factories } from './factories';
import * as validations from './validations';
import { VerificationEthAddressClaim, makeVerificationEthAddressClaim } from './verifications';

const fid = Factories.Fid.build();
const network = protobufs.FarcasterNetwork.TESTNET;

const ed25519Signer = Factories.Ed25519Signer.build();
const wallet = Wallet.createRandom();
const eip712Signer = Factories.Eip712Signer.build({}, { transient: { wallet } });
let ethSignerKey: Uint8Array;
let signerKey: Uint8Array;

beforeAll(async () => {
  [ethSignerKey, signerKey] = (await Promise.all([eip712Signer.getSignerKey(), ed25519Signer.getSignerKey()])).map(
    (res) => res._unsafeUnwrap()
  );
});

describe('makeCastAddData', () => {
  test('succeeds', async () => {
    const data = await builders.makeCastAddData(
      protobufs.CastAddBody.create({
        text: faker.random.alphaNumeric(200),
        mentions: [Factories.Fid.build(), Factories.Fid.build()],
        mentionsPositions: [10, 20],
        parentCastId: { fid: Factories.Fid.build(), hash: Factories.MessageHash.build() },
        embeds: [{ url: faker.internet.url() }, { castId: Factories.CastId.build() }],
      }),
      { fid, network }
    );
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeCastRemoveData', () => {
  test('succeeds', async () => {
    const data = await builders.makeCastRemoveData({ targetHash: Factories.MessageHash.build() }, { fid, network });
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeCastAdd', () => {
  test('succeeds', async () => {
    const message = await builders.makeCastAdd(
      protobufs.CastAddBody.create({
        text: faker.random.alphaNumeric(200),
        mentions: [Factories.Fid.build(), Factories.Fid.build()],
        mentionsPositions: [10, 20],
        parentCastId: { fid: Factories.Fid.build(), hash: Factories.MessageHash.build() },
        embeds: [{ url: faker.internet.url() }, { castId: Factories.CastId.build() }],
      }),
      { fid, network },
      ed25519Signer
    );
    expect(message.isOk()).toBeTruthy();
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeCastRemove', () => {
  test('succeeds', async () => {
    const message = await builders.makeCastRemove(
      { targetHash: Factories.MessageHash.build() },
      { fid, network },
      ed25519Signer
    );
    expect(message.isOk()).toBeTruthy();
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeReactionAddData', () => {
  test('succeeds', async () => {
    const data = await builders.makeReactionAddData(
      { type: Factories.ReactionType.build(), targetCastId: { fid, hash: Factories.MessageHash.build() } },
      { fid, network }
    );
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeReactionRemoveData', () => {
  test('succeeds', async () => {
    const data = await builders.makeReactionRemoveData(
      { type: Factories.ReactionType.build(), targetCastId: { fid, hash: Factories.MessageHash.build() } },
      { fid, network }
    );
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeReactionAdd', () => {
  test('succeeds', async () => {
    const message = await builders.makeReactionAdd(
      protobufs.ReactionBody.create({
        type: Factories.ReactionType.build(),
        targetCastId: { fid, hash: Factories.MessageHash.build() },
      }),
      { fid, network },
      ed25519Signer
    );
    expect(message.isOk()).toBeTruthy();
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeReactionRemove', () => {
  test('succeeds', async () => {
    const message = await builders.makeReactionRemove(
      { type: Factories.ReactionType.build(), targetCastId: { fid, hash: Factories.MessageHash.build() } },
      { fid, network },
      ed25519Signer
    );
    expect(message.isOk()).toBeTruthy();
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationAddEthAddressData', () => {
  const blockHash = Factories.BlockHash.build();
  let ethSignature: Uint8Array;
  let claim: VerificationEthAddressClaim;

  beforeAll(async () => {
    claim = makeVerificationEthAddressClaim(fid, ethSignerKey, network, blockHash)._unsafeUnwrap();
    const signature = (await eip712Signer.signVerificationEthAddressClaim(claim))._unsafeUnwrap();
    expect(signature).toBeTruthy();
    ethSignature = signature;
  });

  test('succeeds', async () => {
    const data = await builders.makeVerificationAddEthAddressData(
      { address: ethSignerKey, blockHash, ethSignature },
      { fid, network }
    );
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationRemoveData', () => {
  test('succeeds', async () => {
    const data = await builders.makeVerificationRemoveData({ address: ethSignerKey }, { fid, network });
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationAddEthAddress', () => {
  const blockHash = Factories.BlockHash.build();
  let ethSignature: Uint8Array;
  let claim: VerificationEthAddressClaim;

  beforeAll(async () => {
    claim = makeVerificationEthAddressClaim(fid, ethSignerKey, network, blockHash)._unsafeUnwrap();
    const signatureHex = (await eip712Signer.signVerificationEthAddressClaim(claim))._unsafeUnwrap();
    expect(signatureHex).toBeTruthy();
    ethSignature = signatureHex;
  });

  test('succeeds', async () => {
    const message = await builders.makeVerificationAddEthAddress(
      { address: ethSignerKey, blockHash, ethSignature },
      { fid, network },
      ed25519Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationRemove', () => {
  test('succeeds', async () => {
    const message = await builders.makeVerificationRemove({ address: ethSignerKey }, { fid, network }, ed25519Signer);
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerAddData', () => {
  test('succeeds', async () => {
    const data = await builders.makeSignerAddData({ signer: signerKey }, { fid, network });
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerRemoveData', () => {
  test('succeeds', async () => {
    const data = await builders.makeSignerRemoveData({ signer: signerKey }, { fid, network });
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerAdd', () => {
  test('succeeds', async () => {
    const message = await builders.makeSignerAdd(
      { signer: signerKey, name: 'test signer' },
      { fid, network },
      eip712Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });

  test('succeeds without name', async () => {
    const message = await builders.makeSignerAdd({ signer: signerKey }, { fid, network }, eip712Signer);
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerRemove', () => {
  test('succeeds', async () => {
    const message = await builders.makeSignerRemove({ signer: signerKey }, { fid, network }, eip712Signer);
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeUserDataAddData', () => {
  test('succeeds', async () => {
    const data = await builders.makeUserDataAddData(
      { type: protobufs.UserDataType.BIO, value: faker.lorem.word() },
      { fid, network }
    );
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeUserDataAdd', () => {
  test('succeeds', async () => {
    const message = await builders.makeUserDataAdd(
      { type: protobufs.UserDataType.PFP, value: faker.random.alphaNumeric(100) },
      { fid, network },
      ed25519Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeMessageHash', () => {
  test('succeeds', async () => {
    const body = protobufs.CastAddBody.create({
      text: faker.random.alphaNumeric(200),
    });
    const message = await builders.makeCastAdd(body, { fid, network }, ed25519Signer);
    expect(message.isOk()).toBeTruthy();
    const data = builders.makeCastAddData(body, { fid, network });
    expect(data.isOk()).toBeTruthy();
    const hash = await builders.makeMessageHash(data._unsafeUnwrap());
    expect(hash).toEqual(ok(message._unsafeUnwrap().hash));
  });
});

describe('makeMessageWithSignature', () => {
  test('succeeds', async () => {
    const body = protobufs.SignerAddBody.create({ signer: signerKey });
    const signerAdd = await builders.makeSignerAdd(body, { fid, network }, eip712Signer);

    const data = builders.makeSignerAddData(body, { fid, network });
    const hash = await builders.makeMessageHash(data._unsafeUnwrap());
    const signature = (await eip712Signer.signMessageHash(hash._unsafeUnwrap()))._unsafeUnwrap();
    const message = await builders.makeMessageWithSignature(data._unsafeUnwrap(), {
      signer: ethSignerKey,
      signatureScheme: eip712Signer.scheme,
      signature: signature,
    });

    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();

    expect(message).toEqual(signerAdd);
  });

  test('fails with invalid signature', async () => {
    const signature = hexStringToBytes(
      '0xf8dc77d52468483806addab7d397836e802551bfb692604e2d7df4bc4820556c63524399a63d319ae4b027090ce296ade08286878dc1f414b62412f89e8bc4e01b'
    )._unsafeUnwrap();
    const data = builders.makeSignerAddData({ signer: signerKey }, { fid, network });
    expect(data.isOk()).toBeTruthy();
    const message = await builders.makeMessageWithSignature(data._unsafeUnwrap(), {
      signer: ethSignerKey,
      signatureScheme: eip712Signer.scheme,
      signature,
    });
    expect(message).toEqual(err(new HubError('bad_request.validation_failure', 'signature does not match signer')));
  });
});
