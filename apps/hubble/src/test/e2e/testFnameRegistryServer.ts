import { Factories, bytesToHexString } from "@farcaster/hub-nodejs";
import fastify, { FastifyInstance } from "fastify";

export class TestFNameRegistryServer {
  private server?: FastifyInstance;
  private port = 0;
  private transfers;

  constructor(transfers = []) {
    this.transfers = transfers;
  }

  public async start(): Promise<string> {
    this.server = fastify();

    this.server.get("/transfers", async (request, reply) => {
      reply.send({ transfers: this.transfers });
    });

    this.server.get("/signer", async (request, reply) => {
      reply.send({ signer: bytesToHexString(Factories.EthAddress.build())._unsafeUnwrap() });
    });

    try {
      await this.server.listen({ port: this.port, host: "localhost" });
      const address = this.server.server.address();
      const port = typeof address === "string" ? 0 : address?.port;
      return `http://localhost:${port}`;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  public async stop(): Promise<void> {
    try {
      await this.server?.close();
    } catch (err) {
      console.log(err);
    }
  }
}
