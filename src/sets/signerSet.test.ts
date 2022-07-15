/* eslint-disable no-restricted-imports */
import SignerSet, { SignerAddition, SignatureAlgorithm, HashAlgorithm } from './signerSet';
import { blake2BHash } from '~/utils';

describe('create signer set', async () => {
  const hash = await blake2BHash('foobar');

  // generate parent key
  // generate child key

  const signerAddition = <SignerAddition>{
    message: {
      body: {
        parentKey: '',
        childKey: '',
        schema: '',
      },
      address: '',
    },
    envelope: {
      hash: hash,
      hashType: HashAlgorithm.Blake2b,
      parentSignature: '',
      parentSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
      parentSignerPubkey: '',
      childSignature: '',
      childSignatureType: SignatureAlgorithm.EcdsaSecp256k1,
      childSignerPubkey: '',
    },
  };

  const signerSet = new SignerSet(signerAddition);
  console.log(signerSet);
  test('fails with incorrect custody address public key', async () => {
    expect(true).toEqual(true); // placeholder assertion
  });
});

describe('add key', () => {
  test('fails when claimed parent is not actual parent of child', async () => {
    expect(true).toEqual(true);
  });

  test('fails when child is in removed nodes', async () => {
    expect(true).toEqual(true);
  });

  test('fails when child is an existing node', async () => {
    expect(true).toEqual(true);
  });
});

describe('remove key', () => {
  test('fails because claimed parent is not actual parent of child', async () => {
    expect(true).toEqual(true);
  });
});
