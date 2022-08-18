import { constants, Contract, providers, Wallet } from 'ethers';
import { IDRegistry } from '~/provider/abis';
import Provider from '~/provider';

const privateKey = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';
const bobPrivateKey = '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6';

const networkUrl = 'http://localhost:8545';
const idRegistryAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

const run = async () => {
  const provider = new Provider(networkUrl, idRegistryAddress);

  // Setup
  const jsonRpcProvider = new providers.JsonRpcProvider(networkUrl);
  const wallet = new Wallet(bobPrivateKey, jsonRpcProvider);
  const idRegistryContract = new Contract(idRegistryAddress, IDRegistry, wallet);

  // Get fid
  const fid = await idRegistryContract.idOf(wallet.address);
  console.log('FID?', fid);
  // const otherFid = await idRegistryContract.idOf('0x70997970c51812dc3a010c7d01b50e0d17dc79c8');
  // console.log('FID', fid, fid.toNumber(), otherFid.toNumber());

  // Register
  if (!fid.toNumber()) {
    const result = await idRegistryContract.register(constants.AddressZero);
    console.log(result);
  }

  // Transfer
  // const result = await idRegistryContract.transfer('0x70997970c51812dc3a010c7d01b50e0d17dc79c8');
  // console.log('result', result);

  // const events = await idRegistryContract.queryFilter(idRegistryContract.filters.Transfer());
  // console.log('Events', events);

  // Get tx
  // const receipt = await provider.getTransactionReceipt(
  //   '0x5eee9b77a5fe3008ef9b2a0416693aad3999ec5d0080e162f23b9a845512652f'
  // );

  // receipt.logs.forEach((log) => {
  //   const parsedLog = idRegistryContract.interface.parseLog(log);
  //   console.log('LOG', log, parsedLog);
  // });
};

run();
