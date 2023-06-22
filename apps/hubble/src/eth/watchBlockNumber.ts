import { PublicClient, WatchBlockNumberParameters, WatchBlockNumberReturnType } from 'viem';
import { logger, Logger } from '../utils/logger.js';

export class WatchBlockNumber {
  private _publicClient: PublicClient;
  private _params: WatchBlockNumberParameters;
  private _unwatch?: WatchBlockNumberReturnType;
  private _log: Logger;

  public lastBlockNumber?: bigint;

  constructor(publicClient: PublicClient, params: WatchBlockNumberParameters) {
    this._publicClient = publicClient;
    this._params = params;
    this._log = logger.child({
      component: 'WatchBlockNumber',
    });
  }

  public start() {
    this._unwatch = this._publicClient.watchBlockNumber({
      ...this._params,
      onBlockNumber: (blockNumber, prevBlockNumber) => {
        this.lastBlockNumber = blockNumber;
        if (this._params.onBlockNumber) this._params.onBlockNumber(blockNumber, prevBlockNumber);
      },
      onError: (error) => {
        this._log.error(`Error watching block numbers: ${error}`, { error });
        this.restart();
        if (this._params.onError) this._params.onError(error);
      },
    });
    this._log.info('Started watching block numbers');
  }

  public stop() {
    if (this._unwatch) this._unwatch();
    this._log.info('Stopped watching block numbers');
  }

  public restart() {
    this.stop();
    this.start();
  }
}
