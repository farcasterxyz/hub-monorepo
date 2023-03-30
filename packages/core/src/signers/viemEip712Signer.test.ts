import { FarcasterNetwork } from '@farcaster/protobufs';
import { blake3 } from '@noble/hashes/blake3';
import { createWalletClient, custom } from 'viem';
// import { rpc } from 'viem/utils';
import { randomBytes } from 'ethers';
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

describe('ViemEip712Signer', () => {
  let signer: ViemEip712Signer;
  let signerKey: Uint8Array;
  let ethersSigner;

  beforeAll(async () => {
    ethersSigner = createWalletClient({
      transport: custom({
        on: (message: string, listener: (...args: any[]) => null) => {
          if (message === 'accountsChanged') {
            listener([accounts[0].address] as any);
          }
        },
        removeListener: () => null,
        request: async ({ method, _params }: any) => {
          if (method === 'eth_accounts') {
            return [accounts[0].address];
          }
          if (method === 'eth_signTypedData_v4') {
            method = 'eth_signTypedData_v4';
            // TODO(michael): Stub this rpc request
            // params = [params[1], params[0]];
          }
          // const { result } = await rpc.http('http://127.0.0.1:8545', {
          //   body: {
          //     method,
          //     params,
          //   },
          // });
          // return result;
        },
      }),
    });

    signer = new ViemEip712Signer(ethersSigner);
    signerKey = (await signer.getSignerKey())._unsafeUnwrap({ withStackTrace: true });
  });

  describe('instanceMethods', () => {
    describe('signMessageHash', () => {
      test('generates valid signature', async () => {
        const bytes = randomBytes(32);
        const hash = blake3(bytes, { dkLen: 20 });
        const signature = (await signer.signMessageHash(hash))._unsafeUnwrap({ withStackTrace: true });
        const recoveredAddress = (await eip712.verifyMessageHashSignature(hash, signature))._unsafeUnwrap({
          withStackTrace: true,
        });
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
