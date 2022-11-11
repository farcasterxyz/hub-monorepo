import { faker } from '@faker-js/faker';
import Factories from '~/test/factories/flatbuffer';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import { NotFoundError, ValidationError } from '~/utils/errors';
import { EthereumSigner } from '~/types';
import { generateEd25519KeyPair, generateEthereumSigner } from '~/utils/crypto';
import { arrayify } from 'ethers/lib/utils';
import SignerStore from '~/storage/sets/flatbuffers/signerStore';
import ContractEventModel from '~/storage/flatbuffers/contractEventModel';
import { SignerAddModel, SignerRemoveModel, UserPostfix } from '~/storage/flatbuffers/types';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { bytesDecrement, bytesIncrement } from '~/storage/flatbuffers/utils';
import { MessageType } from '~/utils/generated/message_generated';
import { HubError } from '~/utils/hubErrors';

const db = jestBinaryRocksDB('flatbuffers.signerStore.test');
const set = new SignerStore(db);
const fid = Factories.FID.build();

let custody1: EthereumSigner;
let custody1Address: Uint8Array;
let custody1Event: ContractEventModel;

let custody2: EthereumSigner;
let custody2Address: Uint8Array;

let signer: Uint8Array;

let signerAdd: SignerAddModel;
let signerRemove: SignerRemoveModel;

beforeAll(async () => {
  custody1 = await generateEthereumSigner();
  custody1Address = arrayify(custody1.signerKey);
  const idRegistryEvent = await Factories.IdRegistryEvent.create({
    fid: Array.from(fid),
    to: Array.from(custody1Address),
  });
  custody1Event = new ContractEventModel(idRegistryEvent);

  custody2 = await generateEthereumSigner();
  custody2Address = arrayify(custody2.signerKey);

  signer = (await generateEd25519KeyPair()).publicKey;

  const addData = await Factories.SignerAddData.create({
    body: Factories.SignerBody.build({ signer: Array.from(signer) }),
    fid: Array.from(fid),
  });

  const addMessage = await Factories.Message.create(
    { data: Array.from(addData.bb?.bytes() ?? []) },
    { transient: { wallet: custody1.wallet } }
  );
  signerAdd = new MessageModel(addMessage) as SignerAddModel;

  const removeData = await Factories.SignerRemoveData.create({
    body: Factories.SignerBody.build({ signer: Array.from(signer) }),
    fid: Array.from(fid),
    timestamp: addData.timestamp() + 1,
  });
  const removeMessage = await Factories.Message.create(
    { data: Array.from(removeData.bb?.bytes() ?? []) },
    { transient: { wallet: custody1.wallet } }
  );
  signerRemove = new MessageModel(removeMessage) as SignerRemoveModel;
});

describe('getIdRegistryEvent', () => {
  test('returns contract event if it exists', async () => {
    await set.mergeIdRegistryEvent(custody1Event);
    await expect(set.getIdRegistryEvent(fid)).resolves.toEqual(custody1Event);
  });

  test('fails if event is missing', async () => {
    await expect(set.getIdRegistryEvent(fid)).rejects.toThrow(NotFoundError);
  });
});

describe('getCustodyAddress', () => {
  test('returns to from current IdRegistry event', async () => {
    await set.mergeIdRegistryEvent(custody1Event);
    await expect(set.getCustodyAddress(fid)).resolves.toEqual(custody1Address);
  });

  test('fails if event is missing', async () => {
    await expect(set.getCustodyAddress(fid)).rejects.toThrow(NotFoundError);
  });
});

