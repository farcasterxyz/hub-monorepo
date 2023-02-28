import * as protobufs from '@farcaster/protobufs';
import { getHubRpcClient, HubAsyncResult, HubResult, HubRpcClient } from '@farcaster/utils';
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
  /**
   * TODO DOCS: description
   *
   * TODO DOCS: usage example, here's the structure:
   * @example
   * ```typescript
   * import { ... } from '@farcaster/js';
   *
   * const client = new Client(...)
   *
   * ...
   * ```
   *
   * @param ...
   *
   * @returns ...
   */
  public _grpcClient: HubRpcClient;

  constructor(address: string) {
    this._grpcClient = getHubRpcClient(address);
  }

  /* -------------------------------------------------------------------------- */
  /*                                Submit Methods                              */
  /* -------------------------------------------------------------------------- */

  /**
   * TODO DOCS: description
   *
   * TODO DOCS: usage example, here's the structure:
   * @example
   * ```typescript
   * import { ... } from '@farcaster/js';
   *
   * const client = new Client(...)
   * const result = await client.get...
   * console.log(result)
   *
   * // Output: ...
   * ```
   *
   * @param ...
   *
   * @returns ...
   */
  async submitMessage(message: types.Message): HubAsyncResult<types.Message> {
    return wrapGrpcMessageCall(this._grpcClient.submitMessage(message._protobuf));
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Cast Methods                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Get a cast.
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<CastAddMessage>` | [`CastAddMessage`](../modules/types.md#castaddmessage) | A `HubAsyncResult` that contains the valid `CastAddMessage`. |
   *
   * @param {number} fid - The fid from which the cast originates from.
   * @param {string} hash - The hash of the cast.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   */
  async getCast(fid: number, hash: string): HubAsyncResult<types.CastAddMessage> {
    const castId = utils.serializeCastId({ fid, hash });
    if (castId.isErr()) {
      return err(castId.error);
    }

    return wrapGrpcMessageCall(this._grpcClient.getCast(castId.value));
  }

  /**
   * Get casts by fid.
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<CastAddMessage[]>` | [`CastAddMessage`](../modules/types.md#castaddmessage)[] | A `HubAsyncResult` that contains the valid `CastAddMessage` array. |
   *
   * @param {number} fid - The fid from which the cast originates from.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   *
   */
  async getCastsByFid(fid: number): HubAsyncResult<types.CastAddMessage[]> {
    const fidRequest = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getCastsByFid(fidRequest));
  }

  /**
   * Get direct children of a cast.
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<CastAddMessage[]>` | [`CastAddMessage`](../modules/types.md#castaddmessage)[] | A `HubAsyncResult` that contains the valid `CastAddMessage` array. |
   *
   * @param {CastId} parent - The parent cast id.
   * @param {number} parent.fid - The fid from which the cast originates from.
   * @param {string} parent.hash - The hash of the cast.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   *
   */
  async getCastsByParent(parent: types.CastId): HubAsyncResult<types.CastAddMessage[]> {
    const serializedCastId = utils.serializeCastId(parent);
    if (serializedCastId.isErr()) {
      return err(serializedCastId.error);
    }

    return wrapGrpcMessagesCall(this._grpcClient.getCastsByParent(serializedCastId.value));
  }

  /**
   * TODO DOCS: description
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<CastAddMessage[]>` | [`CastAddMessage`](../modules/types.md#castaddmessage)[] | A `HubAsyncResult` that contains the valid `CastAddMessage` array. |
   *
   * @param {number} mentionFid - The fid from which the cast originates from.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   *
   */
  async getCastsByMention(mentionFid: number): HubAsyncResult<types.CastAddMessage[]> {
    const fidRequest = protobufs.FidRequest.create({ fid: mentionFid });
    return wrapGrpcMessagesCall(this._grpcClient.getCastsByMention(fidRequest));
  }

  /**
   * TODO DOCS: description
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<CastAddMessage[]>` | [`CastAddMessage`](../modules/types.md#castaddmessage)[] | A `HubAsyncResult` that contains the valid `CastAddMessage` array. |
   *
   * @param {number} fid - The fid from which the cast originates from.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   */
  async getAllCastMessagesByFid(fid: number): HubAsyncResult<(types.CastAddMessage | types.CastRemoveMessage)[]> {
    const request = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getAllCastMessagesByFid(request));
  }

  /* -------------------------------------------------------------------------- */
  /*                               Reaction Methods                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Get reaction for a specific cast.
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<ReactionAddMessage>` | [`ReactionAddMessage`](../modules/types.md#reactionaddmessage) | A `HubAsyncResult` that contains the valid `ReactionAddMessage`. |
   *
   * @param {number} fid - The fid from which the cast originates from.
   * @param {ReactionType} type - The type of the reaction (like or recast).
   * @param {CastId} cast - The cast id.
   * @param {number} cast.fid - The fid from which the cast originates from.
   * @param {string} cast.hash - The hash of the cast.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   */
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

  /**
   * Get reactions from a specific fid.
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<ReactionAddMessage[]>` | [`ReactionAddMessage`](../modules/types.md#reactionaddmessage)[] | A `HubAsyncResult` that contains the valid `ReactionAddMessage` array. |
   *
   * @param {number} fid - The fid from which the cast originates from.
   * @param {ReactionType} type - The type of the reaction (like or recast).
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   */
  async getReactionsByFid(fid: number, type?: types.ReactionType): HubAsyncResult<types.ReactionAddMessage[]> {
    const request = protobufs.ReactionsByFidRequest.create({
      fid,
      reactionType: type ?? types.ReactionType.REACTION_TYPE_NONE,
    });
    return wrapGrpcMessagesCall(this._grpcClient.getReactionsByFid(request));
  }

  /**
   * TODO DOCS: description
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<ReactionAddMessage[]>` | [`ReactionAddMessage`](../modules/types.md#reactionaddmessage)[] | A `HubAsyncResult` that contains the valid `ReactionAddMessage` array. |
   *
   * @param {CastId} cast - The cast id.
   * @param {number} cast.fid - The fid from which the cast originates from.
   * @param {string} cast.hash - The hash of the cast.
   * @param {ReactionType} type - The type of the reaction (like or recast).
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   */
  async getReactionsByCast(cast: types.CastId, type?: types.ReactionType): HubAsyncResult<types.ReactionAddMessage[]> {
    const serializedCastId = utils.serializeCastId(cast);
    if (serializedCastId.isErr()) {
      return err(serializedCastId.error);
    }
    const request = protobufs.ReactionsByCastRequest.create({
      castId: serializedCastId.value,
      reactionType: type ?? types.ReactionType.REACTION_TYPE_NONE,
    });
    return wrapGrpcMessagesCall(this._grpcClient.getReactionsByCast(request));
  }

  /**
   * TODO DOCS: description
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<ReactionAddMessage[]>` | [`ReactionAddMessage`](../modules/types.md#reactionaddmessage)[] | A `HubAsyncResult` that contains the valid `ReactionAddMessage` array. |
   *
   * @param {number} fid - The fid from which the cast originates from.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   */
  async getAllReactionMessagesByFid(
    fid: number
  ): HubAsyncResult<(types.ReactionAddMessage | types.ReactionRemoveMessage)[]> {
    const request = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getAllReactionMessagesByFid(request));
  }

  /* -------------------------------------------------------------------------- */
  /*                             Verification Methods                           */
  /* -------------------------------------------------------------------------- */

  /**
   * Get verification for a specific address and fid.
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<VerificationAddEthAddressMessage>` | [`VerificationAddEthAddressMessage`](../modules/types.md#verificationaddethaddressmessage) | A `HubAsyncResult` that contains the valid `VerificationAddEthAddressMessage`. |
   *
   * @param {number} fid - The fid to verify.
   * @param {string} address - The custody address to verify.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   *
   */
  async getVerification(fid: number, address: string): HubAsyncResult<types.VerificationAddEthAddressMessage> {
    const serializedAddress = utils.serializeEthAddress(address);
    if (serializedAddress.isErr()) {
      return err(serializedAddress.error);
    }
    const request = protobufs.VerificationRequest.create({ fid, address: serializedAddress.value });
    return wrapGrpcMessageCall(this._grpcClient.getVerification(request));
  }

  /**
   * Get verifications for a specific fid.
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<VerificationAddEthAddressMessage[]>` | [`VerificationAddEthAddressMessage`](../modules/types.md#verificationaddethaddressmessage)[] | A `HubAsyncResult` that contains the valid `VerificationAddEthAddressMessage` array. |
   *
   * @param {number} fid - The fid to verify.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   */
  async getVerificationsByFid(fid: number): HubAsyncResult<types.VerificationAddEthAddressMessage[]> {
    const request = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getVerificationsByFid(request));
  }

  /**
   * Get all verifications for a specific address.
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<(VerificationAddEthAddressMessage | VerificationRemoveMessage)[]>` | [`VerificationAddEthAddressMessage`](../modules/types.md#verificationaddethaddressmessage)[] | A `HubAsyncResult` that contains the valid `VerificationAddEthAddressMessage` array. |
   *
   * @param {number} fid - The fid to get all verifications for.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   */
  async getAllVerificationMessagesByFid(
    fid: number
  ): HubAsyncResult<(types.VerificationAddEthAddressMessage | types.VerificationRemoveMessage)[]> {
    const request = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getAllVerificationMessagesByFid(request));
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Signer Methods                             */
  /* -------------------------------------------------------------------------- */

  /**
   * TODO DOCS: description
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<SignerAddMessage>` | [`SignerAddMessage`](../modules/types.md#signeraddmessage) | A `HubAsyncResult` that contains the valid `SignerAddMessage`. |
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   */
  async getSigner(fid: number, signer: string): HubAsyncResult<types.SignerAddMessage> {
    const serializedSigner = utils.serializeEd25519PublicKey(signer);
    if (serializedSigner.isErr()) {
      return err(serializedSigner.error);
    }
    const request = protobufs.SignerRequest.create({ fid, signer: serializedSigner.value });
    return wrapGrpcMessageCall(this._grpcClient.getSigner(request));
  }

  /**
   * Get signers of a fid.
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<SignerAddMessage[]>` | [`SignerAddMessage`](../modules/types.md#signeraddmessage)[] | A `HubAsyncResult` that contains the valid `SignerAddMessage` array. |
   *
   * @param {number} fid - The fid to get signers for.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   */
  async getSignersByFid(fid: number): HubAsyncResult<types.SignerAddMessage[]> {
    const request = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getSignersByFid(request));
  }

  /**
   * TODO DOCS: description
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<(SignerAddMessage | SignerRemoveMessage)[]>` | [`SignerAddMessage`](../modules/types.md#signeraddmessage)[] | A `HubAsyncResult` that contains the valid `SignerAddMessage` array. |
   *
   * @param {number} fid - The fid to get all signers for.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   */
  async getAllSignerMessagesByFid(fid: number): HubAsyncResult<(types.SignerAddMessage | types.SignerRemoveMessage)[]> {
    const request = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getAllSignerMessagesByFid(request));
  }

  /* -------------------------------------------------------------------------- */
  /*                                User Data Methods                           */
  /* -------------------------------------------------------------------------- */

  /**
   * Get user data (pfp, username, fname, etc).
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<UserDataAddMessage>` | [`UserDataAddMessage`](../modules/types.md#userdataaddmessage) | A `HubAsyncResult` that contains the valid `UserDataAddMessage`. |
   *
   * @param {number} fid - The fid to get user data for.
   * @param {UserDataType} type - The type of user data to get.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   */
  async getUserData(fid: number, type: types.UserDataType): HubAsyncResult<types.UserDataAddMessage> {
    const request = protobufs.UserDataRequest.create({ fid, userDataType: type });
    return wrapGrpcMessageCall(this._grpcClient.getUserData(request));
  }

  /**
   * Get user data (pfp, username, fname, etc) by fid.
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<UserDataAddMessage[]>` | [`UserDataAddMessage`](../modules/types.md#userdataaddmessage)[] | A `HubAsyncResult` that contains the valid `UserDataAddMessage` array. |
   *
   * @param {number} fid - The fid to get user data for.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   */
  async getUserDataByFid(fid: number): HubAsyncResult<types.UserDataAddMessage[]> {
    const request = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getUserDataByFid(request));
  }

  /**
   * TODO DOCS: description
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<(UserDataAddMessage | UserDataRemoveMessage)[]>` | [`UserDataAddMessage`](../modules/types.md#userdataaddmessage)[] | A `HubAsyncResult` that contains the valid `UserDataAddMessage` array. |
   *
   * @param {number} fid - The fid to get all user data for.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   */
  async getAllUserDataMessagesByFid(fid: number): HubAsyncResult<types.UserDataAddMessage[]> {
    const request = protobufs.FidRequest.create({ fid });
    return wrapGrpcMessagesCall(this._grpcClient.getAllUserDataMessagesByFid(request));
  }

  /* -------------------------------------------------------------------------- */
  /*                               Contract Methods                             */
  /* -------------------------------------------------------------------------- */

  /**
   * Get fid registry event for a specific fid.
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<IdRegistryEvent>` | [`IdRegistryEvent`](../modules/types.md#idregistryevent) | A `HubAsyncResult` that contains the valid `IdRegistryEvent`. |
   *
   * @param {number} fid - The fid to get registry event for.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   */
  async getIdRegistryEvent(fid: number): HubAsyncResult<types.IdRegistryEvent> {
    const request = protobufs.FidRequest.create({ fid });
    return deserializeCall(this._grpcClient.getIdRegistryEvent(request), utils.deserializeIdRegistryEvent);
  }

  /**
   * Get fname registry event for a specific fname.
   *
   * #### Returns
   *
   * | Value | Type | Description |
   * | :---- | :--- | :---------- |
   * | `HubAsyncResult<NameRegistryEvent>` | [`NameRegistryEvent`](../modules/types.md#nameregistryevent) | A `HubAsyncResult` that contains the valid `NameRegistryEvent`. |
   *
   * @param {string} fname - The fname to get registry event for.
   *
   * @example
   * ```typescript
   * // TODO DOCS: usage example
   * ```
   */
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

  /**
   * TODO DOCS: description
   *
   * Note: Data from this stream can be parsed using `deserializeHubEvent`.
   *
   * TODO DOCS: usage example, here's the structure:
   * @example
   * ```typescript
   * import { ... } from '@farcaster/js';
   *
   * const client = new Client(...)
   * const result = await client.get...
   * console.log(result)
   *
   * // Output: ...
   * ```
   *
   * @param ...
   *
   * @returns ...
   */
  async subscribe(filters: EventFilters = {}) {
    const request = protobufs.SubscribeRequest.create({ ...filters });
    return this._grpcClient.subscribe(request);
  }
}
