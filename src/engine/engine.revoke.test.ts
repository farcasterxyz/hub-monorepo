import Faker from 'faker';
import DB from '~/db';
import Engine from '~/engine';
import { Factories } from '~/factories';
import {
  CastShort,
  IDRegistryEvent,
  Ed25519Signer,
  EthereumSigner,
  SignerAdd,
  VerificationEthereumAddress,
  ReactionAdd,
  FollowAdd,
} from '~/types';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils';

const testDb = new DB(`engine.revoke.test`);
const engine = new Engine(testDb);

beforeAll(async () => {
  await testDb.open();
});

afterEach(async () => {
  await engine._reset();
});

afterAll(async () => {
  await testDb.close();
});

const aliceFid = Faker.datatype.number();

const aliceCustodyAddress = () => engine._getCustodyAddress(aliceFid);
const aliceSigners = () => engine._getSigners(aliceFid);
const aliceCasts = () => engine._getCastAdds(aliceFid);
const aliceReactions = () => engine._getReactionAdds(aliceFid);
const aliceVerifications = () => engine._getVerificationEthereumAddressAdds(aliceFid);
const aliceFollows = () => engine._getFollowAdds(aliceFid);

let aliceCustody: EthereumSigner;
let aliceCustodyRegister: IDRegistryEvent;
let aliceSigner: Ed25519Signer;
let aliceSignerAdd: SignerAdd;
let aliceCast: CastShort;
let aliceReaction: ReactionAdd;
let aliceVerification: VerificationEthereumAddress;
let aliceFollow: FollowAdd;

beforeAll(async () => {
  aliceCustody = await generateEthereumSigner();
  aliceCustodyRegister = await Factories.IDRegistryEvent.create({
    args: { to: aliceCustody.signerKey, id: aliceFid },
    name: 'Register',
  });
  aliceSigner = await generateEd25519Signer();
  aliceSignerAdd = await Factories.SignerAdd.create(
    { data: { fid: aliceFid } },
    { transient: { signer: aliceCustody, delegateSigner: aliceSigner } }
  );
  aliceCast = await Factories.CastShort.create({ data: { fid: aliceFid } }, { transient: { signer: aliceSigner } });
  aliceReaction = await Factories.ReactionAdd.create(
    { data: { fid: aliceFid } },
    { transient: { signer: aliceSigner } }
  );
  aliceVerification = await Factories.VerificationEthereumAddress.create(
    { data: { fid: aliceFid } },
    { transient: { signer: aliceSigner } }
  );
  aliceFollow = await Factories.FollowAdd.create({ data: { fid: aliceFid } }, { transient: { signer: aliceSigner } });
});

describe('revokeSigner', () => {
  describe('with messages signed by delegate', () => {
    beforeEach(async () => {
      await engine.mergeIDRegistryEvent(aliceCustodyRegister);
      await engine.mergeMessage(aliceSignerAdd);
      await engine.mergeMessage(aliceCast);
      await engine.mergeMessage(aliceReaction);
      await engine.mergeMessage(aliceVerification);
      await engine.mergeMessage(aliceFollow);
      expect(aliceCustodyAddress()).toEqual(aliceCustody.signerKey);
      expect(aliceSigners()).toEqual(new Set([aliceSigner.signerKey]));
      expect(await aliceCasts()).toEqual(new Set([aliceCast]));
      expect(aliceReactions()).toEqual(new Set([aliceReaction]));
      expect(aliceVerifications()).toEqual(new Set([aliceVerification]));
      expect(aliceFollows()).toEqual(new Set([aliceFollow]));
    });

    test('drops all signed messages when the delegate is removed', async () => {
      const res = await engine._revokeSigner(aliceFid, aliceSigner.signerKey);
      expect(res.isOk()).toBeTruthy();
      expect(await aliceCasts()).toEqual(new Set());
      expect(aliceReactions()).toEqual(new Set());
      expect(aliceVerifications()).toEqual(new Set());
      expect(aliceFollows()).toEqual(new Set());
    });
  });
});
