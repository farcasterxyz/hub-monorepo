import { Filter, FilterByBlockHash, Log, PerformActionRequest } from 'ethers';

const RETRY_LIMIT = 3;
const ETHERS_CACHE_DELAY_MS = 251;

type Constructor<T> = new (...args: any[]) => T;

export function RetryProvider<
  T extends Constructor<{
    _perform: (req: PerformActionRequest) => Promise<any>;
    getLogs: (_filter: Filter | FilterByBlockHash) => Promise<Array<Log>>;
    getBlockNumber: () => Promise<number>;
  }>
>(SuperClass: T) {
  return class RetryProvider extends SuperClass {
    public override _perform = (req: PerformActionRequest) => {
      return this.performWithRetry(req, 0);
    };

    private async performWithRetry(req: PerformActionRequest, attempt: number): Promise<any> {
      try {
        return await super._perform(req);
      } catch (e: any) {
        if (e.statusCode !== 429 || attempt >= RETRY_LIMIT) {
          throw e;
        } else {
          await new Promise<void>((resolve) => setTimeout(() => resolve(), ETHERS_CACHE_DELAY_MS));
          return await this.performWithRetry(req, attempt + 1);
        }
      }
    }

    // Not necessary for JsonRpcProvider, but required for direct implementations of AbstractProvider:
    public override getLogs = (_filter: Filter | FilterByBlockHash): Promise<Array<Log>> => {
      return this.getLogsWithRetry(_filter, 0);
    };

    private async getLogsWithRetry(_filter: Filter | FilterByBlockHash, attempt: number): Promise<any> {
      try {
        return await super.getLogs(_filter);
      } catch (e: any) {
        if (attempt >= RETRY_LIMIT) {
          throw e;
        } else {
          await new Promise<void>((resolve) => setTimeout(() => resolve(), ETHERS_CACHE_DELAY_MS));
          return await this.getLogsWithRetry(_filter, attempt + 1);
        }
      }
    }

    public override getBlockNumber = (): Promise<number> => {
      return this.getBlockNumberWithRetry(0);
    };

    private async getBlockNumberWithRetry(attempt: number): Promise<any> {
      try {
        return await super.getBlockNumber();
      } catch (e: any) {
        if (attempt >= RETRY_LIMIT) {
          throw e;
        } else {
          await new Promise<void>((resolve) => setTimeout(() => resolve(), ETHERS_CACHE_DELAY_MS));
          return await this.getBlockNumberWithRetry(attempt + 1);
        }
      }
    }
  };
}
