import { err, ok, Result } from 'neverthrow';
import { IDRegistryEvent, Message } from '~/types';

/**
 * GossipMessage defines the structure of the basic message type that is published
 * over the gossip network
 *
 * @content - The message content to be broadcasted
 * @topics - The topics this message belongs to. Multiple topics can be passed.
 */
export type GossipMessage<T = Content> = {
  content: T;
  topics: string[];
};

export type Content = IDRegistryContent | UserContent;

/**
 * UserContent defines the structure of the primary message type that is published
 * over the gossip network.
 *
 * @message - The Farcaster Message that needs to be sent
 * @root - The current merkle root of the sender's trie
 * @count - The number of messages under the root
 */
export type UserContent = {
  message: Message;
  root: string;
  count: number;
};

/**
 * IDRegistryContent defines the structure of the IDRegistry Events that are published
 * over the gossip network.
 *
 * @message - The Farcaster IDRegistryEvent that needs to be sent
 * @root - The current merkle root of the sender's trie
 * @count - The number of messages under the root
 */
export type IDRegistryContent = {
  message: IDRegistryEvent;
  root: string;
  count: number;
};

/**
 * Encodes a GossipMessage to a UTF-8 encoded array that can be broadcast over the gossip network
 *
 * @message - the GossipMessage to encode for the network
 *
 * @return - A byte array containing the UTF-8 encoded message
 */
export const encodeMessage = (message: GossipMessage): Uint8Array => {
  const json = JSON.stringify(message);
  return new TextEncoder().encode(json);
};

/**
 * Decodes a GossipMessage from a UTF-8 encoded arrray
 *
 * @data - The message data
 *
 * @returns - A decoded GossipMessage from the input array
 */
export const decodeMessage = (data: Uint8Array): Result<GossipMessage, string> => {
  const json = new TextDecoder().decode(data);
  const message: GossipMessage = JSON.parse(json);

  // Error checking? exception handling?
  if (!message) {
    return err('Failed to decode Gossip message...');
  }
  return ok(message);
};
