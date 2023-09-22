import { StatsD } from "hot-shots";
import { log as parentLog } from "./log.js";
import { AssertionError } from "./error.js";

const log = parentLog.child({ module: "statsd" });

export type StatsDInitParams = {
  host: string;
  port: number;
  prefix: string;
};

// Unless configured, we don't want to send metrics to a StatsD server.
const doNothingStatsd = {
  increment: () => {},
  decrement: () => {},
  timing: () => {},
  gauge: () => {},
  histogram: () => {},
  set: () => {},
  unique: () => {},
  close: () => {},
  childClient: () => doNothingStatsd,
} as unknown as StatsD;

let statsdObject = doNothingStatsd;

export function statsd(): StatsD {
  return statsdObject;
}

let statsdInitialization: StatsDInitParams | undefined;

// Configure the StatsD client to send metrics to the given host and port.
export function initializeStatsd(statsdHost: string, prefix: string) {
  const [host, port] = statsdHost.split(":");
  if (!host) throw new AssertionError("StatsD host is required");
  if (!port) throw new AssertionError("StatsD port is required");
  statsdObject = new StatsD({ host, port: Number(port), prefix });

  let lastLoggedErrorTime = 0;
  const errorLogInterval = 60 * 1000; // 1 minute in milliseconds

  // Attach an error listener to handle errors
  statsdObject.socket.on("error", (error) => {
    const currentTime = Date.now();

    // Log at most 1 per minute to not overwhelm the logs
    if (currentTime - lastLoggedErrorTime >= errorLogInterval) {
      log.error({ error }, "StatsD Error");
      lastLoggedErrorTime = currentTime;
    }
  });
}
