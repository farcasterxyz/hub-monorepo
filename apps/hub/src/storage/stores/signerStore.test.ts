import { faker } from '@faker-js/faker';
import { IdRegistryEventType, MessageType } from '@farcaster/flatbuffers';
import {
  bytesDecrement,
  bytesIncrement,
  Factories,
  getFarcasterTime,
  hexStringToBytes,
  HubError,
} from '@farcaster/utils';
import IdRegistryEventModel from '~/flatbuffers/models/idRegistryEventModel';
import MessageModel from '~/flatbuffers/models/messageModel';
import { SignerAddModel, SignerRemoveModel, UserPostfix } from '~/flatbuffers/models/types';
import { jestRocksDB } from '~/storage/db/jestUtils';
import SignerStore from '~/storage/stores/signerStore';
import StoreEventHandler from '~/storage/stores/storeEventHandler';

const db = jestRocksDB('flatbuffers.signerStore.test');
const eventHandler = new StoreEventHandler();
const set = new SignerStore(db, eventHandler);
const fid = Factories.FID.build();
const custody1 = Factories.Eip712Signer.build();
const custody1Address = custody1.signerKey;
const custody2 = Factories.Eip712Signer.build();
const custody2Address = custody2.signerKey;
const signer = Factories.Ed25519Signer.build();

let custody1Event: IdRegistryEventModel;
let signerAdd: SignerAddModel;
let signerRemove: SignerRemoveModel;

beforeAll(async () => {
  const idRegistryEvent = await Factories.IdRegistryEvent.create({
    fid: Array.from(fid),
    to: Array.from(custody1Address),
  });
  custody1Event = new IdRegistryEventModel(idRegistryEvent);

  const addData = await Factories.SignerAddData.create({
    body: Factories.SignerBody.build({ signer: Array.from(signer.signerKey) }),
    fid: Array.from(fid),
  });

  const addMessage = await Factories.Message.create(
    { data: Array.from(addData.bb?.bytes() ?? []) },
    { transient: { ethSigner: custody1 } }
  );
  signerAdd = new MessageModel(addMessage) as SignerAddModel;

  const removeData = await Factories.SignerRemoveData.create({
    body: Factories.SignerBody.build({ signer: Array.from(signer.signerKey) }),
    fid: Array.from(fid),
    timestamp: addData.timestamp() + 1,
  });
  const removeMessage = await Factories.Message.create(
    { data: Array.from(removeData.bb?.bytes() ?? []) },
    { transient: { ethSigner: custody1 } }
  );
  signerRemove = new MessageModel(removeMessage) as SignerRemoveModel;
});

describe('getCustodyEvent', () => {
  test('returns contract event if it exists', async () => {
    await set.mergeIdRegistryEvent(custody1Event);
    await expect(set.getCustodyEvent(fid)).resolves.toEqual(custody1Event);
  });

  test('fails if event is missing', async () => {
    await expect(set.getCustodyEvent(fid)).rejects.toThrow(HubError);
  });
});

