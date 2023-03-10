import * as protobufs from '@farcaster/protobufs';
import {
  getInsecureHubRpcClient,
  getSSLHubRpcClient,
  HubAsyncResult,
  HubError,
  HubResult,
  HubRpcClient,
} from '@farcaster/utils';
import { err, Result } from 'neverthrow';
import * as types from './types';
import * as utils from './utils';

export type EventFilters = {
  eventTypes?: protobufs.HubEventType[];
  fromId?: number;
};

const deserializeCall = async <TDeserialized, TProtobuf>(
  call: HubAsyncResult<TProtobuf>,
  deserialize: (protobuf: TProtobuf) => HubResult<TDeserialized>
): HubAsyncResult<TDeserialized> => {
  const response = await call;
  return response.andThen((protobuf) => deserialize(protobuf));
};

const wrapGrpcMessageCall = async <T extends types.Message>(
  call: HubAsyncResult<protobufs.Message>
): HubAsyncResult<T> => {
  const response = await call;
  return response.andThen((protobuf) => utils.deserializeMessage(protobuf) as HubResult<T>);
};

const wrapGrpcMessagesCall = async <T extends types.Message>(
  call: HubAsyncResult<protobufs.MessagesResponse>
): HubAsyncResult<T[]> => {
  const response = await call;
  return response.andThen((messagesResponse) => {
    return Result.combine(
      messagesResponse.messages.map((protobuf) => {
        return utils.deserializeMessage(protobuf) as HubResult<T>;
      })
    );
  });
};

export class Client {
  public _grpcClient: HubRpcClient;
  private usingSsl: boolean;

  constructor(address: string, ssl = false) {
    this.usingSsl = ssl;
    if (!ssl) {
      this._grpcClient = getInsecureHubRpcClient(address);
    } else {
      this._grpcClient = getSSLHubRpcClient(address);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                Submit Methods                              */
  /* -------------------------------------------------------------------------- */

  async submitMessage(message: types.Message, username?: string, password?: string): HubAsyncResult<types.Message> {
    const metadata = new protobufs.Metadata();
    if (username && password) {
      if (this.usingSsl) {
        metadata.set('authorization', `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`);
      } else {
        return err(new HubError('unavailable', 'Cannot use basic auth without SSL'));
      }
    }
    return wrapGrpcMessageCall(this._grpcClient.submitMessage(message._protobuf, metadata));
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Cast Methods                               */
  /* -------------------------------------------------------------------------- */

  async getCast(fid: number, hash: string): HubAsyncResult<types.CastAddMessage> {
    const castId = utils.serializeCastId({ fid, hash });
    if (castId.isErr()) {
      return err(castId.error);
    }

    return wrapGrpcMessageCall(this._grpcClient.getCast(castId.value));
  }

  async getCastsByFid(fid: number): HubAsyncResult<types.CastAddMessage[]> {
    const fidRequest = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getCastsByFid(fidRequest));
  }

  async getCastsByParent(parent: types.CastId): HubAsyncResult<types.CastAddMessage[]> {
    const serializedCastId = utils.serializeCastId(parent);
    if (serializedCastId.isErr()) {
      return err(serializedCastId.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getCastsByParent(serializedCastId.value));
  }

  async getCastsByMention(mentionFid: number): HubAsyncResult<types.CastAddMessage[]> {
    const fidRequest = protobufs.FidRequest.create({ fid: mentionFid });
    return wrapGrpcMessagesCall(this._grpcClient.getCastsByMention(fidRequest));
  }

  async getAllCastMessagesByFid(fid: number): HubAsyncResult<(types.CastAddMessage | types.CastRemoveMessage)[]> {
    const request = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getAllCastMessagesByFid(request));
  }

  /* -------------------------------------------------------------------------- */
  /*                               Reaction Methods                             */
  /* -------------------------------------------------------------------------- */

  async getReaction(
    fid: number,
    type: types.ReactionType,
    cast: types.CastId
  ): HubAsyncResult<types.ReactionAddMessage> {
    const serializedCastId = utils.serializeCastId(cast);
    if (serializedCastId.isErr()) {
      return err(serializedCastId.error);
    }

    const reactionRequest = protobufs.ReactionRequest.create({
      fid,
      reactionType: type,
      castId: serializedCastId.value,
    });
    return wrapGrpcMessageCall(this._grpcClient.getReaction(reactionRequest));
  }

  async getReactionsByFid(fid: number, type?: types.ReactionType): HubAsyncResult<types.ReactionAddMessage[]> {
    const request = protobufs.ReactionsByFidRequest.create({
      fid,
      reactionType: type ?? types.ReactionType.NONE,
    });
    return wrapGrpcMessagesCall(this._grpcClient.getReactionsByFid(request));
  }

  async getReactionsByCast(cast: types.CastId, type?: types.ReactionType): HubAsyncResult<types.ReactionAddMessage[]> {
    const serializedCastId = utils.serializeCastId(cast);
    if (serializedCastId.isErr()) {
      return err(serializedCastId.error);
    }
    const request = protobufs.ReactionsByCastRequest.create({
      castId: serializedCastId.value,
      reactionType: type ?? types.ReactionType.NONE,
    });
    return wrapGrpcMessagesCall(this._grpcClient.getReactionsByCast(request));
  }

  async getAllReactionMessagesByFid(
    fid: number
  ): HubAsyncResult<(types.ReactionAddMessage | types.ReactionRemoveMessage)[]> {
    const request = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getAllReactionMessagesByFid(request));
  }

  /* -------------------------------------------------------------------------- */
  /*                             Verification Methods                           */
  /* -------------------------------------------------------------------------- */

  async getVerification(fid: number, address: string): HubAsyncResult<types.VerificationAddEthAddressMessage> {
    const serializedAddress = utils.serializeEthAddress(address);
    if (serializedAddress.isErr()) {
      return err(serializedAddress.error);
    }
    const request = protobufs.VerificationRequest.create({ fid, address: serializedAddress.value });
    return wrapGrpcMessageCall(this._grpcClient.getVerification(request));
  }

  async getVerificationsByFid(fid: number): HubAsyncResult<types.VerificationAddEthAddressMessage[]> {
    const request = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getVerificationsByFid(request));
  }

