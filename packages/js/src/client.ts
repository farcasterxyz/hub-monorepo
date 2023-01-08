import * as flatbuffers from '@hub/flatbuffers';
import { Client as GrpcClient } from '@hub/grpc';
import { HubAsyncResult, HubError } from '@hub/utils';
import { err, Result } from 'neverthrow';
import { WrappedCastAdd, WrappedMessage } from './message';
import { serializeFid, serializeTsHash } from './utils';

const wrapGrpcMessageCall = async <T extends WrappedMessage>(
  call: HubAsyncResult<flatbuffers.Message>
): HubAsyncResult<T> => {
  const response = await call;
  return response.map((flatbufferMessage) => new WrappedMessage(flatbufferMessage) as T);
};

const wrapGrpcMessagesCall = async <T extends WrappedMessage>(
  call: HubAsyncResult<flatbuffers.Message[]>
): HubAsyncResult<T[]> => {
  const response = await call;
  return response.map((flatbufferMessages) => flatbufferMessages.map((message) => new WrappedMessage(message) as T));
};

export class Client {
  private _grpcClient: GrpcClient;

  constructor(address: string) {
    this._grpcClient = new GrpcClient(address);
  }

  /* -------------------------------------------------------------------------- */
  /*                                Submit Methods                              */
  /* -------------------------------------------------------------------------- */

  async submitMessage(message: WrappedMessage): HubAsyncResult<WrappedMessage> {
    const response = await this._grpcClient.submitMessage(message.flatbuffer);
    return response.map((flatbufferMessage) => new WrappedMessage(flatbufferMessage));
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Cast Methods                               */
  /* -------------------------------------------------------------------------- */

  async getCast(fid: number, tsHash: string): HubAsyncResult<WrappedCastAdd> {
    const serializedArgs = Result.combine([serializeFid(fid), serializeTsHash(tsHash)]);

    if (serializedArgs.isErr()) {
      return err(serializedArgs.error);
    }

    return wrapGrpcMessageCall(this._grpcClient.getCast(...serializedArgs.value));
  }

  async getCastsByFid(fid: number): HubAsyncResult<WrappedCastAdd[]> {
    const serializedFid = serializeFid(fid);

    if (serializedFid.isErr()) {
      return err(serializedFid.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getCastsByFid(serializedFid.value));
  }

  async getCastsByParent(parent: flatbuffers.CastId): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.castDefinition().getCastsByParent,
      requests.castRequests.getCastsByParent(parent)
    );
  }

  async getCastsByMention(mention: flatbuffers.UserId): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.castDefinition().getCastsByMention,
      requests.castRequests.getCastsByMention(mention)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                Amp Methods                              */
  /* -------------------------------------------------------------------------- */

  async getAmp(fid: Uint8Array, user: flatbuffers.UserId): HubAsyncResult<flatbuffers.Message> {
    return this.makeUnaryRequest(definitions.ampDefinition().getAmp, requests.ampRequests.getAmp(fid, user));
  }

