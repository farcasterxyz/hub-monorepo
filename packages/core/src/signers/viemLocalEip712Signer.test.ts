import { ViemLocalEip712Signer } from './viemLocalEip712Signer';
import { Wallet } from 'ethers5';
import { ethersWalletToAccount } from 'viem/ethers';
import { mnemonicToAccount, privateKeyToAccount } from 'viem/accounts';
import { Hex } from 'viem/dist/types/types';
import { testEip712Signer } from './testUtils';

describe('ViemLocalEip712Signer', () => {
  describe('with ethers account', () => {
    const ethersAccount = ethersWalletToAccount(Wallet.createRandom());
    const signer = new ViemLocalEip712Signer(ethersAccount);
    testEip712Signer(signer);
  });

  describe('with private key account', () => {
    const privateKeyAccount = privateKeyToAccount(Wallet.createRandom().privateKey as Hex);
    const signer = new ViemLocalEip712Signer(privateKeyAccount);
    testEip712Signer(signer);
  });

  describe('with mnemonic account', () => {
    const mnemonicAccount = mnemonicToAccount(Wallet.createRandom().mnemonic.phrase);
    const signer = new ViemLocalEip712Signer(mnemonicAccount);
    testEip712Signer(signer);
  });
});
