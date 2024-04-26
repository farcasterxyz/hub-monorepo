import StatsD from "@figma/hot-shots";

export const statsd = new StatsD({ cacheDns: true, maxBufferSize: 4096 /* 4KiB */ });
