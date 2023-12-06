import fastify from "fastify";
import fastifyCors from "@fastify/cors";
import { HubResult, HubError } from "@farcaster/hub-nodejs";
import { err, ok } from "neverthrow";
import { ChannelStore } from "./channels";
import { AuthenticateRequest, ConnectRequest, RelaySession, authenticate, connect, status } from "./handlers";
import { logger } from "./logger";

const log = logger.child({ component: "RelayServer" });

export class RelayServer {
  app = fastify();
  channels = new ChannelStore<RelaySession>({
    port: 16379,
  });

  constructor(corsOrigin = "*") {
    this.app.setErrorHandler((error, request, reply) => {
      log.error({ err: error, errMsg: error.message, request }, "Error in http request");
      reply.code(500).send({ error: error.message });
    });

    this.app.register(fastifyCors, { origin: [corsOrigin] });
    this.app.decorateRequest("channels");
    this.app.addHook("onRequest", async (request) => {
      request.channels = this.channels;
    });
    this.app.get("/healthcheck", async (_request, reply) => reply.send({ status: "OK" }));
    this.initHandlers();
  }

  initHandlers() {
    this.app.register(
      (v1, _opts, next) => {
        v1.register((publicRoutes, _opts, next) => {
          publicRoutes.post<{ Body: ConnectRequest }>("/connect", connect);
          next();
        });

        v1.register((protectedRoutes, _opts, next) => {
          protectedRoutes.decorateRequest("channelToken", "");
          protectedRoutes.addHook("preHandler", async (request, reply) => {
            const auth = request.headers.authorization;
            const channelToken = auth?.split(" ")[1];
            if (channelToken) {
              request.channelToken = channelToken;
            } else {
              reply.code(401).send();
              return;
            }
          });

          protectedRoutes.post<{
            Body: AuthenticateRequest;
          }>("/connect/authenticate", authenticate);

          protectedRoutes.get("/connect/status", status);

          next();
        });
        next();
      },
      { prefix: "/v1" },
    );
  }

  async start(ip = "0.0.0.0", port = 0): Promise<HubResult<string>> {
    return new Promise((resolve) => {
      this.app.listen({ host: ip, port }, (e, address) => {
        if (e) {
          log.error({ err: e, errMsg: e.message }, "Failed to start http server");
          resolve(err(new HubError("unavailable.network_failure", `Failed to start http server: ${e.message}`)));
        }

        log.info({ address }, "Started relay server");
        resolve(ok(address));
      });
    });
  }

  async stop() {
    await this.app.close();
    await this.channels.stop();
    log.info("Stopped relay server");
  }
}
