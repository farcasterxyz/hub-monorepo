---
'@farcaster/core': minor
---

Used viem to verify Ethereum signatures

- Added `signUserNameProofClaim` to `Eip712Signer`
- Added `makeUserNameProofClaim`

- Breaking API changes
  - make\*Data functions are now async
  - removed top-level getSignerKey, signVerificationEthAddressClaim, and signMessageHash, use an Eip712Signer class (i.e. EthersEip712Signer or ViemLocalEip712Signer)
  - rename `verifyUserNameProof` to `verifyUserNameProofClaim`
