import * as protobufs from '@farcaster/protobufs';
import { bytesDecrement, bytesIncrement, Factories, getFarcasterTime, HubError } from '@farcaster/utils';
import { jestRocksDB } from '~/storage/db/jestUtils';
import SignerStore from '~/storage/stores/signerStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import { makeIdRegistryEventPrimaryKey } from '../db/idRegistryEvent';
import { getAllMessagesBySigner, getMessage, makeTsHash } from '../db/message';
import { UserPostfix } from '../db/types';

const db = jestRocksDB('protobufs.signerStore.test');
const eventHandler = new StoreEventHandler(db);
const set = new SignerStore(db, eventHandler);
const fid = Factories.Fid.build();
const custody1 = Factories.Eip712Signer.build();
const custody1Address = custody1.signerKey;
const custody2 = Factories.Eip712Signer.build();
const custody2Address = custody2.signerKey;
const signer = Factories.Ed25519Signer.build();

let custody1Event: protobufs.IdRegistryEvent;
let signerAdd: protobufs.SignerAddMessage;
let signerRemove: protobufs.SignerRemoveMessage;

beforeAll(async () => {
  custody1Event = Factories.IdRegistryEvent.build({
    fid,
    to: custody1Address,
  });
  signerAdd = await Factories.SignerAddMessage.create(
    { data: { fid, signerAddBody: { signer: signer.signerKey } } },
    { transient: { signer: custody1 } }
  );
  signerRemove = await Factories.SignerRemoveMessage.create(
    {
      data: { fid, signerRemoveBody: { signer: signer.signerKey }, timestamp: signerAdd.data.timestamp + 1 },
    },
    { transient: { signer: custody1 } }
  );
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

describe('getSignerAdd', () => {
  test('fails if missing', async () => {
    await expect(set.getSignerAdd(fid, signer.signerKey)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await set.merge(signerAdd);
    await expect(set.getSignerAdd(fid, signer.signerKey)).resolves.toEqual(signerAdd);
  });
});

describe('getSignerRemove', () => {
  test('fails if missing', async () => {
    await expect(set.getSignerRemove(fid, signer.signerKey)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await set.merge(signerRemove);
    await expect(set.getSignerRemove(fid, signer.signerKey)).resolves.toEqual(signerRemove);
  });
});

describe('getSignerAddsByFid', () => {
  test('returns empty array when messages have not been merged', async () => {
    const result = await set.getSignerAddsByFid(fid);
    expect(result.messages).toEqual([]);
  });

  describe('with messages', () => {
    let signerAdd2: protobufs.SignerAddMessage;
    let signerAdd3: protobufs.SignerAddMessage;
    let signerRemove4: protobufs.SignerRemoveMessage;

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

    test('returns limit messages with limit < number of messages', async () => {
      const result = await set.getSignerAddsByFid(fid, { pageSize: 1 });
      expect(result.messages).toEqual([signerAdd]);
    });

    test('returns all messages with limit > number of messages', async () => {
      const result = await set.getSignerAddsByFid(fid, { pageSize: 4 });
      expect(result).toEqual({ messages: [signerAdd, signerAdd2, signerAdd3], nextPageToken: undefined });
    });

    test('returns all messages with limit = number of messages', async () => {
      const result = await set.getSignerAddsByFid(fid, { pageSize: 3 });
      expect(result.messages).toEqual([signerAdd, signerAdd2, signerAdd3]);
    });

    test('returns messages from pageToken', async () => {
      const result1 = await set.getSignerAddsByFid(fid, { pageSize: 1 });
      const result2 = await set.getSignerAddsByFid(fid, { pageToken: result1.nextPageToken, pageSize: 1 });
      expect(result2.messages).toEqual([signerAdd2]);
      const result3 = await set.getSignerAddsByFid(fid, { pageToken: result2.nextPageToken, pageSize: 1 });
      expect(result3.messages).toEqual([signerAdd3]);
    });

    test('fails with invalid pageToken', async () => {
      const invalidPageKey = Buffer.from([1]);
      await expect(set.getSignerAddsByFid(fid, { pageToken: invalidPageKey })).rejects.toThrow(
        new HubError('bad_request.invalid_param', 'invalid pageToken')
      );
    });
  });
});

describe('getSignerRemovesByFid', () => {
  test('returns empty array when messages have not been merged', async () => {
    const result = await set.getSignerRemovesByFid(fid);
    expect(result.messages).toEqual([]);
  });

  describe('with messages', () => {
    let signerRemove2: protobufs.SignerRemoveMessage;
    let signerAdd3: protobufs.SignerAddMessage;

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
      const result1 = await set.getSignerRemovesByFid(fid, { pageSize: 1 });
      expect(result1.messages).toEqual([signerRemove]);
      const result2 = await set.getSignerRemovesByFid(fid, { pageToken: result1.nextPageToken, pageSize: 1 });
      expect(result2.messages).toEqual([signerRemove2]);
    });

    test('fails with invalid pageToken', async () => {
      const invalidPageKey = Buffer.from([1]);
      await expect(set.getSignerRemovesByFid(fid, { pageToken: invalidPageKey })).rejects.toThrow(
        new HubError('bad_request.invalid_param', 'invalid pageToken')
      );
    });
  });
});

describe('getAllSignerMessagesByFid', () => {
  test('returns empty array when messages have not been merged', async () => {
    const result = await set.getAllSignerMessagesByFid(fid);
    expect(result.messages).toEqual([]);
  });

  describe('with messages', () => {
    let signerRemove2: protobufs.SignerRemoveMessage;
    let signerAdd3: protobufs.SignerAddMessage;

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

    test('fails with invalid pageToken', async () => {
      const invalidPageKey = Buffer.from([1]);
      await expect(set.getAllSignerMessagesByFid(fid, { pageToken: invalidPageKey })).rejects.toThrow(
        new HubError('bad_request.invalid_param', 'invalid pageToken')
      );
    });
  });
});

// TODO: write test cases for cyclical custody event transfers

describe('mergeIdRegistryEvent', () => {
  let mergedContractEvents: protobufs.IdRegistryEvent[];

  const handleMergeEvent = (event: protobufs.MergeIdRegistryEventHubEvent) => {
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
    let newEvent: protobufs.IdRegistryEvent;

    beforeEach(async () => {
      await set.mergeIdRegistryEvent(custody1Event);
      await set.merge(signerAdd);
      await expect(set.getSignerAdd(fid, signer.signerKey)).resolves.toEqual(signerAdd);
    });

    afterEach(async () => {
      await expect(set.mergeIdRegistryEvent(newEvent)).resolves.toBeGreaterThan(0);
      await expect(set.getIdRegistryEvent(fid)).resolves.toEqual(newEvent);
      expect(mergedContractEvents).toEqual([custody1Event, newEvent]);
      // SignerAdd should still be valid until messages signed by old custody address are revoked
      await expect(set.getSignerAdd(fid, signer.signerKey)).resolves.toEqual(signerAdd);
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
    let newEvent: protobufs.IdRegistryEvent;

    beforeEach(async () => {
      await set.mergeIdRegistryEvent(custody1Event);
      await set.merge(signerAdd);
      await expect(set.getSignerAdd(fid, signer.signerKey)).resolves.toEqual(signerAdd);
    });

    afterEach(async () => {
      await expect(set.mergeIdRegistryEvent(newEvent)).rejects.toThrow(
        new HubError('bad_request.conflict', 'event conflicts with a more recent IdRegistryEvent')
      );
      await expect(set.getIdRegistryEvent(fid)).resolves.toEqual(custody1Event);
      await expect(set.getSignerAdd(fid, signer.signerKey)).resolves.toEqual(signerAdd);

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
  let mergeEvents: [protobufs.Message | undefined, protobufs.Message[]][] = [];

  const mergeMessageHandler = (event: protobufs.MergeMessageHubEvent) => {
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

  const assertSignerExists = async (message: protobufs.SignerAddMessage | protobufs.SignerRemoveMessage) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.SignerMessage, tsHash)).resolves.toEqual(message);
  };

  const assertSignerDoesNotExist = async (message: protobufs.SignerAddMessage | protobufs.SignerRemoveMessage) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.SignerMessage, tsHash)).rejects.toThrow(HubError);
  };

  const assertSignerAddWins = async (message: protobufs.SignerAddMessage) => {
    await assertSignerExists(message);
    await expect(set.getSignerAdd(fid, signer.signerKey)).resolves.toEqual(message);
    await expect(set.getSignerRemove(fid, signer.signerKey)).rejects.toThrow(HubError);
  };

  const assertSignerRemoveWins = async (message: protobufs.SignerRemoveMessage) => {
    await assertSignerExists(message);
    await expect(set.getSignerRemove(fid, signer.signerKey)).resolves.toEqual(message);
    await expect(set.getSignerAdd(fid, signer.signerKey)).rejects.toThrow(HubError);
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
      let signerAddLater: protobufs.SignerAddMessage;

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
          new HubError('bad_request.conflict', 'message conflicts with a more recent SignerAdd')
        );

        await assertSignerDoesNotExist(signerAdd);
        await assertSignerAddWins(signerAddLater);

        expect(mergeEvents).toEqual([[signerAddLater, []]]);
      });
    });

    describe('with a conflicting SignerAdd with identical timestamps', () => {
      let signerAddLater: protobufs.SignerAddMessage;

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
          new HubError('bad_request.conflict', 'message conflicts with a more recent SignerAdd')
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
          new HubError('bad_request.conflict', 'message conflicts with a more recent SignerRemove')
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
          new HubError('bad_request.conflict', 'message conflicts with a more recent SignerRemove')
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
          new HubError('bad_request.conflict', 'message conflicts with a more recent SignerRemove')
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
      let signerRemoveLater: protobufs.SignerRemoveMessage;

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
          new HubError('bad_request.conflict', 'message conflicts with a more recent SignerRemove')
        );

        await assertSignerDoesNotExist(signerRemove);
        await assertSignerRemoveWins(signerRemoveLater);
        expect(mergeEvents).toEqual([[signerRemoveLater, []]]);
      });
    });

    describe('with a conflicting SignerRemove with identical timestamps', () => {
      let signerRemoveLater: protobufs.SignerRemoveMessage;

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
          new HubError('bad_request.conflict', 'message conflicts with a more recent SignerRemove')
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
          new HubError('bad_request.conflict', 'message conflicts with a more recent SignerAdd')
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
    // Increment fid to guarantee ordering
    const fid2 = fid + 1;
    const custody2Event = Factories.IdRegistryEvent.build({
      fid: fid2,
      to: custody2Address,
    });

    beforeEach(async () => {
      await set.mergeIdRegistryEvent(custody1Event);
      await set.mergeIdRegistryEvent(custody2Event);
    });

    describe('without pageOptions', () => {
      test('returns all fids for merged custody events', async () => {
        const result = await set.getFids();
        expect(result).toEqual({ fids: [fid, fid2], nextPageToken: undefined });
      });
    });

    describe('with limit < number of messages', () => {
      test('returns limit fids', async () => {
        const result = await set.getFids({ pageSize: 1 });
        expect(result).toEqual({ fids: [fid], nextPageToken: makeIdRegistryEventPrimaryKey(fid2) });
      });
    });

    describe('with limit > merged events', () => {
      test('returns all fids', async () => {
        const result = await set.getFids({ pageSize: 3 });
        expect(result).toEqual({ fids: [fid, fid2], nextPageToken: undefined });
      });
    });

    describe('with valid pageToken', () => {
      test('returns fids from pageToken', async () => {
        const result1 = await set.getFids({ pageSize: 1 });
        expect(result1.fids).toEqual([fid]);
        const result2 = await set.getFids({ pageToken: result1.nextPageToken });
        expect(result2).toEqual({ fids: [fid2], nextPageToken: undefined });
      });
    });

    describe('with invalid pageToken', () => {
      test('returns empty array', async () => {
        const invalidPageKey = Buffer.from([1]);
        await expect(set.getFids({ pageToken: invalidPageKey })).rejects.toThrow(
          new HubError('bad_request.invalid_param', 'invalid pageToken')
        );
      });
    });
  });
});