describe('getSignerAdd', () => {
  test('fails if missing', async () => {
    await expect(set.getSignerAdd(fid, signer, custody1Address)).rejects.toThrow(NotFoundError);
  });

  test('fails if incorrect custody address is passed in', async () => {
    await set.merge(signerAdd);
    const arbitraryCustodyAddress = arrayify(faker.datatype.hexadecimal({ length: 40 }));

    await expect(set.getSignerAdd(fid, signer, arbitraryCustodyAddress)).rejects.toThrow(NotFoundError);
  });

  test('returns message', async () => {
    await set.merge(signerAdd);
    await expect(set.getSignerAdd(fid, signer, custody1Address)).resolves.toEqual(signerAdd);
  });

  describe('without passing custodyAddress', () => {
    test('defaults to current custodyAddress', async () => {
      await set.mergeIdRegistryEvent(custody1Event);
      await set.merge(signerAdd);
      await expect(set.getSignerAdd(fid, signer)).resolves.toEqual(signerAdd);
    });

    test('fails when custodyAddress is missing', async () => {
      await set.merge(signerAdd);
      await expect(set.getSignerAdd(fid, signer)).rejects.toThrow(NotFoundError);
    });
  });
});

describe('getSignerRemove', () => {
  test('fails if missing', async () => {
    await expect(set.getSignerRemove(fid, signer, custody1Address)).rejects.toThrow(NotFoundError);
  });

  test('fails if incorrect custody address is passed in', async () => {
    await set.merge(signerRemove);
    const arbitraryCustodyAddress = arrayify(faker.datatype.hexadecimal({ length: 40 }));

    await expect(set.getSignerAdd(fid, signer, arbitraryCustodyAddress)).rejects.toThrow(NotFoundError);
  });

  test('returns message', async () => {
    await set.merge(signerRemove);
    await expect(set.getSignerRemove(fid, signer, custody1Address)).resolves.toEqual(signerRemove);
  });

  describe('without passing custodyAddress', () => {
    test('defaults to current custodyAddress', async () => {
      await set.mergeIdRegistryEvent(custody1Event);
      await set.merge(signerRemove);
      await expect(set.getSignerRemove(fid, signer)).resolves.toEqual(signerRemove);
    });

    test('fails when custodyAddress is missing', async () => {
      await set.merge(signerRemove);
      await expect(set.getSignerRemove(fid, signer)).rejects.toThrow(NotFoundError);
    });
  });
});

describe('getSignerAddsByUser', () => {
  test('returns signer adds for an fid and custody address', async () => {
    await set.merge(signerAdd);
    await expect(set.getSignerAddsByUser(fid, custody1Address)).resolves.toEqual([signerAdd]);
  });

  test('returns empty array for wrong custody address', async () => {
    await set.merge(signerAdd);
    const custodyAddress = arrayify(faker.datatype.hexadecimal({ length: 40 }));
    await expect(set.getSignerAddsByUser(fid, custodyAddress)).resolves.toEqual([]);
  });

  test('returns empty array when messages have not been merged', async () => {
    await expect(set.getSignerAddsByUser(fid, custody1Address)).resolves.toEqual([]);
  });

  describe('without passing custodyAddress', () => {
    test('defaults to current custodyAddress', async () => {
      await set.mergeIdRegistryEvent(custody1Event);
      await set.merge(signerAdd);
      await expect(set.getSignerAddsByUser(fid)).resolves.toEqual([signerAdd]);
    });

    test('fails when custodyAddress is missing', async () => {
      await set.merge(signerAdd);
      await expect(set.getSignerAddsByUser(fid)).rejects.toThrow(NotFoundError);
    });
  });
});

