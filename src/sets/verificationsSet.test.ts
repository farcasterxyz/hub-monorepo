import { Factories } from '~/factories';
import VerificationsSet from '~/sets/verificationsSet';
import { VerificationAdd, VerificationRemove } from '~/types';

const set = new VerificationsSet();
const adds = () => set._getAdds();
const deletes = () => set._getDeletes();

describe('merge', () => {
  beforeEach(() => {
    set._reset();
  });

  describe('add', () => {
    test('succeeds with a valid VerificationAdd message', async () => {
      const verificationAddMessage = await Factories.VerificationAdd.create();
      expect(set.merge(verificationAddMessage).isOk()).toBe(true);
      expect(adds()).toEqual([verificationAddMessage]);
    });

    test('succeeds with multiple valid VerificationAdd messages', async () => {
      const v1 = await Factories.VerificationAdd.create();
      const v2 = await Factories.VerificationAdd.create();
      expect(set.merge(v1).isOk()).toBe(true);
      expect(set.merge(v2).isOk()).toBe(true);
      expect(adds().length).toEqual(2);
    });

    test('fails if valid VerificationAdd message was already added', async () => {
      const verificationAddMessage = await Factories.VerificationAdd.create();
      expect(set.merge(verificationAddMessage).isOk()).toBe(true);
      expect(set.merge(verificationAddMessage).isOk()).toBe(false);
      expect(adds()).toEqual([verificationAddMessage]);
    });

    test('fails if the add was already deleted', async () => {
      const verificationAddMessage = await Factories.VerificationAdd.create();
      const verificationRemoveMessage = await Factories.VerificationRemove.create({
        data: { body: { verificationAddHash: verificationAddMessage.hash } },
      });
      expect(set.merge(verificationRemoveMessage).isOk()).toBe(true);
      expect(set.merge(verificationAddMessage).isOk()).toBe(false);
      expect(adds()).toEqual([]);
    });

    test('fails with an incorrect message type', async () => {
      const cast = (await Factories.Cast.create()) as unknown as VerificationAdd;
      expect(set.merge(cast).isOk()).toBe(false);
      expect(adds()).toEqual([]);
    });
  });

  describe('remove', () => {
    test('succeeds with a valid VerificationRemove message', async () => {
      const verificationAddMessage = await Factories.VerificationAdd.create();
      const verificationRemoveMessage = await Factories.VerificationRemove.create({
        data: { body: { verificationAddHash: verificationAddMessage.hash } },
      });
      expect(set.merge(verificationAddMessage).isOk()).toBe(true);
      expect(set.merge(verificationRemoveMessage).isOk()).toBe(true);
      expect(set._getAdds()).toEqual([]);
      expect(deletes()).toEqual([verificationRemoveMessage]);
    });

    test("succeeds even if the VerificationAdd message doesn't exist", async () => {
      const verificationRemoveMessage = await Factories.VerificationRemove.create();
      expect(set._getAdds()).toEqual([]);
      expect(set.merge(verificationRemoveMessage).isOk()).toBe(true);
      expect(deletes()).toEqual([verificationRemoveMessage]);
    });

    test('succeeds with multiple valid VerificationRemove messages', async () => {
      expect(set._getAdds()).toEqual([]);
      const remove1 = await Factories.VerificationRemove.create();
      const remove2 = await Factories.VerificationRemove.create();
      expect(set.merge(remove1).isOk()).toBe(true);
      expect(set.merge(remove2).isOk()).toBe(true);
      expect(deletes().length).toEqual(2);
    });

    test('fails if the same VerificationRemove message is added twice', async () => {
      const verificationRemoveMessage = await Factories.VerificationRemove.create();
      expect(set.merge(verificationRemoveMessage).isOk()).toBe(true);
      expect(set.merge(verificationRemoveMessage).isOk()).toBe(false);
      expect(set._getAdds()).toEqual([]);
      expect(deletes()).toEqual([verificationRemoveMessage]);
    });

    test('fails with an incorrect message type', async () => {
      const cast = (await Factories.Cast.create()) as unknown as VerificationRemove;
      expect(set.merge(cast).isOk()).toBe(false);
      expect(deletes()).toEqual([]);
    });
  });
});