  async getAllVerificationMessagesByFid(
    fid: number
  ): HubAsyncResult<(types.VerificationAddEthAddressMessage | types.VerificationRemoveMessage)[]> {
    const request = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getAllVerificationMessagesByFid(request));
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Signer Methods                             */
  /* -------------------------------------------------------------------------- */

  async getSigner(fid: number, signer: string): HubAsyncResult<types.SignerAddMessage> {
    const serializedSigner = utils.serializeEd25519PublicKey(signer);
    if (serializedSigner.isErr()) {
      return err(serializedSigner.error);
    }
    const request = protobufs.SignerRequest.create({ fid, signer: serializedSigner.value });
    return wrapGrpcMessageCall(this._grpcClient.getSigner(request));
  }

  async getSignersByFid(fid: number): HubAsyncResult<types.SignerAddMessage[]> {
    const request = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getSignersByFid(request));
  }

  async getAllSignerMessagesByFid(fid: number): HubAsyncResult<(types.SignerAddMessage | types.SignerRemoveMessage)[]> {
    const request = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getAllSignerMessagesByFid(request));
  }

  /* -------------------------------------------------------------------------- */
  /*                                User Data Methods                           */
  /* -------------------------------------------------------------------------- */

  async getUserData(fid: number, type: types.UserDataType): HubAsyncResult<types.UserDataAddMessage> {
    const request = protobufs.UserDataRequest.create({ fid, userDataType: type });
    return wrapGrpcMessageCall(this._grpcClient.getUserData(request));
  }

  async getUserDataByFid(fid: number): HubAsyncResult<types.UserDataAddMessage[]> {
    const request = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getUserDataByFid(request));
  }

  async getAllUserDataMessagesByFid(fid: number): HubAsyncResult<types.UserDataAddMessage[]> {
    const request = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getAllUserDataMessagesByFid(request));
  }

  /* -------------------------------------------------------------------------- */
  /*                               Contract Methods                             */
  /* -------------------------------------------------------------------------- */

  async getIdRegistryEvent(fid: number): HubAsyncResult<types.IdRegistryEvent> {
    const request = protobufs.FidRequest.create({ fid });
    return deserializeCall(this._grpcClient.getIdRegistryEvent(request), utils.deserializeIdRegistryEvent);
  }

  async getNameRegistryEvent(fname: string): HubAsyncResult<types.NameRegistryEvent> {
    const serializedFname = utils.serializeFname(fname);

    if (serializedFname.isErr()) {
      return err(serializedFname.error);
    }
    const request = protobufs.NameRegistryEventRequest.create({ name: serializedFname.value });
    return deserializeCall(this._grpcClient.getNameRegistryEvent(request), utils.deserializeNameRegistryEvent);
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Submit Methods                             */
  /* -------------------------------------------------------------------------- */

  async subscribe(filters: EventFilters = {}) {
    const request = protobufs.SubscribeRequest.create({ ...filters });
    return this._grpcClient.subscribe(request);
  }
}
