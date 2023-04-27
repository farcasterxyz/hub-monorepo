import { Wallet } from 'ethers5';
import { EthersV5Eip712Signer } from './ethersV5Eip712Signer';
import { testEip712Signer } from './testUtils';

describe('EthersV5Eip712Signer', () => {
  describe('with ethers Wallet', () => {
    const wallet = Wallet.createRandom();
    const signer = new EthersV5Eip712Signer(wallet);
    testEip712Signer(signer);
  });
});
