import { Abi } from 'abitype';
import { PublicClient, WatchContractEventParameters, WatchContractEventReturnType } from 'viem';
import { logger, Logger } from '../utils/logger.js';

/**
 * Wrapper around watchContractEvent that restarts when an error
 * is encountered. For example, if eth_newFilter is used and the
 * filter becomes stale, we can recover by making a new call to
 * watchContractEvent.
 */
export class WatchContractEvent<
  TAbi extends Abi | readonly unknown[] = readonly unknown[],
  TEventName extends string = string,
  TStrict extends boolean | undefined = undefined
> {
  private _publicClient: PublicClient;
  private _params: WatchContractEventParameters<TAbi, TEventName, TStrict>;
  private _unwatch?: WatchContractEventReturnType;
  private _log: Logger;

  constructor(
    publicClient: PublicClient,
    params: WatchContractEventParameters<TAbi, TEventName, TStrict>,
    key: string
  ) {
    this._publicClient = publicClient;
    this._params = params;
    this._log = logger.child({
      component: 'WatchContractEvent',
      eventName: params.eventName,
      key,
    });
  }

  public start() {
    this._unwatch = this._publicClient.watchContractEvent({
      ...this._params,
      onError: (error) => {
        this._log.error(`Error watching contract events: ${error}`, { error });
        this.restart();
        if (this._params.onError) this._params.onError(error);
      },
    });

    this._log.info(`Started watching contract events`);
  }

  public stop() {
    if (this._unwatch) this._unwatch();
    this._log.info(`Stopped watching contract events`);
  }

  public restart() {
    this.stop();
    this.start();
  }
}
