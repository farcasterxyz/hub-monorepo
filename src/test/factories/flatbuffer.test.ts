import { blake3 } from '@noble/hashes/blake3';
import Factories from '~/test/factories/flatbuffer';
import { FarcasterNetwork, Message, MessageData } from '~/utils/generated/message_generated';
import * as ed from '@noble/ed25519';
import { VerificationAddEthAddressBody } from '~/utils/generated/farcaster/verification-add-eth-address-body';
import { verifyVerificationEthAddressClaimSignature } from '~/utils/eip712';
import { VerificationEthAddressClaim } from '~/storage/flatbuffers/types';
import { hexlify } from 'ethers/lib/utils';
import { toFarcasterTime } from '~/storage/flatbuffers/utils';

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
  let data: MessageData;
  let message: Message;

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
    const verifySignature = ed.verify(
      message.signatureArray() || new Uint8Array(),
      data.bb?.bytes() || new Uint8Array(),
      message.signerArray() || new Uint8Array()
    );
    expect(verifySignature).resolves.toEqual(true);
  });
});

describe('VerificationAddEthAddressBodyFactory', () => {
  let fid: Uint8Array;
  let network: FarcasterNetwork;
  let body: VerificationAddEthAddressBody;

  beforeAll(async () => {
    fid = Factories.FID.build();
    network = FarcasterNetwork.Testnet;
    body = await Factories.VerificationAddEthAddressBody.create({}, { transient: { fid, network } });
  });

  test('generates valid ethSignature', async () => {
    const signature = body.ethSignatureArray();
    expect(signature).toBeTruthy();
    const reconstructedClaim: VerificationEthAddressClaim = {
      fid,
      address: hexlify(body.addressArray() ?? new Uint8Array()),
      network,
      blockHash: body.blockHashArray() ?? new Uint8Array(),
    };
    const verifiedAddress = await verifyVerificationEthAddressClaimSignature(
      reconstructedClaim,
      signature ?? new Uint8Array()
    );
    expect(verifiedAddress).toEqual(body.addressArray());
  });
});
