import Faker from 'faker';
import CastDB from '~/db/cast';
import { jestRocksDB } from '~/db/jestUtils';
import SignerDB from '~/db/signer';
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
  CastRecast,
} from '~/types';
import { generateEd25519Signer, generateEthereumSigner } from '~/utils';

const testDb = jestRocksDB(`engine.revoke.test`);
const engine = new Engine(testDb);

const aliceFid = Faker.datatype.number();

const signerDb = new SignerDB(testDb);
const aliceCustodyAddress = async (): Promise<string> => {
  const event = await signerDb.getCustodyEvent(aliceFid);
  return event.args.to;
};
const aliceSigners = async (): Promise<Set<SignerAdd>> => {
  const address = await aliceCustodyAddress();
  const signerAdds = await signerDb.getSignerAddsByUser(aliceFid, address);
  return new Set(signerAdds);
};

const castDb = new CastDB(testDb);
const aliceCasts = async (): Promise<Set<CastShort | CastRecast>> => {
  const casts = await castDb.getCastAddsByUser(aliceFid);
  return new Set(casts);
};

const aliceReactions = () => engine.getAllReactionsByUser(aliceFid);
const aliceVerifications = () => engine.getAllVerificationsByUser(aliceFid);
const aliceFollows = () => engine.getAllFollowsByUser(aliceFid);

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
      await expect(aliceCustodyAddress()).resolves.toEqual(aliceCustody.signerKey);
      await expect(aliceSigners()).resolves.toEqual(new Set([aliceSignerAdd]));
      await expect(aliceCasts()).resolves.toEqual(new Set([aliceCast]));
      await expect(aliceReactions()).resolves.toEqual(new Set([aliceReaction]));
      await expect(aliceVerifications()).resolves.toEqual(new Set([aliceVerification]));
      await expect(aliceFollows()).resolves.toEqual(new Set([aliceFollow]));
    });

    test('drops all signed messages when signer is revoked', async () => {
      const res = await engine._revokeSigner(aliceFid, aliceSigner.signerKey);
      expect(res.isOk()).toBeTruthy();
      await expect(aliceCasts()).resolves.toEqual(new Set());
      await expect(aliceReactions()).resolves.toEqual(new Set());
      await expect(aliceVerifications()).resolves.toEqual(new Set());
      await expect(aliceFollows()).resolves.toEqual(new Set());
    });
  });
});
