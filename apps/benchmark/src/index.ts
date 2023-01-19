import { faker } from '@faker-js/faker';
import * as flatbuffers from '@farcaster/flatbuffers';
import * as protobufs from '@farcaster/protobufs';
import { Factories, getFarcasterTime } from '@farcaster/utils';
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

const logger = Pino({});

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

// Log memory usage in MB
const logMemoryUsage = (type: 'flatbuffer' | 'protobuf', phase: 'encode' | 'decode') => {
  const memory = process.memoryUsage();
  const cpu = process.cpuUsage();
  // Using console.log because it's easier to copy into spreadsheet
  // eslint-disable-next-line no-console
  console.log(
    type,
    phase,
    memory.rss / 1_000_000,
    memory.heapTotal / 1_000_000,
    memory.heapUsed / 1_000_000,
    memory.external / 1_000_000,
    memory.arrayBuffers / 1_000_000,
    cpu.user / 1_000_000,
    cpu.system / 1_000_000
  );
};

const generateTestData = async (numTestCases: number): Promise<CastTestData[]> => {
  const testData: CastTestData[] = [];
  const start = performance.now();
  for (let i = 0; i < numTestCases; i++) {
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

const encodeFlatbuffer = (testCase: CastTestData): Uint8Array => {
  const bodyT = new flatbuffers.CastAddBodyT(
    testCase.body.embeds,
    testCase.body.mentions.map((mention) => new flatbuffers.UserIdT(Array.from(mention.fid))),
    flatbuffers.TargetId.CastId,
    new flatbuffers.CastIdT(Array.from(testCase.body.parent.fid), Array.from(testCase.body.parent.tsHash)),
    testCase.body.text
  );

  const dataBuilder = new Builder();

  const messageData = flatbuffers.MessageData.createMessageData(
    dataBuilder,
    flatbuffers.MessageBody.CastAddBody,
    dataBuilder.createObjectOffset(bodyT),
    testCase.data.type,
    testCase.data.timestamp,
    flatbuffers.MessageData.createFidVector(dataBuilder, testCase.data.fid),
    testCase.data.network
  );

  dataBuilder.finish(messageData);
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

  return builder.asUint8Array();
};

const decodeFlatbuffer = (bytes: Uint8Array): void => {
  const message = flatbuffers.Message.getRootAsMessage(new ByteBuffer(bytes as Uint8Array));
  const data = flatbuffers.MessageData.getRootAsMessageData(new ByteBuffer(message.dataArray() ?? new Uint8Array()));

  message.hashArray();
  data.fidArray();
  data.body(new flatbuffers.CastAddBody()).text();
  return undefined;
};

const encodeProtobuf = (testCase: CastTestData): Uint8Array => {
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

  const createdData = protobufs.MessageData.create(dataPayload);

  const dataBuffer = protobufs.MessageData.encode(createdData).finish();

  const messagePayload = {
    data: dataBuffer,
    hash: testCase.hash,
    hashScheme: testCase.hashScheme,
    signature: testCase.signature,
    signatureScheme: testCase.signatureScheme,
    signer: testCase.signer,
  };

  const createdMessage = protobufs.Message.create(messagePayload);

  return new Uint8Array(protobufs.Message.encode(createdMessage).finish());
};

const decodeProtobuf = (bytes: Uint8Array): void => {
  const message = protobufs.Message.decode(bytes);
  const data = protobufs.MessageData.decode(message.data);

  message.hash;
  data.fid;
  data.castAddBody?.text;

  return undefined;
};

const runTimedTest = async (
  testData: CastTestData[],
  time: number,
  encode: (testCase: CastTestData) => Uint8Array,
  decode: (bytes: Uint8Array) => void,
  type: 'flatbuffer' | 'protobuf'
) => {
  const encodeUntil = performance.now() + time / 2;
  const decodeUntil = encodeUntil + time / 2;

  // const encoded: Uint8Array[] = [];
  let encodedCount = 0;
  let lastEncoded: Uint8Array = new Uint8Array();
  let encodeSize = 0;
  let decodeCount = 0;
  let encodeTime = 0;
  let decodeTime = 0;
  let lastMemory = 0;

  // Encode
  while (performance.now() < encodeUntil) {
    const i = Math.floor(Math.random() * (testData.length - 1));

    if (performance.now() - lastMemory > 50) {
      logMemoryUsage(type, 'encode');
      lastMemory = performance.now();
    }

    const testCase = testData[i] as CastTestData;

    // Encode
    const encodeStart = performance.now();

    const bytes = encode(testCase);

    encodeSize += bytes.length;
    // encoded.push(bytes);
    lastEncoded = bytes;
    encodedCount += 1;
    encodeTime += performance.now() - encodeStart;
  }

  // Decode
  while (performance.now() < decodeUntil) {
    if (performance.now() - lastMemory > 50) {
      logMemoryUsage(type, 'decode');
      lastMemory = performance.now();
    }

    const decodeStart = performance.now();
    // const i = Math.floor(Math.random() * (encoded.length - 1));

    // decode(encoded[i] as Uint8Array);
    decode(lastEncoded);

    decodeCount += 1;
    decodeTime += performance.now() - decodeStart;
  }

  logger.info(
    {
      encodedCount: encodedCount,
      encodeTime: (encodeTime * 1000) / encodedCount,
      decoded: decodeCount,
      decodeTime: (decodeTime * 1000) / encodedCount,
      avgMessageSize: encodeSize / encodedCount,
    },
    type
  );
};

const runBenchmark = async () => {
  const testData = await generateTestData(100);

  // Run flatbuffer test for 30s
  runTimedTest(testData, 60_000, encodeFlatbuffer, decodeFlatbuffer, 'flatbuffer');

  // Run protobuf test for 30s
  runTimedTest(testData, 30_000, encodeProtobuf, decodeProtobuf, 'protobuf');
};

runBenchmark();
