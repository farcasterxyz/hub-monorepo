export * from './ed25519Signer';
export * from './eip712Signer';
export * from './ethersEip712Signer';
export * from './nobleEd25519Signer';
export * from './signer';
export * from './types';

import { EthersEip712Signer } from './ethersEip712Signer';
import { NobleEd25519Signer } from './nobleEd25519Signer';

export const getEd25519Signer = (privateKey: Uint8Array) => new NobleEd25519Signer(privateKey);
export const getEip712Signer = (...args: ConstructorParameters<typeof EthersEip712Signer>) =>
  new EthersEip712Signer(...args);