describe('revokeMessagesBySigner', () => {
  let custody2Transfer: protobufs.IdRegistryEvent;
  let signerAdd1: protobufs.SignerAddMessage;
  let signerAdd2: protobufs.SignerAddMessage;

  let revokedMessages: protobufs.Message[];

  const handleRevokeMessage = (event: protobufs.RevokeMessageHubEvent) => {
    revokedMessages.push(event.revokeMessageBody.message);
  };

  beforeAll(async () => {
    custody2Transfer = Factories.IdRegistryEvent.build({
      type: protobufs.IdRegistryEventType.TRANSFER,
      from: custody1Address,
      fid,
      to: custody2Address,
      blockNumber: custody1Event.blockNumber + 1,
    });

    signerAdd1 = await Factories.SignerAddMessage.create(
      {
        data: { fid },
      },
      { transient: { signer: custody1 } }
    );

    signerAdd2 = await Factories.SignerAddMessage.create({ data: { fid } }, { transient: { signer: custody2 } });

    eventHandler.on('revokeMessage', handleRevokeMessage);
  });

  afterAll(() => {
    eventHandler.off('revokeMessage', handleRevokeMessage);
  });

  beforeEach(() => {
    revokedMessages = [];
  });

  describe('with messages', () => {
    beforeEach(async () => {
      await expect(set.mergeIdRegistryEvent(custody1Event)).resolves.toBeGreaterThan(0);
      await expect(set.merge(signerAdd1)).resolves.toBeGreaterThan(0);
      await expect(set.merge(signerRemove)).resolves.toBeGreaterThan(0);
      await expect(set.mergeIdRegistryEvent(custody2Transfer)).resolves.toBeGreaterThan(0);
      await expect(set.merge(signerAdd2)).resolves.toBeGreaterThan(0);

      const custody1Messages = await getAllMessagesBySigner(db, fid, custody1Address);
      expect(new Set(custody1Messages)).toEqual(new Set([signerAdd1, signerRemove]));

      const custody2Messages = await getAllMessagesBySigner(db, fid, custody2Address);

      expect(custody2Messages).toEqual([signerAdd2]);
    });

    test('deletes messages and emits revokeMessage events for custody1', async () => {
      const result = await set.revokeMessagesBySigner(fid, custody1Address);
      expect(result.isOk()).toBeTruthy();
      const custody1Messages = await getAllMessagesBySigner(db, fid, custody1Address);
      expect(custody1Messages).toEqual([]);

      expect(revokedMessages).toEqual([signerAdd1, signerRemove]);
    });

    test('deletes messages and emits revokeMessage events for custody2', async () => {
      await set.revokeMessagesBySigner(fid, custody2Address);
      const custody2Messages = await getAllMessagesBySigner(db, fid, custody2Address);
      expect(custody2Messages).toEqual([]);

      expect(revokedMessages).toEqual([signerAdd2]);
    });
  });

  describe('without messages', () => {
    beforeEach(async () => {
      await set.mergeIdRegistryEvent(custody1Event);
      await set.mergeIdRegistryEvent(custody2Transfer);
    });

    test('does not emit revokeMessage events', async () => {
      await set.revokeMessagesBySigner(fid, custody1Address);
      await set.revokeMessagesBySigner(fid, custody2Address);
      expect(revokedMessages).toEqual([]);
    });
  });
});