  async getAmpsByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.ampDefinition().getAmpsByFid,
      requests.ampRequests.getAmpsByFid(fid)
    );
  }

  async getAmpsByUser(user: flatbuffers.UserId): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.ampDefinition().getAmpsByUser,
      requests.ampRequests.getAmpsByUser(user)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                               Reaction Methods                             */
  /* -------------------------------------------------------------------------- */

  async getReaction(
    fid: Uint8Array,
    type: flatbuffers.ReactionType,
    cast: flatbuffers.CastId
  ): HubAsyncResult<flatbuffers.Message> {
    return this.makeUnaryRequest(
      definitions.reactionDefinition().getReaction,
      requests.reactionRequests.getReaction(fid, type, cast)
    );
  }

  async getReactionsByFid(fid: Uint8Array, type?: flatbuffers.ReactionType): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.reactionDefinition().getReactionsByFid,
      requests.reactionRequests.getReactionsByFid(fid, type)
    );
  }

  async getReactionsByCast(
    cast: flatbuffers.CastId,
    type?: flatbuffers.ReactionType
  ): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.reactionDefinition().getReactionsByCast,
      requests.reactionRequests.getReactionsByCast(cast, type)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                             Verification Methods                           */
  /* -------------------------------------------------------------------------- */

  async getVerification(fid: Uint8Array, address: Uint8Array): HubAsyncResult<flatbuffers.Message> {
    return this.makeUnaryRequest(
      definitions.verificationDefinition().getVerification,
      requests.verificationRequests.getVerification(fid, address)
    );
  }

  async getVerificationsByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.verificationDefinition().getVerificationsByFid,
      requests.verificationRequests.getVerificationsByFid(fid)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Signer Methods                             */
  /* -------------------------------------------------------------------------- */

  async getSigner(fid: Uint8Array, signer: Uint8Array): HubAsyncResult<flatbuffers.Message> {
    return this.makeUnaryRequest(
      definitions.signerDefinition().getSigner,
      requests.signerRequests.getSigner(fid, signer)
    );
  }

  async getSignersByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.signerDefinition().getSignersByFid,
      requests.signerRequests.getSignersByFid(fid)
    );
  }

  async getIdRegistryEvent(fid: Uint8Array): HubAsyncResult<flatbuffers.IdRegistryEvent> {
    return this.makeUnaryRequest(
      definitions.signerDefinition().getCustodyEvent,
      requests.signerRequests.getCustodyEvent(fid)
    );
  }

  async getFids(): HubAsyncResult<Uint8Array[]> {
    const method = definitions.signerDefinition().getFids;
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        new flatbuffers.GetFidsRequest(),
        (e: grpc.ServiceError | null, response?: flatbuffers.FidsResponse) => {
          if (e) {
            resolve(err(fromServiceError(e)));
          } else if (response) {
            const fids: Uint8Array[] = [];
            for (let i = 0; i < response.fidsLength(); i++) {
              const fid = response.fids(i)?.fidArray();
              if (fid) {
                fids.push(fid);
              }
            }
            resolve(ok(fids));
          }
        }
      );
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                                User Data Methods                           */
  /* -------------------------------------------------------------------------- */

  async getUserData(fid: Uint8Array, type: flatbuffers.UserDataType): HubAsyncResult<flatbuffers.Message> {
    return this.makeUnaryRequest(
      definitions.userDataDefinition().getUserData,
      requests.userDataRequests.getUserData(fid, type)
    );
  }

  async getUserDataByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.userDataDefinition().getUserDataByFid,
      requests.userDataRequests.getUserDataByFid(fid)
    );
  }

  async getNameRegistryEvent(fname: Uint8Array): HubAsyncResult<flatbuffers.NameRegistryEvent> {
    return this.makeUnaryRequest(
      definitions.userDataDefinition().getNameRegistryEvent,
      requests.userDataRequests.getNameRegistryEvent(fname)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Bulk Methods                             */
  /* -------------------------------------------------------------------------- */

  async getAllCastMessagesByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.bulkDefinition().getAllCastMessagesByFid,
      requests.bulkRequests.createMessagesByFidRequest(fid)
    );
  }

  async getAllAmpMessagesByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.bulkDefinition().getAllAmpMessagesByFid,
      requests.bulkRequests.createMessagesByFidRequest(fid)
    );
  }

  async getAllReactionMessagesByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.bulkDefinition().getAllReactionMessagesByFid,
      requests.bulkRequests.createMessagesByFidRequest(fid)
    );
  }

  async getAllVerificationMessagesByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.bulkDefinition().getAllVerificationMessagesByFid,
      requests.bulkRequests.createMessagesByFidRequest(fid)
    );
  }

  async getAllSignerMessagesByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.bulkDefinition().getAllSignerMessagesByFid,
      requests.bulkRequests.createMessagesByFidRequest(fid)
    );
  }

  async getAllUserDataMessagesByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.bulkDefinition().getAllUserDataMessagesByFid,
      requests.bulkRequests.createMessagesByFidRequest(fid)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Event Methods                             */
  /* -------------------------------------------------------------------------- */

  async subscribe(): HubAsyncResult<ClientReadableStream<flatbuffers.EventResponse>> {
    const method = definitions.eventDefinition().subscribe;
    const request = new flatbuffers.SubscribeRequest();
    const stream = this.client.makeServerStreamRequest(
      method.path,
      method.requestSerialize,
      method.responseDeserialize,
      request
    );
    stream.on('error', (e) => {
      return e; // Suppress exceptions
    });
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        stream.cancel(); // Cancel if not connected within timeout
        reject(err(new HubError('unavailable.network_failure', 'subscribe timed out')));
      }, 1_000);
      stream.on('metadata', (metadata: Metadata) => {
        clearTimeout(timeout);
        if (metadata.get('status')[0] === ('ready' as MetadataValue)) {
          resolve(ok(stream));
        } else {
          reject(err(new HubError('unavailable.network_failure', 'subscribe failed')));
        }
      });
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Private Methods                             */
  /* -------------------------------------------------------------------------- */
}
