import * as flatbuffers from '@farcaster/flatbuffers';
import { Client as GrpcClient } from '@farcaster/grpc';
import { HubAsyncResult, HubResult, validations } from '@farcaster/utils';
import { err, ok, Result } from 'neverthrow';
import { makeMessageFromFlatbuffer } from './builders';
import * as types from './types';
import {
  serializeCastId,
  serializeEd25519PublicKey,
  serializeEthAddress,
  serializeFid,
  serializeTsHash,
  serializeUserId,
} from './utils';

const wrapGrpcMessageCall = async <T extends types.Message>(
  call: HubAsyncResult<flatbuffers.Message>
): HubAsyncResult<T> => {
  const response = await call;
  return response.andThen((flatbuffer) => makeMessageFromFlatbuffer(flatbuffer) as HubResult<T>);
};

const wrapGrpcMessagesCall = async <T extends types.Message>(
  call: HubAsyncResult<flatbuffers.Message[]>
): HubAsyncResult<T[]> => {
  const response = await call;
  return response.andThen((flatbuffers) =>
    Result.combine(flatbuffers.map((flatbuffer) => makeMessageFromFlatbuffer(flatbuffer) as HubResult<T>))
  );
};

export class Client {
  private _grpcClient: GrpcClient;

  constructor(address: string) {
    this._grpcClient = new GrpcClient(address);
  }

  /* -------------------------------------------------------------------------- */
  /*                                Submit Methods                              */
  /* -------------------------------------------------------------------------- */

