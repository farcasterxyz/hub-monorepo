import { faker } from '@faker-js/faker';
import Factories from '~/test/factories/flatbuffer';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import { BadRequestError, NotFoundError } from '~/utils/errors';
import { EthereumSigner } from '~/types';
import { generateEd25519KeyPair, generateEthereumSigner } from '~/utils/crypto';
import { arrayify } from 'ethers/lib/utils';
import SignerStore from '~/storage/sets/flatbuffers/signerStore';
import ContractEventModel from '~/storage/flatbuffers/contractEventModel';
import { SignerAddModel, SignerRemoveModel, UserPostfix } from '~/storage/flatbuffers/types';
import MessageModel from '~/storage/flatbuffers/messageModel';

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

  // TODO: if there multiple events, it should return the latest

  test('fails if event is missing', async () => {
    await expect(set.getIdRegistryEvent(fid)).rejects.toThrow(NotFoundError);
  });
});

// TODO: test getSignerAdd, particularly exception behavior
// TODO: test getSignerRemove, particularly exception behavior

describe('getCustodyAddress', () => {
  test('returns to from current IdRegistry event', async () => {
    await set.mergeIdRegistryEvent(custody1Event);
    await expect(set.getCustodyAddress(fid)).resolves.toEqual(custody1Address);
  });

  // TODO: if there are multiple events, it should return the latest

  test('fails if event is missing', async () => {
    await expect(set.getCustodyAddress(fid)).rejects.toThrow(NotFoundError);
  });
});

describe('getSignerAdd', () => {
  test('fails if missing', async () => {
    await expect(set.getSignerAdd(fid, signer, custody1Address)).rejects.toThrow(NotFoundError);
  });

  test('returns message', async () => {
    await set.merge(signerAdd);
    await expect(set.getSignerAdd(fid, signer, custody1Address)).resolves.toEqual(signerAdd);
  });

  // TEST: fails if incorrect custody address is passed in

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
    // DOCUMENT: what is the significance of passing in a custody address and not having the IdEvent?
    // Best understanding -- not passing in an address will return a message even if the relevant custody address has not e,rged

    await expect(set.getSignerRemove(fid, signer, custody1Address)).rejects.toThrow(NotFoundError);
  });

  test('returns message', async () => {
    await set.merge(signerRemove);
    await expect(set.getSignerRemove(fid, signer, custody1Address)).resolves.toEqual(signerRemove);
  });

  // TEST: fails if incorrect custody address is passed in

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

  // TEST: what is returned when the IdRegistry event is merged

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

  // TEST: what is returned when the IdRegistry event is merged

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

