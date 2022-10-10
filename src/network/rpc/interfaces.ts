import { Result } from 'neverthrow';
import { Cast, Follow, IDRegistryEvent, Message, Reaction, SignerMessage, Verification } from '~/types';
import { FarcasterError } from '~/utils/errors';

export type Port = number;

export enum RPCRequest {
  GetUsers = 'getUsers',
  GetAllCastsByUser = 'getAllCastsByUser',
  GetAllSignerMessagesByUser = 'getAllSignerMessagesByUser',
  GetAllReactionsByUser = 'getAllReactionsByUser',
  GetAllFollowsByUser = 'getAllFollowsByUser',
  GetAllVerificationsByUser = 'getAllVerificationsByUser',
  GetCustodyEventByUser = 'getCustodyEventByUser',
  SubmitMessage = 'submitMessage',
  SubmitIDRegistryEvent = 'submitIDRegistryEvent',
}

export interface RPCHandler {
  getUsers(): Promise<Set<number>>;
  getAllCastsByUser(fid: number): Promise<Set<Cast>>;
  getAllSignerMessagesByUser(fid: number): Promise<Set<SignerMessage>>;
  getAllReactionsByUser(fid: number): Promise<Set<Reaction>>;
  getAllFollowsByUser(fid: number): Promise<Set<Follow>>;
  getAllVerificationsByUser(fid: number): Promise<Set<Verification>>;
  getCustodyEventByUser(fid: number): Promise<Result<IDRegistryEvent, FarcasterError>>;
  submitMessage(message: Message): Promise<Result<void, FarcasterError>>;
  submitIDRegistryEvent?(event: IDRegistryEvent): Promise<Result<void, FarcasterError>>;
}

export const replacer = (_key: any, value: any) => {
  // convert all sets to arrays
  if (value instanceof Set) {
    return { $class: 'Set', $asArray: Array.from(value) };
  }
  return value;
};

export const reviver = (_key: any, value: any) => {
  if (value && value.$class === 'Set') {
    return new Set(value.$asArray);
  }
  return value;
};
