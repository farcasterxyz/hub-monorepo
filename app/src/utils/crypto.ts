import * as ed from '@noble/ed25519';
import { ethers } from 'ethers';
import { KeyPair } from '~/flatbuffers/models/types';
import { bytesToHexString } from '~/flatbuffers/utils/bytes';
import Ed25519Signer from './signer/ed25519Signer';
import EthereumSigner from './signer/ethereumSigner';

export { Ed25519Signer, EthereumSigner };

export const sleep = (ms: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

export const generateEd25519KeyPair = async (): Promise<KeyPair> => {
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKey(privateKey);

  const newKeyPair: KeyPair = {
    privateKey: privateKey,
    publicKey: publicKey,
  };
  return newKeyPair;
};

/**
 * generateEd25519Signer creates a MessageSigner with an Ed25519 private key,
 * public key as signerKey, and Ed25519 signature type.
 *
 * Messages can be signed using ed.sign() and verified using ed.verify()
 */
export const generateEd25519Signer = async (): Promise<Ed25519Signer> => {
  const { privateKey, publicKey } = await generateEd25519KeyPair();
  const signerKeyHex = bytesToHexString(publicKey);
  if (signerKeyHex.isErr()) {
    throw signerKeyHex.error;
  }
  return new Ed25519Signer(privateKey, signerKeyHex.value);
};

/**
 * Creates an EthereumSigner which contains an ethers wallet, lowercased wallet address and
 * signature type. Messages can be signed with wallet.signMessage(), which creates an EIP 191
 * version 0x45 compliant signature, and verified using wallet.verifyMessage().
 */
export const generateEthereumSigner = async (): Promise<EthereumSigner> => {
  const wallet = new ethers.Wallet(ethers.utils.randomBytes(32));
  return new EthereumSigner(wallet);
};
