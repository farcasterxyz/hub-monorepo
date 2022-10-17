import { Result } from 'neverthrow';
import { Cast, Follow, IdRegistryEvent, Message, Reaction, SignerMessage, Verification } from '~/types';
import { FarcasterError } from '~/utils/errors';
import { NodeMetadata } from '~/network/sync/merkleTrie';

export type Port = number;

export enum RPCRequest {
  GetUsers = 'getUsers',
  GetAllCastsByUser = 'getAllCastsByUser',
  GetAllSignerMessagesByUser = 'getAllSignerMessagesByUser',
  GetAllReactionsByUser = 'getAllReactionsByUser',
  GetAllFollowsByUser = 'getAllFollowsByUser',
  GetAllVerificationsByUser = 'getAllVerificationsByUser',
  GetCustodyEventByUser = 'getCustodyEventByUser',
  GetSyncMetadataByPrefix = 'getSyncMetadataByPrefix',
  GetSyncIdsByPrefix = 'getSyncIdsByPrefix',
  GetMessagesByHashes = 'getMessagesByHashes',
  SubmitMessage = 'submitMessage',
  SubmitIdRegistryEvent = 'submitIdRegistryEvent',
}

export interface RPCHandler {
  getUsers(): Promise<Set<number>>;
  getAllCastsByUser(fid: number): Promise<Set<Cast>>;
  getAllSignerMessagesByUser(fid: number): Promise<Set<SignerMessage>>;
  getAllReactionsByUser(fid: number): Promise<Set<Reaction>>;
  getAllFollowsByUser(fid: number): Promise<Set<Follow>>;
  getAllVerificationsByUser(fid: number): Promise<Set<Verification>>;
  getCustodyEventByUser(fid: number): Promise<Result<IdRegistryEvent, FarcasterError>>;
  getSyncMetadataByPrefix(prefix: string): Promise<Result<NodeMetadata, FarcasterError>>;
  getSyncIdsByPrefix(prefix: string): Promise<Result<string[], FarcasterError>>;
  getMessagesByHashes(hashes: string[]): Promise<Message[]>;
  submitMessage(message: Message): Promise<Result<void, FarcasterError>>;
  submitIdRegistryEvent?(event: IdRegistryEvent): Promise<Result<void, FarcasterError>>;
}

export const replacer = (_key: any, value: any) => {
  // convert all sets to arrays
  if (value instanceof Set) {
    return { $class: 'Set', $asArray: Array.from(value) };
  }
  // convert all maps to objects
  if (value instanceof Map) {
    return { $class: 'Map', $asObject: Object.fromEntries(value) };
  }
  return value;
};

export const reviver = (_key: any, value: any) => {
  if (value && value.$class === 'Set') {
    return new Set(value.$asArray);
  }
  if (value && value.$class === 'Map') {
    return new Map(Object.entries(value.$asObject));
  }
  return value;
};
