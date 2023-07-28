import { HubRpcClient } from "@farcaster/hub-nodejs";
import { formatNumber } from "../../profile/profile.js";

// Class to collect stats
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

// Collects the call profiles of a single method, and then calculates the
// min, max, avg, and median of the call profiles.
export class MethodProfile {
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

  // Calculate the min, max, avg, and median of the given values.
  // Call this at the end of the profile.
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
  private _methodProfiles: Map<string, MethodProfile>;
  private _syncStartTime: number;

  constructor() {
    this._methodProfiles = new Map();

    this._methodProfiles.set("getSyncMetadataByPrefix", new MethodProfile("getSyncMetadataByPrefix"));
    this._methodProfiles.set("getAllSyncIdsByPrefix", new MethodProfile("getAllSyncIdsByPrefix"));
    this._methodProfiles.set("getAllMessagesBySyncIds", new MethodProfile("getAllMessagesBySyncIds"));
    this._methodProfiles.set("mergeMessages", new MethodProfile("mergeMessages"));

    this._syncStartTime = 0;
  }

  public getAllMethodProfiles(): Map<string, MethodProfile> {
    for (const [_, profile] of this._methodProfiles) {
      profile.updateStats();
    }

    return this._methodProfiles;
  }

  public getMethodProfile(method: string): MethodProfile {
    const profile = this._methodProfiles.get(method);
    if (profile === undefined) {
      throw new Error(`Method ${method} not found in profiler`);
    }

    return profile;
  }

  public getSyncDuration(): number {
    return Date.now() - this._syncStartTime;
  }

  public durationToPrettyPrintObject(): string[][] {
    const data = [];

    // First, write the headers
    const headers = ["", "Duration (s)"];
    data.push(headers);

    // Total time
    data.push(["Wall Time", Math.floor(this.getSyncDuration() / 1000).toString()]);

    return data;
  }

  public latenciesToPrettyPrintObject(): string[][] {
    const data = [];

    // First, write the headers
    const headers = ["Method", "Count", "Min", "Max", "Avg ", "Median"];
    data.push(headers);

    // Then, write the data for each method
    for (const [method, profile] of this._methodProfiles) {
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
    for (const [method, profile] of this._methodProfiles) {
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

  // Wrap the given rpcClient with a proxy that profiles all method calls
  // Remember to call `calculateStats` on the returned profiles to get the min, max, avg, and median
  public profiledRpcClient(rpcClient: HubRpcClient): HubRpcClient {
    // Be careful not to overwrite the start time
    if (this._syncStartTime === 0) {
      this._syncStartTime = Date.now();
    }

    // Capture the "this" context
    const me = this;

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
            if (result.isOk()) {
              const resultBytes = Math.floor(JSON.stringify(result).length / 2); // 2 hex chars per byte
              // const logArgs = Buffer.from(args[0]["prefix"]).toString("hex");
              // log.info(
              //   {
              //     method: prop,
              //     duration: end - start,
              //     args: logArgs,
              //     bytes: resultBytes,
              //   },
              //   "RPC call",
              // );
              me._methodProfiles.get(prop)?.addCall(end - start, resultBytes, 1);
            }
          } else if (prop === "getAllSyncIdsByPrefix") {
            if (result.isOk() && result.value?.syncIds) {
              const numSyncIds = result.value.syncIds.length;
              const resultBytes = Math.floor(JSON.stringify(result).length / 2); // 2 hex chars per byte
              // const logArgs = Buffer.from(args[0]["prefix"]).toString("hex");
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
              me._methodProfiles.get(prop)?.addCall(end - start, resultBytes, numSyncIds);
            }
          } else if (prop === "getAllMessagesBySyncIds") {
            if (result.isOk() && result.value?.messages) {
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
              me._methodProfiles.get(prop)?.addCall(end - start, resultBytes, numMessages);
            }
          }

          return result;
        };
      },
    });
  }
}
