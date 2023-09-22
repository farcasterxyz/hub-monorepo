import { LOG_LEVEL, COLORIZE } from "./env.js";
import { pino } from "pino";

export const log = pino({
  level: LOG_LEVEL,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: COLORIZE,
      singleLine: true,
    },
  },
});

export type Logger = pino.Logger;
