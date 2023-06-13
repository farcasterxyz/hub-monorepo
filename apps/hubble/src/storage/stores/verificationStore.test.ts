import {
  bytesDecrement,
  bytesIncrement,
  Eip712Signer,
  Factories,
  getFarcasterTime,
  HubError,
  MergeMessageHubEvent,
  Message,
  PruneMessageHubEvent,
  RevokeMessageHubEvent,
  VerificationAddEthAddressMessage,
  VerificationRemoveMessage,
} from '@farcaster/hub-nodejs';
import { jestRocksDB } from '../db/jestUtils.js';
import StoreEventHandler from './storeEventHandler.js';
import VerificationStore from './verificationStore.js';
import { getMessage, makeTsHash } from '../db/message.js';
import { UserPostfix } from '../db/types.js';
import { err } from 'neverthrow';

const db = jestRocksDB('verificationStore.test');
const eventHandler = new StoreEventHandler(db);
const set = new VerificationStore(db, eventHandler);
const fid = Factories.Fid.build();

let ethSigner: Eip712Signer;
let ethSignerKey: Uint8Array;
let verificationAdd: VerificationAddEthAddressMessage;
let verificationRemove: VerificationRemoveMessage;

beforeAll(async () => {
  ethSigner = Factories.Eip712Signer.build();
  ethSignerKey = (await ethSigner.getSignerKey())._unsafeUnwrap();
  verificationAdd = await Factories.VerificationAddEthAddressMessage.create(
    {
      data: { fid, verificationAddEthAddressBody: { address: ethSignerKey } },
    },
    { transient: { ethSigner } }
  );

  verificationRemove = await Factories.VerificationRemoveMessage.create({
    data: {
      fid,
      timestamp: verificationAdd.data.timestamp + 1,
      verificationRemoveBody: { address: ethSignerKey },
    },
  });
});

beforeEach(async () => {
  await eventHandler.syncCache();
});

