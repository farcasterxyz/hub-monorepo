import Engine from '~/engine';
import { Factories } from '~/factories';
import {
  CastShort,
  CustodyAddEvent,
  CustodyRemoveAll,
  Ed25519Signer,
  EthereumSigner,
  Reaction,
  SignerAdd,
  SignerRemove,
  VerificationAdd,
} from '~/types';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils';

const engine = new Engine();

const aliceAllSigners = () => engine._getAllSigners('alice');
const aliceCasts = () => engine._getCastAdds('alice');
const aliceReactions = () => engine._getActiveReactions('alice');
const aliceVerifications = () => engine._getVerificationAdds('alice');

let aliceCustody: EthereumSigner;
let aliceCustodyAdd: CustodyAddEvent;
let aliceCustodyRemove: CustodyRemoveAll;
let aliceCustody2: EthereumSigner;
let aliceCustody2Add: CustodyAddEvent;
let aliceCustody2Remove: CustodyRemoveAll;
let aliceSigner: Ed25519Signer;
let aliceSignerAdd: SignerAdd;
let aliceSignerAdd2: SignerAdd;
let aliceSignerRemove: SignerRemove;
let aliceCast: CastShort;
let aliceReaction: Reaction;
let aliceVerification: VerificationAdd;

beforeAll(async () => {
  aliceCustody = await generateEthereumSigner();
  aliceCustodyAdd = await Factories.CustodyAddEvent.create({}, { transient: { signer: aliceCustody } });
  aliceCustodyRemove = await Factories.CustodyRemoveAll.create(
    { data: { username: 'alice' } },
    { transient: { signer: aliceCustody } }
  );
  aliceCustody2 = await generateEthereumSigner();
  aliceCustody2Add = await Factories.CustodyAddEvent.create(
    { blockNumber: aliceCustodyAdd.blockNumber + 1 },
    { transient: { signer: aliceCustody2 } }
  );
  aliceCustody2Remove = await Factories.CustodyRemoveAll.create(
    { data: { username: 'alice' } },
    { transient: { signer: aliceCustody2 } }
  );
  aliceSigner = await generateEd25519Signer();
  aliceSignerAdd = await Factories.SignerAdd.create(
    { data: { username: 'alice' } },
    { transient: { signer: aliceCustody, delegateSigner: aliceSigner } }
  );
  aliceSignerAdd2 = await Factories.SignerAdd.create(
    { data: { username: 'alice' } },
    { transient: { signer: aliceCustody2, delegateSigner: aliceSigner } }
  );
  aliceSignerRemove = await Factories.SignerRemove.create(
    {
      data: { username: 'alice', body: { delegate: aliceSigner.signerKey } },
    },
    { transient: { signer: aliceCustody } }
  );
  aliceCast = await Factories.Cast.create({ data: { username: 'alice' } }, { transient: { signer: aliceSigner } });
  aliceReaction = await Factories.Reaction.create(
    { data: { username: 'alice' } },
    { transient: { signer: aliceSigner } }
  );
  aliceVerification = await Factories.VerificationAdd.create(
    { data: { username: 'alice' } },
    { transient: { signer: aliceSigner } }
  );
});

describe('revokeSignerMessages', () => {
  beforeEach(() => {
    engine._reset();
  });

  describe('with messages signed by delegate', () => {
    beforeEach(async () => {
      await engine.mergeCustodyEvent('alice', aliceCustodyAdd);
      await engine.mergeSignerMessage(aliceSignerAdd);
      await engine.mergeCast(aliceCast);
      await engine.mergeReaction(aliceReaction);
      await engine.mergeVerification(aliceVerification);
      expect(aliceAllSigners()).toEqual(new Set([aliceCustody.signerKey, aliceSigner.signerKey]));
      expect(aliceCasts()).toEqual([aliceCast]);
      expect(aliceReactions()).toEqual([aliceReaction]);
      expect(aliceVerifications()).toEqual([aliceVerification]);
    });

    test('drops all signed messages when the delegate is removed', async () => {
      const res = await engine.mergeSignerMessage(aliceSignerRemove);
      expect(res.isOk()).toBe(true);
      expect(aliceAllSigners()).toEqual(new Set([aliceCustody.signerKey]));
      expect(aliceCasts()).toEqual([]);
      expect(aliceReactions()).toEqual([]);
      expect(aliceVerifications()).toEqual([]);
    });

    test('drops all signed messages when custody address is removed', async () => {
      await engine.mergeCustodyEvent('alice', aliceCustody2Add);
      const res = await engine.mergeSignerMessage(aliceCustody2Remove);
      expect(res.isOk()).toBe(true);
      expect(aliceAllSigners()).toEqual(new Set([aliceCustody2.signerKey]));
      expect(aliceCasts()).toEqual([]);
      expect(aliceReactions()).toEqual([]);
      expect(aliceVerifications()).toEqual([]);
    });

    test('does not drop signed messages when there are no earlier custody addresses', async () => {
      const res = await engine.mergeSignerMessage(aliceCustodyRemove);
      expect(res.isOk()).toBe(true);
      expect(aliceAllSigners()).toEqual(new Set([aliceCustody.signerKey, aliceSigner.signerKey]));
      expect(aliceCasts()).toEqual([aliceCast]);
      expect(aliceReactions()).toEqual([aliceReaction]);
      expect(aliceVerifications()).toEqual([aliceVerification]);
    });

    test('does not drop signed messages when signer is added by a new custody address', async () => {
      await engine.mergeCustodyEvent('alice', aliceCustody2Add);
      await engine.mergeSignerMessage(aliceSignerAdd2);
      const res = await engine.mergeSignerMessage(aliceCustody2Remove);
      expect(res.isOk()).toBe(true);
      expect(aliceAllSigners()).toEqual(new Set([aliceCustody2.signerKey, aliceSigner.signerKey]));
      expect(aliceCasts()).toEqual([aliceCast]);
      expect(aliceReactions()).toEqual([aliceReaction]);
      expect(aliceVerifications()).toEqual([aliceVerification]);
    });
  });
});