describe('getCustodyAddress', () => {
  test('returns to from current IdRegistry event', async () => {
    await set.mergeIdRegistryEvent(custody1Event);
    await expect(set.getCustodyAddress(fid)).resolves.toEqual(custody1Address);
    await expect(IdRegistryEventModel.getByCustodyAddress(db, custody1Address)).resolves.toEqual(custody1Event);
  });

  test('fails if event is missing', async () => {
    await expect(set.getCustodyAddress(fid)).rejects.toThrow(HubError);
    await expect(IdRegistryEventModel.getByCustodyAddress(db, custody1Address)).rejects.toThrow(HubError);
  });

  test('returns to if custody address changes', async () => {
    await set.mergeIdRegistryEvent(custody1Event);
    const custody2Event = new IdRegistryEventModel(
      // New event with a new block number
      await Factories.IdRegistryEvent.create({
        fid: Array.from(fid),
        to: Array.from(custody2Address),
        blockNumber: custody1Event.blockNumber() + 1,
      })
    );
    await set.mergeIdRegistryEvent(custody2Event);
    await expect(set.getCustodyAddress(fid)).resolves.toEqual(custody2Address);
    await expect(IdRegistryEventModel.getByCustodyAddress(db, custody2Address)).resolves.toEqual(custody2Event);
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

describe('getSignerAddsByUser', () => {
  test('returns signer adds for an fid', async () => {
    await set.merge(signerAdd);
    await expect(set.getSignerAddsByUser(fid)).resolves.toEqual([signerAdd]);
  });

  test('returns empty array when messages have not been merged', async () => {
    await expect(set.getSignerAddsByUser(fid)).resolves.toEqual([]);
  });
});

describe('getSignerRemovesByUser', () => {
  test('returns signer removes for an fid', async () => {
    await set.merge(signerRemove);
    await expect(set.getSignerRemovesByUser(fid)).resolves.toEqual([signerRemove]);
  });

  test('returns empty array when messages have not been merged', async () => {
    await expect(set.getSignerRemovesByUser(fid)).resolves.toEqual([]);
  });
});

// TODO: write test cases for cyclical custody event transfers

describe('mergeIdRegistryEvent', () => {
  let mergedContractEvents: IdRegistryEventModel[];

  beforeAll(() => {
    eventHandler.on('mergeIdRegistryEvent', (event: IdRegistryEventModel) => {
      mergedContractEvents.push(event);
    });
  });

  beforeEach(() => {
    mergedContractEvents = [];
  });

  test('succeeds', async () => {
    await expect(set.mergeIdRegistryEvent(custody1Event)).resolves.toEqual(undefined);
    await expect(set.getCustodyEvent(fid)).resolves.toEqual(custody1Event);
    expect(mergedContractEvents).toEqual([custody1Event]);
  });

  test('fails if events have the same blockNumber but different blockHashes', async () => {
    const idRegistryEvent = await Factories.IdRegistryEvent.create({
      ...custody1Event.event.unpack(),
      blockHash: Array.from(hexStringToBytes(Factories.BlockHash.build())._unsafeUnwrap()),
    });

    const blockHashConflictEvent = new IdRegistryEventModel(idRegistryEvent);
    await set.mergeIdRegistryEvent(custody1Event);
    await expect(set.mergeIdRegistryEvent(blockHashConflictEvent)).rejects.toThrow(HubError);
    expect(mergedContractEvents).toEqual([custody1Event]);
  });

  test('fails if events have the same blockNumber and logIndex but different transactionHashes', async () => {
    const idRegistryEvent = await Factories.IdRegistryEvent.create({
      ...custody1Event.event.unpack(),
      transactionHash: Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 64 }))._unsafeUnwrap()),
    });

    const txHashConflictEvent = new IdRegistryEventModel(idRegistryEvent);
    await set.mergeIdRegistryEvent(custody1Event);
    await expect(set.mergeIdRegistryEvent(txHashConflictEvent)).rejects.toThrow(HubError);
    expect(mergedContractEvents).toEqual([custody1Event]);
  });

  describe('overwrites existing event', () => {
    let newEvent: IdRegistryEventModel;

    beforeEach(async () => {
      await set.mergeIdRegistryEvent(custody1Event);
      await set.merge(signerAdd);
      await expect(set.getSignerAdd(fid, signer.signerKey)).resolves.toEqual(signerAdd);
    });

    afterEach(async () => {
      await expect(set.mergeIdRegistryEvent(newEvent)).resolves.toEqual(undefined);
      await expect(set.getCustodyEvent(fid)).resolves.toEqual(newEvent);
      expect(mergedContractEvents).toEqual([custody1Event, newEvent]);
      // SignerAdd should still be valid until messages signed by old custody address are revoked
      await expect(set.getSignerAdd(fid, signer.signerKey)).resolves.toEqual(signerAdd);
    });

    test('when it has a higher block number', async () => {
      const idRegistryEvent = await Factories.IdRegistryEvent.create({
        ...custody1Event.event.unpack(),
        transactionHash: Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 64 }))._unsafeUnwrap()),
        to: Array.from(custody2Address),
        blockNumber: custody1Event.blockNumber() + 1,
      });
      newEvent = new IdRegistryEventModel(idRegistryEvent);
    });

    test('when it has the same block number and a higher log index', async () => {
      const idRegistryEvent = await Factories.IdRegistryEvent.create({
        ...custody1Event.event.unpack(),
        transactionHash: Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 64 }))._unsafeUnwrap()),
        to: Array.from(custody2Address),
        logIndex: custody1Event.logIndex() + 1,
      });
      newEvent = new IdRegistryEventModel(idRegistryEvent);
    });
  });

  describe('does not overwrite existing event', () => {
    let newEvent: IdRegistryEventModel;

    beforeEach(async () => {
      await set.mergeIdRegistryEvent(custody1Event);
      await set.merge(signerAdd);
      await expect(set.getSignerAdd(fid, signer.signerKey)).resolves.toEqual(signerAdd);
    });

    afterEach(async () => {
      await expect(set.mergeIdRegistryEvent(newEvent)).resolves.toEqual(undefined);
      await expect(set.getCustodyEvent(fid)).resolves.toEqual(custody1Event);
      expect(mergedContractEvents).toEqual([custody1Event]);
      await expect(set.getSignerAdd(fid, signer.signerKey)).resolves.toEqual(signerAdd);
    });

    test('when it has a lower block number', async () => {
      const idRegistryEvent = await Factories.IdRegistryEvent.create({
        ...custody1Event.event.unpack(),
        transactionHash: Array.from(hexStringToBytes(faker.datatype.hexadecimal({ length: 64 }))._unsafeUnwrap()),
        to: Array.from(custody2Address),
        blockNumber: custody1Event.blockNumber() - 1,
      });
      newEvent = new IdRegistryEventModel(idRegistryEvent);
    });

    test('when it has the same block number and a lower log index', async () => {
      const idRegistryEvent = await Factories.IdRegistryEvent.create({
        ...custody1Event.event.unpack(),
        to: Array.from(custody2Address),
        logIndex: custody1Event.logIndex() - 1,
      });
      newEvent = new IdRegistryEventModel(idRegistryEvent);
    });

    test('when is a duplicate', async () => {
      newEvent = custody1Event;
    });
  });
});

