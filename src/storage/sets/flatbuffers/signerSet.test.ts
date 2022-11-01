import { faker } from '@faker-js/faker';
import Factories from '~/test/factories/flatbuffer';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import { BadRequestError, NotFoundError } from '~/utils/errors';
import { EthereumSigner } from '~/types';
import { generateEd25519KeyPair, generateEthereumSigner } from '~/utils/crypto';
import { arrayify } from 'ethers/lib/utils';
import SignerSet from '~/storage/sets/flatbuffers/signerSet';
import ContractEventModel from '~/storage/flatbuffers/contractEventModel';
import { SignerAddModel, SignerRemoveModel, UserPrefix } from '~/storage/flatbuffers/types';
import MessageModel from '~/storage/flatbuffers/model';

const db = jestBinaryRocksDB('flatbuffers.signerSet.test');
const set = new SignerSet(db);
const fid = Factories.FID.build();

let custody1: EthereumSigner;
let custody1Address: Uint8Array;
let custody1Event: ContractEventModel;

let signer: Uint8Array;

let signerAdd: SignerAddModel;
let signerRemove: SignerRemoveModel;

beforeAll(async () => {
  custody1 = await generateEthereumSigner();
  custody1Address = arrayify(custody1.signerKey);
  const idRegistryEvent = await Factories.IDRegistryEvent.create({
    fid: Array.from(fid),
    to: Array.from(custody1Address),
  });
  custody1Event = new ContractEventModel(idRegistryEvent);

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

describe('getIDRegistryEvent', () => {
  test('returns contract event', async () => {
    await set.mergeIDRegistryEvent(custody1Event);
    await expect(set.getIDRegistryEvent(fid)).resolves.toEqual(custody1Event);
  });

  test('fails if event is missing', async () => {
    await expect(set.getIDRegistryEvent(fid)).rejects.toThrow(NotFoundError);
  });
});

describe('getCustodyAddress', () => {
  test('returns to from current IDRegistry event', async () => {
    await set.mergeIDRegistryEvent(custody1Event);
    await expect(set.getCustodyAddress(fid)).resolves.toEqual(custody1Address);
  });

  test('fails if event is missing', async () => {
    await expect(set.getCustodyAddress(fid)).rejects.toThrow(NotFoundError);
  });
});

describe('mergeIDRegistryEvent', () => {
  test('succeeds', async () => {
    await expect(set.mergeIDRegistryEvent(custody1Event)).resolves.toEqual(undefined);
    await expect(set.getIDRegistryEvent(fid)).resolves.toEqual(custody1Event);
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

  describe('without passing custodyAddress', () => {
    test('defaults to current custodyAddress', async () => {
      await set.mergeIDRegistryEvent(custody1Event);
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

  test('returns message', async () => {
    await set.merge(signerRemove);
    await expect(set.getSignerRemove(fid, signer, custody1Address)).resolves.toEqual(signerRemove);
  });

  describe('without passing custodyAddress', () => {
    test('defaults to current custodyAddress', async () => {
      await set.mergeIDRegistryEvent(custody1Event);
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
      await set.mergeIDRegistryEvent(custody1Event);
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
      await set.mergeIDRegistryEvent(custody1Event);
      await set.merge(signerRemove);
      await expect(set.getSignerRemovesByUser(fid)).resolves.toEqual([signerRemove]);
    });

    test('fails when custodyAddress is missing', async () => {
      await set.merge(signerRemove);
      await expect(set.getSignerRemovesByUser(fid)).rejects.toThrow(NotFoundError);
    });
  });
});

describe('merge', () => {
  test('fails with invalid message type', async () => {
    const invalidData = await Factories.ReactionAddData.create({ fid: Array.from(fid) });
    const message = await Factories.Message.create({ data: Array.from(invalidData.bb?.bytes() ?? []) });
    await expect(set.merge(new MessageModel(message))).rejects.toThrow(BadRequestError);
  });

  describe('SignerRemove', () => {
    describe('succeeds', () => {
      beforeEach(async () => {
        await set.merge(signerAdd);
        await expect(set.merge(signerRemove)).resolves.toEqual(undefined);
      });

      test('saves message', async () => {
        await expect(
          MessageModel.get(db, fid, UserPrefix.SignerMessage, signerRemove.timestampHash())
        ).resolves.toEqual(signerRemove);
      });

      test('saves signerRemoves index', async () => {
        await expect(set.getSignerRemove(fid, signer, custody1Address)).resolves.toEqual(signerRemove);
      });

      test('deletes SignerAdd message', async () => {
        await expect(MessageModel.get(db, fid, UserPrefix.SignerMessage, signerAdd.timestampHash())).rejects.toThrow(
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
        await expect(
          MessageModel.get(db, fid, UserPrefix.VerificationMessage, signerRemove.timestampHash())
        ).rejects.toThrow(NotFoundError);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(signerRemoveLater);
        await expect(set.merge(signerRemove)).resolves.toEqual(undefined);
        await expect(set.getSignerRemove(fid, signer, custody1Address)).resolves.toEqual(signerRemoveLater);
        await expect(
          MessageModel.get(db, fid, UserPrefix.VerificationMessage, signerRemove.timestampHash())
        ).rejects.toThrow(NotFoundError);
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
        await expect(MessageModel.get(db, fid, UserPrefix.SignerMessage, signerRemove.timestampHash())).rejects.toThrow(
          NotFoundError
        );
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(signerAdd);
        await expect(set.merge(signerRemove)).resolves.toEqual(undefined);
        await expect(set.getSignerRemove(fid, signer, custody1Address)).resolves.toEqual(signerRemove);
        await expect(set.getSignerAdd(fid, signer, custody1Address)).rejects.toThrow(NotFoundError);
        await expect(MessageModel.get(db, fid, UserPrefix.SignerMessage, signerAdd.timestampHash())).rejects.toThrow(
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

  describe('SignerAdd', () => {
    describe('succeeds', () => {
      beforeEach(async () => {
        await expect(set.merge(signerAdd)).resolves.toEqual(undefined);
      });

      test('saves message', async () => {
        await expect(MessageModel.get(db, fid, UserPrefix.SignerMessage, signerAdd.timestampHash())).resolves.toEqual(
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
        await expect(MessageModel.get(db, fid, UserPrefix.SignerMessage, signerAdd.timestampHash())).rejects.toThrow(
          NotFoundError
        );
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(signerAddLater);
        await expect(set.merge(signerAdd)).resolves.toEqual(undefined);
        await expect(set.getSignerAdd(fid, signer, custody1Address)).resolves.toEqual(signerAddLater);
        await expect(MessageModel.get(db, fid, UserPrefix.SignerMessage, signerAdd.timestampHash())).rejects.toThrow(
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
          MessageModel.get(db, fid, UserPrefix.SignerMessage, signerRemoveEarlier.timestampHash())
        ).rejects.toThrow(NotFoundError);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(signerRemove);
        await expect(set.merge(signerAdd)).resolves.toEqual(undefined);
        await expect(set.getSignerRemove(fid, signer, custody1Address)).resolves.toEqual(signerRemove);
        await expect(set.getSignerAdd(fid, signer, custody1Address)).rejects.toThrow(NotFoundError);
        await expect(MessageModel.get(db, fid, UserPrefix.SignerMessage, signerAdd.timestampHash())).rejects.toThrow(
          NotFoundError
        );
      });
    });
  });
});
