import { RelayServer } from "./server";
import { CHANNEL_TTL, REDIS_URL, RELAY_SERVER_HOST, RELAY_SERVER_PORT } from "./env";

new RelayServer({
  redisUrl: REDIS_URL,
  ttl: CHANNEL_TTL,
  corsOrigin: "*",
}).start(RELAY_SERVER_HOST, RELAY_SERVER_PORT);
