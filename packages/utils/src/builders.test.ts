import { faker } from '@faker-js/faker';
import * as protobufs from '@farcaster/protobufs';
import { ethers } from 'ethers';
import { err, ok } from 'neverthrow';
import * as builders from './builders';
import { hexStringToBytes } from './bytes';
import { HubError } from './errors';
import { Factories } from './factories';
import { Ed25519Signer, Eip712Signer } from './signers';
import * as validations from './validations';
import { makeVerificationEthAddressClaim } from './verifications';

const fid = Factories.Fid.build();
const network = protobufs.FarcasterNetwork.TESTNET;

const ed25519Signer = Ed25519Signer.fromPrivateKey(Factories.Ed25519PrivateKey.build())._unsafeUnwrap();
const wallet = new ethers.Wallet(ethers.utils.randomBytes(32));
const eip712Signer = Eip712Signer.fromSigner(wallet, wallet.address)._unsafeUnwrap();

describe('makeCastAddData', () => {
  test('succeeds', async () => {
    const data = await builders.makeCastAddData(
      {
        text: faker.random.alphaNumeric(200),
        mentions: [Factories.Fid.build(), Factories.Fid.build()],
        mentionsPositions: [10, 20],
        parentCastId: { fid: Factories.Fid.build(), hash: Factories.MessageHash.build() },
        embeds: [faker.internet.url()],
      },
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
      {
        text: faker.random.alphaNumeric(200),
        mentions: [Factories.Fid.build(), Factories.Fid.build()],
        mentionsPositions: [10, 20],
        parentCastId: { fid: Factories.Fid.build(), hash: Factories.MessageHash.build() },
        embeds: [faker.internet.url()],
      },
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
      { type: Factories.ReactionType.build(), targetCastId: { fid, hash: Factories.MessageHash.build() } },
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
  let ethSignature: Uint8Array;
  const address = eip712Signer.signerKey;
  const blockHash = Factories.BlockHash.build();
  const claim = makeVerificationEthAddressClaim(fid, address, network, blockHash)._unsafeUnwrap();

  beforeAll(async () => {
    const signature = await eip712Signer.signVerificationEthAddressClaim(claim);
    expect(signature.isOk()).toBeTruthy();
    ethSignature = signature._unsafeUnwrap();
  });

  test('succeeds', async () => {
    const data = await builders.makeVerificationAddEthAddressData(
      { address, blockHash, ethSignature },
      { fid, network }
    );
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationRemoveData', () => {
  test('succeeds', async () => {
    const data = await builders.makeVerificationRemoveData({ address: eip712Signer.signerKey }, { fid, network });
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationAddEthAddress', () => {
  let ethSignature: Uint8Array;
  const address = eip712Signer.signerKey;
  const blockHash = Factories.BlockHash.build();
  const claim = makeVerificationEthAddressClaim(fid, address, network, blockHash)._unsafeUnwrap();

  beforeAll(async () => {
    const signatureHex = await eip712Signer.signVerificationEthAddressClaim(claim);
    expect(signatureHex.isOk()).toBeTruthy();
    ethSignature = signatureHex._unsafeUnwrap();
  });

  test('succeeds', async () => {
    const message = await builders.makeVerificationAddEthAddress(
      { address, blockHash, ethSignature },
      { fid, network },
      ed25519Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationRemove', () => {
  test('succeeds', async () => {
    const message = await builders.makeVerificationRemove(
      { address: eip712Signer.signerKey },
      { fid, network },
      ed25519Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerAddData', () => {
  test('succeeds', async () => {
    const data = await builders.makeSignerAddData({ signer: ed25519Signer.signerKey }, { fid, network });
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerRemoveData', () => {
  test('succeeds', async () => {
    const data = await builders.makeSignerRemoveData({ signer: ed25519Signer.signerKey }, { fid, network });
    const isValid = await validations.validateMessageData(data._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerAdd', () => {
  test('succeeds', async () => {
    const message = await builders.makeSignerAdd(
      { signer: ed25519Signer.signerKey, name: 'test signer' },
      { fid, network },
      eip712Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });

  test('succeeds without name', async () => {
    const message = await builders.makeSignerAdd({ signer: ed25519Signer.signerKey }, { fid, network }, eip712Signer);
    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerRemove', () => {
  test('succeeds', async () => {
    const message = await builders.makeSignerRemove(
      { signer: ed25519Signer.signerKey },
      { fid, network },
      eip712Signer
    );
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
    const body = protobufs.SignerAddBody.create({ signer: ed25519Signer.signerKey });
    const signerAdd = await builders.makeSignerAdd(body, { fid, network }, eip712Signer);

    const data = builders.makeSignerAddData(body, { fid, network });
    const hash = await builders.makeMessageHash(data._unsafeUnwrap());
    const signature = await eip712Signer.signMessageHash(hash._unsafeUnwrap());
    const message = await builders.makeMessageWithSignature(data._unsafeUnwrap(), {
      signer: eip712Signer.signerKey,
      signatureScheme: eip712Signer.scheme,
      signature: signature._unsafeUnwrap(),
    });

    const isValid = await validations.validateMessage(message._unsafeUnwrap());
    expect(isValid.isOk()).toBeTruthy();

    expect(message).toEqual(signerAdd);
  });

  test('fails with invalid signature', async () => {
    const signature = hexStringToBytes(
      '0xf8dc77d52468483806addab7d397836e802551bfb692604e2d7df4bc4820556c63524399a63d319ae4b027090ce296ade08286878dc1f414b62412f89e8bc4e01b'
    )._unsafeUnwrap();
    const data = builders.makeSignerAddData({ signer: ed25519Signer.signerKey }, { fid, network });
    expect(data.isOk()).toBeTruthy();
    const message = await builders.makeMessageWithSignature(data._unsafeUnwrap(), {
      signer: eip712Signer.signerKey,
      signatureScheme: eip712Signer.scheme,
      signature,
    });
    expect(message).toEqual(err(new HubError('bad_request.validation_failure', 'signature does not match signer')));
  });
});
