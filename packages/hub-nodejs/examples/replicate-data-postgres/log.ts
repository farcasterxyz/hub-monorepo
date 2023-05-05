import { pino } from 'pino';

export const log = pino();

export type Logger = pino.Logger;
