import * as flatbuffers from '@hub/flatbuffers';
import { blake3 } from '@noble/hashes/blake3';
import * as ed25519 from './crypto/ed25519';
import { verifyVerificationEthAddressClaimSignature } from './crypto/eip712';
import { Factories } from './factories';
import { toFarcasterTime } from './time';
import { makeVerificationEthAddressClaim } from './verifications';

describe('UserIdFactory', () => {
  test('accepts fid', async () => {
    const id = await Factories.UserId.create({ fid: [1] });
    expect(id.fidArray()).toEqual(new Uint8Array([1]));
  });
});

describe('FidFactory', () => {
  test('generates 4 byte value', () => {
    const fid = Factories.FID.build();
    expect(fid.byteLength).toBeLessThan(32);
  });

  test('accepts number as input', async () => {
    const fid = Factories.FID.build({}, { transient: { fid: 24 } });
    expect(fid.byteLength).toBeLessThan(32);
    expect(Buffer.from(fid).readUIntLE(0, fid.length)).toBe(24);
  });
});

describe('TsHashFactory', () => {
  test('generates 20 byte value', () => {
    const tsHash = Factories.TsHash.build();
    expect(tsHash.byteLength).toEqual(20);
  });

  test('accepts timestamp', () => {
    const tsHash = Factories.TsHash.build({}, { transient: { timestamp: toFarcasterTime(Date.now()) } });
    expect(tsHash.byteLength).toEqual(20);
  });
});

describe('CastAddBodyFactory', () => {
  test('accepts text', async () => {
    const body = await Factories.CastAddBody.create({ text: 'foo' });
    expect(body.text()).toEqual('foo');
  });
});

describe('MessageFactory', () => {
  let data: flatbuffers.MessageData;
  let message: flatbuffers.Message;

  beforeAll(async () => {
    data = await Factories.MessageData.create();
    message = await Factories.Message.create({ data: Array.from(data.bb?.bytes() || new Uint8Array()) });
  });

  test('accepts data', async () => {
    expect(message.dataArray()).toEqual(data.bb?.bytes());
  });

  test('generates hash', async () => {
    expect(message.hashArray()).toEqual(blake3(data.bb?.bytes() || new Uint8Array(), { dkLen: 16 }));
  });

  test('generates signature', async () => {
    const verifySignature = await ed25519.verifyMessageHashSignature(
      message.signatureArray() || new Uint8Array(),
      message.hashArray() || new Uint8Array(),
      message.signerArray() || new Uint8Array()
    );
    expect(verifySignature._unsafeUnwrap()).toEqual(true);
  });
});

describe('VerificationAddEthAddressBodyFactory', () => {
  let fid: Uint8Array;
  let network: flatbuffers.FarcasterNetwork;
  let body: flatbuffers.VerificationAddEthAddressBody;

  beforeAll(async () => {
    fid = Factories.FID.build();
    network = flatbuffers.FarcasterNetwork.Testnet;
    body = await Factories.VerificationAddEthAddressBody.create({}, { transient: { fid, network } });
  });

  test('generates valid ethSignature', async () => {
    const signature = body.ethSignatureArray();
    expect(signature).toBeTruthy();
    const reconstructedClaim = makeVerificationEthAddressClaim(
      fid,
      body.addressArray() ?? new Uint8Array(),
      network,
      body.blockHashArray() ?? new Uint8Array()
    );
    const verifiedAddress = await verifyVerificationEthAddressClaimSignature(
      reconstructedClaim._unsafeUnwrap(),
      signature ?? new Uint8Array()
    );
    expect(verifiedAddress._unsafeUnwrap()).toEqual(body.addressArray());
  });
});

describe('BytesFactory', () => {
  describe('with length', () => {
    test('succeeds with unpadded little endian', () => {
      const bytes = Factories.Bytes.build({}, { transient: { length: 32 } });
      expect(bytes[bytes.length - 1]).not.toEqual(0);
    });
  });
});
