import { faker } from '@faker-js/faker';
import { Factories, getFarcasterTime } from '@farcaster/utils';
import * as protobufs from '..';

test('succeeds', () => {
  const dataPayload: protobufs.MessageData = {
    castAddBody: {
      text: faker.random.alphaNumeric(200),
      embeds: [faker.internet.url(), faker.internet.url()],
      mentions: [Factories.FID.build(), Factories.FID.build()],
      parentCastId: { fid: Factories.FID.build(), hash: Factories.TsHash.build() },
    },
    type: protobufs.MessageType.MESSAGE_TYPE_CAST_ADD,
    timestamp: getFarcasterTime()._unsafeUnwrap(),
    fid: Factories.FID.build(),
    network: protobufs.FarcasterNetwork.FARCASTER_NETWORK_TESTNET,
  };

  const createdData = protobufs.MessageData.create(dataPayload);
  const dataBuffer = protobufs.MessageData.encode(createdData).finish();

  const messagePayload: protobufs.Message = {
    data: dataBuffer,
    hash: Factories.Bytes.build({}, { transient: { length: 16 } }),
    hashScheme: protobufs.HashScheme.HASH_SCHEME_BLAKE3,
    signature: Factories.Bytes.build({}, { transient: { length: 64 } }),
    signatureScheme: protobufs.SignatureScheme.SIGNATURE_SCHEME_ED25519,
    signer: Factories.Bytes.build({}, { transient: { length: 32 } }),
  };

  const createdMessage = protobufs.Message.create(messagePayload);

  const buffer = protobufs.Message.encode(createdMessage).finish();

  expect(buffer).toBeDefined();
});
