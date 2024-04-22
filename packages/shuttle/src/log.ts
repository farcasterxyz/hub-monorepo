import { pino } from "pino";

const COLORIZE =
  process.env["COLORIZE"] === "true" ? true : process.env["COLORIZE"] === "false" ? false : process.stdout.isTTY;

export const log = pino({
  level: process.env["LOG_LEVEL"] || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: COLORIZE,
      singleLine: true,
    },
  },
});

export type Logger = pino.Logger;
