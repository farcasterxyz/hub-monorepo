import * as FC from '~/types';

export function isRoot(msg: FC.Message): msg is FC.Message<FC.RootMessageBody> {
  const body = (msg as FC.Message<FC.RootMessageBody>).data?.body;
  return body && body.schema === 'farcaster.xyz/schemas/v1/root' && !!body.blockHash;
}

export function isCast(msg: FC.Message): msg is FC.Cast {
  return isCastShort(msg) || isCastDelete(msg) || isCastRecast(msg);
}
export function isCastShort(msg: FC.Message): msg is FC.Message<FC.CastShortMessageBody> {
  const body = (msg as FC.Message<FC.CastShortMessageBody>).data?.body;
  return body && body.schema === 'farcaster.xyz/schemas/v1/cast-short' && !!body.text && !!body.embed;
}

export function isCastDelete(msg: FC.Message): msg is FC.Message<FC.CastDeleteMessageBody> {
  const body = (msg as FC.Message<FC.CastDeleteMessageBody>).data?.body;
  return body && body.schema === 'farcaster.xyz/schemas/v1/cast-delete' && !!body.targetHash;
}

export function isCastRecast(msg: FC.Message): msg is FC.Message<FC.CastRecastMessageBody> {
  const body = (msg as FC.Message<FC.CastRecastMessageBody>).data?.body;
  return body && body.schema === 'farcaster.xyz/schemas/v1/cast-recast' && !!body.targetCastUri;
}
