import { hexToBytes } from 'ethereum-cryptography/utils';
import Client from '~/client';
import { Factories } from '~/factories';
import * as ed from '@noble/ed25519';
import { CastShort, Ed25519Signer, EthereumSigner } from '~/types';
import {
  isCastRemove,
  isCastShort,
  isReaction,
  isSignerAdd,
  isSignerRemove,
  isVerificationAdd,
  isVerificationRemove,
} from '~/types/typeguards';
import { convertToHex, generateEd25519Signer, generateEthereumSigner } from '~/utils';
import { ethers } from 'ethers';

const username = 'alice';
let custodySigner: EthereumSigner;
let delegateSigner: Ed25519Signer;
let wallet: ethers.Wallet;
let client: Client;
let castShort: CastShort;

beforeAll(async () => {
  custodySigner = await generateEthereumSigner();
  delegateSigner = await generateEd25519Signer();
  wallet = ethers.Wallet.createRandom();
  castShort = await Factories.Cast.create({ data: { username } }, { transient: { signer: delegateSigner } });
});

describe('when signer is a custody address', () => {
  beforeAll(() => {
    client = new Client(username, custodySigner);
  });

  describe('makeSignerAdd', () => {
    test('succeeds', async () => {
      const edgeHash = await client.makeSignerEdgeHash(custodySigner.signerKey, delegateSigner.signerKey);
      const delegateSignature = await convertToHex(await ed.sign(hexToBytes(edgeHash), delegateSigner.privateKey));
      const message = await client.makeSignerAdd(delegateSigner.signerKey, edgeHash, delegateSignature);
      expect(isSignerAdd(message)).toBe(true);
    });
  });

  describe('makeSignerRemove', () => {
    test('succeeds', async () => {
      const message = await client.makeSignerRemove(delegateSigner.signerKey);
      expect(isSignerRemove(message)).toBe(true);
    });
  });
});

describe('when signer is a delegate signer', () => {
  beforeAll(() => {
    client = new Client(username, delegateSigner);
  });

  describe('makeCastShort', () => {
    test('succeeds', async () => {
      const message = await client.makeCastShort('foo');
      expect(isCastShort(message)).toBe(true);
    });
  });

  describe('makeCastRemove', () => {
    test('succeeds', async () => {
      const message = await client.makeCastRemove(castShort);
      expect(isCastRemove(message)).toBe(true);
    });
  });

  describe('makeReaction', () => {
    test('succeeds', async () => {
      const message = await client.makeReaction(castShort);
      expect(isReaction(message)).toBe(true);
    });
  });

  describe('makeVerificationAdd', () => {
    test('succeeds', async () => {
      const claimHash = await client.makeVerificationClaimHash(wallet.address);
      const externalSignature = await wallet.signMessage(claimHash);
      const message = await client.makeVerificationAdd(wallet.address, claimHash, externalSignature);
      expect(isVerificationAdd(message)).toBe(true);
    });
  });

  describe('makeVerificationRemove', () => {
    test('succeeds', async () => {
      const claimHash = await client.makeVerificationClaimHash(wallet.address);
      const message = await client.makeVerificationRemove(claimHash);
      expect(isVerificationRemove(message)).toBe(true);
    });
  });
});
