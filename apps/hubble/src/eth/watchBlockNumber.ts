import { PublicClient, WatchBlockNumberParameters, WatchBlockNumberReturnType } from "viem";
import { watchBlockNumber } from "viem/actions";
import { logger, Logger } from "../utils/logger.js";
import { HubError, HubResult } from "@farcaster/core";
import { err, ok, Result } from "neverthrow";

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
      component: "WatchBlockNumber",
    });
  }

  public start() {
    this._unwatch = watchBlockNumber(this._publicClient, {
      ...this._params,
      onBlockNumber: (blockNumber, prevBlockNumber) => {
        this.lastBlockNumber = blockNumber;
        if (this._params.onBlockNumber) this._params.onBlockNumber(blockNumber, prevBlockNumber);
      },
      onError: (error) => {
        this._log.error(`Error watching block numbers: ${error}`, { error });
        const restartResult = this.restart();
        if (restartResult.isErr()) {
          // Note: restart returns error if start fails - if start fails, we throw the error since
          // it can lead to an inconsistent state.
          throw restartResult.error;
        }
        if (this._params.onError) this._params.onError(error);
      },
    });
    this._log.info("Started watching block numbers");
  }

  public stop(): HubResult<void> {
    let stopResult: Result<void, HubError>;
    if (this._unwatch) {
      stopResult = Result.fromThrowable(this._unwatch, (error): HubError => {
        const errorResult: string = JSON.stringify(error);
        const message: string = "error stopping watch block numbers";
        this._log.error(message, { error });
        return new HubError("unavailable", errorResult);
      })();
    } else {
      stopResult = ok(undefined);
    }

    if (stopResult.isErr()) {
      return err(stopResult.error);
    } else {
      this._log.info("Stopped watching block numbers");
      return stopResult;
    }
  }

  public restart(): HubResult<void> {
    const stopResult = this.stop();
    if (stopResult.isErr()) {
      this._log.error(stopResult.error, "Error stopping watch block numbers");
    }

    return Result.fromThrowable(
      () => {
        this.start();
      },
      (error) => {
        this._log.error(`Error restarting watch block numbers: ${error}`, { error });
        return new HubError("unavailable", JSON.stringify(error));
      },
    )();
  }
}
