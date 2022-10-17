import * as FC from '~/types';
import { ContactInfoContent, Content, GossipMessage, IdRegistryContent, UserContent } from '~/network/p2p/protocol';

export const isCast = (msg: FC.Message): msg is FC.Cast => isCastShort(msg) || isCastRemove(msg) || isCastRecast(msg);

export const isCastShort = (msg: FC.Message): msg is FC.CastShort => {
  const { body, type } = (msg as FC.CastShort).data;
  return (
    type === FC.MessageType.CastShort &&
    body &&
    typeof body.text === 'string' &&
    (body.embeds ? Array.isArray(body.embeds) : true) &&
    (body.mentions ? Array.isArray(body.mentions) : true) &&
    (body.parent ? typeof body.parent === 'string' : true) &&
    (body.meta ? typeof body.meta === 'string' : true)
  );
};

export const isCastRemove = (msg: FC.Message): msg is FC.CastRemove => {
  const { body, type } = (msg as FC.CastRemove).data;
  return type === FC.MessageType.CastRemove && body && typeof body.targetHash === 'string';
};

export const isCastRecast = (msg: FC.Message): msg is FC.CastRecast => {
  const { body, type } = (msg as FC.CastRecast).data;
  return type === FC.MessageType.CastRecast && body && typeof body.targetCastUri === 'string';
};

export const isReaction = (msg: FC.Message): msg is FC.Reaction => {
  return isReactionAdd(msg) || isReactionRemove(msg);
};

export const isReactionAdd = (msg: FC.Message): msg is FC.ReactionAdd => {
  const { body, type } = (msg as FC.ReactionAdd).data;
  return type === FC.MessageType.ReactionAdd && body && typeof body.targetUri === 'string' && body.type === 'like';
};

export const isReactionRemove = (msg: FC.Message): msg is FC.ReactionRemove => {
  const { body, type } = (msg as FC.ReactionRemove).data;
  return type === FC.MessageType.ReactionRemove && body && typeof body.targetUri === 'string' && body.type === 'like';
};

export const isSignerMessage = (msg: FC.Message): msg is FC.SignerMessage => {
  return isSignerAdd(msg) || isSignerRemove(msg);
};

export const isSignerAdd = (msg: FC.Message): msg is FC.SignerAdd => {
  const { body, type } = (msg as FC.SignerAdd).data;
  return type === FC.MessageType.SignerAdd && body && typeof body.delegate === 'string';
};

export const isSignerRemove = (msg: FC.Message): msg is FC.SignerRemove => {
  const { body, type } = (msg as FC.SignerRemove).data;
  return type === FC.MessageType.SignerRemove && body && typeof body.delegate === 'string';
};

export const isVerification = (msg: FC.Message): msg is FC.Verification => {
  return isVerificationEthereumAddress(msg) || isVerificationRemove(msg);
};

export const isVerificationEthereumAddress = (msg: FC.Message): msg is FC.VerificationEthereumAddress => {
  const { body, type } = (msg as FC.VerificationEthereumAddress).data;
  return (
    type === FC.MessageType.VerificationEthereumAddress &&
    body &&
    body.externalSignatureType === FC.SignatureAlgorithm.EthereumPersonalSign &&
    typeof body.externalSignature === 'string' &&
    typeof body.externalUri === 'string' &&
    typeof body.claimHash === 'string' &&
    body.claimHash.length > 0
  );
};

export const isVerificationRemove = (msg: FC.Message): msg is FC.VerificationRemove => {
  const { body, type } = (msg as FC.VerificationRemove).data;
  return (
    type === FC.MessageType.VerificationRemove &&
    body &&
    typeof body.claimHash === 'string' &&
    body.claimHash.length > 0
  );
};

export const isFollow = (msg: FC.Message): msg is FC.Follow => {
  return isFollowAdd(msg) || isFollowRemove(msg);
};

export const isFollowAdd = (msg: FC.Message): msg is FC.FollowAdd => {
  const { body, type } = (msg as FC.FollowAdd).data;
  return type === FC.MessageType.FollowAdd && body && typeof body.targetUri === 'string';
};

export const isFollowRemove = (msg: FC.Message): msg is FC.FollowRemove => {
  const { body, type } = (msg as FC.FollowRemove).data;
  return type === FC.MessageType.FollowRemove && body && typeof body.targetUri === 'string';
};

export const isMessage = (msg: any): msg is FC.Message => {
  const { data, hash, hashType, signature, signatureType, signer } = msg as FC.Message;
  return (
    data &&
    isData(data) &&
    typeof hash === 'string' &&
    typeof hashType === 'string' &&
    typeof signature === 'string' &&
    typeof signatureType === 'string' &&
    typeof signer === 'string'
  );
};

export const isData = (data: any): data is FC.Data => {
  const { body, type, signedAt, fid, network } = data as FC.Data;
  return (
    typeof body === 'object' &&
    typeof type === 'number' &&
    typeof signedAt === 'number' &&
    typeof fid === 'number' &&
    typeof network === 'number'
  );
};

export const isIdRegistryEvent = (msg: any): msg is FC.IdRegistryEvent => {
  try {
    const { args } = msg;
    return (
      typeof args.to === 'string' &&
      typeof args.id === 'number' &&
      typeof msg.blockHash === 'string' &&
      msg.blockHash.length > 0 &&
      typeof msg.blockNumber === 'number' &&
      typeof msg.logIndex === 'number' &&
      typeof msg.transactionHash === 'string' &&
      msg.transactionHash.length > 0 &&
      typeof msg.name === 'string' &&
      (msg.name === 'Register' || msg.name === 'Transfer')
    );
  } catch (error: any) {
    return false;
  }
};

export const isGossipMessage = (msg: any): msg is GossipMessage => {
  try {
    const { content, topics } = msg;
    const validType = isUserContent(content) || isIdRegistryContent(content) || isContactInfo(content);

    return validType && Array.isArray(topics) && topics.every((t) => typeof t === 'string');
  } catch (error) {
    return false;
  }
};

export const isUserContent = (content: Content): content is UserContent => {
  try {
    const { message } = content as UserContent;
    return isMessage(message);
  } catch (error) {
    return false;
  }
};

export const isIdRegistryContent = (content: Content): content is IdRegistryContent => {
  try {
    const { message } = content as IdRegistryContent;
    return isIdRegistryEvent(message);
  } catch (error) {
    return false;
  }
};

export const isContactInfo = (content: Content): content is ContactInfoContent => {
  try {
    const { peerId, rpcAddress, excludedHashes, count } = content as ContactInfoContent;

    const validAddress = rpcAddress
      ? typeof rpcAddress.address === 'string' &&
        typeof rpcAddress.family === 'string' &&
        typeof rpcAddress.port === 'number'
      : true;

    const excludedHashesValid = Array.isArray(excludedHashes) && excludedHashes.every((h) => typeof h === 'string');

    return typeof peerId === 'string' && validAddress && excludedHashesValid && typeof count === 'number';
  } catch (error) {
    return false;
  }
};
