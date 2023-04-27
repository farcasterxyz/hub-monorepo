import { Wallet } from 'ethers';
import { EthersEip712Signer } from './ethersEip712Signer';
import { testEip712Signer } from './testUtils';

describe('EthersEip712Signer', () => {
  describe('with ethers Wallet', () => {
    const wallet = Wallet.createRandom();
    const signer = new EthersEip712Signer(wallet);
    testEip712Signer(signer);
  });
});
