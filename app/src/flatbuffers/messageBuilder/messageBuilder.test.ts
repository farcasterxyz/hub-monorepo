import * as flatbuffers from '@hub/flatbuffers';
import { Ed25519Signer, eip712, Factories, numberToBytes } from '@hub/utils';
import { blake3 } from '@noble/hashes/blake3';
import { SignerAddModel } from '../models/types';
import { SignerMessageBuilder } from './messageBuilder';

describe('SignerMessageBuilder', () => {
  const fid = 24;
  const signer = Factories.Eip712Signer.build();
  const builder = new SignerMessageBuilder({ fid, privateKey: signer.privateKey });

  describe('instance methods', () => {
    describe('makeSignerAdd', () => {
      let newSigner: Ed25519Signer;
      let message: SignerAddModel;
      let messageBody: flatbuffers.SignerBody;

      beforeAll(async () => {
        newSigner = Factories.Ed25519Signer.build();
        message = await builder.makeSignerAdd({
          publicKey: newSigner.signerKeyHex,
        });
        messageBody = message.body();
      });

      test('generates signer', async () => {
        expect(message.signer()).toEqual(signer.signerKey);
      });

      test('generates hash', async () => {
        expect(message.hash()).toEqual(blake3(message.dataBytes(), { dkLen: 16 }));
      });

      test('generates hash scheme', async () => {
        expect(message.hashScheme()).toEqual(flatbuffers.HashScheme.Blake3);
      });

      test('generates signature', async () => {
        const recoveredAddress = eip712.verifyMessageHashSignature(message.hash(), message.signature());
        expect(recoveredAddress._unsafeUnwrap()).toEqual(signer.signerKey);
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
            expect(messageBody.signerArray()).toEqual(newSigner.signerKey);
          });
        });
      });
    });
  });
});
