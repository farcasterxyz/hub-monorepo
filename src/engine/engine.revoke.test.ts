import Faker from 'faker';
import Engine from '~/engine';
import { Factories } from '~/factories';
import {
  CastShort,
  IDRegistryEvent,
  CustodyRemoveAll,
  Ed25519Signer,
  EthereumSigner,
  Reaction,
  SignerAdd,
  SignerRemove,
  VerificationAdd,
  Follow,
} from '~/types';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils';

const engine = new Engine();
const aliceFid = Faker.datatype.number();

const aliceAllSigners = () => engine._getAllSigners(aliceFid);
const aliceCasts = () => engine._getCastAdds(aliceFid);
const aliceReactions = () => engine._getActiveReactions(aliceFid);
const aliceVerifications = () => engine._getVerificationAdds(aliceFid);
const aliceFollows = () => engine._getActiveFollows(aliceFid);

let aliceCustody: EthereumSigner;
let aliceCustodyRegister: IDRegistryEvent;
let aliceCustodyRemove: CustodyRemoveAll;
let aliceCustody2: EthereumSigner;
let aliceCustody2Transfer: IDRegistryEvent;
let aliceCustody2Remove: CustodyRemoveAll;
let aliceSigner: Ed25519Signer;
let aliceSignerAdd: SignerAdd;
let aliceSignerAdd2: SignerAdd;
let aliceSignerRemove: SignerRemove;
let aliceCast: CastShort;
let aliceReaction: Reaction;
let aliceVerification: VerificationAdd;
let aliceFollow: Follow;

beforeAll(async () => {
  aliceCustody = await generateEthereumSigner();
  aliceCustodyRegister = await Factories.IDRegistryEvent.create({
    args: { to: aliceCustody.signerKey },
    name: 'Register',
  });
  aliceCustodyRemove = await Factories.CustodyRemoveAll.create(
    { data: { fid: aliceFid } },
    { transient: { signer: aliceCustody } }
  );
  aliceCustody2 = await generateEthereumSigner();
  aliceCustody2Transfer = await Factories.IDRegistryEvent.create({
    args: { to: aliceCustody2.signerKey },
    blockNumber: aliceCustodyRegister.blockNumber + 1,
    name: 'Transfer',
  });
  aliceCustody2Remove = await Factories.CustodyRemoveAll.create(
    { data: { fid: aliceFid } },
    { transient: { signer: aliceCustody2 } }
  );
  aliceSigner = await generateEd25519Signer();
  aliceSignerAdd = await Factories.SignerAdd.create(
    { data: { fid: aliceFid } },
    { transient: { signer: aliceCustody, delegateSigner: aliceSigner } }
  );
  aliceSignerAdd2 = await Factories.SignerAdd.create(
    { data: { fid: aliceFid } },
    { transient: { signer: aliceCustody2, delegateSigner: aliceSigner } }
  );
  aliceSignerRemove = await Factories.SignerRemove.create(
    {
      data: { fid: aliceFid, body: { delegate: aliceSigner.signerKey } },
    },
    { transient: { signer: aliceCustody } }
  );
  aliceCast = await Factories.Cast.create({ data: { fid: aliceFid } }, { transient: { signer: aliceSigner } });
  aliceReaction = await Factories.Reaction.create({ data: { fid: aliceFid } }, { transient: { signer: aliceSigner } });
  aliceVerification = await Factories.VerificationAdd.create(
    { data: { fid: aliceFid } },
    { transient: { signer: aliceSigner } }
  );
  aliceFollow = await Factories.Follow.create({ data: { fid: aliceFid } }, { transient: { signer: aliceSigner } });
});

describe('revokeSignerMessages', () => {
  beforeEach(() => {
    engine._reset();
  });

  describe('with messages signed by delegate', () => {
    beforeEach(async () => {
      await engine.mergeIDRegistryEvent(aliceFid, aliceCustodyRegister);
      await engine.mergeSignerMessage(aliceSignerAdd);
      await engine.mergeCast(aliceCast);
      await engine.mergeReaction(aliceReaction);
      await engine.mergeVerification(aliceVerification);
      await engine.mergeFollow(aliceFollow);
      expect(aliceAllSigners()).toEqual(new Set([aliceCustody.signerKey, aliceSigner.signerKey]));
      expect(aliceCasts()).toEqual([aliceCast]);
      expect(aliceReactions()).toEqual([aliceReaction]);
      expect(aliceVerifications()).toEqual([aliceVerification]);
      expect(aliceFollows()).toEqual(new Set([aliceFollow]));
    });

    test('drops all signed messages when the delegate is removed', async () => {
      const res = await engine.mergeSignerMessage(aliceSignerRemove);
      expect(res.isOk()).toBe(true);
      expect(aliceAllSigners()).toEqual(new Set([aliceCustody.signerKey]));
      expect(aliceCasts()).toEqual([]);
      expect(aliceReactions()).toEqual([]);
      expect(aliceVerifications()).toEqual([]);
      expect(aliceFollows()).toEqual(new Set());
    });

    test('drops all signed messages when custody address is removed', async () => {
      await engine.mergeIDRegistryEvent(aliceFid, aliceCustody2Transfer);
      const res = await engine.mergeSignerMessage(aliceCustody2Remove);
      expect(res.isOk()).toBe(true);
      expect(aliceAllSigners()).toEqual(new Set([aliceCustody2.signerKey]));
      expect(aliceCasts()).toEqual([]);
      expect(aliceReactions()).toEqual([]);
      expect(aliceVerifications()).toEqual([]);
      expect(aliceFollows()).toEqual(new Set());
    });

    test('does not drop signed messages when there are no earlier custody addresses', async () => {
      const res = await engine.mergeSignerMessage(aliceCustodyRemove);
      expect(res.isOk()).toBe(true);
      expect(aliceAllSigners()).toEqual(new Set([aliceCustody.signerKey, aliceSigner.signerKey]));
      expect(aliceCasts()).toEqual([aliceCast]);
      expect(aliceReactions()).toEqual([aliceReaction]);
      expect(aliceVerifications()).toEqual([aliceVerification]);
      expect(aliceFollows()).toEqual(new Set([aliceFollow]));
    });

    test('does not drop signed messages when signer is added by a new custody address', async () => {
      await engine.mergeIDRegistryEvent(aliceFid, aliceCustody2Transfer);
      await engine.mergeSignerMessage(aliceSignerAdd2);
      const res = await engine.mergeSignerMessage(aliceCustody2Remove);
      expect(res.isOk()).toBe(true);
      expect(aliceAllSigners()).toEqual(new Set([aliceCustody2.signerKey, aliceSigner.signerKey]));
      expect(aliceCasts()).toEqual([aliceCast]);
      expect(aliceReactions()).toEqual([aliceReaction]);
      expect(aliceVerifications()).toEqual([aliceVerification]);
      expect(aliceFollows()).toEqual(new Set([aliceFollow]));
    });
  });
});
