import { FarcasterNetwork } from '@farcaster/protobufs';
import { blake3 } from '@noble/hashes/blake3';
import { randomBytes } from 'crypto';
import { Wallet } from 'ethers';
import { createWalletClient, custom, LocalAccount } from 'viem';
import { getAccount } from 'viem/ethers';
import { bytesToHexString } from '../bytes';
import { eip712 } from '../crypto';
import { Factories } from '../factories';
import { VerificationEthAddressClaim, makeVerificationEthAddressClaim } from '../verifications';
import { ViemEip712Signer } from './viemEip712Signer';

const accounts = [
  {
    address: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    balance: 10000000000000000000000n,
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  },
];

const parseTypedDataParams = (params: any) => {
  const [, params_] = params;
  return JSON.parse(params_);
};

describe('ViemEip712Signer', () => {
  let signer: ViemEip712Signer;
  let signerKey: Uint8Array;
  let ethersSigner;

  beforeAll(async () => {
    const localAccount = getAccount(new Wallet(accounts[0].privateKey)) as LocalAccount;
    ethersSigner = createWalletClient({
      transport: custom({
        request: async ({ method, params }: any) => {
          switch (method) {
            case 'eth_accounts':
              return [localAccount.address];
            case 'eth_signTypedData_v4':
              return localAccount.signTypedData(parseTypedDataParams(params));
            default:
              throw Error(`No stubbed response for RPC method: ${method}`);
          }
        },
      }),
    });

    signer = new ViemEip712Signer(ethersSigner);
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
