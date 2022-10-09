import Client from '~/test/client';
import { Factories } from '~/test/factories';
import { CastShort, Ed25519Signer, FarcasterNetwork } from '~/types';
import {
  isCastRecast,
  isCastRemove,
  isCastShort,
  isFollowAdd,
  isFollowRemove,
  isReaction,
  isReactionAdd,
  isVerificationEthereumAddress,
  isVerificationRemove,
} from '~/types/typeguards';
import Faker from 'faker';
import { generateEd25519Signer } from '~/utils';
import { ethers } from 'ethers';

const fid = Faker.datatype.number();
const network = FarcasterNetwork.Devnet;

let delegateSigner: Ed25519Signer;
let wallet: ethers.Wallet;
let client: Client;
let castShort: CastShort;

beforeAll(async () => {
  delegateSigner = await generateEd25519Signer();
  wallet = ethers.Wallet.createRandom();
  castShort = await Factories.CastShort.create({ data: { fid } }, { transient: { signer: delegateSigner } });
});

describe('when signer is a delegate signer', () => {
  beforeAll(() => {
    client = new Client(fid, delegateSigner, network);
  });

  describe('makeCastShort', () => {
    test('succeeds', async () => {
      const message = await client.makeCastShort('foo');
      expect(isCastShort(message)).toBe(true);
    });
  });

  describe('makeCastRecast', () => {
    test('succeeds', async () => {
      const message = await client.makeCastRecast(castShort);
      expect(isCastRecast(message)).toBe(true);
    });
  });

  describe('makeCastRemove', () => {
    test('succeeds', async () => {
      const message = await client.makeCastRemove(castShort);
      expect(isCastRemove(message)).toBe(true);
    });
  });

  describe('makeReactionAdd', () => {
    test('succeeds', async () => {
      const message = await client.makeReactionAdd(castShort);
      expect(isReactionAdd(message)).toBe(true);
    });
  });

  describe('makeReactionRemove', () => {
    test('succeeds', async () => {
      const message = await client.makeReactionRemove(castShort);
      expect(isReaction(message)).toBe(true);
    });
  });

  describe('makeVerificationEthereumAddress', () => {
    test('succeeds', async () => {
      const claimHash = await client.makeVerificationClaimHash(wallet.address);
      const externalSignature = await wallet.signMessage(claimHash);
      const blockHash = Faker.datatype.hexaDecimal(64).toLowerCase();
      const message = await client.makeVerificationEthereumAddress(
        wallet.address,
        claimHash,
        blockHash,
        externalSignature
      );
      expect(isVerificationEthereumAddress(message)).toBe(true);
    });
  });

  describe('makeVerificationRemove', () => {
    test('succeeds', async () => {
      const claimHash = await client.makeVerificationClaimHash(wallet.address);
      const message = await client.makeVerificationRemove(claimHash);
      expect(isVerificationRemove(message)).toBe(true);
    });
  });

  describe('makeFollowAdd', () => {
    test('succeeds', async () => {
      const targetUser = Faker.internet.url();
      const message = await client.makeFollowAdd(targetUser);
      expect(isFollowAdd(message)).toBe(true);
    });
  });

  describe('makeFollowRemove', () => {
    test('succeeds', async () => {
      const targetUser = Faker.internet.url();
      const message = await client.makeFollowRemove(targetUser);
      expect(isFollowRemove(message)).toBe(true);
    });
  });
});
