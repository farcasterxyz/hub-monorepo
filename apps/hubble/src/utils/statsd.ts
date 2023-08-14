import { StatsD } from "hot-shots";

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

// Configure the StatsD client to send metrics to the given host and port.
export function initializeStatsd(host: string, port: number) {
  statsdObject = new StatsD({ host, port, prefix: "hubble." });
}