  async submitMessage(message: types.Message): HubAsyncResult<types.Message> {
    const response = await this._grpcClient.submitMessage(message.flatbuffer);
    return response.andThen((flatbuffer) => makeMessageFromFlatbuffer(flatbuffer));
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Cast Methods                               */
  /* -------------------------------------------------------------------------- */

  async getCast(fid: number, tsHash: string): HubAsyncResult<types.CastAddMessage> {
    const serializedArgs = Result.combine([serializeFid(fid), serializeTsHash(tsHash)]);

    if (serializedArgs.isErr()) {
      return err(serializedArgs.error);
    }

    return wrapGrpcMessageCall(this._grpcClient.getCast(...serializedArgs.value));
  }

  async getCastsByFid(fid: number): HubAsyncResult<types.CastAddMessage[]> {
    const serializedFid = serializeFid(fid);

    if (serializedFid.isErr()) {
      return err(serializedFid.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getCastsByFid(serializedFid.value));
  }

  async getCastsByParent(parent: types.CastId): HubAsyncResult<types.CastAddMessage[]> {
    const serializedCastId = serializeCastId(parent);

    if (serializedCastId.isErr()) {
      return err(serializedCastId.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getCastsByParent(serializedCastId.value));
  }

  async getCastsByMention(mention: number): HubAsyncResult<types.CastAddMessage[]> {
    const serializedUserId = serializeUserId(mention);

    if (serializedUserId.isErr()) {
      return err(serializedUserId.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getCastsByMention(serializedUserId.value));
  }

  /* -------------------------------------------------------------------------- */
  /*                                Amp Methods                              */
  /* -------------------------------------------------------------------------- */

  async getAmp(fid: number, user: number): HubAsyncResult<types.AmpAddMessage> {
    const serializedArgs = Result.combine([serializeFid(fid), serializeUserId(user)]);

    if (serializedArgs.isErr()) {
      return err(serializedArgs.error);
    }

    return wrapGrpcMessageCall(this._grpcClient.getAmp(...serializedArgs.value));
  }

  async getAmpsByFid(fid: number): HubAsyncResult<types.AmpAddMessage[]> {
    const serializedFid = serializeFid(fid);

    if (serializedFid.isErr()) {
      return err(serializedFid.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getAmpsByFid(serializedFid.value));
  }

  async getAmpsByUser(user: number): HubAsyncResult<types.AmpAddMessage[]> {
    const serializedUserId = serializeUserId(user);

    if (serializedUserId.isErr()) {
      return err(serializedUserId.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getAmpsByUser(serializedUserId.value));
  }

  /* -------------------------------------------------------------------------- */
  /*                               Reaction Methods                             */
  /* -------------------------------------------------------------------------- */

  async getReaction(
    fid: number,
    type: types.ReactionType,
    cast: types.CastId
  ): HubAsyncResult<types.ReactionAddMessage> {
    const serializedArgs = Result.combine([
      serializeFid(fid),
      validations.validateReactionType(type),
      serializeCastId(cast),
    ]);

    if (serializedArgs.isErr()) {
      return err(serializedArgs.error);
    }

    return wrapGrpcMessageCall(this._grpcClient.getReaction(...serializedArgs.value));
  }

  async getReactionsByFid(fid: number, type?: types.ReactionType): HubAsyncResult<types.ReactionAddMessage[]> {
    const serializedArgs = Result.combine([
      serializeFid(fid),
      type ? validations.validateReactionType(type) : ok(undefined),
    ]);

    if (serializedArgs.isErr()) {
      return err(serializedArgs.error);
    }

    return wrapGrpcMessagesCall(
      // Spread operator complains without the explicit type here
      this._grpcClient.getReactionsByFid(...(serializedArgs.value as [Uint8Array, types.ReactionType | undefined]))
    );
  }

  async getReactionsByCast(cast: types.CastId, type?: types.ReactionType): HubAsyncResult<types.ReactionAddMessage[]> {
    const serializedArgs = Result.combine([
      serializeCastId(cast),
      type ? validations.validateReactionType(type) : ok(undefined),
    ]);

    if (serializedArgs.isErr()) {
      return err(serializedArgs.error);
    }

    return wrapGrpcMessagesCall(
      this._grpcClient.getReactionsByCast(
        // Spread operator complains without the explicit type here
        ...(serializedArgs.value as [flatbuffers.CastIdT, types.ReactionType | undefined])
      )
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                             Verification Methods                           */
  /* -------------------------------------------------------------------------- */

  async getVerification(fid: number, address: string): HubAsyncResult<types.VerificationAddEthAddressMessage> {
    const serializedArgs = Result.combine([serializeFid(fid), serializeEthAddress(address)]);

    if (serializedArgs.isErr()) {
      return err(serializedArgs.error);
    }

    return wrapGrpcMessageCall(this._grpcClient.getVerification(...serializedArgs.value));
  }

  async getVerificationsByFid(fid: number): HubAsyncResult<types.VerificationAddEthAddressMessage[]> {
    const serializedFid = serializeFid(fid);

    if (serializedFid.isErr()) {
      return err(serializedFid.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getVerificationsByFid(serializedFid.value));
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Signer Methods                             */
  /* -------------------------------------------------------------------------- */

  async getSigner(fid: number, signer: string): HubAsyncResult<types.SignerAddMessage> {
    const serializedArgs = Result.combine([serializeFid(fid), serializeEd25519PublicKey(signer)]);

    if (serializedArgs.isErr()) {
      return err(serializedArgs.error);
    }

    return wrapGrpcMessageCall(this._grpcClient.getSigner(...serializedArgs.value));
  }

  async getSignersByFid(fid: number): HubAsyncResult<types.SignerAddMessage[]> {
    const serializedFid = serializeFid(fid);

    if (serializedFid.isErr()) {
      return err(serializedFid.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getSignersByFid(serializedFid.value));
  }

  /* -------------------------------------------------------------------------- */
  /*                                User Data Methods                           */
  /* -------------------------------------------------------------------------- */

  async getUserData(fid: number, type: types.UserDataType): HubAsyncResult<types.UserDataAddMessage> {
    const serializedArgs = Result.combine([serializeFid(fid), validations.validateUserDataType(type)]);

    if (serializedArgs.isErr()) {
      return err(serializedArgs.error);
    }

    return wrapGrpcMessageCall(this._grpcClient.getUserData(...serializedArgs.value));
  }

  async getUserDataByFid(fid: number): HubAsyncResult<types.UserDataAddMessage[]> {
    const serializedFid = serializeFid(fid);

    if (serializedFid.isErr()) {
      return err(serializedFid.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getUserDataByFid(serializedFid.value));
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Bulk Methods                             */
  /* -------------------------------------------------------------------------- */

  async getAllCastMessagesByFid(fid: number): HubAsyncResult<(types.CastAddMessage | types.CastRemoveMessage)[]> {
    const serializedFid = serializeFid(fid);

    if (serializedFid.isErr()) {
      return err(serializedFid.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getAllCastMessagesByFid(serializedFid.value));
  }

  async getAllAmpMessagesByFid(fid: number): HubAsyncResult<(types.AmpAddMessage | types.AmpRemoveMessage)[]> {
    const serializedFid = serializeFid(fid);

    if (serializedFid.isErr()) {
      return err(serializedFid.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getAllAmpMessagesByFid(serializedFid.value));
  }

  async getAllReactionMessagesByFid(
    fid: number
  ): HubAsyncResult<(types.ReactionAddMessage | types.ReactionRemoveMessage)[]> {
    const serializedFid = serializeFid(fid);

    if (serializedFid.isErr()) {
      return err(serializedFid.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getAllReactionMessagesByFid(serializedFid.value));
  }

  async getAllVerificationMessagesByFid(
    fid: number
  ): HubAsyncResult<(types.VerificationAddEthAddressMessage | types.VerificationRemoveMessage)[]> {
    const serializedFid = serializeFid(fid);

    if (serializedFid.isErr()) {
      return err(serializedFid.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getAllVerificationMessagesByFid(serializedFid.value));
  }

  async getAllSignerMessagesByFid(fid: number): HubAsyncResult<(types.SignerAddMessage | types.SignerRemoveMessage)[]> {
    const serializedFid = serializeFid(fid);

    if (serializedFid.isErr()) {
      return err(serializedFid.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getAllSignerMessagesByFid(serializedFid.value));
  }

  async getAllUserDataMessagesByFid(fid: number): HubAsyncResult<types.UserDataAddMessage[]> {
    const serializedFid = serializeFid(fid);

    if (serializedFid.isErr()) {
      return err(serializedFid.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getAllUserDataMessagesByFid(serializedFid.value));
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Event Methods                             */
  /* -------------------------------------------------------------------------- */

  // TODO: subscribe
}
