import { blake2b } from 'ethereum-cryptography/blake2b';
import Factories from '~/test/factories/flatbuffer';
import { FarcasterNetwork, Message, MessageData } from '~/utils/generated/message_generated';
import * as ed from '@noble/ed25519';
import { VerificationAddEthAddressBody } from '~/utils/generated/farcaster/verification-add-eth-address-body';
import { verifyVerificationEthAddressClaimSignature } from '~/utils/verification';
import { VerificationEthAddressClaim } from '~/storage/flatbuffers/types';
import { hexlify } from 'ethers/lib/utils';

describe('UserIDFactory', () => {
  test('accepts fid', async () => {
    const id = await Factories.UserID.create({ fid: [1] });
    expect(id.fidArray()).toEqual(new Uint8Array([1]));
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
    expect(message.hashArray()).toEqual(blake2b(data.bb?.bytes() || new Uint8Array(), 4));
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