describe('merge', () => {
  let mergeEvents: [MessageModel, MessageModel[]][] = [];

  const mergeMessageHandler = (message: MessageModel, deletedMessages?: MessageModel[]) => {
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

  const assertSignerExists = async (message: SignerAddModel | SignerRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.SignerMessage, message.tsHash())).resolves.toEqual(message);
  };

  const assertSignerDoesNotExist = async (message: SignerAddModel | SignerRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.SignerMessage, message.tsHash())).rejects.toThrow(HubError);
  };

  const assertSignerAddWins = async (message: SignerAddModel) => {
    await assertSignerExists(message);
    await expect(set.getSignerAdd(fid, signer.signerKey)).resolves.toEqual(message);
    await expect(set.getSignerRemove(fid, signer.signerKey)).rejects.toThrow(HubError);
  };

  const assertSignerRemoveWins = async (message: SignerRemoveModel) => {
    await assertSignerExists(message);
    await expect(set.getSignerRemove(fid, signer.signerKey)).resolves.toEqual(message);
    await expect(set.getSignerAdd(fid, signer.signerKey)).rejects.toThrow(HubError);
  };

  test('fails with invalid message type', async () => {
    const invalidData = await Factories.ReactionAddData.create({ fid: Array.from(fid) });
    const message = await Factories.Message.create({ data: Array.from(invalidData.bb?.bytes() ?? []) });
    await expect(set.merge(new MessageModel(message))).rejects.toThrow(HubError);
    expect(mergeEvents).toEqual([]);
  });

  describe('SignerAdd', () => {
    test('succeeds', async () => {
      await expect(set.merge(signerAdd)).resolves.toEqual(undefined);
      await assertSignerAddWins(signerAdd);
      expect(mergeEvents).toEqual([[signerAdd, []]]);
    });

    test('fails when merged twice', async () => {
      await expect(set.merge(signerAdd)).resolves.toEqual(undefined);
      await expect(set.merge(signerAdd)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );

      await assertSignerAddWins(signerAdd);
      expect(mergeEvents).toEqual([[signerAdd, []]]);
    });

    describe('with a conflicting SignerAdd with different timestamps', () => {
      let signerAddLater: SignerAddModel;

      beforeAll(async () => {
        const addData = await Factories.SignerAddData.create({
          ...signerAdd.data.unpack(),
          timestamp: signerAdd.timestamp() + 1,
        });

        const addMessage = await Factories.Message.create(
          {
            data: Array.from(addData.bb?.bytes() ?? []),
          },
          { transient: { ethSigner: custody1 } }
        );

        signerAddLater = new MessageModel(addMessage) as SignerAddModel;
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(signerAdd);
        await expect(set.merge(signerAddLater)).resolves.toEqual(undefined);

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
      let signerAddLater: SignerAddModel;

      beforeAll(async () => {
        const addData = await Factories.SignerAddData.create({
          ...signerAdd.data.unpack(),
        });

        const addMessage = await Factories.Message.create(
          {
            data: Array.from(addData.bb?.bytes() ?? []),
            hash: Array.from(bytesIncrement(signerAdd.hash())),
          },
          { transient: { ethSigner: custody1 } }
        );

        signerAddLater = new MessageModel(addMessage) as SignerAddModel;
      });

      test('succeeds with a higher hash', async () => {
        await set.merge(signerAdd);
        await expect(set.merge(signerAddLater)).resolves.toEqual(undefined);

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
        const removeData = await Factories.SignerRemoveData.create({
          ...signerRemove.data.unpack(),
          timestamp: signerAdd.timestamp() - 1,
        });

        const removeMessage = await Factories.Message.create(
          {
            data: Array.from(removeData.bb?.bytes() ?? []),
          },
          { transient: { ethSigner: custody1 } }
        );

        const signerRemoveEarlier = new MessageModel(removeMessage) as SignerRemoveModel;

        await set.merge(signerRemoveEarlier);
        await expect(set.merge(signerAdd)).resolves.toEqual(undefined);

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
        const removeData = await Factories.SignerRemoveData.create({
          ...signerRemove.data.unpack(),
          timestamp: signerAdd.timestamp(),
        });

        const removeMessage = await Factories.Message.create(
          {
            data: Array.from(removeData.bb?.bytes() ?? []),
            hash: Array.from(bytesIncrement(signerAdd.hash())),
          },
          { transient: { ethSigner: custody1 } }
        );

        const signerRemoveLater = new MessageModel(removeMessage) as SignerRemoveModel;

        await set.merge(signerRemoveLater);
        await expect(set.merge(signerAdd)).rejects.toEqual(
          new HubError('bad_request.conflict', 'message conflicts with a more recent SignerRemove')
        );

        await assertSignerRemoveWins(signerRemoveLater);
        await assertSignerDoesNotExist(signerAdd);
        expect(mergeEvents).toEqual([[signerRemoveLater, []]]);
      });

      test('fails if remove has a lower hash', async () => {
        const removeData = await Factories.SignerRemoveData.create({
          ...signerRemove.data.unpack(),
          timestamp: signerAdd.timestamp(),
        });

        const removeMessage = await Factories.Message.create(
          {
            data: Array.from(removeData.bb?.bytes() ?? []),
            hash: Array.from(bytesDecrement(signerAdd.hash())),
          },
          { transient: { ethSigner: custody1 } }
        );

        const signerRemoveEarlier = new MessageModel(removeMessage) as SignerRemoveModel;

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
      await expect(set.merge(signerRemove)).resolves.toEqual(undefined);

      await assertSignerRemoveWins(signerRemove);
      expect(mergeEvents).toEqual([[signerRemove, []]]);
    });

    test('fails if merged twice', async () => {
      await expect(set.merge(signerRemove)).resolves.toEqual(undefined);
      await expect(set.merge(signerRemove)).rejects.toEqual(
        new HubError('bad_request.duplicate', 'message has already been merged')
      );

      await assertSignerRemoveWins(signerRemove);
      expect(mergeEvents).toEqual([[signerRemove, []]]);
    });

    describe('with a conflicting SignerRemove with different timestamps', () => {
      let signerRemoveLater: SignerRemoveModel;

      beforeAll(async () => {
        const removeData = await Factories.SignerRemoveData.create({
          ...signerRemove.data.unpack(),
          timestamp: signerRemove.timestamp() + 1,
        });
        const removeMessage = await Factories.Message.create(
          {
            data: Array.from(removeData.bb?.bytes() ?? []),
          },
          { transient: { ethSigner: custody1 } }
        );
        signerRemoveLater = new MessageModel(removeMessage) as SignerRemoveModel;
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(signerRemove);
        await expect(set.merge(signerRemoveLater)).resolves.toEqual(undefined);

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
      let signerRemoveLater: SignerRemoveModel;

      beforeAll(async () => {
        const removeData = await Factories.SignerRemoveData.create({
          ...signerRemove.data.unpack(),
        });

        const removeMessage = await Factories.Message.create(
          {
            data: Array.from(removeData.bb?.bytes() ?? []),
            hash: Array.from(bytesIncrement(signerRemove.hash())),
          },
          { transient: { ethSigner: custody1 } }
        );

        signerRemoveLater = new MessageModel(removeMessage) as SignerRemoveModel;
      });

      test('succeeds with a higher hash', async () => {
        await set.merge(signerRemove);
        await expect(set.merge(signerRemoveLater)).resolves.toEqual(undefined);

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
        await expect(set.merge(signerRemove)).resolves.toEqual(undefined);

        await assertSignerRemoveWins(signerRemove);
        await assertSignerDoesNotExist(signerAdd);
        expect(mergeEvents).toEqual([
          [signerAdd, []],
          [signerRemove, [signerAdd]],
        ]);
      });

      test('fails with an earlier timestamp', async () => {
        const addData = await Factories.SignerAddData.create({
          ...signerRemove.data.unpack(),
          timestamp: signerRemove.timestamp() + 1,
          type: MessageType.SignerAdd,
        });

        const addMessage = await Factories.Message.create(
          {
            data: Array.from(addData.bb?.bytes() ?? []),
          },
          { transient: { ethSigner: custody1 } }
        );

        const signerAddLater = new MessageModel(addMessage) as SignerAddModel;

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
        const addData = await Factories.SignerAddData.create({
          ...signerRemove.data.unpack(),
          type: MessageType.SignerAdd,
        });

        const addMessage = await Factories.Message.create(
          {
            data: Array.from(addData.bb?.bytes() ?? []),
            hash: Array.from(bytesIncrement(signerRemove.hash())),
          },
          { transient: { ethSigner: custody1 } }
        );
        const signerAddLater = new MessageModel(addMessage) as SignerAddModel;

        await set.merge(signerAddLater);
        await expect(set.merge(signerRemove)).resolves.toEqual(undefined);

        await assertSignerDoesNotExist(signerAddLater);
        await assertSignerRemoveWins(signerRemove);
        expect(mergeEvents).toEqual([
          [signerAddLater, []],
          [signerRemove, [signerAddLater]],
        ]);
      });

      test('succeeds with a higher hash', async () => {
        const addData = await Factories.SignerAddData.create({
          ...signerRemove.data.unpack(),
          type: MessageType.SignerAdd,
        });

        const addMessage = await Factories.Message.create(
          {
            data: Array.from(addData.bb?.bytes() ?? []),
            hash: Array.from(bytesDecrement(signerRemove.hash())),
          },
          { transient: { ethSigner: custody1 } }
        );

        const signerAddEarlier = new MessageModel(addMessage) as SignerAddModel;

        await set.merge(signerAddEarlier);
        await expect(set.merge(signerRemove)).resolves.toEqual(undefined);

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
  test('returns fids for merged custody events', async () => {
    const fid2 = Factories.FID.build();
    const idRegistryEvent = await Factories.IdRegistryEvent.create({
      fid: Array.from(fid2),
      to: Array.from(custody2Address),
    });
    const custody2Event = new IdRegistryEventModel(idRegistryEvent);
    await set.mergeIdRegistryEvent(custody1Event);
    await set.mergeIdRegistryEvent(custody2Event);
    const fids = await set.getFids();
    expect(new Set(fids)).toEqual(new Set([fid, fid2]));
  });

  test('returns empty array without custody events', async () => {
    await expect(set.getFids()).resolves.toEqual([]);
  });
});

describe('revokeMessagesBySigner', () => {
  let custody2Transfer: IdRegistryEventModel;
  let signerAdd1: SignerAddModel;
  let signerAdd2: SignerAddModel;

  let revokedMessages: MessageModel[];
  const handleRevokeMessage = (message: MessageModel) => {
    revokedMessages.push(message);
  };

  beforeAll(async () => {
    const idRegistryTransfer = await Factories.IdRegistryEvent.create({
      type: IdRegistryEventType.IdRegistryTransfer,
      from: Array.from(custody1Address),
      fid: Array.from(fid),
      to: Array.from(custody2Address),
    });
    custody2Transfer = new IdRegistryEventModel(idRegistryTransfer);

    const addData1 = await Factories.SignerAddData.create({
      fid: Array.from(fid),
    });
    const addMessage1 = await Factories.Message.create(
      { data: Array.from(addData1.bb?.bytes() ?? []) },
      { transient: { ethSigner: custody1 } }
    );
    signerAdd1 = new MessageModel(addMessage1) as SignerAddModel;

    const addData2 = await Factories.SignerAddData.create({
      fid: Array.from(fid),
    });
    const addMessage2 = await Factories.Message.create(
      { data: Array.from(addData2.bb?.bytes() ?? []) },
      { transient: { ethSigner: custody2 } }
    );
    signerAdd2 = new MessageModel(addMessage2) as SignerAddModel;

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
      await set.mergeIdRegistryEvent(custody1Event);
      await set.merge(signerAdd1);
      await set.merge(signerRemove);
      await set.mergeIdRegistryEvent(custody2Transfer);
      await set.merge(signerAdd2);

      const custody1Messages = await MessageModel.getAllBySigner(db, fid, custody1Address);
      expect(new Set(custody1Messages)).toEqual(new Set([signerAdd1, signerRemove]));

      const custody2Messages = await MessageModel.getAllBySigner(db, fid, custody2Address);
      expect(custody2Messages).toEqual([signerAdd2]);
    });

    test('deletes messages and emits revokeMessage events for custody1', async () => {
      await set.revokeMessagesBySigner(fid, custody1Address);
      const custody1Messages = await MessageModel.getAllBySigner(db, fid, custody1Address);
      expect(custody1Messages).toEqual([]);
      expect(revokedMessages).toEqual([signerAdd1, signerRemove]);
    });

    test('deletes messages and emits revokeMessage events for custody2', async () => {
      await set.revokeMessagesBySigner(fid, custody2Address);
      const custody2Messages = await MessageModel.getAllBySigner(db, fid, custody2Address);
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
  let prunedMessages: MessageModel[];
  const pruneMessageListener = (message: MessageModel) => {
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

  let add1: SignerAddModel;
  let add2: SignerAddModel;
  let add3: SignerAddModel;
  let add4: SignerAddModel;
  let add5: SignerAddModel;

  let remove1: SignerRemoveModel;
  let remove2: SignerRemoveModel;
  let remove3: SignerRemoveModel;
  let remove4: SignerRemoveModel;
  let remove5: SignerRemoveModel;

  const generateAddWithTimestamp = async (fid: Uint8Array, timestamp: number): Promise<SignerAddModel> => {
    const addData = await Factories.SignerAddData.create({ fid: Array.from(fid), timestamp });
    const addMessage = await Factories.Message.create({ data: Array.from(addData.bb?.bytes() ?? []) });
    return new MessageModel(addMessage) as SignerAddModel;
  };

  const generateRemoveWithTimestamp = async (
    fid: Uint8Array,
    timestamp: number,
    signer?: Uint8Array | null
  ): Promise<SignerRemoveModel> => {
    const removeBody = await Factories.SignerBody.build(signer ? { signer: Array.from(signer) } : {});
    const removeData = await Factories.SignerRemoveData.create({ fid: Array.from(fid), timestamp, body: removeBody });
    const removeMessage = await Factories.Message.create({ data: Array.from(removeData.bb?.bytes() ?? []) });
    return new MessageModel(removeMessage) as SignerRemoveModel;
  };

  beforeAll(async () => {
    const time = getFarcasterTime() - 10;
    add1 = await generateAddWithTimestamp(fid, time + 1);
    add2 = await generateAddWithTimestamp(fid, time + 2);
    add3 = await generateAddWithTimestamp(fid, time + 3);
    add4 = await generateAddWithTimestamp(fid, time + 4);
    add5 = await generateAddWithTimestamp(fid, time + 5);

    remove1 = await generateRemoveWithTimestamp(fid, time + 1, add1.body().signerArray());
    remove2 = await generateRemoveWithTimestamp(fid, time + 2, add2.body().signerArray());
    remove3 = await generateRemoveWithTimestamp(fid, time + 3, add3.body().signerArray());
    remove4 = await generateRemoveWithTimestamp(fid, time + 4, add4.body().signerArray());
    remove5 = await generateRemoveWithTimestamp(fid, time + 5, add5.body().signerArray());
  });

  describe('with size limit', () => {
    const sizePrunedStore = new SignerStore(db, eventHandler, { pruneSizeLimit: 3 });

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

      for (const message of prunedMessages as SignerAddModel[]) {
        const getAdd = () => sizePrunedStore.getSignerAdd(fid, message.body().signerArray() ?? new Uint8Array());
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

      for (const message of prunedMessages as SignerRemoveModel[]) {
        const getRemove = () => sizePrunedStore.getSignerRemove(fid, message.body().signerArray() ?? new Uint8Array());
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
