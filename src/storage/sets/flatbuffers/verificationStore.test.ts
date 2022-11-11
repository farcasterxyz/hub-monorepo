import Factories from '~/test/factories/flatbuffer';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { NotFoundError } from '~/utils/errors';
import { UserPostfix, VerificationAddEthAddressModel, VerificationRemoveModel } from '~/storage/flatbuffers/types';
import VerificationStore from '~/storage/sets/flatbuffers/verificationStore';
import { EthereumSigner } from '~/types';
import { generateEthereumSigner } from '~/utils/crypto';
import { FarcasterNetwork } from '~/utils/generated/message_generated';
import { arrayify } from 'ethers/lib/utils';
import { bytesDecrement, bytesIncrement } from '~/storage/flatbuffers/utils';
import { HubError } from '~/utils/hubErrors';

const db = jestBinaryRocksDB('flatbuffers.verificationStore.test');
const set = new VerificationStore(db);
const fid = Factories.FID.build();

let ethSigner: EthereumSigner;
let address: Uint8Array;
let verificationAdd: VerificationAddEthAddressModel;
let verificationRemove: VerificationRemoveModel;

beforeAll(async () => {
  ethSigner = await generateEthereumSigner();
  address = arrayify(ethSigner.signerKey);

  const addBody = await Factories.VerificationAddEthAddressBody.create(
    {},
    { transient: { fid, wallet: ethSigner.wallet, network: FarcasterNetwork.Testnet } }
  );
  const addData = await Factories.VerificationAddEthAddressData.create({
    fid: Array.from(fid),
    body: addBody.unpack(),
  });
  const addMessage = await Factories.Message.create({ data: Array.from(addData.bb?.bytes() ?? []) });
  verificationAdd = new MessageModel(addMessage) as VerificationAddEthAddressModel;

  const removeData = await Factories.VerificationRemoveData.create({
    fid: Array.from(fid),
    body: Factories.VerificationRemoveBody.build({ address: Array.from(addBody.addressArray() || new Uint8Array()) }),
    timestamp: addData.timestamp() + 1,
  });
  const removeMessage = await Factories.Message.create({ data: Array.from(removeData.bb?.bytes() ?? []) });
  verificationRemove = new MessageModel(removeMessage) as VerificationRemoveModel;
});

describe('getVerificationAdd', () => {
  test('fails if missing', async () => {
    await expect(set.getVerificationAdd(fid, address)).rejects.toThrow(NotFoundError);
  });

  test('returns message', async () => {
    await set.merge(verificationAdd);
    await expect(set.getVerificationAdd(fid, address)).resolves.toEqual(verificationAdd);
  });
});

describe('getVerificationRemove', () => {
  test('fails if missing', async () => {
    await expect(set.getVerificationRemove(fid, address)).rejects.toThrow(NotFoundError);
  });

  test('returns message', async () => {
    await set.merge(verificationRemove);
    await expect(set.getVerificationRemove(fid, address)).resolves.toEqual(verificationRemove);
  });
});

describe('getVerificationAddsByUser', () => {
  test('returns verification adds for an fid', async () => {
    await set.merge(verificationAdd);
    await expect(set.getVerificationAddsByUser(fid)).resolves.toEqual([verificationAdd]);
  });

  test('returns empty array without messages', async () => {
    await expect(set.getVerificationAddsByUser(fid)).resolves.toEqual([]);
  });
});

describe('getVerificationRemovesByUser', () => {
  test('returns verification removes for an fid', async () => {
    await set.merge(verificationRemove);
    await expect(set.getVerificationRemovesByUser(fid)).resolves.toEqual([verificationRemove]);
  });

  test('returns empty array without messages', async () => {
    await expect(set.getVerificationRemovesByUser(fid)).resolves.toEqual([]);
  });
});

