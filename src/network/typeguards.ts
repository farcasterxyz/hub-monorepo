import { ContactInfoContent, Content, GossipMessage, IDRegistryContent, UserContent } from '~/network/protocol';
import { isIDRegistryEvent, isMessage } from '~/types/typeguards';

export const isGossipMessage = (msg: any): msg is GossipMessage => {
  try {
    const { content, topics } = msg;
    const validType = isUserContent(content) || isIDRegistryContent(content) || isContactInfo(content);

    return validType && Array.isArray(topics) && topics.every((t) => typeof t === 'string');
  } catch (error) {
    return false;
  }
};

export const isUserContent = (content: Content): content is UserContent => {
  try {
    const { message, root, count } = content as UserContent;
    return isMessage(message) && typeof root === 'string' && typeof count === 'number';
  } catch (error) {
    return false;
  }
};

export const isIDRegistryContent = (content: Content): content is IDRegistryContent => {
  try {
    const { message, root, count } = content as IDRegistryContent;
    return isIDRegistryEvent(message) && typeof root === 'string' && typeof count === 'number';
  } catch (error) {
    return false;
  }
};

export const isContactInfo = (content: Content): content is ContactInfoContent => {
  try {
    const { peerId, rpcAddress } = content as ContactInfoContent;

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