describe('getSignerRemovesByUser', () => {
  test('returns signer removes for an fid and custody address', async () => {
    await set.merge(signerRemove);
    await expect(set.getSignerRemovesByUser(fid, custody1Address)).resolves.toEqual([signerRemove]);
  });

  test('returns empty array for wrong custody address', async () => {
    await set.merge(signerRemove);
    const custodyAddress = arrayify(faker.datatype.hexadecimal({ length: 40 }));
    await expect(set.getSignerRemovesByUser(fid, custodyAddress)).resolves.toEqual([]);
  });

  test('returns empty array when messages have not been merged', async () => {
    await expect(set.getSignerRemovesByUser(fid, custody1Address)).resolves.toEqual([]);
  });

  describe('without passing custodyAddress', () => {
    test('defaults to current custodyAddress', async () => {
      await set.mergeIdRegistryEvent(custody1Event);
      await set.merge(signerRemove);
      await expect(set.getSignerRemovesByUser(fid)).resolves.toEqual([signerRemove]);
    });

    test('fails when custodyAddress is missing', async () => {
      await set.merge(signerRemove);
      await expect(set.getSignerRemovesByUser(fid)).rejects.toThrow(NotFoundError);
    });
  });
});

// TODO: write test cases for cyclical custody event transfers

describe('mergeIdRegistryEvent', () => {
  test('succeeds and activates signers, if present', async () => {
    await set.merge(signerAdd);
    await expect(set.getSignerAdd(fid, signer)).rejects.toThrow(NotFoundError);

    await expect(set.mergeIdRegistryEvent(custody1Event)).resolves.toEqual(undefined);
    await expect(set.getIdRegistryEvent(fid)).resolves.toEqual(custody1Event);
    await expect(set.getSignerAdd(fid, signer)).resolves.toEqual(signerAdd);
  });

  test('fails if events have the same blockNumber but different blockHashes', async () => {
    const idRegistryEvent = await Factories.IdRegistryEvent.create({
      ...custody1Event.event.unpack(),
      blockHash: Array.from(arrayify(faker.datatype.hexadecimal({ length: 64 }))),
    });

    const blockHashConflictEvent = new ContractEventModel(idRegistryEvent);
    await set.mergeIdRegistryEvent(custody1Event);
    await expect(set.mergeIdRegistryEvent(blockHashConflictEvent)).rejects.toThrow(ValidationError);
  });

  test('fails if events have the same blockNumber and logIndex but different transactionHashes', async () => {
    const idRegistryEvent = await Factories.IdRegistryEvent.create({
      ...custody1Event.event.unpack(),
      transactionHash: Array.from(arrayify(faker.datatype.hexadecimal({ length: 64 }))),
    });

    const txHashConflictEvent = new ContractEventModel(idRegistryEvent);
    await set.mergeIdRegistryEvent(custody1Event);
    await expect(set.mergeIdRegistryEvent(txHashConflictEvent)).rejects.toThrow(ValidationError);
  });

  describe('overwrites existing event', () => {
    let newEvent: ContractEventModel;

    beforeEach(async () => {
      await set.mergeIdRegistryEvent(custody1Event);
      await set.merge(signerAdd);
      await expect(set.getSignerAdd(fid, signer)).resolves.toEqual(signerAdd);
    });

    afterEach(async () => {
      await expect(set.mergeIdRegistryEvent(newEvent)).resolves.toEqual(undefined);
      await expect(set.getIdRegistryEvent(fid)).resolves.toEqual(newEvent);
      await expect(set.getSignerAdd(fid, signer)).rejects.toThrow(NotFoundError);
    });

    test('when it has a higher block number', async () => {
      const idRegistryEvent = await Factories.IdRegistryEvent.create({
        ...custody1Event.event.unpack(),
        transactionHash: Array.from(arrayify(faker.datatype.hexadecimal({ length: 64 }))),
        to: Array.from(custody2Address),
        blockNumber: custody1Event.blockNumber() + 1,
      });
      newEvent = new ContractEventModel(idRegistryEvent);
    });

    test('when it has the same block number and a higher log index', async () => {
      const idRegistryEvent = await Factories.IdRegistryEvent.create({
        ...custody1Event.event.unpack(),
        transactionHash: Array.from(arrayify(faker.datatype.hexadecimal({ length: 64 }))),
        to: Array.from(custody2Address),
        logIndex: custody1Event.logIndex() + 1,
      });
      newEvent = new ContractEventModel(idRegistryEvent);
    });
  });

  describe('does not overwrite existing event', () => {
    let newEvent: ContractEventModel;

    beforeEach(async () => {
      await set.mergeIdRegistryEvent(custody1Event);
      await set.merge(signerAdd);
      await expect(set.getSignerAdd(fid, signer)).resolves.toEqual(signerAdd);
    });

    afterEach(async () => {
      await expect(set.mergeIdRegistryEvent(newEvent)).resolves.toEqual(undefined);
      await expect(set.getIdRegistryEvent(fid)).resolves.toEqual(custody1Event);
      await expect(set.getSignerAdd(fid, signer)).resolves.toEqual(signerAdd);
    });

    test('when it has a lower block number', async () => {
      const idRegistryEvent = await Factories.IdRegistryEvent.create({
        ...custody1Event.event.unpack(),
        transactionHash: Array.from(arrayify(faker.datatype.hexadecimal({ length: 64 }))),
        to: Array.from(custody2Address),
        blockNumber: custody1Event.blockNumber() - 1,
      });
      newEvent = new ContractEventModel(idRegistryEvent);
    });

    test('when it has the same block number and a lower log index', async () => {
      const idRegistryEvent = await Factories.IdRegistryEvent.create({
        ...custody1Event.event.unpack(),
        to: Array.from(custody2Address),
        logIndex: custody1Event.logIndex() - 1,
      });
      newEvent = new ContractEventModel(idRegistryEvent);
    });

    test('when is a duplicate', async () => {
      newEvent = custody1Event;
    });
  });
});

