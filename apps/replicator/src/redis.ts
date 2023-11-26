import { Redis, RedisOptions } from "ioredis";

export const getRedisClient = (redisUrl: string, redisOpts?: RedisOptions) => {
  const client = new Redis(redisUrl, {
    connectTimeout: 5_000,
    maxRetriesPerRequest: null, // BullMQ wants this set
    ...redisOpts,
  });
  return client;
};