describe('getVerificationAdd', () => {
  test('fails if missing', async () => {
    await expect(set.getVerificationAdd(fid, ethSignerKey)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await set.merge(verificationAdd);
    await expect(set.getVerificationAdd(fid, ethSignerKey)).resolves.toEqual(verificationAdd);
  });
});

describe('getVerificationRemove', () => {
  test('fails if missing', async () => {
    await expect(set.getVerificationRemove(fid, ethSignerKey)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await set.merge(verificationRemove);
    await expect(set.getVerificationRemove(fid, ethSignerKey)).resolves.toEqual(verificationRemove);
  });
});

describe('getVerificationAddsByFid', () => {
  test('returns verification adds for an fid', async () => {
    await set.merge(verificationAdd);
    await expect(set.getVerificationAddsByFid(fid)).resolves.toEqual({
      messages: [verificationAdd],
      nextPageToken: undefined,
    });
  });

  test('returns empty array without messages', async () => {
    await expect(set.getVerificationAddsByFid(fid)).resolves.toEqual({ messages: [], nextPageToken: undefined });
  });
});

describe('getVerificationRemovesByFid', () => {
  test('returns verification removes for an fid', async () => {
    await set.merge(verificationRemove);
    await expect(set.getVerificationRemovesByFid(fid)).resolves.toEqual({
      messages: [verificationRemove],
      nextPageToken: undefined,
    });
  });

  test('returns empty array without messages', async () => {
    await expect(set.getVerificationRemovesByFid(fid)).resolves.toEqual({ messages: [], nextPageToken: undefined });
  });
});

// TODO: getAllVerificationMessagesByFid

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

  const assertVerificationExists = async (message: VerificationAddEthAddressMessage | VerificationRemoveMessage) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.VerificationMessage, tsHash)).resolves.toEqual(message);
  };

  const assertVerificationDoesNotExist = async (
    message: VerificationAddEthAddressMessage | VerificationRemoveMessage
  ) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.VerificationMessage, tsHash)).rejects.toThrow(HubError);
  };

  const assertVerificationAddWins = async (message: VerificationAddEthAddressMessage) => {
    await assertVerificationExists(message);
    await expect(set.getVerificationAdd(fid, ethSignerKey)).resolves.toEqual(message);
    await expect(set.getVerificationRemove(fid, ethSignerKey)).rejects.toThrow(HubError);
  };

  const assertVerificationRemoveWins = async (message: VerificationRemoveMessage) => {
    await assertVerificationExists(message);
    await expect(set.getVerificationRemove(fid, ethSignerKey)).resolves.toEqual(message);
    await expect(set.getVerificationAdd(fid, ethSignerKey)).rejects.toThrow(HubError);
  };

  test('fails with invalid message type', async () => {
    const message = await Factories.ReactionAddMessage.create({ data: { fid } });
    await expect(set.merge(message)).rejects.toThrow(HubError);
  });

  describe('VerificationAddEthAddress', () => {
    test('succeeds', async () => {
      await expect(set.merge(verificationAdd)).resolves.toBeGreaterThan(0);
      await assertVerificationAddWins(verificationAdd);
      expect(mergeEvents).toEqual([[verificationAdd, []]]);
    });

    test('fails if merged twice', async () => {
      await expect(set.merge(verificationAdd)).resolves.toBeGreaterThan(0);
      await expect(set.merge(verificationAdd)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );
      await assertVerificationAddWins(verificationAdd);
      expect(mergeEvents).toEqual([[verificationAdd, []]]);
    });

    describe('with a conflicting VerificationAddEthAddress with different timestamps', () => {
      let verificationAddLater: VerificationAddEthAddressMessage;

      beforeAll(async () => {
        verificationAddLater = await Factories.VerificationAddEthAddressMessage.create({
          data: { ...verificationAdd.data, timestamp: verificationAdd.data.timestamp + 1 },
        });
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(verificationAdd);
        await expect(set.merge(verificationAddLater)).resolves.toBeGreaterThan(0);
        await assertVerificationDoesNotExist(verificationAdd);
        await assertVerificationAddWins(verificationAddLater);
        expect(mergeEvents).toEqual([
          [verificationAdd, []],
          [verificationAddLater, [verificationAdd]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        await set.merge(verificationAddLater);
        await expect(set.merge(verificationAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent add')
        );
        await assertVerificationDoesNotExist(verificationAdd);
        await assertVerificationAddWins(verificationAddLater);
        expect(mergeEvents).toEqual([[verificationAddLater, []]]);
      });
    });

    describe('with a conflicting VerificationAddEthAddress with identical timestamps', () => {
      let verificationAddLater: VerificationAddEthAddressMessage;

      beforeAll(async () => {
        verificationAddLater = await Factories.VerificationAddEthAddressMessage.create({
          ...verificationAdd,
          hash: bytesIncrement(verificationAdd.hash)._unsafeUnwrap(),
        });
      });

      test('succeeds with a higher hash', async () => {
        await set.merge(verificationAdd);
        await expect(set.merge(verificationAddLater)).resolves.toBeGreaterThan(0);
        await assertVerificationDoesNotExist(verificationAdd);
        await assertVerificationAddWins(verificationAddLater);
        expect(mergeEvents).toEqual([
          [verificationAdd, []],
          [verificationAddLater, [verificationAdd]],
        ]);
      });

      test('fails with a lower hash', async () => {
        await set.merge(verificationAddLater);
        await expect(set.merge(verificationAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent add')
        );
        await assertVerificationDoesNotExist(verificationAdd);
        await assertVerificationAddWins(verificationAddLater);
        expect(mergeEvents).toEqual([[verificationAddLater, []]]);
      });
    });

    describe('with conflicting VerificationRemove with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        const verificationRemoveEarlier = await Factories.VerificationRemoveMessage.create({
          data: { ...verificationRemove.data, timestamp: verificationAdd.data.timestamp - 1 },
        });
        await set.merge(verificationRemoveEarlier);
        await expect(set.merge(verificationAdd)).resolves.toBeGreaterThan(0);
        await assertVerificationAddWins(verificationAdd);
        await assertVerificationDoesNotExist(verificationRemoveEarlier);
        expect(mergeEvents).toEqual([
          [verificationRemoveEarlier, []],
          [verificationAdd, [verificationRemoveEarlier]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        await set.merge(verificationRemove);
        await expect(set.merge(verificationAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent remove')
        );
        await assertVerificationRemoveWins(verificationRemove);
        await assertVerificationDoesNotExist(verificationAdd);
        expect(mergeEvents).toEqual([[verificationRemove, []]]);
      });
    });

    describe('with conflicting VerificationRemove with identical timestamps', () => {
      test('fails if remove has a higher hash', async () => {
        const verificationRemoveLater = await Factories.VerificationRemoveMessage.create({
          data: { ...verificationRemove.data, timestamp: verificationAdd.data.timestamp },
        });

        await set.merge(verificationRemoveLater);
        await expect(set.merge(verificationAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent remove')
        );
        await assertVerificationRemoveWins(verificationRemoveLater);
        await assertVerificationDoesNotExist(verificationAdd);
        expect(mergeEvents).toEqual([[verificationRemoveLater, []]]);
      });

      test('fails if remove has a lower hash', async () => {
        const verificationRemoveEarlier = await Factories.VerificationRemoveMessage.create({
          data: { ...verificationRemove.data, timestamp: verificationAdd.data.timestamp },
          hash: bytesDecrement(verificationAdd.hash)._unsafeUnwrap(),
        });

        await set.merge(verificationRemoveEarlier);
        await expect(set.merge(verificationAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent remove')
        );
        await assertVerificationRemoveWins(verificationRemoveEarlier);
        await assertVerificationDoesNotExist(verificationAdd);
        expect(mergeEvents).toEqual([[verificationRemoveEarlier, []]]);
      });
    });
  });

  describe('VerificationRemove', () => {
    test('succeeds', async () => {
      await expect(set.merge(verificationRemove)).resolves.toBeGreaterThan(0);
      await assertVerificationRemoveWins(verificationRemove);
      expect(mergeEvents).toEqual([[verificationRemove, []]]);
    });

    test('fails if merged twice', async () => {
      await expect(set.merge(verificationRemove)).resolves.toBeGreaterThan(0);
      await expect(set.merge(verificationRemove)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );
      await assertVerificationRemoveWins(verificationRemove);
      expect(mergeEvents).toEqual([[verificationRemove, []]]);
    });

    describe('with a conflicting VerificationRemove with different timestamps', () => {
      let verificationRemoveLater: VerificationRemoveMessage;

      beforeAll(async () => {
        verificationRemoveLater = await Factories.VerificationRemoveMessage.create({
          data: { ...verificationRemove.data, timestamp: verificationRemove.data.timestamp + 1 },
        });
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(verificationRemove);
        await expect(set.merge(verificationRemoveLater)).resolves.toBeGreaterThan(0);
        await assertVerificationDoesNotExist(verificationRemove);
        await assertVerificationRemoveWins(verificationRemoveLater);
        expect(mergeEvents).toEqual([
          [verificationRemove, []],
          [verificationRemoveLater, [verificationRemove]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        await set.merge(verificationRemoveLater);
        await expect(set.merge(verificationRemove)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent remove')
        );
        await assertVerificationDoesNotExist(verificationRemove);
        await assertVerificationRemoveWins(verificationRemoveLater);
        expect(mergeEvents).toEqual([[verificationRemoveLater, []]]);
      });
    });

    describe('with a conflicting VerificationRemove with identical timestamps', () => {
      let verificationRemoveLater: VerificationRemoveMessage;

      beforeAll(async () => {
        verificationRemoveLater = await Factories.VerificationRemoveMessage.create({
          ...verificationRemove,
          hash: bytesIncrement(verificationRemove.hash)._unsafeUnwrap(),
        });
      });

      test('succeeds with a higher hash', async () => {
        await set.merge(verificationRemove);
        await expect(set.merge(verificationRemoveLater)).resolves.toBeGreaterThan(0);
        await assertVerificationDoesNotExist(verificationRemove);
        await assertVerificationRemoveWins(verificationRemoveLater);
        expect(mergeEvents).toEqual([
          [verificationRemove, []],
          [verificationRemoveLater, [verificationRemove]],
        ]);
      });

      test('fails with a lower hash', async () => {
        await set.merge(verificationRemoveLater);
        await expect(set.merge(verificationRemove)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent remove')
        );
        await assertVerificationDoesNotExist(verificationRemove);
        await assertVerificationRemoveWins(verificationRemoveLater);
        expect(mergeEvents).toEqual([[verificationRemoveLater, []]]);
      });
    });

    describe('with conflicting VerificationAddEthAddress with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        await set.merge(verificationAdd);
        await expect(set.merge(verificationRemove)).resolves.toBeGreaterThan(0);
        await assertVerificationRemoveWins(verificationRemove);
        await assertVerificationDoesNotExist(verificationAdd);
        expect(mergeEvents).toEqual([
          [verificationAdd, []],
          [verificationRemove, [verificationAdd]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        const verificationAddLater = await Factories.VerificationAddEthAddressMessage.create({
          data: { ...verificationAdd.data, timestamp: verificationRemove.data.timestamp + 1 },
        });

        await set.merge(verificationAddLater);
        await expect(set.merge(verificationRemove)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent add')
        );
        await assertVerificationAddWins(verificationAddLater);
        await assertVerificationDoesNotExist(verificationRemove);
        expect(mergeEvents).toEqual([[verificationAddLater, []]]);
      });
    });

    describe('with conflicting VerificationAddEthAddress with identical timestamps', () => {
      test('succeeds regardless of add message hash', async () => {
        const verificationAddSameTime = await Factories.VerificationAddEthAddressMessage.create({
          data: { ...verificationAdd.data, timestamp: verificationRemove.data.timestamp },
        });

        await set.merge(verificationAddSameTime);
        await expect(set.merge(verificationRemove)).resolves.toBeGreaterThan(0);
        await assertVerificationDoesNotExist(verificationAddSameTime);
        await assertVerificationRemoveWins(verificationRemove);
        expect(mergeEvents).toEqual([
          [verificationAddSameTime, []],
          [verificationRemove, [verificationAddSameTime]],
        ]);
      });
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

  test('succeeds with VerificationAddEthAddress', async () => {
    await expect(set.merge(verificationAdd)).resolves.toBeGreaterThan(0);
    const result = await set.revoke(verificationAdd);
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap()).toBeGreaterThan(0);
    await expect(
      set.getVerificationAdd(fid, verificationAdd.data.verificationAddEthAddressBody.address)
    ).rejects.toThrow();
    expect(revokedMessages).toEqual([verificationAdd]);
  });

  test('succeeds with VerificationRemove', async () => {
    await expect(set.merge(verificationRemove)).resolves.toBeGreaterThan(0);
    const result = await set.revoke(verificationRemove);
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap()).toBeGreaterThan(0);
    await expect(
      set.getVerificationRemove(fid, verificationRemove.data.verificationRemoveBody.address)
    ).rejects.toThrow();
    expect(revokedMessages).toEqual([verificationRemove]);
  });

  test('succeeds with unmerged message', async () => {
    const result = await set.revoke(verificationAdd);
    expect(result.isOk()).toBeTruthy();
    expect(result._unsafeUnwrap()).toBeGreaterThan(0);
    await expect(
      set.getVerificationAdd(fid, verificationAdd.data.verificationAddEthAddressBody.address)
    ).rejects.toThrow();
    expect(revokedMessages).toEqual([verificationAdd]);
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

  let add1: VerificationAddEthAddressMessage;
  let add2: VerificationAddEthAddressMessage;
  let add3: VerificationAddEthAddressMessage;
  let add4: VerificationAddEthAddressMessage;
  let add5: VerificationAddEthAddressMessage;
  let addOld1: VerificationAddEthAddressMessage;

  let remove1: VerificationRemoveMessage;
  let remove2: VerificationRemoveMessage;
  let remove3: VerificationRemoveMessage;
  let remove4: VerificationRemoveMessage;
  let remove5: VerificationRemoveMessage;

  const generateAddWithTimestamp = async (
    fid: number,
    timestamp: number
  ): Promise<VerificationAddEthAddressMessage> => {
    return Factories.VerificationAddEthAddressMessage.create({ data: { fid, timestamp } });
  };

  const generateRemoveWithTimestamp = async (
    fid: number,
    timestamp: number,
    address?: Uint8Array | null
  ): Promise<VerificationRemoveMessage> => {
    return Factories.VerificationRemoveMessage.create({
      data: { fid, timestamp, verificationRemoveBody: { address: address ?? Factories.EthAddress.build() } },
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

    remove1 = await generateRemoveWithTimestamp(fid, time + 1, add1.data.verificationAddEthAddressBody.address);
    remove2 = await generateRemoveWithTimestamp(fid, time + 2, add2.data.verificationAddEthAddressBody.address);
    remove3 = await generateRemoveWithTimestamp(fid, time + 3, add3.data.verificationAddEthAddressBody.address);
    remove4 = await generateRemoveWithTimestamp(fid, time + 4, add4.data.verificationAddEthAddressBody.address);
    remove5 = await generateRemoveWithTimestamp(fid, time + 5, add5.data.verificationAddEthAddressBody.address);
  });

  describe('with size limit', () => {
    const sizePrunedStore = new VerificationStore(db, eventHandler, { pruneSizeLimit: 3 });

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

      for (const message of prunedMessages as VerificationAddEthAddressMessage[]) {
        const getAdd = () =>
          sizePrunedStore.getVerificationAdd(fid, message.data.verificationAddEthAddressBody.address);
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

      for (const message of prunedMessages as VerificationRemoveMessage[]) {
        const getRemove = () => sizePrunedStore.getVerificationRemove(fid, message.data.verificationRemoveBody.address);
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
