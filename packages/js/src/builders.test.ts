import { faker } from '@faker-js/faker';
import * as protobufs from '@farcaster/protobufs';
import { Factories, HubError, validations } from '@farcaster/utils';
import { ethers } from 'ethers';
import { err, ok } from 'neverthrow';
import * as builders from './builders';
import { Ed25519Signer, Eip712Signer } from './signers';
import * as types from './types';

const fid = Factories.Fid.build();
const timestamp = Date.now();
const network = protobufs.FarcasterNetwork.TESTNET;

const ed25519Signer = Ed25519Signer.fromPrivateKey(Factories.Ed25519PrivateKey.build())._unsafeUnwrap();
const wallet = new ethers.Wallet(ethers.utils.randomBytes(32));
const eip712Signer = Eip712Signer.fromSigner(wallet, wallet.address)._unsafeUnwrap();

describe('makeCastAddData', () => {
  test('succeeds', async () => {
    const body: types.CastAddBody = {
      text: faker.random.alphaNumeric(200),
      mentions: [Factories.Fid.build(), Factories.Fid.build()],
      mentionsPositions: [10, 20],
      parent: { fid: Factories.Fid.build(), hash: Factories.MessageHashHex.build() },
      embeds: [faker.internet.url()],
    };
    const data = await builders.makeCastAddData(body, { fid, timestamp, network });
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeCastRemoveData', () => {
  test('succeeds', async () => {
    const data = await builders.makeCastRemoveData(
      { targetHash: Factories.MessageHashHex.build() },
      { fid, timestamp, network }
    );
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeCastAdd', () => {
  test('succeeds', async () => {
    const body: types.CastAddBody = {
      text: faker.random.alphaNumeric(200),
      mentions: [Factories.Fid.build(), Factories.Fid.build()],
      mentionsPositions: [10, 20],
      parent: { fid: Factories.Fid.build(), hash: Factories.MessageHashHex.build() },
      embeds: [faker.internet.url()],
    };
    const message = await builders.makeCastAdd(body, { fid, timestamp, network }, ed25519Signer);
    expect(message.isOk()).toBeTruthy();
    const isValid = await validations.validateMessage(message._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeCastRemove', () => {
  test('succeeds', async () => {
    const message = await builders.makeCastRemove(
      { targetHash: Factories.MessageHashHex.build() },
      { fid, timestamp, network },
      ed25519Signer
    );
    expect(message.isOk()).toBeTruthy();
    const isValid = await validations.validateMessage(message._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeReactionAddData', () => {
  test('succeeds', async () => {
    const data = await builders.makeReactionAddData(
      { type: Factories.ReactionType.build(), target: { fid, hash: Factories.MessageHashHex.build() } },
      { fid, timestamp, network }
    );
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeReactionRemoveData', () => {
  test('succeeds', async () => {
    const data = await builders.makeReactionRemoveData(
      { type: Factories.ReactionType.build(), target: { fid, hash: Factories.MessageHashHex.build() } },
      { fid, timestamp, network }
    );
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeReactionAdd', () => {
  test('succeeds', async () => {
    const message = await builders.makeReactionAdd(
      { type: Factories.ReactionType.build(), target: { fid, hash: Factories.MessageHashHex.build() } },
      { fid, timestamp, network },
      ed25519Signer
    );
    expect(message.isOk()).toBeTruthy();
    const isValid = await validations.validateMessage(message._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeReactionRemove', () => {
  test('succeeds', async () => {
    const message = await builders.makeReactionRemove(
      { type: Factories.ReactionType.build(), target: { fid, hash: Factories.MessageHashHex.build() } },
      { fid, timestamp, network },
      ed25519Signer
    );
    expect(message.isOk()).toBeTruthy();
    const isValid = await validations.validateMessage(message._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationAddEthAddressData', () => {
  let ethSignature: string;
  const address = eip712Signer.signerKeyHex;
  const blockHash = Factories.BlockHashHex.build();
  const claim = Factories.VerificationEthAddressClaim.build(
    { blockHash, fid, network },
    { transient: { signer: eip712Signer } }
  );

  beforeAll(async () => {
    const signatureHex = await eip712Signer.signVerificationEthAddressClaimHex(claim);
    expect(signatureHex.isOk()).toBeTruthy();
    ethSignature = signatureHex._unsafeUnwrap();
  });

  test('succeeds', async () => {
    const data = await builders.makeVerificationAddEthAddressData(
      { address, blockHash, ethSignature },
      { fid, timestamp, network }
    );
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationRemoveData', () => {
  test('succeeds', async () => {
    const data = await builders.makeVerificationRemoveData(
      { address: eip712Signer.signerKeyHex },
      { fid, timestamp, network }
    );
    expect(data.isOk()).toBeTruthy();
    const isValid = await validations.validateMessageData(data._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationAddEthAddress', () => {
  let ethSignature: string;
  const address = eip712Signer.signerKeyHex;
  const blockHash = Factories.BlockHashHex.build();
  const claim = Factories.VerificationEthAddressClaim.build(
    { blockHash, fid, network },
    { transient: { signer: eip712Signer } }
  );

  beforeAll(async () => {
    const signatureHex = await eip712Signer.signVerificationEthAddressClaimHex(claim);
    expect(signatureHex.isOk()).toBeTruthy();
    ethSignature = signatureHex._unsafeUnwrap();
  });

  test('succeeds', async () => {
    const message = await builders.makeVerificationAddEthAddress(
      { address, blockHash, ethSignature },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationRemove', () => {
  test('succeeds', async () => {
    const message = await builders.makeVerificationRemove(
      { address: eip712Signer.signerKeyHex },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerAddData', () => {
  test('succeeds', async () => {
    const data = await builders.makeSignerAddData({ signer: ed25519Signer.signerKeyHex }, { fid, timestamp, network });
    const isValid = await validations.validateMessageData(data._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerRemoveData', () => {
  test('succeeds', async () => {
    const data = await builders.makeSignerRemoveData(
      { signer: ed25519Signer.signerKeyHex },
      { fid, timestamp, network }
    );
    const isValid = await validations.validateMessageData(data._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerAdd', () => {
  test('succeeds', async () => {
    const message = await builders.makeSignerAdd(
      { signer: ed25519Signer.signerKeyHex },
      { fid, timestamp, network },
      eip712Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerRemove', () => {
  test('succeeds', async () => {
    const message = await builders.makeSignerRemove(
      { signer: ed25519Signer.signerKeyHex },
      { fid, timestamp, network },
      eip712Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeUserDataAddData', () => {
  test('succeeds', async () => {
    const data = await builders.makeUserDataAddData(
      { type: protobufs.UserDataType.BIO, value: faker.lorem.word() },
      { fid, timestamp, network }
    );
    const isValid = await validations.validateMessageData(data._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeUserDataAdd', () => {
  test('succeeds', async () => {
    const message = await builders.makeUserDataAdd(
      { type: protobufs.UserDataType.PFP, value: faker.random.alphaNumeric(100) },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeMessageHash', () => {
  test('succeeds', async () => {
    const body = { text: faker.random.alphaNumeric(200) };
    const message = await builders.makeCastAdd(body, { fid, network, timestamp }, ed25519Signer);
    expect(message.isOk()).toBeTruthy();
    const data = builders.makeCastAddData(body, { fid, network, timestamp });
    expect(data.isOk()).toBeTruthy();
    const hash = await builders.makeMessageHash(data._unsafeUnwrap());
    expect(hash).toEqual(ok(message._unsafeUnwrap().hash));
  });
});

describe('makeMessageWithSignature', () => {
  test('succeeds', async () => {
    const body = { signer: ed25519Signer.signerKeyHex };
    const signerAdd = await builders.makeSignerAdd(body, { fid, network, timestamp }, eip712Signer);

    const data = builders.makeSignerAddData(body, { fid, network, timestamp });
    const hash = await builders.makeMessageHash(data._unsafeUnwrap());
    const signature = await eip712Signer.signMessageHashHex(hash._unsafeUnwrap());
    const message = await builders.makeMessageWithSignature(
      data._unsafeUnwrap(),
      eip712Signer,
      signature._unsafeUnwrap()
    );

    const isValid = await validations.validateMessage(message._unsafeUnwrap()._protobuf);
    expect(isValid.isOk()).toBeTruthy();

    expect(message).toEqual(signerAdd);
  });

  test('fails with invalid signature', async () => {
    const data = builders.makeSignerAddData({ signer: ed25519Signer.signerKeyHex }, { fid, network, timestamp });
    const message = await builders.makeMessageWithSignature(
      data._unsafeUnwrap(),
      eip712Signer,
      '0xf8dc77d52468483806addab7d397836e802551bfb692604e2d7df4bc4820556c63524399a63d319ae4b027090ce296ade08286878dc1f414b62412f89e8bc4e01b'
    );
    expect(message).toEqual(err(new HubError('bad_request.validation_failure', 'signature does not match signer')));
  });
});