describe('mergeIdRegistryEvent', () => {
  test('succeeds', async () => {
    await expect(set.mergeIdRegistryEvent(custody1Event)).resolves.toEqual(undefined);
    await expect(set.getIdRegistryEvent(fid)).resolves.toEqual(custody1Event);
  });

  test('succeeds and activates signers, if present', async () => {
    await set.merge(signerAdd);
    await expect(set.getSignerAdd(fid, signer)).rejects.toThrow(NotFoundError);

    await expect(set.mergeIdRegistryEvent(custody1Event)).resolves.toEqual(undefined);
    await expect(set.getSignerAdd(fid, signer)).resolves.toEqual(signerAdd);
  });

  describe('overwrites existing event', () => {
    let newEvent: ContractEventModel;

    beforeEach(async () => {
      await set.mergeIdRegistryEvent(custody1Event);
    });

    afterEach(async () => {
      await expect(set.mergeIdRegistryEvent(newEvent)).resolves.toEqual(undefined);
      await expect(set.getIdRegistryEvent(fid)).resolves.toEqual(newEvent);
    });

    test('when it has a higher block number', async () => {
      const idRegistryEvent = await Factories.IdRegistryEvent.create({
        ...custody1Event.event.unpack(),
        to: Array.from(custody2Address),
        blockNumber: custody1Event.blockNumber() + 1,
      });
      newEvent = new ContractEventModel(idRegistryEvent);
    });

    test('when it has the same block number and a higher log index', async () => {
      const idRegistryEvent = await Factories.IdRegistryEvent.create({
        ...custody1Event.event.unpack(),
        to: Array.from(custody2Address),
        logIndex: custody1Event.logIndex() + 1,
      });
      newEvent = new ContractEventModel(idRegistryEvent);
    });

    test('when it has the same block number and log index and a higher tx hash order', async () => {
      const idRegistryEvent = await Factories.IdRegistryEvent.create({
        ...custody1Event.event.unpack(),
        to: Array.from(custody2Address),
        // Discuss: doesn't this result in the hash being larger and technically invalid?
        transactionHash: Array.from([...custody1Event.transactionHash(), 1]),
      });
      newEvent = new ContractEventModel(idRegistryEvent);
    });
  });

  describe('does not overwrite existing event', () => {
    let newEvent: ContractEventModel;

    beforeEach(async () => {
      await set.mergeIdRegistryEvent(custody1Event);
    });

    afterEach(async () => {
      await expect(set.mergeIdRegistryEvent(newEvent)).resolves.toEqual(undefined);
      await expect(set.getIdRegistryEvent(fid)).resolves.toEqual(custody1Event);
    });

    test('when it has a lower block number', async () => {
      const idRegistryEvent = await Factories.IdRegistryEvent.create({
        ...custody1Event.event.unpack(),
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

    test('when it has the same block number and log index and a lower transaction hash order', async () => {
      const idRegistryEvent = await Factories.IdRegistryEvent.create({
        ...custody1Event.event.unpack(),
        to: Array.from(custody2Address),
        transactionHash: Array.from([...custody1Event.transactionHash().slice(0, -1)]),
      });
      newEvent = new ContractEventModel(idRegistryEvent);
    });

    test('when is a duplicate', async () => {
      newEvent = custody1Event;
    });
  });

  // TEST: if 3 custody events are present, and the last one moves it back to the first, what will happen?
});

// States
// Invalid message
// A Signer Add is observed, with nothing
// A Signer Add is observed, with a SignerAdd (with older ts)
// A Signer Add is observed, with a SignerAdd (with newer ts)
// A Signer Add is observed, with a SignerAdd (with same ts, but newer hash)
// A Signer Add is observed, with a SignerAdd (with same ts, but older hash)

// A Signer Add is observed, with a SignerRemove (with older ts)
// A Signer Add is observed, with a SignerRemove (with newer ts)
// A Signer Add is observed, with a SignerRemove (with same ts, and newer hash)
// A Signer Add is observed, with a SignerRemove (with same ts, and older hash)

// State Changes
// Message
// SetIndex

describe('merge', () => {
  test('fails with invalid message type', async () => {
    const invalidData = await Factories.ReactionAddData.create({ fid: Array.from(fid) });
    const message = await Factories.Message.create({ data: Array.from(invalidData.bb?.bytes() ?? []) });
    await expect(set.merge(new MessageModel(message))).rejects.toThrow(BadRequestError);
  });

  describe('SignerAdd', () => {
    describe('succeeds', () => {
      beforeEach(async () => {
        await expect(set.merge(signerAdd)).resolves.toEqual(undefined);
      });

      test('saves message', async () => {
        await expect(MessageModel.get(db, fid, UserPostfix.SignerMessage, signerAdd.tsHash())).resolves.toEqual(
          signerAdd
        );
      });

      test('saves signerAdds index', async () => {
        await expect(set.getSignerAdd(fid, signer, custody1Address)).resolves.toEqual(signerAdd);
      });

      test('no-ops when merged twice', async () => {
        await expect(set.merge(signerAdd)).resolves.toEqual(undefined);
        await expect(set.getSignerAdd(fid, signer, custody1Address)).resolves.toEqual(signerAdd);
      });
    });

    describe('with conflicting SignerAdd', () => {
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
        await expect(set.getSignerAdd(fid, signer, custody1Address)).resolves.toEqual(signerAddLater);
        await expect(MessageModel.get(db, fid, UserPostfix.SignerMessage, signerAdd.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(signerAddLater);
        await expect(set.merge(signerAdd)).resolves.toEqual(undefined);
        await expect(set.getSignerAdd(fid, signer, custody1Address)).resolves.toEqual(signerAddLater);
        await expect(MessageModel.get(db, fid, UserPostfix.SignerMessage, signerAdd.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });
    });

    describe('with conflicting SignerRemove', () => {
      let signerRemoveEarlier: SignerRemoveModel;

      beforeAll(async () => {
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
        signerRemoveEarlier = new MessageModel(removeMessage) as SignerRemoveModel;
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(signerRemoveEarlier);
        await expect(set.merge(signerAdd)).resolves.toEqual(undefined);
        await expect(set.getSignerAdd(fid, signer, custody1Address)).resolves.toEqual(signerAdd);
        await expect(set.getSignerRemove(fid, signer, custody1Address)).rejects.toThrow(NotFoundError);
        await expect(
          MessageModel.get(db, fid, UserPostfix.SignerMessage, signerRemoveEarlier.tsHash())
        ).rejects.toThrow(NotFoundError);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(signerRemove);
        await expect(set.merge(signerAdd)).resolves.toEqual(undefined);
        await expect(set.getSignerRemove(fid, signer, custody1Address)).resolves.toEqual(signerRemove);
        await expect(set.getSignerAdd(fid, signer, custody1Address)).rejects.toThrow(NotFoundError);
        await expect(MessageModel.get(db, fid, UserPostfix.SignerMessage, signerAdd.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });
    });
  });

  describe('SignerRemove', () => {
    describe('succeeds', () => {
      beforeEach(async () => {
        await set.merge(signerAdd);
        await expect(set.merge(signerRemove)).resolves.toEqual(undefined);
      });

      test('saves message', async () => {
        await expect(MessageModel.get(db, fid, UserPostfix.SignerMessage, signerRemove.tsHash())).resolves.toEqual(
          signerRemove
        );
      });

      test('saves signerRemoves index', async () => {
        await expect(set.getSignerRemove(fid, signer, custody1Address)).resolves.toEqual(signerRemove);
      });

      test('deletes SignerAdd message', async () => {
        await expect(MessageModel.get(db, fid, UserPostfix.SignerMessage, signerAdd.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });

      test('deletes signerAdds index', async () => {
        await expect(set.getSignerAdd(fid, signer, custody1Address)).rejects.toThrow(NotFoundError);
      });
    });

    describe('with conflicting SignerRemove', () => {
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
        await expect(set.getSignerRemove(fid, signer, custody1Address)).resolves.toEqual(signerRemoveLater);
        await expect(MessageModel.get(db, fid, UserPostfix.VerificationMessage, signerRemove.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(signerRemoveLater);
        await expect(set.merge(signerRemove)).resolves.toEqual(undefined);
        await expect(set.getSignerRemove(fid, signer, custody1Address)).resolves.toEqual(signerRemoveLater);
        await expect(MessageModel.get(db, fid, UserPostfix.VerificationMessage, signerRemove.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });

      // TODO: same signer, different custody address
    });

    describe('with conflicting SignerAdd', () => {
      let signerAddLater: SignerAddModel;

      beforeAll(async () => {
        const addData = await Factories.SignerAddData.create({
          ...signerAdd.data.unpack(),
          timestamp: signerRemove.timestamp() + 1,
        });
        const addMessage = await Factories.Message.create(
          {
            data: Array.from(addData.bb?.bytes() ?? []),
          },
          { transient: { wallet: custody1.wallet } }
        );
        signerAddLater = new MessageModel(addMessage) as SignerAddModel;
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(signerAddLater);
        await expect(set.merge(signerRemove)).resolves.toEqual(undefined);
        await expect(set.getSignerAdd(fid, signer, custody1Address)).resolves.toEqual(signerAddLater);
        await expect(set.getSignerRemove(fid, signer, custody1Address)).rejects.toThrow(NotFoundError);
        await expect(MessageModel.get(db, fid, UserPostfix.SignerMessage, signerRemove.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(signerAdd);
        await expect(set.merge(signerRemove)).resolves.toEqual(undefined);
        await expect(set.getSignerRemove(fid, signer, custody1Address)).resolves.toEqual(signerRemove);
        await expect(set.getSignerAdd(fid, signer, custody1Address)).rejects.toThrow(NotFoundError);
        await expect(MessageModel.get(db, fid, UserPostfix.SignerMessage, signerAdd.tsHash())).rejects.toThrow(
          NotFoundError
        );
      });
    });

    test('succeeds when SignerAdd does not exist', async () => {
      await expect(set.merge(signerRemove)).resolves.toEqual(undefined);
      await expect(set.getSignerRemove(fid, signer, custody1Address)).resolves.toEqual(signerRemove);
      await expect(set.getSignerAdd(fid, signer, custody1Address)).rejects.toThrow(NotFoundError);
    });
  });
});
