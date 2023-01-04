import * as flatbuffers from '@hub/flatbuffers';
import { blake3 } from '@noble/hashes/blake3';
import { EthereumSigner, generateEd25519KeyPair, generateEthereumSigner } from '~/utils/crypto';
import { EthersMessageSigner } from '../messageSigner';
import { KeyPair, SignerAddModel } from '../models/types';
import { bytesToHexString, hexStringToBytes, numberToBytes } from '../utils/bytes';
import { verifyMessageHashSignature } from '../utils/eip712';
import { SignerMessageBuilder } from './messageBuilder';

describe('SignerMessageBuilder', () => {
  let builder: SignerMessageBuilder;
  let ethereumSigner: EthereumSigner;
  let signer: EthersMessageSigner;

  const fid = 24;

  beforeAll(async () => {
    ethereumSigner = await generateEthereumSigner();
    signer = new EthersMessageSigner(ethereumSigner.wallet);
    builder = new SignerMessageBuilder({ fid, signer });
  });

  describe('instance methods', () => {
    describe('makeSignerAdd', () => {
      let newSigner: KeyPair;
      let message: SignerAddModel;
      let messageBody: flatbuffers.SignerBody;

      beforeAll(async () => {
        newSigner = await generateEd25519KeyPair();
        message = await builder.makeSignerAdd({
          publicKey: bytesToHexString(newSigner.publicKey)._unsafeUnwrap(),
        });
        messageBody = message.body();
      });

      test('generates signer', async () => {
        expect(message.signer()).toEqual(hexStringToBytes(ethereumSigner.wallet.address)._unsafeUnwrap());
      });

      test('generates hash', async () => {
        expect(message.hash()).toEqual(blake3(message.dataBytes(), { dkLen: 16 }));
      });

      test('generates hash scheme', async () => {
        expect(message.hashScheme()).toEqual(flatbuffers.HashScheme.Blake3);
      });

      test('generates signature', async () => {
        const recoveredAddress = verifyMessageHashSignature(message.hash(), message.signature());
        expect(recoveredAddress._unsafeUnwrap()).toEqual(
          hexStringToBytes(ethereumSigner.wallet.address)._unsafeUnwrap()
        );
      });

      test('generates signature scheme', async () => {
        expect(message.signatureScheme()).toEqual(flatbuffers.SignatureScheme.Eip712);
      });

      describe('data', () => {
        test('generates network', async () => {
          expect(message.data.network()).toEqual(flatbuffers.FarcasterNetwork.Mainnet);
        });

        test('generates fid', async () => {
          expect(message.data.fidArray()).toEqual(numberToBytes(fid)._unsafeUnwrap());
        });

        test('generates type', () => {
          expect(message.data.type()).toEqual(flatbuffers.MessageType.SignerAdd);
        });

        test('generates body type', () => {
          expect(message.data.bodyType()).toEqual(flatbuffers.MessageBody.SignerBody);
        });

        describe('body', () => {
          test('generates signer', () => {
            expect(messageBody.signerArray()).toEqual(newSigner.publicKey);
          });
        });
      });
    });
  });
});