describe('merge', () => {
  const assertSignerExists = async (message: SignerAddModel | SignerRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.SignerMessage, message.tsHash())).resolves.toEqual(message);
  };

  const assertSignerDoesNotExist = async (message: SignerAddModel | SignerRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.SignerMessage, message.tsHash())).rejects.toThrow(NotFoundError);
  };

  const assertSignerAddWins = async (message: SignerAddModel) => {
    await assertSignerExists(message);
    await expect(set.getSignerAdd(fid, signer, custody1Address)).resolves.toEqual(message);
    await expect(set.getSignerRemove(fid, signer, custody1Address)).rejects.toThrow(NotFoundError);
  };

  const assertSignerRemoveWins = async (message: SignerRemoveModel) => {
    await assertSignerExists(message);
    await expect(set.getSignerRemove(fid, signer, custody1Address)).resolves.toEqual(message);
    await expect(set.getSignerAdd(fid, signer, custody1Address)).rejects.toThrow(NotFoundError);
  };

  test('fails with invalid message type', async () => {
    const invalidData = await Factories.ReactionAddData.create({ fid: Array.from(fid) });
    const message = await Factories.Message.create({ data: Array.from(invalidData.bb?.bytes() ?? []) });
    await expect(set.merge(new MessageModel(message))).rejects.toThrow(HubError);
  });

  describe('SignerAdd', () => {
    test('succeeds', async () => {
      await expect(set.merge(signerAdd)).resolves.toEqual(undefined);
      await assertSignerAddWins(signerAdd);
    });

    test('succeeds once, even if merged twice', async () => {
      await expect(set.merge(signerAdd)).resolves.toEqual(undefined);
      await expect(set.merge(signerAdd)).resolves.toEqual(undefined);

      await assertSignerAddWins(signerAdd);
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
          { transient: { wallet: custody1.wallet } }
        );

        signerAddLater = new MessageModel(addMessage) as SignerAddModel;
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(signerAdd);
        await expect(set.merge(signerAddLater)).resolves.toEqual(undefined);

        await assertSignerDoesNotExist(signerAdd);
        await assertSignerAddWins(signerAddLater);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(signerAddLater);
        await expect(set.merge(signerAdd)).resolves.toEqual(undefined);

        await assertSignerDoesNotExist(signerAdd);
        await assertSignerAddWins(signerAddLater);
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
            hash: Array.from(bytesIncrement(signerAdd.hash().slice())),
          },
          { transient: { wallet: custody1.wallet } }
        );

        signerAddLater = new MessageModel(addMessage) as SignerAddModel;
      });

      test('succeeds with a later hash', async () => {
        await set.merge(signerAdd);
        await expect(set.merge(signerAddLater)).resolves.toEqual(undefined);

        await assertSignerDoesNotExist(signerAdd);
        await assertSignerAddWins(signerAddLater);
      });

      test('no-ops with an earlier hash', async () => {
        await set.merge(signerAddLater);
        await expect(set.merge(signerAdd)).resolves.toEqual(undefined);

        await assertSignerDoesNotExist(signerAdd);
        await assertSignerAddWins(signerAddLater);
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
          { transient: { wallet: custody1.wallet } }
        );

        const signerRemoveEarlier = new MessageModel(removeMessage) as SignerRemoveModel;

        await set.merge(signerRemoveEarlier);
        await expect(set.merge(signerAdd)).resolves.toEqual(undefined);

        await assertSignerAddWins(signerAdd);
        await assertSignerDoesNotExist(signerRemoveEarlier);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(signerRemove);
        await expect(set.merge(signerAdd)).resolves.toEqual(undefined);

        await assertSignerRemoveWins(signerRemove);
        await assertSignerDoesNotExist(signerAdd);
      });
    });

    describe('with conflicting SignerRemove with identical timestamps', () => {
      test('no-ops if remove has a later hash', async () => {
        const removeData = await Factories.SignerRemoveData.create({
          ...signerRemove.data.unpack(),
          timestamp: signerAdd.timestamp(),
        });

        const removeMessage = await Factories.Message.create(
          {
            data: Array.from(removeData.bb?.bytes() ?? []),
            hash: Array.from(bytesIncrement(signerAdd.hash().slice())),
          },
          { transient: { wallet: custody1.wallet } }
        );

        const signerRemoveLater = new MessageModel(removeMessage) as SignerRemoveModel;

        await set.merge(signerRemoveLater);
        await expect(set.merge(signerAdd)).resolves.toEqual(undefined);

        await assertSignerRemoveWins(signerRemoveLater);
        await assertSignerDoesNotExist(signerAdd);
      });

      test('no-ops even if remove has an earlier hash', async () => {
        const removeData = await Factories.SignerRemoveData.create({
          ...signerRemove.data.unpack(),
          timestamp: signerAdd.timestamp(),
        });

        const removeMessage = await Factories.Message.create(
          {
            data: Array.from(removeData.bb?.bytes() ?? []),
            hash: Array.from(bytesDecrement(signerAdd.hash().slice())),
          },
          { transient: { wallet: custody1.wallet } }
        );

        const signerRemoveEarlier = new MessageModel(removeMessage) as SignerRemoveModel;

        await set.merge(signerRemoveEarlier);
        await expect(set.merge(signerAdd)).resolves.toEqual(undefined);

        await assertSignerDoesNotExist(signerAdd);
        await assertSignerRemoveWins(signerRemoveEarlier);
      });
    });
  });

  describe('SignerRemove', () => {
    test('succeeds', async () => {
      await expect(set.merge(signerRemove)).resolves.toEqual(undefined);

      await assertSignerRemoveWins(signerRemove);
    });

    test('succeeds once, even if merged twice', async () => {
      await expect(set.merge(signerRemove)).resolves.toEqual(undefined);
      await expect(set.merge(signerRemove)).resolves.toEqual(undefined);

      await assertSignerRemoveWins(signerRemove);
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
          { transient: { wallet: custody1.wallet } }
        );
        signerRemoveLater = new MessageModel(removeMessage) as SignerRemoveModel;
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(signerRemove);
        await expect(set.merge(signerRemoveLater)).resolves.toEqual(undefined);

        await assertSignerDoesNotExist(signerRemove);
        await assertSignerRemoveWins(signerRemoveLater);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(signerRemoveLater);
        await expect(set.merge(signerRemove)).resolves.toEqual(undefined);

        await assertSignerDoesNotExist(signerRemove);
        await assertSignerRemoveWins(signerRemoveLater);
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
            hash: Array.from(bytesIncrement(signerRemove.hash().slice())),
          },
          { transient: { wallet: custody1.wallet } }
        );

        signerRemoveLater = new MessageModel(removeMessage) as SignerRemoveModel;
      });

      test('succeeds with a later hash', async () => {
        await set.merge(signerRemove);
        await expect(set.merge(signerRemoveLater)).resolves.toEqual(undefined);

        await assertSignerDoesNotExist(signerRemove);
        await assertSignerRemoveWins(signerRemoveLater);
      });

      test('no-ops with an earlier hash', async () => {
        await set.merge(signerRemoveLater);
        await expect(set.merge(signerRemove)).resolves.toEqual(undefined);

        await assertSignerDoesNotExist(signerRemove);
        await assertSignerRemoveWins(signerRemoveLater);
      });
    });

    describe('with conflicting SignerAdd with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        await set.merge(signerAdd);
        await expect(set.merge(signerRemove)).resolves.toEqual(undefined);

        await assertSignerRemoveWins(signerRemove);
        await assertSignerDoesNotExist(signerAdd);
      });

      test('no-ops with an earlier timestamp', async () => {
        const addData = await Factories.SignerAddData.create({
          ...signerRemove.data.unpack(),
          timestamp: signerRemove.timestamp() + 1,
          type: MessageType.SignerAdd,
        });

        const addMessage = await Factories.Message.create(
          {
            data: Array.from(addData.bb?.bytes() ?? []),
          },
          { transient: { wallet: custody1.wallet } }
        );

        const signerAddLater = new MessageModel(addMessage) as SignerAddModel;

        await set.merge(signerAddLater);
        await expect(set.merge(signerRemove)).resolves.toEqual(undefined);

        await assertSignerAddWins(signerAddLater);
        await assertSignerDoesNotExist(signerRemove);
      });
    });

    describe('with conflicting SignerAdd with identical timestamps', () => {
      test('succeeds with an earlier hash', async () => {
        const addData = await Factories.SignerAddData.create({
          ...signerRemove.data.unpack(),
          type: MessageType.SignerAdd,
        });

        const addMessage = await Factories.Message.create(
          {
            data: Array.from(addData.bb?.bytes() ?? []),
            hash: Array.from(bytesIncrement(signerRemove.hash().slice())),
          },
          { transient: { wallet: custody1.wallet } }
        );
        const signerAddLater = new MessageModel(addMessage) as SignerAddModel;

        await set.merge(signerAddLater);
        await expect(set.merge(signerRemove)).resolves.toEqual(undefined);

        await assertSignerDoesNotExist(signerAddLater);
        await assertSignerRemoveWins(signerRemove);
      });

      test('succeeds with a later hash', async () => {
        const addData = await Factories.SignerAddData.create({
          ...signerRemove.data.unpack(),
          type: MessageType.SignerAdd,
        });

        const addMessage = await Factories.Message.create(
          {
            data: Array.from(addData.bb?.bytes() ?? []),
            hash: Array.from(bytesDecrement(signerRemove.hash().slice())),
          },
          { transient: { wallet: custody1.wallet } }
        );

        const signerAddEarlier = new MessageModel(addMessage) as SignerAddModel;

        await set.merge(signerAddEarlier);
        await expect(set.merge(signerRemove)).resolves.toEqual(undefined);

        await assertSignerDoesNotExist(signerAddEarlier);
        await assertSignerRemoveWins(signerRemove);
      });
    });
  });
});
