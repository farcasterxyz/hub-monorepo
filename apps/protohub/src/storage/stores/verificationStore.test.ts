import * as protobufs from '@farcaster/protobufs';
import {
  bytesDecrement,
  bytesIncrement,
  Eip712Signer,
  Factories,
  getFarcasterTime,
  HubError,
} from '@farcaster/protoutils';
import { jestRocksDB } from '~/storage/db/jestUtils';
import StoreEventHandler from '~/storage/stores/storeEventHandler';
import VerificationStore from '~/storage/stores/verificationStore';
import { getMessage, makeTsHash } from '../db/message';
import { UserPostfix } from '../db/types';

const db = jestRocksDB('flatbuffers.verificationStore.test');
const eventHandler = new StoreEventHandler();
const set = new VerificationStore(db, eventHandler);
const fid = Factories.Fid.build();

let ethSigner: Eip712Signer;
let verificationAdd: protobufs.VerificationAddEthAddressMessage;
let verificationRemove: protobufs.VerificationRemoveMessage;

beforeAll(async () => {
  ethSigner = Factories.Eip712Signer.build();

  verificationAdd = await Factories.VerificationAddEthAddressMessage.create({
    data: { fid, verificationAddEthAddressBody: { address: ethSigner.signerKey } },
  });
  verificationRemove = await Factories.VerificationRemoveMessage.create({
    data: {
      fid,
      timestamp: verificationAdd.data.timestamp + 1,
      verificationRemoveBody: { address: ethSigner.signerKey },
    },
  });
});

