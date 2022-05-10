import * as FC from '~/types';

export function isRoot(msg: FC.Message): msg is FC.Root {
  const body = (msg as FC.Root).data?.body;
  return body && body.schema === 'farcaster.xyz/schemas/v1/root' && !!body.blockHash;
}

export function isCast(msg: FC.Message): msg is FC.Cast {
  return isCastShort(msg) || isCastDelete(msg) || isCastRecast(msg);
}
export function isCastShort(msg: FC.Message): msg is FC.CastShort {
  const body = (msg as FC.CastShort).data?.body;
  return body && body.schema === 'farcaster.xyz/schemas/v1/cast-short' && typeof body.text === 'string' && !!body.embed;
}

export function isCastDelete(msg: FC.Message): msg is FC.CastDelete {
  const body = (msg as FC.CastDelete).data?.body;
  return body && body.schema === 'farcaster.xyz/schemas/v1/cast-delete' && typeof body.targetHash === 'string';
}

export function isCastRecast(msg: FC.Message): msg is FC.CastRecast {
  const body = (msg as FC.CastRecast).data?.body;
  return body && body.schema === 'farcaster.xyz/schemas/v1/cast-recast' && typeof body.targetCastUri === 'string';
}

export function isReaction(msg: FC.Message): msg is FC.Reaction {
  const body = (msg as FC.Reaction).data?.body;
  return (
    body &&
    body.schema === 'farcaster.xyz/schemas/v1/reaction' &&
    typeof body.active === 'boolean' &&
    typeof body.targetUri === 'string' &&
    !!body.type
  );
}
