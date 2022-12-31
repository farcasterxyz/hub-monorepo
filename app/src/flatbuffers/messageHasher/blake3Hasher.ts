import { HashScheme } from '@hub/flatbuffers';
import { blake3 } from '@noble/hashes/blake3';
import { IMessageHasher } from './types';

class Blake3Hasher implements IMessageHasher {
  public scheme = HashScheme.Blake3;

  public async hash(bytes: Uint8Array): Promise<Uint8Array> {
    return blake3(bytes, { dkLen: 16 });
  }
}

export default Blake3Hasher;
