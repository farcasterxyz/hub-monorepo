import { HubRpcClient } from "@farcaster/hub-nodejs";
import { formatNumber } from "../../profile.js";

export class MethodCallProfile {
  min: number;
  max: number;
  avg: number;
  median: number;

  constructor(min = 0, max = 0, avg = 0, median = 0) {
    this.min = min;
    this.max = max;
    this.avg = avg;
    this.median = median;
  }
}

export class RpcMethodProfile {
  label: string;
  numCalls: number;
  totalBytes: number;
  payloadNum: number;

  latency: MethodCallProfile;
  resultBytes: MethodCallProfile;

  individualCallLatencies: number[];
  individualCallResultBytes: number[];

  constructor(label: string) {
    this.label = label;
    this.numCalls = 0;
    this.totalBytes = 0;
    this.payloadNum = 0;

    this.latency = new MethodCallProfile();
    this.resultBytes = new MethodCallProfile();

    this.individualCallLatencies = [];
    this.individualCallResultBytes = [];
  }

  addCall(latency: number, resultBytes: number, payloadNum: number) {
    this.numCalls += 1;
    this.totalBytes += resultBytes;
    this.payloadNum += payloadNum;

    this.individualCallLatencies.push(latency);
    this.individualCallResultBytes.push(resultBytes);
  }

  updateStats() {
    this.latency = this.calculateStats(this.individualCallLatencies);
    this.resultBytes = this.calculateStats(this.individualCallResultBytes);

    this.individualCallLatencies = [];
    this.individualCallResultBytes = [];
  }

  private calculateStats(values: number[]): MethodCallProfile {
    let min = Number.MAX_SAFE_INTEGER;
    let max = Number.MIN_SAFE_INTEGER;
    for (let i = 0; i < values.length; i++) {
      if ((values[i] as number) < min) {
        min = values[i] as number;
      }

      if ((values[i] as number) > max) {
        max = values[i] as number;
      }
    }

    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const median = values[Math.floor(values.length / 2)];

    return new MethodCallProfile(min, max, avg, median);
  }
}

export class SyncEngineProfiler {
  private _rpcMethodProfiles: Map<string, RpcMethodProfile>;
  private _syncStartTime: number;

  constructor() {
    this._rpcMethodProfiles = new Map();

    this._rpcMethodProfiles.set("getSyncMetadataByPrefix", new RpcMethodProfile("getSyncMetadataByPrefix"));
    this._rpcMethodProfiles.set("getAllSyncIdsByPrefix", new RpcMethodProfile("getAllSyncIdsByPrefix"));
    this._rpcMethodProfiles.set("getAllMessagesBySyncIds", new RpcMethodProfile("getAllMessagesBySyncIds"));

    this._syncStartTime = 0;
  }

  public getRpcMethodProfiles(): Map<string, RpcMethodProfile> {
    for (const [_, profile] of this._rpcMethodProfiles) {
      profile.updateStats();
    }

    return this._rpcMethodProfiles;
  }

  public getSyncDuration(): number {
    return Date.now() - this._syncStartTime;
  }

  public latenciesToPrettyPrintObject(): string[][] {
    const data = [];

    // First, write the headers
    const headers = ["Method", "Count", "Min", "Max", "Avg ", "Median"];
    data.push(headers);

    // Then, write the data for each method
    for (const [method, profile] of this._rpcMethodProfiles) {
      const row = [
        method,
        formatNumber(profile.numCalls),
        formatNumber(profile.latency.min),
        formatNumber(profile.latency.max),
        formatNumber(profile.latency.avg),
        formatNumber(profile.latency.median),
      ];
      data.push(row);
    }

    return data;
  }

  public resultBytesToPrettyPrintObject(): string[][] {
    const data = [];

    // First, write the headers
    const headers = ["Method", "Count", "Objects", "Total", "Min", "Max", "Avg", "Median"];
    data.push(headers);

    // Then, write the data for each method
    for (const [method, profile] of this._rpcMethodProfiles) {
      const row = [
        method,
        formatNumber(profile.numCalls),
        formatNumber(profile.payloadNum),
        formatNumber(profile.totalBytes),
        formatNumber(profile.resultBytes.min),
        formatNumber(profile.resultBytes.max),
        formatNumber(profile.resultBytes.avg),
        formatNumber(profile.resultBytes.median),
      ];
      data.push(row);
    }

    return data;
  }

  public profiledRpcClient(rpcClient: HubRpcClient): HubRpcClient {
    const me = this;
    this._syncStartTime = Date.now();

    return new Proxy(rpcClient, {
      get: function (target, prop, receiver) {
        // rome-ignore lint/suspicious/noExplicitAny: <explanation>
        const origMethod = (target as any)[prop];
        // rome-ignore lint/suspicious/noExplicitAny: <explanation>
        return async (...args: any[]) => {
          const start = Date.now();
          // rome-ignore lint/suspicious/noExplicitAny: <explanation>
          const result = await origMethod.apply(this as any, args);
          const end = Date.now();

          if (prop === "getSyncMetadataByPrefix") {
            const logArgs = Buffer.from(args[0]["prefix"]).toString("hex");
            const resultBytes = Math.floor(JSON.stringify(result).length / 2); // 2 hex chars per byte
            // log.info(
            //   {
            //     method: prop,
            //     duration: end - start,
            //     args: logArgs,
            //     bytes: resultBytes,
            //   },
            //   "RPC call",
            // );
            me._rpcMethodProfiles.get(prop)?.addCall(end - start, resultBytes, 1);
          } else if (prop === "getAllSyncIdsByPrefix") {
            const logArgs = Buffer.from(args[0]["prefix"]).toString("hex");
            const numSyncIds = result.value.syncIds.length;
            const resultBytes = Math.floor(JSON.stringify(result).length / 2); // 2 hex chars per byte
            // log.info(
            //   {
            //     method: prop,
            //     duration: end - start,
            //     args: logArgs,
            //     numSyncIds,
            //     bytes: resultBytes,
            //   },
            //   "RPC call",
            // );
            me._rpcMethodProfiles.get(prop)?.addCall(end - start, resultBytes, numSyncIds);
          } else if (prop === "getAllMessagesBySyncIds") {
            const numMessages = result.value.messages.length;
            const resultBytes = Math.floor(JSON.stringify(result).length / 2); // 2 hex chars per byte
            // log.info(
            //   {
            //     method: prop,
            //     duration: end - start,
            //     numMessages,
            //     bytes: resultBytes,
            //   },
            //   "RPC call",
            // );
            me._rpcMethodProfiles.get(prop)?.addCall(end - start, resultBytes, numMessages);
          }

          return result;
        };
      },
    });
  }
}
