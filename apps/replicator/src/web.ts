import fastify from "fastify";
import { FastifyAdapter } from "@bull-board/fastify";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import Redis from "ioredis";
import { JOB_QUEUES } from "./jobs";
import { WEB_UI_PORT } from "./env";

export function getWebApp(redis: Redis) {
  const app = fastify();
  const serverAdapter = new FastifyAdapter();

  const bullMQAdapters = Object.values(JOB_QUEUES).map((queue) => new BullMQAdapter(queue));

  createBullBoard({
    queues: bullMQAdapters,
    serverAdapter,
    options: {
      uiConfig: {
        boardTitle: "Replicator Jobs",
      },
    },
  });

  // Not sure why we need `as any` here. It works fine and is in their docs, but does not typecheck.
  // biome-ignore lint/suspicious/noExplicitAny: legacy code, avoid using ignore for new code
  app.register(serverAdapter.registerPlugin() as any);

  app.listen({ port: WEB_UI_PORT, host: "0.0.0.0" });
  return app;
}
