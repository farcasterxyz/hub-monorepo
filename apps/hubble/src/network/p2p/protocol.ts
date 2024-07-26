import { GossipVersion } from "@farcaster/hub-nodejs";
import { Message as GossipSubMessage } from "@libp2p/interface-pubsub";
import { msgId, noSignMsgId } from "@libp2p/pubsub/utils";

// Current gossip protocol version
export const GOSSIP_PROTOCOL_VERSION = GossipVersion.V1_1;

/* This has been imported from the libp2p-gossipsub implementation as it's not public there */
export const msgIdFnStrictSign = (message: GossipSubMessage): Uint8Array => {
  if (message.type !== "signed") {
    throw new Error("expected signed message type");
  }
  // Should never happen
  if (message.sequenceNumber == null) throw Error("missing seqno field");

  return msgId(message.from.toBytes(), message.sequenceNumber);
};

/* This has been imported from the libp2p-gossipsub implementation as it's not public there */
export function msgIdFnStrictNoSign(msg: GossipSubMessage): Uint8Array | Promise<Uint8Array> {
  // Hashes the raw message data
  return noSignMsgId(msg.data);
}