describe('merge', () => {
  const assertVerificationExists = async (message: VerificationAddEthAddressModel | VerificationRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.VerificationMessage, message.tsHash())).resolves.toEqual(
      message
    );
  };

  const assertVerificationDoesNotExist = async (message: VerificationAddEthAddressModel | VerificationRemoveModel) => {
    await expect(MessageModel.get(db, fid, UserPostfix.VerificationMessage, message.tsHash())).rejects.toThrow(
      NotFoundError
    );
  };

  const assertVerificationAddWins = async (message: VerificationAddEthAddressModel) => {
    await assertVerificationExists(message);
    await expect(set.getVerificationAdd(fid, address)).resolves.toEqual(message);
    await expect(set.getVerificationRemove(fid, address)).rejects.toThrow(NotFoundError);
  };

  const assertVerificationRemoveWins = async (message: VerificationRemoveModel) => {
    await assertVerificationExists(message);
    await expect(set.getVerificationRemove(fid, address)).resolves.toEqual(message);
    await expect(set.getVerificationAdd(fid, address)).rejects.toThrow(NotFoundError);
  };

  test('fails with invalid message type', async () => {
    const invalidData = await Factories.ReactionAddData.create({ fid: Array.from(fid) });
    const message = await Factories.Message.create({ data: Array.from(invalidData.bb?.bytes() ?? []) });
    await expect(set.merge(new MessageModel(message))).rejects.toThrow(HubError);
  });

  describe('VerificationAddEthAddress', () => {
    test('succeeds', async () => {
      await expect(set.merge(verificationAdd)).resolves.toEqual(undefined);
      await assertVerificationAddWins(verificationAdd);
    });

    test('succeeds once, even if merged twice', async () => {
      await expect(set.merge(verificationAdd)).resolves.toEqual(undefined);
      await expect(set.merge(verificationAdd)).resolves.toEqual(undefined);
      await assertVerificationAddWins(verificationAdd);
    });

    describe('with a conflicting VerificationAddEthAddress with different timestamps', () => {
      let verificationAddLater: VerificationAddEthAddressModel;

      beforeAll(async () => {
        const addData = await Factories.VerificationAddEthAddressData.create({
          ...verificationAdd.data.unpack(),
          timestamp: verificationAdd.timestamp() + 1,
        });
        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
        });
        verificationAddLater = new MessageModel(addMessage) as VerificationAddEthAddressModel;
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(verificationAdd);
        await expect(set.merge(verificationAddLater)).resolves.toEqual(undefined);
        await assertVerificationDoesNotExist(verificationAdd);
        await assertVerificationAddWins(verificationAddLater);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(verificationAddLater);
        await expect(set.merge(verificationAdd)).resolves.toEqual(undefined);
        await assertVerificationDoesNotExist(verificationAdd);
        await assertVerificationAddWins(verificationAddLater);
      });
    });

    describe('with a conflicting VerificationAddEthAddress with identical timestamps', () => {
      let verificationAddLater: VerificationAddEthAddressModel;

      beforeAll(async () => {
        const addData = await Factories.VerificationAddEthAddressData.create({
          ...verificationAdd.data.unpack(),
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(verificationAdd.hash().slice())),
        });

        verificationAddLater = new MessageModel(addMessage) as VerificationAddEthAddressModel;
      });

      test('succeeds with a later hash', async () => {
        await set.merge(verificationAdd);
        await expect(set.merge(verificationAddLater)).resolves.toEqual(undefined);
        await assertVerificationDoesNotExist(verificationAdd);
        await assertVerificationAddWins(verificationAddLater);
      });

      test('no-ops with an earlier hash', async () => {
        await set.merge(verificationAddLater);
        await expect(set.merge(verificationAdd)).resolves.toEqual(undefined);
        await assertVerificationDoesNotExist(verificationAdd);
        await assertVerificationAddWins(verificationAddLater);
      });
    });

    describe('with conflicting VerificationRemove with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        const removeData = await Factories.VerificationRemoveData.create({
          ...verificationRemove.data.unpack(),
          timestamp: verificationAdd.timestamp() - 1,
        });

        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
        });

        const verificationRemoveEarlier = new MessageModel(removeMessage) as VerificationRemoveModel;
        await set.merge(verificationRemoveEarlier);
        await expect(set.merge(verificationAdd)).resolves.toEqual(undefined);
        await assertVerificationAddWins(verificationAdd);
        await assertVerificationDoesNotExist(verificationRemoveEarlier);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(verificationRemove);
        await expect(set.merge(verificationAdd)).resolves.toEqual(undefined);
        await assertVerificationRemoveWins(verificationRemove);
        await assertVerificationDoesNotExist(verificationAdd);
      });
    });

    describe('with conflicting VerificationRemove with identical timestamps', () => {
      test('no-ops if remove has a later hash', async () => {
        const removeData = await Factories.VerificationRemoveData.create({
          ...verificationRemove.data.unpack(),
          timestamp: verificationAdd.timestamp(),
        });

        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(verificationAdd.hash().slice())),
        });

        const verificationRemoveLater = new MessageModel(removeMessage) as VerificationRemoveModel;
        await set.merge(verificationRemoveLater);
        await expect(set.merge(verificationAdd)).resolves.toEqual(undefined);
        await assertVerificationRemoveWins(verificationRemoveLater);
        await assertVerificationDoesNotExist(verificationAdd);
      });

      test('no-ops if remove has an earlier hash', async () => {
        const removeData = await Factories.VerificationRemoveData.create({
          ...verificationRemove.data.unpack(),
          timestamp: verificationAdd.timestamp(),
        });

        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
          hash: Array.from(bytesDecrement(verificationAdd.hash().slice())),
        });

        const verificationRemoveEarlier = new MessageModel(removeMessage) as VerificationRemoveModel;
        await set.merge(verificationRemoveEarlier);
        await expect(set.merge(verificationAdd)).resolves.toEqual(undefined);
        await assertVerificationRemoveWins(verificationRemoveEarlier);
        await assertVerificationDoesNotExist(verificationAdd);
      });
    });
  });

  describe('VerificationRemove', () => {
    test('succeeds', async () => {
      await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
      await assertVerificationRemoveWins(verificationRemove);
    });

    test('succeeds once, even if merged twice', async () => {
      await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
      await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
      await assertVerificationRemoveWins(verificationRemove);
    });

    describe('with a conflicting VerificationRemove with different timestamps', () => {
      let verificationRemoveLater: VerificationRemoveModel;

      beforeAll(async () => {
        const removeData = await Factories.VerificationRemoveData.create({
          ...verificationRemove.data.unpack(),
          timestamp: verificationRemove.timestamp() + 1,
        });
        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
        });
        verificationRemoveLater = new MessageModel(removeMessage) as VerificationRemoveModel;
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(verificationRemove);
        await expect(set.merge(verificationRemoveLater)).resolves.toEqual(undefined);
        await assertVerificationDoesNotExist(verificationRemove);
        await assertVerificationRemoveWins(verificationRemoveLater);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(verificationRemoveLater);
        await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
        await assertVerificationDoesNotExist(verificationRemove);
        await assertVerificationRemoveWins(verificationRemoveLater);
      });
    });

    describe('with a conflicting VerificationRemove with identical timestamps', () => {
      let verificationRemoveLater: VerificationRemoveModel;

      beforeAll(async () => {
        const removeData = await Factories.VerificationRemoveData.create({
          ...verificationRemove.data.unpack(),
        });
        const removeMessage = await Factories.Message.create({
          data: Array.from(removeData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(verificationRemove.hash().slice())),
        });
        verificationRemoveLater = new MessageModel(removeMessage) as VerificationRemoveModel;
      });

      test('succeeds with a later hash', async () => {
        await set.merge(verificationRemove);
        await expect(set.merge(verificationRemoveLater)).resolves.toEqual(undefined);
        await assertVerificationDoesNotExist(verificationRemove);
        await assertVerificationRemoveWins(verificationRemoveLater);
      });

      test('no-ops with an earlier hash', async () => {
        await set.merge(verificationRemoveLater);
        await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
        await assertVerificationDoesNotExist(verificationRemove);
        await assertVerificationRemoveWins(verificationRemoveLater);
      });
    });

    describe('with conflicting VerificationAddEthAddress with different timestamps', () => {
      test('succeeds with a later timestamp', async () => {
        await set.merge(verificationAdd);
        await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
        await assertVerificationRemoveWins(verificationRemove);
        await assertVerificationDoesNotExist(verificationAdd);
      });

      test('no-ops with an earlier timestamp', async () => {
        const addData = await Factories.VerificationAddEthAddressData.create({
          ...verificationAdd.data.unpack(),
          timestamp: verificationRemove.timestamp() + 1,
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
        });

        const verificationAddLater = new MessageModel(addMessage) as VerificationAddEthAddressModel;
        await set.merge(verificationAddLater);
        await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
        await assertVerificationAddWins(verificationAddLater);
        await assertVerificationDoesNotExist(verificationRemove);
      });
    });

    describe('with conflicting VerificationAddEthAddress with identical timestamps', () => {
      test('succeeds with an earlier hash', async () => {
        const addData = await Factories.VerificationAddEthAddressData.create({
          ...verificationAdd.data.unpack(),
          timestamp: verificationRemove.timestamp(),
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
          hash: Array.from(bytesIncrement(verificationRemove.hash().slice())),
        });
        const verificationAddLater = new MessageModel(addMessage) as VerificationAddEthAddressModel;

        await set.merge(verificationAddLater);
        await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
        await assertVerificationDoesNotExist(verificationAddLater);
        await assertVerificationRemoveWins(verificationRemove);
      });

      test('succeeds with a later hash', async () => {
        const addData = await Factories.VerificationAddEthAddressData.create({
          ...verificationAdd.data.unpack(),
          timestamp: verificationRemove.timestamp(),
        });

        const addMessage = await Factories.Message.create({
          data: Array.from(addData.bb?.bytes() ?? []),
          hash: Array.from(bytesDecrement(verificationRemove.hash().slice())),
        });

        const verificationRemoveEarlier = new MessageModel(addMessage) as VerificationRemoveModel;
        await set.merge(verificationRemoveEarlier);
        await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
        await assertVerificationDoesNotExist(verificationRemoveEarlier);
        await assertVerificationRemoveWins(verificationRemove);
      });
    });
  });
});
