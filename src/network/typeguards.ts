import * as FC from '~/types';
import { isIDRegistryEvent, isMessage } from '~/types/typeguards';
import { GossipMessage } from '~/network/protocol';

export const isGossipMessage = (msg: GossipMessage): msg is GossipMessage => {
  try {
    const { content, topics } = msg;
    const validType =
      isMessage(content.message as FC.Message) || isIDRegistryEvent(content.message as FC.IDRegistryEvent);

    return (
      validType &&
      typeof content.count === 'number' &&
      typeof content.root === 'string' &&
      Array.isArray(topics) &&
      topics.every((t) => typeof t === 'string')
    );
  } catch (error: any) {
    return false;
  }
};
