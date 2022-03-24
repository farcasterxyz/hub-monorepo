import * as FC from '~/types';

export function isRoot(msg: FC.SignedMessage): msg is FC.SignedMessage<FC.RootMessageBody> {
  const body = (msg as FC.SignedMessage<FC.RootMessageBody>).message?.body;
  return body && body.schema === 'farcaster.xyz/schemas/v1/root' && !!body.blockHash && !!body.prevRootBlockHash;
}

export function isCast(msg: FC.SignedMessage): msg is FC.Cast {
  return isCastNew(msg) || isCastDelete(msg) || isCastRecast(msg);
}
export function isCastNew(msg: FC.SignedMessage): msg is FC.SignedMessage<FC.CastNewMessageBody> {
  const body = (msg as FC.SignedMessage<FC.CastNewMessageBody>).message?.body;
  return (
    body &&
    body.schema === 'farcaster.xyz/schemas/v1/cast-new' &&
    !!body._text &&
    !!body.textHash &&
    !!body.attachmentsHash &&
    !!body._attachments
  );
}

export function isCastDelete(msg: FC.SignedMessage): msg is FC.SignedMessage<FC.CastDeleteMessageBody> {
  const body = (msg as FC.SignedMessage<FC.CastDeleteMessageBody>).message?.body;
  return body && body.schema === 'farcaster.xyz/schemas/v1/cast-delete' && !!body.targetCastUri;
}

export function isCastRecast(msg: FC.SignedMessage): msg is FC.SignedMessage<FC.CastRecastMessageBody> {
  const body = (msg as FC.SignedMessage<FC.CastRecastMessageBody>).message?.body;
  return body && body.schema === 'farcaster.xyz/schemas/v1/cast-recast' && !!body.targetCastUri;
}
