import { ContactInfo, GossipMessage, IDRegistryContent, UserContent } from '~/network/protocol';
import { isIDRegistryEvent, isMessage } from '~/types/typeguards';

export const isGossipMessage = (msg: GossipMessage): msg is GossipMessage => {
  try {
    const { content, topics } = msg;
    const validType =
      isUserContent(content as UserContent) ||
      isIDRegistryContent(content as IDRegistryContent) ||
      isContactInfo(content as ContactInfo);

    return validType && Array.isArray(topics) && topics.every((t) => typeof t === 'string');
  } catch (error) {
    return false;
  }
};

export const isUserContent = (content: UserContent): content is UserContent => {
  try {
    const { message, root, count } = content;
    return isMessage(message) && typeof root === 'string' && typeof count === 'number';
  } catch (error) {
    return false;
  }
};

export const isIDRegistryContent = (content: IDRegistryContent): content is IDRegistryContent => {
  try {
    const { message, root, count } = content;
    return isIDRegistryEvent(message) && typeof root === 'string' && typeof count === 'number';
  } catch (error) {
    return false;
  }
};

export const isContactInfo = (content: ContactInfo): content is ContactInfo => {
  try {
    const { peerId, rpcAddress } = content;

    const validAddress = rpcAddress
      ? typeof rpcAddress.address === 'string' &&
        typeof rpcAddress.family === 'string' &&
        typeof rpcAddress.port === 'number'
      : true;

    return typeof peerId === 'string' && validAddress;
  } catch (error) {
    return false;
  }
};
