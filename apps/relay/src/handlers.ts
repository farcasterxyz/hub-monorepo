import { FastifyReply, FastifyRequest } from "fastify";
import { generateNonce } from "siwe";

export type ConnectRequest = {
  siweUri: string;
  domain: string;
  nonce?: string;
  notBefore?: string;
  expirationTime?: string;
  requestId?: string;
};

export type AuthenticateRequest = {
  message: string;
  signature: string;
  fid: number;
  username: string;
  bio: string;
  displayName: string;
  pfpUrl: string;
};

export type RelaySession = {
  state: "pending" | "completed";
  nonce: string;
  connectURI: string;
  message?: string;
  signature?: string;
  fid?: number;
  username?: string;
  bio?: string;
  displayName?: string;
  pfpUrl?: string;
};

const constructConnectURI = (channelToken: string, nonce: string, extraParams: ConnectRequest): string => {
  const params = { channelToken, nonce, ...extraParams };
  const query = new URLSearchParams(params);
  return `farcaster://connect?${query.toString()}`;
};

export async function connect(request: FastifyRequest<{ Body: ConnectRequest }>, reply: FastifyReply) {
  const channel = await request.channels.open();
  if (channel.isOk()) {
    const channelToken = channel.value;
    const nonce = request.body.nonce ?? generateNonce();
    const connectURI = constructConnectURI(channelToken, nonce, request.body);

    const update = await request.channels.update(channelToken, {
      state: "pending",
      nonce,
      connectURI,
    });
    if (update.isOk()) {
      reply.code(201).send({ channelToken, connectURI });
    } else {
      reply.code(500).send({ error: update.error.message });
    }
  } else {
    reply.code(500).send({ error: channel.error.message });
  }
}

export async function authenticate(request: FastifyRequest<{ Body: AuthenticateRequest }>, reply: FastifyReply) {
  const channelToken = request.channelToken;
  const { message, signature } = request.body;

  const channel = await request.channels.read(channelToken);
  if (channel.isOk()) {
    const update = await request.channels.update(channelToken, {
      ...channel.value,
      state: "completed",
      message,
      signature,
    });
    if (update.isOk()) {
      reply.send();
    } else {
      reply.code(500).send({ error: update.error.message });
    }
  } else {
    if (channel.error.errCode === "not_found") reply.code(401).send();
    reply.code(500).send({ error: channel.error.message });
  }
}

export async function status(request: FastifyRequest, reply: FastifyReply) {
  const channel = await request.channels.read(request.channelToken);
  if (channel.isOk()) {
    const { connectURI, ...res } = channel.value;
    if (res.state === "completed") {
      const close = await request.channels.close(request.channelToken);
      if (close.isErr()) {
        reply.code(500).send({ error: close.error.message });
      }
    }
    reply.send(res);
  } else {
    if (channel.error.errCode === "not_found") reply.code(401).send();
    reply.code(500).send({ error: channel.error.message });
  }
}
