import jayson, { JSONRPCError } from 'jayson/promise';
import { AddressInfo } from 'net';
import { Err, Ok, Result } from 'neverthrow';
import { NodeMetadata } from '~/network/sync/merkleTrie';
import { Cast, Follow, IdRegistryEvent, Message, Reaction, Verification } from '~/types';
import { isIdRegistryEvent } from '~/types/typeguards';
import { ipMultiAddrStrFromAddressInfo } from '~/utils/p2p';
import { replacer, reviver, RPCRequest } from './interfaces';

export class RPCClient {
  private _tcpClient!: jayson.client;
  private _serverMultiAddr: string;

  constructor(address: AddressInfo) {
    if (address.family != 'IPv6' && address.family != 'IPv4') throw `Invalid Address Family: ${address.family}`;
    this._tcpClient = jayson.Client.tcp({
      port: address.port,
      host: address.address,
      family: address.family === 'IPv4' ? 4 : 6,
      replacer,
      reviver,
    });
    const multiAddrResult = ipMultiAddrStrFromAddressInfo(address);

    // TODO: fix up because constructors ideally do not throw.
    if (multiAddrResult.isErr()) throw multiAddrResult.error;
    this._serverMultiAddr = `${multiAddrResult.value}/tcp/${address.port}`;
  }

  /** Returns a multiaddr of the RPC server this client is connected to */
  get serverMultiaddr() {
    return this._serverMultiAddr;
  }

  async getUsers(): Promise<Result<Set<number>, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetUsers, {});
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async getAllCastsByUser(fid: number): Promise<Result<Set<Cast>, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetAllCastsByUser, { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async getAllSignerMessagesByUser(fid: number): Promise<Result<Set<Message>, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetAllSignerMessagesByUser, { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async getAllReactionsByUser(fid: number): Promise<Result<Set<Reaction>, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetAllReactionsByUser, { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }
  async getAllFollowsByUser(fid: number): Promise<Result<Set<Follow>, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetAllFollowsByUser, { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }
  async getAllVerificationsByUser(fid: number): Promise<Result<Set<Verification>, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetAllVerificationsByUser, { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async getCustodyEventByUser(fid: number): Promise<Result<IdRegistryEvent, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetCustodyEventByUser, { fid });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async submitMessage(message: Message): Promise<Result<void, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.SubmitMessage, { message });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(undefined);
  }

  async submitIdRegistryEvent(event: IdRegistryEvent): Promise<Result<void, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.SubmitIdRegistryEvent, { event });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(undefined);
  }

  async submitMessages(messages: Message[] | IdRegistryEvent[]): Promise<Result<void, JSONRPCError>[]> {
    const requests = messages.map((m) => {
      if (isIdRegistryEvent(m)) {
        return this._tcpClient.request(RPCRequest.SubmitIdRegistryEvent, { event: m }, undefined, false);
      }
      return this._tcpClient.request(RPCRequest.SubmitMessage, { message: m }, undefined, false);
    });
    const responses = await this._tcpClient.request(requests);
    const results = responses.map((response: any) => {
      if (response.error) {
        return new Err(response.error);
      }
      return new Ok(undefined);
    });
    return results;
  }

  async getSyncMetadataByPrefix(prefix: string): Promise<Result<NodeMetadata, JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetSyncMetadataByPrefix, { prefix });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async getSyncIdsByPrefix(prefix: string): Promise<Result<string[], JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetSyncIdsByPrefix, { prefix });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }

  async getMessagesByHashes(hashes: string[]): Promise<Result<Message[], JSONRPCError>> {
    const response = await this._tcpClient.request(RPCRequest.GetMessagesByHashes, { hashes });
    if (response.error) {
      return new Err(response.error);
    }
    return new Ok(response.result);
  }
}
