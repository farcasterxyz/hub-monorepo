import { HubError, HubAsyncResult } from "@farcaster/hub-nodejs";
import { Redis } from "ioredis";
import { ResultAsync, err, ok } from "neverthrow";
import { randomUUID } from "crypto";

interface ChannelStoreOpts {
  port: number;
  ttl?: number;
}

export class ChannelStore<T> {
  private redis: Redis;
  private ttl: number;

  constructor({ port, ttl }: ChannelStoreOpts) {
    this.redis = new Redis(port);
    this.ttl = ttl ?? 3600;
  }

  async open(state?: T): HubAsyncResult<string> {
    const channelToken = randomUUID();
    return ResultAsync.fromPromise(
      this.redis.set(channelToken, JSON.stringify(state ?? {}), "EX", this.ttl),
      (err) => new HubError("unknown", err as Error),
    ).andThen(() => ok(channelToken));
  }

  async update(channelToken: string, state: T): HubAsyncResult<T> {
    return ResultAsync.fromPromise(
      this.redis.set(channelToken, JSON.stringify(state), "KEEPTTL"),
      (err) => new HubError("unknown", err as Error),
    ).andThen(() => ok(state));
  }

  async read(channelToken: string): HubAsyncResult<T> {
    return ResultAsync.fromPromise(
      this.redis.get(channelToken),
      (err) => new HubError("unknown", err as Error),
    ).andThen((channel) => {
      if (channel) {
        return ok(JSON.parse(channel));
      } else {
        return err(new HubError("not_found", "Channel not found"));
      }
    });
  }

  async close(channelToken: string) {
    return ResultAsync.fromPromise(this.redis.del(channelToken), (err) => new HubError("unknown", err as Error));
  }

  async stop() {
    return this.redis.quit();
  }
}
