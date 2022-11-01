import Factories from '~/test/factories/flatbuffer';
import { jestBinaryRocksDB } from '~/storage/db/jestUtils';
import MessageModel from '~/storage/flatbuffers/messageModel';
import { BadRequestError, NotFoundError } from '~/utils/errors';
import { UserPrefix, VerificationAddEthAddressModel, VerificationRemoveModel } from '~/storage/flatbuffers/types';
import VerificationSet from '~/storage/sets/flatbuffers/verificationSet';
import { EthereumSigner } from '~/types';
import { generateEthereumSigner } from '~/utils/crypto';
import { FarcasterNetwork } from '~/utils/generated/message_generated';
import { arrayify } from 'ethers/lib/utils';

const db = jestBinaryRocksDB('flatbuffers.verificationSet.test');
const set = new VerificationSet(db);
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
  test('fails with invalid message type', async () => {
    const invalidData = await Factories.ReactionAddData.create({ fid: Array.from(fid) });
    const message = await Factories.Message.create({ data: Array.from(invalidData.bb?.bytes() ?? []) });
    await expect(set.merge(new MessageModel(message))).rejects.toThrow(BadRequestError);
  });

  describe('VerificationRemove', () => {
    describe('succeeds', () => {
      beforeEach(async () => {
        await set.merge(verificationAdd);
        await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
      });

      test('saves message', async () => {
        await expect(
          MessageModel.get(db, fid, UserPrefix.VerificationMessage, verificationRemove.timestampHash())
        ).resolves.toEqual(verificationRemove);
      });

      test('saves verificationRemoves index', async () => {
        await expect(set.getVerificationRemove(fid, address)).resolves.toEqual(verificationRemove);
      });

      test('deletes VerificationAdd* message', async () => {
        await expect(
          MessageModel.get(db, fid, UserPrefix.VerificationMessage, verificationAdd.timestampHash())
        ).rejects.toThrow(NotFoundError);
      });

      test('deletes verificationAdds index', async () => {
        await expect(set.getVerificationAdd(fid, address)).rejects.toThrow(NotFoundError);
      });
    });

    describe('with conflicting VerificationRemove', () => {
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
        await expect(set.getVerificationRemove(fid, address)).resolves.toEqual(verificationRemoveLater);
        await expect(
          MessageModel.get(db, fid, UserPrefix.VerificationMessage, verificationRemove.timestampHash())
        ).rejects.toThrow(NotFoundError);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(verificationRemoveLater);
        await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
        await expect(set.getVerificationRemove(fid, address)).resolves.toEqual(verificationRemoveLater);
        await expect(
          MessageModel.get(db, fid, UserPrefix.VerificationMessage, verificationRemove.timestampHash())
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('with conflicting VerificationAddEthAddress', () => {
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
        await expect(set.getVerificationAdd(fid, address)).resolves.toEqual(verificationAddLater);
        await expect(set.getVerificationRemove(fid, address)).rejects.toThrow(NotFoundError);
        await expect(
          MessageModel.get(db, fid, UserPrefix.VerificationMessage, verificationRemove.timestampHash())
        ).rejects.toThrow(NotFoundError);
      });

      test('succeeds with a later timestamp', async () => {
        await set.merge(verificationAdd);
        await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
        await expect(set.getVerificationRemove(fid, address)).resolves.toEqual(verificationRemove);
        await expect(set.getVerificationAdd(fid, address)).rejects.toThrow(NotFoundError);
        await expect(
          MessageModel.get(db, fid, UserPrefix.VerificationMessage, verificationAdd.timestampHash())
        ).rejects.toThrow(NotFoundError);
      });
    });

    test('succeeds when VerificationAdd* does not exist', async () => {
      await expect(set.merge(verificationRemove)).resolves.toEqual(undefined);
      await expect(set.getVerificationRemove(fid, address)).resolves.toEqual(verificationRemove);
      await expect(set.getVerificationAdd(fid, address)).rejects.toThrow(NotFoundError);
    });
  });

  describe('VerificationAddEthAddress', () => {
    describe('succeeds', () => {
      beforeEach(async () => {
        await expect(set.merge(verificationAdd)).resolves.toEqual(undefined);
      });

      test('saves message', async () => {
        await expect(
          MessageModel.get(db, fid, UserPrefix.VerificationMessage, verificationAdd.timestampHash())
        ).resolves.toEqual(verificationAdd);
      });

      test('saves verificationAdds index', async () => {
        await expect(set.getVerificationAdd(fid, address)).resolves.toEqual(verificationAdd);
      });

      test('no-ops when merged twice', async () => {
        await expect(set.merge(verificationAdd)).resolves.toEqual(undefined);
        await expect(set.getVerificationAdd(fid, address)).resolves.toEqual(verificationAdd);
      });
    });

    describe('with conflicting VerificationAdd', () => {
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
        await expect(set.getVerificationAdd(fid, address)).resolves.toEqual(verificationAddLater);
        await expect(
          MessageModel.get(db, fid, UserPrefix.VerificationMessage, verificationAdd.timestampHash())
        ).rejects.toThrow(NotFoundError);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(verificationAddLater);
        await expect(set.merge(verificationAdd)).resolves.toEqual(undefined);
        await expect(set.getVerificationAdd(fid, address)).resolves.toEqual(verificationAddLater);
        await expect(
          MessageModel.get(db, fid, UserPrefix.VerificationMessage, verificationAdd.timestampHash())
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('with conflicting VerificationRemove', () => {
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
        await expect(set.getVerificationAdd(fid, address)).resolves.toEqual(verificationAdd);
        await expect(set.getVerificationRemove(fid, address)).rejects.toThrow(NotFoundError);
        await expect(
          MessageModel.get(db, fid, UserPrefix.VerificationMessage, verificationRemoveEarlier.timestampHash())
        ).rejects.toThrow(NotFoundError);
      });

      test('no-ops with an earlier timestamp', async () => {
        await set.merge(verificationRemove);
        await expect(set.merge(verificationAdd)).resolves.toEqual(undefined);
        await expect(set.getVerificationRemove(fid, address)).resolves.toEqual(verificationRemove);
        await expect(set.getVerificationAdd(fid, address)).rejects.toThrow(NotFoundError);
        await expect(
          MessageModel.get(db, fid, UserPrefix.VerificationMessage, verificationAdd.timestampHash())
        ).rejects.toThrow(NotFoundError);
      });
    });
  });
});
