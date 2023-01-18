import { faker } from '@faker-js/faker';
import * as flatbuffers from '@farcaster/flatbuffers';
import * as protobufs from '@farcaster/protobufs';
import { bytesCompare, Factories, getFarcasterTime } from '@farcaster/utils';
import { Builder, ByteBuffer } from 'flatbuffers';
import { default as Pino } from 'pino';

type CastTestData = {
  body: {
    text: string;
    embeds: string[];
    mentions: { fid: Uint8Array }[];
    parent: { fid: Uint8Array; tsHash: Uint8Array };
  };
  data: {
    fid: Uint8Array;
    network: flatbuffers.FarcasterNetwork;
    type: flatbuffers.MessageType;
    timestamp: number;
  };
  hash: Uint8Array;
  hashScheme: flatbuffers.HashScheme;
  signature: Uint8Array;
  signatureScheme: flatbuffers.SignatureScheme;
  signer: Uint8Array;
};

const testCases = 10000;
const logger = Pino({});

const generateTestData = async (): Promise<CastTestData[]> => {
  const testData: CastTestData[] = [];
  const start = performance.now();
  for (let i = 0; i < testCases; i++) {
    const body = {
      text: faker.random.alphaNumeric(200),
      embeds: [faker.internet.url(), faker.internet.url()],
      mentions: [{ fid: Factories.FID.build() }, { fid: Factories.FID.build() }],
      parent: { fid: Factories.FID.build(), tsHash: Factories.TsHash.build() },
    };
    const data = {
      fid: Factories.FID.build(),
      network: flatbuffers.FarcasterNetwork.Testnet,
      type: flatbuffers.MessageType.CastAdd,
      timestamp: getFarcasterTime()._unsafeUnwrap(),
    };
    const testCase = {
      body,
      data,
      hash: Factories.Bytes.build({}, { transient: { length: 16 } }),
      hashScheme: flatbuffers.HashScheme.Blake3,
      signature: Factories.Bytes.build({}, { transient: { length: 64 } }),
      signatureScheme: flatbuffers.SignatureScheme.Ed25519,
      signer: Factories.Bytes.build({}, { transient: { length: 32 } }),
    };

    testData.push(testCase);
  }

  logger.info({ time: performance.now() - start }, 'generateTestData');
  return testData;
};

const testFlatbuffers = async (testData: CastTestData[]) => {
  const startRss = process.memoryUsage.rss();
  const messages: Uint8Array[] = [];
  let totalSize = 0;

  const encodeStart = performance.now();

  for (const testCase of testData) {
    const bodyT = new flatbuffers.CastAddBodyT(
      testCase.body.embeds,
      testCase.body.mentions.map((mention) => new flatbuffers.UserIdT(Array.from(mention.fid))),
      flatbuffers.TargetId.CastId,
      new flatbuffers.CastIdT(Array.from(testCase.body.parent.fid), Array.from(testCase.body.parent.tsHash)),
      testCase.body.text
    );

    const dataBuilder = new Builder();

    const data = flatbuffers.MessageData.createMessageData(
      dataBuilder,
      flatbuffers.MessageBody.CastAddBody,
      dataBuilder.createObjectOffset(bodyT),
      testCase.data.type,
      testCase.data.timestamp,
      flatbuffers.MessageData.createFidVector(dataBuilder, testCase.data.fid),
      testCase.data.network
    );

    dataBuilder.finish(data);
    const dataBytes = dataBuilder.asUint8Array();

    const builder = new Builder();

    const offset = flatbuffers.Message.createMessage(
      builder,
      flatbuffers.Message.createDataVector(builder, dataBytes),
      flatbuffers.Message.createHashVector(builder, testCase.hash),
      testCase.hashScheme,
      flatbuffers.Message.createSignatureVector(builder, testCase.signature),
      testCase.signatureScheme,
      flatbuffers.Message.createSignerVector(builder, testCase.signer)
    );

    builder.finish(offset);

    const bytes = builder.asUint8Array();
    messages.push(bytes);
    totalSize += bytes.length;
  }

  const decodeStart = performance.now();

  for (let i = 0; i < testData.length; i++) {
    const message = flatbuffers.Message.getRootAsMessage(new ByteBuffer(messages[i] as Uint8Array));
    const data = flatbuffers.MessageData.getRootAsMessageData(new ByteBuffer(message.dataArray() ?? new Uint8Array()));
    const testCase = testData[i] as CastTestData;
    if (
      bytesCompare(message.hashArray() as Uint8Array, testCase.hash) !== 0 ||
      bytesCompare(data.fidArray() as Uint8Array, testCase?.data.fid) !== 0 ||
      data.body(new flatbuffers.CastAddBody()).text() !== testCase?.body.text
    ) {
      throw new Error('no match');
    }
  }

  logger.info(
    {
      encodeTime: decodeStart - encodeStart,
      decodeTime: performance.now() - decodeStart,
      avgMessageSize: totalSize / messages.length,
      avgRss: (process.memoryUsage.rss() - startRss) / messages.length,
    },
    'testFlatbuffers'
  );
};

const testProtobufs = async (testData: CastTestData[]) => {
  const startRss = process.memoryUsage.rss();
  const messages: Uint8Array[] = [];
  let totalSize = 0;

  const encodeStart = performance.now();

  for (const testCase of testData) {
    const dataPayload = {
      castAddBody: {
        text: testCase.body.text,
        embeds: testCase.body.embeds,
        mentions: testCase.body.mentions,
        castId: testCase.body.parent,
      },
      type: testCase.data.type,
      timestamp: testCase.data.timestamp,
      fid: testCase.data.fid,
      network: testCase.data.network,
    };

    const data = protobufs.MessageData.create(dataPayload);

    const dataBuffer = new Uint8Array(protobufs.MessageData.encode(data).finish());

    const messagePayload = {
      data: dataBuffer,
      hash: testCase.hash,
      hashScheme: testCase.hashScheme,
      signature: testCase.signature,
      signatureScheme: testCase.signatureScheme,
      signer: testCase.signer,
    };

    const message = protobufs.Message.create(messagePayload);

    const messageBuffer = new Uint8Array(protobufs.Message.encode(message).finish());

    totalSize += messageBuffer.length;
    messages.push(messageBuffer);
  }

  const decodeStart = performance.now();

  for (let i = 0; i < testData.length; i++) {
    const message = protobufs.Message.decode(messages[i] as Uint8Array);
    const data = protobufs.MessageData.decode(message.data);
    const testCase = testData[i] as CastTestData;
    if (
      bytesCompare(message.hash, testCase.hash) !== 0 ||
      bytesCompare(data.fid, testCase?.data.fid) !== 0 ||
      data.castAddBody?.text !== testCase?.body.text
    ) {
      throw new Error('no match');
    }
  }

  logger.info(
    {
      encodeTime: decodeStart - encodeStart,
      decodeTime: performance.now() - decodeStart,
      avgMessageSize: totalSize / messages.length,
      avgRss: (process.memoryUsage.rss() - startRss) / messages.length,
    },
    'testProtobufs'
  );
};

const runBenchmark = async () => {
  const testData = await generateTestData();
  await testProtobufs(testData);
  await testFlatbuffers(testData);
};

runBenchmark();
