import { IDRegistry } from '~/provider/abis';
import { BigNumber, Contract, Wallet, providers, constants, Event } from 'ethers';
import { TypedEmitter } from 'tiny-typed-emitter';
import { IDRegistryEvent } from '~/types';
import { ok, err, Result } from 'neverthrow';

export type IDRegistryEvents = {
  newCustody: (event: IDRegistryEvent) => void;
};

class IDRegistryProvider extends TypedEmitter<IDRegistryEvents> {
  private jsonRpcProvider: providers.BaseProvider;
  private IDRegistryContract: Contract;

  constructor(networkUrl: string, IDRegistryAddress: string) {
    super();

    // Setup provider
    this.jsonRpcProvider = new providers.JsonRpcProvider(networkUrl);
    this.jsonRpcProvider.on('block', (blockNumber: number) => this.handleNewBlock(blockNumber));

    // Setup IDRegistry contract
    this.IDRegistryContract = new Contract(IDRegistryAddress, IDRegistry, this.jsonRpcProvider);
    this.IDRegistryContract.on('Register', this.handleRegisterEvent);
    this.IDRegistryContract.on('Transfer', (...params: any) => this.handleNewTransfer(params));
  }

  validateIDRegistryEvent(event: IDRegistryEvent): Result<void, string> {
    // TODO
    return ok(undefined);
  }

  /** Private methods */

  private handleNewBlock(blockNumber: number): void {
    // TODO
    console.log('new block', blockNumber);
  }

  private handleRegisterEvent(to: string, id: BigNumber, recovery: string, event: Event): void {
    const { blockNumber, blockHash, transactionHash, logIndex } = event;
    const idRegistryEvent: IDRegistryEvent = {
      args: {
        to,
        id: id.toNumber(),
      },
      name: 'Register',
      blockNumber,
      blockHash,
      transactionHash,
      logIndex,
    };
  }

  private handleNewTransfer(params: any): void {
    console.log('new transfer', params);
  }
}

export default IDRegistryProvider;
