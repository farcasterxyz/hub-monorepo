import dns, { type LookupOptions } from "node:dns";
import { isIP } from "node:net";

import StatsD from "@farcaster/hot-shots";

// @ts-ignore: Library's type declarations don't work with ESM apparently
export const statsd = new StatsD({
  host: process.env["STATSD_HOST"] || "127.0.0.1",
  cacheDns: true,
  maxBufferSize: 4096 /* 4KiB */,
  udpSocketOptions: {
    type: "udp4",
    lookup: (
      hostname: string,
      options: LookupOptions,
      callback: (err: unknown, address: unknown, family: number) => void,
    ) => {
      // Bypass dns.lookup if hostname is IP address
      if (isIP(hostname)) {
        callback(null, hostname, 4);
        return;
      }

      // Resolve if a real hostname
      dns.lookup(hostname, options, callback);
    },
  },
});
