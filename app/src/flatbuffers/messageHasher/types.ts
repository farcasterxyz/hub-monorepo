import { HashScheme } from '@hub/flatbuffers';

export interface IMessageHasher {
  scheme: HashScheme;
  hash(data: Uint8Array): Promise<Uint8Array>;
}
