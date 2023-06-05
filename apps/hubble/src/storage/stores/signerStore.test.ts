import {
  bytesDecrement,
  bytesIncrement,
  Eip712Signer,
  Factories,
  getFarcasterTime,
  HubError,
  IdRegistryEvent,
  MergeIdRegistryEventHubEvent,
  MergeMessageHubEvent,
  Message,
  PruneMessageHubEvent,
  RevokeMessageHubEvent,
  SignerAddMessage,
  SignerRemoveMessage,
} from '@farcaster/hub-nodejs';
import { jestRocksDB } from '../db/jestUtils.js';
import { getMessage, makeFidKey, makeTsHash } from '../db/message.js';
import { UserPostfix } from '../db/types.js';
import SignerStore from './signerStore.js';
import StoreEventHandler from './storeEventHandler.js';
import { err } from 'neverthrow';

const db = jestRocksDB('protobufs.signerStore.test');
const eventHandler = new StoreEventHandler(db);
const set = new SignerStore(db, eventHandler);
const signer = Factories.Ed25519Signer.build();
const fid = Factories.Fid.build();
const fid2 = fid + 1; // Increment fid to guarantee ordering

let signerKey: Uint8Array;
let custody1: Eip712Signer;
let custody1Address: Uint8Array;
let custody2: Eip712Signer;
let custody2Address: Uint8Array;

let custody1Event: IdRegistryEvent;
let custody2Event: IdRegistryEvent;
let signerAdd: SignerAddMessage;
let signerRemove: SignerRemoveMessage;

beforeAll(async () => {
  signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  custody1 = Factories.Eip712Signer.build();
  custody1Address = (await custody1.getSignerKey())._unsafeUnwrap();
  custody2 = Factories.Eip712Signer.build();
  custody2Address = (await custody2.getSignerKey())._unsafeUnwrap();
  custody1Event = Factories.IdRegistryEvent.build({
    fid,
    to: custody1Address,
  });
  custody2Event = Factories.IdRegistryEvent.build({
    fid: fid2,
    to: custody2Address,
  });
  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, signerAddBody: { signer: signerKey } } },
    { transient: { signer: custody1 } }
  );
  signerRemove = await Factories.SignerRemoveMessage.create(
    {
      data: { fid, signerRemoveBody: { signer: signerKey }, timestamp: signerAdd.data.timestamp + 1 },
    },
    { transient: { signer: custody1 } }
  );
});

beforeEach(async () => {
  await eventHandler.syncCache();
});

describe('getIdRegistryEvent', () => {
  test('returns contract event if it exists', async () => {
    await set.mergeIdRegistryEvent(custody1Event);
    await expect(set.getIdRegistryEvent(fid)).resolves.toEqual(custody1Event);
  });

  test('fails if event is missing', async () => {
    await expect(set.getIdRegistryEvent(fid)).rejects.toThrow(HubError);
  });
});

describe('getIdRegistryEventByAddress', () => {
  test('returns contract event if it exists', async () => {
    await set.mergeIdRegistryEvent(custody1Event);
    await expect(set.getIdRegistryEventByAddress(custody1Event.to)).resolves.toEqual(custody1Event);
  });

  test('fails if event is missing', async () => {
    await expect(set.getIdRegistryEventByAddress(custody1Event.to)).rejects.toThrow(HubError);
  });
});

