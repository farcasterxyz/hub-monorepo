import * as flatbuffers from '@hub/flatbuffers';
import { Client as GrpcClient } from '@hub/grpc';
import { HubAsyncResult, HubResult } from '@hub/utils';
import { validateReactionType } from '@hub/utils/src/validations';
import { err, ok, Result } from 'neverthrow';
import { makeMessageFromFlatbuffer } from './builders';
import * as types from './types';
import { serializeCastId, serializeEthAddress, serializeFid, serializeTsHash, serializeUserId } from './utils';

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
    const serializedArgs = Result.combine([serializeFid(fid), validateReactionType(type), serializeCastId(cast)]);

    if (serializedArgs.isErr()) {
      return err(serializedArgs.error);
    }

    return wrapGrpcMessageCall(this._grpcClient.getReaction(...serializedArgs.value));
  }

  async getReactionsByFid(fid: number, type?: types.ReactionType): HubAsyncResult<types.ReactionAddMessage[]> {
    const serializedArgs = Result.combine([serializeFid(fid), type ? validateReactionType(type) : ok(undefined)]);

    if (serializedArgs.isErr()) {
      return err(serializedArgs.error);
    }

    return wrapGrpcMessagesCall(
      // Spread operator complains without the explicit type here
      this._grpcClient.getReactionsByFid(...(serializedArgs.value as [Uint8Array, types.ReactionType | undefined]))
    );
  }

  async getReactionsByCast(cast: types.CastId, type?: types.ReactionType): HubAsyncResult<types.ReactionAddMessage[]> {
    const serializedArgs = Result.combine([serializeCastId(cast), type ? validateReactionType(type) : ok(undefined)]);

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

  // async getSigner(fid: Uint8Array, signer: Uint8Array): HubAsyncResult<flatbuffers.Message> {
  //   return this.makeUnaryRequest(
  //     definitions.signerDefinition().getSigner,
  //     requests.signerRequests.getSigner(fid, signer)
  //   );
  // }

  // async getSignersByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
  //   return this.makeUnaryMessagesRequest(
  //     definitions.signerDefinition().getSignersByFid,
  //     requests.signerRequests.getSignersByFid(fid)
  //   );
  // }

  /* -------------------------------------------------------------------------- */
  /*                                User Data Methods                           */
  /* -------------------------------------------------------------------------- */

  // async getUserData(fid: Uint8Array, type: flatbuffers.UserDataType): HubAsyncResult<flatbuffers.Message> {
  //   return this.makeUnaryRequest(
  //     definitions.userDataDefinition().getUserData,
  //     requests.userDataRequests.getUserData(fid, type)
  //   );
  // }

  // async getUserDataByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
  //   return this.makeUnaryMessagesRequest(
  //     definitions.userDataDefinition().getUserDataByFid,
  //     requests.userDataRequests.getUserDataByFid(fid)
  //   );
  // }

  /* -------------------------------------------------------------------------- */
  /*                                   Bulk Methods                             */
  /* -------------------------------------------------------------------------- */

  // async getAllCastMessagesByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
  //   return this.makeUnaryMessagesRequest(
  //     definitions.bulkDefinition().getAllCastMessagesByFid,
  //     requests.bulkRequests.createMessagesByFidRequest(fid)
  //   );
  // }

  // async getAllAmpMessagesByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
  //   return this.makeUnaryMessagesRequest(
  //     definitions.bulkDefinition().getAllAmpMessagesByFid,
  //     requests.bulkRequests.createMessagesByFidRequest(fid)
  //   );
  // }

  // async getAllReactionMessagesByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
  //   return this.makeUnaryMessagesRequest(
  //     definitions.bulkDefinition().getAllReactionMessagesByFid,
  //     requests.bulkRequests.createMessagesByFidRequest(fid)
  //   );
  // }

  // async getAllVerificationMessagesByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
  //   return this.makeUnaryMessagesRequest(
  //     definitions.bulkDefinition().getAllVerificationMessagesByFid,
  //     requests.bulkRequests.createMessagesByFidRequest(fid)
  //   );
  // }

  // async getAllSignerMessagesByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
  //   return this.makeUnaryMessagesRequest(
  //     definitions.bulkDefinition().getAllSignerMessagesByFid,
  //     requests.bulkRequests.createMessagesByFidRequest(fid)
  //   );
  // }

  // async getAllUserDataMessagesByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
  //   return this.makeUnaryMessagesRequest(
  //     definitions.bulkDefinition().getAllUserDataMessagesByFid,
  //     requests.bulkRequests.createMessagesByFidRequest(fid)
  //   );
  // }

  /* -------------------------------------------------------------------------- */
  /*                                  Event Methods                             */
  /* -------------------------------------------------------------------------- */

  // TODO: subscribe
}
