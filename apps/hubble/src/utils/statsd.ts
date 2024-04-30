import { ClientOptions, StatsD } from "@figma/hot-shots";
import { logger } from "./logger.js";
import { rsCreateStatsdClient } from "../rustfunctions.js";

const log = logger.child({ module: "statsd" });

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

let statsdInitialization: ClientOptions | undefined;

export function getStatsdInitialization(): ClientOptions | undefined {
  return statsdInitialization;
}

// Configure the StatsD client to send metrics to the given host and port.
export function initializeStatsd(host: string, port: number) {
  statsdInitialization = { host, port, prefix: "hubble.", cacheDns: true };
  statsdObject = new StatsD(statsdInitialization);

  let lastLoggedErrorTime = 0;
  const errorLogInterval = 60 * 1000; // 1 minute in milliseconds

  // Also create the rust client
  rsCreateStatsdClient(host, port, statsdInitialization.prefix || "");

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
