import * as flatbuffers from '@hub/flatbuffers';
import { bytesToHexString, bytesToNumber, fromFarcasterTime, HubError, HubResult } from '@hub/utils';
import { err, ok } from 'neverthrow';
import * as types from './types';

export const toMessageData = (fbb: flatbuffers.MessageData): HubResult<types.MessageData> => {
  const timestamp = fromFarcasterTime(fbb.timestamp());

  const fid = bytesToNumber(fbb.fidArray() ?? new Uint8Array());
  if (fid.isErr()) {
    return err(fid.error);
  }

  const type = fbb.type();
  if (!type) {
    return err(new HubError('bad_request.invalid_param', 'type is missing'));
  }

  if (!Object.values(flatbuffers.MessageType).includes(type)) {
    return err(new HubError('bad_request.invalid_param', 'type is invalid'));
  }

  let bodyResult: HubResult<types.MessageBody>;
  if (fbb.bodyType() === flatbuffers.MessageBody.CastAddBody) {
    bodyResult = toCastAddBody(fbb.body(new flatbuffers.CastAddBody()));
  } else if (fbb.bodyType() === flatbuffers.MessageBody.CastRemoveBody) {
    bodyResult = toCastRemoveBody(fbb.body(new flatbuffers.CastRemoveBody()));
  } else {
    return err(new HubError('bad_request.invalid_param', 'bodyType is invalid'));
  }

  if (bodyResult.isErr()) {
    return err(bodyResult.error);
  }

  return ok({
    body: bodyResult.value,
    type,
    timestamp,
    fid: fid.value,
    network: fbb.network(),
  });
};

export const toCastAddBody = (fbb: flatbuffers.CastAddBody): HubResult<types.CastAddBody> => {
  const text = fbb.text();
  if (!text) {
    return err(new HubError('bad_request.invalid_param', 'text is missing'));
  }

  // TODO: embeds
  // TODO: mentions
  // TODO: parent

  return ok({
    text,
  });
};

export const toCastRemoveBody = (fbb: flatbuffers.CastRemoveBody): HubResult<types.CastRemoveBody> => {
  const targetTsHash = bytesToHexString(fbb.targetTsHashArray() ?? new Uint8Array());

  if (targetTsHash.isErr()) {
    return err(targetTsHash.error);
  }

  return ok({ targetTsHash: targetTsHash.value });
};

// body():
//     | message_generated.CastAddBody
//     | message_generated.CastRemoveBody
//     | message_generated.AmpBody
//     | message_generated.VerificationAddEthAddressBody
//     | message_generated.VerificationRemoveBody
//     | message_generated.SignerBody
//     | message_generated.UserDataBody
//     | message_generated.ReactionBody {
//     if (this.data.bodyType() === message_generated.MessageBody.CastAddBody) {
//       return this.data.body(new message_generated.CastAddBody()) as message_generated.CastAddBody;
//     } else if (this.data.bodyType() === message_generated.MessageBody.CastRemoveBody) {
//       return this.data.body(new message_generated.CastRemoveBody()) as message_generated.CastRemoveBody;
//     } else if (this.data.bodyType() === message_generated.MessageBody.AmpBody) {
//       return this.data.body(new message_generated.AmpBody()) as message_generated.AmpBody;
//     } else if (this.data.bodyType() === message_generated.MessageBody.VerificationAddEthAddressBody) {
//       return this.data.body(
//         new message_generated.VerificationAddEthAddressBody()
//       ) as message_generated.VerificationAddEthAddressBody;
//     } else if (this.data.bodyType() === message_generated.MessageBody.VerificationRemoveBody) {
//       return this.data.body(new message_generated.VerificationRemoveBody()) as message_generated.VerificationRemoveBody;
//     } else if (this.data.bodyType() === message_generated.MessageBody.SignerBody) {
//       return this.data.body(new message_generated.SignerBody()) as message_generated.SignerBody;
//     } else if (this.data.bodyType() === message_generated.MessageBody.UserDataBody) {
//       return this.data.body(new message_generated.UserDataBody()) as message_generated.UserDataBody;
//     } else if (this.data.bodyType() === message_generated.MessageBody.ReactionBody) {
//       return this.data.body(new message_generated.ReactionBody()) as message_generated.ReactionBody;
//     }

//     throw new Error('invalid bodyType');
//   }
