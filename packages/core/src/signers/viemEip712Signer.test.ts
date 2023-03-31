import { FarcasterNetwork } from '@farcaster/protobufs';
import { blake3 } from '@noble/hashes/blake3';
import { randomBytes } from 'crypto';
import { Wallet } from 'ethers';
import { createWalletClient, custom, LocalAccount, WalletClient } from 'viem';
import { getAccount } from 'viem/ethers';
import { bytesToHexString } from '../bytes';
import { eip712 } from '../crypto';
import { Factories } from '../factories';
import { VerificationEthAddressClaim, makeVerificationEthAddressClaim } from '../verifications';
import { ViemEip712Signer } from './viemEip712Signer';

const parseTypedDataJSON = (params: any) => {
  const [, jsonData] = params;
  const typedData = JSON.parse(jsonData);
  if (typedData['primaryType'] === 'MessageData') {
    const hashStringObj = typedData['message']['hash'];
    typedData['message']['hash'] = new Uint8Array(Object.values(hashStringObj));
  }
  return typedData;
};

describe('ViemEip712Signer', () => {
  const localAccount = getAccount(Wallet.createRandom()) as LocalAccount;
  let signer: ViemEip712Signer;
  let signerKey: Uint8Array;
  let walletClient: WalletClient;

  beforeAll(async () => {
    walletClient = createWalletClient({
      transport: custom({
        // Mock RPC server responses
        request: async ({ method, params }: any) => {
          switch (method) {
            case 'eth_accounts':
              return [localAccount.address];
            case 'eth_signTypedData_v4':
              return localAccount.signTypedData(parseTypedDataJSON(params));
            default:
              throw Error(`No stubbed response for RPC method: ${method}`);
          }
        },
      }),
    });

    signer = new ViemEip712Signer(walletClient);
    signerKey = (await signer.getSignerKey())._unsafeUnwrap();
  });

  describe('instanceMethods', () => {
    describe('signMessageHash', () => {
      test('generates valid signature', async () => {
        const bytes = randomBytes(32);
        const hash = blake3(bytes, { dkLen: 20 });
        const signature = (await signer.signMessageHash(hash))._unsafeUnwrap();
        const recoveredAddress = (await eip712.verifyMessageHashSignature(hash, signature))._unsafeUnwrap();
        expect(recoveredAddress).toEqual(signerKey);
      });
    });

    describe('signVerificationEthAddressClaim', () => {
      let claim: VerificationEthAddressClaim;
      let signature: Uint8Array;

      beforeAll(async () => {
        claim = makeVerificationEthAddressClaim(
          Factories.Fid.build(),
          signerKey,
          FarcasterNetwork.TESTNET,
          Factories.BlockHash.build()
        )._unsafeUnwrap();
        signature = (await signer.signVerificationEthAddressClaim(claim))._unsafeUnwrap();
      });

      test('succeeds', async () => {
        expect(signature).toBeTruthy();
        const recoveredAddress = eip712.verifyVerificationEthAddressClaimSignature(claim, signature)._unsafeUnwrap();
        expect(recoveredAddress).toEqual(signerKey);
      });

      test('succeeds when encoding twice', async () => {
        const claim2: VerificationEthAddressClaim = { ...claim };
        const signature2 = (await signer.signVerificationEthAddressClaim(claim2))._unsafeUnwrap();
        expect(signature2).toEqual(signature);
        expect(bytesToHexString(signature2)).toEqual(bytesToHexString(signature));
      });
    });
  });
});
