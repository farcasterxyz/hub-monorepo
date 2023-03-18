---
'@farcaster/hub-nodejs': patch
'@farcaster/utils': patch
---

refactor: change `Eip712Signer.fromSigner` signature

Simplify creation of Eip712Signer by removing the need to pass
a signer key and instead deriving the it from the ethers signer.

This requires the function to be async.