describe('getSignerAdd', () => {
  test('fails if missing', async () => {
    await expect(set.getSignerAdd(fid, signerKey)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await set.merge(signerAdd);
    await expect(set.getSignerAdd(fid, signerKey)).resolves.toEqual(signerAdd);
  });
});

describe('getSignerRemove', () => {
  test('fails if missing', async () => {
    await expect(set.getSignerRemove(fid, signerKey)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await set.merge(signerRemove);
    await expect(set.getSignerRemove(fid, signerKey)).resolves.toEqual(signerRemove);
  });
});

describe('getSignerAddsByFid', () => {
  test('returns empty array when messages have not been merged', async () => {
    const result = await set.getSignerAddsByFid(fid);
    expect(result.messages).toEqual([]);
  });

  describe('with messages', () => {
    let signerAdd2: SignerAddMessage;
    let signerAdd3: SignerAddMessage;
    let signerRemove4: SignerRemoveMessage;

    beforeAll(async () => {
      signerAdd2 = await Factories.SignerAddMessage.create(
        { data: { fid, timestamp: signerAdd.data.timestamp + 1 } },
        { transient: { signer: custody1 } }
      );
      signerAdd3 = await Factories.SignerAddMessage.create(
        { data: { fid, timestamp: signerAdd.data.timestamp + 2 } },
        { transient: { signer: custody1 } }
      );

      signerRemove4 = await Factories.SignerRemoveMessage.create(
        { data: { fid } },
        { transient: { signer: custody1 } }
      );
    });

    beforeEach(async () => {
      await set.merge(signerAdd);
      await set.merge(signerAdd2);
      await set.merge(signerAdd3);
      await set.merge(signerRemove4);
    });

    test('returns all SignerAdd messages for an fid in chronological order without pageOptions', async () => {
      const result = await set.getSignerAddsByFid(fid);
      expect(result.messages).toEqual([signerAdd, signerAdd2, signerAdd3]);
    });

    test('returns all SignerAdd messages for an fid in reverse chronological order', async () => {
      const result = await set.getSignerAddsByFid(fid, { reverse: true });
      expect(result.messages).toEqual([signerAdd3, signerAdd2, signerAdd]);
    });

    test('returns limit messages with limit < number of messages', async () => {
      const result = await set.getSignerAddsByFid(fid, { pageSize: 1 });
      expect(result.messages).toEqual([signerAdd]);
    });

    test('returns limit messages with limit < number of messages in reverse', async () => {
      const result = await set.getSignerAddsByFid(fid, { pageSize: 1, reverse: true });
      expect(result.messages).toEqual([signerAdd3]);
    });

    test('returns all messages with limit > number of messages', async () => {
      const result = await set.getSignerAddsByFid(fid, { pageSize: 4 });
      expect(result).toEqual({ messages: [signerAdd, signerAdd2, signerAdd3], nextPageToken: undefined });
    });

    test('returns all messages with limit > number of messages in reverse', async () => {
      const result = await set.getSignerAddsByFid(fid, { pageSize: 4, reverse: true });
      expect(result).toEqual({ messages: [signerAdd3, signerAdd2, signerAdd], nextPageToken: undefined });
    });

    test('returns all messages with limit = number of messages', async () => {
      const result = await set.getSignerAddsByFid(fid, { pageSize: 3 });
      expect(result.messages).toEqual([signerAdd, signerAdd2, signerAdd3]);
    });

    test('returns all messages with limit = number of messages in reverse', async () => {
      const result = await set.getSignerAddsByFid(fid, { pageSize: 3, reverse: true });
      expect(result.messages).toEqual([signerAdd3, signerAdd2, signerAdd]);
    });

    test('returns messages from pageToken', async () => {
      const result1 = await set.getSignerAddsByFid(fid, { pageSize: 1 });
      const result2 = await set.getSignerAddsByFid(fid, { pageToken: result1.nextPageToken, pageSize: 1 });
      expect(result2.messages).toEqual([signerAdd2]);
      const result3 = await set.getSignerAddsByFid(fid, { pageToken: result2.nextPageToken, pageSize: 1 });
      expect(result3.messages).toEqual([signerAdd3]);
    });

    test('returns messages from pageToken in reverse', async () => {
      const result1 = await set.getSignerAddsByFid(fid, { pageSize: 1, reverse: true });
      expect(result1.messages).toEqual([signerAdd3]);
      const result2 = await set.getSignerAddsByFid(fid, {
        pageToken: result1.nextPageToken,
        pageSize: 1,
        reverse: true,
      });
      expect(result2.messages).toEqual([signerAdd2]);
      const result3 = await set.getSignerAddsByFid(fid, {
        pageToken: result2.nextPageToken,
        pageSize: 1,
        reverse: true,
      });
      expect(result3.messages).toEqual([signerAdd]);
    });

    test('returns empty array with invalid pageToken', async () => {
      const invalidPageKey = new Uint8Array([255]);
      const results = await set.getSignerAddsByFid(fid, { pageToken: invalidPageKey });
      expect(results).toEqual({ messages: [], nextPageToken: undefined });
    });

    test('returns empty array with invalid pageToken in reverse', async () => {
      const invalidPageKey = new Uint8Array([0]);
      const results = await set.getSignerAddsByFid(fid, { pageToken: invalidPageKey, reverse: true });
      expect(results).toEqual({ messages: [], nextPageToken: undefined });
    });
  });
});

describe('getSignerRemovesByFid', () => {
  test('returns empty array when messages have not been merged', async () => {
    const result = await set.getSignerRemovesByFid(fid);
    expect(result.messages).toEqual([]);
  });

  describe('with messages', () => {
    let signerRemove2: SignerRemoveMessage;
    let signerAdd3: SignerAddMessage;

    beforeAll(async () => {
      signerRemove2 = await Factories.SignerRemoveMessage.create(
        { data: { fid, timestamp: signerRemove.data.timestamp + 1 } },
        { transient: { signer: custody1 } }
      );
      signerAdd3 = await Factories.SignerAddMessage.create(
        { data: { fid, timestamp: signerAdd.data.timestamp + 2 } },
        { transient: { signer: custody1 } }
      );
    });

    beforeEach(async () => {
      await set.merge(signerRemove);
      await set.merge(signerRemove2);
      await set.merge(signerAdd3);
    });

    test('returns all SignerAdd messages for an fid in chronological order without pageOptions', async () => {
      const result = await set.getSignerRemovesByFid(fid);
      expect(result.messages).toEqual([signerRemove, signerRemove2]);
    });

    test('returns limit messages with limit < number of messages', async () => {
      const result = await set.getSignerRemovesByFid(fid, { pageSize: 1 });
      expect(result.messages).toEqual([signerRemove]);
    });

    test('returns all messages with limit > number of messages', async () => {
      const result = await set.getSignerRemovesByFid(fid, { pageSize: 4 });
      expect(result).toEqual({ messages: [signerRemove, signerRemove2], nextPageToken: undefined });
    });

    test('returns all messages with limit = number of messages', async () => {
      const result = await set.getSignerRemovesByFid(fid, { pageSize: 3 });
      expect(result.messages).toEqual([signerRemove, signerRemove2]);
    });

    test('returns messages from pageToken', async () => {
      const results1 = await set.getSignerRemovesByFid(fid, { pageSize: 1 });
      expect(results1.messages).toEqual([signerRemove]);
      const results2 = await set.getSignerRemovesByFid(fid, { pageToken: results1.nextPageToken, pageSize: 1 });
      expect(results2.messages).toEqual([signerRemove2]);
    });

    test('returns empty array with invalid pageToken', async () => {
      const invalidPageKey = new Uint8Array([255]);
      const results = await set.getSignerRemovesByFid(fid, { pageToken: invalidPageKey });
      expect(results).toEqual({ messages: [], nextPageToken: undefined });
    });
  });
});

describe('getAllSignerMessagesByFid', () => {
  test('returns empty array when messages have not been merged', async () => {
    const result = await set.getAllSignerMessagesByFid(fid);
    expect(result.messages).toEqual([]);
  });

  describe('with messages', () => {
    let signerRemove2: SignerRemoveMessage;
    let signerAdd3: SignerAddMessage;

    beforeAll(async () => {
      signerRemove2 = await Factories.SignerRemoveMessage.create(
        { data: { fid, timestamp: signerAdd.data.timestamp + 1 } },
        { transient: { signer: custody1 } }
      );
      signerAdd3 = await Factories.SignerAddMessage.create(
        { data: { fid, timestamp: signerAdd.data.timestamp + 2 } },
        { transient: { signer: custody1 } }
      );
    });

    beforeEach(async () => {
      await set.merge(signerAdd);
      await set.merge(signerRemove2);
      await set.merge(signerAdd3);
    });

    test('returns all SignerAdd and SignerRemove messages for an fid in chronological order without pageOptions', async () => {
      const result = await set.getAllSignerMessagesByFid(fid);
      expect(result.messages).toEqual([signerAdd, signerRemove2, signerAdd3]);
    });

    test('returns limit messages with limit < number of messages', async () => {
      const result = await set.getAllSignerMessagesByFid(fid, { pageSize: 1 });
      expect(result.messages).toEqual([signerAdd]);
    });

    test('returns all messages with limit > number of messages', async () => {
      const result = await set.getAllSignerMessagesByFid(fid, { pageSize: 4 });
      expect(result).toEqual({ messages: [signerAdd, signerRemove2, signerAdd3], nextPageToken: undefined });
    });

    test('returns all messages with limit = number of messages', async () => {
      const result = await set.getAllSignerMessagesByFid(fid, { pageSize: 3 });
      expect(result.messages).toEqual([signerAdd, signerRemove2, signerAdd3]);
    });

    test('returns messages from pageToken', async () => {
      const result1 = await set.getAllSignerMessagesByFid(fid, { pageSize: 1 });
      expect(result1.messages).toEqual([signerAdd]);
      const result2 = await set.getAllSignerMessagesByFid(fid, { pageToken: result1.nextPageToken, pageSize: 2 });
      expect(result2.messages).toEqual([signerRemove2, signerAdd3]);
    });

    test('returns empty array with invalid pageToken', async () => {
      const invalidPageKey = new Uint8Array([255]);
      const results = await set.getAllSignerMessagesByFid(fid, { pageToken: invalidPageKey });
      expect(results).toEqual({ messages: [], nextPageToken: undefined });
    });
  });
});

// TODO: write test cases for cyclical custody event transfers

describe('mergeIdRegistryEvent', () => {
  let mergedContractEvents: IdRegistryEvent[];

  const handleMergeEvent = (event: MergeIdRegistryEventHubEvent) => {
    mergedContractEvents.push(event.mergeIdRegistryEventBody.idRegistryEvent);
  };

  beforeAll(() => {
    eventHandler.on('mergeIdRegistryEvent', handleMergeEvent);
  });

  beforeEach(() => {
    mergedContractEvents = [];
  });

  afterAll(() => {
    eventHandler.off('mergeIdRegistryEvent', handleMergeEvent);
  });

  test('succeeds', async () => {
    await expect(set.mergeIdRegistryEvent(custody1Event)).resolves.toBeGreaterThan(0);
    await expect(set.getIdRegistryEvent(fid)).resolves.toEqual(custody1Event);

    expect(mergedContractEvents).toEqual([custody1Event]);
  });

  test('fails if events have the same blockNumber but different blockHashes', async () => {
    const blockHashConflictEvent = Factories.IdRegistryEvent.build({
      ...custody1Event,
      blockHash: Factories.BlockHash.build(),
    });

    await set.mergeIdRegistryEvent(custody1Event);
    await expect(set.mergeIdRegistryEvent(blockHashConflictEvent)).rejects.toThrow(
      new HubError('bad_request.invalid_param', 'block hash mismatch')
    );

    expect(mergedContractEvents).toEqual([custody1Event]);
  });

  test('fails if events have the same blockNumber and logIndex but different transactionHashes', async () => {
    const txHashConflictEvent = Factories.IdRegistryEvent.build({
      ...custody1Event,
      transactionHash: Factories.TransactionHash.build(),
    });

    await set.mergeIdRegistryEvent(custody1Event);
    await expect(set.mergeIdRegistryEvent(txHashConflictEvent)).rejects.toThrow(HubError);

    expect(mergedContractEvents).toEqual([custody1Event]);
  });

  describe('overwrites existing event', () => {
    let newEvent: IdRegistryEvent;

    beforeEach(async () => {
      await set.mergeIdRegistryEvent(custody1Event);
      await set.merge(signerAdd);
      await expect(set.getSignerAdd(fid, signerKey)).resolves.toEqual(signerAdd);
    });

    afterEach(async () => {
      await expect(set.mergeIdRegistryEvent(newEvent)).resolves.toBeGreaterThan(0);
      await expect(set.getIdRegistryEvent(fid)).resolves.toEqual(newEvent);
      expect(mergedContractEvents).toEqual([custody1Event, newEvent]);
      // SignerAdd should still be valid until messages signed by old custody address are revoked
      await expect(set.getSignerAdd(fid, signerKey)).resolves.toEqual(signerAdd);
    });

    test('when it has a higher block number', async () => {
      newEvent = Factories.IdRegistryEvent.build({
        ...custody1Event,
        transactionHash: Factories.TransactionHash.build(),
        to: custody2Address,
        blockNumber: custody1Event.blockNumber + 1,
      });
    });

    test('when it has the same block number and a higher log index', async () => {
      newEvent = Factories.IdRegistryEvent.build({
        ...custody1Event,
        transactionHash: Factories.TransactionHash.build(),
        to: custody2Address,
        logIndex: custody1Event.logIndex + 1,
      });
    });
  });

  describe('does not overwrite existing event', () => {
    let newEvent: IdRegistryEvent;

    beforeEach(async () => {
      await set.mergeIdRegistryEvent(custody1Event);
      await set.merge(signerAdd);
      await expect(set.getSignerAdd(fid, signerKey)).resolves.toEqual(signerAdd);
    });

    afterEach(async () => {
      await expect(set.mergeIdRegistryEvent(newEvent)).rejects.toThrow(
        new HubError('bad_request.conflict', 'event conflicts with a more recent IdRegistryEvent')
      );
      await expect(set.getIdRegistryEvent(fid)).resolves.toEqual(custody1Event);
      await expect(set.getSignerAdd(fid, signerKey)).resolves.toEqual(signerAdd);

      expect(mergedContractEvents).toEqual([custody1Event]);
    });

    test('when it has a lower block number', async () => {
      newEvent = Factories.IdRegistryEvent.build({
        ...custody1Event,
        transactionHash: Factories.TransactionHash.build(),
        to: custody2Address,
        blockNumber: custody1Event.blockNumber - 1,
      });
    });

    test('when it has the same block number and a lower log index', async () => {
      newEvent = Factories.IdRegistryEvent.build({
        ...custody1Event,
        to: custody2Address,
        logIndex: custody1Event.logIndex - 1,
      });
    });

    test('when is a duplicate', async () => {
      newEvent = custody1Event;
    });
  });
});

describe('merge', () => {
  let mergeEvents: [Message | undefined, Message[]][] = [];

  const mergeMessageHandler = (event: MergeMessageHubEvent) => {
    const { message, deletedMessages } = event.mergeMessageBody;
    mergeEvents.push([message, deletedMessages ?? []]);
  };

  beforeAll(() => {
    eventHandler.on('mergeMessage', mergeMessageHandler);
  });

  beforeEach(() => {
    mergeEvents = [];
  });

  afterAll(() => {
    eventHandler.off('mergeMessage', mergeMessageHandler);
  });

  const assertSignerExists = async (message: SignerAddMessage | SignerRemoveMessage) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.SignerMessage, tsHash)).resolves.toEqual(message);
  };

  const assertSignerDoesNotExist = async (message: SignerAddMessage | SignerRemoveMessage) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.SignerMessage, tsHash)).rejects.toThrow(HubError);
  };

  const assertSignerAddWins = async (message: SignerAddMessage) => {
    await assertSignerExists(message);
    await expect(set.getSignerAdd(fid, signerKey)).resolves.toEqual(message);
    await expect(set.getSignerRemove(fid, signerKey)).rejects.toThrow(HubError);
  };

  const assertSignerRemoveWins = async (message: SignerRemoveMessage) => {
    await assertSignerExists(message);
    await expect(set.getSignerRemove(fid, signerKey)).resolves.toEqual(message);
    await expect(set.getSignerAdd(fid, signerKey)).rejects.toThrow(HubError);
  };

  test('fails with invalid message type', async () => {
    const message = await Factories.CastAddMessage.create();
    await expect(set.merge(message)).rejects.toThrow(HubError);

    expect(mergeEvents).toEqual([]);
  });

  describe('SignerAdd', () => {
    test('succeeds', async () => {
      await expect(set.merge(signerAdd)).resolves.toBeGreaterThan(0);
      await assertSignerAddWins(signerAdd);

      expect(mergeEvents).toEqual([[signerAdd, []]]);
    });

    test('fails when merged twice', async () => {
      await expect(set.merge(signerAdd)).resolves.toBeGreaterThan(0);
      await expect(set.merge(signerAdd)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );

      await assertSignerAddWins(signerAdd);

      expect(mergeEvents).toEqual([[signerAdd, []]]);
    });

    describe('with a conflicting SignerAdd with different timestamps', () => {
      let signerAddLater: SignerAddMessage;

      beforeAll(async () => {
        signerAddLater = await Factories.SignerAddMessage.create(
          {
            data: {
              ...signerAdd.data,
              timestamp: signerAdd.data.timestamp + 1,
            },
          },
          { transient: { signer: custody1 } }
        );
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(signerAdd);
        await expect(set.merge(signerAddLater)).resolves.toBeGreaterThan(0);

        await assertSignerDoesNotExist(signerAdd);
        await assertSignerAddWins(signerAddLater);

        expect(mergeEvents).toEqual([
          [signerAdd, []],
          [signerAddLater, [signerAdd]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        await set.merge(signerAddLater);
        await expect(set.merge(signerAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent add')
        );

        await assertSignerDoesNotExist(signerAdd);
        await assertSignerAddWins(signerAddLater);

        expect(mergeEvents).toEqual([[signerAddLater, []]]);
      });
    });

    describe('with a conflicting SignerAdd with identical timestamps', () => {
      let signerAddLater: SignerAddMessage;

      beforeAll(async () => {
        signerAddLater = await Factories.SignerAddMessage.create(
          {
            data: { ...signerAdd.data },
            hash: bytesIncrement(signerAdd.hash)._unsafeUnwrap(),
          },
          { transient: { signer: custody1 } }
        );
      });

      test('succeeds with a higher hash', async () => {
        await set.merge(signerAdd);
        await expect(set.merge(signerAddLater)).resolves.toBeGreaterThan(0);

        await assertSignerDoesNotExist(signerAdd);
        await assertSignerAddWins(signerAddLater);
        expect(mergeEvents).toEqual([
          [signerAdd, []],
          [signerAddLater, [signerAdd]],
        ]);
      });

      test('fails with a lower hash', async () => {
        await set.merge(signerAddLater);
        await expect(set.merge(signerAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent add')
        );

        await assertSignerDoesNotExist(signerAdd);
        await assertSignerAddWins(signerAddLater);
        expect(mergeEvents).toEqual([[signerAddLater, []]]);
      });
    });

    describe('with conflicting SignerRemove with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        const signerRemoveEarlier = await Factories.SignerRemoveMessage.create(
          {
            data: { ...signerRemove.data, timestamp: signerAdd.data.timestamp - 1 },
          },
          { transient: { signer: custody1 } }
        );

        await set.merge(signerRemoveEarlier);
        await expect(set.merge(signerAdd)).resolves.toBeGreaterThan(0);

        await assertSignerAddWins(signerAdd);
        await assertSignerDoesNotExist(signerRemoveEarlier);
        expect(mergeEvents).toEqual([
          [signerRemoveEarlier, []],
          [signerAdd, [signerRemoveEarlier]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        await set.merge(signerRemove);
        await expect(set.merge(signerAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent remove')
        );

        await assertSignerRemoveWins(signerRemove);
        await assertSignerDoesNotExist(signerAdd);
        expect(mergeEvents).toEqual([[signerRemove, []]]);
      });
    });

    describe('with conflicting SignerRemove with identical timestamps', () => {
      test('fails if remove has a higher hash', async () => {
        const signerRemoveLater = await Factories.SignerRemoveMessage.create(
          {
            data: { ...signerRemove.data, timestamp: signerAdd.data.timestamp },
          },
          { transient: { signer: custody1 } }
        );

        await set.merge(signerRemoveLater);
        await expect(set.merge(signerAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent remove')
        );

        await assertSignerRemoveWins(signerRemoveLater);
        await assertSignerDoesNotExist(signerAdd);
        expect(mergeEvents).toEqual([[signerRemoveLater, []]]);
      });

      test('fails if remove has a lower hash', async () => {
        const signerRemoveEarlier = await Factories.SignerRemoveMessage.create({
          data: { ...signerRemove.data, timestamp: signerAdd.data.timestamp },
          hash: bytesDecrement(signerAdd.hash)._unsafeUnwrap(),
        });

        await set.merge(signerRemoveEarlier);
        await expect(set.merge(signerAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent remove')
        );

        await assertSignerDoesNotExist(signerAdd);
        await assertSignerRemoveWins(signerRemoveEarlier);
        expect(mergeEvents).toEqual([[signerRemoveEarlier, []]]);
      });
    });
  });

  describe('SignerRemove', () => {
    test('succeeds', async () => {
      await expect(set.merge(signerRemove)).resolves.toBeGreaterThan(0);

      await assertSignerRemoveWins(signerRemove);
      expect(mergeEvents).toEqual([[signerRemove, []]]);
    });

    test('fails if merged twice', async () => {
      await expect(set.merge(signerRemove)).resolves.toBeGreaterThan(0);
      await expect(set.merge(signerRemove)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );

      await assertSignerRemoveWins(signerRemove);
      expect(mergeEvents).toEqual([[signerRemove, []]]);
    });

    describe('with a conflicting SignerRemove with different timestamps', () => {
      let signerRemoveLater: SignerRemoveMessage;

      beforeAll(async () => {
        signerRemoveLater = await Factories.SignerRemoveMessage.create(
          {
            data: { ...signerRemove.data, timestamp: signerRemove.data.timestamp + 1 },
          },
          { transient: { signer: custody1 } }
        );
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(signerRemove);
        await expect(set.merge(signerRemoveLater)).resolves.toBeGreaterThan(0);

        await assertSignerDoesNotExist(signerRemove);
        await assertSignerRemoveWins(signerRemoveLater);
        expect(mergeEvents).toEqual([
          [signerRemove, []],
          [signerRemoveLater, [signerRemove]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        await set.merge(signerRemoveLater);
        await expect(set.merge(signerRemove)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent remove')
        );

        await assertSignerDoesNotExist(signerRemove);
        await assertSignerRemoveWins(signerRemoveLater);
        expect(mergeEvents).toEqual([[signerRemoveLater, []]]);
      });
    });

    describe('with a conflicting SignerRemove with identical timestamps', () => {
      let signerRemoveLater: SignerRemoveMessage;

      beforeAll(async () => {
        signerRemoveLater = await Factories.SignerRemoveMessage.create(
          {
            data: { ...signerRemove.data },
            hash: bytesIncrement(signerRemove.hash)._unsafeUnwrap(),
          },
          { transient: { signer: custody1 } }
        );
      });

      test('succeeds with a higher hash', async () => {
        await set.merge(signerRemove);
        await expect(set.merge(signerRemoveLater)).resolves.toBeGreaterThan(0);

        await assertSignerDoesNotExist(signerRemove);
        await assertSignerRemoveWins(signerRemoveLater);
        expect(mergeEvents).toEqual([
          [signerRemove, []],
          [signerRemoveLater, [signerRemove]],
        ]);
      });

      test('fails with a lower hash', async () => {
        await set.merge(signerRemoveLater);
        await expect(set.merge(signerRemove)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent remove')
        );

        await assertSignerDoesNotExist(signerRemove);
        await assertSignerRemoveWins(signerRemoveLater);
        expect(mergeEvents).toEqual([[signerRemoveLater, []]]);
      });
    });

    describe('with conflicting SignerAdd with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        await set.merge(signerAdd);
        await expect(set.merge(signerRemove)).resolves.toBeGreaterThan(0);

        await assertSignerRemoveWins(signerRemove);
        await assertSignerDoesNotExist(signerAdd);
        expect(mergeEvents).toEqual([
          [signerAdd, []],
          [signerRemove, [signerAdd]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        const signerAddLater = await Factories.SignerAddMessage.create(
          {
            data: { ...signerAdd.data, timestamp: signerRemove.data.timestamp + 1 },
          },
          { transient: { signer: custody1 } }
        );

        await set.merge(signerAddLater);
        await expect(set.merge(signerRemove)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent add')
        );

        await assertSignerAddWins(signerAddLater);
        await assertSignerDoesNotExist(signerRemove);
        expect(mergeEvents).toEqual([[signerAddLater, []]]);
      });
    });

    describe('with conflicting SignerAdd with identical timestamps', () => {
      test('succeeds with a lower hash', async () => {
        const signerAddLater = await Factories.SignerAddMessage.create(
          {
            data: { ...signerAdd.data, timestamp: signerRemove.data.timestamp },
          },
          { transient: { signer: custody1 } }
        );

        await set.merge(signerAddLater);
        await expect(set.merge(signerRemove)).resolves.toBeGreaterThan(0);

        await assertSignerDoesNotExist(signerAddLater);
        await assertSignerRemoveWins(signerRemove);
        expect(mergeEvents).toEqual([
          [signerAddLater, []],
          [signerRemove, [signerAddLater]],
        ]);
      });

      test('succeeds with a higher hash', async () => {
        const signerAddEarlier = await Factories.SignerAddMessage.create(
          {
            data: { ...signerAdd.data, timestamp: signerRemove.data.timestamp },
            hash: bytesDecrement(signerRemove.hash)._unsafeUnwrap(),
          },
          { transient: { signer: custody1 } }
        );

        await set.merge(signerAddEarlier);
        await expect(set.merge(signerRemove)).resolves.toBeGreaterThan(0);

        await assertSignerDoesNotExist(signerAddEarlier);
        await assertSignerRemoveWins(signerRemove);
        expect(mergeEvents).toEqual([
          [signerAddEarlier, []],
          [signerRemove, [signerAddEarlier]],
        ]);
      });
    });
  });
});

describe('getFids', () => {
  test('returns empty array without custody events', async () => {
    const result = await set.getFids();
    expect(result).toEqual({ fids: [], nextPageToken: undefined });
  });

  describe('with fids', () => {
    beforeEach(async () => {
      custody2Event = Factories.IdRegistryEvent.build({
        fid: fid2,
        to: custody2Address,
      });
      await set.mergeIdRegistryEvent(custody1Event);
      await set.mergeIdRegistryEvent(custody2Event);
    });

    test('returns all fids for merged custody events without pageOptions', async () => {
      const result = await set.getFids();
      expect(result).toEqual({ fids: [fid, fid2], nextPageToken: undefined });
    });

    test('returns all fids for merged custody events in reverse', async () => {
      const result = await set.getFids({ reverse: true });
      expect(result).toEqual({ fids: [fid2, fid], nextPageToken: undefined });
    });

    test('returns limit fids with pageSize < number of messages', async () => {
      const result = await set.getFids({ pageSize: 1 });
      expect(result).toEqual({ fids: [fid], nextPageToken: Uint8Array.from(makeFidKey(fid)) });
    });

    test('returns limit fids with pageSize < number of messages in reverse', async () => {
      const result = await set.getFids({ pageSize: 1, reverse: true });
      expect(result).toEqual({ fids: [fid2], nextPageToken: Uint8Array.from(makeFidKey(fid2)) });
    });

    test('returns all fids with pageSize > number of messages', async () => {
      const result = await set.getFids({ pageSize: 3 });
      expect(result).toEqual({ fids: [fid, fid2], nextPageToken: undefined });
    });

    test('returns all fids with pageSize > number of messages in reverse', async () => {
      const result = await set.getFids({ pageSize: 3, reverse: true });
      expect(result).toEqual({ fids: [fid2, fid], nextPageToken: undefined });
    });

    test('returns fids from pageToken', async () => {
      const result1 = await set.getFids({ pageSize: 1 });
      expect(result1.fids).toEqual([fid]);
      const result2 = await set.getFids({ pageToken: result1.nextPageToken });
      expect(result2).toEqual({ fids: [fid2], nextPageToken: undefined });
    });

    test('returns fids from pageToken in reverse', async () => {
      const result1 = await set.getFids({ pageSize: 1, reverse: true });
      expect(result1.fids).toEqual([fid2]);
      const result2 = await set.getFids({ pageToken: result1.nextPageToken, reverse: true });
      expect(result2).toEqual({ fids: [fid], nextPageToken: undefined });
    });

    test('returns empty array with invalid pageToken', async () => {
      const invalidPageKey = Buffer.from([255]);
      const results = await set.getFids({ pageToken: invalidPageKey });
      expect(results).toEqual({ fids: [], nextPageToken: undefined });
    });

    test('returns empty array with invalid pageToken in reverse', async () => {
      const invalidPageKey = Buffer.from([0]);
      const results = await set.getFids({ pageToken: invalidPageKey, reverse: true });
      expect(results).toEqual({ fids: [], nextPageToken: undefined });
    });
  });
});

describe('revoke', () => {
  let revokedMessages: Message[] = [];

  const revokeMessageHandler = (event: RevokeMessageHubEvent) => {
    revokedMessages.push(event.revokeMessageBody.message);
  };

  beforeAll(() => {
    eventHandler.on('revokeMessage', revokeMessageHandler);
  });

  beforeEach(() => {
    revokedMessages = [];
  });

  afterAll(() => {
    eventHandler.off('revokeMessage', revokeMessageHandler);
  });

  test('fails with invalid message type', async () => {
    const castAdd = await Factories.CastAddMessage.create({ data: { fid } });
    const result = await set.revoke(castAdd);
    expect(result).toEqual(err(new HubError('bad_request.invalid_param', 'invalid message type')));
    expect(revokedMessages).toEqual([]);
  });

  test('succeeds with SignerAdd', async () => {
    await expect(set.merge(signerAdd)).resolves.toBeGreaterThan(0);
    const result = await set.revoke(signerAdd);
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap()).toBeGreaterThan(0);
    await expect(set.getSignerAdd(fid, signerAdd.data.signerAddBody.signer)).rejects.toThrow();
    expect(revokedMessages).toEqual([signerAdd]);
  });

  test('succeeds with SignerRemove', async () => {
    await expect(set.merge(signerRemove)).resolves.toBeGreaterThan(0);
    const result = await set.revoke(signerRemove);
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap()).toBeGreaterThan(0);
    await expect(set.getSignerRemove(fid, signerRemove.data.signerRemoveBody.signer)).rejects.toThrow();
    expect(revokedMessages).toEqual([signerRemove]);
  });

  test('succeeds with unmerged message', async () => {
    const result = await set.revoke(signerAdd);
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap()).toBeGreaterThan(0);
    await expect(set.getSignerAdd(fid, signerAdd.data.signerAddBody.signer)).rejects.toThrow();
    expect(revokedMessages).toEqual([signerAdd]);
  });
});

describe('pruneMessages', () => {
  let prunedMessages: Message[];
  const pruneMessageListener = (event: PruneMessageHubEvent) => {
    prunedMessages.push(event.pruneMessageBody.message);
  };

  beforeAll(() => {
    eventHandler.on('pruneMessage', pruneMessageListener);
  });

  beforeEach(() => {
    prunedMessages = [];
  });

  afterAll(() => {
    eventHandler.off('pruneMessage', pruneMessageListener);
  });

  let add1: SignerAddMessage;
  let add2: SignerAddMessage;
  let add3: SignerAddMessage;
  let add4: SignerAddMessage;
  let add5: SignerAddMessage;
  let addOld1: SignerAddMessage;

  let remove1: SignerRemoveMessage;
  let remove2: SignerRemoveMessage;
  let remove3: SignerRemoveMessage;
  let remove4: SignerRemoveMessage;
  let remove5: SignerRemoveMessage;

  const generateAddWithTimestamp = async (fid: number, timestamp: number): Promise<SignerAddMessage> => {
    return Factories.SignerAddMessage.create({
      data: { fid, timestamp },
    });
  };

  const generateRemoveWithTimestamp = async (
    fid: number,
    timestamp: number,
    signer?: Uint8Array | null
  ): Promise<SignerRemoveMessage> => {
    return Factories.SignerRemoveMessage.create({
      data: { fid, timestamp, signerRemoveBody: { signer: signer ?? Factories.Ed25519PPublicKey.build() } },
    });
  };

  beforeAll(async () => {
    const time = getFarcasterTime()._unsafeUnwrap() - 10;
    add1 = await generateAddWithTimestamp(fid, time + 1);
    add2 = await generateAddWithTimestamp(fid, time + 2);
    add3 = await generateAddWithTimestamp(fid, time + 3);
    add4 = await generateAddWithTimestamp(fid, time + 4);
    add5 = await generateAddWithTimestamp(fid, time + 5);
    addOld1 = await generateAddWithTimestamp(fid, time - 60 * 60);

    remove1 = await generateRemoveWithTimestamp(fid, time + 1, add1.data.signerAddBody.signer);
    remove2 = await generateRemoveWithTimestamp(fid, time + 2, add2.data.signerAddBody.signer);
    remove3 = await generateRemoveWithTimestamp(fid, time + 3, add3.data.signerAddBody.signer);
    remove4 = await generateRemoveWithTimestamp(fid, time + 4, add4.data.signerAddBody.signer);
    remove5 = await generateRemoveWithTimestamp(fid, time + 5, add5.data.signerAddBody.signer);
  });

  describe('with size limit', () => {
    const sizePrunedStore = new SignerStore(db, eventHandler, { pruneSizeLimit: 3 });

    test('no-ops when no messages have been merged', async () => {
      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result.isOk()).toBeTruthy();

      expect(prunedMessages).toEqual([]);
    });

    test('prunes earliest add messages', async () => {
      const messages = [add1, add2, add3, add4, add5];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result.isOk()).toBeTruthy();

      expect(prunedMessages).toEqual([add1, add2]);

      for (const message of prunedMessages as SignerAddMessage[]) {
        const getAdd = () => sizePrunedStore.getSignerAdd(fid, message.data.signerAddBody.signer);
        await expect(getAdd()).rejects.toThrow(HubError);
      }
    });

    test('prunes earliest remove messages', async () => {
      const messages = [remove1, remove2, remove3, remove4, remove5];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result.isOk()).toBeTruthy();

      expect(prunedMessages).toEqual([remove1, remove2]);

      for (const message of prunedMessages as SignerRemoveMessage[]) {
        const getRemove = () => sizePrunedStore.getSignerRemove(fid, message.data.signerRemoveBody.signer);
        await expect(getRemove()).rejects.toThrow(HubError);
      }
    });

    test('prunes earliest messages', async () => {
      const messages = [add1, remove2, add3, remove4, add5];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result.isOk()).toBeTruthy();

      expect(prunedMessages).toEqual([add1, remove2]);
    });

    test('no-ops when adds have been removed', async () => {
      const messages = [add1, remove1, add2, remove2, add3];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result.isOk()).toBeTruthy();

      expect(prunedMessages).toEqual([]);
    });

    test('fails to add messages older than the earliest message', async () => {
      const messages = [add1, add2, add3];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      // Older messages are rejected
      await expect(sizePrunedStore.merge(addOld1)).rejects.toEqual(
        new HubError('bad_request.prunable', 'message would be pruned')
      );
    });
  });
});