describe('getVerificationAdd', () => {
  test('fails if missing', async () => {
    await expect(set.getVerificationAdd(fid, ethSigner.signerKey)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await set.merge(verificationAdd);
    await expect(set.getVerificationAdd(fid, ethSigner.signerKey)).resolves.toEqual(verificationAdd);
  });
});

describe('getVerificationRemove', () => {
  test('fails if missing', async () => {
    await expect(set.getVerificationRemove(fid, ethSigner.signerKey)).rejects.toThrow(HubError);
  });

  test('returns message', async () => {
    await set.merge(verificationRemove);
    await expect(set.getVerificationRemove(fid, ethSigner.signerKey)).resolves.toEqual(verificationRemove);
  });
});

describe('getVerificationAddsByFid', () => {
  test('returns verification adds for an fid', async () => {
    await set.merge(verificationAdd);
    await expect(set.getVerificationAddsByFid(fid)).resolves.toEqual([verificationAdd]);
  });

  test('returns empty array without messages', async () => {
    await expect(set.getVerificationAddsByFid(fid)).resolves.toEqual([]);
  });
});

describe('getVerificationRemovesByFid', () => {
  test('returns verification removes for an fid', async () => {
    await set.merge(verificationRemove);
    await expect(set.getVerificationRemovesByFid(fid)).resolves.toEqual([verificationRemove]);
  });

  test('returns empty array without messages', async () => {
    await expect(set.getVerificationRemovesByFid(fid)).resolves.toEqual([]);
  });
});

describe('merge', () => {
  let mergeEvents: [protobufs.Message, protobufs.Message[]][] = [];

  const mergeMessageHandler = (message: protobufs.Message, deletedMessages?: protobufs.Message[]) => {
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

  const assertVerificationExists = async (
    message: protobufs.VerificationAddEthAddressMessage | protobufs.VerificationRemoveMessage
  ) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.VerificationMessage, tsHash)).resolves.toEqual(message);
  };

  const assertVerificationDoesNotExist = async (
    message: protobufs.VerificationAddEthAddressMessage | protobufs.VerificationRemoveMessage
  ) => {
    const tsHash = makeTsHash(message.data.timestamp, message.hash)._unsafeUnwrap();
    await expect(getMessage(db, fid, UserPostfix.VerificationMessage, tsHash)).rejects.toThrow(HubError);
  };

  const assertVerificationAddWins = async (message: protobufs.VerificationAddEthAddressMessage) => {
    await assertVerificationExists(message);
    await expect(set.getVerificationAdd(fid, ethSigner.signerKey)).resolves.toEqual(message);
    await expect(set.getVerificationRemove(fid, ethSigner.signerKey)).rejects.toThrow(HubError);
  };

  const assertVerificationRemoveWins = async (message: protobufs.VerificationRemoveMessage) => {
    await assertVerificationExists(message);
    await expect(set.getVerificationRemove(fid, ethSigner.signerKey)).resolves.toEqual(message);
    await expect(set.getVerificationAdd(fid, ethSigner.signerKey)).rejects.toThrow(HubError);
  };

  test('fails with invalid message type', async () => {
    const message = await Factories.ReactionAddMessage.create({ data: { fid } });
    await expect(set.merge(message)).rejects.toThrow(HubError);
  });

  describe('VerificationAddEthAddress', () => {
    test('succeeds', async () => {
      await expect(set.merge(verificationAdd)).resolves.toEqual(undefined);
      await assertVerificationAddWins(verificationAdd);
      expect(mergeEvents).toEqual([[verificationAdd, []]]);
    });

    test('fails if merged twice', async () => {
      await expect(set.merge(verificationAdd)).resolves.toEqual(undefined);
      await expect(set.merge(verificationAdd)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );
      await assertVerificationAddWins(verificationAdd);
      expect(mergeEvents).toEqual([[verificationAdd, []]]);
    });

    describe('with a conflicting VerificationAddEthAddress with different timestamps', () => {
      let verificationAddLater: protobufs.VerificationAddEthAddressMessage;

      beforeAll(async () => {
        verificationAddLater = await Factories.VerificationAddEthAddressMessage.create({
          data: { ...verificationAdd.data, timestamp: verificationAdd.data.timestamp + 1 },
        });
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(verificationAdd);
        await expect(set.merge(verificationAddLater)).resolves.toEqual(undefined);
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
          new HubError('bad_request.conflict', 'message conflicts with a more recent VerificationAddEthAddress')
        );
        await assertVerificationDoesNotExist(verificationAdd);
        await assertVerificationAddWins(verificationAddLater);
        expect(mergeEvents).toEqual([[verificationAddLater, []]]);
      });
    });

    describe('with a conflicting VerificationAddEthAddress with identical timestamps', () => {
      let verificationAddLater: protobufs.VerificationAddEthAddressMessage;

      beforeAll(async () => {
        verificationAddLater = await Factories.VerificationAddEthAddressMessage.create({
          ...verificationAdd,
          hash: bytesIncrement(verificationAdd.hash),
        });
      });

      test('succeeds with a higher hash', async () => {
        await set.merge(verificationAdd);
        await expect(set.merge(verificationAddLater)).resolves.toEqual(undefined);
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
          new HubError('bad_request.conflict', 'message conflicts with a more recent VerificationAddEthAddress')
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
        await expect(set.merge(verificationAdd)).resolves.toEqual(undefined);
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
          new HubError('bad_request.conflict', 'message conflicts with a more recent VerificationRemove')
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
          new HubError('bad_request.conflict', 'message conflicts with a more recent VerificationRemove')
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
          new HubError('bad_request.conflict', 'message conflicts with a more recent VerificationRemove')
        );
        await assertVerificationRemoveWins(verificationRemoveEarlier);
        await assertVerificationDoesNotExist(verificationAdd);
        expect(mergeEvents).toEqual([[verificationRemoveEarlier, []]]);
      });
    });
  });

  describe('VerificationRemove', () => {
    test('succeeds', async () => {
      await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
      await assertVerificationRemoveWins(verificationRemove);
      expect(mergeEvents).toEqual([[verificationRemove, []]]);
    });

    test('fails if merged twice', async () => {
      await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
      await expect(set.merge(verificationRemove)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );
      await assertVerificationRemoveWins(verificationRemove);
      expect(mergeEvents).toEqual([[verificationRemove, []]]);
    });

    describe('with a conflicting VerificationRemove with different timestamps', () => {
      let verificationRemoveLater: protobufs.VerificationRemoveMessage;

      beforeAll(async () => {
        verificationRemoveLater = await Factories.VerificationRemoveMessage.create({
          data: { ...verificationRemove.data, timestamp: verificationRemove.data.timestamp + 1 },
        });
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(verificationRemove);
        await expect(set.merge(verificationRemoveLater)).resolves.toEqual(undefined);
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
          new HubError('bad_request.conflict', 'message conflicts with a more recent VerificationRemove')
        );
        await assertVerificationDoesNotExist(verificationRemove);
        await assertVerificationRemoveWins(verificationRemoveLater);
        expect(mergeEvents).toEqual([[verificationRemoveLater, []]]);
      });
    });

    describe('with a conflicting VerificationRemove with identical timestamps', () => {
      let verificationRemoveLater: protobufs.VerificationRemoveMessage;

      beforeAll(async () => {
        verificationRemoveLater = await Factories.VerificationRemoveMessage.create({
          ...verificationRemove,
          hash: bytesIncrement(verificationRemove.hash),
        });
      });

      test('succeeds with a higher hash', async () => {
        await set.merge(verificationRemove);
        await expect(set.merge(verificationRemoveLater)).resolves.toEqual(undefined);
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
          new HubError('bad_request.conflict', 'message conflicts with a more recent VerificationRemove')
        );
        await assertVerificationDoesNotExist(verificationRemove);
        await assertVerificationRemoveWins(verificationRemoveLater);
        expect(mergeEvents).toEqual([[verificationRemoveLater, []]]);
      });
    });

    describe('with conflicting VerificationAddEthAddress with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        await set.merge(verificationAdd);
        await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
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
          new HubError('bad_request.conflict', 'message conflicts with a more recent VerificationAddEthAddress')
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
        await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
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

describe('pruneMessages', () => {
  let prunedMessages: protobufs.Message[];
  const pruneMessageListener = (message: protobufs.Message) => {
    prunedMessages.push(message);
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

  let add1: protobufs.VerificationAddEthAddressMessage;
  let add2: protobufs.VerificationAddEthAddressMessage;
  let add3: protobufs.VerificationAddEthAddressMessage;
  let add4: protobufs.VerificationAddEthAddressMessage;
  let add5: protobufs.VerificationAddEthAddressMessage;

  let remove1: protobufs.VerificationRemoveMessage;
  let remove2: protobufs.VerificationRemoveMessage;
  let remove3: protobufs.VerificationRemoveMessage;
  let remove4: protobufs.VerificationRemoveMessage;
  let remove5: protobufs.VerificationRemoveMessage;

  const generateAddWithTimestamp = async (
    fid: number,
    timestamp: number
  ): Promise<protobufs.VerificationAddEthAddressMessage> => {
    return Factories.VerificationAddEthAddressMessage.create({ data: { fid, timestamp } });
  };

  const generateRemoveWithTimestamp = async (
    fid: number,
    timestamp: number,
    address?: Uint8Array | null
  ): Promise<protobufs.VerificationRemoveMessage> => {
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
      expect(result._unsafeUnwrap()).toEqual(undefined);
      expect(prunedMessages).toEqual([]);
    });

    test('prunes earliest add messages', async () => {
      const messages = [add1, add2, add3, add4, add5];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result._unsafeUnwrap()).toEqual(undefined);

      expect(prunedMessages).toEqual([add1, add2]);

      for (const message of prunedMessages as protobufs.VerificationAddEthAddressMessage[]) {
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
      expect(result._unsafeUnwrap()).toEqual(undefined);

      expect(prunedMessages).toEqual([remove1, remove2]);

      for (const message of prunedMessages as protobufs.VerificationRemoveMessage[]) {
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
      expect(result._unsafeUnwrap()).toEqual(undefined);

      expect(prunedMessages).toEqual([add1, remove2]);
    });

    test('no-ops when adds have been removed', async () => {
      const messages = [add1, remove1, add2, remove2, add3];
      for (const message of messages) {
        await sizePrunedStore.merge(message);
      }

      const result = await sizePrunedStore.pruneMessages(fid);
      expect(result._unsafeUnwrap()).toEqual(undefined);

      expect(prunedMessages).toEqual([]);
    });
  });
});
