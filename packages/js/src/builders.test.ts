import { faker } from '@faker-js/faker';
import * as flatbuffers from '@farcaster/flatbuffers';
import { bytesToHexString, Factories, HubError, validations } from '@farcaster/utils';
import { ethers } from 'ethers';
import { err, ok } from 'neverthrow';
import * as builders from './builders';
import { Ed25519Signer, Eip712Signer } from './signers';
import * as types from './types';

const fid = faker.datatype.number({ min: 1 });
const timestamp = Date.now();
const network = flatbuffers.FarcasterNetwork.Testnet;
const tsHash = bytesToHexString(Factories.TsHash.build())._unsafeUnwrap();

const ed25519Signer = Ed25519Signer.fromPrivateKey(Factories.Ed25519PrivateKey.build())._unsafeUnwrap();
const wallet = new ethers.Wallet(ethers.utils.randomBytes(32));
const eip712Signer = Eip712Signer.fromSigner(wallet, wallet.address)._unsafeUnwrap();

describe('makeCastAddData', () => {
  test('succeeds', async () => {
    const body: types.CastAddBody = {
      text: faker.random.alphaNumeric(200),
      mentions: [faker.datatype.number({ min: 1 }), faker.datatype.number({ min: 1 })],
      parent: { fid: faker.datatype.number({ min: 1 }), tsHash },
      embeds: [faker.internet.url()],
    };
    const data = await builders.makeCastAddData(body, { fid, timestamp, network });
    const isValid = await validations.validateMessageData(data._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeCastRemoveData', () => {
  const tsHash = Factories.TsHash.build();
  const tsHashHex = bytesToHexString(tsHash)._unsafeUnwrap();

  test('succeeds', async () => {
    const data = await builders.makeCastRemoveData({ targetTsHash: tsHashHex }, { fid, timestamp, network });
    const isValid = await validations.validateMessageData(data._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeCastAdd', () => {
  test('succeeds', async () => {
    const body: types.CastAddBody = {
      text: faker.random.alphaNumeric(200),
      mentions: [faker.datatype.number({ min: 1 }), faker.datatype.number({ min: 1 })],
      parent: { fid: faker.datatype.number({ min: 1 }), tsHash },
      embeds: [faker.internet.url()],
    };
    const message = await builders.makeCastAdd(body, { fid, timestamp, network }, ed25519Signer);
    const isValid = await validations.validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeCastRemove', () => {
  const tsHash = Factories.TsHash.build();
  const tsHashHex = bytesToHexString(tsHash)._unsafeUnwrap();

  test('succeeds', async () => {
    const message = await builders.makeCastRemove(
      { targetTsHash: tsHashHex },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeReactionAddData', () => {
  test('succeeds', async () => {
    const data = await builders.makeReactionAddData(
      { type: Factories.ReactionType.build(), target: { fid, tsHash } },
      { fid, timestamp, network }
    );
    const isValid = await validations.validateMessageData(data._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeReactionRemoveData', () => {
  test('succeeds', async () => {
    const data = await builders.makeReactionRemoveData(
      { type: Factories.ReactionType.build(), target: { fid, tsHash } },
      { fid, timestamp, network }
    );
    const isValid = await validations.validateMessageData(data._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeReactionAdd', () => {
  test('succeeds', async () => {
    const message = await builders.makeReactionAdd(
      { type: Factories.ReactionType.build(), target: { fid, tsHash } },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeReactionRemove', () => {
  test('succeeds', async () => {
    const message = await builders.makeReactionRemove(
      { type: Factories.ReactionType.build(), target: { fid, tsHash } },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeAmpAddData', () => {
  test('succeeds', async () => {
    const data = await builders.makeAmpAddData(
      { user: faker.datatype.number({ min: 1 }) },
      { fid, timestamp, network }
    );
    const isValid = await validations.validateMessageData(data._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeAmpRemoveData', () => {
  test('succeeds', async () => {
    const data = await builders.makeAmpRemoveData(
      { user: faker.datatype.number({ min: 1 }) },
      { fid, timestamp, network }
    );
    const isValid = await validations.validateMessageData(data._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeAmpAdd', () => {
  test('succeeds', async () => {
    const message = await builders.makeAmpAdd(
      { user: faker.datatype.number({ min: 1 }) },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeAmpRemove', () => {
  test('succeeds', async () => {
    const message = await builders.makeAmpRemove(
      { user: faker.datatype.number({ min: 1 }) },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationAddEthAddressData', () => {
  let ethSignature: Uint8Array;
  const signer = Factories.Eip712Signer.build();
  const address = signer.signerKeyHex;
  const blockHash = Factories.BlockHashHex.build();
  const claim = Factories.VerificationEthAddressClaim.build({ blockHash, fid }, { transient: { signer } });

  beforeAll(async () => {
    ethSignature = (await signer.signVerificationEthAddressClaim(claim))._unsafeUnwrap();
  });

  test('succeeds', async () => {
    const data = await builders.makeVerificationAddEthAddressData(
      { address, blockHash, ethSignature: bytesToHexString(ethSignature)._unsafeUnwrap() },
      { fid, timestamp, network }
    );
    const isValid = await validations.validateMessageData(data._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationRemoveData', () => {
  const signer = Factories.Eip712Signer.build();

  test('succeeds', async () => {
    const data = await builders.makeVerificationRemoveData(
      { address: signer.signerKeyHex },
      { fid, timestamp, network }
    );
    const isValid = await validations.validateMessageData(data._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationAddEthAddress', () => {
  let ethSignature: Uint8Array;
  const signer = Factories.Eip712Signer.build();
  const address = signer.signerKeyHex;
  const blockHash = Factories.BlockHashHex.build();
  const claim = Factories.VerificationEthAddressClaim.build({ blockHash, fid }, { transient: { signer } });

  beforeAll(async () => {
    ethSignature = (await signer.signVerificationEthAddressClaim(claim))._unsafeUnwrap();
  });

  test('succeeds', async () => {
    const message = await builders.makeVerificationAddEthAddress(
      { address, blockHash, ethSignature: bytesToHexString(ethSignature)._unsafeUnwrap() },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeVerificationRemove', () => {
  const signer = Factories.Eip712Signer.build();

  test('succeeds', async () => {
    const message = await builders.makeVerificationRemove(
      { address: signer.signerKeyHex },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerAddData', () => {
  test('succeeds', async () => {
    const data = await builders.makeSignerAddData({ signer: ed25519Signer.signerKeyHex }, { fid, timestamp, network });
    const isValid = await validations.validateMessageData(data._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeSignerRemoveData', () => {
  test('succeeds', async () => {
    const data = await builders.makeSignerRemoveData(
      { signer: ed25519Signer.signerKeyHex },
      { fid, timestamp, network }
    );
    const isValid = await validations.validateMessageData(data._unsafeUnwrap().flatbuffer);
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
    const isValid = await validations.validateMessage(message._unsafeUnwrap().flatbuffer);
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
    const isValid = await validations.validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeUserDataAddData', () => {
  test('succeeds', async () => {
    const data = await builders.makeUserDataAddData(
      { type: flatbuffers.UserDataType.Bio, value: faker.lorem.word() },
      { fid, timestamp, network }
    );
    const isValid = await validations.validateMessageData(data._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeUserDataAdd', () => {
  test('succeeds', async () => {
    const message = await builders.makeUserDataAdd(
      { type: flatbuffers.UserDataType.Bio, value: faker.lorem.word() },
      { fid, timestamp, network },
      ed25519Signer
    );
    const isValid = await validations.validateMessage(message._unsafeUnwrap().flatbuffer);
    expect(isValid.isOk()).toBeTruthy();
  });
});

describe('makeMessageHash', () => {
  test('succeeds', async () => {
    const body = { text: faker.random.alphaNumeric(200) };
    const message = await builders.makeCastAdd(body, { fid, network, timestamp }, ed25519Signer);
    const data = builders.makeCastAddData(body, { fid, network, timestamp });
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

    const isValid = await validations.validateMessage(message._unsafeUnwrap().flatbuffer);
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
