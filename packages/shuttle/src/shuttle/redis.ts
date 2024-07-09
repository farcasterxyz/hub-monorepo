import { Redis, Cluster, RedisOptions } from "ioredis";

export const getRedisClient = (redisUrl: string, redisOpts?: RedisOptions) => {
  const client = new Redis(redisUrl, {
    connectTimeout: 5_000,
    maxRetriesPerRequest: null, // BullMQ wants this set
    ...redisOpts,
  });
  return client;
};

export class RedisClient {
  public client: Redis | Cluster;
  constructor(client: Redis | Cluster) {
    this.client = client;
  }
  static create(redisUrl: string, redisOpts?: RedisOptions) {
    const client = getRedisClient(redisUrl, redisOpts);
    return new RedisClient(client);
  }

  async setLastProcessedEvent(hubId: string, eventId: number) {
    const key = `hub:${hubId}:last-hub-event-id`;
    if (eventId === 0) {
      await this.client.del(key);
    } else {
      await this.client.set(key, eventId.toString());
    }
  }

  async getLastProcessedEvent(hubId: string) {
    const eventId = await this.client.get(`hub:${hubId}:last-hub-event-id`);
    return eventId ? parseInt(eventId) : 0;
  }

  async clearForTest() {
    await this.client.flushdb();
  }
}
