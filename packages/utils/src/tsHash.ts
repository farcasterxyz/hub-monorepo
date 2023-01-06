/** Generate tsHash from timestamp and hash */
export const toTsHash = (timestamp: number, hash: Uint8Array): Uint8Array => {
  const buffer = new ArrayBuffer(4 + hash.length);
  const view = new DataView(buffer);
  view.setUint32(0, timestamp, false); // Stores timestamp as big-endian in first 4 bytes
  const bytes = new Uint8Array(buffer);
  bytes.set(hash, 4);
  return bytes;
};
