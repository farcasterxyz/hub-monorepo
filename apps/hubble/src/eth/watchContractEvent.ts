import { Abi } from "abitype";
import { HttpRequestError, PublicClient, WatchContractEventParameters, WatchContractEventReturnType } from "viem";
import { logger, Logger } from "../utils/logger.js";
import { HubError, HubResult } from "@farcaster/core";
import { err, ok, Result } from "neverthrow";
import { diagnosticReporter } from "../utils/diagnosticReport.js";

/**
 * Wrapper around watchContractEvent that restarts when an error
 * is encountered. For example, if eth_newFilter is used and the
 * filter becomes stale, we can recover by making a new call to
 * watchContractEvent.
 */
export class WatchContractEvent<
  TAbi extends Abi | readonly unknown[] = readonly unknown[],
  TEventName extends string = string,
  TStrict extends boolean | undefined = undefined,
> {
  private _publicClient: PublicClient;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  private _params: WatchContractEventParameters<TAbi, any, TStrict>;
  private _unwatch?: WatchContractEventReturnType;
  private _log: Logger;

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  constructor(publicClient: PublicClient, params: WatchContractEventParameters<TAbi, any, TStrict>, key: string) {
    this._publicClient = publicClient;
    this._params = params;
    this._log = logger.child({
      component: "WatchContractEvent",
      key,
    });
  }

  public start() {
    this._unwatch = this._publicClient.watchContractEvent({
      ...this._params,
      onError: (error) => {
        diagnosticReporter().reportError(error);
        this._log.error(`Error watching contract events: ${error}`, { error });
        const restartResult = this.restart();
        if (restartResult.isErr()) {
          // Note: restart returns error if start fails - if start fails, we throw the error since
          // it can lead to inconsistent state.
          throw restartResult.error;
        }
        if (this._params.onError) this._params.onError(error);
      },
    });

    this._log.info(`Started watching contract events at address ${this._params.address}`);
  }

  public stop(): HubResult<void> {
    let stopResult: Result<void, HubError>;
    if (this._unwatch) {
      stopResult = Result.fromThrowable(this._unwatch, (error): HubError => {
        const errorResult: string = JSON.stringify(error);
        const message: string = "error stopping watch contract events";
        this._log.error(message, { error });
        return new HubError("unavailable.network_failure", errorResult);
      })();
    } else {
      stopResult = ok(undefined);
    }

    if (stopResult.isErr()) {
      return err(stopResult.error);
    } else {
      this._log.info("Stopped watching contract events");
      return stopResult;
    }
  }

  public restart(): HubResult<void> {
    const stopResult = this.stop();
    if (stopResult.isErr()) {
      this._log.error(stopResult.error, "Error stopping watch contract events");
    }

    return Result.fromThrowable(
      () => {
        this.start();
      },
      (error): HubError => {
        const errorResult: string = JSON.stringify(error);
        const message: string = "error starting watch contract events";
        this._log.error(message, { error });
        return new HubError("unavailable", errorResult);
      },
    )();
  }
}
