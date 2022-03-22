import * as FC from '~/types';

export function isRoot(msg: FC.SignedMessage): msg is FC.SignedMessage<FC.RootMessageBody> {
  const body = (msg as FC.SignedMessage<FC.RootMessageBody>).message?.body;
  return body && body.type === 'root' && !!body.blockHash && !!body.prevRootBlockHash;
}

export function isCast(msg: FC.SignedMessage): msg is FC.Cast {
  return isCastNew(msg) || isCastDelete(msg) || isCastRecast(msg);
}
export function isCastNew(msg: FC.SignedMessage): msg is FC.SignedMessage<FC.CastNewMessageBody> {
  const body = (msg as FC.SignedMessage<FC.CastNewMessageBody>).message?.body;
  return body && body.type === 'cast-new' && !!body.text;
}

export function isCastDelete(msg: FC.SignedMessage): msg is FC.SignedMessage<FC.CastDeleteMessageBody> {
  const body = (msg as FC.SignedMessage<FC.CastDeleteMessageBody>).message?.body;
  return body && body.type === 'cast-delete' && !!body.targetCastUri;
}

export function isCastRecast(msg: FC.SignedMessage): msg is FC.SignedMessage<FC.CastRecastMessageBody> {
  const body = (msg as FC.SignedMessage<FC.CastRecastMessageBody>).message?.body;
  return body && body.type === 'cast-recast' && !!body.targetCastUri;
}
