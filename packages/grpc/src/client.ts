import * as flatbuffers from '@farcaster/flatbuffers';
import { HubAsyncResult, HubError } from '@farcaster/utils';
import grpc, { ClientReadableStream, Metadata, MetadataValue } from '@grpc/grpc-js';
import { ByteBuffer } from 'flatbuffers';
import { err, ok } from 'neverthrow';
import * as definitions from './definitions';
import * as requests from './requests';
import { fromServiceError } from './utils';

export class Client {
  protected client: grpc.Client;

  constructor(address: string) {
    this.client = new grpc.Client(address, grpc.credentials.createInsecure());
  }

  close() {
    this.client.close();
  }

  /* -------------------------------------------------------------------------- */
  /*                                Submit Methods                              */
  /* -------------------------------------------------------------------------- */

  async submitMessage(message: flatbuffers.Message): HubAsyncResult<flatbuffers.Message> {
    return this.makeUnaryRequest(definitions.submitDefinition().submitMessage, message);
  }

  async submitIdRegistryEvent(event: flatbuffers.IdRegistryEvent): HubAsyncResult<flatbuffers.IdRegistryEvent> {
    return this.makeUnaryRequest(definitions.submitDefinition().submitIdRegistryEvent, event);
  }

  async submitNameRegistryEvent(event: flatbuffers.NameRegistryEvent): HubAsyncResult<flatbuffers.NameRegistryEvent> {
    return this.makeUnaryRequest(definitions.submitDefinition().submitNameRegistryEvent, event);
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Cast Methods                               */
  /* -------------------------------------------------------------------------- */

  async getCast(fid: Uint8Array, tsHash: Uint8Array): HubAsyncResult<flatbuffers.Message> {
    return this.makeUnaryRequest(definitions.castDefinition().getCast, requests.castRequests.getCast(fid, tsHash));
  }

  async getCastsByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.castDefinition().getCastsByFid,
      requests.castRequests.getCastsByFid(fid)
    );
  }

  async getCastsByParent(parent: flatbuffers.CastIdT): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.castDefinition().getCastsByParent,
      requests.castRequests.getCastsByParent(parent)
    );
  }

  async getCastsByMention(mention: flatbuffers.UserIdT): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.castDefinition().getCastsByMention,
      requests.castRequests.getCastsByMention(mention)
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                Amp Methods                              */
  /* -------------------------------------------------------------------------- */

  async getAmp(fid: Uint8Array, user: flatbuffers.UserIdT): HubAsyncResult<flatbuffers.Message> {
    return this.makeUnaryRequest(definitions.ampDefinition().getAmp, requests.ampRequests.getAmp(fid, user));
  }

  async getAmpsByFid(fid: Uint8Array): HubAsyncResult<flatbuffers.Message[]> {
    return this.makeUnaryMessagesRequest(
      definitions.ampDefinition().getAmpsByFid,
      requests.ampRequests.getAmpsByFid(fid)
    );
  }

  async getAmpsByUser(user: flatbuffers.UserIdT): HubAsyncResult<flatbuffers.Message[]> {
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
    cast: flatbuffers.CastIdT
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
    cast: flatbuffers.CastIdT,
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
  /*                              Protected Methods                             */
  /* -------------------------------------------------------------------------- */

  protected makeUnaryRequest<RequestType, ResponseType>(
    method: grpc.MethodDefinition<RequestType, ResponseType>,
    request: RequestType
  ): HubAsyncResult<ResponseType> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: ResponseType) => {
          if (e) {
            resolve(err(fromServiceError(e)));
          } else if (response) {
            resolve(ok(response));
          }
        }
      );
    });
  }

  protected makeUnaryMessagesRequest<RequestType, ResponseMessageType extends flatbuffers.Message>(
    method: grpc.MethodDefinition<RequestType, flatbuffers.MessagesResponse>,
    request: RequestType
  ): HubAsyncResult<ResponseMessageType[]> {
    return new Promise((resolve) => {
      this.client.makeUnaryRequest(
        method.path,
        method.requestSerialize,
        method.responseDeserialize,
        request,
        (e: grpc.ServiceError | null, response?: flatbuffers.MessagesResponse) => {
          if (e) {
            resolve(err(fromServiceError(e)));
          } else if (response) {
            const messages: ResponseMessageType[] = [];
            for (let i = 0; i < response.messagesLength(); i++) {
              const bytes = response.messages(i)?.messageBytesArray() ?? new Uint8Array();
              const message = flatbuffers.Message.getRootAsMessage(new ByteBuffer(bytes)) as ResponseMessageType;
              messages.push(message);
            }
            resolve(ok(messages));
          }
        }
      );
    });
  }
}
