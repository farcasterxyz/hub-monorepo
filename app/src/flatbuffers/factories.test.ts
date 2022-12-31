import * as message_generated from '@hub/flatbuffers';
import { GossipAddressInfoT, GossipContent, GossipMessage } from '@hub/flatbuffers';
import { isPeerId } from '@libp2p/interface-peer-id';
import { peerIdFromBytes } from '@libp2p/peer-id';
import * as ed from '@noble/ed25519';
import { blake3 } from '@noble/hashes/blake3';
import { hexlify } from 'ethers/lib/utils';
import Factories from '~/flatbuffers/factories';
import { VerificationEthAddressClaim } from '~/flatbuffers/models/types';
import { verifyVerificationEthAddressClaimSignature } from '~/flatbuffers/utils/eip712';
import { toFarcasterTime } from '~/flatbuffers/utils/time';
import { GOSSIP_PROTOCOL_VERSION } from '~/network/p2p/protocol';

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
  let data: message_generated.MessageData;
  let message: message_generated.Message;

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
      message.hashArray() || new Uint8Array(),
      message.signerArray() || new Uint8Array()
    );
    expect(verifySignature).resolves.toEqual(true);
  });
});

describe('VerificationAddEthAddressBodyFactory', () => {
  let fid: Uint8Array;
  let network: message_generated.FarcasterNetwork;
  let body: message_generated.VerificationAddEthAddressBody;

  beforeAll(async () => {
    fid = Factories.FID.build();
    network = message_generated.FarcasterNetwork.Testnet;
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

describe('GossipMessageFactory', () => {
  let content: message_generated.Message;
  let message: GossipMessage;

  beforeAll(async () => {
    content = await Factories.Message.create();
    message = await Factories.GossipMessage.create({
      contentType: GossipContent.Message,
      content: content.unpack(),
    });
  });

  test('creates with arguments', () => {
    expect(message.unpack().content).toEqual(content.unpack());
  });

  test('creates a FC Message by default', async () => {
    const other = await Factories.GossipMessage.create();
    expect(other).toBeDefined();
    expect(other.contentType()).toEqual(GossipContent.Message);
    expect(other.unpack().content).not.toEqual(content.unpack());
  });

  test('defaults to the right version', async () => {
    expect(message.version()).toEqual(GOSSIP_PROTOCOL_VERSION);
  });
});

describe('AddressInfoFactory', () => {
  test('creates with arguments', async () => {
    const gossipAddress = await Factories.GossipAddressInfo.create({ address: '127.0.0.1', port: 1234, family: 4 });
    expect(gossipAddress.address()).toEqual('127.0.0.1');
    expect(gossipAddress.port()).toEqual(1234);
    expect(gossipAddress.family()).toEqual(4);
  });
});

describe('ContactInfoFactory', () => {
  let gossipAddress: GossipAddressInfoT;
  let rpcAddress: GossipAddressInfoT;

  beforeAll(() => {
    gossipAddress = Factories.GossipAddressInfo.build();
    rpcAddress = Factories.GossipAddressInfo.build();
  });

  test('creates with arguments', async () => {
    const contactInfo = await Factories.GossipContactInfoContent.create({ gossipAddress, rpcAddress });
    expect(contactInfo.rpcAddress()?.unpack()).toEqual(rpcAddress);
    expect(contactInfo.gossipAddress()?.unpack()).toEqual(gossipAddress);
  });

  test('generates a valid peerId', async () => {
    const contactInfo = await Factories.GossipContactInfoContent.create();
    const peerId = peerIdFromBytes(contactInfo.peerIdArray() || new Uint8Array());
    expect(peerId).toBeDefined();
    expect(isPeerId(peerId)).toBeTruthy();
  });
});