describe('pruneMessages', () => {
  let prunedMessages: protobufs.Message[];
  const pruneMessageListener = (event: protobufs.PruneMessageHubEvent) => {
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

  let add1: protobufs.SignerAddMessage;
  let add2: protobufs.SignerAddMessage;
  let add3: protobufs.SignerAddMessage;
  let add4: protobufs.SignerAddMessage;
  let add5: protobufs.SignerAddMessage;

  let remove1: protobufs.SignerRemoveMessage;
  let remove2: protobufs.SignerRemoveMessage;
  let remove3: protobufs.SignerRemoveMessage;
  let remove4: protobufs.SignerRemoveMessage;
  let remove5: protobufs.SignerRemoveMessage;

  const generateAddWithTimestamp = async (fid: number, timestamp: number): Promise<protobufs.SignerAddMessage> => {
    return Factories.SignerAddMessage.create({
      data: { fid, timestamp },
    });
  };

  const generateRemoveWithTimestamp = async (
    fid: number,
    timestamp: number,
    signer?: Uint8Array | null
  ): Promise<protobufs.SignerRemoveMessage> => {
    return Factories.SignerRemoveMessage.create({
      data: { fid, timestamp, signerRemoveBody: { signer: signer ?? Factories.Ed25519Signer.build().signerKey } },
    });
  };

  beforeAll(async () => {
    const time = getFarcasterTime()._unsafeUnwrap() - 10;
    add1 = await generateAddWithTimestamp(fid, time + 1);
    add2 = await generateAddWithTimestamp(fid, time + 2);
    add3 = await generateAddWithTimestamp(fid, time + 3);
    add4 = await generateAddWithTimestamp(fid, time + 4);
    add5 = await generateAddWithTimestamp(fid, time + 5);

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

      for (const message of prunedMessages as protobufs.SignerAddMessage[]) {
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

      for (const message of prunedMessages as protobufs.SignerRemoveMessage[]) {
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
  });
});
