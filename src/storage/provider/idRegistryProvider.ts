import { IDRegistry } from '~/storage/provider/abis';
import { BigNumber, Contract, providers, Event } from 'ethers';
import { TypedEmitter } from 'tiny-typed-emitter';
import { IDRegistryEvent } from '~/types';
import { ok, err, Result } from 'neverthrow';
import { sanitizeSigner } from '~/utils';
import { BadRequestError, FarcasterError } from '~/errors';

export type IDRegistryEvents = {
  block: (blockNumber: number) => void;
  confirm: (event: IDRegistryEvent) => void;
};

class IDRegistryProvider extends TypedEmitter<IDRegistryEvents> {
  private _jsonRpcProvider: providers.BaseProvider;
  private _contract: Contract;
  private _numConfirmations: number;
  private _eventsByBlock: Map<number, Set<IDRegistryEvent>>;

  constructor(networkUrl: string, IDRegistryAddress: string, numConfirmations = 6) {
    super();

    // Init variables
    this._numConfirmations = numConfirmations;
    this._eventsByBlock = new Map();

    // Setup provider
    this._jsonRpcProvider = new providers.JsonRpcProvider(networkUrl);
    this._jsonRpcProvider.on('block', (blockNumber: number) => this.handleNewBlock(blockNumber));

    // Setup IDRegistry contract
    this._contract = new Contract(IDRegistryAddress, IDRegistry.abi, this._jsonRpcProvider);
    this._contract.on('Register', (to: string, id: BigNumber, _, event: Event) => {
      this.handleIDRegistryEvent(to, id, 'Register', event);
    });
    this._contract.on('Transfer', (_, to: string, id: BigNumber, event: Event) => {
      this.handleIDRegistryEvent(to, id, 'Transfer', event);
    });
  }

  get blocksQueue() {
    return Array.from(this._eventsByBlock.keys()).sort((a, b) => a - b);
  }

  get maxBlockNumber() {
    return this.blocksQueue[this.blocksQueue.length - 1];
  }

  get minBlockNumber() {
    return this.blocksQueue[0];
  }

  /**
   * validateIDRegistryEvent tries to confirm that an event was actually emitted from the
   * ID Registry and confirmed, based on block confirmations
   */
  async validateIDRegistryEvent(event: IDRegistryEvent): Promise<Result<void, FarcasterError>> {
    const receipt = await this._jsonRpcProvider.getTransactionReceipt(event.transactionHash);
    if (!receipt) return err(new BadRequestError('validateIDRegistryEvent: transaction not found'));

    if (receipt.confirmations >= this._numConfirmations)
      return err(new BadRequestError('validateIDRegistryEvent: insufficient confirmations'));

    for (const log of receipt.logs) {
      const parsedLog = this._contract.interface.parseLog(log);
      const { to, id } = parsedLog.args;
      if (sanitizeSigner(to) === sanitizeSigner(event.args.to) && id.toNumber() === event.args.id) return ok(undefined);
    }

    return err(new BadRequestError('validateIDRegistryEvent: no matching log found'));
  }

  /** Private methods */

  /**
   * handleNewBlock adds a new block number to the eventsByBlock map and then pops the oldest
   * blocks from the blocksQueue and tries to confirm those blocks' events
   */
  private handleNewBlock(blockNumber: number): void {
    // If we've already seen this block, ignore
    if (this._eventsByBlock.has(blockNumber)) return;

    // Otherwise add this blockNumber to map
    this._eventsByBlock.set(blockNumber, new Set());
    this.emit('block', blockNumber);

    // Check if there are events numConfirmations ago
    const confirmedBlockNumber = blockNumber - this._numConfirmations;
    while (this.minBlockNumber <= confirmedBlockNumber) {
      const blockNumber = this.minBlockNumber;
      const confirmedEvents = this._eventsByBlock.get(blockNumber) || new Set();

      confirmedEvents.forEach(async (event) => {
        const eventIsValid = await this.validateIDRegistryEvent(event);
        if (eventIsValid.isOk()) {
          this.emit('confirm', event);
        }
      });

      // Clear old block
      this._eventsByBlock.delete(blockNumber);
    }
  }

  /**
   * handleIDRegistryEvent takes a Register or Transfer event from the ID Registry contract, converts
   * it into an IDRegistryEvent, and adds it to the appropriate block in the eventsByBlock map
   */
  private handleIDRegistryEvent(to: string, id: BigNumber, name: 'Register' | 'Transfer', event: Event): void {
    const { blockNumber, blockHash, transactionHash, logIndex } = event;
    const idRegistryEvent: IDRegistryEvent = {
      args: {
        to,
        id: id.toNumber(),
      },
      name,
      blockNumber,
      blockHash,
      transactionHash,
      logIndex,
    };
    const eventsSet = this._eventsByBlock.get(blockNumber);
    if (eventsSet) {
      this._eventsByBlock.set(blockNumber, eventsSet.add(idRegistryEvent));
    }
  }
}

export default IDRegistryProvider;
